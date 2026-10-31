import { prisma } from '../lib/prisma';
import { SubscriptionStatus, InvoiceStatus, BillingFrequency, Prisma } from '@prisma/client';
import { discountService } from './discount.service';

export interface BillingRunResult {
  runId: string;
  timestamp: Date;
  subscriptionsEvaluated: number;
  invoicesGenerated: number;
  invoicesSkipped: number;
  totalBilledAmount: number;
  details: {
    subscriptionId: string;
    subscriptionNumber: string;
    customerName: string;
    invoiceNumber?: string;
    amount?: number;
    status: 'GENERATED' | 'SKIPPED_ALREADY_BILLED' | 'CLOSED_DUE_TO_EXPIRY' | 'ERROR';
    reason?: string;
  }[];
}

class BillingService {
  /**
   * Core Idempotent Recurring Billing Execution Engine.
   * Can be triggered either by the background interval worker or manually by Admin.
   */
  async runBillingCycle(triggerSource: 'CRON_SCHEDULER' | 'ADMIN_MANUAL' = 'CRON_SCHEDULER'): Promise<BillingRunResult> {
    const runId = `RUN-${Date.now()}`;
    const timestamp = new Date();
    console.log(`[BillingEngine] Starting recurring billing cycle [${runId}] via ${triggerSource}...`);

    // 1. Fetch active subscriptions due for billing
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { lte: timestamp },
      },
      include: {
        customer: true,
        plan: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    console.log(`[BillingEngine] Found ${dueSubscriptions.length} subscriptions due for billing evaluation.`);

    const result: BillingRunResult = {
      runId,
      timestamp,
      subscriptionsEvaluated: dueSubscriptions.length,
      invoicesGenerated: 0,
      invoicesSkipped: 0,
      totalBilledAmount: 0,
      details: [],
    };

    for (const sub of dueSubscriptions) {
      try {
        // Check autoClose if expiry has arrived
        if (sub.autoClose && sub.expiryDate && timestamp >= sub.expiryDate) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: SubscriptionStatus.CLOSED },
          });

