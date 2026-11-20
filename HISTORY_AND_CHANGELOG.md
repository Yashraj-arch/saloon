# 📜 LUX CRM — COMPLETE HISTORICAL RETROSPECTIVE CHANGELOG & AUDIT LEDGER

```
Project:            Lux (formerly LuxeSalon Multi-Tenant CRM SaaS)
Repository:         https://github.com/Yashraj-arch/saloon
Branches Synced:    main | testing | yashraj
Initial Inception:  October 30, 2026
Current Live State: November 20, 2026
Database Target:    MySQL 8.0 (saloon_db)
Frameworks:         FastAPI 0.115+ | Async SQLAlchemy 2.0+ | React 19 | TypeScript | Tailwind CSS v4 | Vite 8+
```

---

## 📌 1. Executive Summary & Architectural Overview

**Lux** is an enterprise-grade, multi-tenant B2B Salon Customer Relationship Management (CRM) and Point of Sale (POS) SaaS platform. Built from the ground up for strict privacy, role isolation, high-speed unit economics, and resilient POS billing, the platform serves three distinct operational personas:

1. **Super Admin (Platform Governor)**: Provisions salon tenants, configures plan tiers (`Starter`, `Pro`, `Enterprise`), monitors subscription health, and activates or suspends tenant accounts. An architectural boundary guarantees that individual salon revenue totals, customer databases, and financial ledgers remain completely isolated and invisible to the platform superadmin.
2. **Salon Owner (Executive Management)**: Accesses high-level business performance highlights (Average Bill Value, Stylists on Floor, Top Performing Category, Monthly Target Progress), comprehensive financial aggregations across daily, weekly, monthly, and yearly intervals, an interactive calendar engine spanning historical and future dates, service catalog customization with dynamic add-on modifiers, specialist commission management, and an audit recovery vault for soft-deleted clients.
3. **Staff (Front Desk & POS Operator)**: Front desk terminal for client registration, service modifier selection (e.g., haircut with customized hairwash/shampoo options), live checkout with multi-tender payment processing (`CASH`, `UPI`, `CARD`, `SPLIT`), and instant multi-format invoice generation (Print, PDF download, and PNG image download). Staff cannot view salon-wide financial earnings or modify base service pricing.

The system is fortified with an end-to-end 24-point defensive security posture: stateless JWT authorization, passlib bcrypt password hashing, parameterized async database operations, sliding-window IP rate limiting, OWASP security headers, input sanitization, and automated test coverage.

---

## 🗺️ 2. Comprehensive Chronological Timeline & Milestone Ledger

```mermaid
flowchart TD
    M1["Milestone 1 (Oct 30 - 09e8072)<br>Multi-Tenant Inception & Bento Core"] --> M2["Milestone 2 (Oct 30 - 11c555d)<br>24-Point Defensive Security & Pytest Suite"]
    M2 --> M3["Milestone 3 (Oct 30 - 25c1992)<br>Phase One Documentation Initialization"]
    M3 --> M4["Milestone 4 (Oct 30 - 0656776)<br>Fix: Body Stream Already Read Error"]
    M4 --> M5["Milestone 5 (Oct 30 - 97b1c72)<br>Nordic Ice UI & Dark Mode Overhaul"]
    M5 --> M6["Milestone 6 (Oct 30 - d56f224)<br>1-Click Credentials & Simple Auth"]
    M6 --> M7["Milestone 7 (Oct 30 - 4954910)<br>1-Click Server Launcher Batch Script"]
    M7 --> M8["Milestone 8 (Nov 5 - 9bbf6ab)<br>Lux Rebrand, Rules Page & Multi-Format Invoicing"]
    M8 --> M9["Milestone 9 (Nov 5 - a872cba)<br>RulesPage Formatting & Git Branch Sync"]
    M9 --> M10["Milestone 10 (Nov 19 - Live)<br>Socket Port Conflict Auto-Clearing Engine"]
```

---

### Milestone 1: Inception, Multi-Tenant Schema & Bento Grid Foundation
- **Date & Commit Hash**: October 30, 2026 14:08:23 IST — `09e80720b20ce70fb4c1e00e0461e0f9a8231fd2`
- **Category**: Architecture | Backend | Frontend | Database
- **The Problem / Goal**:
  Traditional salon software solutions are single-tenant, lack modular add-on pricing (such as shampoo or oil modifiers attached to haircuts), and fail to enforce strict data isolation between platform administrators and private salon financials. The goal was to build a full-stack, enterprise-grade multi-tenant SaaS architecture with a modern, high-speed visual interface.
