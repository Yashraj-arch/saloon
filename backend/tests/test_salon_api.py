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

        # Create a new test customer with unique phone
        import time
        unique_suffix = f"{int(time.time() * 1000) % 100000000:08d}"
        new_cust_res = await client.post("/api/v1/customers", json={
            "full_name": "Test Client Deletion",
            "phone": f"+91 91{unique_suffix}",
            "email": f"test.del.{unique_suffix}@example.com",
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

@pytest.mark.asyncio
async def test_security_headers_and_hsts():
    transport = ASGITransport(app=app)
    # Test over HTTPS transport to verify HSTS and all OWASP headers
    async with AsyncClient(transport=transport, base_url="https://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.headers["x-content-type-options"] == "nosniff"
        assert res.headers["x-frame-options"] == "DENY"
        assert res.headers["x-xss-protection"] == "1; mode=block"
        assert "default-src 'self'" in res.headers["content-security-policy"]
        assert "Strict-Transport-Security" in res.headers or "strict-transport-security" in res.headers
        assert "server" not in res.headers or res.headers["server"] != "uvicorn"

@pytest.mark.asyncio
async def test_customer_xss_sanitization():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as staff
        staff_res = await client.post("/api/v1/auth/login", json={
            "email": "staff@luxeaura.com",
            "password": "Staff@123"
        })
        staff_headers = {"Authorization": f"Bearer {staff_res.json()['access_token']}"}

        # Attempt to inject XSS payload in full_name and notes
        import time
        suffix = f"{int(time.time() * 1000) % 100000000:08d}"
        xss_payload = "<script>alert('XSS-TEST')</script>"
        res = await client.post("/api/v1/customers", json={
            "full_name": f"Hacker {xss_payload}",
            "phone": f"+91 88{suffix}",
            "email": f"hacker.{suffix}@test.com",
            "gender": "Other",
            "notes": f"Malicious note {xss_payload}"
        }, headers=staff_headers)
        assert res.status_code == 201
        data = res.json()
        # Verify characters are safely escaped into HTML entities
        assert "<script>" not in data["full_name"]
        assert "&lt;script&gt;" in data["full_name"]
        assert "<script>" not in data["notes"]
        assert "&lt;script&gt;" in data["notes"]

@pytest.mark.asyncio
async def test_billing_tampering_and_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as staff
        staff_res = await client.post("/api/v1/auth/login", json={
            "email": "staff@luxeaura.com",
            "password": "Staff@123"
        })
        staff_token = staff_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {staff_token}"}

        # Fetch services to get real service ID and options
        srv_res = await client.get("/api/v1/services", headers=headers)
        assert srv_res.status_code == 200
        services = srv_res.json()
        assert len(services) > 0
        haircut = next((s for s in services if "Haircut" in s["name"]), services[0])

        # Fetch existing customer
        cust_res = await client.get("/api/v1/customers", headers=headers)
        customers = cust_res.json()
        target_cust = customers[0]

        # 1. Reject invalid payment method (rejected by schema or endpoint)
        bad_payment_res = await client.post("/api/v1/billing", json={
            "customer_id": target_cust["id"],
            "items": [{"service_id": haircut["id"], "selected_options": []}],
            "payment_method": "BITCOIN",
            "discount_amount": 0.0
        }, headers=headers)
        assert bad_payment_res.status_code in (400, 422)

        # 2. Reject negative discount
        neg_disc_res = await client.post("/api/v1/billing", json={
            "customer_id": target_cust["id"],
            "items": [{"service_id": haircut["id"], "selected_options": []}],
            "payment_method": "CASH",
            "discount_amount": -50.0
        }, headers=headers)
        assert neg_disc_res.status_code in (400, 422)

        # 3. Create valid bill - server calculates correct pricing
        valid_res = await client.post("/api/v1/billing", json={
            "customer_id": target_cust["id"],
            "items": [{"service_id": haircut["id"], "selected_options": []}],
            "payment_method": "UPI",
            "discount_amount": 10.0
        }, headers=headers)
        assert valid_res.status_code == 201
        bill_data = valid_res.json()
        assert bill_data["status"] == "PAID"
        assert bill_data["payment_method"] == "UPI"
        assert float(bill_data["discount_amount"]) == 10.0
        assert float(bill_data["total_amount"]) == float(bill_data["subtotal"]) - 10.0

@pytest.mark.asyncio
async def test_role_based_access_control():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as staff
        staff_res = await client.post("/api/v1/auth/login", json={
            "email": "staff@luxeaura.com",
            "password": "Staff@123"
        })
        staff_headers = {"Authorization": f"Bearer {staff_res.json()['access_token']}"}

        # Staff CANNOT access super admin tenant routes -> 403
        tenants_res = await client.get("/api/v1/superadmin/salons", headers=staff_headers)
        assert tenants_res.status_code == 403

        # Staff CANNOT access owner deleted vault -> 403
        vault_res = await client.get("/api/v1/admin/deleted-customers", headers=staff_headers)
        assert vault_res.status_code == 403

        # Staff CANNOT access owner financial revenue analytics -> 403
        rev_res = await client.get("/api/v1/analytics/summary", headers=staff_headers)
        assert rev_res.status_code == 403

@pytest.mark.asyncio
async def test_rate_limiter_mechanism():
    from app.core.security_middleware import rate_limiter
    test_ip = "192.0.2.100"
    
    # Clean previous records for this IP
    rate_limiter.ip_login_requests[test_ip] = []
    
    # Attempt rapid login requests up to limit
    allowed_count = 0
    for _ in range(15):
        allowed, _ = rate_limiter.is_allowed(test_ip, "/api/v1/auth/login")
        if allowed:
            allowed_count += 1
            
    # Should allow up to RATE_LIMIT_LOGIN_PER_MINUTE (10) and reject the rest
    assert allowed_count == 10
    denied, retry_after = rate_limiter.is_allowed(test_ip, "/api/v1/auth/login")
    assert denied is False
    assert retry_after > 0
