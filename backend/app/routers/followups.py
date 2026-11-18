from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import date, datetime, time
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import get_current_active_user, get_current_employee
from app.models import (
    User, Employee, Lead, FollowUp, UserRole, FollowUpStatus
)
from app.schemas import FollowUpCreate, FollowUpUpdate, FollowUpResponse
from app.utils.helpers import log_activity

router = APIRouter(prefix="/followups", tags=["Follow-up Management"])

@router.get("", response_model=List[FollowUpResponse])
def get_followups(
    filter_type: Optional[str] = Query(None, description="'today', 'upcoming', 'overdue', 'completed', or 'all'"),
    employee_id: Optional[int] = None,
    lead_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    today = date.today()
    query = db.query(FollowUp).join(Lead).join(Employee)

    # Security check: If staff, only return their follow-ups
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(FollowUp.employee_id == emp.id)
    elif employee_id:
        query = query.filter(FollowUp.employee_id == employee_id)

    if lead_id:
        query = query.filter(FollowUp.lead_id == lead_id)

    # Apply filter type
    if filter_type == "today":
        query = query.filter(
            FollowUp.scheduled_date == today,
            FollowUp.status == FollowUpStatus.PENDING
        )
    elif filter_type == "upcoming":
        query = query.filter(
            FollowUp.scheduled_date > today,
            FollowUp.status == FollowUpStatus.PENDING
        )
    elif filter_type == "overdue":
        query = query.filter(
            FollowUp.scheduled_date < today,
            FollowUp.status == FollowUpStatus.PENDING
        )
    elif filter_type == "completed":
        query = query.filter(FollowUp.status == FollowUpStatus.COMPLETED)

    followups = query.order_by(FollowUp.scheduled_date.asc(), FollowUp.scheduled_time.asc()).all()

    result = []
    for f in followups:
        result.append({
            "id": f.id,
            "lead_id": f.lead_id,
            "employee_id": f.employee_id,
            "customer_name": f.lead.full_name if f.lead else "Unknown",
            "customer_phone": f.lead.phone_number if f.lead else "-",
            "employee_name": f.employee.full_name if f.employee else "Unknown",
            "scheduled_date": f.scheduled_date,
            "scheduled_time": f.scheduled_time,
            "status": f.status,
            "remarks": f.remarks,
            "completed_at": f.completed_at,
            "created_at": f.created_at
        })

    return result

@router.post("", response_model=FollowUpResponse)
def schedule_followup(
    data: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    employee = None
    if current_user.role == UserRole.STAFF:
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee or lead.assigned_employee_id != employee.id:
            raise HTTPException(status_code=403, detail="Cannot schedule follow-up for lead not assigned to you")
    else:
        employee = lead.assigned_employee or db.query(Employee).first()

    follow_up = FollowUp(
        lead_id=lead.id,
        employee_id=employee.id,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        status=FollowUpStatus.PENDING,
        remarks=data.remarks
    )
    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)

    log_activity(db, current_user.id, "SCHEDULE_FOLLOWUP", "FollowUp", follow_up.id, f"Scheduled for {lead.full_name} on {data.scheduled_date}")

    return {
        "id": follow_up.id,
        "lead_id": follow_up.lead_id,
        "employee_id": follow_up.employee_id,
        "customer_name": lead.full_name,
        "customer_phone": lead.phone_number,
        "employee_name": employee.full_name,
        "scheduled_date": follow_up.scheduled_date,
        "scheduled_time": follow_up.scheduled_time,
        "status": follow_up.status,
        "remarks": follow_up.remarks,
        "completed_at": follow_up.completed_at,
        "created_at": follow_up.created_at
    }

@router.patch("/{id}/complete")
def mark_followup_completed(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    follow_up = db.query(FollowUp).filter(FollowUp.id == id).first()
    if not follow_up:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or follow_up.employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Permission denied")

    follow_up.status = FollowUpStatus.COMPLETED
    follow_up.completed_at = datetime.utcnow()
    db.commit()

    log_activity(db, current_user.id, "COMPLETE_FOLLOWUP", "FollowUp", follow_up.id)
    return {"message": "Follow-up marked as completed", "id": id}

@router.patch("/{id}/reschedule")
def reschedule_followup(
    id: int,
    data: FollowUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    follow_up = db.query(FollowUp).filter(FollowUp.id == id).first()
    if not follow_up:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp or follow_up.employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Permission denied")

    if data.scheduled_date:
        follow_up.scheduled_date = data.scheduled_date
    if data.scheduled_time:
        follow_up.scheduled_time = data.scheduled_time
    if data.remarks:
        follow_up.remarks = f"{follow_up.remarks or ''} | Rescheduled: {data.remarks}"

    follow_up.status = FollowUpStatus.PENDING
    db.commit()

    log_activity(db, current_user.id, "RESCHEDULE_FOLLOWUP", "FollowUp", follow_up.id)
    return {"message": "Follow-up rescheduled successfully", "id": id}