- **What Was Done (Every Detail)**:
  1. **Multi-Tenant Relational Schema (SQLAlchemy 2.0 ORM)**:
     - `Tenant`: Multi-tenant boundary holding salon name, slug, contact details, subscription tier (`Starter`, `Pro`, `Enterprise`), and active status.
     - `User`: Account registry supporting roles `SUPER_ADMIN`, `SALON_OWNER`, and `STAFF`.
     - `Customer`: Client profile directory tracking visit frequency, total expenditure, gender, birth date, stylist preferences, and soft-delete flags.
     - `CustomerAuditLog`: Mandatory compliance audit table recording user ID, client IP, action timestamp, and mandatory text justification for customer deletions and restorations.
     - `Service` & `ServiceOption`: Catalog supporting base services categorized by department (Hair, Skin, Spa) with modular option groups (e.g. Hairwash: Standard / Moroccan Argan Oil / Keratin Infusion) and individual extra surcharges.
     - `Bill` & `BillItem`: POS invoicing engine tracking line items, option details stored in structured JSON, payment methods (`CASH`, `UPI`, `CARD`, `SPLIT`), discounts, and timestamps.
  2. **FastAPI Asynchronous Backend Core**:
     - Built async endpoints under `/api/v1/`: `/auth`, `/superadmin/salons`, `/admin/deleted-customers`, `/customers`, `/services`, `/billing`, and `/analytics`.
     - Designed high-speed analytics aggregator calculating daily, weekly, monthly, and yearly revenue metrics, alongside an extended calendar querying system spanning from January 1921 through December 2099.
  3. **React 19 + TypeScript + Tailwind CSS Frontend**:
     - Bento Grid layout with responsive cards, glassmorphic styling, and interactive chart visualizations.
     - Role-based views: Super Admin tenancy manager, Salon Owner executive dashboard, and Staff POS terminal.
  4. **Database & Migration Tooling**:
     - Configured Alembic async migration environment (`backend/alembic/env.py`) and schema initialization script (`backend/app/core/init_db.py`).
- **Files Created**:
  - `backend/app/models/__init__.py`
  - `backend/app/schemas/__init__.py`
  - `backend/app/api/deps.py`
  - `backend/app/api/v1/router.py`
  - `backend/app/api/v1/endpoints/admin.py`, `analytics.py`, `auth.py`, `billing.py`, `customers.py`, `services.py`, `superadmin.py`
  - `backend/app/core/config.py`, `database.py`, `init_db.py`, `security.py`
  - `backend/app/main.py`
  - `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`
  - `frontend/src/App.tsx`, `main.tsx`, `index.css`, `App.css`
  - `frontend/src/components/bento/BentoCard.tsx`
  - `frontend/src/components/calendar/CalendarBentoWidget.tsx`, `DayDrilldownDrawer.tsx`
  - `frontend/src/components/layout/Navbar.tsx`
  - `frontend/src/pages/SalonOwnerDashboard.tsx`, `StaffPOSDashboard.tsx`, `SuperAdminDashboard.tsx`
  - `frontend/src/services/api.ts`, `frontend/src/types/index.ts`
  - `frontend/vite.config.ts`, `package.json`, `tsconfig.json`
- **Current Status**: Verified and foundational.

---

### Milestone 2: Comprehensive 24-Point Defensive Security Hardening
- **Date & Commit Hash**: October 30, 2026 15:59:09 IST — `11c555dc61c348eba9907e55e38b37e1de1359f6`
- **Category**: Security | Backend | Database
- **The Problem / Goal**:
  Production multi-tenant systems require defensive hardening against brute-force attacks, client-side price tampering, SQL injection, cross-site scripting (XSS), credential leakage, and cross-tenant privilege escalation.
