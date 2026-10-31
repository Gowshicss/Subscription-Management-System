import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

import { AuthController } from '../controllers/auth.controller';
import { ProductController } from '../controllers/product.controller';
import { PlanController } from '../controllers/plan.controller';
import { CustomerController } from '../controllers/customer.controller';
import { TaxController } from '../controllers/tax.controller';
import { DiscountController } from '../controllers/discount.controller';
import { QuotationController } from '../controllers/quotation.controller';
import { SubscriptionController } from '../controllers/subscription.controller';
import { InvoiceController } from '../controllers/invoice.controller';
import { PaymentController } from '../controllers/payment.controller';
import { BillingController } from '../controllers/billing.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { SettingsController } from '../controllers/settings.controller';

const router = Router();

// ==========================================
// 1. PUBLIC AUTHENTICATION & PASSWORD RESET
// ==========================================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);

// Public / Authenticated catalog visibility
router.get('/products', ProductController.list);
router.get('/products/:id', ProductController.getById);
router.get('/plans', PlanController.list);
router.get('/plans/:id', PlanController.getById);
router.get('/settings', SettingsController.get);

// All routes below require valid JWT authentication
router.use(authenticate);

// ==========================================
// 2. AUTHENTICATED USER SESSION & STAFF ADMIN
// ==========================================
router.get('/auth/me', AuthController.getMe);
router.get('/users/staff', requireRole(Role.ADMIN), AuthController.listStaff);
router.post('/users/staff', requireRole(Role.ADMIN), AuthController.createStaff);

// ==========================================
// 3. CUSTOMER MANAGEMENT
// ==========================================
router.get('/customers', requireRole(Role.ADMIN, Role.STAFF), CustomerController.list);
router.post('/customers', requireRole(Role.ADMIN, Role.STAFF), CustomerController.create);
router.get('/customers/:id', CustomerController.getById); // Scoped inside controller for Customer role
router.put('/customers/:id', CustomerController.update);

// ==========================================
// 4. PRODUCT & VARIANT CATALOG (ADMIN ONLY)
// ==========================================
router.post('/products', requireRole(Role.ADMIN), ProductController.create);
router.put('/products/:id', requireRole(Role.ADMIN), ProductController.update);
router.delete('/products/:id', requireRole(Role.ADMIN), ProductController.archive);
router.post('/products/:id/variants', requireRole(Role.ADMIN), ProductController.createVariant);
router.put('/products/:id/variants/:variantId', requireRole(Role.ADMIN), ProductController.updateVariant);

// ==========================================
// 5. SUBSCRIPTION PLANS (ADMIN ONLY)
// ==========================================
router.post('/plans', requireRole(Role.ADMIN), PlanController.create);
router.put('/plans/:id', requireRole(Role.ADMIN), PlanController.update);
router.delete('/plans/:id', requireRole(Role.ADMIN), PlanController.toggleActive);

// ==========================================
// 6. TAX RULES & DISCOUNTS (ADMIN ONLY)
// ==========================================
router.get('/taxes', TaxController.list);
router.post('/taxes', requireRole(Role.ADMIN), TaxController.create);
router.put('/taxes/:id', requireRole(Role.ADMIN), TaxController.update);

router.get('/discounts', requireRole(Role.ADMIN, Role.STAFF), DiscountController.list);
router.post('/discounts', requireRole(Role.ADMIN), DiscountController.create);
router.put('/discounts/:id', requireRole(Role.ADMIN), DiscountController.update);

// ==========================================
// 7. QUOTATION TEMPLATES & CUSTOMER QUOTATIONS
// ==========================================
router.get('/quotation-templates', QuotationController.listTemplates);
router.post('/quotation-templates', requireRole(Role.ADMIN, Role.STAFF), QuotationController.createTemplate);

router.get('/quotations', QuotationController.list);
router.post('/quotations', requireRole(Role.ADMIN, Role.STAFF), QuotationController.create);
router.get('/quotations/:id', QuotationController.getById);
router.post('/quotations/:id/send', requireRole(Role.ADMIN, Role.STAFF), QuotationController.send);
router.post('/quotations/:id/accept', QuotationController.accept); // Customer portal acceptance

// ==========================================
// 8. SUBSCRIPTIONS & LIFECYCLE MANAGEMENT
// ==========================================
router.get('/subscriptions', SubscriptionController.list);
router.post('/subscriptions', requireRole(Role.ADMIN, Role.STAFF), SubscriptionController.create);
router.get('/subscriptions/:id', SubscriptionController.getById);
router.post('/subscriptions/:id/confirm', requireRole(Role.ADMIN, Role.STAFF), SubscriptionController.confirm);
router.post('/subscriptions/:id/activate', requireRole(Role.ADMIN, Role.STAFF), SubscriptionController.activate);
router.post('/subscriptions/:id/pause', SubscriptionController.pause);
router.post('/subscriptions/:id/resume', SubscriptionController.resume);
router.post('/subscriptions/:id/close', SubscriptionController.close);
router.post('/subscriptions/:id/renew', SubscriptionController.renew);

// ==========================================
// 9. INVOICING & RECURRING BILLING ENGINE
// ==========================================
router.get('/invoices', InvoiceController.list);
router.get('/invoices/:id', InvoiceController.getById);
router.post('/invoices/:id/confirm', requireRole(Role.ADMIN, Role.STAFF), InvoiceController.confirm);
router.post('/invoices/:id/cancel', requireRole(Role.ADMIN, Role.STAFF), InvoiceController.cancel);
router.get('/invoices/:id/pdf', InvoiceController.downloadPdf);

// Idempotent Billing Manual Trigger (Admin Only)
router.post('/billing/trigger', requireRole(Role.ADMIN), BillingController.triggerManualCycle);

// ==========================================
// 10. PAYMENTS (STAFF & ADMIN RECORDING)
// ==========================================
router.get('/payments', PaymentController.list);
router.post('/payments', requireRole(Role.ADMIN, Role.STAFF), PaymentController.record);

// ==========================================
// 11. DASHBOARD & BUSINESS SETTINGS
// ==========================================
router.get('/dashboard/summary', DashboardController.getSummary);
router.put('/settings', requireRole(Role.ADMIN), SettingsController.update);

export default router;

