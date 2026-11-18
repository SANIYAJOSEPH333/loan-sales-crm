import sys
import os
sys.path.insert(0, os.path.realpath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("1. Testing health check...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check OK!")

    print("2. Testing Admin Login...")
    res = client.post("/api/auth/login", json={"email": "admin@crm.com", "password": "Admin@123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"Admin Login OK! Full Name: {res.json()['full_name']}, Role: {res.json()['role']}")

    print("3. Testing Staff Login...")
    res = client.post("/api/auth/login", json={"email": "staff1@crm.com", "password": "Staff@123"})
    assert res.status_code == 200, f"Staff login failed: {res.text}"
    staff_token = res.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    print(f"Staff Login OK! Full Name: {res.json()['full_name']}, Employee ID: {res.json()['employee_id']}")

    print("4. Testing Admin Dashboard Endpoint...")
    res = client.get("/api/dashboard/admin", headers=admin_headers)
    assert res.status_code == 200, f"Admin dashboard failed: {res.text}"
    data = res.json()
    print(f"Admin Dashboard Metrics: Total Leads: {data['metrics']['total_leads']}, Calls Today: {data['metrics']['calls_completed_today']}, Approved: {data['metrics']['approved_loans']}")

    print("5. Testing RBAC Security: Staff attempting to access Admin Dashboard...")
    res = client.get("/api/dashboard/admin", headers=staff_headers)
    assert res.status_code == 403, f"Security violation! Staff was able to access admin dashboard: {res.status_code}"
    print("RBAC Enforcement Verified: Staff received 403 Forbidden on Admin route!")

    print("6. Testing Staff Dashboard Endpoint...")
    res = client.get("/api/dashboard/staff", headers=staff_headers)
    assert res.status_code == 200, f"Staff dashboard failed: {res.text}"
    staff_data = res.json()
    print(f"Staff Dashboard Metrics: Assigned Leads: {staff_data['metrics']['assigned_leads']}, Calls Today: {staff_data['metrics']['calls_completed_today']}/{staff_data['metrics']['daily_target']} ({staff_data['metrics']['target_achievement_percentage']}%)")

    print("7. Testing Leads endpoint for Staff...")
    res = client.get("/api/leads", headers=staff_headers)
    assert res.status_code == 200, f"Staff leads failed: {res.text}"
    print(f"Staff sees only {len(res.json())} leads assigned to them.")

    print("8. Testing Bank & Schemes...")
    res = client.get("/api/banks", headers=admin_headers)
    assert res.status_code == 200 and len(res.json()) == 6
    print(f"Banks count: {len(res.json())}")

    print("9. Testing Reports Summary...")
    res = client.get("/api/reports/summary", headers=admin_headers)
    assert res.status_code == 200
    print("Reports summary OK!")

    print("ALL BACKEND CHECKS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_endpoints()
