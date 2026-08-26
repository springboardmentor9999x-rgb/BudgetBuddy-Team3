# 💰 BudgetBuddy – Full-Stack Personal Budget Planning & Expense Management Platform

> **Infosys Internship Project**  
> **Student & Personal Finance Management Platform**

---

## 📖 1. Project Overview & Problem Statement

Managing finances as a student or young professional is challenging due to irregular income streams (scholarships, freelance gigs, pocket money), unmonitored daily micro-expenses, and lack of structured monthly budgeting. Traditional spreadsheets are manual and error-prone, while enterprise financial software is overly complex.

**BudgetBuddy** is a modern, responsive, full-stack personal finance and expense management platform specifically tailored for students. It empowers users to:
1. Log multi-source incomes and categorize daily expenses in real-time.
2. Plan monthly spending limits with automatic **80% threshold warnings** and **100%+ overspending alerts**.
3. Create and track milestone-driven **Savings Goals** (e.g., *Laptop Fund, Study Trip, Emergency Savings*).
4. Monitor multi-account liquidity (*Bank Accounts, Physical Cash, Credit Cards, Digital Wallets*).
5. Visualize spending trends with interactive **Chart.js** charts and generate downloadable **CSV/Excel** & printable **PDF** reports.
6. Experience dynamic cross-component state synchronization where notification badges and dashboard metrics update immediately without manual browser refreshes.

---

## 🛠️ 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **React.js 19 (Vite)** | Reactive single-page application |
| **Routing** | **React Router v7** | Client-side routing with `ProtectedRoute` guards |
| **Data Visualization** | **Chart.js & React-Chartjs-2** | Interactive Donut and Monthly Bar charts |
| **Icons & Effects** | **Lucide React & Canvas Confetti** | Visual icons and celebratory animations |
| **HTTP Client** | **Axios** | Interceptors for JWT auth and custom event dispatching |
| **Backend API** | **Python & FastAPI** | High-performance asynchronous REST API |
| **Database ORM** | **SQLAlchemy** | Database schema modeling and relational queries |
| **Data Validation** | **Pydantic v2** | Request and response schema validation |
| **Authentication** | **OAuth2 & Python-Jose (JWT)** | Secure password hashing (Bcrypt) and 256-bit JWT tokens |
| **Database** | **PostgreSQL** | Relational data persistence with strict foreign keys and user isolation |

---

## 🏗️ 3. Architecture & Data Flow

$$\text{React SPA} \xrightarrow{\text{Axios + JWT}} \text{FastAPI Routers} \xrightarrow{\text{Pydantic Schemas}} \text{SQLAlchemy ORM} \xrightarrow{\text{SQL Queries}} \text{PostgreSQL Database}$$

```
┌────────────────────────────────────────────────────────┐
│                   React.js Frontend                    │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │  Dashboard   │ │ Expenses/Inc │ │ Savings Goals  │  │
│  └──────┬───────┘ └──────┬───────┘ └────────┬───────┘  │
│         │                │                  │          │
│         ▼                ▼                  ▼          │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Axios Interceptor + Event Bus (Live Sync)      │  │
│  └───────────────────────┬──────────────────────────┘  │
└──────────────────────────┼─────────────────────────────┘
                           │ HTTP / REST (JWT Bearer)
┌──────────────────────────▼─────────────────────────────┐
│                    FastAPI Backend                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Routers: Auth | Dashboard | Expenses | Income... │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │ Pydantic Validation         │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │          SQLAlchemy Models & Engine              │  │
│  └───────────────────────┬──────────────────────────┘  │
└──────────────────────────┼─────────────────────────────┘
                           │ PostgreSQL Driver
┌──────────────────────────▼─────────────────────────────┐
│             PostgreSQL Relational Database             │
│  [users] [expenses] [income] [budgets] [goals]...      │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ 4. Database Design (PostgreSQL)

The platform utilizes 8 relational tables with strict foreign key constraints (`ON DELETE CASCADE`) to guarantee data integrity and multi-user isolation:

1. **`users`**: `user_id` (PK), `name`, `email` (Unique), `password` (Hashed).
2. **`categories`**: `category_id` (PK), `user_id` (FK), `name` (*Food, Travel, Shopping, Education, Entertainment, Bills & Utilities, Healthcare, Miscellaneous*).
3. **`income`**: `income_id` (PK), `user_id` (FK), `amount`, `source`, `bank_name`, `description`, `income_date`.
4. **`expenses`**: `expense_id` (PK), `user_id` (FK), `category_id` (FK), `amount`, `description`, `expense_date`.
5. **`budgets`**: `budget_id` (PK), `user_id` (FK), `amount`, `month` (Date).
6. **`accounts`**: `account_id` (PK), `user_id` (FK), `account_name`, `account_type` (*Bank, Cash, Card, Wallet*), `balance`, `account_number` (Masked).
7. **`notifications`**: `notification_id` (PK), `user_id` (FK), `title`, `message`, `is_read`, `created_at`.
8. **`financial_goals`**: `goal_id` (PK), `user_id` (FK), `goal_name`, `target_amount`, `current_amount`, `deadline`.

---

## 🚀 5. Getting Started & Installation Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**
- **PostgreSQL Server** running locally or remotely

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` from `.env.example`:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/personal_budget_db
   JWT_SECRET_KEY=your-super-secret-jwt-key
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```
   API Docs available at: `http://localhost:8000/docs`

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Web App available at: `http://localhost:5173`

---

## 🧪 6. Testing & Automated Verification

### Run Automated End-to-End Tests
Executes full CRUD, authentication, threshold notifications, savings goal deposits, and report exports:
```bash
cd backend
python test_e2e.py
```
*Result: 16/16 Passed (100%)*

### Run Security & Data Isolation Audit
Verifies multi-user data isolation, direct ID manipulation protection, and 401 unauthenticated guards:
```bash
cd backend
python test_security.py
```
*Result: 5/5 Security Domains Passed (100%)*

### Run Frontend Production Build
Validates bundle compilation and linting:
```bash
cd frontend
npm run build
```
*Result: Vite compiled in < 1s with 0 errors.*

---

## 🔒 7. Security Highlights
- **User-Specific Scoping**: Every SQL query is parameterized with `current_user.user_id`. Attempting to access another user's record ID returns `404 Not Found`.
- **JWT Protection**: All financial endpoints require `Authorization: Bearer <token>`.
- **Credential Safety**: Passwords are encrypted with Bcrypt and explicitly excluded from all API response models.

---

## 👥 Authors & Acknowledgments
- **Project**: BudgetBuddy – Full-Stack Personal Budget Planning and Expense Management Platform
- **Program**: Infosys Internship Project
