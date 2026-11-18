from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.core.dependencies import require_admin, get_current_active_user
from app.models import User, Bank, LoanScheme, LoanType
from app.schemas import SchemeCreate, SchemeUpdate, SchemeResponse
from app.utils.helpers import log_activity

router = APIRouter(prefix="/schemes", tags=["Loan Scheme Management"])

@router.get("", response_model=List[SchemeResponse])
def get_schemes(
    bank_id: Optional[int] = None,
    loan_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(LoanScheme).join(Bank)
    if bank_id:
        query = query.filter(LoanScheme.bank_id == bank_id)
    if loan_type:
        query = query.filter(LoanScheme.loan_type == loan_type)
    if status:
        query = query.filter(LoanScheme.status == status)

    schemes = query.order_by(LoanScheme.scheme_name.asc()).all()
    result = []
    for s in schemes:
        result.append({
            "id": s.id,
            "bank_id": s.bank_id,
            "bank_name": s.bank.bank_name if s.bank else None,
            "scheme_name": s.scheme_name,
            "loan_type": s.loan_type,
            "min_loan_amount": s.min_loan_amount,
            "max_loan_amount": s.max_loan_amount,
            "interest_rate": s.interest_rate,
            "min_eligibility_criteria": s.min_eligibility_criteria,
            "loan_tenure": s.loan_tenure,
            "processing_fee": s.processing_fee,
            "description": s.description,
            "status": s.status,
            "created_at": s.created_at
        })
    return result

@router.post("", response_model=SchemeResponse)
def create_scheme(
    data: SchemeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    bank = db.query(Bank).filter(Bank.id == data.bank_id).first()
    if not bank:
        raise HTTPException(status_code=400, detail="Associated bank does not exist")

    scheme = LoanScheme(
        bank_id=data.bank_id,
        scheme_name=data.scheme_name,
        loan_type=data.loan_type,
        min_loan_amount=data.min_loan_amount or 10000.0,
        max_loan_amount=data.max_loan_amount or 10000000.0,
        interest_rate=data.interest_rate,
        min_eligibility_criteria=data.min_eligibility_criteria,
        loan_tenure=data.loan_tenure or "12 to 84 months",
        processing_fee=data.processing_fee or "1% of loan amount",
        description=data.description,
        status=data.status or "ACTIVE"
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)

    log_activity(db, admin.id, "CREATE_SCHEME", "LoanScheme", scheme.id, f"Created {scheme.scheme_name} for {bank.bank_name}")

    return {
        "id": scheme.id,
        "bank_id": scheme.bank_id,
        "bank_name": bank.bank_name,
        "scheme_name": scheme.scheme_name,
        "loan_type": scheme.loan_type,
        "min_loan_amount": scheme.min_loan_amount,
        "max_loan_amount": scheme.max_loan_amount,
        "interest_rate": scheme.interest_rate,
        "min_eligibility_criteria": scheme.min_eligibility_criteria,
        "loan_tenure": scheme.loan_tenure,
        "processing_fee": scheme.processing_fee,
        "description": scheme.description,
        "status": scheme.status,
        "created_at": scheme.created_at
    }

@router.get("/{id}", response_model=SchemeResponse)
def get_scheme(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    s = db.query(LoanScheme).filter(LoanScheme.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")

    return {
        "id": s.id,
        "bank_id": s.bank_id,
        "bank_name": s.bank.bank_name if s.bank else None,
        "scheme_name": s.scheme_name,
        "loan_type": s.loan_type,
        "min_loan_amount": s.min_loan_amount,
        "max_loan_amount": s.max_loan_amount,
        "interest_rate": s.interest_rate,
        "min_eligibility_criteria": s.min_eligibility_criteria,
        "loan_tenure": s.loan_tenure,
        "processing_fee": s.processing_fee,
        "description": s.description,
        "status": s.status,
        "created_at": s.created_at
    }

@router.put("/{id}", response_model=SchemeResponse)
def update_scheme(
    id: int,
    data: SchemeUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    s = db.query(LoanScheme).filter(LoanScheme.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")

    for field, val in data.dict(exclude_unset=True).items():
        setattr(s, field, val)

    db.commit()
    db.refresh(s)
    log_activity(db, admin.id, "UPDATE_SCHEME", "LoanScheme", s.id, f"Updated {s.scheme_name}")

    return {
        "id": s.id,
        "bank_id": s.bank_id,
        "bank_name": s.bank.bank_name if s.bank else None,
        "scheme_name": s.scheme_name,
        "loan_type": s.loan_type,
        "min_loan_amount": s.min_loan_amount,
        "max_loan_amount": s.max_loan_amount,
        "interest_rate": s.interest_rate,
        "min_eligibility_criteria": s.min_eligibility_criteria,
        "loan_tenure": s.loan_tenure,
        "processing_fee": s.processing_fee,
        "description": s.description,
        "status": s.status,
        "created_at": s.created_at
    }

@router.delete("/{id}")
def delete_scheme(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    s = db.query(LoanScheme).filter(LoanScheme.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")

    db.delete(s)
    db.commit()
    log_activity(db, admin.id, "DELETE_SCHEME", "LoanScheme", id, f"Deleted scheme {id}")
    return {"message": "Scheme deleted successfully"}
