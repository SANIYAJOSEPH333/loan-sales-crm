import enum
from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Float, ForeignKey, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.database.session import Base

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class EmploymentType(str, enum.Enum):
    SALARIED = "SALARIED"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    BUSINESS = "BUSINESS"
    OTHER = "OTHER"

class LoanType(str, enum.Enum):
    PERSONAL_LOAN = "PERSONAL_LOAN"
    HOME_LOAN = "HOME_LOAN"
    BUSINESS_LOAN = "BUSINESS_LOAN"
    VEHICLE_LOAN = "VEHICLE_LOAN"
    EDUCATION_LOAN = "EDUCATION_LOAN"
    GOLD_LOAN = "GOLD_LOAN"
    MORTGAGE_LOAN = "MORTGAGE_LOAN"

class LeadSource(str, enum.Enum):
    WEBSITE = "WEBSITE"
    CALL_INQUIRY = "CALL_INQUIRY"
    REFERRAL = "REFERRAL"
    PARTNER_BANK = "PARTNER_BANK"
    CAMPAIGN = "CAMPAIGN"
    WALK_IN = "WALK_IN"
    BULK_UPLOAD = "BULK_UPLOAD"

class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    CONTACTED = "CONTACTED"
    INTERESTED = "INTERESTED"
    NOT_INTERESTED = "NOT_INTERESTED"
    FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED"
    DOCUMENTS_PENDING = "DOCUMENTS_PENDING"
    APPLICATION_PROCESSING = "APPLICATION_PROCESSING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"

class CallOutcome(str, enum.Enum):
    INTERESTED = "INTERESTED"
    NOT_INTERESTED = "NOT_INTERESTED"
    NO_ANSWER = "NO_ANSWER"
    BUSY = "BUSY"
    CALL_BACK_LATER = "CALL_BACK_LATER"
    WRONG_NUMBER = "WRONG_NUMBER"
    FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED"

class FollowUpStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    RESCHEDULED = "RESCHEDULED"
    OVERDUE = "OVERDUE"

class DocumentType(str, enum.Enum):
    AADHAAR_CARD = "AADHAAR_CARD"
    PAN_CARD = "PAN_CARD"
    SALARY_SLIPS = "SALARY_SLIPS"
    BANK_STATEMENTS = "BANK_STATEMENTS"
    EMPLOYMENT_PROOF = "EMPLOYMENT_PROOF"
    ADDRESS_PROOF = "ADDRESS_PROOF"
    OTHER = "OTHER"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ADDITIONAL_DOCUMENTS_REQUIRED = "ADDITIONAL_DOCUMENTS_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"
    CLOSED = "CLOSED"


# Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, native_enum=False), default=UserRole.STAFF, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    joining_date = Column(Date, default=date.today, nullable=False)
    role = Column(String(100), default="Call Centre Executive", nullable=False)
    status = Column(SQLEnum(EmployeeStatus, native_enum=False), default=EmployeeStatus.ACTIVE, nullable=False)
    daily_call_target = Column(Integer, default=100, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="employee")
    assigned_leads = relationship("Lead", back_populates="assigned_employee")
    call_logs = relationship("CallLog", back_populates="employee")
    follow_ups = relationship("FollowUp", back_populates="employee")
    loan_applications = relationship("LoanApplication", back_populates="assigned_employee")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), index=True, nullable=False)
    phone_number = Column(String(50), index=True, nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), index=True, nullable=True)
    employment_type = Column(SQLEnum(EmploymentType, native_enum=False), default=EmploymentType.SALARIED, nullable=False)
    monthly_income = Column(Float, default=0.0, nullable=False)
    required_loan_amount = Column(Float, default=0.0, nullable=False)
    loan_type = Column(SQLEnum(LoanType, native_enum=False), default=LoanType.PERSONAL_LOAN, nullable=False)
    lead_source = Column(SQLEnum(LeadSource, native_enum=False), default=LeadSource.WEBSITE, nullable=False)
    lead_status = Column(SQLEnum(LeadStatus, native_enum=False), default=LeadStatus.NEW, nullable=False, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    assigned_employee = relationship("Employee", back_populates="assigned_leads")
    calls = relationship("CallLog", back_populates="lead", cascade="all, delete-orphan", order_by="desc(CallLog.created_at)")
    follow_ups = relationship("FollowUp", back_populates="lead", cascade="all, delete-orphan", order_by="desc(FollowUp.scheduled_date)")
    documents = relationship("CustomerDocument", back_populates="lead", cascade="all, delete-orphan")
    loan_applications = relationship("LoanApplication", back_populates="lead", cascade="all, delete-orphan")
    assignment_history = relationship("LeadAssignmentHistory", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadAssignmentHistory.assigned_at)")


class LeadAssignmentHistory(Base):
    __tablename__ = "lead_assignment_history"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)

    lead = relationship("Lead", back_populates="assignment_history")
    assigned_to = relationship("Employee", foreign_keys=[assigned_to_employee_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_user_id])


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    call_date = Column(Date, default=date.today, nullable=False, index=True)
    call_time = Column(Time, nullable=False)
    outcome = Column(SQLEnum(CallOutcome, native_enum=False), nullable=False, index=True)
    remarks = Column(Text, nullable=True)
    next_follow_up_date = Column(Date, nullable=True)
    next_follow_up_time = Column(Time, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="calls")
    employee = relationship("Employee", back_populates="call_logs")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_time = Column(Time, nullable=True)
    status = Column(SQLEnum(FollowUpStatus, native_enum=False), default=FollowUpStatus.PENDING, nullable=False, index=True)
    remarks = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="follow_ups")
    employee = relationship("Employee", back_populates="follow_ups")


