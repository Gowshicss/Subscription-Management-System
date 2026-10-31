import { prisma } from '../lib/prisma';
import { SubscriptionStatus, BillingFrequency, Role, Prisma } from '@prisma/client';

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  startDate?: string | Date;
  expiryDate?: string | Date | null;
  paymentTerms?: string;
  autoClose?: boolean;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice?: number;
    taxRate?: number;
  }[];
}

class SubscriptionService {
  async listSubscriptions(userRole: Role, customerId?: string | null, statusFilter?: SubscriptionStatus) {
    const where: Prisma.SubscriptionWhereInput = {};
    if (userRole === Role.CUSTOMER) {
      if (!customerId) return [];
      where.customerId = customerId;
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    return prisma.subscription.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, contactName: true, email: true } },
        plan: { select: { id: true, name: true, billingFrequency: true, allowPause: true, allowRenewal: true, allowEarlyClosure: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionById(id: string, userRole: Role, customerId?: string | null) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        quotation: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
        },
      },
    });

    if (!sub) {
      const err: any = new Error('Subscription not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (userRole === Role.CUSTOMER && sub.customerId !== customerId) {
      const err: any = new Error('Access denied to this subscription.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return sub;
  }

  async createSubscription(input: CreateSubscriptionInput) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) {
      const err: any = new Error('Customer not found.');
      err.statusCode = 404;
      throw err;
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    if (!plan) {
      const err: any = new Error('Subscription plan not found.');
      err.statusCode = 404;
      throw err;
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const expiryDate = input.expiryDate ? new Date(input.expiryDate) : plan.endDate;
    const nextBillingDate = new Date(startDate);

    let subtotal = 0;
    let taxAmount = 0;
    const processedItems: {
      productId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      amount: number;
    }[] = [];

    for (const item of input.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product) continue;

      let unitPrice = item.unitPrice ?? Number(product.salesPrice);
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant && item.unitPrice === undefined) {
          unitPrice += Number(variant.additionalPrice);
        }
      }

      const qty = item.quantity > 0 ? item.quantity : 1;
      const lineAmount = unitPrice * qty;
      const taxRate = item.taxRate ?? 10.0;
      const tax = (lineAmount * taxRate) / 100;

      subtotal += lineAmount;
      taxAmount += tax;

      processedItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: qty,
        unitPrice,
        taxRate,
        amount: lineAmount,
      });
    }

    const totalAmount = subtotal + taxAmount;
    const count = await prisma.subscription.count();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId: input.customerId,
        planId: input.planId,
        status: SubscriptionStatus.DRAFT,
        startDate,
        expiryDate,
        nextBillingDate,
        paymentTerms: input.paymentTerms || 'Net 30',
        autoClose: input.autoClose ?? plan.autoClose,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(totalAmount),
        items: {
          create: processedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: new Prisma.Decimal(i.unitPrice),
            taxRate: new Prisma.Decimal(i.taxRate),
            amount: new Prisma.Decimal(i.amount),
          })),
        },
      },
      include: { items: true, plan: true, customer: true },
    });
  }

  async confirmSubscription(id: string, userId?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) {
      const err: any = new Error('Subscription not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CONFIRMED },
    });
  }

  async activateSubscription(id: string, userId?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) {
      const err: any = new Error('Subscription not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.ACTIVE },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ACTIVATE_SUBSCRIPTION',
        entity: 'Subscription',
        entityId: id,
        details: { subscriptionNumber: sub.subscriptionNumber },
      },
    });

    return updated;
  }

  async pauseSubscription(id: string, userRole: Role, customerId?: string | null, userId?: string) {
    const sub = await this.getSubscriptionById(id, userRole, customerId);

    if (!sub.plan.allowPause) {
      const err: any = new Error(`The '${sub.plan.name}' plan does not allow pausing.`);
      err.statusCode = 400;
      err.code = 'PAUSE_NOT_ALLOWED';
      throw err;
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      const err: any = new Error(`Cannot pause subscription with status '${sub.status}'. Must be ACTIVE.`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.PAUSED },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAUSE_SUBSCRIPTION',
        entity: 'Subscription',
        entityId: id,
        details: { previousStatus: sub.status, newStatus: 'PAUSED' },
      },
    });

    return updated;
  }

  async resumeSubscription(id: string, userRole: Role, customerId?: string | null, userId?: string) {
    const sub = await this.getSubscriptionById(id, userRole, customerId);

    if (sub.status !== SubscriptionStatus.PAUSED) {
      const err: any = new Error(`Cannot resume subscription with status '${sub.status}'. Must be PAUSED.`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS_TRANSITION';
      throw err;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.ACTIVE },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RESUME_SUBSCRIPTION',
        entity: 'Subscription',
        entityId: id,
        details: { previousStatus: 'PAUSED', newStatus: 'ACTIVE' },
      },
    });

    return updated;
  }

  async closeSubscription(id: string, userRole: Role, customerId?: string | null, userId?: string) {
    const sub = await this.getSubscriptionById(id, userRole, customerId);

    if (userRole === Role.CUSTOMER && !sub.plan.allowEarlyClosure) {
      const err: any = new Error(`Plan '${sub.plan.name}' does not permit early closure by customers.`);
      err.statusCode = 403;
      err.code = 'EARLY_CLOSURE_NOT_ALLOWED';
      throw err;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CLOSED },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CLOSE_SUBSCRIPTION',
        entity: 'Subscription',
        entityId: id,
        details: { previousStatus: sub.status, newStatus: 'CLOSED' },
      },
    });

    return updated;
  }

  async renewSubscription(id: string, userRole: Role, customerId?: string | null, userId?: string) {
    const sub = await this.getSubscriptionById(id, userRole, customerId);

    if (!sub.plan.allowRenewal) {
      const err: any = new Error(`The '${sub.plan.name}' plan does not allow renewals.`);
      err.statusCode = 400;
      err.code = 'RENEWAL_NOT_ALLOWED';
      throw err;
    }

    const currentExpiry = sub.expiryDate || new Date();
    let newExpiry: Date;

    switch (sub.plan.billingFrequency) {
      case BillingFrequency.DAILY:
        newExpiry = new Date(currentExpiry.getTime() + 1 * 24 * 60 * 60 * 1000);
        break;
      case BillingFrequency.WEEKLY:
        newExpiry = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case BillingFrequency.YEARLY:
        newExpiry = new Date(currentExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case BillingFrequency.MONTHLY:
      default:
        newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        expiryDate: newExpiry,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RENEW_SUBSCRIPTION',
        entity: 'Subscription',
        entityId: id,
        details: { previousExpiry: currentExpiry, newExpiry },
      },
    });

    return updated;
  }
}

export const subscriptionService = new SubscriptionService();