- **What Was Done (Every Detail)**:
  1. **Sliding-Window IP Rate Limiter (`SecurityHeadersMiddleware`)**:
     - Built an in-memory sliding-window limiter enforcing 10 login attempts/minute per IP and 120 global requests/minute per IP, returning `HTTP 429 Too Many Requests` with `Retry-After` headers.
  2. **OWASP Protective Headers**:
     - Injected `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, and `Content-Security-Policy`.
     - Stripped and masked the default `Server: uvicorn` header to prevent server fingerprinting.
  3. **Server-Side Price Verification in Billing (`billing.py`)**:
     - Hardened `/api/v1/billing`: all base prices and add-on modifier prices are queried strictly from authoritative database rows. Any client-submitted prices are discarded.
     - Rejected negative discounts (`discount_amount >= 0`) and validated payment methods against `{"CASH", "UPI", "CARD", "SPLIT"}`.
  4. **XSS Input Sanitization (`customers.py`)**:
     - Applied `html.escape()` sanitization to customer names, notes, and deletion justifications.
  5. **Audit Logging & Security Event Tracing**:
     - Integrated `security_logger` tracking failed logins (`AUTH_FAILURE`), unauthorized privilege attempts (`RBAC_FORBIDDEN`), and customer deletions with client IP tagging.
  6. **MySQL Character Escaping in Connection Strings**:
     - Handled root passwords with special characters (e.g. `Reynolds@08`) by URL-encoding `@` as `%40` for async connection strings (`mysql+aiomysql://root:Reynolds%4008@127.0.0.1:3306/saloon_db`).
     - Escaped `%` as `%%` in Alembic's ConfigParser (`backend/alembic/env.py`) to prevent interpolation crashes.
  7. **Automated Verification Test Suite (`test_salon_api.py`)**:
     - Created 8 automated pytest suites: `test_health_check`, `test_auth_and_privacy_isolation`, `test_customer_soft_delete_mandatory_reason`, `test_security_headers_and_hsts`, `test_customer_xss_sanitization`, `test_billing_tampering_and_validation`, `test_role_based_access_control`, and `test_rate_limiter_mechanism`.
- **Files Modified / Created**:
  - `backend/app/core/security_middleware.py` (Created)
  - `backend/app/core/config.py`
  - `backend/app/core/database.py`
  - `backend/app/api/v1/endpoints/billing.py`
  - `backend/app/api/v1/endpoints/customers.py`
  - `backend/app/api/v1/endpoints/auth.py`
  - `backend/app/main.py`
  - `backend/app/schemas/__init__.py`
  - `backend/alembic/env.py`
  - `backend/tests/test_salon_api.py`
- **Root Cause & Solution**:
  - *Bug*: Alembic crashed on database passwords containing `@` or `%` due to configparser string interpolation.
  - *Fix*: Injected URL-encoding in `config.py` and doubled percent signs (`%%`) in `alembic/env.py`.
- **Current Status**: Verified (100% test pass rate across 8 test suites in 2.51s).

---

### Milestone 3: Phase One Retrospective Documentation
- **Date & Commit Hash**: October 30, 2026 16:19:00 IST — `25c199204c03456fc0458e37aa378679a70e0eb4`
- **Category**: Architecture | Documentation
- **The Problem / Goal**:
  Establish an exhaustive historical record of the 24-point security hardening, schema definitions, and multi-tenant isolation rules.
- **What Was Done**:
  - Documented system architecture, database models, role boundaries, API catalogs, security parameters, and test results in `PHASE_ONE.md`.
- **Files Created**:
  - `PHASE_ONE.md`
- **Current Status**: Live in repository.

---

### Milestone 4: Frontend Fetch Body Stream Error Fix
- **Date & Commit Hash**: October 30, 2026 16:23:08 IST — `065677605ff32cf1b53f951343777ffd3296cb62`
- **Category**: Frontend | Bug Fix
- **The Problem / Goal**:
  During login or API error handling, the frontend occasionally threw:
  ```
  TypeError: Failed to execute 'text' on 'Response': body stream already read
  ```
- **Root Cause & Technical Breakdown**:
  In `frontend/src/services/api.ts`, the `request<T>()` error-handling block executed:
  ```ts
  try {
    const errData = await res.json();
    errMessage = errData.detail || errData.message;
  } catch {
    errMessage = await res.text(); // <--- CRASH: res.json() had already consumed the readable stream!
  }
  ```
  In standard Fetch API, a `Response` body stream is single-use and cannot be read twice. If `res.json()` failed because the response was plain text (or an HTML 502 Bad Gateway), calling `res.text()` on the consumed stream threw an unhandled `TypeError`.
