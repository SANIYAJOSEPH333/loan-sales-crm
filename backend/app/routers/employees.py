from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Optional
from app.database.session import get_db
from app.core.security import get_password_hash
from app.core.dependencies import require_admin, get_current_active_user
from app.models import User, Employee, CallLog, Lead, UserRole, EmployeeStatus
from app.schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    EmployeeTargetUpdate, PasswordChangeRequest
)
from app.utils.helpers import log_activity

router = APIRouter(prefix="/employees", tags=["Employee Management"])

@router.get("", response_model=List[EmployeeResponse])
def get_employees(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Employee).join(User)
    if status:
        query = query.filter(Employee.status == status)
    
    employees = query.order_by(Employee.employee_code.asc()).all()
    today = date.today()
    
    result = []
    for emp in employees:
        calls_today = db.query(func.count(CallLog.id)).filter(
            CallLog.employee_id == emp.id,
            CallLog.call_date == today
        ).scalar() or 0

        leads_count = db.query(func.count(Lead.id)).filter(
            Lead.assigned_employee_id == emp.id
        ).scalar() or 0

        emp_dict = {
            "id": emp.id,
            "user_id": emp.user_id,
            "employee_code": emp.employee_code,
            "full_name": emp.full_name,
            "email": emp.user.email if emp.user else None,
            "phone": emp.phone,
            "joining_date": emp.joining_date,
            "role": emp.role,
            "status": emp.status,
            "daily_call_target": emp.daily_call_target,
            "created_at": emp.created_at,
            "calls_completed_today": calls_today,
            "assigned_leads_count": leads_count
        }
        result.append(emp_dict)
    
    return result

@router.post("", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Generate employee code
    count = db.query(func.count(Employee.id)).scalar() or 0
    code = f"EMP{count + 1:03d}"

    # Create User
    user = User(
        email=data.email.strip().lower(),
        hashed_password=get_password_hash(data.password),
        role=UserRole.STAFF,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create Employee profile
    employee = Employee(
        user_id=user.id,
        employee_code=code,
        full_name=data.full_name,
        phone=data.phone,
        joining_date=data.joining_date or date.today(),
        role=data.role or "Call Centre Executive",
        status=EmployeeStatus.ACTIVE,
        daily_call_target=data.daily_call_target or 100
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    log_activity(db, admin.id, "CREATE_EMPLOYEE", "Employee", employee.id, f"Created {employee.full_name} ({code})")

    return {
        "id": employee.id,
        "user_id": employee.user_id,
        "employee_code": employee.employee_code,
        "full_name": employee.full_name,
        "email": user.email,
        "phone": employee.phone,
        "joining_date": employee.joining_date,
        "role": employee.role,
        "status": employee.status,
        "daily_call_target": employee.daily_call_target,
        "created_at": employee.created_at,
        "calls_completed_today": 0,
        "assigned_leads_count": 0
    }

@router.get("/{id}", response_model=EmployeeResponse)
def get_employee(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = date.today()
    calls_today = db.query(func.count(CallLog.id)).filter(
        CallLog.employee_id == emp.id,
        CallLog.call_date == today
    ).scalar() or 0

    leads_count = db.query(func.count(Lead.id)).filter(
        Lead.assigned_employee_id == emp.id
    ).scalar() or 0

    return {
        "id": emp.id,
        "user_id": emp.user_id,
        "employee_code": emp.employee_code,
        "full_name": emp.full_name,
        "email": emp.user.email if emp.user else None,
        "phone": emp.phone,
        "joining_date": emp.joining_date,
        "role": emp.role,
        "status": emp.status,
        "daily_call_target": emp.daily_call_target,
        "created_at": emp.created_at,
        "calls_completed_today": calls_today,
        "assigned_leads_count": leads_count
    }

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if data.full_name is not None:
        emp.full_name = data.full_name
    if data.phone is not None:
        emp.phone = data.phone
    if data.role is not None:
        emp.role = data.role
    if data.status is not None:
        emp.status = data.status
        if emp.user:
            emp.user.is_active = (data.status == EmployeeStatus.ACTIVE)
    if data.daily_call_target is not None:
        emp.daily_call_target = data.daily_call_target

    db.commit()
    db.refresh(emp)
    log_activity(db, admin.id, "UPDATE_EMPLOYEE", "Employee", emp.id, f"Updated {emp.full_name}")

    return {
        "id": emp.id,
        "user_id": emp.user_id,
        "employee_code": emp.employee_code,
        "full_name": emp.full_name,
        "email": emp.user.email if emp.user else None,
        "phone": emp.phone,
        "joining_date": emp.joining_date,
        "role": emp.role,
        "status": emp.status,
        "daily_call_target": emp.daily_call_target,
        "created_at": emp.created_at,
        "calls_completed_today": 0,
        "assigned_leads_count": 0
    }

@router.patch("/{id}/target")
def update_employee_target(
    id: int,
    data: EmployeeTargetUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.daily_call_target = data.daily_call_target
    db.commit()
    log_activity(db, admin.id, "UPDATE_TARGET", "Employee", emp.id, f"Updated target to {data.daily_call_target}")
    return {"message": "Target updated successfully", "daily_call_target": emp.daily_call_target}

@router.patch("/{id}/toggle-status")
def toggle_employee_status(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_status = EmployeeStatus.INACTIVE if emp.status == EmployeeStatus.ACTIVE else EmployeeStatus.ACTIVE
    emp.status = new_status
    if emp.user:
        emp.user.is_active = (new_status == EmployeeStatus.ACTIVE)
    
    db.commit()
    log_activity(db, admin.id, "TOGGLE_EMPLOYEE_STATUS", "Employee", emp.id, f"Status changed to {new_status.value}")
    return {"message": f"Employee status updated to {new_status.value}", "status": new_status.value}

@router.post("/{id}/reset-password")
def reset_employee_password(
    id: int,
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp or not emp.user:
        raise HTTPException(status_code=404, detail="Employee account not found")

    emp.user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    log_activity(db, admin.id, "RESET_PASSWORD", "Employee", emp.id, f"Reset password for {emp.full_name}")
    return {"message": "Employee password reset successfully"}

@router.delete("/{id}")
def delete_employee(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user_id = emp.user_id
    db.delete(emp)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
    db.commit()
    log_activity(db, admin.id, "DELETE_EMPLOYEE", "Employee", id, f"Deleted employee {id}")
    return {"message": "Employee deleted successfully"}
