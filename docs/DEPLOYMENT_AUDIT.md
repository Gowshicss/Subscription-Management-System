# Production Deployment Audit Report
**Project:** Brightloop Subscription Management System (Odoo x Make-A-Ton 9.0 Hackathon 2026)  
**Target Environment:** 
- **Frontend:** Vercel (SPA / React Router)
- **Backend:** Render (Web Service / Node.js Express)
- **Database:** Neon Serverless PostgreSQL
**Audit Date:** 31 October 2026  
**Auditor:** Senior Full-Stack & DevOps Engineer  
**Status:** Audit Completed — Ready for Phase 2 Production Preparation

---

## 1. Project Structure & Architecture Overview

The repository is structured as a decoupled full-stack monorepo:

```
Subscription-Management-System/
├── backend/                  # Node.js + Express + TypeScript API server
│   ├── prisma/               # Prisma ORM schema & seed scripts
│   ├── src/                  # Express controllers, services, middleware, cron
│   ├── test/                 # Integration and performance test suites
│   ├── package.json          # Backend dependencies and scripts
│   └── tsconfig.json         # TypeScript compiler configuration
├── frontend/                 # React 18 + TypeScript + Vite SPA
│   ├── src/                  # React components, pages, context, styles
│   ├── package.json          # Frontend dependencies and scripts
│   ├── vite.config.ts        # Vite configuration & dev proxy
│   └── tailwind.config.js    # Modern SaaS UI design system configuration
├── docs/                     # Architecture, specifications, and deployment documentation
├── docker-compose.yml        # Local containerized orchestration (PostgreSQL, Mailpit, backend, frontend)
├── package.json              # Monorepo management scripts
└── .gitignore                # Git exclusion rules
```

---

## 2. Inventory of Package Configurations & Scripts

### 2.1 Root `package.json`
- **Name:** `brightloop-subscription-management-system` (v1.0.0)
- **Scripts:**
  - `dev:backend`: `cd backend && npm run dev`
  - `dev:frontend`: `cd frontend && npm run dev`
  - `build`: `cd backend && npm run build && cd ../frontend && npm run build`
  - `test`: `cd backend && npm test`
  - `test:perf`: `cd backend && npm run test:perf`
  - `seed`: `cd backend && npm run prisma:seed`

### 2.2 Backend `backend/package.json`
- **Name:** `brightloop-subscription-backend` (v1.0.0)
- **Node Environment Target:** Node.js >= 18.x / 20.x / 22.x LTS
- **Prisma Version:** `^5.22.0` (`@prisma/client` and `prisma`)
- **Key Dependencies:** `express` (^4.21.2), `cors` (^2.8.5), `jsonwebtoken` (^9.0.2), `bcryptjs` (^2.4.3), `pdfkit` (^0.15.2), `zod` (^3.24.1), `dotenv` (^16.4.7), `morgan` (^1.10.0), `cookie-parser` (^1.4.7), `nodemailer` (^6.9.16)
- **Scripts:**
  - `build`: `tsc` (outputs compiled JavaScript to `dist/`)
  - `start`: `node dist/index.js`
  - `dev`: `tsx watch src/index.ts`
  - `prisma:generate`: `prisma generate`
  - `prisma:migrate`: `prisma migrate dev`
  - `prisma:deploy`: `prisma migrate deploy`
  - `prisma:seed`: `tsx prisma/seed.ts`
  - `test`: `tsx test/run-tests.ts`
  - `test:perf`: `tsx test/perf-test.ts`

### 2.3 Frontend `frontend/package.json`
- **Name:** `brightloop-subscription-frontend` (v1.0.0, private)
- **Framework:** React 18.3.1 + Vite 6.0.3 + TypeScript 5.7.2
- **Key Dependencies:** `react-router-dom` (^7.1.0), `@tanstack/react-query` (^5.62.8), `tailwindcss` (^3.4.17), `lucide-react` (^0.468.0), `recharts` (^2.15.0), `clsx`, `tailwind-merge`, `zod`
- **Scripts:**
  - `dev`: `vite`
  - `build`: `tsc -b && vite build` (outputs optimized bundle to `dist/`)
  - `preview`: `vite preview`