- **Solution**:
  Refactored `request<T>()` to read `res.text()` exactly once into a local `rawText` string, and then safely attempt `JSON.parse(rawText)` in a nested block. If JSON parsing failed, the original `rawText` was used as the error message without touching the consumed stream again.
- **Files Modified**:
  - `frontend/src/services/api.ts`
- **Current Status**: Resolved and verified.

---

### Milestone 5: Nordic Ice Minimalist Theme & Dark Mode Overhaul
- **Date & Commit Hash**: October 30, 2026 18:01:45 IST — `97b1c72e28267204411480935021a4c26d7ac60a`
- **Category**: Frontend | UI/UX
- **The Problem / Goal**:
  The initial prototype UI used a generic dark gold aesthetic. The user requested an ultra-clean, modern aesthetic featuring light blue and porcelain white for light mode, accompanied by a polished dark mode adhering to anti-slop design principles (crisp typography, subtle borders, high information density, and zero bloated gradients).
- **What Was Done (Every Detail)**:
  1. **CSS Custom Properties Design System (`frontend/src/index.css`)**:
     - *Light Mode*: Crisp porcelain white (`#ffffff` / `#f8fafc`), ice-wash borders (`#e2e8f0`), sky blue accents (`#0284c7`), dark slate typography (`#0f172a`), and frosted glass navigation (`rgba(255, 255, 255, 0.85)`).
     - *Dark Mode*: Deep midnight slate (`#080c14` / `#0f172a`), arctic sky highlights (`#38bdf8`), and high-contrast text (`#f8fafc`).
  2. **Tailwind CSS v4 Dark Variant Setup**:
     - Configured `@custom-variant dark (&:where(.dark, .dark *, [data-theme=dark], [data-theme=dark] *))` for instantaneous theme toggling.
  3. **Theme Context (`ThemeContext.tsx`)**:
     - Created React context managing `'light' | 'dark'` with system preference detection and localStorage persistence.
  4. **Component Restyling**:
     - Updated `BentoCard.tsx`, `CalendarBentoWidget.tsx`, `DayDrilldownDrawer.tsx`, `Navbar.tsx`, `SalonOwnerDashboard.tsx`, `StaffPOSDashboard.tsx`, and `SuperAdminDashboard.tsx`.
- **Files Modified / Created**:
  - `frontend/src/context/ThemeContext.tsx` (Created)
  - `frontend/src/index.css`
  - `frontend/src/App.tsx`
  - `frontend/src/components/layout/Navbar.tsx`
  - `frontend/src/components/bento/BentoCard.tsx`
  - `frontend/src/components/calendar/CalendarBentoWidget.tsx`
  - `frontend/src/components/calendar/DayDrilldownDrawer.tsx`
  - `frontend/src/pages/SalonOwnerDashboard.tsx`
  - `frontend/src/pages/StaffPOSDashboard.tsx`
  - `frontend/src/pages/SuperAdminDashboard.tsx`
- **Current Status**: Live and production-active.

---

### Milestone 6: Simple 1-Click Credentials & Auth Streamlining
- **Date & Commit Hash**: October 30, 2026 21:41:21 IST — `d56f224c593c705d00aa23762701ea5010510a5d`
- **Category**: Authentication | Backend | Frontend
- **The Problem / Goal**:
  Testing multi-tenant workflows required remembering complex email addresses (`superadmin@luxesaloon.com`, `owner@luxeaura.com`, `staff@luxeaura.com`). The goal was to support simple, memorable usernames (`superadmin`, `owner`, `staff`) with 1-click login buttons on the frontend.
- **What Was Done**:
  1. Updated `LoginRequest` in `schemas/__init__.py` to accept either `username` or `email`.
  2. Modified `auth.py` login endpoint to perform an `OR` lookup on `User.email == identifier | User.full_name == identifier` and support standard usernames.
  3. Updated `init_db.py` to ensure demo accounts are seeded with known credentials (`superadmin/superadmin`, `owner/owner`, `staff/staff`).
  4. Added 1-click instant login cards to `App.tsx` allowing one-click authentication into any of the three roles.
