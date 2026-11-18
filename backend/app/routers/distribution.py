from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from app.database.session import get_db
from app.core.dependencies import require_admin
from app.models import User, Employee, Lead, LeadAssignmentHistory, EmployeeStatus, LeadStatus
from app.schemas import LeadAssignmentRequest, BalancedDistributionRequest, LeadAssignmentHistoryResponse
from app.utils.helpers import log_activity, create_notification

router = APIRouter(prefix="/distribution", tags=["Lead Distribution"])

@router.get("/allocations")
def get_employee_allocations(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Returns all active employees with their current assigned lead counts and daily targets."""
    employees = db.query(Employee).filter(Employee.status == EmployeeStatus.ACTIVE).all()
    allocations = []
    
    for emp in employees:
        count = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id == emp.id).scalar() or 0
        new_count = db.query(func.count(Lead.id)).filter(
            Lead.assigned_employee_id == emp.id,
            Lead.lead_status.in_([LeadStatus.NEW, LeadStatus.ASSIGNED])
        ).scalar() or 0

        allocations.append({
            "employee_id": emp.id,
            "employee_code": emp.employee_code,
            "full_name": emp.full_name,
            "role": emp.role,
            "daily_call_target": emp.daily_call_target,
            "total_assigned_leads": count,
            "pending_leads": new_count
        })

    # Also return unassigned leads count
    unassigned_count = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id.is_(None)).scalar() or 0

    return {
        "unassigned_leads_count": unassigned_count,
        "allocations": allocations
    }

@router.post("/assign")
def assign_leads_manually(
    data: LeadAssignmentRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Assigns specific selected leads to a single selected employee."""
    if not data.lead_ids:
        raise HTTPException(status_code=400, detail="No leads selected")

    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee or employee.status != EmployeeStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Selected employee is not active or does not exist")

    leads = db.query(Lead).filter(Lead.id.in_(data.lead_ids)).all()
    if not leads:
        raise HTTPException(status_code=404, detail="Selected leads not found")

    assigned_count = 0
    for lead in leads:
        lead.assigned_employee_id = employee.id
        if lead.lead_status == LeadStatus.NEW:
            lead.lead_status = LeadStatus.ASSIGNED
        
        # Log history
        history = LeadAssignmentHistory(
            lead_id=lead.id,
            assigned_to_employee_id=employee.id,
            assigned_by_user_id=admin.id,
            notes=data.notes or f"Manual assignment to {employee.full_name}"
        )
        db.add(history)
        assigned_count += 1

    db.commit()

    # Notify employee
    create_notification(
        db=db,
        user_id=employee.user_id,
        title="New Leads Assigned",
        message=f"{assigned_count} new leads have been assigned to you by admin.",
        notification_type="INFO",
        link_url="/staff/leads"
    )

    log_activity(db, admin.id, "ASSIGN_LEADS", "Employee", employee.id, f"Assigned {assigned_count} leads to {employee.full_name}")

    return {
        "message": f"Successfully assigned {assigned_count} leads to {employee.full_name}",
        "assigned_count": assigned_count,
        "employee_name": employee.full_name
    }

@router.post("/balanced-distribute")
def distribute_balanced(
    data: BalancedDistributionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Distributes selected leads evenly among selected active employees.
    Uses round-robin or current load balancing.
    """
    if not data.lead_ids:
        raise HTTPException(status_code=400, detail="No leads selected for distribution")
    if not data.employee_ids:
        raise HTTPException(status_code=400, detail="No employees selected for distribution")

    employees = db.query(Employee).filter(
        Employee.id.in_(data.employee_ids),
        Employee.status == EmployeeStatus.ACTIVE
    ).all()

    if not employees:
        raise HTTPException(status_code=400, detail="None of the selected employees are active")

    leads = db.query(Lead).filter(Lead.id.in_(data.lead_ids)).all()
    if not leads:
        raise HTTPException(status_code=404, detail="No matching leads found")

    # Sort employees by current load to give leads to least-loaded employees first
    emp_load = {}
    for emp in employees:
        c = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id == emp.id).scalar() or 0
        emp_load[emp.id] = c

    # Round robin allocation prioritizing lowest load
    emp_ids_cycle = sorted([emp.id for emp in employees], key=lambda x: emp_load[x])
    distribution_result = {emp.id: 0 for emp in employees}

    idx = 0
    num_emps = len(emp_ids_cycle)

    for lead in leads:
        assigned_emp_id = emp_ids_cycle[idx % num_emps]
        lead.assigned_employee_id = assigned_emp_id
        if lead.lead_status == LeadStatus.NEW:
            lead.lead_status = LeadStatus.ASSIGNED

        history = LeadAssignmentHistory(
            lead_id=lead.id,
            assigned_to_employee_id=assigned_emp_id,
            assigned_by_user_id=admin.id,
            notes=data.notes or "Distributed via smart balanced algorithm"
        )
        db.add(history)
        distribution_result[assigned_emp_id] += 1
        emp_load[assigned_emp_id] += 1
        idx += 1

    db.commit()

    # Create notifications for affected staff
    for emp in employees:
        count = distribution_result.get(emp.id, 0)
        if count > 0:
            create_notification(
                db=db,
                user_id=emp.user_id,
                title="Leads Distributed",
                message=f"You have been assigned {count} new customer leads.",
                notification_type="INFO",
                link_url="/staff/leads"
            )

    log_activity(db, admin.id, "BALANCED_DISTRIBUTE", "Lead", len(leads), f"Distributed {len(leads)} leads among {len(employees)} employees")

    return {
        "message": f"Successfully distributed {len(leads)} leads among {len(employees)} employees",
        "total_distributed": len(leads),
        "breakdown": distribution_result
    }

@router.get("/recent-history", response_model=List[LeadAssignmentHistoryResponse])
def get_recent_distribution_history(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    history = db.query(LeadAssignmentHistory).order_by(desc(LeadAssignmentHistory.assigned_at)).limit(50).all()
    result = []
    for h in history:
        result.append({
            "id": h.id,
            "lead_id": h.lead_id,
            "assigned_to_employee_id": h.assigned_to_employee_id,
            "assigned_to_name": h.assigned_to.full_name if h.assigned_to else "Unassigned",
            "assigned_by_name": h.assigned_by.email if h.assigned_by else "Admin",
            "assigned_at": h.assigned_at,
            "notes": h.notes
        })
    return result