---

## 3. Environment Variables Audit

| Service | Variable Name | Purpose | Production Source / Value |
|---|---|---|---|
| **Backend** | `NODE_ENV` | Environment identifier | Set to `production` |
| **Backend** | `PORT` | Listening port on host | Provided dynamically by Render (e.g. `10000`) |
| **Backend** | `DATABASE_URL` | PostgreSQL connection string | Neon Pooled / Direct Connection String |
| **Backend** | `FRONTEND_URL` | Allowed origin for CORS & cookie sharing | Public Vercel URL (e.g. `https://brightloop.vercel.app`) |
| **Backend** | `JWT_SECRET` | Secret key for signing auth tokens | High-entropy random string (32+ bytes) |
| **Backend** | `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| **Backend** | `SMTP_HOST` | Email host (Optional/Fallback) | `smtp.resend.com` or empty fallback |
| **Backend** | `SMTP_PORT` | Email port | `587` |
| **Backend** | `SMTP_USER` | Email username | Provided if external SMTP is configured |
| **Backend** | `SMTP_PASS` | Email password | Provided if external SMTP is configured |
| **Backend** | `SMTP_FROM` | Outgoing email header | `"Brightloop Software <billing@brightloop.io>"` |
| **Frontend** | `VITE_API_URL` | Base URL for API requests | Render Backend URL (e.g. `https://brightloop-backend.onrender.com/api/v1`) |

---

## 4. API & Routing Architecture

### 4.1 Development vs Production API Handling
- **Development:** Vite dev server uses proxy configuration (`/api` -> `http://localhost:5000`).
- **Production (Issue & Fix):** In production, the React SPA hosted on Vercel communicates with Render on a distinct domain (`https://brightloop-backend.onrender.com`).
  - `frontend/src/lib/api.ts` currently defaults to `const BASE_URL = '/api/v1'`.
  - Direct fetch in `InvoicesPage.tsx` and `MyInvoicesPage.tsx` currently calls `/api/v1/invoices/:id/pdf`.
  - **Fix Required:** Update `api.ts` to read `import.meta.env.VITE_API_URL || '/api/v1'` and export `BASE_URL` so all API and PDF requests route to the Render production domain cleanly.

### 4.2 Client-Side Routing on Vercel (Issue & Fix)
- React Router v7 uses HTML5 pushState history.
- Direct navigation or browser refresh on routes like `/dashboard`, `/invoices`, `/portal` on Vercel returns HTTP 404 without a rewrite rule.
- **Fix Required:** Add `vercel.json` with wildcard rewrite to `/index.html`.

---

## 5. Security & Access Control Audit

1. **Authentication:**
   - Stateless JWT tokens stored in HTTP Bearer header and optional cookie.
   - Passwords hashed with `bcryptjs` (salt rounds: 10).
   - Strict password criteria enforced on registration and reset: length > 8, uppercase, lowercase, special character.
2. **Role-Based Access Control (RBAC):**
   - Three discrete roles: `ADMIN`, `STAFF`, `CUSTOMER`.
   - `ADMIN`: Full access to product catalog, plans, tax/discount rules, settings, manual billing trigger, and staff account creation.
   - `STAFF`: Quotations, invoices, customer directories, and recording payments.
   - `CUSTOMER`: Access strictly scoped to their own account; customer portal endpoints only return records matching their authenticated `customerId`.
3. **CORS Configuration:**
   - Backend `cors` middleware must include `config.frontendUrl` dynamically, supporting both the production Vercel URL and local testing domains.
4. **Git & Secret Exposure Check:**
   - Audit of Git history confirmed: **Zero real secrets or `.env` files have been committed to GitHub**. Only `.env.example` templates exist in the repository.

---

## 6. Database Schema & Migration Audit

### 6.1 Database Engine
- Engine: PostgreSQL (Compatible with Neon serverless PostgreSQL).
- ORM: Prisma 5.22.0 (`prisma-client-js`).

