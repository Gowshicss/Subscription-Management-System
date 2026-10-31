# Brightloop Subscription Management System — System Architecture

## 1. System Topography & Component Design
The system follows a modern decoupled 3-tier architecture:

```
[ Browser / Client ]
      │  React 18 + Vite + TypeScript
      │  Tailwind CSS + Refined Brutalism Design System
      │  TanStack Query + React Hook Form + Zod + Recharts
      ▼
[ Reverse Proxy / API Gateway (Express.js) ]
      │  Port 5000 (REST API /api/v1)
      │  CORS, Helmet, Rate-Limiting, Morgan, JSON Parser
      │  JWT Auth & HTTP-Only Cookies
      │  Role-Based Access Control (RBAC) Middleware
      │  Background Billing Worker & Cron Trigger
      ▼
[ Business Domain Services ]
  ├── AuthService
  ├── CustomerService
  ├── ProductService
  ├── PlanService
  ├── QuotationService
  ├── SubscriptionService
  ├── BillingEngine (Idempotent recurring invoicing)
  ├── InvoiceService (PDF generation, state machine)
  ├── PaymentService (Partial payments, balance auditing)
  ├── DiscountEngine (Rule evaluation & automatic application)
  └── FinanceReportService (PostgreSQL aggregate metrics)
      │
      ▼
[ Prisma ORM (Type-Safe Client) ]
      │  Connection Pooling, Automated Migrations, Seeders
      ▼
[ PostgreSQL 16 Database ]
      │  ACID Transactions, Foreign Keys, Indexes
      │  Port 5432
```

---

## 2. Refined Corporate Brutalist UI Design System
The visual styling adheres strictly to **Refined Professional Clean Corporate Structural Brutalism**:
- **Palette**:
  - Primary Brand Plum: `#4B2D47`
  - Secondary Brand Purple: `#79516F`
  - Informational Soft Teal: `#CDECEF`
  - Teal Accent: `#259DA5`
  - Dark Charcoal: `#252329`
  - Surface Background: `#FFFFFF`
  - Alternate Background: `#F4F4F5`
  - Border: `#E4E1E5`
  - Secondary Typography: `#77727A`
  - Semantic Status: Restrained Emerald (`#059669`), Amber (`#D97706`), Crimson (`#DC2626`)
- **Visual Structure**: 1px sharp borders (`border-border`), high-contrast grid lines, solid monospaced badges for codes & numbers, bold geometric section headers, minimal shadows (`shadow-sm` max), clean table row dividing lines.
- **Micro-Interactions**: Predictable hover transitions (150ms), loading skeletons with brutalist pulse, clear modal overlays.

---

## 3. Recurring Billing Engine & Safeguards
The recurring billing engine is built to guarantee **idempotency** and **zero duplicate invoices**:
1. Subscriptions maintain `nextBillingDate` and `billingFrequency`.
2. Worker computes billing interval `[periodStart, periodEnd]`.
3. Worker runs within a serializable database transaction:
   - Queries `Invoice` for existing record matching `subscriptionId` AND `periodStart`. If exists, logs skip notice and halts.
   - Calculates base plan price + active variant add-on prices * quantity.
   - Applies active discount rules where criteria (`minPurchaseAmount`, `minQuantity`, `productScope`, `dateWindow`, `usageLimit`) are fulfilled.
   - Applies applicable tax rules (`TaxRule.rate`).
   - Inserts new `Invoice` and `InvoiceItem` rows.
   - Updates `subscription.nextBillingDate` to next interval (`+1 day`, `+7 days`, `+1 month`, or `+1 year`).
   - Increments discount usage tracking if applicable.

---

## 4. Financial Calculations & Data Precision
All financial metrics (prices, taxes, discounts, totals, balances) are calculated using strict decimal precision to eliminate IEEE-754 floating-point rounding errors:
- In Prisma: `Decimal(12, 2)`
- Calculations enforce `round(value, 2)` before database insertion.
- Formula:
  $$\text{Subtotal} = \sum (\text{Line Unit Price} \times \text{Quantity})$$
  $$\text{Discount Amount} = \text{Fixed Discount} \lor (\text{Subtotal} \times \text{Percentage Rate})$$
  $$\text{Taxable Amount} = \max(0, \text{Subtotal} - \text{Discount Amount})$$
  $$\text{Tax Amount} = \text{Taxable Amount} \times \text{Tax Rate}$$
  $$\text{Total Amount} = \text{Taxable Amount} + \text{Tax Amount}$$
  $$\text{Balance Due} = \max(0, \text{Total Amount} - \text{Amount Paid})$$