- **Files Modified**:
  - `backend/app/api/v1/endpoints/auth.py`
  - `backend/app/core/init_db.py`
  - `backend/app/schemas/__init__.py`
  - `frontend/src/App.tsx`
  - `frontend/src/services/api.ts`
- **Current Status**: Verified and active.

---

### Milestone 7: 1-Click Server Orchestrator (`run_servers.bat`)
- **Date & Commit Hash**: October 30, 2026 21:50:22 IST — `4954910377778601d92954fed6eb20d067f6d120`
- **Category**: DevOps / Tooling
- **The Problem / Goal**:
  Developers and operators needed a single command to spin up both the FastAPI backend and the Vite dev server simultaneously without opening multiple terminal windows manually.
- **What Was Done**:
  - Created `run_servers.bat` at the project root which launches the backend (`127.0.0.1:8005`) and frontend (`127.0.0.1:5173`) in independent console windows.
- **Files Created**:
  - `run_servers.bat`
- **Current Status**: Superseded by Milestone 10 with enhanced path handling and automated port freeing.

---

### Milestone 8: Brand Evolution to Lux, Role-Gated Rules Governance, and Multi-Format Invoicing
- **Date & Commit Hash**: November 5, 2026 17:20:06 IST — `9bbf6abcb18e1fd0d878ce335e9f23212dddcb61`
- **Category**: Architecture | Frontend | Backend | Features
- **The Problem / Goal**:
  The user requested an extensive UX and branding transformation:
  1. Rebrand from `LuxeSalon` to **`Lux`**.
  2. Replace multi-persona switcher in the Navbar with a single role badge (`Super Admin`, `Owner`, or `Staff`).
  3. Remove the `"Privacy & Strict Revenue Isolation Enforced"` banner from Super Admin.
  4. Replace `"Salon Owner Bento Command Center"` with the owner's username: `owner`.
  5. Rename tab `"Bento Analytics"` to just `"Analytics"`.
  6. Replace `"Salon Business Economics"` with **`Business Performance Highlights`** (Average Bill Value, Stylists on Floor, Top Performing Category, Monthly Target Progress bar).
  7. Remove `"1921 - 2099"` from the Revenue Calendar heading.
  8. Rename `"Services & Dynamic Option Modifiers Matrix..."` to simply `"Services"`.
  9. Move all scattered rule sentences out of dashboard tabs into a dedicated top-level **`Rules`** section with strict role-based visibility:
     - Super Admin sees Platform Governance, Owner Rules, and Staff Rules.
     - Salon Owner sees Owner Rules and Staff Rules.
     - Staff has NO access to Rules (tab is hidden from navigation).
  10. Invoice receipts must be downloadable in 2 options (**PDF** and **Image PNG**) in addition to printable.
- **What Was Done (Every Detail)**:
  1. **Rebranding to Lux**:
     - Updated Navbar, login card, page title (`Lux CRM` in `index.html`), receipt modal headers (`LUX`), and backend config (`config.py` & `.env`).
  2. **Role Indicator Badge**:
     - Replaced the persona switcher in `Navbar.tsx` with a single role badge.
  3. **Dedicated `RulesPage.tsx`**:
     - Created `frontend/src/pages/RulesPage.tsx` categorizing platform governance, owner operational rules, and staff front desk restrictions.
     - Enforced dynamic visibility: Super Admin views 3 tiers, Owner views 2 tiers, Staff cannot see the Rules tab.
  4. **Multi-Format Receipt Engine (`StaffPOSDashboard.tsx`)**:
     - Installed `jspdf` and `html2canvas`.
     - Integrated printable receipt modal:
       - 🖨️ **Print Receipt**: Launches a clean, printer-friendly popup window.
       - 📄 **Download PDF**: Renders the receipt container using `html2canvas` into an 80mm POS receipt PDF via `jsPDF`.
       - 🖼️ **Download Image**: Exports a crisp 2x resolution PNG file directly.
  5. **EMS System Exploration**:
     - Researched enterprise RBAC and ReportLab PDF patterns in `C:\Users\nimba\ems1\EMS-Shekru-Web-App\Backend` without modifying any file there, bringing zero-latency client-side rendering best practices to Lux.