class CustomerDocument(Base):
    __tablename__ = "customer_documents"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(SQLEnum(DocumentType, native_enum=False), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)  # in bytes
    mime_type = Column(String(100), nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus, native_enum=False), default=VerificationStatus.PENDING, nullable=False, index=True)
    rejection_remarks = Column(Text, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)

    lead = relationship("Lead", back_populates="documents")
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])


class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(255), unique=True, index=True, nullable=False)
    bank_code = Column(String(50), unique=True, index=True, nullable=False)
    contact_person = Column(String(255), nullable=True)
    contact_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    schemes = relationship("LoanScheme", back_populates="bank", cascade="all, delete-orphan")
    loan_applications = relationship("LoanApplication", back_populates="bank")


class LoanScheme(Base):
    __tablename__ = "loan_schemes"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_name = Column(String(255), nullable=False)
    loan_type = Column(SQLEnum(LoanType, native_enum=False), nullable=False, index=True)
    min_loan_amount = Column(Float, default=10000.0, nullable=False)
    max_loan_amount = Column(Float, default=10000000.0, nullable=False)
    interest_rate = Column(Float, nullable=False)  # annual percentage, e.g. 8.5
    min_eligibility_criteria = Column(Text, nullable=True)
    loan_tenure = Column(String(100), default="12 to 84 months", nullable=False)
    processing_fee = Column(String(100), default="1% of loan amount", nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    bank = relationship("Bank", back_populates="schemes")
    loan_applications = relationship("LoanApplication", back_populates="scheme")


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id", ondelete="RESTRICT"), nullable=False, index=True)
    scheme_id = Column(Integer, ForeignKey("loan_schemes.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    requested_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    disbursed_amount = Column(Float, nullable=True)
    status = Column(SQLEnum(ApplicationStatus, native_enum=False), default=ApplicationStatus.DRAFT, nullable=False, index=True)
    remarks = Column(Text, nullable=True)
    approval_date = Column(Date, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    disbursement_date = Column(Date, nullable=True)
    closed_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lead = relationship("Lead", back_populates="loan_applications")
    bank = relationship("Bank", back_populates="loan_applications")
    scheme = relationship("LoanScheme", back_populates="loan_applications")
    assigned_employee = relationship("Employee", back_populates="loan_applications")
    history = relationship("LoanApplicationHistory", back_populates="application", cascade="all, delete-orphan", order_by="desc(LoanApplicationHistory.created_at)")


class LoanApplicationHistory(Base):
    __tablename__ = "loan_application_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    status_from = Column(String(50), nullable=True)
    status_to = Column(String(50), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("LoanApplication", back_populates="history")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    notification_type = Column(String(50), default="INFO", nullable=False)  # INFO, ALERT, SUCCESS, WARNING
    link_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="activities")
