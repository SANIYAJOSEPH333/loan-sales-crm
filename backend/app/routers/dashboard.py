from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from app.database.session import get_db
from app.core.dependencies import require_admin, get_current_active_user, get_current_employee
from app.models import (
    User, Employee, Lead, CallLog, FollowUp, CustomerDocument,
    LoanApplication, ActivityLog, UserRole, EmployeeStatus,
    LeadStatus, CallOutcome, FollowUpStatus, VerificationStatus,
    ApplicationStatus
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/admin")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    today = date.today()
    start_of_today = datetime.combine(today, datetime.min.time())
    
    # 1. High-level Metrics
    total_leads = db.query(func.count(Lead.id)).scalar() or 0
    total_employees = db.query(func.count(Employee.id)).filter(Employee.status == EmployeeStatus.ACTIVE).scalar() or 0
    
    leads_assigned_today = db.query(func.count(Lead.id)).filter(
        Lead.assigned_employee_id.isnot(None),
        Lead.updated_at >= start_of_today
    ).scalar() or 0

    calls_completed_today = db.query(func.count(CallLog.id)).filter(
        CallLog.call_date == today
    ).scalar() or 0

    # Total daily targets for active staff
    total_daily_target = db.query(func.sum(Employee.daily_call_target)).filter(
        Employee.status == EmployeeStatus.ACTIVE
    ).scalar() or 0
    
    pending_calls = max(0, total_daily_target - calls_completed_today)

    interested_customers = db.query(func.count(Lead.id)).filter(
        Lead.lead_status == LeadStatus.INTERESTED
    ).scalar() or 0

    not_interested_customers = db.query(func.count(Lead.id)).filter(
        Lead.lead_status == LeadStatus.NOT_INTERESTED
    ).scalar() or 0

    follow_ups_due_today = db.query(func.count(FollowUp.id)).filter(
        FollowUp.scheduled_date == today,
        FollowUp.status == FollowUpStatus.PENDING
    ).scalar() or 0

    documents_pending = db.query(func.count(CustomerDocument.id)).filter(
        CustomerDocument.verification_status == VerificationStatus.PENDING
    ).scalar() or 0

    loans_processing = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.ADDITIONAL_DOCUMENTS_REQUIRED
        ])
    ).scalar() or 0

    approved_loans = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.status == ApplicationStatus.APPROVED
    ).scalar() or 0

    rejected_loans = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.status == ApplicationStatus.REJECTED
    ).scalar() or 0

    disbursed_loans = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.status == ApplicationStatus.DISBURSED
    ).scalar() or 0

    # 2. Charts Data
    # 2.1 Daily Call Performance (last 7 days)
    daily_call_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.query(func.count(CallLog.id)).filter(CallLog.call_date == day).scalar() or 0
        daily_call_trend.append({
            "date": day.strftime("%b %d"),
            "calls": count
        })

    # 2.2 Employee-wise Call Performance today
    active_employees = db.query(Employee).filter(Employee.status == EmployeeStatus.ACTIVE).all()
    employee_perf = []
    top_performers = []
    under_target_employees = []

    for emp in active_employees:
        emp_calls_today = db.query(func.count(CallLog.id)).filter(
            CallLog.employee_id == emp.id,
            CallLog.call_date == today
        ).scalar() or 0

        target = emp.daily_call_target
        pct = round((emp_calls_today / target * 100), 1) if target > 0 else 0
        
        emp_data = {
            "employee_id": emp.id,
            "name": emp.full_name,
            "code": emp.employee_code,
            "completed": emp_calls_today,
            "target": target,
            "remaining": max(0, target - emp_calls_today),
            "percentage": pct
        }
        employee_perf.append(emp_data)

        if emp_calls_today >= target:
            top_performers.append(emp_data)
        else:
            under_target_employees.append(emp_data)

    # Sort top performers by completed descending
    employee_perf.sort(key=lambda x: x["completed"], reverse=True)
    top_performers.sort(key=lambda x: x["completed"], reverse=True)
    under_target_employees.sort(key=lambda x: x["percentage"])

    # 2.3 Lead Status Distribution
    status_counts = db.query(Lead.lead_status, func.count(Lead.id)).group_by(Lead.lead_status).all()
    lead_status_distribution = [
        {"status": s.value if hasattr(s, "value") else str(s), "count": cnt}
        for s, cnt in status_counts
    ]

    # 2.4 Loan Application Status Distribution
    loan_counts = db.query(LoanApplication.status, func.count(LoanApplication.id)).group_by(LoanApplication.status).all()
    loan_status_distribution = [
        {"status": s.value if hasattr(s, "value") else str(s), "count": cnt}
        for s, cnt in loan_counts
    ]

    # 2.5 Recent Activity Feed
    activities = db.query(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(8).all()
    activity_feed = [
        {
            "id": a.id,
            "action": a.action,
            "entity_type": a.entity_type,
            "details": a.details,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M")
        } for a in activities
    ]

    # 2.6 Upcoming Follow-ups (due today or future pending)
    follow_ups = db.query(FollowUp).join(Lead).filter(
        FollowUp.status == FollowUpStatus.PENDING,
        FollowUp.scheduled_date >= today
    ).order_by(FollowUp.scheduled_date.asc(), FollowUp.scheduled_time.asc()).limit(6).all()

    upcoming_followups = [
        {
            "id": f.id,
            "customer_name": f.lead.full_name if f.lead else "Unknown",
            "customer_phone": f.lead.phone_number if f.lead else "-",
            "scheduled_date": str(f.scheduled_date),
            "scheduled_time": str(f.scheduled_time) if f.scheduled_time else "Anytime",
            "remarks": f.remarks
        } for f in follow_ups
    ]

    return {
        "metrics": {
            "total_leads": total_leads,
            "total_employees": total_employees,
            "leads_assigned_today": leads_assigned_today,
            "calls_completed_today": calls_completed_today,
            "pending_calls": pending_calls,
            "total_daily_target": total_daily_target,
            "interested_customers": interested_customers,
            "not_interested_customers": not_interested_customers,
            "follow_ups_due_today": follow_ups_due_today,
            "documents_pending": documents_pending,
            "loans_processing": loans_processing,
            "approved_loans": approved_loans,
            "rejected_loans": rejected_loans,
            "disbursed_loans": disbursed_loans
        },
        "charts": {
            "daily_call_trend": daily_call_trend,
            "employee_performance": employee_perf[:10],
            "lead_status_distribution": lead_status_distribution,
            "loan_status_distribution": loan_status_distribution
        },
        "top_performers": top_performers[:5],
        "under_target_employees": under_target_employees[:5],
        "recent_activities": activity_feed,
        "upcoming_followups": upcoming_followups
    }


@router.get("/staff")
def get_staff_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")

    today = date.today()

    # 1. Staff Metrics
    assigned_leads_count = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id == employee.id).scalar() or 0
    
    calls_completed_today = db.query(func.count(CallLog.id)).filter(
        CallLog.employee_id == employee.id,
        CallLog.call_date == today
    ).scalar() or 0

    daily_target = employee.daily_call_target
    remaining_calls = max(0, daily_target - calls_completed_today)
    target_pct = round((calls_completed_today / daily_target * 100), 1) if daily_target > 0 else 0

    interested_count = db.query(func.count(Lead.id)).filter(
        Lead.assigned_employee_id == employee.id,
        Lead.lead_status == LeadStatus.INTERESTED
    ).scalar() or 0

    not_interested_count = db.query(func.count(Lead.id)).filter(
        Lead.assigned_employee_id == employee.id,
        Lead.lead_status == LeadStatus.NOT_INTERESTED
    ).scalar() or 0

    follow_ups_today = db.query(func.count(FollowUp.id)).filter(
        FollowUp.employee_id == employee.id,
        FollowUp.scheduled_date == today,
        FollowUp.status == FollowUpStatus.PENDING
    ).scalar() or 0

    # Overdue follow-ups
    overdue_follow_ups = db.query(func.count(FollowUp.id)).filter(
        FollowUp.employee_id == employee.id,
        FollowUp.scheduled_date < today,
        FollowUp.status == FollowUpStatus.PENDING
    ).scalar() or 0

    # Pending documents on staff's leads
    pending_docs = db.query(func.count(CustomerDocument.id)).join(Lead).filter(
        Lead.assigned_employee_id == employee.id,
        CustomerDocument.verification_status == VerificationStatus.PENDING
    ).scalar() or 0

    # Active loan applications
    active_apps = db.query(func.count(LoanApplication.id)).filter(
        LoanApplication.assigned_employee_id == employee.id,
        LoanApplication.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.ADDITIONAL_DOCUMENTS_REQUIRED
        ])
    ).scalar() or 0

    # 2. Daily Call Trend (last 7 days for this staff member)
    staff_call_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        cnt = db.query(func.count(CallLog.id)).filter(
            CallLog.employee_id == employee.id,
            CallLog.call_date == day
        ).scalar() or 0
        staff_call_trend.append({
            "date": day.strftime("%b %d"),
            "calls": cnt,
            "target": daily_target
        })

    # 3. Today's Pending Follow-ups list
    today_followups = db.query(FollowUp).join(Lead).filter(
        FollowUp.employee_id == employee.id,
        FollowUp.scheduled_date == today,
        FollowUp.status == FollowUpStatus.PENDING
    ).order_by(FollowUp.scheduled_time.asc()).limit(10).all()

    followup_list = [
        {
            "id": f.id,
            "lead_id": f.lead_id,
            "customer_name": f.lead.full_name,
            "customer_phone": f.lead.phone_number,
            "scheduled_time": str(f.scheduled_time) if f.scheduled_time else "Anytime",
            "remarks": f.remarks
        } for f in today_followups
    ]

    return {
        "employee": {
            "id": employee.id,
            "name": employee.full_name,
            "code": employee.employee_code,
            "daily_target": daily_target
        },
        "metrics": {
            "assigned_leads": assigned_leads_count,
            "calls_completed_today": calls_completed_today,
            "daily_target": daily_target,
            "remaining_calls": remaining_calls,
            "target_achievement_percentage": target_pct,
            "interested_customers": interested_count,
            "not_interested_customers": not_interested_count,
            "follow_ups_due_today": follow_ups_today,
            "overdue_follow_ups": overdue_follow_ups,
            "pending_documents": pending_docs,
            "active_applications": active_apps
        },
        "charts": {
            "call_trend": staff_call_trend
        },
        "today_followups": followup_list
    }