          result.details.push({
            subscriptionId: sub.id,
            subscriptionNumber: sub.subscriptionNumber,
            customerName: sub.customer.companyName,
            status: 'CLOSED_DUE_TO_EXPIRY',
            reason: 'Subscription auto-closed as contract expiry date was reached.',
          });
          continue;
        }

        // Calculate billing period [periodStart, periodEnd]
        const periodStart = new Date(sub.nextBillingDate);
        let periodEnd: Date;
        let nextBillingDate: Date;

        switch (sub.plan.billingFrequency) {
          case BillingFrequency.DAILY:
            periodEnd = new Date(periodStart.getTime() + 1 * 24 * 60 * 60 * 1000);
            nextBillingDate = new Date(periodStart.getTime() + 1 * 24 * 60 * 60 * 1000);
            break;
          case BillingFrequency.WEEKLY:
            periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            nextBillingDate = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case BillingFrequency.YEARLY:
            periodEnd = new Date(periodStart.getTime() + 365 * 24 * 60 * 60 * 1000);
            nextBillingDate = new Date(periodStart.getTime() + 365 * 24 * 60 * 60 * 1000);
            break;
          case BillingFrequency.MONTHLY:
          default:
            periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
            nextBillingDate = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }

        // IDEMPOTENCY CHECK: Check if invoice already exists for this (subscriptionId, periodStart)
        const existingInvoice = await prisma.invoice.findUnique({
          where: {
            subscriptionId_periodStart: {
              subscriptionId: sub.id,
              periodStart,
            },
          },
        });

        if (existingInvoice) {
          result.invoicesSkipped++;
          result.details.push({
            subscriptionId: sub.id,
            subscriptionNumber: sub.subscriptionNumber,
            customerName: sub.customer.companyName,
            invoiceNumber: existingInvoice.invoiceNumber,
            status: 'SKIPPED_ALREADY_BILLED',
            reason: `Invoice ${existingInvoice.invoiceNumber} already exists for cycle starting ${periodStart.toISOString().split('T')[0]}.`,
          });

          // Ensure nextBillingDate is advanced so it doesn't get stuck
          if (sub.nextBillingDate <= timestamp) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { nextBillingDate },
            });
          }
          continue;
        }

        // Calculate line items, taxes & discounts
        let subtotal = 0;
        let totalTax = 0;
        let totalQuantity = 0;
        const lineItemsData: {
          productId: string;
          variantId?: string | null;
          description: string;
          quantity: number;
          unitPrice: number;
          taxRate: number;
          taxAmount: number;
          discountAmount: number;
          totalAmount: number;
        }[] = [];

        for (const item of sub.items) {
          const qty = item.quantity > 0 ? item.quantity : 1;
          const unitPrice = Number(item.unitPrice);
          const lineSubtotal = unitPrice * qty;
          const taxRate = Number(item.taxRate || 10.0);
          const lineTax = (lineSubtotal * taxRate) / 100;

          subtotal += lineSubtotal;
          totalTax += lineTax;
          totalQuantity += qty;

          const desc = item.variant
            ? `${item.product.name} — ${item.variant.name}`
            : item.product.name;

          lineItemsData.push({
            productId: item.productId,
            variantId: item.variantId,
            description: desc,
            quantity: qty,
            unitPrice,
            taxRate,
            taxAmount: lineTax,
            discountAmount: 0,
            totalAmount: lineSubtotal + lineTax,
          });
        }

        // Check applicable discounts
        const eligibleDiscount = await discountService.findBestEligibleDiscount({
          subtotal,
          totalQuantity,
          items: lineItemsData.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            amount: li.quantity * li.unitPrice,
          })),
        });

        const totalDiscount = eligibleDiscount ? eligibleDiscount.calculatedAmount : 0;
        const finalInvoiceTotal = Math.max(0, subtotal - totalDiscount + totalTax);

        // Generate unique invoice number: INV-YYYY-XXXX
        const invCount = await prisma.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;
        const dueDate = new Date(timestamp.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days payment terms

        // Execute atomic transaction for invoice creation and subscription nextBillingDate advance
        const createdInvoice = await prisma.$transaction(async (tx) => {
          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              subscriptionId: sub.id,
              customerId: sub.customerId,
              periodStart,
              periodEnd,
              invoiceDate: timestamp,
              dueDate,
              status: InvoiceStatus.CONFIRMED,
              subtotal: new Prisma.Decimal(subtotal),
              taxAmount: new Prisma.Decimal(totalTax),
              discountAmount: new Prisma.Decimal(totalDiscount),
              totalAmount: new Prisma.Decimal(finalInvoiceTotal),
              amountPaid: new Prisma.Decimal(0.00),
              balanceDue: new Prisma.Decimal(finalInvoiceTotal),
              notes: `Automated recurring billing cycle for period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}.`,
              items: {
                create: lineItemsData.map((li) => ({
                  productId: li.productId,
                  variantId: li.variantId,
                  description: li.description,
                  quantity: li.quantity,
                  unitPrice: new Prisma.Decimal(li.unitPrice),
                  taxRate: new Prisma.Decimal(li.taxRate),
                  taxAmount: new Prisma.Decimal(li.taxAmount),
                  discountAmount: new Prisma.Decimal(li.discountAmount),
                  totalAmount: new Prisma.Decimal(li.totalAmount),
                })),
              },
            },
          });

          // Record discount usage if applied
          if (eligibleDiscount) {
            await tx.discountUsage.create({
              data: {
                discountId: eligibleDiscount.discount.id,
                invoiceId: invoice.id,
                subscriptionId: sub.id,
                customerId: sub.customerId,
                amountApplied: new Prisma.Decimal(eligibleDiscount.calculatedAmount),
              },
            });

            await tx.discount.update({
              where: { id: eligibleDiscount.discount.id },
              data: { timesUsed: { increment: 1 } },
            });
          }

          // Advance nextBillingDate on subscription
          await tx.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate },
          });

          return invoice;
        });

        result.invoicesGenerated++;
        result.totalBilledAmount += finalInvoiceTotal;
        result.details.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerName: sub.customer.companyName,
          invoiceNumber: createdInvoice.invoiceNumber,
          amount: finalInvoiceTotal,
          status: 'GENERATED',
        });
      } catch (err: any) {
        console.error(`[BillingEngine] Error processing subscription ${sub.id}:`, err);
        result.details.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerName: sub.customer.companyName,
          status: 'ERROR',
          reason: err.message,
        });
      }
    }

    console.log(
      `[BillingEngine] Cycle [${runId}] complete. Evaluated: ${result.subscriptionsEvaluated}, Generated: ${result.invoicesGenerated}, Skipped: ${result.invoicesSkipped}, Total: ₹${result.totalBilledAmount.toFixed(2)}`
    );

    return result;
  }
}

export const billingService = new BillingService();

