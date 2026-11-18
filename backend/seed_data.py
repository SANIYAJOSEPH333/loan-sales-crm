import os
import sys
from datetime import date, datetime, time, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.realpath(os.path.dirname(__file__)))

from app.database.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    User, Employee, Lead, LeadAssignmentHistory, CallLog, FollowUp,
    CustomerDocument, Bank, LoanScheme, LoanApplication, LoanApplicationHistory,
    Notification, ActivityLog, UserRole, EmployeeStatus, EmploymentType,
    LoanType, LeadSource, LeadStatus, CallOutcome, FollowUpStatus,
    DocumentType, VerificationStatus, ApplicationStatus
)

def seed(reset: bool = False):
    db = SessionLocal()
    if reset or "--reset" in sys.argv:
        print("Resetting database tables...")
        Base.metadata.drop_all(bind=engine)
    
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@crm.com").first()
    if existing_admin and not (reset or "--reset" in sys.argv):
        print("Database already contains seed data. Skipping re-seed.")
        db.close()
        return

    print("Seeding Admin User...")
    admin_user = User(
        email="admin@crm.com",
        hashed_password=get_password_hash("Admin@123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.flush()

    admin_emp = Employee(
        user_id=admin_user.id,
        employee_code="ADM001",
        full_name="Rajesh Sharma (Admin)",
        phone="+91 98200 11223",
        role="Operations Manager & Admin",
        status=EmployeeStatus.ACTIVE,
        daily_call_target=100
    )
    db.add(admin_emp)

    print("Seeding 5 Staff Members...")
    staff_data = [
        {"name": "Priya Nair", "email": "staff1@crm.com", "phone": "+91 98110 54321", "role": "Senior Loan Sales Specialist", "target": 100},
        {"name": "Vikram Malhotra", "email": "staff2@crm.com", "phone": "+91 98220 65432", "role": "Call Centre Executive", "target": 100},
        {"name": "Ananya Desai", "email": "staff3@crm.com", "phone": "+91 98330 76543", "role": "Call Centre Executive", "target": 100},
        {"name": "Rahul Verma", "email": "staff4@crm.com", "phone": "+91 98440 87654", "role": "Customer Relationship Officer", "target": 100},
        {"name": "Sneha Kulkarni", "email": "staff5@crm.com", "phone": "+91 98550 98765", "role": "Call Centre Executive", "target": 100},
    ]

    staff_employees = []
    for idx, s in enumerate(staff_data, start=1):
        u = User(
            email=s["email"],
            hashed_password=get_password_hash("Staff@123"),
            role=UserRole.STAFF,
            is_active=True
        )
        db.add(u)
        db.flush()

        emp = Employee(
            user_id=u.id,
            employee_code=f"EMP{idx:03d}",
            full_name=s["name"],
            phone=s["phone"],
            role=s["role"],
            status=EmployeeStatus.ACTIVE,
            daily_call_target=s["target"]
        )
        db.add(emp)
        db.flush()
        staff_employees.append(emp)

    print("Seeding Partner Banks...")
    banks_info = [
        {"name": "HDFC Bank", "code": "HDFC", "person": "Rohan Gupta", "phone": "+91 22 6600 5500", "email": "loans@hdfcbank.com", "address": "HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai"},
        {"name": "ICICI Bank", "code": "ICICI", "person": "Kavita Rao", "phone": "+91 22 2653 1414", "email": "retail.loans@icicibank.com", "address": "ICICI Bank Towers, Bandra Kurla Complex, Mumbai"},
        {"name": "State Bank of India", "code": "SBI", "person": "Arun Kumar", "phone": "+91 22 2274 0000", "email": "loanprocessing@sbi.co.in", "address": "State Bank Bhavan, Madame Cama Road, Nariman Point, Mumbai"},
        {"name": "Axis Bank", "code": "AXIS", "person": "Deepak Mehta", "phone": "+91 22 2425 2525", "email": "priority.loans@axisbank.com", "address": "Axis House, Wadia International Centre, Worli, Mumbai"},
        {"name": "Kotak Mahindra Bank", "code": "KOTAK", "person": "Pooja Shah", "phone": "+91 22 6166 0001", "email": "consumerloans@kotak.com", "address": "27 BKC, Bandra Kurla Complex, Mumbai"},
        {"name": "Bank of Baroda", "code": "BOB", "person": "Sanjay Joshi", "phone": "+91 22 6698 5000", "email": "retail@bankofbaroda.com", "address": "Baroda Corporate Centre, C-26 G-Block, BKC, Mumbai"}
    ]

    banks = []
    for b in banks_info:
        bank = Bank(
            bank_name=b["name"],
            bank_code=b["code"],
            contact_person=b["person"],
            contact_number=b["phone"],
            email=b["email"],
            address=b["address"],
            status="ACTIVE"
        )
        db.add(bank)
        db.flush()
        banks.append(bank)

    print("Seeding Loan Schemes...")
    schemes_data = [
        {"bank_idx": 0, "name": "HDFC Platinum Home Loan", "type": LoanType.HOME_LOAN, "min": 500000, "max": 50000000, "rate": 8.50, "eligibility": "Min CIBIL 750, Salaried monthly income > ₹50,000", "tenure": "up to 30 years", "fee": "0.5% (Max ₹10,000)"},
        {"bank_idx": 0, "name": "HDFC Express Personal Loan", "type": LoanType.PERSONAL_LOAN, "min": 50000, "max": 4000000, "rate": 10.75, "eligibility": "Min CIBIL 720, Employment > 2 years", "tenure": "12 to 60 months", "fee": "1.5% of loan amount"},
        {"bank_idx": 1, "name": "ICICI Dream Home Loan", "type": LoanType.HOME_LOAN, "min": 500000, "max": 30000000, "rate": 8.65, "eligibility": "Min CIBIL 740, Age 21-65 years", "tenure": "up to 30 years", "fee": "0.5% + GST"},
        {"bank_idx": 1, "name": "ICICI Business Growth Loan", "type": LoanType.BUSINESS_LOAN, "min": 200000, "max": 10000000, "rate": 12.50, "eligibility": "Business vintage > 3 years, audited balance sheet", "tenure": "12 to 60 months", "fee": "2% of loan amount"},
        {"bank_idx": 2, "name": "SBI Regular Home Loan", "type": LoanType.HOME_LOAN, "min": 300000, "max": 100000000, "rate": 8.40, "eligibility": "Min CIBIL 700, All Indian residents", "tenure": "up to 30 years", "fee": "Zero fee promo"},
        {"bank_idx": 2, "name": "SBI Xpress Credit Personal Loan", "type": LoanType.PERSONAL_LOAN, "min": 25000, "max": 2000000, "rate": 10.30, "eligibility": "Salaried with salary account in SBI", "tenure": "up to 72 months", "fee": "1% of loan amount"},
        {"bank_idx": 3, "name": "Axis 24x7 Instant Personal Loan", "type": LoanType.PERSONAL_LOAN, "min": 50000, "max": 2500000, "rate": 10.99, "eligibility": "Salaried individuals, Min income ₹25,000", "tenure": "12 to 60 months", "fee": "1.5% to 2%"},
        {"bank_idx": 3, "name": "Axis Prime Auto Loan", "type": LoanType.VEHICLE_LOAN, "min": 100000, "max": 5000000, "rate": 8.90, "eligibility": "Income proof, ITR for last 2 years", "tenure": "up to 84 months", "fee": "₹3,500 flat"},
        {"bank_idx": 4, "name": "Kotak Smart Home Loan", "type": LoanType.HOME_LOAN, "min": 1000000, "max": 20000000, "rate": 8.70, "eligibility": "Min CIBIL 750, Salaried or Professional", "tenure": "up to 25 years", "fee": "0.5%"},
        {"bank_idx": 4, "name": "Kotak Business Quick Loan", "type": LoanType.BUSINESS_LOAN, "min": 300000, "max": 7500000, "rate": 13.00, "eligibility": "GST registered business for 2+ years", "tenure": "12 to 48 months", "fee": "2%"},
        {"bank_idx": 5, "name": "BOB Baroda Scholar Education Loan", "type": LoanType.EDUCATION_LOAN, "min": 100000, "max": 8000000, "rate": 9.15, "eligibility": "Secured admission in approved institution", "tenure": "up to 15 years", "fee": "Nil for India, 1% abroad"},
        {"bank_idx": 5, "name": "BOB Baroda Gold Loan", "type": LoanType.GOLD_LOAN, "min": 20000, "max": 5000000, "rate": 8.25, "eligibility": "Pledge of 18-22 karat gold ornaments", "tenure": "up to 12 months", "fee": "₹500"}
    ]

    schemes = []
    for s in schemes_data:
        scheme = LoanScheme(
            bank_id=banks[s["bank_idx"]].id,
            scheme_name=s["name"],
            loan_type=s["type"],
            min_loan_amount=s["min"],
            max_loan_amount=s["max"],
            interest_rate=s["rate"],
            min_eligibility_criteria=s["eligibility"],
            loan_tenure=s["tenure"],
            processing_fee=s["fee"],
            description=f"{s['name']} provided by {banks[s['bank_idx']].bank_name} with attractive interest rate of {s['rate']}%",
            status="ACTIVE"
        )
        db.add(scheme)
        db.flush()
        schemes.append(scheme)

    print("Seeding 35 Customer Leads...")
    customers_data = [
        ("Amitabh Sen", "+91 98201 11001", "amitabh.sen@gmail.com", "Bandra West, Mumbai", "Mumbai", EmploymentType.SALARIED, 120000, 3500000, LoanType.HOME_LOAN, LeadSource.WEBSITE, LeadStatus.APPROVED),
        ("Sunita Patil", "+91 98202 22002", "sunita.patil@outlook.com", "Kothrud, Pune", "Pune", EmploymentType.SALARIED, 65000, 800000, LoanType.PERSONAL_LOAN, LeadSource.CALL_INQUIRY, LeadStatus.DISBURSED),
        ("Rameshwar Chawla", "+91 98203 33003", "rameshwar.c@yahoo.com", "Connaught Place, New Delhi", "Delhi", EmploymentType.BUSINESS, 250000, 5000000, LoanType.BUSINESS_LOAN, LeadSource.REFERRAL, LeadStatus.APPLICATION_PROCESSING),
        ("Meera Krishnan", "+91 98204 44004", "meera.k@gmail.com", "Indiranagar, Bengaluru", "Bengaluru", EmploymentType.SALARIED, 180000, 7500000, LoanType.HOME_LOAN, LeadSource.PARTNER_BANK, LeadStatus.DOCUMENTS_PENDING),
        ("Siddharth Roy", "+91 98205 55005", "siddharth.roy@hotmail.com", "Salt Lake Sector V, Kolkata", "Kolkata", EmploymentType.SALARIED, 95000, 1200000, LoanType.VEHICLE_LOAN, LeadSource.CAMPAIGN, LeadStatus.INTERESTED),
        ("Pooja Singhania", "+91 98206 66006", "pooja.singh@gmail.com", "Jubilee Hills, Hyderabad", "Hyderabad", EmploymentType.BUSINESS, 320000, 8500000, LoanType.BUSINESS_LOAN, LeadSource.WEBSITE, LeadStatus.FOLLOW_UP_REQUIRED),
        ("Kunal Bansal", "+91 98207 77007", "kunal.b@gmail.com", "Civil Lines, Jaipur", "Jaipur", EmploymentType.SELF_EMPLOYED, 75000, 600000, LoanType.PERSONAL_LOAN, LeadSource.CALL_INQUIRY, LeadStatus.CONTACTED),
        ("Divya Nambiar", "+91 98208 88008", "divya.n@yahoo.co.in", "MG Road, Kochi", "Kochi", EmploymentType.SALARIED, 85000, 4500000, LoanType.HOME_LOAN, LeadSource.REFERRAL, LeadStatus.ASSIGNED),
        ("Gaurav Kapoor", "+91 98209 99009", "gaurav.k@gmail.com", "Sector 17, Chandigarh", "Chandigarh", EmploymentType.SALARIED, 110000, 1500000, LoanType.PERSONAL_LOAN, LeadSource.WEBSITE, LeadStatus.NEW),
        ("Neha Saxena", "+91 98210 10101", "neha.saxena@outlook.com", "Gomti Nagar, Lucknow", "Lucknow", EmploymentType.SALARIED, 55000, 400000, LoanType.PERSONAL_LOAN, LeadSource.CAMPAIGN, LeadStatus.NOT_INTERESTED),
        ("Harshvardhan Rao", "+91 98211 11211", "harsh.rao@gmail.com", "Anna Nagar, Chennai", "Chennai", EmploymentType.BUSINESS, 450000, 12000000, LoanType.BUSINESS_LOAN, LeadSource.PARTNER_BANK, LeadStatus.APPLICATION_PROCESSING),
        ("Shweta Deshmukh", "+91 98212 12312", "shweta.d@gmail.com", "Shivaji Nagar, Pune", "Pune", EmploymentType.SALARIED, 70000, 3000000, LoanType.HOME_LOAN, LeadSource.WEBSITE, LeadStatus.DOCUMENTS_PENDING),
        ("Pradeep Agarwal", "+91 98213 13413", "pradeep.a@gmail.com", "Navrangpura, Ahmedabad", "Ahmedabad", EmploymentType.BUSINESS, 190000, 3500000, LoanType.BUSINESS_LOAN, LeadSource.REFERRAL, LeadStatus.INTERESTED),
        ("Tanvi Merchant", "+91 98214 14514", "tanvi.m@yahoo.com", "Juhu Scheme, Mumbai", "Mumbai", EmploymentType.SALARIED, 160000, 2000000, LoanType.VEHICLE_LOAN, LeadSource.CALL_INQUIRY, LeadStatus.FOLLOW_UP_REQUIRED),
        ("Naveen Reddy", "+91 98215 15615", "naveen.reddy@gmail.com", "Hitec City, Hyderabad", "Hyderabad", EmploymentType.SALARIED, 140000, 6000000, LoanType.HOME_LOAN, LeadSource.WEBSITE, LeadStatus.APPROVED),
        ("Kavita Menon", "+91 98216 16716", "kavita.m@gmail.com", "Kakkanad, Kochi", "Kochi", EmploymentType.SALARIED, 90000, 1000000, LoanType.EDUCATION_LOAN, LeadSource.PARTNER_BANK, LeadStatus.DISBURSED),
        ("Rohan Bhardwaj", "+91 98217 17817", "rohan.b@gmail.com", "DLF Phase 5, Gurugram", "Gurugram", EmploymentType.SALARIED, 210000, 9000000, LoanType.HOME_LOAN, LeadSource.WEBSITE, LeadStatus.REJECTED),
        ("Deepa Iyer", "+91 98218 18918", "deepa.iyer@gmail.com", "T Nagar, Chennai", "Chennai", EmploymentType.SALARIED, 80000, 750000, LoanType.PERSONAL_LOAN, LeadSource.CAMPAIGN, LeadStatus.ASSIGNED),
        ("Aditya Chopra", "+91 98219 19019", "aditya.c@gmail.com", "Alipore, Kolkata", "Kolkata", EmploymentType.BUSINESS, 380000, 9500000, LoanType.BUSINESS_LOAN, LeadSource.REFERRAL, LeadStatus.CONTACTED),
        ("Simran Gill", "+91 98220 20120", "simran.gill@gmail.com", "Model Town, Ludhiana", "Ludhiana", EmploymentType.SELF_EMPLOYED, 60000, 500000, LoanType.PERSONAL_LOAN, LeadSource.CALL_INQUIRY, LeadStatus.NEW),
        ("Manish Pandey", "+91 98221 21221", "manish.p@gmail.com", "Vip Road, Surat", "Surat", EmploymentType.BUSINESS, 220000, 4500000, LoanType.BUSINESS_LOAN, LeadSource.WEBSITE, LeadStatus.INTERESTED),
        ("Ritika Sethi", "+91 98222 22322", "ritika.sethi@gmail.com", "Noida Sector 62", "Noida", EmploymentType.SALARIED, 105000, 1100000, LoanType.PERSONAL_LOAN, LeadSource.CAMPAIGN, LeadStatus.NOT_INTERESTED),
        ("Suresh Hegde", "+91 98223 23423", "suresh.hegde@gmail.com", "Malleshwaram, Bengaluru", "Bengaluru", EmploymentType.SALARIED, 130000, 5500000, LoanType.HOME_LOAN, LeadSource.PARTNER_BANK, LeadStatus.FOLLOW_UP_REQUIRED),
        ("Anuradha Pillai", "+91 98224 24524", "anuradha.p@yahoo.com", "Vyttila, Kochi", "Kochi", EmploymentType.SALARIED, 72000, 850000, LoanType.GOLD_LOAN, LeadSource.CALL_INQUIRY, LeadStatus.DOCUMENTS_PENDING),
        ("Varun Khurana", "+91 98225 25625", "varun.k@gmail.com", "South Extension, New Delhi", "Delhi", EmploymentType.SALARIED, 175000, 8000000, LoanType.HOME_LOAN, LeadSource.REFERRAL, LeadStatus.APPLICATION_PROCESSING),
        ("Priyanka Tambe", "+91 98226 26726", "priyanka.t@gmail.com", "Aundh, Pune", "Pune", EmploymentType.SALARIED, 68000, 650000, LoanType.PERSONAL_LOAN, LeadSource.WEBSITE, LeadStatus.ASSIGNED),
        ("Mohit Mathur", "+91 98227 27827", "mohit.m@gmail.com", "Vaishali Nagar, Jaipur", "Jaipur", EmploymentType.BUSINESS, 160000, 3000000, LoanType.BUSINESS_LOAN, LeadSource.CAMPAIGN, LeadStatus.CONTACTED),
        ("Shilpa Bhatia", "+91 98228 28928", "shilpa.b@gmail.com", "Banjara Hills, Hyderabad", "Hyderabad", EmploymentType.SALARIED, 115000, 1400000, LoanType.VEHICLE_LOAN, LeadSource.PARTNER_BANK, LeadStatus.INTERESTED),
        ("Farhan Khan", "+91 98229 29029", "farhan.k@gmail.com", "Andheri East, Mumbai", "Mumbai", EmploymentType.SALARIED, 85000, 900000, LoanType.PERSONAL_LOAN, LeadSource.CALL_INQUIRY, LeadStatus.NEW),
        ("Aparna Sen", "+91 98230 30130", "aparna.sen@gmail.com", "Park Street, Kolkata", "Kolkata", EmploymentType.SALARIED, 145000, 4800000, LoanType.HOME_LOAN, LeadSource.WEBSITE, LeadStatus.FOLLOW_UP_REQUIRED),
        ("Karthik Sundaram", "+91 98231 31231", "karthik.s@gmail.com", "Mylapore, Chennai", "Chennai", EmploymentType.SALARIED, 98000, 1250000, LoanType.PERSONAL_LOAN, LeadSource.REFERRAL, LeadStatus.DOCUMENTS_PENDING),
        ("Bhavna Trivedi", "+91 98232 32332", "bhavna.t@gmail.com", "Drive-In Road, Ahmedabad", "Ahmedabad", EmploymentType.BUSINESS, 280000, 7000000, LoanType.BUSINESS_LOAN, LeadSource.CAMPAIGN, LeadStatus.APPROVED),
        ("Rajat Oberoi", "+91 98233 33433", "rajat.o@gmail.com", "Vasant Vihar, New Delhi", "Delhi", EmploymentType.SALARIED, 240000, 11000000, LoanType.HOME_LOAN, LeadSource.WEBSITE, LeadStatus.APPLICATION_PROCESSING),
        ("Pallavi Kulkarni", "+91 98234 34534", "pallavi.k@gmail.com", "Kalyan Nagar, Bengaluru", "Bengaluru", EmploymentType.SALARIED, 82000, 950000, LoanType.EDUCATION_LOAN, LeadSource.PARTNER_BANK, LeadStatus.DISBURSED),
        ("Girish Rathi", "+91 98235 35635", "girish.r@gmail.com", "FC Road, Pune", "Pune", EmploymentType.BUSINESS, 310000, 6000000, LoanType.BUSINESS_LOAN, LeadSource.REFERRAL, LeadStatus.REJECTED)
    ]

    leads = []
    today = date.today()

    for idx, c in enumerate(customers_data, start=1):
        code = f"CUST{idx:05d}"
        # Distribute mostly among the 5 staff employees
        assigned_emp = staff_employees[(idx - 1) % len(staff_employees)] if c[10] != LeadStatus.NEW else None

        lead = Lead(
            customer_code=code,
            full_name=c[0],
            phone_number=c[1],
            email=c[2],
            address=c[3],
            city=c[4],
            employment_type=c[5],
            monthly_income=c[6],
            required_loan_amount=c[7],
            loan_type=c[8],
            lead_source=c[9],
            lead_status=c[10],
            assigned_employee_id=assigned_emp.id if assigned_emp else None,
            created_at=datetime.utcnow() - timedelta(days=idx % 14)
        )
        db.add(lead)
        db.flush()
        leads.append(lead)

        if assigned_emp:
            history = LeadAssignmentHistory(
                lead_id=lead.id,
                assigned_to_employee_id=assigned_emp.id,
                assigned_by_user_id=admin_user.id,
                assigned_at=lead.created_at,
                notes="Morning lead assignment"
            )
            db.add(history)

    print("Seeding Call Logs for today and previous days...")
    # Add calls completed today to show dynamic progress
    call_outcomes = [
        CallOutcome.INTERESTED, CallOutcome.NOT_INTERESTED, CallOutcome.BUSY,
        CallOutcome.NO_ANSWER, CallOutcome.FOLLOW_UP_REQUIRED, CallOutcome.CALL_BACK_LATER
    ]

    # Generate calls for each staff member today so targets show ~35-65%
    for emp_idx, emp in enumerate(staff_employees):
        # assign varying calls completed today between 25 and 70 calls
        num_today_calls = 25 + (emp_idx * 11)
        for c_idx in range(num_today_calls):
            lead = leads[(c_idx + emp_idx * 7) % len(leads)]
            outcome = call_outcomes[(c_idx + emp_idx) % len(call_outcomes)]
            t_hour = 9 + (c_idx // 10)
            t_min = (c_idx * 5) % 60
            
            c_log = CallLog(
                lead_id=lead.id,
                employee_id=emp.id,
                call_date=today,
                call_time=time(hour=min(18, t_hour), minute=t_min),
                outcome=outcome,
                remarks=f"Discussed {lead.loan_type.value} benefits with customer.",
                created_at=datetime.combine(today, time(hour=min(18, t_hour), minute=t_min))
            )
            db.add(c_log)

        # Also add past 6 days calls to create rich 7-day trend chart
        for past_day in range(1, 7):
            d = today - timedelta(days=past_day)
            past_calls = 40 + ((past_day * 7 + emp_idx * 5) % 55)
            for pc in range(past_calls // 5):
                lead = leads[(pc + past_day) % len(leads)]
                c_log = CallLog(
                    lead_id=lead.id,
                    employee_id=emp.id,
                    call_date=d,
                    call_time=time(hour=11, minute=pc % 60),
                    outcome=CallOutcome.INTERESTED if pc % 3 == 0 else CallOutcome.BUSY,
                    remarks="Periodic inquiry call recorded.",
                    created_at=datetime.combine(d, time(hour=11, minute=pc % 60))
                )
                db.add(c_log)

    print("Seeding Follow-ups...")
    # Today's follow-ups
    for idx in range(6):
        lead = leads[idx * 3]
        f = FollowUp(
            lead_id=lead.id,
            employee_id=lead.assigned_employee_id or staff_employees[0].id,
            scheduled_date=today,
            scheduled_time=time(hour=10 + idx, minute=30),
            status=FollowUpStatus.PENDING,
            remarks=f"Call back to collect KYC documents and verify salary slip.",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(f)

    # Upcoming follow-ups
    for idx in range(5):
        lead = leads[idx * 4 + 1]
        f = FollowUp(
            lead_id=lead.id,
            employee_id=lead.assigned_employee_id or staff_employees[1].id,
            scheduled_date=today + timedelta(days=idx + 1),
            scheduled_time=time(hour=14, minute=0),
            status=FollowUpStatus.PENDING,
            remarks="Follow-up on scheme comparison sent via WhatsApp/email.",
            created_at=datetime.utcnow()
        )
        db.add(f)

    # Overdue follow-up
    f_overdue = FollowUp(
        lead_id=leads[5].id,
        employee_id=staff_employees[2].id,
        scheduled_date=today - timedelta(days=2),
        scheduled_time=time(hour=11, minute=15),
        status=FollowUpStatus.PENDING,
        remarks="Customer requested weekend follow-up - pending action.",
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(f_overdue)

    print("Seeding Documents...")
    # Seed dummy sample documents in storage directory
    os.makedirs("storage/documents", exist_ok=True)
    sample_files = [
        ("Aadhaar_Card_Amitabh.pdf", DocumentType.AADHAAR_CARD, VerificationStatus.VERIFIED, leads[0]),
        ("PAN_Card_Amitabh.jpg", DocumentType.PAN_CARD, VerificationStatus.VERIFIED, leads[0]),
        ("Salary_Slip_May2026.pdf", DocumentType.SALARY_SLIPS, VerificationStatus.VERIFIED, leads[0]),
        ("Bank_Statement_Sunita.pdf", DocumentType.BANK_STATEMENTS, VerificationStatus.VERIFIED, leads[1]),
        ("PAN_Card_Sunita.pdf", DocumentType.PAN_CARD, VerificationStatus.VERIFIED, leads[1]),
        ("ITR_Acknowledgment_Rameshwar.pdf", DocumentType.EMPLOYMENT_PROOF, VerificationStatus.PENDING, leads[2]),
        ("Electricity_Bill_Meera.pdf", DocumentType.ADDRESS_PROOF, VerificationStatus.PENDING, leads[3]),
        ("Salary_Slip_Siddharth.pdf", DocumentType.SALARY_SLIPS, VerificationStatus.PENDING, leads[4]),
        ("PAN_Card_Pooja.pdf", DocumentType.PAN_CARD, VerificationStatus.REJECTED, leads[5]),
    ]

    for fname, dtype, vstatus, lead in sample_files:
        filepath = os.path.join("storage/documents", fname)
        if not os.path.exists(filepath):
            with open(filepath, "w") as f:
                f.write(f"SAMPLE DOCUMENT CONTENT FOR {fname}\nCustomer: {lead.full_name}\nType: {dtype.value}\nGenerated for CloudHouse Technologies CRM Assessment.")

        doc = CustomerDocument(
            lead_id=lead.id,
            document_type=dtype,
            file_name=fname,
            file_path=filepath,
            file_size=1024 * 12,
            mime_type="application/pdf" if fname.endswith(".pdf") else "image/jpeg",
            verification_status=vstatus,
            rejection_remarks="Image is blurred. Please upload clear scan." if vstatus == VerificationStatus.REJECTED else None,
            uploaded_by_id=lead.assigned_employee.user_id if lead.assigned_employee else admin_user.id,
            verified_by_id=admin_user.id if vstatus != VerificationStatus.PENDING else None,
            uploaded_at=datetime.utcnow() - timedelta(days=2),
            verified_at=datetime.utcnow() - timedelta(days=1) if vstatus != VerificationStatus.PENDING else None
        )
        db.add(doc)

    print("Seeding Loan Applications...")
    sample_apps = [
        (leads[0], banks[0], schemes[0], 3500000.0, 3200000.0, None, ApplicationStatus.APPROVED, "Approved based on high CIBIL score 785", today - timedelta(days=2), None, None),
        (leads[1], banks[1], schemes[1], 800000.0, 800000.0, 800000.0, ApplicationStatus.DISBURSED, "Funds disbursed into customer ICICI account", today - timedelta(days=5), today - timedelta(days=1), None),
        (leads[2], banks[1], schemes[3], 5000000.0, None, None, ApplicationStatus.UNDER_REVIEW, "Bank risk assessment team reviewing audited GST returns", None, None, None),
        (leads[3], banks[2], schemes[4], 7500000.0, None, None, ApplicationStatus.ADDITIONAL_DOCUMENTS_REQUIRED, "Bank requested 6 months continuous bank statement", None, None, None),
        (leads[14], banks[0], schemes[0], 6000000.0, 5800000.0, None, ApplicationStatus.APPROVED, "Approved by regional credit manager", today - timedelta(days=1), None, None),
        (leads[15], banks[5], schemes[10], 1000000.0, 1000000.0, 1000000.0, ApplicationStatus.DISBURSED, "Full education loan disbursed to university escrow account", today - timedelta(days=4), today - timedelta(days=2), None),
        (leads[16], banks[3], schemes[6], 9000000.0, None, None, ApplicationStatus.REJECTED, "Application declined", None, None, "Insufficient debt-to-income ratio and active credit defaults"),
        (leads[24], banks[2], schemes[4], 8000000.0, None, None, ApplicationStatus.SUBMITTED, "Application dossier dispatched to SBI retail asset hub", None, None, None)
    ]

    for idx, (lead, bank, scheme, req_amt, app_amt, disb_amt, st, rem, app_dt, disb_dt, rej_rsn) in enumerate(sample_apps, start=1):
        app_num = f"APP2026{idx:05d}"
        app = LoanApplication(
            application_number=app_num,
            lead_id=lead.id,
            bank_id=bank.id,
            scheme_id=scheme.id,
            assigned_employee_id=lead.assigned_employee_id or staff_employees[0].id,
            requested_amount=req_amt,
            approved_amount=app_amt,
            disbursed_amount=disb_amt,
            status=st,
            remarks=rem,
            approval_date=app_dt,
            disbursement_date=disb_dt,
            rejection_reason=rej_rsn,
            created_at=datetime.utcnow() - timedelta(days=idx * 2)
        )
        db.add(app)
        db.flush()

        hist = LoanApplicationHistory(
            application_id=app.id,
            status_from=None,
            status_to=st.value,
            changed_by_user_id=admin_user.id,
            remarks=f"Status set to {st.value}. {rem}"
        )
        db.add(hist)

    print("Seeding Initial Notifications and Activity Logs...")
    # Admin notification
    notif_admin = Notification(
        user_id=admin_user.id,
        title="Welcome to Loan CRM System",
        message="System successfully initialized with PostgreSQL database and partner banks.",
        notification_type="SUCCESS",
        link_url="/admin/dashboard"
    )
    db.add(notif_admin)

    for emp in staff_employees:
        notif_staff = Notification(
            user_id=emp.user_id,
            title="Daily Target Set",
            message=f"Good morning {emp.full_name}, your daily target is 100 calls. Leads have been assigned to your queue.",
            notification_type="INFO",
            link_url="/staff/leads"
        )
        db.add(notif_staff)

    # Activity logs
    act = ActivityLog(
        user_id=admin_user.id,
        action="SYSTEM_INIT",
        entity_type="System",
        details="Initial system database setup and bank catalog population"
    )
    db.add(act)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
