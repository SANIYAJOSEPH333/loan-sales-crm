import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from app.database.session import get_db
from app.core.dependencies import require_admin, get_current_active_user
from app.models import (
    User, Employee, Lead, CallLog, FollowUp, CustomerDocument,
    LoanApplication, Bank, LoanScheme, UserRole, EmployeeStatus, LeadStatus,
    CallOutcome, FollowUpStatus, VerificationStatus, ApplicationStatus
)

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_reports_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    # Call Reports
    call_query = db.query(CallLog).filter(
        CallLog.call_date >= start_date,
        CallLog.call_date <= end_date
    )
    if employee_id:
        call_query = call_query.filter(CallLog.employee_id == employee_id)

    total_calls = call_query.count()
    interested_calls = call_query.filter(CallLog.outcome == CallOutcome.INTERESTED).count()
    not_interested_calls = call_query.filter(CallLog.outcome == CallOutcome.NOT_INTERESTED).count()
    followup_calls = call_query.filter(CallLog.outcome.in_([CallOutcome.FOLLOW_UP_REQUIRED, CallOutcome.CALL_BACK_LATER])).count()

    # Call outcomes breakdown
    outcomes_breakdown = db.query(
        CallLog.outcome, func.count(CallLog.id)
    ).filter(
        CallLog.call_date >= start_date,
        CallLog.call_date <= end_date
    )
    if employee_id:
        outcomes_breakdown = outcomes_breakdown.filter(CallLog.employee_id == employee_id)
    outcomes_breakdown = outcomes_breakdown.group_by(CallLog.outcome).all()

    # Daily trend
    daily_trends = db.query(
        CallLog.call_date, func.count(CallLog.id)
    ).filter(
        CallLog.call_date >= start_date,
        CallLog.call_date <= end_date
    )
    if employee_id:
        daily_trends = daily_trends.filter(CallLog.employee_id == employee_id)
    daily_trends = daily_trends.group_by(CallLog.call_date).order_by(CallLog.call_date.asc()).all()

    # Lead Conversions
    lead_query = db.query(Lead).filter(
        Lead.created_at >= datetime.combine(start_date, datetime.min.time()),
        Lead.created_at <= datetime.combine(end_date, datetime.max.time())
    )
    if employee_id:
        lead_query = lead_query.filter(Lead.assigned_employee_id == employee_id)

    total_leads = lead_query.count()
    leads_by_status = db.query(Lead.lead_status, func.count(Lead.id)).filter(
        Lead.created_at >= datetime.combine(start_date, datetime.min.time()),
        Lead.created_at <= datetime.combine(end_date, datetime.max.time())
    )
    if employee_id:
        leads_by_status = leads_by_status.filter(Lead.assigned_employee_id == employee_id)
    leads_by_status = leads_by_status.group_by(Lead.lead_status).all()

    # Loan Applications Summary
    app_query = db.query(LoanApplication).filter(
        LoanApplication.created_at >= datetime.combine(start_date, datetime.min.time()),
        LoanApplication.created_at <= datetime.combine(end_date, datetime.max.time())
    )
    if employee_id:
        app_query = app_query.filter(LoanApplication.assigned_employee_id == employee_id)

    total_apps = app_query.count()
    approved_apps = app_query.filter(LoanApplication.status == ApplicationStatus.APPROVED).count()
    rejected_apps = app_query.filter(LoanApplication.status == ApplicationStatus.REJECTED).count()
    disbursed_apps = app_query.filter(LoanApplication.status == ApplicationStatus.DISBURSED).count()

    total_disbursed_amount = db.query(func.sum(LoanApplication.disbursed_amount)).filter(
        LoanApplication.status == ApplicationStatus.DISBURSED,
        LoanApplication.disbursement_date >= start_date,
        LoanApplication.disbursement_date <= end_date
    ).scalar() or 0.0

    # Employee Performance Table
    employees = db.query(Employee).filter(Employee.status == EmployeeStatus.ACTIVE).all()
    emp_report = []
    for emp in employees:
        calls = db.query(func.count(CallLog.id)).filter(
            CallLog.employee_id == emp.id,
            CallLog.call_date >= start_date,
            CallLog.call_date <= end_date
        ).scalar() or 0

        interested = db.query(func.count(CallLog.id)).filter(
            CallLog.employee_id == emp.id,
            CallLog.call_date >= start_date,
            CallLog.call_date <= end_date,
            CallLog.outcome == CallOutcome.INTERESTED
        ).scalar() or 0

        leads_assigned = db.query(func.count(Lead.id)).filter(
            Lead.assigned_employee_id == emp.id
        ).scalar() or 0

        apps_closed = db.query(func.count(LoanApplication.id)).filter(
            LoanApplication.assigned_employee_id == emp.id,
            LoanApplication.status.in_([ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED])
        ).scalar() or 0

        conversion_rate = round((interested / calls * 100), 1) if calls > 0 else 0

        emp_report.append({
            "employee_id": emp.id,
            "employee_code": emp.employee_code,
            "name": emp.full_name,
            "total_calls": calls,
            "interested_calls": interested,
            "conversion_rate": conversion_rate,
            "assigned_leads": leads_assigned,
            "approved_loans": apps_closed
        })

    return {
        "date_range": {
            "start_date": str(start_date),
            "end_date": str(end_date)
        },
        "calls_summary": {
            "total_calls": total_calls,
            "interested": interested_calls,
            "not_interested": not_interested_calls,
            "follow_up_required": followup_calls,
            "outcomes_breakdown": [{"outcome": o.value if hasattr(o, "value") else str(o), "count": cnt} for o, cnt in outcomes_breakdown],
            "daily_trend": [{"date": str(d), "calls": cnt} for d, cnt in daily_trends]
        },
        "leads_summary": {
            "total_leads": total_leads,
            "status_breakdown": [{"status": s.value if hasattr(s, "value") else str(s), "count": cnt} for s, cnt in leads_by_status]
        },
        "loans_summary": {
            "total_applications": total_apps,
            "approved": approved_apps,
            "rejected": rejected_apps,
            "disbursed": disbursed_apps,
            "total_disbursed_amount": total_disbursed_amount
        },
        "employee_performance": emp_report
    }

