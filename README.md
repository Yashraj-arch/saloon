# LuxeSalon - Multi-Tenant Salon CRM SaaS Platform

A modern CRM SaaS platform for salons and spas featuring Bento Grid UI aesthetics, real-time revenue analytics, an interactive 1921–2099 calendar, dynamic service options, and strict privacy isolation.

---

## Technical Stack
- **Backend**: Python 3.12, FastAPI (Async), SQLAlchemy 2.0 (Async), Alembic, PyMySQL / Asyncmy, Python-Jose (JWT), Passlib (Bcrypt).
- **Database**: MySQL 8.0 (configured with automatic local fallback for initial zero-friction startup).
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts.
- **UI Design System**: Bento Grid with rich dark glassmorphism (`rounded-3xl` containers, glowing purple/indigo accents, and responsive layout).

---

## Quick Start

### 1. Backend Setup
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```
Interactive Swagger docs: [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs)

### 2. Frontend Setup
```powershell
cd frontend
npm run dev
```
Open in browser: [http://localhost:5173/](http://localhost:5173/)

---

## Default Demo Logins

| Persona / Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@luxesaloon.com` | `SuperAdmin@123` | Platform-level salon provisioning & subscription management. **Zero revenue or client data visibility.** |
| **Salon Owner** | `owner@luxeaura.com` | `Owner@123` | Full salon command center: Daily/Weekly/Monthly/Yearly revenue, 1921–2099 calendar drilldown, services catalog, and deletion audit vault. |
| **Staff / Stylist** | `staff@luxeaura.com` | `Staff@123` | Customer desk, live POS checkout with tiered modifiers (e.g. shampoo types, length). Soft-delete requires mandatory reason. |

*(You can also use the 1-click **Persona Switcher** in the top navigation bar to switch between personas seamlessly!)*

---

## Configuring MySQL 8.0
Update `backend/.env` with your MySQL root credentials:
```env
MYSQL_USER="root"
MYSQL_PASSWORD="your_mysql_root_password"
MYSQL_HOST="127.0.0.1"
MYSQL_PORT=3306
MYSQL_DB="saloon_db"
```
The application will automatically connect to your MySQL 8.0 service and initialize all tables.
