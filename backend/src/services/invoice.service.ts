import { prisma } from '../lib/prisma';
import { InvoiceStatus, Role, Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';

class InvoiceService {
  async listInvoices(userRole: Role, customerId?: string | null, statusFilter?: InvoiceStatus) {
    const where: Prisma.InvoiceWhereInput = {};
    if (userRole === Role.CUSTOMER) {
      if (!customerId) return [];
      where.customerId = customerId;
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, companyName: true, contactName: true, email: true } },
        subscription: { select: { id: true, subscriptionNumber: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const now = new Date();
    return invoices.map((inv) => {
      const isOverdue = inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED && new Date(inv.dueDate) < now && Number(inv.balanceDue) > 0;
      const isPartiallyPaid = Number(inv.amountPaid) > 0 && Number(inv.balanceDue) > 0;

      return {
        ...inv,
        isOverdue,
        isPartiallyPaid,
      };
    });
  }

  async getInvoiceById(id: string, userRole: Role, customerId?: string | null) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: { plan: true },
        },
        items: {
          include: { product: true, variant: true },
        },
        payments: {
          include: { recordedBy: { select: { firstName: true, lastName: true, email: true } } },
          orderBy: { paymentDate: 'desc' },
        },
        discountUsages: {
          include: { discount: true },
        },
      },
    });

    if (!invoice) {
      const err: any = new Error('Invoice not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (userRole === Role.CUSTOMER && invoice.customerId !== customerId) {
      const err: any = new Error('Access denied to this invoice.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const now = new Date();
    const isOverdue = invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED && new Date(invoice.dueDate) < now && Number(invoice.balanceDue) > 0;
    const isPartiallyPaid = Number(invoice.amountPaid) > 0 && Number(invoice.balanceDue) > 0;

    return {
      ...invoice,
      isOverdue,
      isPartiallyPaid,
    };
  }

  async confirmInvoice(id: string) {
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) {
      const err: any = new Error('Invoice not found.');
      err.statusCode = 404;
      throw err;
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CONFIRMED },
    });
  }

  async cancelInvoice(id: string) {
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) {
      const err: any = new Error('Invoice not found.');
      err.statusCode = 404;
      throw err;
    }

    if (Number(inv.amountPaid) > 0) {
      const err: any = new Error('Cannot cancel an invoice with recorded payments.');
      err.statusCode = 400;
      err.code = 'HAS_PAYMENTS';
      throw err;
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }

  /**
   * Generates a PDF stream for the invoice with corporate brutalist styling.
   */
  async generateInvoicePdf(id: string, userRole: Role, customerId?: string | null): Promise<PDFKit.PDFDocument> {
    const invoice = await this.getInvoiceById(id, userRole, customerId);
    const settings = await prisma.businessSettings.findFirst() || {
      companyName: 'Brightloop Software',
      currencySymbol: '₹',
      address: '100 Innovation Way, Suite 400, Tech City, TC 94016',
      contactEmail: 'billing@brightloop.io',
      taxNumber: 'US-BL-849204',
    };

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Header Plum Block
    doc.fillColor('#4B2D47').rect(50, 45, 495, 4).fill();

    doc.fillColor('#4B2D47').fontSize(22).font('Helvetica-Bold').text('BRIGHTLOOP SOFTWARE', 50, 60);
    doc.fillColor('#77727A').fontSize(9).font('Helvetica').text('Subscription Management System', 50, 85);
    doc.text(settings.address, 50, 98);
    doc.text(`Email: ${settings.contactEmail}  |  Tax ID: ${settings.taxNumber}`, 50, 110);

    // Invoice Meta Right Column
    doc.fillColor('#252329').fontSize(18).font('Helvetica-Bold').text('INVOICE', 350, 60, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#79516F').text(invoice.invoiceNumber, 350, 82, { align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#77727A');
    doc.text(`Status: ${invoice.status}`, 350, 96, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 350, 108, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 350, 120, { align: 'right' });

    doc.moveTo(50, 140).lineTo(545, 140).strokeColor('#E4E1E5').stroke();

    // Bill To
    doc.fillColor('#4B2D47').fontSize(11).font('Helvetica-Bold').text('BILL TO:', 50, 155);
    doc.fillColor('#252329').fontSize(11).font('Helvetica-Bold').text(invoice.customer.companyName, 50, 170);
    doc.fillColor('#77727A').fontSize(9).font('Helvetica');
    doc.text(`Attn: ${invoice.customer.contactName}`, 50, 185);
    doc.text(invoice.customer.billingAddress, 50, 197);
    doc.text(`Email: ${invoice.customer.email}  |  Phone: ${invoice.customer.phone}`, 50, 209);
    if (invoice.customer.taxNumber) {
      doc.text(`Customer Tax ID: ${invoice.customer.taxNumber}`, 50, 221);
    }

    // Billing Period & Subscription Info
    doc.fillColor('#4B2D47').fontSize(11).font('Helvetica-Bold').text('SUBSCRIPTION DETAILS:', 320, 155);
    doc.fillColor('#77727A').fontSize(9).font('Helvetica');
    doc.text(`Subscription: ${invoice.subscription.subscriptionNumber}`, 320, 170);
    doc.text(`Plan: ${invoice.subscription.plan.name}`, 320, 185);
    doc.text(
      `Period: ${new Date(invoice.periodStart).toLocaleDateString()} – ${new Date(invoice.periodEnd).toLocaleDateString()}`,
      320,
      197
    );

    // Items Table Header
    const tableTop = 250;
    doc.fillColor('#F4F4F5').rect(50, tableTop, 495, 24).fill();
    doc.strokeColor('#E4E1E5').rect(50, tableTop, 495, 24).stroke();

    doc.fillColor('#252329').fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 60, tableTop + 7);
    doc.text('QTY', 280, tableTop + 7, { align: 'right' });
    doc.text('UNIT PRICE', 360, tableTop + 7, { align: 'right' });
    doc.text('TAX', 440, tableTop + 7, { align: 'right' });
    doc.text('AMOUNT', 535, tableTop + 7, { align: 'right' });

    let y = tableTop + 24;
    doc.font('Helvetica').fontSize(9).fillColor('#252329');

    for (const item of invoice.items) {
      doc.strokeColor('#E4E1E5').moveTo(50, y + 24).lineTo(545, y + 24).stroke();
      doc.text(item.description, 60, y + 7, { width: 220 });
      doc.text(item.quantity.toString(), 280, y + 7, { align: 'right' });
      doc.text(`${settings.currencySymbol}${Number(item.unitPrice).toFixed(2)}`, 360, y + 7, { align: 'right' });
      doc.text(`${Number(item.taxRate).toFixed(0)}%`, 440, y + 7, { align: 'right' });
      doc.text(`${settings.currencySymbol}${Number(item.totalAmount).toFixed(2)}`, 535, y + 7, { align: 'right' });
      y += 26;
    }

    // Totals Section
    const totalsTop = y + 20;
    doc.font('Helvetica').fontSize(10).fillColor('#77727A');
    doc.text('Subtotal:', 380, totalsTop, { align: 'right' });
    doc.text(`${settings.currencySymbol}${Number(invoice.subtotal).toFixed(2)}`, 535, totalsTop, { align: 'right' });

    doc.text('Discount:', 380, totalsTop + 16, { align: 'right' });
    doc.text(`-${settings.currencySymbol}${Number(invoice.discountAmount).toFixed(2)}`, 535, totalsTop + 16, { align: 'right' });

    doc.text('Tax Amount:', 380, totalsTop + 32, { align: 'right' });
    doc.text(`${settings.currencySymbol}${Number(invoice.taxAmount).toFixed(2)}`, 535, totalsTop + 32, { align: 'right' });

    // Total Block
    doc.fillColor('#4B2D47').rect(350, totalsTop + 50, 195, 26).fill();
    doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
    doc.text('TOTAL AMOUNT:', 360, totalsTop + 58);
    doc.text(`${settings.currencySymbol}${Number(invoice.totalAmount).toFixed(2)}`, 535, totalsTop + 58, { align: 'right' });

    // Paid & Balance Due
    doc.fillColor('#252329').fontSize(10).font('Helvetica');
    doc.text('Amount Paid:', 380, totalsTop + 85, { align: 'right' });
    doc.text(`${settings.currencySymbol}${Number(invoice.amountPaid).toFixed(2)}`, 535, totalsTop + 85, { align: 'right' });

    doc.font('Helvetica-Bold').fillColor(Number(invoice.balanceDue) > 0 ? '#DC2626' : '#059669');
    doc.text('Balance Due:', 380, totalsTop + 102, { align: 'right' });
    doc.text(`${settings.currencySymbol}${Number(invoice.balanceDue).toFixed(2)}`, 535, totalsTop + 102, { align: 'right' });

    // Footer
    doc.fillColor('#77727A').fontSize(8).font('Helvetica');
    doc.text('Thank you for choosing Brightloop Software.', 50, 750, { align: 'center', width: 495 });
    doc.text('Payment is due within 15 days of invoice date. Inquiries: billing@brightloop.io', 50, 762, { align: 'center', width: 495 });

    doc.end();
    return doc;
  }
}

export const invoiceService = new InvoiceService();

