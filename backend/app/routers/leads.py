from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import get_current_active_user, require_admin, get_current_employee
from app.models import (
    User, Employee, Lead, LeadAssignmentHistory, CallLog, FollowUp,
    CustomerDocument, LoanApplication, UserRole, LeadStatus, LoanType
)
from app.schemas import (
    LeadCreate, LeadUpdate, LeadResponse, LeadAssignmentHistoryResponse
)
from app.utils.helpers import log_activity

router = APIRouter(prefix="/leads", tags=["Lead Management"])

@router.get("", response_model=List[LeadResponse])
def get_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    loan_type: Optional[str] = None,
    lead_source: Optional[str] = None,
    employee_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Lead)

    # Security check: If staff, ONLY return leads assigned to this employee
    if current_user.role == UserRole.STAFF:
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee:
            return []
        query = query.filter(Lead.assigned_employee_id == employee.id)
    elif employee_id is not None:
        query = query.filter(Lead.assigned_employee_id == employee_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.full_name.ilike(s),
                Lead.phone_number.ilike(s),
                Lead.email.ilike(s),
                Lead.customer_code.ilike(s),
                Lead.city.ilike(s)
            )
        )

    if status:
        query = query.filter(Lead.lead_status == status)

    if loan_type:
        query = query.filter(Lead.loan_type == loan_type)

    if lead_source:
        query = query.filter(Lead.lead_source == lead_source)

    leads = query.order_by(desc(Lead.created_at)).offset(skip).limit(limit).all()

    result = []
    for l in leads:
        emp_name = l.assigned_employee.full_name if l.assigned_employee else None
        result.append({
            "id": l.id,
            "customer_code": l.customer_code,
            "full_name": l.full_name,
            "phone_number": l.phone_number,
            "email": l.email,
            "address": l.address,
            "city": l.city,
            "employment_type": l.employment_type,
            "monthly_income": l.monthly_income,
            "required_loan_amount": l.required_loan_amount,
            "loan_type": l.loan_type,
            "lead_source": l.lead_source,
            "lead_status": l.lead_status,
            "assigned_employee_id": l.assigned_employee_id,
            "assigned_employee_name": emp_name,
            "created_at": l.created_at,
            "updated_at": l.updated_at
        })

    return result

