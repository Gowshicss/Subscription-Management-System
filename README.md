# Brightloop — Subscription Management System

> **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026 Submission**  
> *A production-grade, centralized B2B Subscription Management, Recurring Billing Engine, and Financial Ledger Platform built for Brightloop Software.*

---

## Technology Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

live Demo link-"https://subscription-management-system-zeta-cyan.vercel.app/"

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Component-driven Single Page Application with strict types |
| **Build Tooling** | Vite | Lightning-fast HMR and optimized production bundling |
| **Styling & Design** | Tailwind CSS + Lucide Icons | Refined Corporate Brutalism design system in Deep Plum (`#4B2D47`) and Teal (`#259DA5`) |
| **State & Data Fetching** | TanStack Query (React Query) | Declarative caching, cache invalidation, and server synchronization |
| **Data Visualization** | Recharts | Responsive billing trends, ARR/MRR run-rates, and financial distribution |
| **Backend Runtime** | Node.js (v18+) | Enterprise-grade asynchronous JavaScript/TypeScript execution runtime |
| **Backend Framework** | Express.js | Modular RESTful API architecture with typed routes and controllers |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational schema with ACID transactions and strict `Decimal(12, 2)` monetary precision |
| **Document Generation** | PDFKit | Real-time vector rendering of downloadable official tax invoices in `₹` |
| **Background Processing**| Built-in Cron Worker | Automated recurring billing evaluation and due-cycle invoice generation |
| **Containerization** | Docker & Docker Compose | Multi-container environment orchestration for turnkey evaluation .|

---

## Project Overview

**Brightloop Software** is a B2B enterprise software company selling cloud solutions, priority service level agreements (SLAs), user seat expansions, and configurable product packages across monthly, quarterly, annual, and custom billing frequencies.

Brightloop previously relied on fragmented spreadsheets, manual quotation generation, and disconnected invoice drafting. This resulted in delayed recurring billing, missed renewal notices, proration discrepancies, and zero real-time visibility into actual monthly recurring revenue (MRR) and outstanding receivables.

The **Brightloop Subscription Management System** solves these operational challenges by unifying the entire business lifecycle into a single, high-performance platform:

1. **Catalog & Variant Governance**: Configurable catalog supporting software and services, dynamic add-ons, and multi-tier variants (e.g., *Brand: Odoo Edition* add-on).
2. **Commercial Quotations**: Sales team creates multi-line item proposals with automated coupon discounts and tax calculations in Indian Rupees (`₹`).
3. **One-Click Subscription Activation**: Customers review and accept proposals through their dedicated self-service portal, immediately converting quotations into live recurring contracts.
4. **Autonomous Recurring Billing Engine**: Idempotent billing worker evaluates active contracts, computes discounts/taxes, and generates non-duplicate invoices when cycles mature.
5. **Multi-Payment Financial Ledger**: Supports partial and full settlements, prevents overpayments, calculates remaining balances, and renders official PDF invoices.
6. **Executive Finance Analytics**: 100% database-derived calculations of ARR, MRR, realized cash-in, outstanding dues, and overdue receivables.

> **Scope Note**: This system is purpose-built as **Brightloop Software's internal enterprise operations platform**. It is not an unmanaged multi-tenant SaaS marketplace; it manages Brightloop's own customers, contracts, and financial ledgers.

---

## Key Features

### 1. Authentication & Access Control
- Secure credential authentication using bcrypt hashing (salt rounds: 10).
- Strict password policy enforced at registration: >8 characters, uppercase, lowercase, numbers, and special characters (`!@#$%^&*...`).
- Role-Based Access Control (RBAC) across three distinct actors: `ADMIN`, `STAFF`, and `CUSTOMER`.
- Stateless JWT authentication with standard 7-day token expiration and automatic Bearer injection.
- Customer self-registration flow with duplicate email safeguards and automatic linked Customer profile creation.
- Password recovery via secure time-limited reset tokens with email dispatch fallback.

### 2. Customer Management
- Complete customer directory with company name, contact person, verified email, phone, and billing address.
- 360° Customer Profile modal displaying lifetime billing totals: Gross Invoiced, Total Paid, and Outstanding Balance in `₹`.
- Relationship linkage to all associated quotations, active subscriptions, and payment receipts.

