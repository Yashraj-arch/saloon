import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_and_privacy_isolation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login as Super Admin
        sa_res = await client.post("/api/v1/auth/login", json={
            "email": "superadmin@luxesaloon.com",
            "password": "SuperAdmin@123"
        })
        assert sa_res.status_code == 200
        sa_token = sa_res.json()["access_token"]
        assert sa_res.json()["role"] == "SUPER_ADMIN"

        # 2. PRIVACY TEST: Super Admin MUST BE FORBIDDEN from viewing salon revenue!
        sa_headers = {"Authorization": f"Bearer {sa_token}"}
        revenue_res = await client.get("/api/v1/analytics/summary", headers=sa_headers)
        assert revenue_res.status_code == 403, "Super Admin must not have access to salon revenue!"

        # 3. Login as Salon Owner
        owner_res = await client.post("/api/v1/auth/login", json={
            "email": "owner@luxeaura.com",
            "password": "Owner@123"
        })
        assert owner_res.status_code == 200
        owner_token = owner_res.json()["access_token"]
        assert owner_res.json()["role"] == "SALON_OWNER"
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # 4. Salon Owner can access revenue analytics
        owner_rev = await client.get("/api/v1/analytics/summary", headers=owner_headers)
        assert owner_rev.status_code == 200
        assert "daily_revenue" in owner_rev.json()
        assert "weekly_revenue" in owner_rev.json()

        # 5. Calendar 1921-2099 query test
        cal_res = await client.get("/api/v1/analytics/calendar-month?year=2026&month=10", headers=owner_headers)
        assert cal_res.status_code == 200
        days = cal_res.json()
        assert len(days) == 31  # October has 31 days

@pytest.mark.asyncio
async def test_customer_soft_delete_mandatory_reason():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as Staff
        staff_res = await client.post("/api/v1/auth/login", json={
            "email": "staff@luxeaura.com",
            "password": "Staff@123"
        })
        assert staff_res.status_code == 200
        staff_headers = {"Authorization": f"Bearer {staff_res.json()['access_token']}"}

        # Create a new test customer
        new_cust_res = await client.post("/api/v1/customers", json={
            "full_name": "Test Client Deletion",
            "phone": "+91 91234 56789",
            "email": "test.deletion@example.com",
            "gender": "Female"
        }, headers=staff_headers)
        assert new_cust_res.status_code == 201
        cust_id = new_cust_res.json()["id"]

        # Attempt deletion without reason or empty reason -> MUST FAIL with 422
        del_fail = await client.post(f"/api/v1/customers/{cust_id}/delete", json={
            "reason": ""
        }, headers=staff_headers)
        assert del_fail.status_code == 422, "Deletion without reason must be rejected!"

        # Attempt deletion with short reason (<5 chars) -> MUST FAIL with 422
        del_fail_short = await client.post(f"/api/v1/customers/{cust_id}/delete", json={
            "reason": "bad"
        }, headers=staff_headers)
        assert del_fail_short.status_code == 422, "Short deletion reason must be rejected!"

        # Provide valid audit reason -> MUST SUCCEED
        del_success = await client.post(f"/api/v1/customers/{cust_id}/delete", json={
            "reason": "Customer duplicate profile consolidation requested"
        }, headers=staff_headers)
        assert del_success.status_code == 200
        assert del_success.json()["is_deleted"] is True
        assert del_success.json()["deletion_reason"] == "Customer duplicate profile consolidation requested"

        # Customer record is still preserved in DB, visible in owner deleted vault
        owner_res = await client.post("/api/v1/auth/login", json={
            "email": "owner@luxeaura.com",
            "password": "Owner@123"
        })
        owner_headers = {"Authorization": f"Bearer {owner_res.json()['access_token']}"}
        vault_res = await client.get("/api/v1/admin/deleted-customers", headers=owner_headers)
        assert vault_res.status_code == 200
        deleted_ids = [c["id"] for c in vault_res.json()]
        assert cust_id in deleted_ids

        # Restore customer 1-click
        restore_res = await client.post(f"/api/v1/admin/customers/{cust_id}/restore", headers=owner_headers)
        assert restore_res.status_code == 200
        assert restore_res.json()["is_deleted"] is False
