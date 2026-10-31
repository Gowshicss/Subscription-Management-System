import { PrismaClient, Role, ProductType, BillingFrequency, QuotationStatus, SubscriptionStatus, InvoiceStatus, DiscountType, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Brightloop Software...');

  // 1. Business Settings
  const settings = await prisma.businessSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      companyName: 'Brightloop Software',
      currency: 'INR',
      currencySymbol: '₹',
      taxNumber: 'US-BL-849204',
      contactEmail: 'billing@brightloop.io',
      contactPhone: '+1 (555) 019-2834',
      address: '100 Innovation Way, Suite 400, Tech City, TC 94016',
      invoicePrefix: 'INV',
      quotationPrefix: 'QT',
      subPrefix: 'SUB',
    },
  });
  console.log('✓ Business settings configured');

  // Password hashes: meets problem statement requirements (>8 chars, uppercase, lowercase, special char)
  const adminPasswordHash = await bcrypt.hash('Brightloop@2026!', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@2026!', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@2026!', 10);

  // 2. Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@brightloop.io' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@brightloop.io',
      passwordHash: adminPasswordHash,
      firstName: 'Arthur',
      lastName: 'Pendelton',
      role: Role.ADMIN,
      phone: '+1 555-010-0001',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@brightloop.io' },
    update: { passwordHash: staffPasswordHash },
    create: {
      email: 'staff@brightloop.io',
      passwordHash: staffPasswordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      role: Role.STAFF,
      phone: '+1 555-010-0002',
    },
  });

  const staffUser2 = await prisma.user.upsert({
    where: { email: 'sarah.sales@brightloop.io' },
    update: { passwordHash: staffPasswordHash },
    create: {
      email: 'sarah.sales@brightloop.io',
      passwordHash: staffPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: Role.STAFF,
      phone: '+1 555-010-0003',
    },
  });

  const customerUser1 = await prisma.user.upsert({
    where: { email: 'acme@customer.com' },
    update: { passwordHash: customerPasswordHash },
    create: {
      email: 'acme@customer.com',
      passwordHash: customerPasswordHash,
      firstName: 'Marcus',
      lastName: 'Vance',
      role: Role.CUSTOMER,
      phone: '+1 555-012-4411',
    },
  });

  const customerUser2 = await prisma.user.upsert({
    where: { email: 'techcorp@domain.com' },
    update: { passwordHash: customerPasswordHash },
    create: {
      email: 'techcorp@domain.com',
      passwordHash: customerPasswordHash,
      firstName: 'Devon',
      lastName: 'Miles',
      role: Role.CUSTOMER,
      phone: '+1 555-012-7788',
    },
  });
  console.log('✓ Seeded Users: Admin, Staff, Customers');

  // 3. Customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'acme@customer.com' },
    update: {},
    create: {
      userId: customerUser1.id,
      companyName: 'Acme Dynamics Ltd',
      contactName: 'Marcus Vance',
      email: 'acme@customer.com',
      phone: '+1 555-012-4411',
      billingAddress: '450 Industrial Parkway, Building B',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      postalCode: '78701',
      taxNumber: 'TX-992019',
      currency: 'USD',
      notes: 'Premier manufacturing customer since 2024.',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'techcorp@domain.com' },
    update: {},
    create: {
      userId: customerUser2.id,
      companyName: 'TechCorp Solutions Inc',
      contactName: 'Devon Miles',
      email: 'techcorp@domain.com',
      phone: '+1 555-012-7788',
      billingAddress: '1200 Silicon Ave, Suite 300',
      city: 'San Jose',
      state: 'CA',
      country: 'USA',
      postalCode: '95110',
      taxNumber: 'CA-448102',
      currency: 'USD',
      notes: 'Fast-growing software client.',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { email: 'retailpro@shop.com' },
    update: {},
    create: {
      companyName: 'RetailPro Outlets',
      contactName: 'Chloe Bennett',
      email: 'retailpro@shop.com',
      phone: '+1 555-019-3322',
      billingAddress: '78 Market Street',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      taxNumber: 'IL-112948',
      currency: 'USD',
    },
  });
  console.log('✓ Seeded Customers');

  // 4. Products & Variants
  const prodSuite = await prisma.product.upsert({
    where: { code: 'BL-SUITE' },
    update: {},
    create: {
      name: 'Software Subscription',
      code: 'BL-SUITE',
      type: ProductType.SOFTWARE,
      salesPrice: 200.00,
      costPrice: 50.00,
      notes: 'Brightloop flagship business management software suite.',
    },
  });

  // Variant as explicitly called out in the problem statement:
  // "offers it in variants, for example by brand, where choosing the Odoo brand adds 560 to the price"
  const varOdoo = await prisma.productVariant.upsert({
    where: { id: 'var-brand-odoo' },
    update: {},
    create: {
      id: 'var-brand-odoo',
      productId: prodSuite.id,
      name: 'Brand: Odoo Edition',
      description: 'Fully integrated Odoo connector and dedicated workflow engine.',
      additionalPrice: 560.00,
      isActive: true,
    },
  });

  const varStandard = await prisma.productVariant.upsert({
    where: { id: 'var-brand-standard' },
    update: {},
    create: {
      id: 'var-brand-standard',
      productId: prodSuite.id,
      name: 'Standard Cloud Edition',
      description: 'Standard multi-tenant cloud managed by Brightloop.',
      additionalPrice: 0.00,
      isActive: true,
    },
  });

  const prodSupport = await prisma.product.upsert({
    where: { code: 'BL-SUPPORT' },
    update: {},
    create: {
      name: '24/7 Priority Support SLA',
      code: 'BL-SUPPORT',
      type: ProductType.SERVICE,
      salesPrice: 150.00,
      costPrice: 40.00,
      notes: 'Guaranteed 1-hour critical response SLA.',
    },
  });

  const prodAddon = await prisma.product.upsert({
    where: { code: 'BL-SEATS' },
    update: {},
    create: {
      name: 'Additional User Seat Pack',
      code: 'BL-SEATS',
      type: ProductType.ADDON,
      salesPrice: 25.00,
      costPrice: 5.00,
      notes: 'Pack of 5 concurrent team seats.',
    },
  });
  console.log('✓ Seeded Products & Variants (including Odoo +560 variant)');

  // 5. Subscription Plans
  const now = new Date();
  const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const planMonthly = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-monthly-pro' },
    update: {},
    create: {
      id: 'plan-monthly-pro',
      name: 'Monthly Business Pro',
      description: 'Standard monthly subscription for growing businesses.',
      basePrice: 100.00,
      billingFrequency: BillingFrequency.MONTHLY,
      minQuantity: 1,
      startDate: now,
      endDate: nextYear,
      autoClose: false,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      isActive: true,
    },
  });

  const planYearly = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-yearly-ent' },
    update: {},
    create: {
      id: 'plan-yearly-ent',
      name: 'Yearly Enterprise Contract',
      description: 'Annual enterprise commitment with extended SLAs.',
      basePrice: 1000.00,
      billingFrequency: BillingFrequency.YEARLY,
      minQuantity: 1,
      startDate: now,
      endDate: nextYear,
      autoClose: false,
      allowEarlyClosure: false,
      allowPause: false,
      allowRenewal: true,
      isActive: true,
    },
  });

  const planWeekly = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-weekly-starter' },
    update: {},
    create: {
      id: 'plan-weekly-starter',
      name: 'Weekly Growth Starter',
      description: 'Flexible weekly billing for rapid scale teams.',
      basePrice: 35.00,
      billingFrequency: BillingFrequency.WEEKLY,
      minQuantity: 1,
      startDate: now,
      endDate: nextYear,
      autoClose: false,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      isActive: true,
    },
  });
  console.log('✓ Seeded Subscription Plans (Monthly, Yearly, Weekly)');

  // 6. Tax Rules
  const taxStandard = await prisma.taxRule.upsert({
    where: { id: 'tax-standard-10' },
    update: {},
    create: {
      id: 'tax-standard-10',
      name: 'Standard Sales Tax (10%)',
      rate: 10.00,
      description: 'Standard state & corporate sales tax rate.',
      isDefault: true,
      isActive: true,
    },
  });

  const taxVAT = await prisma.taxRule.upsert({
    where: { id: 'tax-vat-18' },
    update: {},
    create: {
      id: 'tax-vat-18',
      name: 'VAT (18%)',
      rate: 18.00,
      description: 'Standard Value Added Tax for international services.',
      isDefault: false,
      isActive: true,
    },
  });
  console.log('✓ Seeded Tax Rules');

  // 7. Discounts
  const discountVolume = await prisma.discount.upsert({
    where: { code: 'VOLUME10' },
    update: {},
    create: {
      code: 'VOLUME10',
      name: 'Volume Purchase 10% Off',
      type: DiscountType.PERCENTAGE,
      value: 10.00,
      minQuantity: 5,
      startDate: now,
      endDate: nextYear,
      usageLimit: 100,
      timesUsed: 0,
      applyToWholeSub: true,
      isActive: true,
    },
  });

  const discountWelcome = await prisma.discount.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      name: 'Welcome Bonus ₹50 Off',
      type: DiscountType.FIXED,
      value: 50.00,
      minPurchaseAmount: 200.00,
      startDate: now,
      endDate: nextYear,
      usageLimit: 50,
      timesUsed: 0,
      applyToWholeSub: true,
      isActive: true,
    },
  });
  console.log('✓ Seeded Discount Rules');

  // 8. Quotation Templates
  const templateStandard = await prisma.quotationTemplate.upsert({
    where: { id: 'tmpl-standard' },
    update: {},
    create: {
      id: 'tmpl-standard',
      name: 'Standard Business Suite Package',
      description: 'Preconfigured bundle containing Software Subscription with Standard Cloud + Priority Support.',
      validityDays: 30,
      itemsJson: [
        {
          productId: prodSuite.id,
          variantId: varStandard.id,
          quantity: 1,
          unitPrice: 200.00,
          taxRate: 10.00,
        },
        {
          productId: prodSupport.id,
          variantId: null,
          quantity: 1,
          unitPrice: 150.00,
          taxRate: 10.00,
        },
      ],
      isActive: true,
    },
  });
  console.log('✓ Seeded Quotation Templates');

  // 9. Sample Quotation (SENT - Ready for customer acceptance in demo)
  const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const quote1 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-0001' },
    update: {},
    create: {
      quotationNumber: 'QT-2026-0001',
      customerId: customer1.id,
      templateId: templateStandard.id,
      status: QuotationStatus.SENT,
      validUntil: validUntilDate,
      subtotal: 760.00, // Software ($200 + Odoo variant $560 = $760)
      taxAmount: 76.00, // 10%
      discountAmount: 0.00,
      totalAmount: 836.00,
      notes: 'Special offer including the Odoo Edition connector.',
      items: {
        create: [
          {
            productId: prodSuite.id,
            variantId: varOdoo.id,
            planId: planMonthly.id,
            quantity: 1,
            unitPrice: 760.00,
            taxRate: 10.00,
            amount: 760.00,
          },
        ],
      },
    },
  });
  console.log('✓ Seeded Quotation QT-2026-0001 (SENT to Acme Corp)');

  // 10. Sample Active Subscription (due for recurring billing testing!)
  // Set nextBillingDate to today / in the past so scheduler can bill it!
  const sub1StartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sub1NextBilling = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago (Due now!)

  const sub1 = await prisma.subscription.upsert({
    where: { subscriptionNumber: 'SUB-2026-0001' },
    update: { nextBillingDate: sub1NextBilling },
    create: {
      subscriptionNumber: 'SUB-2026-0001',
      customerId: customer2.id,
      planId: planMonthly.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: sub1StartDate,
      expiryDate: nextYear,
      nextBillingDate: sub1NextBilling,
      paymentTerms: 'Net 30',
      autoClose: false,
      subtotal: 200.00,
      taxAmount: 20.00,
      discountAmount: 0.00,
      totalAmount: 220.00,
      items: {
        create: [
          {
            productId: prodSuite.id,
            variantId: varStandard.id,
            quantity: 1,
            unitPrice: 200.00,
            taxRate: 10.00,
            amount: 200.00,
          },
        ],
      },
    },
  });

  // 11. Historical Invoices & Partial Payments
  const lastMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const lastMonthEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const invoiceDueDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  const inv1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-0001',
      subscriptionId: sub1.id,
      customerId: customer2.id,
      periodStart: lastMonthStart,
      periodEnd: lastMonthEnd,
      invoiceDate: lastMonthStart,
      dueDate: invoiceDueDate,
      status: InvoiceStatus.CONFIRMED,
      subtotal: 200.00,
      taxAmount: 20.00,
      discountAmount: 0.00,
      totalAmount: 220.00,
      amountPaid: 100.00, // Partial payment
      balanceDue: 120.00, // Remaining balance
      notes: 'Initial monthly billing cycle with partial payment applied.',
      items: {
        create: [
          {
            productId: prodSuite.id,
            variantId: varStandard.id,
            description: 'Software Subscription - Standard Cloud Edition',
            quantity: 1,
            unitPrice: 200.00,
            taxRate: 10.00,
            taxAmount: 20.00,
            discountAmount: 0.00,
            totalAmount: 220.00,
          },
        ],
      },
    },
  });

  // Record payment for invoice
  await prisma.payment.upsert({
    where: { paymentNumber: 'PAY-2026-0001' },
    update: {},
    create: {
      paymentNumber: 'PAY-2026-0001',
      invoiceId: inv1.id,
      customerId: customer2.id,
      amount: 100.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      referenceNote: 'Wire Transfer #WT-89412 - Partial installment',
      recordedById: staffUser.id,
    },
  });
  console.log('✓ Seeded Invoice INV-2026-0001 ($220 total, $100 paid, $120 balance due)');
  console.log('✓ Seeded Payment PAY-2026-0001 ($100.00)');

  console.log('\n🎉 Database seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