- **Files Created / Modified**:
  - `frontend/src/pages/RulesPage.tsx` (Created)
  - `frontend/src/components/layout/Navbar.tsx`
  - `frontend/src/pages/SalonOwnerDashboard.tsx`
  - `frontend/src/pages/StaffPOSDashboard.tsx`
  - `frontend/src/pages/SuperAdminDashboard.tsx`
  - `frontend/src/components/calendar/CalendarBentoWidget.tsx`
  - `frontend/src/App.tsx`
  - `frontend/index.html`
  - `frontend/package.json`, `frontend/package-lock.json`
  - `backend/app/core/config.py`
  - `backend/.env`
- **Current Status**: Live and production-active.

---

### Milestone 9: RulesPage Formatting & Multi-Branch Git Synchronization
- **Date & Commit Hash**: November 5, 2026 19:49:40 IST — `a872cba648b3130deaefddaecdf9c92ed6b25e46`
- **Category**: DevOps / Git
- **The Problem / Goal**:
  Ensure all local branches (`main`, `testing`, `yashraj`) are fast-forwarded and perfectly in sync with zero merge skew.
- **What Was Done**:
  - Formatted `RulesPage.tsx` and fast-forward merged `main` across `testing` and `yashraj`.
- **Files Modified**:
  - `frontend/src/pages/RulesPage.tsx`
- **Current Status**: Verified across all 3 branches.

---

### Milestone 10: Automated Socket Port Conflict Resolution (`WinError 10048`)
- **Date & Commit Hash**: November 19, 2026 — Live System Hardening
- **Category**: DevOps / System Architecture / Bug Fix
- **The Problem / Goal**:
  When testing or restarting the backend on Windows, uvicorn previously crashed with:
  ```
  ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8005): [winerror 10048] only one usage of each socket address (protocol/network address/port) is normally permitted
  ```
- **Root Cause & Technical Breakdown**:
  On Windows systems, when Uvicorn reloader spawns worker processes using Python's `multiprocessing.spawn`, terminating the parent terminal or shell may leave child worker processes (e.g. PID `11484`) orphaned in the background. Because the socket handle remains open in `LISTENING` state on `127.0.0.1:8005`, any new attempt to launch Uvicorn fails with `WinError 10048` or `WinError 10013`.
- **Solution**:
  1. Identified and terminated the orphaned background worker process trees using `taskkill /F /T`.
  2. Created an automated port-clearing utility script: **`free_ports.ps1`**, which inspects ports `8005` and `5173` via `Get-NetTCPConnection` and force-terminates any orphaned listening process.
  3. Upgraded **`run_servers.bat`**:
     - Automatically invokes `free_ports.ps1` before launching servers, eliminating socket collisions.
     - Replaced fragile nested quotes with cmd's `/D` flag (`start "Lux Backend" /D "%~dp0backend" cmd /k ...`), correctly handling folder paths containing spaces (e.g. `Python Practtice`).
- **Files Created / Modified**:
  - `free_ports.ps1` (Created)
  - `run_servers.bat`
- **Current Status**: Verified, live, and running smoothly.

---

## 🔐 3. Security Hardening & Compliance Matrix

| Defensive Measure | Implementation Mechanism | Enforcement File | Verification Status |
|---|---|---|---|
| **Stateless Authentication** | HS256 Signed JWTs with user identity & role claims | `backend/app/core/security.py` | ✅ Verified (`test_auth_and_privacy_isolation`) |
| **Password Hashing** | Passlib CryptContext using salted `bcrypt` (12 rounds) | `backend/app/core/security.py` | ✅ Verified |
| **Multi-Tenant Financial Isolation** | Role checker blocks Super Admin from accessing tenant financial ledgers | `backend/app/api/deps.py` | ✅ Verified (`test_role_based_access_control`) |
| **SQL Injection Prevention** | 100% Parameterized SQLAlchemy 2.0 async queries | All endpoints in `backend/app/api/` | ✅ Verified |
| **Rate Limiting** | In-memory sliding window: 10 logins/min, 120 global req/min | `backend/app/core/security_middleware.py` | ✅ Verified (`test_rate_limiter_mechanism`) |
| **Client Price Tampering Immunity** | Authoritative database price lookup; discarded client prices | `backend/app/api/v1/endpoints/billing.py` | ✅ Verified (`test_billing_tampering_and_validation`) |
| **Cross-Site Scripting (XSS)** | `html.escape()` sanitization on customer data & deletion reasons | `backend/app/api/v1/endpoints/customers.py` | ✅ Verified (`test_customer_xss_sanitization`) |
| **Audit Compliance Trail** | Soft deletion requires mandatory justification (>= 5 chars); IP logged | `backend/app/models/__init__.py` | ✅ Verified (`test_customer_soft_delete_mandatory_reason`) |
| **OWASP Security Headers** | HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff | `backend/app/core/security_middleware.py` | ✅ Verified (`test_security_headers_and_hsts`) |
| **Production Masking** | Stack traces concealed behind error UUIDs; docs hidden in prod | `backend/app/main.py` | ✅ Verified |