### 6.2 Data Models Present
1. `User` (Authentication, roles, active flags)
2. `Customer` (Enterprise clients, contact details, tax numbers)
3. `Product` & `ProductVariant` (Software catalog, add-ons, pricing variants)
4. `SubscriptionPlan` (Billing frequencies, renewal/pause rules)
5. `TaxRule` & `Discount` (Automatic tax calculation & discount codes)
6. `Quotation` & `QuotationItem` (Draft proposals, validity periods)
7. `Subscription` & `SubscriptionItem` (Active recurring contracts)
8. `Invoice` & `InvoiceItem` (Billing demand records, payment balances, PDF generation)
9. `Payment` (Payment method tracking, partial settlements)
10. `BillingRun` & `BillingRunLog` (Audit trail for scheduled/manual billing runs)
11. `AuditLog` & `BusinessSettings` (System configuration, invoice prefixes, currency)

### 6.3 Migration Strategy (Issue & Fix)
- **Current State:** The repository does not yet have a `backend/prisma/migrations/` directory.
- **Production Requirement:** Neon PostgreSQL requires reproducible migrations executed via `npx prisma migrate deploy`.
- **Fix Required:** Generate the baseline migration `backend/prisma/migrations/0_init/migration.sql` so Render/Neon can automatically run `prisma migrate deploy` on deployment.

### 6.4 Seeding
- `backend/prisma/seed.ts` is fully idempotent using Prisma `upsert` across users, customers, plans, products, taxes, and settings. Running the seed multiple times produces zero duplicate records.

---

## 7. Automated Test Verification

Execution of `npm test` against local PostgreSQL database verified all 8 suites:
```
====================================================
🧪 RUNNING COMPREHENSIVE INTEGRATION & QA TEST SUITE
====================================================
📦 Suite 1: Authentication & Password Complexity Rules  (8/8 PASSED)
📦 Suite 2: Product & Variant Catalog                   (2/2 PASSED)
📦 Suite 3: Subscription Plans                          (2/2 PASSED)
📦 Suite 4: Quotations & Idempotent Subscription Conv.  (6/6 PASSED)
📦 Suite 5: Subscription Lifecycle & Permissions        (2/2 PASSED)
📦 Suite 6: Recurring Billing Engine & Safeguards       (2/2 PASSED)
📦 Suite 7: Payments & Ledger Balance                   (7/7 PASSED)
📦 Suite 8: Role-Based Authorization & Data Isolation   (1/1 PASSED)
====================================================
📊 TEST RESULTS: 30 PASSED | 0 FAILED
====================================================
```

---

## 8. Issues Identified & Action Plan

| # | Item | Current State | Required Fix | Phase |
|---|---|---|---|---|
| 1 | **Prisma Migrations** | `backend/prisma/migrations` does not exist | Generate baseline migration for `prisma migrate deploy` | Phase 2 & 3 |
| 2 | **Host Binding** | `app.listen(config.port)` | Bind explicitly to `0.0.0.0` for container/Render routing | Phase 2 |
| 3 | **Production Error Handling** | Stack traces & raw errors logged | Sanitize error output in production mode (`500` hides internal details) | Phase 2 |
| 4 | **Frontend API URL** | Hardcoded `BASE_URL = '/api/v1'` | Use `import.meta.env.VITE_API_URL \|\| '/api/v1'` | Phase 2 |
| 5 | **PDF Download Fetch** | Hardcoded `/api/v1/invoices/:id/pdf` | Route via configured `BASE_URL` | Phase 2 |
| 6 | **Vercel SPA Rewrites** | Missing `vercel.json` | Add `vercel.json` with pushState rewrite rule | Phase 2 & 7 |
| 7 | **CORS Configuration** | Default array with localhost | Support array containing `FRONTEND_URL` and preview URLs | Phase 2 |

---

## 9. Production Build & Start Commands

### Render Backend:
- **Root Directory:** `backend`
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command:** `node dist/index.js`
- **Health Check Path:** `/health`

### Vercel Frontend:
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://<your-render-backend-url>/api/v1`

---
*Audit Completed. Ready to proceed with Phase 2 (Production Readiness Code Enhancements).*
