# Brightloop Subscription Management System — Requirements Specification

## 1. Executive Summary & Problem Authority
This document defines the Software Requirements Specification (SRS) for the unified Subscription Management System (SMS) developed for **Brightloop Software** as part of the Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026. The official problem statement (`Subscription_Management_System.pdf`) serves as the definitive authority.

Brightloop Software sells software subscriptions, recurring add-ons, and multi-variant products across varying billing frequencies (daily, weekly, monthly, yearly). The platform replaces disparate manual spreadsheets, hand-typed invoices, and ad-hoc payment matching with an automated, auditable, high-performance web platform.

---

## 2. Business Scope & Boundary Rules
- **Single-Tenant Enterprise System**: This is NOT a multi-tenant platform. There is ONE central subscription management system for Brightloop Software to manage its own business, catalog, and customers.
- **Three Distinct User Roles**:
  1. **Admin**: Complete system authority, staff provisioning, catalog creation, pricing, tax & discount configuration, manual billing triggers, financial reports.
  2. **Internal Staff**: Operational execution, quotation preparation, customer record handling, invoice viewing, payment recording.
  3. **Customer**: Self-service portal to view/accept quotations, inspect active subscriptions, request permitted pause/renewals, review invoices, check balances and payment history.
- **Strict Role Isolation**: Customers cannot view or access data of any other customer. Staff cannot create staff accounts or modify admin-only discount/settings rules.

---

## 3. Detailed Functional Requirements

### 3.1. Authentication & User Management
- **Registration**: Small businesses can register with email, password, company name, contact info.
- **Password Strength Policy**: Strictly enforced on backend and frontend:
  - Minimum 9 characters (> 8 characters).
  - At least one uppercase character (`[A-Z]`).
  - At least one lowercase character (`[a-z]`).
  - At least one special symbol (`[!@#$%^&*(),.?":{}|<>]`).
- **Secure Authentication**: Hashed passwords (bcrypt/argon2), JWT / HTTP-only secure cookie sessions.
- **Password Reset**: Cryptographic reset tokens with time-to-live (1 hour), one-time use, Mailpit / SMTP integration.
- **Staff Provisioning**: Strictly limited to Admin.

### 3.2. Product & Variant Catalog
- **Products**: Name, unique product code, product type (`SOFTWARE`, `SERVICE`, `HARDWARE`, `ADDON`), sales price, cost price, notes, archived flag.
- **Product Variants**: Each product can have multiple variants (e.g., Brand: Odoo, Extra Support, Custom Cloud). Each variant has name, description, additional price (e.g., +560), and active toggle.
- **Dynamic Pricing**: Final item price = base product sales price + selected variant additional price.
- **Configurable Currency**: Currency code and symbol configured in Business Settings (e.g., USD `$`, EUR `€`, INR `₹`).

### 3.3. Subscription Plans
- **Plan Fields**: Plan name, description, base recurring price, billing frequency (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`), minimum quantity threshold, availability start and end dates.
- **Policy Flags**:
  - `autoClose`: Automatically marks the subscription closed upon reaching plan end date.
  - `allowEarlyClosure`: Permits early termination by staff/admin.
  - `allowPause`: Allows pausing active subscriptions.
  - `allowRenewal`: Allows renewals when near or after expiry.
  - `isActive`: Catalog visibility flag.

### 3.4. Customer Management
- Centralized customer profiles with business name, billing address, tax ID, primary contact details, currency, lifetime revenue, outstanding balance.
- 360-degree customer view: Subscriptions, Quotations, Invoices, Payments, and Activity History.

### 3.5. Quotation Management & Conversion
- **Quotation Templates**: Reusable templates created by Admin/Staff containing preselected products, plans, default quantities, pricing, and validity duration (in days).
- **Customer Quotations**: Created by Staff/Admin, detailing customer, product lines, variants, quantities, taxes, eligible discounts, validity date.
- **Quotation Acceptance**: Customer views quotation in portal and accepts.
- **Idempotent Subscription Conversion**: On acceptance, automatically converts into a Subscription. System prevents double-conversion.

### 3.6. Subscription Lifecycle Management
- **Official Lifecycle**: `DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`.
- **Operational States**: Paused state (`PAUSED`) when permitted by plan settings; resume transitions back to `ACTIVE`.
- **Subscription Details**: Unique subscription number (e.g., `SUB-2026-0001`), customer, plan, start date, expiry date, next billing date, payment terms, itemized product lines (quantity, unit price, tax, discount, line total).
- **Audit History**: All lifecycle state transitions, pauses, renewals, and closures recorded with timestamp and actor.

### 3.7. Automated Recurring Billing & Invoicing
- **Scheduled Background Worker**: Periodically checks for active subscriptions where `nextBillingDate <= current_date`.
- **Idempotent Invoice Generation**: Unique composite constraint on `(subscriptionId, periodStart)` ensures no billing run ever duplicates invoices.
- **Financial Calculations**: Item lines, subtotal, applicable taxes (based on tax rules), eligible automatic discounts, final invoice total.
- **Invoice Lifecycle**: `DRAFT` → `CONFIRMED` → `PAID`. Overdue status derived from due date and balance.
- **Manual Billing Trigger**: Admin can trigger the billing engine on-demand for immediate demonstration or batch recovery.
- **Invoice Actions**: View, confirm, cancel, download PDF, print, record payments.

### 3.8. Discount Rules Management
- **Admin-Controlled Rules**: Fixed amount discount or percentage discount.
- **Eligibility Criteria**: Minimum purchase amount, minimum seat quantity, start/end date validity, maximum usage limit.
- **Scope**: Applicable to specific products or whole subscriptions.
- **Automatic Application**: Billing engine detects and applies eligible active discounts to the next generated invoice, incrementing usage counters.

### 3.9. Payment Management & Balance Tracking
- **Payment Recording**: Staff/Admin records payments with payment method (`BANK_TRANSFER`, `CREDIT_CARD`, `CASH`, `CHECK`, `ONLINE`), amount, payment date, reference/transaction note.
- **Partial & Multiple Payments**: Invoices track `totalAmount`, `amountPaid`, and `balanceDue`. Multiple partial payments can be logged until balance reaches zero.
- **Overpayment Guard**: Backend strictly forbids payments exceeding the remaining invoice balance.

### 3.10. Finance Analytics & Reporting Dashboard
- **Real Database-Derived Metrics**: Active subscriptions count, total recognized revenue (actual payments received), total invoiced amount, total outstanding balance, overdue invoices count, customer count.
- **Visual Analytics (Recharts)**: Revenue trends over time, subscription distribution by plan, invoice payment status breakdown.
- **Filters**: Date range filtering (Month, Quarter, Year, Custom), status filtering.
- **Zero Mocking**: All statistics computed directly from PostgreSQL aggregation queries.

---

## 4. Non-Functional Requirements
- **Performance**: Sub-2-second query and page response time even with thousands of records, achieved via indexed foreign keys and pagination.
- **Security**: Password hashing with bcrypt, protected routes, JWT/cookie authentication, input sanitization, SQL injection prevention via Prisma ORM.
- **Reliability & Idempotency**: Financial transactions wrapped in Prisma `$transaction` blocks.
- **Evaluator Usability**: Ready-to-run setup via Docker Compose and pre-seeded realistic demo data.