---

## 🗄️ 4. Full Database Schema & Entity Registry

```
  ┌─────────────────────────────────────────────────────────────┐
  │                           tenants                           │
  ├─────────────────────────────────────────────────────────────┤
  │ id (PK) | name | slug | owner_name | contact_email | phone │
  │ plan (Starter|Pro|Enterprise) | is_active | created_at     │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ 1:N
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
  │    users     │        │  customers   │        │   services   │
  ├──────────────┤        ├──────────────┤        ├──────────────┤
  │ id (PK)      │        │ id (PK)      │        │ id (PK)      │
  │ tenant_id(FK)│        │ tenant_id(FK)│        │ tenant_id(FK)│
  │ role         │        │ full_name    │        │ name         │
  │ password_hash│        │ phone        │        │ category     │
  │ commission   │        │ is_deleted   │        │ base_price   │
  └──────┬───────┘        │ delete_reason│        └──────┬───────┘
         │                └──────┬───────┘               │
         │                       │                       │ 1:N
         │                       │                       ▼
         │                       │                ┌──────────────┐
         │                       │                │service_options│
         │                       │                ├──────────────┤
         │                       │                │ id (PK)      │
         │                       │                │ extra_price  │
         │                       │                └──────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌──────────────┐
              │    bills     │
              ├──────────────┤
              │ id (PK)      │
              │ tenant_id(FK)│
              │ customer_id  │
              │ staff_id     │
              │ subtotal     │
              │ discount     │
              │ total_amount │
              │ payment_mode │
              └──────┬───────┘
                     │ 1:N
                     ▼
              ┌──────────────┐
              │  bill_items  │
              ├──────────────┤
              │ id (PK)      │
              │ bill_id (FK) │
              │ service_name │
              │ options_json │
              │ final_price  │
              └──────────────┘
```

---

## 🚀 5. How to Launch and Verify the Production Environment

### Prerequisites:
- **Python**: 3.12+
- **Node.js**: 20+ & npm
- **Database**: Local MySQL 8.0 running on `127.0.0.1:3306` with database `saloon_db`

### 1-Click Launch:
Simply execute the launcher from the project root:
```powershell
.\run_servers.bat
```
*This automatically checks and frees ports 8005 and 5173, then boots both servers.*

### Manual Terminal Launch:
```powershell
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8005

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Access URLs & Verified Credentials:
- **Frontend Application**: `http://localhost:5173`
- **Backend API & Health Check**: `http://127.0.0.1:8005/health`
- **OpenAPI Interactive Docs**: `http://127.0.0.1:8005/docs`

| Role | Username | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `superadmin` | `superadmin` | Platform tenancies, license provisioning, platform governance rules |
| **Salon Owner** | `owner` | `owner` | Executive economics, historical/future calendar, staff, audit recovery vault |
| **Staff** | `staff` | `staff` | Client directory, service option selection, POS checkout, invoice printing/PDF/PNG |

---

## 🏁 6. Verification Status & Test Suite Results

All 8 automated test suites pass cleanly:
```
tests/test_salon_api.py::test_health_check PASSED                        [ 12%]
tests/test_salon_api.py::test_auth_and_privacy_isolation PASSED          [ 25%]
tests/test_salon_api.py::test_customer_soft_delete_mandatory_reason PASSED [ 37%]
tests/test_salon_api.py::test_security_headers_and_hsts PASSED           [ 50%]
tests/test_salon_api.py::test_customer_xss_sanitization PASSED           [ 62%]
tests/test_salon_api.py::test_billing_tampering_and_validation PASSED    [ 75%]
tests/test_salon_api.py::test_role_based_access_control PASSED           [ 87%]
tests/test_salon_api.py::test_rate_limiter_mechanism PASSED              [100%]

============================== 8 passed in 2.51s ==============================
```

