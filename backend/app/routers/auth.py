from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_active_user
from app.models import User, Employee, UserRole
from app.schemas import LoginRequest, Token, PasswordChangeRequest, UserResponse
from app.utils.helpers import log_activity

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )

    employee_id = None
    full_name = "Administrator"
    if user.role == UserRole.STAFF:
        employee = db.query(Employee).filter(Employee.user_id == user.id).first()
        if employee:
            employee_id = employee.id
            full_name = employee.full_name
    elif user.role == UserRole.ADMIN:
        employee = db.query(Employee).filter(Employee.user_id == user.id).first()
        if employee:
            employee_id = employee.id
            full_name = employee.full_name

    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        employee_id=employee_id
    )

    log_activity(db, user.id, "USER_LOGIN", "User", user.id, f"User {user.email} logged in")

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role.value,
        email=user.email,
        full_name=full_name,
        employee_id=employee_id,
        user_id=user.id
    )

@router.get("/me")
def read_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    employee_data = None
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if employee:
        employee_data = {
            "id": employee.id,
            "employee_code": employee.employee_code,
            "full_name": employee.full_name,
            "phone": employee.phone,
            "role": employee.role,
            "daily_call_target": employee.daily_call_target,
            "status": employee.status
        }

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "employee": employee_data
    }

@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if data.old_password and not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    log_activity(db, current_user.id, "PASSWORD_CHANGED", "User", current_user.id)
    return {"message": "Password updated successfully"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    return {"message": "Logged out successfully"}
