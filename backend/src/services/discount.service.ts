import { prisma } from '../lib/prisma';
import { DiscountType, Prisma } from '@prisma/client';

export interface CreateDiscountInput {
  code: string;
  name: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number | null;
  minQuantity?: number | null;
  startDate: string | Date;
  endDate?: string | Date | null;
  usageLimit?: number | null;
  productId?: string | null;
  applyToWholeSub?: boolean;
}

export interface EvaluateDiscountContext {
  subtotal: number;
  totalQuantity: number;
  items: { productId: string; quantity: number; amount: number }[];
}

class DiscountService {
  async listDiscounts(onlyActive: boolean = true) {
    return prisma.discount.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: {
        product: { select: { id: true, name: true, code: true } },
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDiscountById(id: string) {
    const discount = await prisma.discount.findUnique({
      where: { id },
      include: { product: true, usages: true },
    });
    if (!discount) {
      const err: any = new Error('Discount rule not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return discount;
  }

  async createDiscount(input: CreateDiscountInput) {
    const existing = await prisma.discount.findUnique({
      where: { code: input.code.toUpperCase().trim() },
    });
    if (existing) {
      const err: any = new Error(`Discount code '${input.code}' already exists.`);
      err.statusCode = 409;
      err.code = 'CODE_EXISTS';
      throw err;
    }

    const startDate = new Date(input.startDate);
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (endDate && endDate <= startDate) {
      const err: any = new Error('Discount end date must be after start date.');
      err.statusCode = 400;
      err.code = 'INVALID_DATES';
      throw err;
    }

    return prisma.discount.create({
      data: {
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        type: input.type,
        value: new Prisma.Decimal(input.value),
        minPurchaseAmount: input.minPurchaseAmount ? new Prisma.Decimal(input.minPurchaseAmount) : null,
        minQuantity: input.minQuantity || null,
        startDate,
        endDate,
        usageLimit: input.usageLimit || null,
        productId: input.productId || null,
        applyToWholeSub: input.applyToWholeSub ?? true,
      },
      include: { product: true },
    });
  }

  async updateDiscount(id: string, input: Partial<CreateDiscountInput> & { isActive?: boolean }) {
    await this.getDiscountById(id);
    return prisma.discount.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        type: input.type,
        value: input.value !== undefined ? new Prisma.Decimal(input.value) : undefined,
        minPurchaseAmount: input.minPurchaseAmount !== undefined ? (input.minPurchaseAmount ? new Prisma.Decimal(input.minPurchaseAmount) : null) : undefined,
        minQuantity: input.minQuantity !== undefined ? input.minQuantity : undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : undefined,
        usageLimit: input.usageLimit !== undefined ? input.usageLimit : undefined,
        productId: input.productId !== undefined ? input.productId : undefined,
        applyToWholeSub: input.applyToWholeSub,
        isActive: input.isActive,
      },
      include: { product: true },
    });
  }

  /**
   * Evaluates all active discounts against the purchase context and returns the best eligible discount.
   */
  async findBestEligibleDiscount(context: EvaluateDiscountContext) {
    const now = new Date();
    const discounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    let bestDiscount: { discount: (typeof discounts)[0]; calculatedAmount: number } | null = null;

    for (const d of discounts) {
      // Check usage limit
      if (d.usageLimit !== null && d.timesUsed >= d.usageLimit) {
        continue;
      }

      // Check min quantity
      if (d.minQuantity !== null && context.totalQuantity < d.minQuantity) {
        continue;
      }

      // Check min purchase
      if (d.minPurchaseAmount !== null && context.subtotal < Number(d.minPurchaseAmount)) {
        continue;
      }

      let discountAmount = 0;

      if (d.applyToWholeSub) {
        if (d.type === DiscountType.PERCENTAGE) {
          discountAmount = (context.subtotal * Number(d.value)) / 100;
        } else {
          discountAmount = Number(d.value);
        }
      } else if (d.productId) {
        // Product specific discount
        const matchingItem = context.items.find((i) => i.productId === d.productId);
        if (!matchingItem) continue;

        if (d.type === DiscountType.PERCENTAGE) {
          discountAmount = (matchingItem.amount * Number(d.value)) / 100;
        } else {
          discountAmount = Number(d.value);
        }
      }

      // Cap discount to subtotal so total is never negative
      discountAmount = Math.min(context.subtotal, Math.max(0, discountAmount));

      if (discountAmount > 0 && (!bestDiscount || discountAmount > bestDiscount.calculatedAmount)) {
        bestDiscount = { discount: d, calculatedAmount: discountAmount };
      }
    }

    return bestDiscount;
  }
}

export const discountService = new DiscountService();
