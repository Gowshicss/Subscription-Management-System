# Brightloop — Subscription Management System
> **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**  
> *Production-Ready Full-Stack Subscription Lifecycle, Recurring Billing & Financial Ledger Platform*

---

## 1. System Overview
Brightloop Software is an enterprise software vendor selling business software suites, priority SLAs, seat add-ons, and multi-tier configurable product variants across daily, weekly, monthly, and yearly cycles.

This unified Subscription Management System (SMS) acts as the operational and financial core of Brightloop, replacing legacy manual spreadsheets and handwritten invoices with:
- **Zero-touch Recurring Invoicing**: Automated background billing worker with idempotent invoice generation and duplicate protection.
- **Dynamic Variant Pricing**: Seamless multi-variant pricing calculation (including the Odoo Edition connector variant with configurable +$560 add-on pricing).
- **Self-Service Customer Portal**: Commercial quotation approval, one-click auto-conversion into live subscriptions, plan pause/renewals, and invoice PDF downloads.
- **Auditable Financial Ledger**: Multi-payment tracking, partial payment allocations, balance due calculations, and overpayment guards.
- **Real-Time Financial Dashboard**: 100% database-derived ARR, MRR, realized cash revenue, billing demands, and overdue tracking with Recharts visualizations.

---

## 2. Refined Corporate Brutalist Design System
The visual identity follows **Refined Professional Clean Corporate Structural Brutalism** inspired by Odoo's signature plum and purple aesthetic:

| Token Name | Hex Code | Visual Application |
| :--- | :--- | :--- |
| **Deep Plum** | `#4B2D47` | Primary brand identity, sidebar shell, primary action buttons |
| **Muted Odoo Purple** | `#79516F` | Secondary headers, accented numbers, subtle borders |
| **Teal Accent** | `#259DA5` | Informational callouts, active indicators, interactive links |
| **Soft Teal** | `#CDECEF` | Subtle badge backgrounds, highlight pills |
| **Charcoal** | `#252329` | High-contrast geometric typography and table headers |
| **Surface Background** | `#FFFFFF` | Main application cards and viewports |
| **Secondary Background** | `#F4F4F5` | Data table header rows and metric containers |
| **Border Grey** | `#E4E1E5` | Sharp 1px structural dividing lines |

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Recharts, Lucide React.
- **Backend**: Node.js, Express.js, TypeScript, REST API architecture, Prisma ORM, PDFKit, Nodemailer.
- **Database**: PostgreSQL 16 with ACID transactions and strict decimal precision (`Decimal(12, 2)`).
- **DevOps & Infrastructure**: Docker, Docker Compose, Mailpit (Local SMTP testing).

---

## 4. Evaluator Quick Start (Docker Compose)

Evaluators can run the entire system locally with a single command without installing external databases.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1-Command Startup
```bash
# 1. Clone the repository
git clone https://github.com/Mowsikan-Hariharasudhan/Subscription-Management-System.git
cd Subscription-Management-System

# 2. Copy the environment template
cp .env.example .env

# 3. Launch all services via Docker Compose
docker compose up --build
```

