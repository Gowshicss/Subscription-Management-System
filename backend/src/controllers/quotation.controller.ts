import { Request, Response, NextFunction } from 'express';
import { quotationService } from '../services/quotation.service';
import { Role } from '@prisma/client';

export class QuotationController {
  static async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await quotationService.listTemplates();
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  static async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await quotationService.createTemplate(req.body);
      res.status(201).json({ success: true, data: template, message: 'Template created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const quotations = await quotationService.listQuotations(
        req.user!.role,
        req.user!.customerId
      );
      res.json({ success: true, data: quotations });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.getQuotationById(
        req.params.id,
        req.user!.role,
        req.user!.customerId
      );
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.createQuotation(req.body);
      res.status(201).json({ success: true, data: quotation, message: 'Quotation created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await quotationService.sendQuotation(req.params.id);
      res.json({ success: true, data: quotation, message: 'Quotation marked as SENT.' });
    } catch (err) {
      next(err);
    }
  }

  static async accept(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== Role.CUSTOMER || !req.user!.customerId) {
        res.status(403).json({ success: false, error: { message: 'Only registered customers can accept quotations.' } });
        return;
      }

      const subscription = await quotationService.acceptAndConvertToSubscription(
        req.params.id,
        req.user!.customerId
      );
      res.json({
        success: true,
        data: subscription,
        message: 'Quotation accepted! Subscription successfully generated.',
      });
    } catch (err) {
      next(err);
    }
  }
}
