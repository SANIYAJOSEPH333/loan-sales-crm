import io
import csv
import openpyxl
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from app.database.session import get_db
from app.core.dependencies import require_admin
from app.models import User, Lead, LeadStatus, LoanType, EmploymentType, LeadSource
from app.utils.helpers import log_activity
from pydantic import BaseModel

router = APIRouter(prefix="/bulk-upload", tags=["Bulk Lead Upload"])

class ImportRow(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    employment_type: Optional[str] = "SALARIED"
    monthly_income: Optional[float] = 0.0
    required_loan_amount: Optional[float] = 0.0
    loan_type: Optional[str] = "PERSONAL_LOAN"

class ImportRequest(BaseModel):
    leads: List[ImportRow]
    lead_source: Optional[str] = "BULK_UPLOAD"

@router.post("/preview")
async def preview_lead_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    filename = file.filename.lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")

    content = await file.read()
    rows = []

    # Parse CSV or XLSX
    try:
        if filename.endswith(".csv"):
            decoded = content.decode("utf-8-sig", errors="ignore")
            reader = csv.DictReader(io.StringIO(decoded))
            for r in reader:
                # normalize keys to lowercase and stripped
                normalized = {k.strip().lower().replace(" ", "_"): str(v).strip() for k, v in r.items() if k}
                rows.append(normalized)
        else:
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            headers = []
            for cell in sheet[1]:
                headers.append(str(cell.value or "").strip().lower().replace(" ", "_"))
            
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not any(row):
                    continue
                row_dict = {}
                for i, h in enumerate(headers):
                    if h and i < len(row):
                        row_dict[h] = str(row[i] or "").strip()
                rows.append(row_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data rows.")

    # Validation and duplicate detection
    existing_phones = set(p[0] for p in db.query(Lead.phone_number).all() if p[0])
    existing_emails = set(e[0].lower() for e in db.query(Lead.email).all() if e[0])

    valid_rows = []
    invalid_rows = []
    seen_in_file = set()

    for idx, r in enumerate(rows, start=1):
        # find field names flexibly
        full_name = r.get("full_name") or r.get("name") or r.get("customer_name") or ""
        phone = r.get("phone_number") or r.get("phone") or r.get("mobile") or r.get("contact") or ""
        email = r.get("email") or r.get("email_address") or ""
        city = r.get("city") or ""
        address = r.get("address") or ""
        emp_type = r.get("employment_type") or "SALARIED"
        monthly_income_str = r.get("monthly_income") or r.get("income") or "0"
        required_loan_str = r.get("required_loan_amount") or r.get("loan_amount") or "0"
        loan_type_str = r.get("loan_type") or "PERSONAL_LOAN"

        errors = []
        if not full_name:
            errors.append("Full Name is mandatory")
        if not phone:
            errors.append("Phone Number is mandatory")
        elif len(phone.replace(" ", "").replace("-", "")) < 7:
            errors.append("Invalid phone number format")

        clean_phone = phone.replace(" ", "").replace("-", "")
        if clean_phone in existing_phones:
            errors.append("Duplicate: Phone number already exists in database")
        elif clean_phone in seen_in_file:
            errors.append("Duplicate: Phone number appears multiple times in file")
        else:
            seen_in_file.add(clean_phone)

        if email and email.lower() in existing_emails:
            errors.append("Duplicate: Email already exists in database")

        try:
            monthly_income = float(monthly_income_str.replace(",", "").replace("$", "").replace("₹", ""))
        except Exception:
            monthly_income = 0.0

        try:
            required_loan = float(required_loan_str.replace(",", "").replace("$", "").replace("₹", ""))
        except Exception:
            required_loan = 0.0

        row_item = {
            "row_index": idx,
            "full_name": full_name,
            "phone_number": phone,
            "email": email or None,
            "city": city or None,
            "address": address or None,
            "employment_type": emp_type.upper() if emp_type else "SALARIED",
            "monthly_income": monthly_income,
            "required_loan_amount": required_loan,
            "loan_type": loan_type_str.upper() if loan_type_str else "PERSONAL_LOAN",
            "errors": errors,
            "is_valid": len(errors) == 0
        }

        if len(errors) == 0:
            valid_rows.append(row_item)
        else:
            invalid_rows.append(row_item)

    return {
        "filename": filename,
        "total_rows": len(rows),
        "valid_count": len(valid_rows),
        "invalid_count": len(invalid_rows),
        "valid_preview": valid_rows[:50],  # preview up to 50
        "invalid_preview": invalid_rows[:50]
    }

@router.post("/import")
def import_valid_leads(
    data: ImportRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if not data.leads:
        raise HTTPException(status_code=400, detail="No leads provided for import")

    count = db.query(func.count(Lead.id)).scalar() or 0
    imported_count = 0

    for item in data.leads:
        count += 1
        code = f"CUST{count:05d}"

        # check loan type validity
        loan_type = LoanType.PERSONAL_LOAN
        try:
            loan_type = LoanType(item.loan_type)
        except Exception:
            pass

        # check employment type validity
        emp_type = EmploymentType.SALARIED
        try:
            emp_type = EmploymentType(item.employment_type)
        except Exception:
            pass

        lead = Lead(
            customer_code=code,
            full_name=item.full_name,
            phone_number=item.phone_number,
            email=item.email,
            address=item.address,
            city=item.city,
            employment_type=emp_type,
            monthly_income=item.monthly_income or 0.0,
            required_loan_amount=item.required_loan_amount or 0.0,
            loan_type=loan_type,
            lead_source=LeadSource.BULK_UPLOAD,
            lead_status=LeadStatus.NEW
        )
        db.add(lead)
        imported_count += 1

    db.commit()
    log_activity(db, admin.id, "BULK_IMPORT_LEADS", "Lead", imported_count, f"Imported {imported_count} leads via bulk upload")

    return {
        "message": f"Successfully imported {imported_count} customer leads",
        "imported_count": imported_count
    }
