import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateTaxInput {
  name: string;
  rate: number;
  description?: string;
  isDefault?: boolean;
}

class TaxService {
  async listTaxes(onlyActive: boolean = true) {
    return prisma.taxRule.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { rate: 'asc' },
    });
  }

  async getTaxById(id: string) {
    const tax = await prisma.taxRule.findUnique({ where: { id } });
    if (!tax) {
      const err: any = new Error('Tax rule not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return tax;
  }

  async createTax(input: CreateTaxInput) {
    if (input.isDefault) {
      // Unset other defaults
      await prisma.taxRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.taxRule.create({
      data: {
        name: input.name.trim(),
        rate: new Prisma.Decimal(input.rate),
        description: input.description?.trim() || null,
        isDefault: input.isDefault ?? false,
      },
    });
  }

  async updateTax(id: string, input: Partial<CreateTaxInput> & { isActive?: boolean }) {
    if (input.isDefault) {
      await prisma.taxRule.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.taxRule.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        rate: input.rate !== undefined ? new Prisma.Decimal(input.rate) : undefined,
        description: input.description !== undefined ? input.description?.trim() : undefined,
        isDefault: input.isDefault,
        isActive: input.isActive,
      },
    });
  }
}

export const taxService = new TaxService();
