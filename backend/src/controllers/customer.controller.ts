import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { Role } from '@prisma/client';

export class CustomerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);

      const result = await customerService.listCustomers({ search, page, limit });
      res.json({
        success: true,
        data: result.customers,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Scoped check for customer role
      if (req.user?.role === Role.CUSTOMER && req.user.customerId !== req.params.id) {
        res.status(403).json({ success: false, error: { message: 'Access denied.' } });
        return;
      }

      const customer = await customerService.getCustomerById(req.params.id);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer, message: 'Customer created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === Role.CUSTOMER && req.user.customerId !== req.params.id) {
        res.status(403).json({ success: false, error: { message: 'Access denied.' } });
        return;
      }

      const customer = await customerService.updateCustomer(req.params.id, req.body);
      res.json({ success: true, data: customer, message: 'Customer updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

