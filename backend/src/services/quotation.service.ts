import { prisma } from '../lib/prisma';
import { QuotationStatus, SubscriptionStatus, Prisma, Role } from '@prisma/client';
import { discountService } from './discount.service';

export interface CreateQuotationTemplateInput {
  name: string;
  description?: string;
  validityDays?: number;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice?: number;
    taxRate?: number;
  }[];
}

export interface CreateQuotationInput {
  customerId: string;
  templateId?: string | null;
  validityDays?: number;
  planId?: string;
  notes?: string;
  items: {
    productId: string;
    variantId?: string | null;
    planId?: string | null;
    quantity: number;
    customUnitPrice?: number;
    taxRate?: number;
  }[];
}

class QuotationService {
  async listTemplates() {
    return prisma.quotationTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(input: CreateQuotationTemplateInput) {
    return prisma.quotationTemplate.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        validityDays: input.validityDays || 30,
        itemsJson: input.items,
      },
    });
  }

  async listQuotations(userRole: Role, customerId?: string | null) {
    const where: Prisma.QuotationWhereInput = {};
    if (userRole === Role.CUSTOMER) {
      if (!customerId) return [];
      where.customerId = customerId;
    }

    return prisma.quotation.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, contactName: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
            variant: { select: { id: true, name: true, additionalPrice: true } },
            plan: { select: { id: true, name: true, billingFrequency: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuotationById(id: string, userRole: Role, customerId?: string | null) {
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        template: true,
        subscription: true,
        items: {
          include: {
            product: true,
            variant: true,
            plan: true,
          },
        },
      },
    });

    if (!quote) {
      const err: any = new Error('Quotation not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (userRole === Role.CUSTOMER && quote.customerId !== customerId) {
      const err: any = new Error('Access denied to this quotation.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return quote;
  }

  async createQuotation(input: CreateQuotationInput) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) {
      const err: any = new Error('Customer not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const defaultTax = await prisma.taxRule.findFirst({ where: { isDefault: true, isActive: true } });
    const fallbackTaxRate = defaultTax ? Number(defaultTax.rate) : 10.0;

    let subtotal = 0;
    let totalTaxAmount = 0;
    let totalQuantity = 0;
    const evaluatedItems: {
      productId: string;
      variantId?: string | null;
      planId?: string | null;
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
      if (!product) {
        const err: any = new Error(`Product ${item.productId} not found.`);
        err.statusCode = 404;
        err.code = 'PRODUCT_NOT_FOUND';
        throw err;
      }

      let unitPrice = Number(product.salesPrice);
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPrice += Number(variant.additionalPrice);
        }
      }

      if (item.customUnitPrice !== undefined && item.customUnitPrice !== null) {
        unitPrice = item.customUnitPrice;
      }

      const qty = item.quantity > 0 ? item.quantity : 1;
      const lineSubtotal = unitPrice * qty;
      const taxRate = item.taxRate !== undefined ? item.taxRate : fallbackTaxRate;
      const taxAmt = (lineSubtotal * taxRate) / 100;

      subtotal += lineSubtotal;
      totalTaxAmount += taxAmt;
      totalQuantity += qty;

      evaluatedItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        planId: item.planId || input.planId || null,
        quantity: qty,
        unitPrice,
        taxRate,
        amount: lineSubtotal,
      });
    }

    // Automatic discount check
    const eligibleDiscount = await discountService.findBestEligibleDiscount({
      subtotal,
      totalQuantity,
      items: evaluatedItems.map((i) => ({ productId: i.productId, quantity: i.quantity, amount: i.amount })),
    });

    const discountAmount = eligibleDiscount ? eligibleDiscount.calculatedAmount : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount + totalTaxAmount);

    const count = await prisma.quotation.count();
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const validityDays = input.validityDays || 30;
    const validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    return prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: input.customerId,
        templateId: input.templateId || null,
        status: QuotationStatus.DRAFT,
        validUntil,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(totalTaxAmount),
        discountAmount: new Prisma.Decimal(discountAmount),
        totalAmount: new Prisma.Decimal(finalTotal),
        notes: input.notes?.trim() || null,
        items: {
          create: evaluatedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            planId: item.planId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            taxRate: new Prisma.Decimal(item.taxRate),
            amount: new Prisma.Decimal(item.amount),
          })),
        },
      },
      include: {
        items: { include: { product: true, variant: true } },
        customer: true,
      },
    });
  }

  async sendQuotation(id: string) {
    const quote = await prisma.quotation.findUnique({ where: { id } });
    if (!quote) {
      const err: any = new Error('Quotation not found.');
      err.statusCode = 404;
      throw err;
    }
    return prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.SENT },
    });
  }

  /**
   * Accepts quotation and idempotently converts into an active subscription.
   */
  async acceptAndConvertToSubscription(id: string, customerId: string) {
    const quote = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true, plan: true } },
        customer: true,
        subscription: true,
      },
    });

    if (!quote) {
      const err: any = new Error('Quotation not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (quote.customerId !== customerId) {
      const err: any = new Error('Unauthorized. You can only accept quotations issued to your organization.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (quote.subscription) {
      const err: any = new Error('This quotation has already been converted into a subscription.');
      err.statusCode = 409;
      err.code = 'ALREADY_CONVERTED';
      throw err;
    }

    if (quote.status === QuotationStatus.CONVERTED) {
      const err: any = new Error('Quotation has already been converted.');
      err.statusCode = 409;
      err.code = 'ALREADY_CONVERTED';
      throw err;
    }

    if (new Date() > quote.validUntil) {
      await prisma.quotation.update({ where: { id }, data: { status: QuotationStatus.EXPIRED } });
      const err: any = new Error('This quotation has expired.');
      err.statusCode = 400;
      err.code = 'QUOTATION_EXPIRED';
      throw err;
    }

    // Determine plan
    const itemWithPlan = quote.items.find((i) => i.planId);
    let planId = itemWithPlan?.planId;
    if (!planId) {
      const defaultPlan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true } });
      planId = defaultPlan?.id;
    }

    if (!planId) {
      const err: any = new Error('No active subscription plan configured for conversion.');
      err.statusCode = 400;
      err.code = 'PLAN_NOT_FOUND';
      throw err;
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      const err: any = new Error('Plan not found.');
      err.statusCode = 400;
      throw err;
    }

    // Execute atomic transaction
    return prisma.$transaction(async (tx) => {
      const subCount = await tx.subscription.count();
      const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 1).padStart(4, '0')}`;

      const now = new Date();
      // Calculate next billing date: immediate or based on plan frequency
      const nextBillingDate = new Date(now);

      // Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quote.customerId,
          quotationId: quote.id,
          planId,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          expiryDate: plan.endDate || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          nextBillingDate,
          paymentTerms: 'Due on Receipt',
          autoClose: plan.autoClose,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          discountAmount: quote.discountAmount,
          totalAmount: quote.totalAmount,
          items: {
            create: quote.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              taxRate: i.taxRate,
              amount: i.amount,
            })),
          },
        },
        include: {
          customer: true,
          plan: true,
          items: true,
        },
      });

      // Update quotation status
      await tx.quotation.update({
        where: { id: quote.id },
        data: {
          status: QuotationStatus.CONVERTED,
        },
      });

      // Record audit log
      await tx.auditLog.create({
        data: {
          action: 'CONVERT_QUOTATION_TO_SUBSCRIPTION',
          entity: 'Subscription',
          entityId: subscription.id,
          details: {
            quotationNumber: quote.quotationNumber,
            subscriptionNumber: subscription.subscriptionNumber,
            customerId: quote.customerId,
            amount: Number(subscription.totalAmount),
          },
        },
      });

      return subscription;
    });
  }
}

export const quotationService = new QuotationService();

