import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const statusFilter = req.query.status as InvoiceStatus;
      const invoices = await invoiceService.listInvoices(
        req.user!.role,
        req.user!.customerId,
        statusFilter
      );
      res.json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getInvoiceById(
        req.params.id,
        req.user!.role,
        req.user!.customerId
      );
      res.json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.confirmInvoice(req.params.id);
      res.json({ success: true, data: invoice, message: 'Invoice confirmed.' });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.cancelInvoice(req.params.id);
      res.json({ success: true, data: invoice, message: 'Invoice cancelled.' });
    } catch (err) {
      next(err);
    }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await invoiceService.generateInvoicePdf(
        req.params.id,
        req.user!.role,
        req.user!.customerId
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${req.params.id}.pdf"`);
      doc.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

