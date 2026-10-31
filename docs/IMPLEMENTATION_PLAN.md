# Brightloop Subscription Management System — Implementation Plan

## Phase Overview & Progress Tracking

- [x] **Phase 1: Requirements & Architecture**
  - Read problem statement PDF (`Subscription_Management_System.pdf`).
  - Formalized SRS, architecture diagrams, data models, RBAC rules, API specs.
  - Setup PostgreSQL 18 in WSL2 with remote access and created `brightloop_subscriptions` database.

- [ ] **Phase 2: Project Foundation & Environment Setup**
  - Initialize backend: Node.js + Express + TypeScript + Prisma.
  - Initialize frontend: Vite + React + TypeScript + Tailwind CSS + Lucide + Recharts.
  - Setup Dockerfile for backend, Dockerfile for frontend, and docker-compose.yml with PostgreSQL and Mailpit.
  - Configure `.env.example` and `.env`.

- [ ] **Phase 3: Prisma Schema, Migrations & Database Seeding**
  - Define complete relational schema with 18+ models, strict foreign keys, indexes, and decimal precision.
  - Execute Prisma migration.
  - Implement idempotent seed script with demo credentials (Admin, Staff, Customer) and realistic mock enterprise data.

- [ ] **Phase 4: Authentication, RBAC & User Management**
  - Password hashing with bcrypt, strict password complexity validation (>8 chars, uppercase, lowercase, special char).
  - JWT tokens with HTTP-only cookies and Authorization headers.
  - RBAC middleware (`requireRole('ADMIN')`, `requireRole('STAFF')`, etc.).
  - Password reset token generation, verification, and email dispatch to Mailpit.
  - Customer registration and Admin staff provisioning.

- [ ] **Phase 5: Core Business Modules**
  - Products & Product Variants CRUD with dynamic price addition.
  - Subscription Plans with daily/weekly/monthly/yearly frequencies & policy flags (`allowPause`, `allowRenewal`, `autoClose`).
  - Tax Rules & Discount Rules with min purchase/quantity, product/whole-sub scope, and validity dates.
  - Customer Profiles with 360-degree financial insights.

- [ ] **Phase 6: Quotations & Subscription Conversion**
  - Quotation Templates & custom Customer Quotations.
  - Customer acceptance in portal with auto-conversion into Subscription.
  - Subscription lifecycle: `DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`.
  - Pause, resume, early close, and renewal operations with audit logging.

- [ ] **Phase 7: Recurring Billing Engine & Financial Ledger**
  - Background billing worker + Admin manual trigger endpoint.
  - Idempotent invoice generation with composite uniqueness `(subscriptionId, periodStart)`.
  - Automatic discount evaluation and tax computation.
  - Invoices lifecycle: `DRAFT` → `CONFIRMED` → `PAID`, with balance and overdue derivation.
  - Multi-payment recording (partial payments, overpayment rejection, payment allocations).
  - Printable / downloadable invoice PDF generation.

- [ ] **Phase 8: Frontend Implementation (Refined Corporate Brutalist UI)**
  - Application layout: collapsible sidebar, top navigation, role switcher/indicator, breadcrumbs.
  - Odoo purple/teal theme system (`#4B2D47`, `#79516F`, `#CDECEF`, `#259DA5`, `#252329`, `#F4F4F5`, `#E4E1E5`).
  - Admin & Staff modules: Products, Plans, Customers, Quotations, Subscriptions, Invoices, Payments, Discounts, Taxes, Settings.
  - Customer Portal: My Profile, My Quotations (with Accept button), My Subscriptions (with pause/renewal actions), My Invoices (with PDF download), Payment History.
  - Real-time Finance Dashboard with Recharts visualization.

- [ ] **Phase 9: Testing, Verification & End-to-End Demo Workflow**
  - Comprehensive automated integration tests (Auth, Products, Plans, Quotations, Subscriptions, Invoicing, Payments, RBAC).
  - Performance benchmark test simulating large data queries.
  - Complete demo walkthrough validation matching the 14-step evaluator script.
  - Complete documentation and GitHub clone instructions.

