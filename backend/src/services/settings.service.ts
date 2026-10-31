import { prisma } from '../lib/prisma';

export interface UpdateSettingsInput {
  companyName?: string;
  currency?: string;
  currencySymbol?: string;
  taxNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  invoicePrefix?: string;
  quotationPrefix?: string;
  subPrefix?: string;
}

class SettingsService {
  async getSettings() {
    let settings = await prisma.businessSettings.findFirst();
    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          id: 'default-settings',
          companyName: 'Brightloop Software',
          currency: 'USD',
          currencySymbol: '$',
          taxNumber: 'US-BL-849204',
          contactEmail: 'billing@brightloop.io',
          contactPhone: '+1 (555) 019-2834',
          address: '100 Innovation Way, Suite 400, Tech City, TC 94016',
          invoicePrefix: 'INV',
          quotationPrefix: 'QT',
          subPrefix: 'SUB',
        },
      });
    }
    return settings;
  }

  async updateSettings(input: UpdateSettingsInput) {
    const current = await this.getSettings();
    return prisma.businessSettings.update({
      where: { id: current.id },
      data: {
        companyName: input.companyName?.trim(),
        currency: input.currency?.trim(),
        currencySymbol: input.currencySymbol?.trim(),
        taxNumber: input.taxNumber?.trim(),
        contactEmail: input.contactEmail?.trim(),
        contactPhone: input.contactPhone?.trim(),
        address: input.address?.trim(),
        invoicePrefix: input.invoicePrefix?.trim(),
        quotationPrefix: input.quotationPrefix?.trim(),
        subPrefix: input.subPrefix?.trim(),
      },
    });
  }
}

export const settingsService = new SettingsService();