@router.post("", response_model=LeadResponse)
def create_lead(
    data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Generate customer code
    count = db.query(func.count(Lead.id)).scalar() or 0
    code = f"CUST{count + 1:05d}"

    # If assigned employee provided, verify exists
    if data.assigned_employee_id:
        emp = db.query(Employee).filter(Employee.id == data.assigned_employee_id).first()
        if not emp:
            raise HTTPException(status_code=400, detail="Assigned employee does not exist")

    lead = Lead(
        customer_code=code,
        full_name=data.full_name,
        phone_number=data.phone_number,
        email=data.email,
        address=data.address,
        city=data.city,
        employment_type=data.employment_type or "SALARIED",
        monthly_income=data.monthly_income or 0.0,
        required_loan_amount=data.required_loan_amount or 0.0,
        loan_type=data.loan_type or "PERSONAL_LOAN",
        lead_source=data.lead_source or "WEBSITE",
        lead_status=LeadStatus.ASSIGNED if data.assigned_employee_id else (data.lead_status or LeadStatus.NEW),
        assigned_employee_id=data.assigned_employee_id
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # If assigned immediately, add to assignment history
    if lead.assigned_employee_id:
        history = LeadAssignmentHistory(
            lead_id=lead.id,
            assigned_to_employee_id=lead.assigned_employee_id,
            assigned_by_user_id=current_user.id,
            notes="Initial assignment on lead creation"
        )
        db.add(history)
        db.commit()

    log_activity(db, current_user.id, "CREATE_LEAD", "Lead", lead.id, f"Created customer {lead.full_name} ({lead.customer_code})")

    return {
        "id": lead.id,
        "customer_code": lead.customer_code,
        "full_name": lead.full_name,
        "phone_number": lead.phone_number,
        "email": lead.email,
        "address": lead.address,
        "city": lead.city,
        "employment_type": lead.employment_type,
        "monthly_income": lead.monthly_income,
        "required_loan_amount": lead.required_loan_amount,
        "loan_type": lead.loan_type,
        "lead_source": lead.lead_source,
        "lead_status": lead.lead_status,
        "assigned_employee_id": lead.assigned_employee_id,
        "assigned_employee_name": lead.assigned_employee.full_name if lead.assigned_employee else None,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at
    }

@router.get("/{id}")
def get_lead_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Access control: If staff, ensure assigned to this staff
    if current_user.role == UserRole.STAFF:
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee or lead.assigned_employee_id != employee.id:
            raise HTTPException(status_code=403, detail="You do not have permission to view this customer")

    # Fetch calls, follow-ups, documents, applications
    calls = db.query(CallLog).filter(CallLog.lead_id == id).order_by(desc(CallLog.created_at)).all()
    follow_ups = db.query(FollowUp).filter(FollowUp.lead_id == id).order_by(desc(FollowUp.scheduled_date)).all()
    documents = db.query(CustomerDocument).filter(CustomerDocument.lead_id == id).order_by(desc(CustomerDocument.uploaded_at)).all()
    applications = db.query(LoanApplication).filter(LoanApplication.lead_id == id).order_by(desc(LoanApplication.created_at)).all()

    return {
        "lead": {
            "id": lead.id,
            "customer_code": lead.customer_code,
            "full_name": lead.full_name,
            "phone_number": lead.phone_number,
            "email": lead.email,
            "address": lead.address,
            "city": lead.city,
            "employment_type": lead.employment_type,
            "monthly_income": lead.monthly_income,
            "required_loan_amount": lead.required_loan_amount,
            "loan_type": lead.loan_type,
            "lead_source": lead.lead_source,
            "lead_status": lead.lead_status,
            "assigned_employee_id": lead.assigned_employee_id,
            "assigned_employee_name": lead.assigned_employee.full_name if lead.assigned_employee else None,
            "created_at": lead.created_at,
            "updated_at": lead.updated_at
        },
        "calls": [
            {
                "id": c.id,
                "call_date": str(c.call_date),
                "call_time": str(c.call_time),
                "outcome": c.outcome,
                "remarks": c.remarks,
                "employee_name": c.employee.full_name if c.employee else "Staff"
            } for c in calls
        ],
        "follow_ups": [
            {
                "id": f.id,
                "scheduled_date": str(f.scheduled_date),
                "scheduled_time": str(f.scheduled_time) if f.scheduled_time else "Anytime",
                "status": f.status,
                "remarks": f.remarks,
                "completed_at": f.completed_at
            } for f in follow_ups
        ],
        "documents": [
            {
                "id": d.id,
                "document_type": d.document_type,
                "file_name": d.file_name,
                "file_size": d.file_size,
                "verification_status": d.verification_status,
                "rejection_remarks": d.rejection_remarks,
                "uploaded_at": d.uploaded_at
            } for d in documents
        ],
        "applications": [
            {
                "id": a.id,
                "application_number": a.application_number,
                "bank_name": a.bank.bank_name if a.bank else "-",
                "scheme_name": a.scheme.scheme_name if a.scheme else "-",
                "requested_amount": a.requested_amount,
                "approved_amount": a.approved_amount,
                "disbursed_amount": a.disbursed_amount,
                "status": a.status,
                "remarks": a.remarks
            } for a in applications
        ]
    }

@router.put("/{id}", response_model=LeadResponse)
def update_lead(
    id: int,
    data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Staff permission check
    if current_user.role == UserRole.STAFF:
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee or lead.assigned_employee_id != employee.id:
            raise HTTPException(status_code=403, detail="Permission denied")
        # Staff cannot reassign leads!
        if data.assigned_employee_id is not None and data.assigned_employee_id != lead.assigned_employee_id:
            raise HTTPException(status_code=403, detail="Staff cannot reassign lead ownership")

    for field, val in data.dict(exclude_unset=True).items():
        if field == "assigned_employee_id" and val != lead.assigned_employee_id:
            # Track assignment history
            history = LeadAssignmentHistory(
                lead_id=lead.id,
                assigned_to_employee_id=val,
                assigned_by_user_id=current_user.id,
                notes="Reassigned via lead update"
            )
            db.add(history)
        setattr(lead, field, val)

    db.commit()
    db.refresh(lead)
    log_activity(db, current_user.id, "UPDATE_LEAD", "Lead", lead.id, f"Updated lead {lead.full_name}")

    return {
        "id": lead.id,
        "customer_code": lead.customer_code,
        "full_name": lead.full_name,
        "phone_number": lead.phone_number,
        "email": lead.email,
        "address": lead.address,
        "city": lead.city,
        "employment_type": lead.employment_type,
        "monthly_income": lead.monthly_income,
        "required_loan_amount": lead.required_loan_amount,
        "loan_type": lead.loan_type,
        "lead_source": lead.lead_source,
        "lead_status": lead.lead_status,
        "assigned_employee_id": lead.assigned_employee_id,
        "assigned_employee_name": lead.assigned_employee.full_name if lead.assigned_employee else None,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at
    }

@router.get("/{id}/history", response_model=List[LeadAssignmentHistoryResponse])
def get_lead_assignment_history(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    history = db.query(LeadAssignmentHistory).filter(
        LeadAssignmentHistory.lead_id == id
    ).order_by(desc(LeadAssignmentHistory.assigned_at)).all()

    result = []
    for h in history:
        result.append({
            "id": h.id,
            "lead_id": h.lead_id,
            "assigned_to_employee_id": h.assigned_to_employee_id,
            "assigned_to_name": h.assigned_to.full_name if h.assigned_to else "Unassigned",
            "assigned_by_name": h.assigned_by.email if h.assigned_by else "System",
            "assigned_at": h.assigned_at,
            "notes": h.notes
        })
    return result

@router.delete("/{id}")
def delete_lead(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()
    log_activity(db, admin.id, "DELETE_LEAD", "Lead", id, f"Deleted lead {id}")
    return {"message": "Lead deleted successfully"}