@router.get("/export/{report_type}")
def export_report_csv(
    report_type: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "calls":
        writer.writerow(["Call ID", "Date", "Time", "Customer Name", "Customer Phone", "Employee", "Outcome", "Remarks", "Next Follow-up"])
        calls = db.query(CallLog).join(Lead).join(Employee).filter(
            CallLog.call_date >= start_date,
            CallLog.call_date <= end_date
        ).order_by(CallLog.call_date.desc()).all()

        for c in calls:
            writer.writerow([
                c.id,
                str(c.call_date),
                str(c.call_time),
                c.lead.full_name if c.lead else "",
                c.lead.phone_number if c.lead else "",
                c.employee.full_name if c.employee else "",
                c.outcome.value if hasattr(c.outcome, "value") else str(c.outcome),
                c.remarks or "",
                str(c.next_follow_up_date or "")
            ])
        filename = f"call_report_{start_date}_{end_date}.csv"

    elif report_type == "leads":
        writer.writerow(["Customer Code", "Customer Name", "Phone", "Email", "City", "Employment Type", "Monthly Income", "Loan Amount", "Loan Type", "Status", "Assigned Employee", "Created Date"])
        leads = db.query(Lead).order_by(desc(Lead.created_at)).all()
        for l in leads:
            writer.writerow([
                l.customer_code,
                l.full_name,
                l.phone_number,
                l.email or "",
                l.city or "",
                l.employment_type.value if hasattr(l.employment_type, "value") else str(l.employment_type),
                l.monthly_income,
                l.required_loan_amount,
                l.loan_type.value if hasattr(l.loan_type, "value") else str(l.loan_type),
                l.lead_status.value if hasattr(l.lead_status, "value") else str(l.lead_status),
                l.assigned_employee.full_name if l.assigned_employee else "Unassigned",
                str(l.created_at.date())
            ])
        filename = f"leads_report_{start_date}_{end_date}.csv"

    elif report_type == "loans":
        writer.writerow(["Application Number", "Customer Name", "Bank", "Loan Scheme", "Requested Amount", "Approved Amount", "Disbursed Amount", "Status", "Approval Date", "Disbursement Date", "Rejection Reason"])
        apps = db.query(LoanApplication).outerjoin(Lead).outerjoin(Bank).outerjoin(LoanScheme).order_by(desc(LoanApplication.created_at)).all()
        for a in apps:
            writer.writerow([
                a.application_number,
                a.lead.full_name if a.lead else "",
                a.bank.bank_name if a.bank else "",
                a.scheme.scheme_name if a.scheme else "",
                a.requested_amount,
                a.approved_amount or "",
                a.disbursed_amount or "",
                a.status.value if hasattr(a.status, "value") else str(a.status),
                str(a.approval_date or ""),
                str(a.disbursement_date or ""),
                a.rejection_reason or ""
            ])
        filename = f"loan_applications_report_{start_date}_{end_date}.csv"
    else:
        raise HTTPException(status_code=400, detail="Invalid report type. Valid types: calls, leads, loans")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
