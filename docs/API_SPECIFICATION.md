# Brightloop Subscription Management System — API Specification

Base URL: `/api/v1`

All responses follow the unified envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

Error envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication & Users
- `POST /api/v1/auth/register` — Register customer (email, password, companyName, contactName, phone)
- `POST /api/v1/auth/login` — Login with email and password
- `POST /api/v1/auth/logout` — Invalidate session / clear cookie
- `GET /api/v1/auth/me` — Return current authenticated user profile
- `POST /api/v1/auth/forgot-password` — Request password reset email & token
- `POST /api/v1/auth/reset-password` — Verify token and set new password
- `POST /api/v1/users/staff` — (Admin only) Create new staff member
- `GET /api/v1/users/staff` — (Admin only) List staff accounts

---

## 2. Customer Management
- `GET /api/v1/customers` — (Staff/Admin) Paginated list, search, filter
- `POST /api/v1/customers` — (Staff/Admin) Create customer profile
- `GET /api/v1/customers/:id` — (Staff/Admin/Self) Get full profile with subscriptions & invoices
- `PUT /api/v1/customers/:id` — (Staff/Admin/Self) Update customer info

---

## 3. Products & Product Variants
- `GET /api/v1/products` — List products with variants
- `POST /api/v1/products` — (Admin only) Create product
- `GET /api/v1/products/:id` — Get product detail with variants
- `PUT /api/v1/products/:id` — (Admin only) Update product
- `DELETE /api/v1/products/:id` — (Admin only) Archive product
- `POST /api/v1/products/:id/variants` — (Admin only) Create product variant
- `PUT /api/v1/products/:id/variants/:variantId` — (Admin only) Update variant

---

## 4. Subscription Plans
- `GET /api/v1/plans` — List subscription plans
- `POST /api/v1/plans` — (Admin only) Create subscription plan
- `GET /api/v1/plans/:id` — Get plan detail
- `PUT /api/v1/plans/:id` — (Admin only) Update plan
- `DELETE /api/v1/plans/:id` — (Admin only) Toggle active status

---

## 5. Taxes & Discounts
- `GET /api/v1/taxes` — List tax rules
- `POST /api/v1/taxes` — (Admin only) Create tax rule
- `PUT /api/v1/taxes/:id` — (Admin only) Update tax rule
- `GET /api/v1/discounts` — List discount rules
- `POST /api/v1/discounts` — (Admin only) Create discount rule
- `PUT /api/v1/discounts/:id` — (Admin only) Update discount rule
- `DELETE /api/v1/discounts/:id` — (Admin only) Deactivate discount rule

---

## 6. Quotation Templates & Customer Quotations
- `GET /api/v1/quotation-templates` — List quotation templates
- `POST /api/v1/quotation-templates` — (Staff/Admin) Create template
- `GET /api/v1/quotations` — List quotations (scoped by role)
- `POST /api/v1/quotations` — (Staff/Admin) Create quotation
- `GET /api/v1/quotations/:id` — Get quotation detail
- `PUT /api/v1/quotations/:id` — (Staff/Admin) Update quotation
- `POST /api/v1/quotations/:id/send` — (Staff/Admin) Mark as SENT
- `POST /api/v1/quotations/:id/accept` — (Customer only) Accept quotation and auto-convert to subscription

---

## 7. Subscriptions
- `GET /api/v1/subscriptions` — List subscriptions (scoped by role)
- `POST /api/v1/subscriptions` — (Staff/Admin) Create subscription manually
- `GET /api/v1/subscriptions/:id` — Get subscription detail with product lines & invoices
- `POST /api/v1/subscriptions/:id/confirm` — Move from Draft/Quotation to Confirmed
- `POST /api/v1/subscriptions/:id/activate` — Move to Active status
- `POST /api/v1/subscriptions/:id/pause` — Pause active subscription (checks plan permission)
- `POST /api/v1/subscriptions/:id/resume` — Resume paused subscription
- `POST /api/v1/subscriptions/:id/close` — Close subscription (checks plan permission)
- `POST /api/v1/subscriptions/:id/renew` — Renew subscription (checks plan permission)

---

## 8. Invoices & Automated Billing Engine
- `GET /api/v1/invoices` — List invoices (scoped by role)
- `GET /api/v1/invoices/:id` — Get invoice detail with line items & payment history
- `POST /api/v1/invoices/:id/confirm` — (Staff/Admin) Move invoice from Draft to Confirmed
- `POST /api/v1/invoices/:id/cancel` — (Staff/Admin) Cancel eligible invoice
- `GET /api/v1/invoices/:id/pdf` — Render/stream printable PDF invoice
- `POST /api/v1/billing/trigger` — (Admin only) Manually run idempotent recurring billing engine

---

## 9. Payments
- `GET /api/v1/payments` — List payments (scoped by role)
- `POST /api/v1/payments` — (Staff/Admin) Record payment against an invoice (checks balance, updates invoice status)

---

## 10. Dashboard & Financial Analytics
- `GET /api/v1/dashboard/summary` — Role-aware executive summary metrics
- `GET /api/v1/dashboard/finance` — (Admin only) Real DB metrics: ARR, MRR, Revenue received, Invoiced, Outstanding, Overdue
- `GET /api/v1/dashboard/trends` — Revenue and subscription trends for Recharts
- `GET /api/v1/settings` — Get business settings (currency, name, contact)
- `PUT /api/v1/settings` — (Admin only) Update business settings