### 3. Product & Variant Management
- Categorized catalog supporting `SOFTWARE` licenses and `SERVICE` agreements.
- Multi-tier product variant engine allowing additive pricing (e.g., *Standard +₹0.00*, *Brand: Odoo Edition +₹560.00*).
- Explicit tracking of Sales Price (`₹`) and internal Cost Price (`₹`) for margin auditing.
- Soft-archive functionality preserving past transaction auditability without breaking historical ledger lines.

### 4. Subscription Plan Management
- Multi-frequency billing configurations: `DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, and `YEARLY`.
- Governance permission flags:
  - `allowPause`: Controls whether customers can pause/resume active recurring subscriptions.
  - `allowRenewal`: Governs manual and automatic cycle renewal workflows.
  - `allowEarlyClosure`: Enforces policy on premature contract terminations.
- Configurable base recurring pricing (₹) and operational grace period controls.

### 5. Quotation Management
- Multi-item quotation builder linking products, specific variants, custom quantities, and negotiated unit prices.
- Automated discount code validation checking minimum order values, active date windows, and usage caps.
- Dynamic tax rule integration calculating subtotal, discount reduction, tax liability, and gross total in `₹`.
- Complete quotation lifecycle state transitions: `DRAFT` ➔ `SENT` ➔ `APPROVED` / `REJECTED` / `EXPIRED`.
- Automatic one-click contract conversion into live recurring subscriptions upon customer approval.

### 6. Subscription Management
- Unique human-readable contract numbering (`SUB-YYYY-XXXX`).
- Full lifecycle status state machine: `DRAFT`, `CONFIRMED`, `ACTIVE`, `PAUSED`, `EXPIRED`, `CLOSED`.
- Tracking of start dates, end dates, trial periods, and computed `nextBillingDate`.
- Customer self-service pause, resume, and renew controls (strictly adhering to plan permission flags).

### 7. Recurring Billing Engine
- Automated background worker running every 60 seconds (or on-demand via header trigger `Run Billing Engine`).
- Idempotency safeguard: Unique composite indexing on `(subscriptionId, periodStart)` guarantees **zero duplicate invoices** even on accidental double-execution.
- Automated billing calculation: Subtotal + Add-ons - Eligible Discounts + Applicable Tax Rates.
- Audit logging tracking evaluated subscriptions, generated invoices, skipped items, and gross billed amount in `₹`.

### 8. Invoice Management & PDF Generation
- Human-readable sequential numbering (`INV-YYYY-XXXX`).
- Lifecycle status tracking: `DRAFT`, `CONFIRMED`, `PAID`, `CANCELLED`.
- Dual balance tracking: `amountPaid` vs `balanceDue` in Indian Rupees (`₹`).
- Automatic overdue detection flag (`isOverdue`) when current date exceeds `dueDate`.
- Built-in PDF generator utilizing vector styling in Deep Plum and Teal, producing downloadable tax statements.

### 9. Payment Ledger & Overpayment Guard
- Multi-payment tracking supporting partial settlements, incremental installments, and lump-sum clearances.
- Supported settlement channels: `CREDIT_CARD`, `BANK_TRANSFER`, `UPI`, `CASH`, and `CHEQUE`.
- Atomic database transactions allocating payments to invoice balances with overpayment rejection guards (`payment <= balanceDue`).
- Automatic invoice status advancement from `CONFIRMED` to `PAID` once balance reaches `₹0.00`.

### 10. Finance Executive Dashboard
- 100% database-aggregated KPI cards:
  - **Revenue Collected**: Cleared cash payments received in `₹`.
  - **Outstanding Receivables**: Unpaid balances awaiting collection.
  - **Overdue Invoices**: Accounts receivable past due date flagged for operational follow-up.
  - **Annual Run-Rate (ARR)** & **Monthly Recurring Revenue (MRR)**: Active subscription run-rates.
- Interactive Recharts bar visualization illustrating month-over-month billing demands versus cleared cash.

### 11. Staff Management
- Admin-controlled staff provisioning interface with immediate credential generation.
- Role isolation ensuring internal staff have operational access without administrative master settings privileges.

---

## User Roles and Permissions

The system implements Role-Based Access Control enforced at the Express API middleware layer ([`backend/src/middleware/auth.ts`](file:///c:/Subscription-Management-System/backend/src/middleware/auth.ts)):

| Operational Capability | ADMIN | STAFF | CUSTOMER |
|---|:---:|:---:|:---:|
| **Executive Finance Dashboard** (ARR, MRR, Revenue) | Full Access | View Summary | Hidden |
| **Manage Catalog** (Products, Variants, Costs) | Full CRUD | Read-Only | Read-Only |
| **Manage Subscription Plans** (Frequencies, Rules) | Full CRUD | Read-Only | View Available |
| **Customer Directory & 360 Profiles** | Full CRUD | Create / View | View Own Profile |
| **Create & Dispatch Quotations** | Full Access | Full Access | View & Accept Own |
| **Trigger Recurring Billing Engine** | Manual & Auto | Auto Only | No Access |
| **Manage Invoices & Record Payments** | Full Access | Record Payments | View Own & Download PDF |
| **Configure Discounts & Tax Rules** | Full CRUD | Read-Only | Auto-Applied on Quote |
| **Staff Member Provisioning** | Full CRUD | No Access | No Access |
| **Business Settings & Master Legal Details** | Full Access | Read-Only | Read-Only |

---

## System Architecture

```mermaid
graph TD
    subgraph Client Tier ["Client Layer (Browser)"]
        UI["React 19 SPA (Vite + TypeScript)"]
        UI_A["Admin & Staff Dashboard"]
        UI_C["Customer Self-Service Portal"]
        UI --> UI_A
        UI --> UI_C
    end

    subgraph APITier ["Backend Application Layer (Express.js)"]
        Router["Express REST Router (/api/v1)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        Controllers["Domain Controllers (Auth, Customers, Invoices, Subs)"]
        BillingWorker["Automated Billing Engine (Cron / On-Demand)"]
        PDFGen["PDFKit Invoice Generator"]

        Router --> AuthMiddleware
        AuthMiddleware --> Controllers
        Controllers --> BillingWorker
        Controllers --> PDFGen
    end

    subgraph DataTier ["Persistence Layer (PostgreSQL)"]
        Prisma["Prisma ORM Client (Type-Safe Queries)"]
        Postgres[("PostgreSQL 16 Database\nDecimal(12,2) Precision")]
        
        Controllers --> Prisma
        BillingWorker --> Prisma
        Prisma --> Postgres
    end

    UI -->|"HTTP / REST API (Bearer Token)"| Router
```

### Layer Responsibilities
- **Frontend Layer**: Manages client viewports, authentication state in `AuthContext`, form validation via Zod, and UI renders using Tailwind CSS Corporate Brutalist tokens.
- **Backend Layer**: Handles incoming requests, enforces RBAC permission matrices, executes business calculations, runs recurring billing cron evaluation, and streams generated PDF binaries.
- **Data Layer**: Enforces relational foreign keys, cascade safety, indexed unique constraints (e.g. idempotency keys), and strict monetary decimals.

---

## Application Screenshots

Screenshots showcasing the application's clean Corporate Brutalist user interface:

| View | Route | Focus Features |
|---|---|---|
| **Authentication Portal** | `/login` | High-contrast branding, credentials quick-login buttons, role switcher |
| **Finance Executive Dashboard** | `/` | ARR, MRR, realized revenue, billing trends chart, and recent ledger |
| **Customer Management Directory** | `/customers` | Enterprise accounts, lifetime billing totals (₹), Customer 360 modal |
| **Product & Variant Catalog** | `/products` | Software & service items, sales/cost prices (₹), Odoo Edition add-on config |
| **Subscription Plan Tiering** | `/plans` | Billing frequencies, grace period controls, pause/cancellation governance |
| **Quotation Proposal Builder** | `/quotations` | Multi-item proposal builder, automated discounts, tax rules |
| **Subscription Lifecycle** | `/subscriptions` | Recurring contracts, active/paused status, next billing cycle evaluation |
| **Invoices & Financial Ledger** | `/invoices` | Billed cycles, balance tracking (₹), official PDF downloads, payment trigger |
| **Payment Settlement Modal** | `/invoices` & `/payments` | Partial/full payment settlement modal, overpayment protection |
| **Customer Self-Service Portal** | `/portal` | Customer-facing subscription overview, invoice history, proposal sign-off |

> Visual captures are cataloged in [`docs/screenshots/`](file:///c:/Subscription-Management-System/docs/screenshots/README.md).

---

## Project Folder Structure

```text
Subscription-Management-System/
├── docs/
│   ├── REQUIREMENTS.md           # Business requirements extracted from problem statement
│   ├── ARCHITECTURE.md           # System topology, layers, and design tokens
│   ├── DATABASE_SCHEMA.md        # Relational ERD and Prisma model specifications
│   ├── API_SPECIFICATION.md      # REST API contracts and request/response schemas
│   ├── ROLE_PERMISSIONS.md       # RBAC permission matrix for Admin, Staff, Customer
│   ├── IMPLEMENTATION_PLAN.md    # Milestones and execution tracking
│   └── screenshots/              # Screenshot catalog and visual guide
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # 18 relational models with Decimal(12, 2) precision
│   │   └── seed.ts               # Production seed script with demo credentials
│   ├── src/
│   │   ├── config/               # Typed environment variables and defaults
│   │   ├── controllers/          # Express route controllers
│   │   ├── cron/                 # Recurring billing background worker
│   │   ├── lib/                  # Prisma client singleton
│   │   ├── middleware/           # Auth JWT & RBAC guards, error handling
│   │   ├── routes/               # Modular Express API v1 routers
│   │   ├── services/             # Core business logic domain services
│   │   └── index.ts              # Server bootstrap, Express app & cron scheduler
│   ├── test/
│   │   ├── run-tests.ts          # 30 automated integration tests
│   │   └── perf-test.ts          # Measured query performance benchmark
│   ├── package.json              # Backend dependencies and scripts
│   ├── tsconfig.json             # TypeScript compiler configuration
│   └── Dockerfile                # Production container specification
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable Brutalist layout, cards, badges, modal
│   │   ├── context/              # Authentication session state provider
│   │   ├── lib/                  # Fetch wrapper with Bearer token injection
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Register, Forgot & Reset Password
│   │   │   ├── dashboard/        # Finance executive overview & Recharts
│   │   │   ├── customers/        # Customer directory & 360 profile
│   │   │   ├── products/         # Products & variant manager
│   │   │   ├── plans/            # Billing frequencies & policy rules
│   │   │   ├── quotations/       # Quotation creator & dispatcher
│   │   │   ├── subscriptions/    # Subscriptions ledger & lifecycle actions
│   │   │   ├── invoices/         # Invoices, PDF generator & payment modal
│   │   │   ├── payments/         # Cleared payments ledger
│   │   │   ├── discounts/        # Discount & coupon rules builder
│   │   │   ├── taxes/            # Tax rules manager
│   │   │   ├── staff/            # Admin staff provisioning
│   │   │   ├── settings/         # Business currency & legal details
│   │   │   └── portal/           # Customer self-service portal
│   │   ├── routes/               # Protected route tree
│   │   └── types/                # Unified TypeScript interfaces
│   ├── package.json              # Frontend dependencies and scripts
│   ├── tailwind.config.js        # Design tokens and brutalist styling rules
│   ├── vite.config.ts            # Vite dev server and API proxy configuration
│   └── Dockerfile                # Multi-stage production container build
├── docker-compose.yml            # Multi-container orchestration (DB, API, Web, Mail)
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git tracking exclusion rules
├── package.json                  # Root monorepo orchestration scripts
└── README.md                     # Master project documentation
```

---

## Prerequisites

To run this application locally, ensure you have:

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**: v2.30+
- **Database Options**:
  - **Docker Desktop** (Recommended for turnkey evaluation) — OR
  - **PostgreSQL 14+** installed natively or in WSL2

---

## Installation and Local Setup

### Option A: 1-Command Startup with Docker Compose (Recommended)

Evaluators can run the entire system locally with a single command without installing databases:

```bash
# 1. Clone the repository
git clone https://github.com/TanuSree2005/Subscription-Management-System.git
cd Subscription-Management-System

# 2. Copy the environment template
cp .env.example .env

# 3. Launch all containers (PostgreSQL, Backend API, Frontend SPA, Mailpit)
docker compose up --build
```

Access the application at [http://localhost:5173](http://localhost:5173).

---

### Option B: Local Native Setup (Developer Mode):

#### Step 1 — Clone the Repository
```bash
git clone https://github.com/TanuSree2005/Subscription-Management-System.git
cd Subscription-Management-System
```

#### Step 2 — Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

#### Step 3 — Configure Environment Variables
```bash
# Copy example file to active .env
cp .env.example .env
cp .env.example backend/.env
```

#### Step 4 — Start PostgreSQL Database
If using Docker for the database only:
```bash
docker compose up -d postgres
```
*(Or ensure your local PostgreSQL service is running on port `5432` with database `brightloop_subscriptions`).*

#### Step 5 — Configure Database Schema & Seed Data
```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Apply migrations / push schema
npx prisma db push

# Seed demo enterprise data
npm run prisma:seed
```

#### Step 6 — Start the Backend Server (Terminal 1)
```bash
cd backend
npm run dev
```
*Backend starts on `http://localhost:5000`.*

#### Step 7 — Start the Frontend Application (Terminal 2)
```bash
cd frontend
npm run dev
```
*Frontend starts on `http://localhost:5173`.*

#### Step 8 — Open the Application
- **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **API Base Endpoint**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory before running the application.

| Variable Name | Required | Default / Example Value | Description |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/brightloop_subscriptions?schema=public` | PostgreSQL connection string |
| `PORT` | Yes | `5000` | Express HTTP backend server port |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed origin for CORS headers |
| `JWT_SECRET` | Yes | `brightloop_production_grade_jwt_secret_kochi_hackathon_2026_odoo` | Secret key for signing JSON Web Tokens |
| `JWT_EXPIRES_IN`| No | `7d` | Token expiration period |
| `SMTP_HOST` | No | `localhost` | SMTP host for email notifications (Mailpit) |
| `SMTP_PORT` | No | `1025` | SMTP port for email delivery |
| `SMTP_USER` | No | `""` | Optional SMTP username |
| `SMTP_PASS` | No | `""` | Optional SMTP password |
| `SMTP_FROM` | No | `Brightloop Software <billing@brightloop.io>` | Sender email header |

> [!NOTE]
> All credentials in `.env.example` are safe development defaults for local testing. In production environments, replace them with strong, unique secrets.

---

## Demo Login Instructions

The database seed script automatically creates accounts for all three user roles:

| Role | Email Address | Password | Intended Role Experience |
|:--- |:--- |:--- |:--- |
| **Admin** | `admin@brightloop.io` | `Brightloop@2026!` | Complete executive control, finance dashboard, catalog, billing engine trigger |
| **Internal Staff** | `staff@brightloop.io` | `Brightloop@2026!` | Operational sales, quote creation, customer management, payment recording |
| **Customer** | `client@techcorp.com` | `Brightloop@2026!` | Self-service portal: review proposals, pause/resume subscriptions, download invoice PDFs |

> **Evaluator Tip**: The Login screen includes one-click **Quick-Login Pills** (`Admin`, `Staff`, `Customer`) that automatically pre-fill credentials for seamless testing.

---

## API Documentation

### Base URL: `http://localhost:5000/api/v1`

All protected endpoints require an `Authorization: Bearer <token>` header.

| Domain Module | Method | Endpoint | Access Role | Description |
|---|:---:|---|:---:|---|
| **Authentication** | `POST` | `/auth/login` | Public | Sign in with email and password |
| | `POST` | `/auth/register` | Public | Customer self-registration |
| | `GET` | `/auth/me` | Authenticated | Fetch current authenticated user session |
| | `POST` | `/auth/forgot-password` | Public | Dispatch password reset token |
| | `POST` | `/auth/reset-password` | Public | Complete password reset |
| **Dashboard** | `GET` | `/dashboard/metrics` | Admin / Staff | Aggregated financial metrics (ARR, MRR, Revenue) |
| | `GET` | `/dashboard/charts` | Admin / Staff | Monthly revenue and billing volume trends |
| | `GET` | `/dashboard/recent` | Admin / Staff | Latest 5 invoices and payments |
| **Customers** | `GET` | `/customers` | Admin / Staff | Paginated customer list with financial summaries |
| | `POST` | `/customers` | Admin / Staff | Create a new customer profile |
| | `GET` | `/customers/:id` | Admin / Staff | Get full customer profile with financial ledger |
| **Products** | `GET` | `/products` | Authenticated | List all active products and variants |
| | `POST` | `/products` | Admin | Create product with sales & cost pricing |
| | `POST` | `/products/:id/variants` | Admin | Add a new pricing variant to a product |
| **Subscription Plans** | `GET` | `/plans` | Authenticated | List available recurring billing plans |
| | `POST` | `/plans` | Admin | Create plan with frequency and permission rules |
| **Quotations** | `GET` | `/quotations` | Admin / Staff / Customer | List quotations (scoped by customer for customers) |
| | `POST` | `/quotations` | Admin / Staff | Create multi-item quotation proposal |
| | `POST` | `/quotations/:id/accept` | Customer / Admin | **Approve quotation & auto-convert into subscription** |
| **Subscriptions** | `GET` | `/subscriptions` | Admin / Staff / Customer | List subscriptions with lifecycle status |
| | `POST` | `/subscriptions/:id/pause` | Authenticated | Pause active subscription (if permitted by plan) |
| | `POST` | `/subscriptions/:id/resume`| Authenticated | Resume paused subscription |
| **Billing Engine** | `POST` | `/billing/trigger` | Admin | **Execute automated recurring billing cycle** |
| **Invoices** | `GET` | `/invoices` | Admin / Staff / Customer | List invoices with paid & balance due amounts |
| | `GET` | `/invoices/:id/pdf` | Authenticated | **Download official vector PDF invoice statement** |
| **Payments** | `GET` | `/payments` | Admin / Staff / Customer | List cleared payment transactions |
| | `POST` | `/payments` | Admin / Staff | **Record partial/full payment with overpayment guard** |
| **Settings** | `GET` | `/settings` | Authenticated | Fetch business currency (`INR/₹`) and entity details |
| | `PUT` | `/settings` | Admin | Update operational business settings |

---

## Database Design

The schema is built in PostgreSQL using Prisma ORM with strict decimal precision (`@db.Decimal(12, 2)`):

```mermaid
erDiagram
    User ||--o{ AuditLog : creates
    User }o--|| Role : has
    Customer ||--o{ Quotation : receives
    Customer ||--o{ Subscription : holds
    Customer ||--o{ Invoice : billed
    Customer ||--o{ Payment : pays

    Product ||--o{ ProductVariant : contains
    Product ||--o{ QuotationItem : referenced
    Product ||--o{ SubscriptionItem : provisioned
    Product ||--o{ InvoiceItem : billed

    SubscriptionPlan ||--o{ Quotation : templates
    SubscriptionPlan ||--o{ Subscription : governs

    Quotation ||--o{ QuotationItem : contains
    Quotation ||--o| Subscription : converts_into

    Subscription ||--o{ SubscriptionItem : contains
    Subscription ||--o{ Invoice : generates

    Invoice ||--o{ InvoiceItem : contains
    Invoice ||--o{ Payment : receives

    Discount ||--o{ DiscountUsage : tracks
    TaxRule ||--o{ QuotationItem : applies
```

### Key Entities
- **User**: System accounts (`ADMIN`, `STAFF`, `CUSTOMER`) with bcrypt hashes.
- **Customer**: B2B customer accounts with contact information and currency (`INR`).
- **Product & ProductVariant**: Software/service items with base price and variant differentials.
- **SubscriptionPlan**: Defines billing frequency, grace periods, and lifecycle governance permissions.
- **Quotation & QuotationItem**: Multi-line proposals with discount and tax calculations.
- **Subscription & SubscriptionItem**: Active recurring contracts tracking `nextBillingDate`.
- **Invoice & InvoiceItem**: Generated billing demands tracking `amountPaid`, `balanceDue`, and overdue status.
- **Payment**: Individual payment transactions with method tracking and balance allocations.
- **BusinessSettings**: Company profile, legal tax ID, address, and default currency (`INR`/`₹`).

---

## Subscription and Billing Workflow

```mermaid
flowchart TD
    A["1. Sales Staff drafts Quotation with Products & Variants"] --> B["2. Automated Discounts & Taxes applied (₹)"]
    B --> C["3. Proposal dispatched to Customer (Status: SENT)"]
    C --> D["4. Customer logs into Portal and accepts Quotation"]
    D --> E["5. Quotation auto-converts into active Subscription"]
    E --> F["6. Next Billing Date calculated according to Plan Frequency"]
    F --> G["7. Recurring Billing Engine evaluates mature Subscriptions"]
    G --> H{"Idempotency Check\n(Invoice already exists for cycle?)"}
    H -- Yes --> I["Skip cycle (0 duplicate invoices)"]
    H -- No --> J["Generate new Invoice in CONFIRMED status"]
    J --> K["8. Customer views Invoice & downloads official PDF statement"]
    K --> L["9. Staff records partial or full settlement (₹)"]
    L --> M{"Balance Due == 0?"}
    M -- Partial --> N["Invoice remains CONFIRMED, Balance Due reduced"]
    M -- Full --> O["Invoice status transitions to PAID"]
    N --> P["10. Finance Dashboard live updates: Realized Cash, ARR, MRR"]
    O --> P
```

---

## Testing & Verification

### Automated Integration Test Suite (30 Tests Passed)
The project includes a comprehensive test harness validating the full business workflow end-to-end:

```bash
cd backend
npm test
```

**Verified Test Output:**
```text
====================================================
📊 TEST RESULTS: 30 PASSED | 0 FAILED
====================================================
✓ Password complexity policy verification
✓ Customer registration and duplicate email rejection
✓ Product creation and dynamic variant pricing calculation
✓ Plan date range validation and permission flags
✓ Quotation creation with automatic discount detection
✓ Quotation acceptance and idempotent subscription conversion
✓ Duplicate conversion prevention
✓ Subscription pause and resume lifecycle transitions
✓ Automated recurring billing run
✓ Billing idempotency safeguard (0 duplicate invoices)
✓ Multi-payment ledger and partial payment tracking
✓ Overpayment rejection guard
✓ Customer data isolation
```

### Performance SLA Benchmark (<2000ms SLA)
The problem statement requires all queries to respond in under 2 seconds:

```bash
cd backend
npm run test:perf
```

**Measured Timings:**
```text
====================================================
⚡ PERFORMANCE BENCHMARK & QUERY TIMINGS
====================================================
Test 1: Admin Finance Dashboard Aggregates -> 200ms  (Target: <2000ms) [PASS]
Test 2: Paginated Customers Query          -> 29ms   (Target: <2000ms) [PASS]
Test 3: Subscriptions by Status Query      -> 10ms   (Target: <2000ms) [PASS]
====================================================
```

### Frontend Production Build
```bash
cd frontend
npm run build
```
*Result: Built cleanly in 9.22s with 0 TypeScript compilation errors.*

---

## Future Improvements

1. **Payment Gateway Integration**: Direct Razorpay and Stripe webhook integrations for automatic card debiting.
2. **Automated Dunning Sequences**: Configurable email escalation intervals for overdue accounts.
3. **Multi-Currency Support**: Dynamic forex rate conversions for international enterprise clients.
4. **Subscription Proration Engine**: Granular mid-cycle upgrade and downgrade proration calculations.
5. **Usage-Based Metering**: API consumption metering via Redis event counters.

---

## Team and Contributions

Developed for the **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**:

| Team Member | Role | Contribution Area |
|---|---|---|
| **Tanu Sree** | Team Leader & Full-Stack Architect | System Architecture, Database Design, Billing Engine |
| **Gowshic S S** | Frontend Engineer | UI Component Architecture, Design System Implementation |
| **Sanmuga Priya** | Backend Engineer | API Routes, Controller Logic, RBAC Authentication |
| **Nandhana** | Database & QA Engineer | PostgreSQL Schema, Migrations, Integration Test Suite |


---

## License

This project is licensed under the [MIT License](LICENSE).
