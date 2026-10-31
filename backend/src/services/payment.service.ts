import { prisma } from '../lib/prisma';
import { PaymentMethod, InvoiceStatus, Role, Prisma } from '@prisma/client';

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string | Date;
  referenceNote?: string;
}

class PaymentService {
  async listPayments(userRole: Role, customerId?: string | null) {
    const where: Prisma.PaymentWhereInput = {};
    if (userRole === Role.CUSTOMER) {
      if (!customerId) return [];
      where.customerId = customerId;
    }

    return prisma.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, balanceDue: true, status: true } },
        recordedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async recordPayment(input: RecordPaymentInput, recordedByUserId?: string) {
    if (input.amount <= 0) {
      const err: any = new Error('Payment amount must be greater than zero.');
      err.statusCode = 400;
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      const err: any = new Error('Invoice not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      const err: any = new Error('Cannot record payments against a cancelled invoice.');
      err.statusCode = 400;
      err.code = 'INVOICE_CANCELLED';
      throw err;
    }

    const currentBalance = Number(invoice.balanceDue);
    if (currentBalance <= 0) {
      const err: any = new Error('This invoice is already fully paid.');
      err.statusCode = 400;
      err.code = 'ALREADY_PAID';
      throw err;
    }

    // Overpayment check
    // Allow small epsilon tolerance for float rounding
    if (input.amount > currentBalance + 0.001) {
      const err: any = new Error(
        `Payment amount (₹${input.amount.toFixed(2)}) exceeds outstanding balance of ₹${currentBalance.toFixed(2)}.`
      );
      err.statusCode = 400;
      err.code = 'OVERPAYMENT_REJECTED';
      throw err;
    }

    return prisma.$transaction(async (tx) => {
      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;
      const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

      const newAmountPaid = Number(invoice.amountPaid) + input.amount;
      const newBalanceDue = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
      const isFullyPaid = newBalanceDue <= 0.001;

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: new Prisma.Decimal(input.amount),
          paymentMethod: input.paymentMethod,
          paymentDate,
          referenceNote: input.referenceNote?.trim() || null,
          recordedById: recordedByUserId || null,
        },
      });

      // Update Invoice balance and status
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: new Prisma.Decimal(newAmountPaid),
          balanceDue: new Prisma.Decimal(newBalanceDue),
          status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: recordedByUserId || null,
          action: 'RECORD_PAYMENT',
          entity: 'Payment',
          entityId: payment.id,
          details: {
            paymentNumber,
            invoiceNumber: invoice.invoiceNumber,
            amount: input.amount,
            newBalanceDue,
            status: updatedInvoice.status,
          },
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });
  }
}

export const paymentService = new PaymentService();

