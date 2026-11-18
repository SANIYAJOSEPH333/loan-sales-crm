from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, datetime
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import require_admin
from app.models import (
    User, LoanApplication, LoanApplicationHistory, Lead,
    ApplicationStatus, LeadStatus
)
from app.schemas import (
    ApplicationApprovalRequest, ApplicationRejectionRequest,
    ApplicationDisbursementRequest, ApplicationClosureRequest
)
from app.utils.helpers import log_activity, create_notification

router = APIRouter(prefix="/approvals", tags=["Loan Approval & Closure"])

@router.post("/{id}/approve")
def approve_loan_application(
    id: int,
    data: ApplicationApprovalRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    old_status = app.status.value if hasattr(app.status, "value") else str(app.status)
    app.status = ApplicationStatus.APPROVED
    app.approved_amount = data.approved_amount
    app.approval_date = data.approval_date or date.today()
    if data.remarks:
        app.remarks = f"{app.remarks or ''} | Approval: {data.remarks}"

    # Also update Lead status
    if app.lead:
        app.lead.lead_status = LeadStatus.APPROVED

    history = LoanApplicationHistory(
        application_id=app.id,
        status_from=old_status,
        status_to=ApplicationStatus.APPROVED.value,
        changed_by_user_id=admin.id,
        remarks=f"Loan Approved for ₹{data.approved_amount:,.2f}. {data.remarks or ''}"
    )
    db.add(history)

    # Notify employee
    if app.assigned_employee:
        create_notification(
            db=db,
            user_id=app.assigned_employee.user_id,
            title="Loan Application Approved!",
            message=f"Loan application {app.application_number} for customer {app.lead.full_name if app.lead else ''} approved for ₹{data.approved_amount:,.2f}.",
            notification_type="SUCCESS",
            link_url=f"/staff/applications"
        )

    db.commit()
    log_activity(db, admin.id, "APPROVE_LOAN", "LoanApplication", app.id, f"Approved ₹{data.approved_amount} for {app.application_number}")

    return {
        "message": "Loan application approved successfully",
        "id": app.id,
        "status": app.status,
        "approved_amount": app.approved_amount,
        "approval_date": app.approval_date
    }

@router.post("/{id}/reject")
def reject_loan_application(
    id: int,
    data: ApplicationRejectionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    old_status = app.status.value if hasattr(app.status, "value") else str(app.status)
    app.status = ApplicationStatus.REJECTED
    app.rejection_reason = data.rejection_reason
    if data.remarks:
        app.remarks = f"{app.remarks or ''} | Rejection: {data.remarks}"

    if app.lead:
        app.lead.lead_status = LeadStatus.REJECTED

    history = LoanApplicationHistory(
        application_id=app.id,
        status_from=old_status,
        status_to=ApplicationStatus.REJECTED.value,
        changed_by_user_id=admin.id,
        remarks=f"Loan Rejected. Reason: {data.rejection_reason}. {data.remarks or ''}"
    )
    db.add(history)

    if app.assigned_employee:
        create_notification(
            db=db,
            user_id=app.assigned_employee.user_id,
            title="Loan Application Rejected",
            message=f"Application {app.application_number} was rejected. Reason: {data.rejection_reason}",
            notification_type="WARNING",
            link_url=f"/staff/applications"
        )

    db.commit()
    log_activity(db, admin.id, "REJECT_LOAN", "LoanApplication", app.id, f"Rejected {app.application_number}")

    return {
        "message": "Loan application rejected",
        "id": app.id,
        "status": app.status,
        "rejection_reason": app.rejection_reason
    }

@router.post("/{id}/disburse")
def disburse_loan(
    id: int,
    data: ApplicationDisbursementRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    if app.status != ApplicationStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved applications can be marked as disbursed")

    old_status = app.status.value if hasattr(app.status, "value") else str(app.status)
    app.status = ApplicationStatus.DISBURSED
    app.disbursed_amount = data.disbursed_amount
    app.disbursement_date = data.disbursement_date or date.today()
    if data.remarks:
        app.remarks = f"{app.remarks or ''} | Disbursed: {data.remarks}"

    if app.lead:
        app.lead.lead_status = LeadStatus.DISBURSED

    history = LoanApplicationHistory(
        application_id=app.id,
        status_from=old_status,
        status_to=ApplicationStatus.DISBURSED.value,
        changed_by_user_id=admin.id,
        remarks=f"Disbursed ₹{data.disbursed_amount:,.2f} on {app.disbursement_date}. {data.remarks or ''}"
    )
    db.add(history)

    if app.assigned_employee:
        create_notification(
            db=db,
            user_id=app.assigned_employee.user_id,
            title="Loan Disbursed!",
            message=f"Loan {app.application_number} disbursed ₹{data.disbursed_amount:,.2f} successfully.",
            notification_type="SUCCESS",
            link_url=f"/staff/applications"
        )

    db.commit()
    log_activity(db, admin.id, "DISBURSE_LOAN", "LoanApplication", app.id, f"Disbursed ₹{data.disbursed_amount} for {app.application_number}")

    return {
        "message": "Loan marked as disbursed",
        "id": app.id,
        "status": app.status,
        "disbursed_amount": app.disbursed_amount,
        "disbursement_date": app.disbursement_date
    }

@router.post("/{id}/close")
def close_loan_application(
    id: int,
    data: ApplicationClosureRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    app = db.query(LoanApplication).filter(LoanApplication.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Loan application not found")

    old_status = app.status.value if hasattr(app.status, "value") else str(app.status)
    app.status = ApplicationStatus.CLOSED
    app.closed_date = data.closed_date or date.today()
    if data.remarks:
        app.remarks = f"{app.remarks or ''} | Closed: {data.remarks}"

    history = LoanApplicationHistory(
        application_id=app.id,
        status_from=old_status,
        status_to=ApplicationStatus.CLOSED.value,
        changed_by_user_id=admin.id,
        remarks=f"Loan application closed on {app.closed_date}. {data.remarks or ''}"
    )
    db.add(history)
    db.commit()

    log_activity(db, admin.id, "CLOSE_LOAN", "LoanApplication", app.id, f"Closed loan {app.application_number}")

    return {
        "message": "Loan marked as closed",
        "id": app.id,
        "status": app.status,
        "closed_date": app.closed_date
    }
