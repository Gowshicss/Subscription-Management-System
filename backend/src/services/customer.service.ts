import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateCustomerInput {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxNumber?: string;
  currency?: string;
  notes?: string;
}

class CustomerService {
  async listCustomers(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};
    if (params?.search) {
      where.OR = [
        { companyName: { contains: params.search, mode: 'insensitive' } },
        { contactName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              subscriptions: true,
              invoices: true,
              quotations: true,
            },
          },
          invoices: {
            select: {
              balanceDue: true,
              totalAmount: true,
              amountPaid: true,
            },
          },
        },
      }),
    ]);

    const formatted = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
      const totalPaid = c.invoices.reduce((acc, inv) => acc + Number(inv.amountPaid), 0);
      const totalOutstanding = c.invoices.reduce((acc, inv) => acc + Number(inv.balanceDue), 0);

      const { invoices, ...rest } = c;
      return {
        ...rest,
        financialSummary: {
          totalInvoiced,
          totalPaid,
          totalOutstanding,
        },
      };
    });

    return {
      customers: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      const err: any = new Error('Customer profile not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const totalInvoiced = customer.invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
    const totalPaid = customer.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalOutstanding = customer.invoices.reduce((acc, inv) => acc + Number(inv.balanceDue), 0);

    return {
      ...customer,
      financialSummary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
      },
    };
  }

  async createCustomer(input: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });
    if (existing) {
      const err: any = new Error('Customer with this email address already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    return prisma.customer.create({
      data: {
        companyName: input.companyName.trim(),
        contactName: input.contactName.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone.trim(),
        billingAddress: input.billingAddress.trim(),
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        country: input.country?.trim() || 'USA',
        postalCode: input.postalCode?.trim() || null,
        taxNumber: input.taxNumber?.trim() || null,
        currency: input.currency || 'INR',
        notes: input.notes?.trim() || null,
      },
    });
  }

  async updateCustomer(id: string, input: Partial<CreateCustomerInput>) {
    await this.getCustomerById(id);
    return prisma.customer.update({
      where: { id },
      data: {
        companyName: input.companyName?.trim(),
        contactName: input.contactName?.trim(),
        phone: input.phone?.trim(),
        billingAddress: input.billingAddress?.trim(),
        city: input.city?.trim(),
        state: input.state?.trim(),
        country: input.country?.trim(),
        postalCode: input.postalCode?.trim(),
        taxNumber: input.taxNumber?.trim(),
        currency: input.currency,
        notes: input.notes?.trim(),
      },
    });
  }
}

export const customerService = new CustomerService();

