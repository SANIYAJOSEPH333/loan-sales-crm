from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import require_admin, get_current_active_user
from app.models import User, Bank, LoanScheme
from app.schemas import BankCreate, BankUpdate, BankResponse
from app.utils.helpers import log_activity

router = APIRouter(prefix="/banks", tags=["Bank Management"])

@router.get("", response_model=List[BankResponse])
def get_banks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Bank)
    if status:
        query = query.filter(Bank.status == status)
    
    banks = query.order_by(Bank.bank_name.asc()).all()
    result = []
    for b in banks:
        schemes_count = db.query(func.count(LoanScheme.id)).filter(LoanScheme.bank_id == b.id).scalar() or 0
        result.append({
            "id": b.id,
            "bank_name": b.bank_name,
            "bank_code": b.bank_code,
            "contact_person": b.contact_person,
            "contact_number": b.contact_number,
            "email": b.email,
            "address": b.address,
            "status": b.status,
            "created_at": b.created_at,
            "schemes_count": schemes_count
        })
    return result

@router.post("", response_model=BankResponse)
def create_bank(
    data: BankCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing = db.query(Bank).filter(
        (Bank.bank_name == data.bank_name) | (Bank.bank_code == data.bank_code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bank with this name or code already exists")

    bank = Bank(
        bank_name=data.bank_name,
        bank_code=data.bank_code.upper(),
        contact_person=data.contact_person,
        contact_number=data.contact_number,
        email=data.email,
        address=data.address,
        status=data.status or "ACTIVE"
    )
    db.add(bank)
    db.commit()
    db.refresh(bank)

    log_activity(db, admin.id, "CREATE_BANK", "Bank", bank.id, f"Created {bank.bank_name} ({bank.bank_code})")

    return {
        "id": bank.id,
        "bank_name": bank.bank_name,
        "bank_code": bank.bank_code,
        "contact_person": bank.contact_person,
        "contact_number": bank.contact_number,
        "email": bank.email,
        "address": bank.address,
        "status": bank.status,
        "created_at": bank.created_at,
        "schemes_count": 0
    }

@router.get("/{id}", response_model=BankResponse)
def get_bank(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    bank = db.query(Bank).filter(Bank.id == id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    schemes_count = db.query(func.count(LoanScheme.id)).filter(LoanScheme.bank_id == bank.id).scalar() or 0
    return {
        "id": bank.id,
        "bank_name": bank.bank_name,
        "bank_code": bank.bank_code,
        "contact_person": bank.contact_person,
        "contact_number": bank.contact_number,
        "email": bank.email,
        "address": bank.address,
        "status": bank.status,
        "created_at": bank.created_at,
        "schemes_count": schemes_count
    }

@router.put("/{id}", response_model=BankResponse)
def update_bank(
    id: int,
    data: BankUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    bank = db.query(Bank).filter(Bank.id == id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    for field, val in data.dict(exclude_unset=True).items():
        if field == "bank_code" and val:
            val = val.upper()
        setattr(bank, field, val)

    db.commit()
    db.refresh(bank)
    log_activity(db, admin.id, "UPDATE_BANK", "Bank", bank.id, f"Updated {bank.bank_name}")

    schemes_count = db.query(func.count(LoanScheme.id)).filter(LoanScheme.bank_id == bank.id).scalar() or 0
    return {
        "id": bank.id,
        "bank_name": bank.bank_name,
        "bank_code": bank.bank_code,
        "contact_person": bank.contact_person,
        "contact_number": bank.contact_number,
        "email": bank.email,
        "address": bank.address,
        "status": bank.status,
        "created_at": bank.created_at,
        "schemes_count": schemes_count
    }

@router.delete("/{id}")
def delete_bank(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    bank = db.query(Bank).filter(Bank.id == id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    db.delete(bank)
    db.commit()
    log_activity(db, admin.id, "DELETE_BANK", "Bank", id, f"Deleted bank {id}")
    return {"message": "Bank deleted successfully"}
