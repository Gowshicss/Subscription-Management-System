import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { ProductType } from '@prisma/client';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const type = req.query.type as ProductType;
      const includeArchived = req.query.includeArchived === 'true';

      const products = await productService.listProducts({ search, type, includeArchived });
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({ success: true, data: product, message: 'Product created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.json({ success: true, data: product, message: 'Product updated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.archiveProduct(req.params.id);
      res.json({ success: true, message: 'Product archived successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.createVariant(req.params.id, req.body);
      res.status(201).json({ success: true, data: variant, message: 'Variant created successfully.' });
    } catch (err) {
      next(err);
    }
  }

  static async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.updateVariant(req.params.variantId, req.body);
      res.json({ success: true, data: variant, message: 'Variant updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