Frontend production build compiles with zero TypeScript or packaging errors:
```
✓ 2814 modules transformed.
dist/index.html                        1.29 kB
dist/assets/index.css                 60.08 kB
dist/assets/index.js               1,286.99 kB
✓ built in 706ms
```

---

## Phase 8: Phase 2 Enterprise Operations & Zero-API Architectural Extension

### Milestone 13: Phase 2 Operational Core (WhatsApp Dispatch, QR Verification, Attendance, Payroll, Expenses & CSV Ledgers)
- **Date**: 2026-11-20
- **Category**: [Full-Stack | Architecture | Zero-API Local Algorithms]
- **The Problem / Goal**:
  Incorporate advanced operational patterns extracted from `EMS-Shekru-Web-App` and `pharmacy` architectures without relying on third-party cloud keys or storage (Zero-API rule). Provide instant customer WhatsApp billing, tamper-proof invoice verification, dynamic floor attendance, commission payroll calculation, operating expense tracking, and native CSV ledger exports.
- **What Was Done**:
  1. **Zero-API WhatsApp Dispatch Engine**: Implemented direct `https://wa.me/{phone}?text={encoded}` protocol handler with custom message template and 1-click quick chips for Dad's numbers (`+91 97630 38822` and `+91 77966 11974`).
  2. **In-House QR Code Digital Verification**: Browser-rendered QR codes on receipt slips linking to public endpoint `/verify?invoice={invoice_number}` with standalone `PublicVerifyInvoicePage`.
  3. **Stylist Attendance & Floor Shifts**: Added `StylistAttendance` database model (`ON_FLOOR`, `ON_BREAK`, `OFF_DUTY`) and shift toggle widget in Staff POS, dynamically driving active floor metrics.
  4. **Specialist Monthly Commission & Payroll**: Automated calculation of commission payouts based on closed bill line items and agreed stylist commission percentages.
  5. **Salon Operating Expenses & True Net Profit**: Created expense tracker across 6 categories (`RENT`, `UTILITIES`, `INVENTORY`, `MAINTENANCE`, `SALARY`, `MISC`) and integrated formula $\text{Net Operating Profit} = \text{Gross Revenue} - (\text{Commissions} + \text{Expenses})$.
  6. **Zero-Dependency CSV Ledger Export**: Built Python native `csv` streaming endpoints `/api/v1/export/bills-csv` and `/api/v1/export/pnl-csv` with zero third-party dependencies.
- **Files Created / Modified**:
  - `backend/app/models/__init__.py`: Added `StylistAttendance` and `Expense` models.
  - `backend/app/schemas/__init__.py`: Added schemas for attendance, expenses, payroll, and invoice verification.
  - `backend/app/api/v1/endpoints/verify.py`: Public invoice verification router.
  - `backend/app/api/v1/endpoints/attendance.py`: Stylist shift clock-in/out and floor status router.
  - `backend/app/api/v1/endpoints/expenses.py`: Operating expenses CRUD router.
  - `backend/app/api/v1/endpoints/payroll.py`: Monthly commission payroll aggregation router.
  - `backend/app/api/v1/endpoints/export.py`: Native CSV streaming router.
  - `backend/app/api/v1/endpoints/analytics.py`: Wired floor attendance and net profit calculations.
  - `backend/app/api/v1/router.py`: Registered all Phase 2 routers.
  - `backend/tests/test_salon_api.py`: Added automated test suite `test_phase_2_endpoints()`.
  - `frontend/src/types/index.ts`: Added Phase 2 interfaces.
  - `frontend/src/services/api.ts`: Added API client methods.
  - `frontend/src/pages/PublicVerifyInvoicePage.tsx`: Public digital invoice verification UI.
  - `frontend/src/pages/StaffPOSDashboard.tsx`: Added shift attendance widget, receipt QR code, and WhatsApp dispatch modal.
  - `frontend/src/pages/SalonOwnerDashboard.tsx`: Added Monthly Commission & Payroll table, Operating Expenses Ledger, True Net Profit metric, and CSV exports.
  - `frontend/src/App.tsx`: Wired public invoice verification routing.
- **Current Status**: Verified, 9/9 automated backend tests passing, frontend builds in 910ms with 0 errors.

