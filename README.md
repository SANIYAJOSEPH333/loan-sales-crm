# Loan Sales & Call Centre CRM System
### Technical Interview Assessment – CloudHouse Technologies

A complete, production-grade full-stack Loan Sales & Call Centre CRM System designed for loan processing intermediaries coordinating between retail borrowers and partner banks.

---

## 1. System Architecture & Features

The CRM supports an organisation of ~20 staff members where customer leads are distributed every morning, tracking a daily target of **100 calls per employee**, document collection, verification, underwriting, and loan disbursement.

### Interfaces
1. **Admin Portal**: Enterprise CRM dashboard with 14 integrated modules for lead management, bulk upload, smart balanced distribution, staff performance tracking, partner bank catalog, and loan approvals.
2. **Staff / Call Centre Portal**: Streamlined interface for agents to view assigned leads, initiate click-to-call (`tel:` protocol), log calls, schedule callbacks, upload KYC documents, and monitor personal 100-call daily targets.
3. **Mobile Admin UI (`/admin/mobile`)**: Dedicated mobile-first layout with bottom navigation bar, touch cards, swipe drawers, and complete access to all 14 admin modules.

---

## 2. Technology Stack

- **Frontend**:
  - React.js 18 / 19
  - Vite
  - JavaScript (ES Modules)
  - Tailwind CSS
  - React Router DOM v6
  - Axios (with Bearer token interceptor)
  - Recharts (Interactive Area, Bar, and Pie Charts)
  - Lucide React (Clean financial icons)
- **Backend**:
  - Python 3.13
  - FastAPI (REST API with OpenAPI / Swagger)
  - SQLAlchemy 2.0 ORM
  - Pydantic v2 (Data validation & schemas)
  - JWT Authentication (Bearer tokens)
  - Bcrypt password hashing
- **Database**:
  - PostgreSQL 18 (Local database `loan_sales_crm` on port 5432)
  - Alembic for database migrations

---

## 3. Project Structure

```
loan-sales-crm/
├── backend/
│   ├── alembic/                 # Alembic migration scripts
│   ├── app/
│   │   ├── core/                # Configuration, security, dependencies
│   │   ├── database/            # SQLAlchemy session and engine
│   │   ├── models/              # Relational database models
│   │   ├── schemas/             # Pydantic v2 request/response models
│   │   ├── routers/             # 15 modular REST API routers
│   │   ├── utils/               # Activity logging and helpers
│   │   └── main.py              # FastAPI app & CORS middleware
│   ├── storage/documents/       # Secure file storage
│   ├── seed_data.py             # Database seeder with realistic test data
│   ├── test_api.py              # Automated backend test suite
│   ├── alembic.ini              # Alembic config
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/common/   # Badge, StatCard, Modal, NotificationDrawer
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── layouts/             # AdminLayout, StaffLayout, MobileAdminLayout
│   │   ├── pages/
│   │   │   ├── auth/Login.jsx   # Login with 1-click demo credential prefill
│   │   │   ├── admin/           # All 13 Admin module pages
│   │   │   ├── staff/           # All 7 Staff module pages
│   │   │   └── mobile/          # Mobile Admin UI (/admin/mobile)
│   │   ├── services/            # Axios API client & CRM service methods
│   │   ├── App.jsx              # Role-guarded routing
│   │   ├── main.jsx             # React DOM entry
│   │   └── index.css            # Tailwind directives
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── README.md
└── .gitignore
```

---

## 4. Test Credentials

The database comes pre-seeded with realistic records:

| Role | Email | Password | Full Name & Role |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@crm.com` | `Admin@123` | Rajesh Sharma (Operations Manager & Admin) |
| **Staff 1** | `staff1@crm.com` | `Staff@123` | Priya Nair (Senior Loan Sales Specialist) |
| **Staff 2** | `staff2@crm.com` | `Staff@123` | Vikram Malhotra (Call Centre Executive) |
| **Staff 3** | `staff3@crm.com` | `Staff@123` | Ananya Desai (Call Centre Executive) |
| **Staff 4** | `staff4@crm.com` | `Staff@123` | Rahul Verma (Customer Relationship Officer) |
| **Staff 5** | `staff5@crm.com` | `Staff@123` | Sneha Kulkarni (Call Centre Executive) |

> **Tip**: The login screen (`/login`) includes 1-click demo buttons that immediately prefill these credentials for instant evaluation.

---

## 5. Main Application URLs

- **Frontend Application**: `http://localhost:5173`
- **Admin Portal**: `http://localhost:5173/admin/dashboard`
- **Mobile Admin UI**: `http://localhost:5173/admin/mobile`
- **Staff Portal**: `http://localhost:5173/staff/dashboard`
- **FastAPI Interactive Docs**: `http://localhost:8000/docs`
- **API Health Check**: `http://localhost:8000/health`

---

## 6. Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL 14+ (Port 5432)

### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - On Windows:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Linux/macOS:
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify or configure `.env`:
   ```ini
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/loan_sales_crm
   SECRET_KEY=crm-super-secret-jwt-key-cloudhouse-2026-production
   ```
5. Seed database (creates tables & test records):
   ```bash
   python seed_data.py
   ```
6. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## 7. Key Features Demonstrated

1. **Role-Based Access Control (RBAC)**:
   - Staff cannot access Admin routes (`/admin/*`) or Admin API endpoints. Direct API requests return `403 Forbidden`.
   - Staff can only view and call leads assigned directly to their employee code.
2. **Daily Call Target Tracking**:
   - Each staff member has a default target of 100 calls per day.
   - Logging calls automatically increments daily counts and updates lead statuses.
3. **Smart Balanced Distribution**:
   - Admin can select multiple unassigned leads and distribute them across active employees in round-robin fashion, balancing existing workloads.
4. **Bulk Lead Upload**:
   - Upload `.csv` or `.xlsx` files with client validation, mandatory column checks, duplicate phone/email detection, previewing valid vs invalid rows prior to database insertion.
5. **Document Verification**:
   - Staff uploads KYC documents (Aadhaar, PAN, Salary Slip, Bank Statement).
   - Only Admin can verify or reject documents with remarks. Sensitive files are served through authenticated streaming endpoints rather than public URLs.
6. **Loan Pipeline & Approvals**:
   - Applications progress through: `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` -> `DISBURSED` -> `CLOSED`.
   - Comprehensive audit logs record status changes and timestamps.
7. **Reports & 1-Click CSV Export**:
   - Export Calls Report, Leads Report, and Loan Applications Report directly to CSV with date range filtering.
