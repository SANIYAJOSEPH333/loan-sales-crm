import re
from typing import Optional, List, Any
from datetime import datetime, date, time
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models import (
    UserRole, EmployeeStatus, EmploymentType, LoanType,
    LeadSource, LeadStatus, CallOutcome, FollowUpStatus,
    DocumentType, VerificationStatus, ApplicationStatus
)

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    full_name: str
    employee_id: Optional[int] = None
    user_id: int

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
    employee_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordChangeRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str

# User Schemas
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    joining_date: Optional[date] = None
    role: Optional[str] = "Call Centre Executive"
    daily_call_target: Optional[int] = 100

class EmployeeCreate(EmployeeBase):
    email: EmailStr
    password: str

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[EmployeeStatus] = None
    daily_call_target: Optional[int] = None

class EmployeeTargetUpdate(BaseModel):
    daily_call_target: int = Field(gt=0, description="Daily call target")

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    employee_code: str
    email: Optional[str] = None
    status: EmployeeStatus
    created_at: datetime
    calls_completed_today: Optional[int] = 0
    assigned_leads_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Lead Schemas
class LeadBase(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    employment_type: Optional[EmploymentType] = EmploymentType.SALARIED
    monthly_income: Optional[float] = 0.0
    required_loan_amount: Optional[float] = 0.0
    loan_type: Optional[LoanType] = LoanType.PERSONAL_LOAN
    lead_source: Optional[LeadSource] = LeadSource.WEBSITE

    @field_validator("monthly_income", "required_loan_amount", mode="before")
    @classmethod
    def sanitize_amount(cls, v):
        if v is None or v == "":
            return 0.0
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            cleaned = re.sub(r"[^\d.-]", "", v.strip())
            return float(cleaned) if cleaned else 0.0
        return v

class LeadCreate(LeadBase):
    lead_status: Optional[LeadStatus] = LeadStatus.NEW
    assigned_employee_id: Optional[int] = None

class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    monthly_income: Optional[float] = None
    required_loan_amount: Optional[float] = None
    loan_type: Optional[LoanType] = None
    lead_source: Optional[LeadSource] = None
    lead_status: Optional[LeadStatus] = None
    assigned_employee_id: Optional[int] = None

    @field_validator("monthly_income", "required_loan_amount", mode="before")
    @classmethod
    def sanitize_amount(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            cleaned = re.sub(r"[^\d.-]", "", v.strip())
            return float(cleaned) if cleaned else None
        return v

class LeadAssignmentRequest(BaseModel):
    lead_ids: List[int]
    employee_id: int
    notes: Optional[str] = None

class BalancedDistributionRequest(BaseModel):
    lead_ids: List[int]
    employee_ids: List[int]
    notes: Optional[str] = None

class LeadAssignmentHistoryResponse(BaseModel):
    id: int
    lead_id: int
    assigned_to_employee_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    assigned_by_name: Optional[str] = None
    assigned_at: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class LeadResponse(LeadBase):
    id: int
    customer_code: str
    lead_status: LeadStatus
    assigned_employee_id: Optional[int] = None
    assigned_employee_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Call Log Schemas
class CallLogCreate(BaseModel):
    lead_id: int
    call_date: Optional[date] = None
    call_time: Optional[time] = None
    outcome: CallOutcome
    remarks: Optional[str] = None
    next_follow_up_date: Optional[date] = None
    next_follow_up_time: Optional[time] = None

class CallLogResponse(BaseModel):
    id: int
    lead_id: int
    employee_id: int
    employee_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    call_date: date
    call_time: time
    outcome: CallOutcome
    remarks: Optional[str] = None
    next_follow_up_date: Optional[date] = None
    next_follow_up_time: Optional[time] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Follow-up Schemas
class FollowUpCreate(BaseModel):
    lead_id: int
    scheduled_date: date
    scheduled_time: Optional[time] = None
    remarks: Optional[str] = None

class FollowUpUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    status: Optional[FollowUpStatus] = None
    remarks: Optional[str] = None

class FollowUpResponse(BaseModel):
    id: int
    lead_id: int
    employee_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    employee_name: Optional[str] = None
    scheduled_date: date
    scheduled_time: Optional[time] = None
    status: FollowUpStatus
    remarks: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentVerifyRequest(BaseModel):
    verification_status: VerificationStatus  # VERIFIED or REJECTED
    rejection_remarks: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    lead_id: int
    customer_name: Optional[str] = None
    document_type: DocumentType
    file_name: str
    file_size: int
    mime_type: Optional[str] = None
    verification_status: VerificationStatus
    rejection_remarks: Optional[str] = None
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    uploaded_by_name: Optional[str] = None
    verified_by_name: Optional[str] = None

    class Config:
        from_attributes = True

# Bank Schemas
class BankBase(BaseModel):
    bank_name: str
    bank_code: str
    contact_person: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class BankCreate(BankBase):
    pass

class BankUpdate(BaseModel):
    bank_name: Optional[str] = None
    bank_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    status: Optional[str] = None

class BankResponse(BankBase):
    id: int
    created_at: datetime
    schemes_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Loan Scheme Schemas
class SchemeBase(BaseModel):
    bank_id: int
    scheme_name: str
    loan_type: LoanType
    min_loan_amount: Optional[float] = 10000.0
    max_loan_amount: Optional[float] = 10000000.0
    interest_rate: float
    min_eligibility_criteria: Optional[str] = None
    loan_tenure: Optional[str] = "12 to 84 months"
    processing_fee: Optional[str] = "1% of loan amount"
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class SchemeCreate(SchemeBase):
    pass

class SchemeUpdate(BaseModel):
    bank_id: Optional[int] = None
    scheme_name: Optional[str] = None
    loan_type: Optional[LoanType] = None
    min_loan_amount: Optional[float] = None
    max_loan_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    min_eligibility_criteria: Optional[str] = None
    loan_tenure: Optional[str] = None
    processing_fee: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class SchemeResponse(SchemeBase):
    id: int
    bank_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Loan Application Schemas
class ApplicationCreate(BaseModel):
    lead_id: int
    bank_id: int
    scheme_id: int
    requested_amount: float
    remarks: Optional[str] = None

class ApplicationUpdate(BaseModel):
    bank_id: Optional[int] = None
    scheme_id: Optional[int] = None
    requested_amount: Optional[float] = None
    status: Optional[ApplicationStatus] = None
    remarks: Optional[str] = None

class ApplicationApprovalRequest(BaseModel):
    approved_amount: float
    approval_date: Optional[date] = None
    remarks: Optional[str] = None

class ApplicationRejectionRequest(BaseModel):
    rejection_reason: str
    remarks: Optional[str] = None

class ApplicationDisbursementRequest(BaseModel):
    disbursed_amount: float
    disbursement_date: Optional[date] = None
    remarks: Optional[str] = None

class ApplicationClosureRequest(BaseModel):
    closed_date: Optional[date] = None
    remarks: Optional[str] = None

class ApplicationHistoryResponse(BaseModel):
    id: int
    application_id: int
    status_from: Optional[str] = None
    status_to: str
    changed_by_name: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    lead_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    bank_id: int
    bank_name: Optional[str] = None
    scheme_id: int
    scheme_name: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    assigned_employee_name: Optional[str] = None
    requested_amount: float
    approved_amount: Optional[float] = None
    disbursed_amount: Optional[float] = None
    status: ApplicationStatus
    remarks: Optional[str] = None
    approval_date: Optional[date] = None
    rejection_reason: Optional[str] = None
    disbursement_date: Optional[date] = None
    closed_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    history: Optional[List[ApplicationHistoryResponse]] = []

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    notification_type: str
    link_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Activity Log Schema
class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
