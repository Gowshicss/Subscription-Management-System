# Render Backend Deployment Checklist

**Project:** Brightloop — Enterprise Subscription Management System  
**Service:** Backend Web Service  
**Hosting Provider:** Render ([https://render.com](https://render.com))  
**Target Database:** Neon Serverless PostgreSQL  
**Verification Date:** 31 October 2026  
**Status:** Pre-Deployment Verification Complete — Ready for Render Provisioning

---

## 1. Project & Repository Verification

| Property | Value / Verification |
|---|---|
| **Repository Remote URL** | `https://github.com/TanuSree2005/Subscription-Management-System.git` |
| **Active Deployment Branch** | `main` |
| **Backend Root Directory** | `backend` |
| **Runtime Environment** | Node.js (Version: Node 18+ / 20+ / 22+ LTS) |

---

## 2. Package & Process Scripts (`backend/package.json`)

| Script Name | Command | Purpose |
|---|---|---|
| `build` | `tsc` | Compiles TypeScript source to `dist/index.js` |
| `start` | `node dist/index.js` | Launches the compiled production HTTP server |
| `prisma:generate` | `prisma generate` | Generates the Prisma Client TypeScript artifacts |
| `prisma:deploy` | `prisma migrate deploy` | Applies pending SQL migrations to Neon PostgreSQL |
| `prisma:seed` | `tsx prisma/seed.ts` | Populates baseline idempotent demo records |

---

## 3. Database & Migration Configuration

| Item | Status / Configuration |
|---|---|
| **Datasource Definition** | Configured in `prisma/schema.prisma` with `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")`. |
| **Connection Pooling** | `DATABASE_URL` connects through Neon's PgBouncer pooler (`-pooler` in hostname). |
| **Migration Locking** | `DIRECT_URL` connects directly to the Neon PostgreSQL instance, avoiding session lock failures during schema migrations. |
| **Migration Directory** | Baseline migration exists at `prisma/migrations/0_init/migration.sql` (11 tables, 8 enums, foreign keys, unique constraints). |
| **Migration Deployment Command** | `npx prisma migrate deploy` (or `npm run prisma:deploy`). |
| **Fresh Database Readiness** | Migration SQL is verified and ready to run cleanly against an empty Neon database. |

---

## 4. Server Networking & Health Monitoring

| Item | Configuration |
|---|---|
| **Host IP Binding** | Explicitly binds to `0.0.0.0` (required for Render routing). |
| **Port Binding** | Reads from `process.env.PORT` dynamically assigned by Render (e.g. `10000`). |
| **Health Check Path** | `/health` (also aliased at `/api/v1/health`), returns HTTP 200 with JSON status and uptime. |
| **CORS Origin Variable** | `FRONTEND_URL` (dynamic matching for exact Vercel frontend domain and any `*.vercel.app` preview URLs). |

---

## 5. Recurring Billing Engine Automation

| Item | Configuration |
|---|---|
| **Worker Initialization** | `startBillingCron(60000)` starts automatically upon server boot in `backend/src/index.ts`. |
| **Cadence** | Initial evaluation 5 seconds after boot, followed by recurring 60-second intervals. |
| **Idempotency Safeguard** | Database unique constraint `@@unique([subscriptionId, periodStart])` guarantees zero duplicate invoices for the same cycle. |
| **Manual Trigger** | Admin endpoint `POST /api/v1/billing/trigger` available for external webhooks or on-demand execution. |

---

## 6. Required Production Environment Variables (Names Only)

*(Do NOT commit secret values to source control. Set these inside the Render Dashboard under **Environment**).*

| Variable Name | Required | Purpose |
|---|:---:|---|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Set to `10000` (or leave to Render default) |
| `DATABASE_URL` | Yes | Neon **Pooled connection string** (contains `-pooler`) |
| `DIRECT_URL` | Yes | Neon **Direct connection string** (unpooled, no `-pooler`) |
| `FRONTEND_URL` | Yes | Public Vercel URL (e.g. `https://brightloop-production.vercel.app`) |
| `JWT_SECRET` | Yes | High-entropy random secret string for JWT authentication |
| `JWT_EXPIRES_IN`| Yes | Token expiration duration (e.g. `7d`) |
| `SMTP_HOST` | Optional | Outgoing SMTP host (if email notifications configured) |
| `SMTP_PORT` | Optional | Outgoing SMTP port (e.g. `587`) |
| `SMTP_USER` | Optional | Outgoing SMTP username |
| `SMTP_PASS` | Optional | Outgoing SMTP password |
| `SMTP_FROM` | Optional | Outgoing email header (e.g. `"Brightloop Software <billing@brightloop.io>"`) |

---

## 7. Exact Render Web Service Configuration

```yaml
Service Type: Web Service
Name: brightloop-backend
Language / Runtime: Node
Repository: https://github.com/TanuSree2005/Subscription-Management-System
Branch: main
Root Directory: backend
Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
Start Command: node dist/index.js
Health Check Path: /health
Auto-Deploy: Yes
```

---

## 8. Post-Deploy Seed Execution (One-Time)

Once the service reports healthy on Render, seed the initial hackathon accounts (Admin, Staff, Customer, Products, and Plans) by opening the **Render Shell** in the dashboard and running:
```bash
npm run prisma:seed
```

---
*Checklist verified. Ready for Render Web Service creation.*

