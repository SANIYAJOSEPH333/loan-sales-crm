from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import date, datetime, time, timedelta
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import get_current_active_user, get_current_employee
from app.models import (
    User, Employee, Lead, CallLog, FollowUp, UserRole,
    CallOutcome, LeadStatus, FollowUpStatus
)
from app.schemas import CallLogCreate, CallLogResponse
from app.utils.helpers import log_activity

router = APIRouter(prefix="/calls", tags=["Call Management"])

@router.get("", response_model=List[CallLogResponse])
def get_call_logs(
    lead_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    outcome: Optional[str] = None,
    call_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(CallLog).join(Lead).join(Employee)

    # Security check: If staff, only return calls made by this employee
    if current_user.role == UserRole.STAFF:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            return []
        query = query.filter(CallLog.employee_id == emp.id)
    elif employee_id:
        query = query.filter(CallLog.employee_id == employee_id)

    if lead_id:
        query = query.filter(CallLog.lead_id == lead_id)
    if outcome:
        query = query.filter(CallLog.outcome == outcome)
    if call_date:
        query = query.filter(CallLog.call_date == call_date)

    calls = query.order_by(desc(CallLog.created_at)).offset(skip).limit(limit).all()

    result = []
    for c in calls:
        result.append({
            "id": c.id,
            "lead_id": c.lead_id,
            "employee_id": c.employee_id,
            "employee_name": c.employee.full_name if c.employee else "Unknown",
            "customer_name": c.lead.full_name if c.lead else "Unknown",
            "customer_phone": c.lead.phone_number if c.lead else "-",
            "call_date": c.call_date,
            "call_time": c.call_time,
            "outcome": c.outcome,
            "remarks": c.remarks,
            "next_follow_up_date": c.next_follow_up_date,
            "next_follow_up_time": c.next_follow_up_time,
            "created_at": c.created_at
        })

    return result

@router.post("", response_model=CallLogResponse)
def log_call(
    data: CallLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    employee = None
    if current_user.role == UserRole.STAFF:
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=403, detail="Employee profile not found")
        if lead.assigned_employee_id != employee.id:
            raise HTTPException(status_code=403, detail="You can only log calls for leads assigned to you")
    else:
        # Admin logging call: use assigned employee or first active employee
        if lead.assigned_employee_id:
            employee = db.query(Employee).filter(Employee.id == lead.assigned_employee_id).first()
        if not employee:
            employee = db.query(Employee).first()

    now = datetime.utcnow()
    c_date = data.call_date or date.today()
    c_time = data.call_time or datetime.now().time()

    # Prevent accidental duplicate submission within 10 seconds for same lead and employee
    ten_seconds_ago = now - timedelta(seconds=10)
    recent_duplicate = db.query(CallLog).filter(
        CallLog.lead_id == lead.id,
        CallLog.employee_id == employee.id,
        CallLog.created_at >= ten_seconds_ago
    ).first()
    if recent_duplicate:
        raise HTTPException(status_code=400, detail="Duplicate call log detected. Please wait a moment before submitting again.")

    call_log = CallLog(
        lead_id=lead.id,
        employee_id=employee.id,
        call_date=c_date,
        call_time=c_time,
        outcome=data.outcome,
        remarks=data.remarks,
        next_follow_up_date=data.next_follow_up_date,
        next_follow_up_time=data.next_follow_up_time
    )
    db.add(call_log)

    # Automatically update Lead status according to outcome
    if data.outcome == CallOutcome.INTERESTED:
        lead.lead_status = LeadStatus.INTERESTED
    elif data.outcome == CallOutcome.NOT_INTERESTED:
        lead.lead_status = LeadStatus.NOT_INTERESTED
    elif data.outcome in [CallOutcome.FOLLOW_UP_REQUIRED, CallOutcome.CALL_BACK_LATER]:
        lead.lead_status = LeadStatus.FOLLOW_UP_REQUIRED
    else:
        if lead.lead_status in [LeadStatus.NEW, LeadStatus.ASSIGNED]:
            lead.lead_status = LeadStatus.CONTACTED

    lead.updated_at = now

    # Auto-schedule follow-up if next_follow_up_date is provided
    if data.next_follow_up_date:
        follow_up = FollowUp(
            lead_id=lead.id,
            employee_id=employee.id,
            scheduled_date=data.next_follow_up_date,
            scheduled_time=data.next_follow_up_time,
            status=FollowUpStatus.PENDING,
            remarks=f"Follow-up scheduled from call: {data.remarks or ''}"
        )
        db.add(follow_up)

    db.commit()
    db.refresh(call_log)

    log_activity(db, current_user.id, "LOG_CALL", "Lead", lead.id, f"Logged call with {lead.full_name}: Outcome {data.outcome.value}")

    return {
        "id": call_log.id,
        "lead_id": call_log.lead_id,
        "employee_id": call_log.employee_id,
        "employee_name": employee.full_name,
        "customer_name": lead.full_name,
        "customer_phone": lead.phone_number,
        "call_date": call_log.call_date,
        "call_time": call_log.call_time,
        "outcome": call_log.outcome,
        "remarks": call_log.remarks,
        "next_follow_up_date": call_log.next_follow_up_date,
        "next_follow_up_time": call_log.next_follow_up_time,
        "created_at": call_log.created_at
    }
