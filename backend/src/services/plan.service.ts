import { prisma } from '../lib/prisma';
import { BillingFrequency, Prisma } from '@prisma/client';

export interface CreatePlanInput {
  name: string;
  description?: string;
  basePrice: number;
  billingFrequency: BillingFrequency;
  minQuantity?: number;
  startDate: string | Date;
  endDate?: string | Date | null;
  autoClose?: boolean;
  allowEarlyClosure?: boolean;
  allowPause?: boolean;
  allowRenewal?: boolean;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  isActive?: boolean;
}

class PlanService {
  async listPlans(query?: { activeOnly?: boolean; frequency?: BillingFrequency }) {
    const where: Prisma.SubscriptionPlanWhereInput = {};
    if (query?.activeOnly !== false) {
      where.isActive = true;
    }
    if (query?.frequency) {
      where.billingFrequency = query.frequency;
    }

    return prisma.subscriptionPlan.findMany({
      where,
      orderBy: { basePrice: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });
    if (!plan) {
      const err: any = new Error('Subscription plan not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return plan;
  }

  async createPlan(input: CreatePlanInput) {
    const startDate = new Date(input.startDate);
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (endDate && endDate <= startDate) {
      const err: any = new Error('Plan end date must be after the start date.');
      err.statusCode = 400;
      err.code = 'INVALID_DATES';
      throw err;
    }

    return prisma.subscriptionPlan.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        basePrice: new Prisma.Decimal(input.basePrice),
        billingFrequency: input.billingFrequency,
        minQuantity: input.minQuantity && input.minQuantity > 0 ? input.minQuantity : 1,
        startDate,
        endDate,
        autoClose: input.autoClose ?? false,
        allowEarlyClosure: input.allowEarlyClosure ?? true,
        allowPause: input.allowPause ?? true,
        allowRenewal: input.allowRenewal ?? true,
      },
    });
  }

  async updatePlan(id: string, input: UpdatePlanInput) {
    await this.getPlanById(id);

    const startDate = input.startDate ? new Date(input.startDate) : undefined;
    const endDate = input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : undefined;

    if (startDate && endDate && endDate <= startDate) {
      const err: any = new Error('Plan end date must be after start date.');
      err.statusCode = 400;
      err.code = 'INVALID_DATES';
      throw err;
    }

    return prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: input.description !== undefined ? input.description?.trim() : undefined,
        basePrice: input.basePrice !== undefined ? new Prisma.Decimal(input.basePrice) : undefined,
        billingFrequency: input.billingFrequency,
        minQuantity: input.minQuantity,
        startDate,
        endDate,
        autoClose: input.autoClose,
        allowEarlyClosure: input.allowEarlyClosure,
        allowPause: input.allowPause,
        allowRenewal: input.allowRenewal,
        isActive: input.isActive,
      },
    });
  }

  async toggleActive(id: string) {
    const plan = await this.getPlanById(id);
    return prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });
  }
}

export const planService = new PlanService();
