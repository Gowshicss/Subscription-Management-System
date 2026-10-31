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
   * Generates a PDF stream for the invoice with modern clean typography and proper column bounding.
   */
  async generateInvoicePdf(id: string, userRole: Role, customerId?: string | null): Promise<PDFKit.PDFDocument> {
    const invoice = await this.getInvoiceById(id, userRole, customerId);
    const settings = (await prisma.businessSettings.findFirst()) || {
      companyName: 'Brightloop Software',
      currencySymbol: 'Rs. ',
      address: '100 Innovation Way, Suite 400, Tech City, TC 94016',
      contactEmail: 'billing@brightloop.io',
      taxNumber: 'US-BL-849204',
    };

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Use 'Rs. ' for standard PDFKit fonts since Helvetica does not support unicode '₹'
    const currSymbol = settings.currencySymbol === '₹' ? 'Rs. ' : (settings.currencySymbol ? `${settings.currencySymbol} ` : 'Rs. ');

    // Top Accent line (Plum)
    doc.fillColor('#5E3A54').rect(50, 45, 495, 4).fill();

    // Header Brand
    doc.fillColor('#5E3A54').fontSize(20).font('Helvetica-Bold').text('BRIGHTLOOP SOFTWARE', 50, 60);
    doc.fillColor('#737078').fontSize(8.5).font('Helvetica').text('Subscription Management System', 50, 83);
    doc.text(settings.address, 50, 95);
    doc.text(`Email: ${settings.contactEmail}  |  Tax ID: ${settings.taxNumber}`, 50, 107);

    // Invoice Meta Right Column
    doc.fillColor('#1F1E22').fontSize(22).font('Helvetica-Bold').text('INVOICE', 320, 58, { width: 225, align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#5E3A54').text(invoice.invoiceNumber, 320, 83, { width: 225, align: 'right' });
    doc.fontSize(8.5).font('Helvetica').fillColor('#737078');
    doc.text(`Status: ${invoice.status}`, 320, 96, { width: 225, align: 'right' });
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 320, 108, { width: 225, align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 320, 120, { width: 225, align: 'right' });

    // Divider
    doc.strokeColor('#E7E5E4').lineWidth(1).moveTo(50, 138).lineTo(545, 138).stroke();

    // BILL TO Card
    doc.fillColor('#FAF9F6').roundedRect(50, 150, 240, 88, 6).fill();
    doc.strokeColor('#E7E5E4').roundedRect(50, 150, 240, 88, 6).stroke();

    doc.fillColor('#737078').fontSize(7.5).font('Helvetica-Bold').text('BILL TO', 62, 160);
    doc.fillColor('#1F1E22').fontSize(11).font('Helvetica-Bold').text(invoice.customer.companyName, 62, 172, { width: 216 });
    doc.fillColor('#737078').fontSize(8.5).font('Helvetica');
    doc.text(`Attn: ${invoice.customer.contactName}`, 62, 187, { width: 216 });
    doc.text(invoice.customer.billingAddress, 62, 199, { width: 216, lineBreak: false, ellipsis: true });
    doc.text(`Email: ${invoice.customer.email}`, 62, 211, { width: 216 });
    if (invoice.customer.taxNumber) {
      doc.text(`Tax ID: ${invoice.customer.taxNumber}`, 62, 223, { width: 216 });
    }

    // SUBSCRIPTION DETAILS Card
    doc.fillColor('#FAF9F6').roundedRect(305, 150, 240, 88, 6).fill();
    doc.strokeColor('#E7E5E4').roundedRect(305, 150, 240, 88, 6).stroke();

    doc.fillColor('#737078').fontSize(7.5).font('Helvetica-Bold').text('SUBSCRIPTION DETAILS', 317, 160);
    doc.fillColor('#5E3A54').fontSize(10).font('Helvetica-Bold').text(invoice.subscription.subscriptionNumber, 317, 172);
    doc.fillColor('#1F1E22').fontSize(8.5).font('Helvetica');
    doc.text(`Plan: ${invoice.subscription.plan.name}`, 317, 187);
    doc.text(`Frequency: ${invoice.subscription.plan.billingFrequency}`, 317, 199);
    doc.text(`Period: ${new Date(invoice.periodStart).toLocaleDateString()} – ${new Date(invoice.periodEnd).toLocaleDateString()}`, 317, 211);

    // Items Table Header
    const tableTop = 255;
    doc.fillColor('#FAF9F6').roundedRect(50, tableTop, 495, 24, 4).fill();
    doc.strokeColor('#E7E5E4').roundedRect(50, tableTop, 495, 24, 4).stroke();

    doc.fillColor('#737078').fontSize(8).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 62, tableTop + 8, { width: 215, align: 'left' });
    doc.text('QTY', 282, tableTop + 8, { width: 35, align: 'center' });
    doc.text('UNIT PRICE', 325, tableTop + 8, { width: 75, align: 'right' });
    doc.text('TAX', 410, tableTop + 8, { width: 35, align: 'right' });
    doc.text('AMOUNT', 455, tableTop + 8, { width: 80, align: 'right' });

    let y = tableTop + 24;
    doc.font('Helvetica').fontSize(8.5).fillColor('#1F1E22');

    for (const item of invoice.items) {
      doc.strokeColor('#F0EFF1').moveTo(50, y + 26).lineTo(545, y + 26).stroke();
      doc.text(item.description, 62, y + 8, { width: 215, align: 'left' });
      doc.text(item.quantity.toString(), 282, y + 8, { width: 35, align: 'center' });
      doc.text(`${currSymbol}${Number(item.unitPrice).toFixed(2)}`, 325, y + 8, { width: 75, align: 'right' });
      doc.text(`${Number(item.taxRate).toFixed(0)}%`, 410, y + 8, { width: 35, align: 'right' });
      doc.font('Helvetica-Bold').text(`${currSymbol}${Number(item.totalAmount).toFixed(2)}`, 455, y + 8, { width: 80, align: 'right' });
      doc.font('Helvetica');
      y += 28;
    }

    // Bottom Section: Payment Instructions on Left, Totals on Right
    const totalsTop = y + 20;

    // Left Side: Payment terms / notes
    doc.fillColor('#FAF9F6').roundedRect(50, totalsTop, 240, 112, 6).fill();
    doc.strokeColor('#E7E5E4').roundedRect(50, totalsTop, 240, 112, 6).stroke();
    doc.fillColor('#737078').fontSize(8).font('Helvetica-Bold').text('PAYMENT & REMITTANCE INSTRUCTIONS', 62, totalsTop + 12);
    doc.fillColor('#1F1E22').fontSize(8.5).font('Helvetica');
    doc.text('Bank Name: HDFC Bank Ltd', 62, totalsTop + 28);
    doc.text('Account Name: Brightloop Software Solutions', 62, totalsTop + 42);
    doc.text('Account Number: 50200084920411', 62, totalsTop + 56);
    doc.text('IFSC Code: HDFC0001234', 62, totalsTop + 70);
    doc.fillColor('#737078').fontSize(7.5).text('Please include invoice number in payment description.', 62, totalsTop + 90);

    // Right Side: Subtotal, Discount, Tax
    doc.font('Helvetica').fontSize(9).fillColor('#737078');
    doc.text('Subtotal:', 310, totalsTop + 4, { width: 110, align: 'left' });
    doc.fillColor('#1F1E22').font('Helvetica-Bold').text(`${currSymbol}${Number(invoice.subtotal).toFixed(2)}`, 425, totalsTop + 4, { width: 110, align: 'right' });

    doc.font('Helvetica').fillColor('#737078').text('Discount:', 310, totalsTop + 20, { width: 110, align: 'left' });
    doc.fillColor('#059669').font('Helvetica-Bold').text(`-${currSymbol}${Number(invoice.discountAmount).toFixed(2)}`, 425, totalsTop + 20, { width: 110, align: 'right' });

    doc.font('Helvetica').fillColor('#737078').text('Tax Amount:', 310, totalsTop + 36, { width: 110, align: 'left' });
    doc.fillColor('#1F1E22').font('Helvetica-Bold').text(`${currSymbol}${Number(invoice.taxAmount).toFixed(2)}`, 425, totalsTop + 36, { width: 110, align: 'right' });

    // Total Block Banner (Deep Plum #5E3A54)
    doc.fillColor('#5E3A54').roundedRect(305, totalsTop + 54, 240, 28, 4).fill();
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
    doc.text('TOTAL AMOUNT:', 317, totalsTop + 63, { width: 100, align: 'left' });
    doc.text(`${currSymbol}${Number(invoice.totalAmount).toFixed(2)}`, 420, totalsTop + 63, { width: 115, align: 'right' });

    // Paid & Balance Due
    doc.fillColor('#737078').fontSize(9).font('Helvetica');
    doc.text('Amount Paid:', 310, totalsTop + 90, { width: 110, align: 'left' });
    doc.fillColor('#059669').font('Helvetica-Bold').text(`${currSymbol}${Number(invoice.amountPaid).toFixed(2)}`, 425, totalsTop + 90, { width: 110, align: 'right' });

    doc.strokeColor('#E7E5E4').moveTo(310, totalsTop + 106).lineTo(545, totalsTop + 106).stroke();

    doc.font('Helvetica-Bold').fontSize(10).fillColor(Number(invoice.balanceDue) > 0 ? '#DC2626' : '#059669');
    doc.text('Balance Due:', 310, totalsTop + 112, { width: 110, align: 'left' });
    doc.text(`${currSymbol}${Number(invoice.balanceDue).toFixed(2)}`, 420, totalsTop + 112, { width: 115, align: 'right' });

    // Footer
    doc.fillColor('#737078').fontSize(8).font('Helvetica');
    doc.text('Thank you for choosing Brightloop Software.', 50, 750, { align: 'center', width: 495 });
    doc.text('Payment is due within 15 days of invoice date. Inquiries: billing@brightloop.io', 50, 762, { align: 'center', width: 495 });

    doc.end();
    return doc;
  }
}

export const invoiceService = new InvoiceService();

