import { Request, Response, NextFunction } from 'express';
import { taxService } from '../services/tax.service';

export class TaxController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const taxes = await taxService.listTaxes(req.query.all !== 'true');
      res.json({ success: true, data: taxes });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tax = await taxService.getTaxById(req.params.id);
      res.json({ success: true, data: tax });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tax = await taxService.createTax(req.body);
      res.status(201).json({ success: true, data: tax, message: 'Tax rule created.' });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tax = await taxService.updateTax(req.params.id, req.body);
      res.json({ success: true, data: tax, message: 'Tax rule updated.' });
    } catch (err) {
      next(err);
    }
  }
}

