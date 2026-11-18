from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, datetime
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import get_current_active_user, require_admin
from app.models import (
    User, Employee, Lead, Bank, LoanScheme, LoanApplication,
    LoanApplicationHistory, UserRole, ApplicationStatus, LeadStatus
)
from app.schemas import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    ApplicationHistoryResponse
)
from app.utils.helpers import log_activity, create_notification

router = APIRouter(prefix="/applications", tags=["Loan Application Tracking"])

@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    status: Optional[str] = None,
    bank_id: Optional[int] = None,
    lead_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(LoanApplication).join(Lead).join(Bank).join(LoanScheme)

    # Security check: If staff, only return applications for their assigned leads
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(LoanApplication.assigned_employee_id == emp.id)
    elif employee_id:
        query = query.filter(LoanApplication.assigned_employee_id == employee_id)

    if status:
        query = query.filter(LoanApplication.status == status)
    if bank_id:
        query = query.filter(LoanApplication.bank_id == bank_id)
    if lead_id:
        query = query.filter(LoanApplication.lead_id == lead_id)

    apps = query.order_by(desc(LoanApplication.created_at)).offset(skip).limit(limit).all()

    result = []
    for a in apps:
        result.append({
            "id": a.id,
            "application_number": a.application_number,
            "lead_id": a.lead_id,
            "customer_name": a.lead.full_name if a.lead else "Unknown",
            "customer_phone": a.lead.phone_number if a.lead else "-",
            "bank_id": a.bank_id,
            "bank_name": a.bank.bank_name if a.bank else "-",
            "scheme_id": a.scheme_id,
            "scheme_name": a.scheme.scheme_name if a.scheme else "-",
            "assigned_employee_id": a.assigned_employee_id,
            "assigned_employee_name": a.assigned_employee.full_name if a.assigned_employee else None,
            "requested_amount": a.requested_amount,
            "approved_amount": a.approved_amount,
            "disbursed_amount": a.disbursed_amount,
            "status": a.status,
            "remarks": a.remarks,
            "approval_date": a.approval_date,
            "rejection_reason": a.rejection_reason,
            "disbursement_date": a.disbursement_date,
            "closed_date": a.closed_date,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
            "history": []
        })

    return result

@router.post("", response_model=ApplicationResponse)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Customer lead not found")

    bank = db.query(Bank).filter(Bank.id == data.bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    scheme = db.query(LoanScheme).filter(LoanScheme.id == data.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Loan scheme not found")

    # Generate Application Number
    count = db.query(func.count(LoanApplication.id)).scalar() or 0
    app_num = f"APP{datetime.utcnow().year}{count + 1:05d}"

    # Default assigned employee to lead's assigned employee
    assigned_emp_id = lead.assigned_employee_id
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or lead.assigned_employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Can only create applications for your assigned leads")
        assigned_emp_id = emp.id

    app = LoanApplication(
        application_number=app_num,
        lead_id=lead.id,
        bank_id=bank.id,
        scheme_id=scheme.id,
        assigned_employee_id=assigned_emp_id,
        requested_amount=data.requested_amount,
        status=ApplicationStatus.SUBMITTED,
        remarks=data.remarks
    )
    db.add(app)
    db.flush()

    # Update lead status
    lead.lead_status = LeadStatus.APPLICATION_PROCESSING

    # Add initial history
    history = LoanApplicationHistory(
        application_id=app.id,
        status_from=None,
        status_to=ApplicationStatus.SUBMITTED.value,
        changed_by_user_id=current_user.id,
        remarks=f"Application created with requested amount ₹{data.requested_amount:,.2f}"
    )
    db.add(history)
    db.commit()
    db.refresh(app)

    log_activity(db, current_user.id, "CREATE_APPLICATION", "LoanApplication", app.id, f"Created {app.application_number} for {lead.full_name}")

    return {
        "id": app.id,
        "application_number": app.application_number,
        "lead_id": app.lead_id,
        "customer_name": lead.full_name,
        "customer_phone": lead.phone_number,
        "bank_id": app.bank_id,
        "bank_name": bank.bank_name,
        "scheme_id": app.scheme_id,
        "scheme_name": scheme.scheme_name,
        "assigned_employee_id": app.assigned_employee_id,
        "assigned_employee_name": app.assigned_employee.full_name if app.assigned_employee else None,
        "requested_amount": app.requested_amount,
        "approved_amount": app.approved_amount,
        "disbursed_amount": app.disbursed_amount,
        "status": app.status,
        "remarks": app.remarks,
        "approval_date": app.approval_date,
        "rejection_reason": app.rejection_reason,
        "disbursement_date": app.disbursement_date,
        "closed_date": app.closed_date,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "history": []
    }

@router.get("/{id}")
def get_application_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Staff access check
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or app.assigned_employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Permission denied")

    history = db.query(LoanApplicationHistory).filter(
        LoanApplicationHistory.application_id == id
    ).order_by(desc(LoanApplicationHistory.created_at)).all()

    return {
        "application": {
            "id": app.id,
            "application_number": app.application_number,
            "lead_id": app.lead_id,
            "customer_name": app.lead.full_name if app.lead else "Unknown",
            "customer_phone": app.lead.phone_number if app.lead else "-",
            "bank_id": app.bank_id,
            "bank_name": app.bank.bank_name if app.bank else "-",
            "scheme_id": app.scheme_id,
            "scheme_name": app.scheme.scheme_name if app.scheme else "-",
            "assigned_employee_id": app.assigned_employee_id,
            "assigned_employee_name": app.assigned_employee.full_name if app.assigned_employee else None,
            "requested_amount": app.requested_amount,
            "approved_amount": app.approved_amount,
            "disbursed_amount": app.disbursed_amount,
            "status": app.status,
            "remarks": app.remarks,
            "approval_date": app.approval_date,
            "rejection_reason": app.rejection_reason,
            "disbursement_date": app.disbursement_date,
            "closed_date": app.closed_date,
            "created_at": app.created_at,
            "updated_at": app.updated_at
        },
        "history": [
            {
                "id": h.id,
                "status_from": h.status_from,
                "status_to": h.status_to,
                "changed_by_name": h.changed_by.email if h.changed_by else "System",
                "remarks": h.remarks,
                "created_at": h.created_at
            } for h in history
        ]
    }

@router.put("/{id}")
def update_application(
    id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Staff access check
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or app.assigned_employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Permission denied")
        # Staff cannot change to restricted statuses directly
        if data.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.DISBURSED, ApplicationStatus.CLOSED]:
            raise HTTPException(status_code=403, detail="Only Admin can approve, reject, disburse or close loans")

    old_status = app.status.value if hasattr(app.status, "value") else str(app.status)
    status_changed = False

    if data.status and data.status != app.status:
        app.status = data.status
        status_changed = True

    if data.bank_id:
        app.bank_id = data.bank_id
    if data.scheme_id:
        app.scheme_id = data.scheme_id
    if data.requested_amount:
        app.requested_amount = data.requested_amount
    if data.remarks:
        app.remarks = data.remarks

    if status_changed:
        history = LoanApplicationHistory(
            application_id=app.id,
            status_from=old_status,
            status_to=app.status.value if hasattr(app.status, "value") else str(app.status),
            changed_by_user_id=current_user.id,
            remarks=data.remarks or f"Status changed from {old_status} to {app.status.value}"
        )
        db.add(history)

    db.commit()
    log_activity(db, current_user.id, "UPDATE_APPLICATION", "LoanApplication", app.id, f"Updated application {app.application_number}")

    return {"message": "Application updated successfully", "id": app.id, "status": app.status}