### Access URLs
- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **Backend Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Mailpit Email Testing Web UI**: [http://localhost:8025](http://localhost:8025)

---

## 5. Pre-Seeded Demo Credentials

The database comes pre-seeded with realistic enterprise records and accounts satisfying all hackathon password policies (>8 characters, uppercase, lowercase, special character):

| Role | Email Address | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Brightloop@2026!` | Full executive access, catalog, billing trigger, staff, finance dashboard |
| **Staff** | `staff@brightloop.io` | `Staff@2026!` | Operational access, customer quotes, view invoices, record payments |
| **Customer** | `acme@customer.com` | `Customer@2026!` | Self-service portal, review/accept quotes, view subscriptions & invoices |

> *Tip: The Login Page also features one-click "Evaluator Quick-Login" pills to automatically populate credentials.*

---

## 6. End-to-End Evaluator Demonstration Walkthrough

Follow this 14-step workflow to evaluate the complete end-to-end integration:

1. **Login as Admin**: Sign in with `admin@brightloop.io` / `Brightloop@2026!`.
2. **Review Finance Dashboard**: Inspect real-time metrics (ARR, MRR, Revenue Collected vs Invoiced).
3. **Inspect Products & Variants**: Navigate to **Products & Variants**. Observe the existing `Software Subscription` and the `Brand: Odoo Edition` variant configured with `+$560.00` additional price. Click **Add Product** to create a new service or add an additional variant.
4. **Inspect Subscription Plans**: Navigate to **Subscription Plans**. Review Monthly, Yearly, and Weekly plans with customizable pause, renewal, and early closure permissions.
5. **Sign Out & Register New Customer**:
   - Log out and click **Create an account** on `/register`.
   - Fill in company details and a password meeting all 4 criteria (e.g. `ApexGlobal@2026!`).
   - Notice the real-time password checklist validating rules.
6. **Log In as Staff**: Sign in with `staff@brightloop.io` / `Staff@2026!`.
7. **Create a Customer Quotation**:
   - Navigate to **Quotations** -> **Create Quotation**.
   - Select the registered customer.
   - Add product `Software Subscription` with `Brand: Odoo Edition` variant. Notice the line price automatically calculates `Base $200 + Variant $560 = $760.00`.
   - Save Draft and click **Send** to dispatch to the customer.
8. **Customer Reviews and Accepts Proposal**:
   - Log out and sign in as the customer.
   - Navigate to **My Quotations**.
   - Open the quotation and click **Accept & Activate Subscription**.
   - The system automatically and idempotently converts the quotation into an active subscription.
9. **Verify Subscription Active**:
   - Navigate to **My Subscriptions**.
   - The newly activated subscription appears with next billing schedule and pause/renewal controls.
10. **Execute Automated Recurring Billing**:
    - Log back in as **Admin**.
    - Click the header button **Run Billing Engine** (or call `/api/v1/billing/trigger`).
    - The background worker evaluates subscriptions due for billing, applies eligible discounts (e.g. `$50.00` off), computes tax, and generates the invoice.
    - Notice that clicking the button again immediately produces **0 duplicates** due to composite idempotency constraints `(subscriptionId, periodStart)`.
11. **Review Generated Invoice**:
    - Navigate to **Invoices**.
    - Click the **PDF** button on the newly generated invoice to view the styled official statement.
12. **Record Partial Payment**:
    - On the invoice row, click the green **Pay** button.
    - Enter a partial payment (e.g. `$500.00` out of `$836.00`), select **Bank Transfer / Wire**, and submit.
    - Observe the invoice updates immediately to show **$500.00 Paid** and **$336.00 Balance Due**.
    - Notice that attempting to enter an amount greater than the balance is rejected by the overpayment guard.
13. **Settle Remaining Balance**:
    - Click **Pay** again and settle the remaining balance.
    - The invoice status transitions from `CONFIRMED` to `PAID`.
14. **Confirm Finance Dashboard Live Updates**:
    - Return to the **Dashboard**.
    - Total Revenue Collected, Invoiced Amounts, and Monthly Trend charts update directly from PostgreSQL records.

---

## 7. Automated Test Suite & Performance Timings

### Integration Test Suite (30 Tests Passed)
Execute the integration test suite covering Authentication, Product Variants, Plan Validation, Quotation Auto-Conversion, Idempotency Safeguards, Partial Payments, and Data Isolation:
```bash
cd backend
npm test
```
**Results:**
```
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

### Performance Benchmark Results (<2000ms SLA)
The problem statement requires all queries to respond in under two seconds.
```bash
cd backend
npm run test:perf
```
**Actual Measured Timings:**
```
====================================================
⚡ PERFORMANCE BENCHMARK & QUERY TIMINGS
====================================================
Test 1: Admin Finance Dashboard Aggregates -> 200ms  (Target: <2000ms) [PASS]
Test 2: Paginated Customers Query          -> 29ms   (Target: <2000ms) [PASS]
Test 3: Subscriptions by Status Query      -> 10ms   (Target: <2000ms) [PASS]
====================================================
```

---

## 8. Repository Structure

```
Subscription-Management-System/
├── docs/
│   ├── REQUIREMENTS.md           # SRS extracted from official problem statement
│   ├── ARCHITECTURE.md           # System topology & design system tokens
│   ├── DATABASE_SCHEMA.md        # Relational ERD & Prisma model definitions
│   ├── API_SPECIFICATION.md      # REST API contracts
│   ├── ROLE_PERMISSIONS.md       # RBAC matrix (Admin, Staff, Customer)
│   └── IMPLEMENTATION_PLAN.md    # Phase-by-phase execution tracking
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # 18 relational models with Decimal precision
│   │   └── seed.ts               # Production seed script with demo credentials
│   ├── src/
│   │   ├── config/               # Environment variables
│   │   ├── controllers/          # Express route controllers
│   │   ├── cron/                 # Recurring billing background worker
│   │   ├── lib/                  # Prisma client singleton
│   │   ├── middleware/           # Auth & RBAC guards, error handling
│   │   ├── routes/               # Modular Express API v1 routers
│   │   ├── services/             # Core business logic domain services
│   │   └── index.ts              # Server bootstrap & cron scheduler
│   ├── test/
│   │   ├── run-tests.ts          # 30 automated integration tests
│   │   └── perf-test.ts          # Measured query performance benchmark
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable Brutalist layout, cards, badges
│   │   ├── context/              # Authentication session provider
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
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml            # Multi-container orchestration
├── .env.example                  # Environment template
└── README.md                     # Evaluator demonstration guide
```
