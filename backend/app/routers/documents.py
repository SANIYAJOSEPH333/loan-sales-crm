import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_active_user, require_admin
from app.models import (
    User, Employee, Lead, CustomerDocument, UserRole,
    DocumentType, VerificationStatus, LeadStatus
)
from app.schemas import DocumentResponse, DocumentVerifyRequest
from app.utils.helpers import log_activity, create_notification

router = APIRouter(prefix="/documents", tags=["Document Management"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"}
MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    lead_id: Optional[int] = None,
    verification_status: Optional[str] = None,
    document_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(CustomerDocument).join(Lead)

    # Security check: If staff, only return documents for assigned leads
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(Lead.assigned_employee_id == emp.id)

    if lead_id:
        query = query.filter(CustomerDocument.lead_id == lead_id)
    if verification_status:
        query = query.filter(CustomerDocument.verification_status == verification_status)
    if document_type:
        query = query.filter(CustomerDocument.document_type == document_type)

    docs = query.order_by(desc(CustomerDocument.uploaded_at)).all()

    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "lead_id": d.lead_id,
            "customer_name": d.lead.full_name if d.lead else "Unknown",
            "document_type": d.document_type,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "verification_status": d.verification_status,
            "rejection_remarks": d.rejection_remarks,
            "uploaded_at": d.uploaded_at,
            "verified_at": d.verified_at,
            "uploaded_by_name": d.uploaded_by.email if d.uploaded_by else "Staff",
            "verified_by_name": d.verified_by.email if d.verified_by else None
        })

    return result

@router.post("/upload")
async def upload_document(
    lead_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Staff access check
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or lead.assigned_employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Cannot upload documents for this lead")

    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Read and check size
    contents = await file.read()
    file_size = len(contents)
    if file_size > MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB")

    # Save securely with unique filename
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    doc_type_enum = DocumentType(document_type) if document_type in [e.value for e in DocumentType] else DocumentType.OTHER

    doc = CustomerDocument(
        lead_id=lead.id,
        document_type=doc_type_enum,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        verification_status=VerificationStatus.PENDING,
        uploaded_by_id=current_user.id,
        uploaded_at=datetime.utcnow()
    )
    db.add(doc)

    # If lead had pending docs, keep or update lead status
    if lead.lead_status == LeadStatus.INTERESTED:
        lead.lead_status = LeadStatus.DOCUMENTS_PENDING

    db.commit()
    db.refresh(doc)

    log_activity(db, current_user.id, "UPLOAD_DOCUMENT", "Lead", lead.id, f"Uploaded {doc.document_type.value} for {lead.full_name}")

    return {
        "message": "Document uploaded successfully",
        "id": doc.id,
        "file_name": doc.file_name,
        "verification_status": doc.verification_status
    }

@router.get("/{id}/download")
def download_document(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(CustomerDocument).filter(CustomerDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Security check
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or doc.lead.assigned_employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Permission denied")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server storage")

    return FileResponse(
        path=doc.file_path,
        filename=doc.file_name,
        media_type=doc.mime_type or "application/octet-stream"
    )

@router.patch("/{id}/verify")
def verify_or_reject_document(
    id: int,
    data: DocumentVerifyRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)  # ONLY Admin can verify/reject
):
    doc = db.query(CustomerDocument).filter(CustomerDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if data.verification_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    doc.verification_status = data.verification_status
    doc.verified_by_id = admin.id
    doc.verified_at = datetime.utcnow()

    if data.verification_status == VerificationStatus.REJECTED:
        if not data.rejection_remarks:
            raise HTTPException(status_code=400, detail="Rejection remarks are required when rejecting a document")
        doc.rejection_remarks = data.rejection_remarks

        # Notify assigned staff member
        if doc.lead and doc.lead.assigned_employee:
            create_notification(
                db=db,
                user_id=doc.lead.assigned_employee.user_id,
                title="Document Rejected",
                message=f"Document {doc.document_type.value} for {doc.lead.full_name} was rejected: {data.rejection_remarks}",
                notification_type="WARNING",
                link_url=f"/staff/documents"
            )
    else:
        doc.rejection_remarks = None
        # Notify staff of verification
        if doc.lead and doc.lead.assigned_employee:
            create_notification(
                db=db,
                user_id=doc.lead.assigned_employee.user_id,
                title="Document Verified",
                message=f"Document {doc.document_type.value} for {doc.lead.full_name} has been verified by Admin.",
                notification_type="SUCCESS",
                link_url=f"/staff/documents"
            )

    db.commit()
    log_activity(db, admin.id, "VERIFY_DOCUMENT", "CustomerDocument", doc.id, f"Marked {doc.file_name} as {data.verification_status.value}")

    return {
        "message": f"Document marked as {data.verification_status.value}",
        "id": doc.id,
        "verification_status": doc.verification_status
    }
