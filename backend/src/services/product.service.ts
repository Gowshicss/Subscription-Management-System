import { prisma } from '../lib/prisma';
import { ProductType, Prisma } from '@prisma/client';

export interface CreateProductInput {
  name: string;
  code: string;
  type?: ProductType;
  salesPrice: number;
  costPrice: number;
  notes?: string;
  variants?: {
    name: string;
    description?: string;
    additionalPrice: number;
  }[];
}

export interface UpdateProductInput {
  name?: string;
  type?: ProductType;
  salesPrice?: number;
  costPrice?: number;
  notes?: string;
  isArchived?: boolean;
}

export interface CreateVariantInput {
  name: string;
  description?: string;
  additionalPrice: number;
}

class ProductService {
  async listProducts(query?: { search?: string; type?: ProductType; includeArchived?: boolean }) {
    const where: Prisma.ProductWhereInput = {};
    if (!query?.includeArchived) {
      where.isArchived = false;
    }
    if (query?.type) {
      where.type = query.type;
    }
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return prisma.product.findMany({
      where,
      include: {
        variants: {
          orderBy: { additionalPrice: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!product) {
      const err: any = new Error('Product not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return product;
  }

  async createProduct(input: CreateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { code: input.code.toUpperCase().trim() },
    });
    if (existing) {
      const err: any = new Error(`Product with code '${input.code}' already exists.`);
      err.statusCode = 409;
      err.code = 'CODE_EXISTS';
      throw err;
    }

    return prisma.product.create({
      data: {
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        type: input.type || ProductType.SOFTWARE,
        salesPrice: new Prisma.Decimal(input.salesPrice),
        costPrice: new Prisma.Decimal(input.costPrice),
        notes: input.notes?.trim() || null,
        variants: input.variants && input.variants.length > 0
          ? {
              create: input.variants.map((v) => ({
                name: v.name.trim(),
                description: v.description?.trim() || null,
                additionalPrice: new Prisma.Decimal(v.additionalPrice || 0),
              })),
            }
          : undefined,
      },
      include: { variants: true },
    });
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    await this.getProductById(id);
    return prisma.product.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        type: input.type,
        salesPrice: input.salesPrice !== undefined ? new Prisma.Decimal(input.salesPrice) : undefined,
        costPrice: input.costPrice !== undefined ? new Prisma.Decimal(input.costPrice) : undefined,
        notes: input.notes !== undefined ? input.notes?.trim() : undefined,
        isArchived: input.isArchived,
      },
      include: { variants: true },
    });
  }

  async archiveProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async createVariant(productId: string, input: CreateVariantInput) {
    await this.getProductById(productId);
    return prisma.productVariant.create({
      data: {
        productId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        additionalPrice: new Prisma.Decimal(input.additionalPrice || 0),
      },
    });
  }

  async updateVariant(variantId: string, input: Partial<CreateVariantInput> & { isActive?: boolean }) {
    return prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: input.name?.trim(),
        description: input.description !== undefined ? input.description?.trim() : undefined,
        additionalPrice: input.additionalPrice !== undefined ? new Prisma.Decimal(input.additionalPrice) : undefined,
        isActive: input.isActive,
      },
    });
  }
}

export const productService = new ProductService();
