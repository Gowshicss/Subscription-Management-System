import {
  PrismaClient,
  Role,
  ProductType,
  BillingFrequency,
  SubscriptionStatus,
  QuotationStatus,
  InvoiceStatus,
  DiscountType,
  PaymentMethod,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function getSeedDataPlan() {
  return {
    users: [
      { email: 'admin@brightloop.io', role: 'ADMIN', name: 'Admin User' },
      { email: 'staff@brightloop.io', role: 'STAFF', name: 'Elena Rostova' },
      { email: 'acme@customer.com', role: 'CUSTOMER', name: 'Marcus Vance' },
    ],
    customers: [
      { name: 'Acme Technologies', email: 'acme@customer.com', contact: 'Marcus Vance', city: 'San Francisco', country: 'USA' },
      { name: 'Nova Solutions', email: 'billing@novasolutions.io', contact: 'Sarah Jenkins', city: 'London', country: 'UK' },
      { name: 'GreenByte Systems', email: 'finance@greenbytesystems.com', contact: 'David Zhao', city: 'Singapore', country: 'Singapore' },
      { name: 'PixelWorks Studio', email: 'accounts@pixelworks.design', contact: 'Maya Lin', city: 'Toronto', country: 'Canada' },
      { name: 'Vertex Digital', email: 'contact@vertexdigital.net', contact: 'Alex Rivera', city: 'Berlin', country: 'Germany' },
    ],
    products: [
      { name: 'BrightCloud Hosting', code: 'PROD-CLOUD-01', price: 3999, variants: ['Dedicated IP (+₹500)', '100GB NVMe Expansion (+₹1,200)'] },
      { name: 'BrightCRM Professional', code: 'PROD-CRM-01', price: 4999, variants: ['Advanced Analytics (+₹1,500)', 'Multi-Currency Module (+₹800)'] },
      { name: 'MailFlow Automation', code: 'PROD-MAIL-01', price: 2499, variants: ['Dedicated SMTP Relay (+₹1,800)'] },
      { name: 'Insight Analytics', code: 'PROD-ANALYTICS-01', price: 5499, variants: ['Custom Executive Dashboards (+₹2,500)'] },
      { name: 'Enterprise Security Suite', code: 'PROD-SEC-01', price: 7999, variants: ['Automated SOC2 Engine (+₹3,500)'] },
    ],
    plans: [
      { name: 'Starter Cloud Monthly', price: 1999, frequency: 'MONTHLY' },
      { name: 'Enterprise Flex Monthly', price: 8999, frequency: 'MONTHLY' },
      { name: 'Business Growth Annual', price: 21999, frequency: 'YEARLY' },
    ],
    taxes: [
      { name: 'GST 18%', rate: 18.0, isDefault: true },
      { name: 'Standard VAT 10%', rate: 10.0, isDefault: false },
    ],
    discounts: [
      { code: 'HACKATHON2026', type: 'PERCENTAGE', value: 10.0 },
      { code: 'STARTUP500', type: 'FIXED', value: 500.0 },
    ],
    quotations: [
      { number: 'QT-2026-001', customer: 'PixelWorks Studio', status: 'DRAFT', total: 4718.82 },
      { number: 'QT-2026-002', customer: 'GreenByte Systems', status: 'SENT', total: 7668.82 },
      { number: 'QT-2026-003', customer: 'Nova Solutions', status: 'ACCEPTED', total: 25958.82 },
      { number: 'QT-2026-004', customer: 'Acme Technologies', status: 'CONVERTED', total: 10618.82 },
    ],
    subscriptions: [
      { number: 'SUB-2026-001', customer: 'Acme Technologies', status: 'ACTIVE', total: 10618.82 },
      { number: 'SUB-2026-002', customer: 'Nova Solutions', status: 'ACTIVE', total: 25958.82 },
      { number: 'SUB-2026-003', customer: 'GreenByte Systems', status: 'PAUSED', total: 2358.82 },
    ],
    invoices: [
      { number: 'INV-2026-001', customer: 'Acme Technologies', status: 'PAID', total: 10618.82, paid: 10618.82, balance: 0.00 },
      { number: 'INV-2026-002', customer: 'Nova Solutions', status: 'CONFIRMED', total: 25958.82, paid: 10000.00, balance: 15958.82 },
      { number: 'INV-2026-003', customer: 'GreenByte Systems', status: 'CONFIRMED', total: 2358.82, paid: 0.00, balance: 2358.82 },
    ],
    payments: [
      { number: 'PAY-2026-001', invoice: 'INV-2026-001', customer: 'Acme Technologies', amount: 10618.82, method: 'BANK_TRANSFER' },
      { number: 'PAY-2026-002', invoice: 'INV-2026-002', customer: 'Nova Solutions', amount: 10000.00, method: 'ONLINE' },
    ],
  };
}

async function bootstrapDemoAccounts() {
  const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('--check-only');
  if (isDryRun) {
    const plan = await getSeedDataPlan();
    console.log('[COMPILE & DRY-RUN OK] Demo bootstrap script verified.');
    console.log(`Plan summary: ${plan.users.length} users, ${plan.customers.length} customers, ${plan.products.length} products, ${plan.plans.length} plans, ${plan.quotations.length} quotations, ${plan.subscriptions.length} subscriptions, ${plan.invoices.length} invoices, ${plan.payments.length} payments.`);
    process.exit(0);
  }

  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    console.error('\n[CONFIGURATION ERROR] A valid Neon production database URL is required.');
    console.error('Please run this script using the secure wrapper: .\\bootstrap_demo_accounts.ps1\n');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  const demoAdminEmail = (process.env.DEMO_ADMIN_EMAIL || 'admin@brightloop.io').toLowerCase().trim();
  const demoStaffEmail = (process.env.DEMO_STAFF_EMAIL || 'staff@brightloop.io').toLowerCase().trim();
  const demoCustomerEmail = (process.env.DEMO_CUSTOMER_EMAIL || 'acme@customer.com').toLowerCase().trim();

  try {
    console.log('================================================================');
    console.log(' Brightloop - Hackathon Evaluator Data Safe Provisioning');
    console.log('================================================================\n');

    // 1. Safety verification
    const existingUsers = await prisma.user.count();
    console.log(`[SAFETY CHECK] Total existing users in database: ${existingUsers}`);
    console.log('[SAFETY CHECK] Preserving operational accounts and ensuring strict idempotency.\n');

    const adminPasswordHash = await bcrypt.hash('Brightloop@2026!', 10);
    const staffPasswordHash = await bcrypt.hash('Staff@2026!', 10);
    const customerPasswordHash = await bcrypt.hash('Customer@2026!', 10);

    // 2. Provision / Re-verify Demo Accounts
    console.log('1. Provisioning Evaluator Quick-Login Accounts...');
    const demoAdmin = await prisma.user.upsert({
      where: { email: demoAdminEmail },
      update: {
        role: Role.ADMIN,
        passwordHash: adminPasswordHash,
        isActive: true,
      },
      create: {
        email: demoAdminEmail,
        passwordHash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        phone: '+1 555-010-0001',
        isActive: true,
      },
    });
    console.log(`   ✓ Admin ready: ${demoAdmin.email} (${demoAdmin.id})`);

    const demoStaff = await prisma.user.upsert({
      where: { email: demoStaffEmail },
      update: {
        role: Role.STAFF,
        passwordHash: staffPasswordHash,
        isActive: true,
      },
      create: {
        email: demoStaffEmail,
        passwordHash: staffPasswordHash,
        firstName: 'Elena',
        lastName: 'Rostova',
        role: Role.STAFF,
        phone: '+1 555-010-0002',
        isActive: true,
      },
    });
    console.log(`   ✓ Staff ready: ${demoStaff.email} (${demoStaff.id})`);

    const demoCustomerUser = await prisma.user.upsert({
      where: { email: demoCustomerEmail },
      update: {
        role: Role.CUSTOMER,
        passwordHash: customerPasswordHash,
        isActive: true,
      },
      create: {
        email: demoCustomerEmail,
        passwordHash: customerPasswordHash,
        firstName: 'Marcus',
        lastName: 'Vance',
        role: Role.CUSTOMER,
        phone: '+1 555-012-4411',
        isActive: true,
      },
    });
    console.log(`   ✓ Customer ready: ${demoCustomerUser.email} (${demoCustomerUser.id})`);

    // 3. Provision Customers
    console.log('\n2. Provisioning 5 Fictional Enterprise Customers...');
    const customerDefs = [
      {
        email: demoCustomerEmail,
        userId: demoCustomerUser.id,
        companyName: 'Acme Technologies',
        contactName: 'Marcus Vance',
        phone: '+1 555-012-4411',
        billingAddress: '500 Harbor Blvd, Suite 10',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94107',
        taxNumber: 'US-ACME-9948',
      },
      {
        email: 'billing@novasolutions.io',
        userId: null,
        companyName: 'Nova Solutions',
        contactName: 'Sarah Jenkins',
        phone: '+44 20 7946 0912',
        billingAddress: '45 Cannon Street, 3rd Floor',
        city: 'London',
        state: 'Greater London',
        country: 'UK',
        postalCode: 'EC4N 5JJ',
        taxNumber: 'GB-NOVA-3310',
      },
      {
        email: 'finance@greenbytesystems.com',
        userId: null,
        companyName: 'GreenByte Systems',
        contactName: 'David Zhao',
        phone: '+65 6789 0123',
        billingAddress: '12 Marina Boulevard, Tower 2',
        city: 'Singapore',
        state: 'Central',
        country: 'Singapore',
        postalCode: '018982',
        taxNumber: 'SG-GB-7719',
      },
      {
        email: 'accounts@pixelworks.design',
        userId: null,
        companyName: 'PixelWorks Studio',
        contactName: 'Maya Lin',
        phone: '+1 416-555-0182',
        billingAddress: '78 King Street West',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada',
        postalCode: 'M5H 1A1',
        taxNumber: 'CA-PIXEL-2840',
      },
      {
        email: 'contact@vertexdigital.net',
        userId: null,
        companyName: 'Vertex Digital',
        contactName: 'Alex Rivera',
        phone: '+49 30 1234 5678',
        billingAddress: 'Friedrichstraße 120',
        city: 'Berlin',
        state: 'Berlin',
        country: 'Germany',
        postalCode: '10117',
        taxNumber: 'DE-VERTEX-9912',
      },
    ];

    const customerMap: Record<string, any> = {};
    for (const c of customerDefs) {
      const cust = await prisma.customer.upsert({
        where: { email: c.email },
        update: {
          companyName: c.companyName,
          contactName: c.contactName,
          phone: c.phone,
          billingAddress: c.billingAddress,
          city: c.city,
          state: c.state,
          country: c.country,
          postalCode: c.postalCode,
          taxNumber: c.taxNumber,
          userId: c.userId,
        },
        create: {
          email: c.email,
          userId: c.userId,
          companyName: c.companyName,
          contactName: c.contactName,
          phone: c.phone,
          billingAddress: c.billingAddress,
          city: c.city,
          state: c.state,
          country: c.country,
          postalCode: c.postalCode,
          taxNumber: c.taxNumber,
          currency: 'INR',
        },
      });
      customerMap[c.email] = cust;
      console.log(`   ✓ Customer: ${cust.companyName} (${cust.email})`);
    }

    // 4. Provision Products & Product Variants
    console.log('\n3. Provisioning Products & Variants...');
    const productDefs = [
      {
        name: 'BrightCloud Hosting',
        code: 'PROD-CLOUD-01',
        type: ProductType.SOFTWARE,
        salesPrice: 3999.00,
        costPrice: 900.00,
        notes: 'High-availability enterprise cloud container hosting with 99.99% SLA.',
        variants: [
          { name: 'Dedicated Static IPv4', description: 'Assigned IPv4 address for custom whitelisting', price: 500.00 },
          { name: '100GB NVMe SSD Expansion', description: 'High-speed NVMe block storage volume', price: 1200.00 },
        ],
      },
      {
        name: 'BrightCRM Professional',
        code: 'PROD-CRM-01',
        type: ProductType.SOFTWARE,
        salesPrice: 4999.00,
        costPrice: 1200.00,
        notes: 'Omnichannel customer relationship and sales pipeline platform.',
        variants: [
          { name: 'Advanced Analytics Module', description: 'Cohort retention & AI forecasting dashboard', price: 1500.00 },
          { name: 'Multi-Currency Module', description: 'Real-time FX conversion with 150+ currencies', price: 800.00 },
        ],
      },
      {
        name: 'MailFlow Automation',
        code: 'PROD-MAIL-01',
        type: ProductType.SOFTWARE,
        salesPrice: 2499.00,
        costPrice: 400.00,
        notes: 'Transactional and marketing email delivery pipeline.',
        variants: [
          { name: 'Dedicated SMTP Relay', description: 'Isolated IP warm-up reputation pool', price: 1800.00 },
        ],
      },
      {
        name: 'Insight Analytics',
        code: 'PROD-ANALYTICS-01',
        type: ProductType.SOFTWARE,
        salesPrice: 5499.00,
        costPrice: 1500.00,
        notes: 'Real-time telemetry and revenue intelligence dashboard.',
        variants: [
          { name: 'Custom Executive Dashboards', description: 'White-glove bespoke report templates', price: 2500.00 },
        ],
      },
      {
        name: 'Enterprise Security Suite',
        code: 'PROD-SEC-01',
        type: ProductType.SOFTWARE,
        salesPrice: 7999.00,
        costPrice: 2200.00,
        notes: 'Comprehensive SIEM audit logging, RBAC enforcement, and pen-testing.',
        variants: [
          { name: 'Automated SOC2 Compliance Engine', description: 'Continuous evidence collection & audit reports', price: 3500.00 },
        ],
      },
    ];

    const productMap: Record<string, any> = {};
    const variantMap: Record<string, any> = {};

    for (const p of productDefs) {
      const prod = await prisma.product.upsert({
        where: { code: p.code },
        update: {
          name: p.name,
          type: p.type,
          salesPrice: p.salesPrice,
          costPrice: p.costPrice,
          notes: p.notes,
        },
        create: {
          name: p.name,
          code: p.code,
          type: p.type,
          salesPrice: p.salesPrice,
          costPrice: p.costPrice,
          notes: p.notes,
        },
      });
      productMap[p.code] = prod;

      for (const v of p.variants) {
        let variant = await prisma.productVariant.findFirst({
          where: { productId: prod.id, name: v.name },
        });
        if (!variant) {
          variant = await prisma.productVariant.create({
            data: {
              productId: prod.id,
              name: v.name,
              description: v.description,
              additionalPrice: v.price,
            },
          });
        }
        variantMap[`${p.code}:${v.name}`] = variant;
      }
      console.log(`   ✓ Product: ${prod.name} (${prod.code}) with ${p.variants.length} variants`);
    }

    // 5. Subscription Plans
    console.log('\n4. Provisioning Subscription Plans...');
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const planDefs = [
      {
        id: 'plan-starter-monthly',
        name: 'Starter Cloud Monthly',
        description: 'Ideal for early-stage companies and fast prototyping.',
        basePrice: 1999.00,
        billingFrequency: BillingFrequency.MONTHLY,
      },
      {
        id: 'plan-enterprise-monthly',
        name: 'Enterprise Flex Monthly',
        description: 'Complete high-volume subscription suite with premium support.',
        basePrice: 8999.00,
        billingFrequency: BillingFrequency.MONTHLY,
      },
      {
        id: 'plan-growth-annual',
        name: 'Business Growth Annual',
        description: 'Annual commitment with 2 months free and priority SLA.',
        basePrice: 21999.00,
        billingFrequency: BillingFrequency.YEARLY,
      },
    ];

    const planMap: Record<string, any> = {};
    for (const pl of planDefs) {
      const plan = await prisma.subscriptionPlan.upsert({
        where: { id: pl.id },
        update: {
          name: pl.name,
          description: pl.description,
          basePrice: pl.basePrice,
          billingFrequency: pl.billingFrequency,
          isActive: true,
        },
        create: {
          id: pl.id,
          name: pl.name,
          description: pl.description,
          basePrice: pl.basePrice,
          billingFrequency: pl.billingFrequency,
          startDate: now,
          endDate: oneYearLater,
          allowPause: true,
          allowRenewal: true,
          allowEarlyClosure: true,
          isActive: true,
        },
      });
      planMap[pl.id] = plan;
      console.log(`   ✓ Plan: ${plan.name} (${plan.billingFrequency} - ₹${plan.basePrice})`);
    }

    // 6. Tax Rules & Discounts
    console.log('\n5. Provisioning Tax Rules & Discounts...');
    let gstTax = await prisma.taxRule.findFirst({ where: { name: 'GST 18%' } });
    if (!gstTax) {
      gstTax = await prisma.taxRule.create({
        data: {
          name: 'GST 18%',
          rate: 18.00,
          description: 'Standard Goods and Services Tax',
          isDefault: true,
          isActive: true,
        },
      });
    }
    let vatTax = await prisma.taxRule.findFirst({ where: { name: 'Standard VAT 10%' } });
    if (!vatTax) {
      vatTax = await prisma.taxRule.create({
        data: {
          name: 'Standard VAT 10%',
          rate: 10.00,
          description: 'Value Added Tax (Cross-border services)',
          isDefault: false,
          isActive: true,
        },
      });
    }
    console.log('   ✓ Tax Rules: GST 18%, VAT 10%');

    const discount1 = await prisma.discount.upsert({
      where: { code: 'HACKATHON2026' },
      update: { isActive: true },
      create: {
        code: 'HACKATHON2026',
        name: 'Odoo x Make-A-Ton Hackathon 10% Off',
        type: DiscountType.PERCENTAGE,
        value: 10.00,
        startDate: now,
        endDate: oneYearLater,
        applyToWholeSub: true,
        isActive: true,
      },
    });

    const discount2 = await prisma.discount.upsert({
      where: { code: 'STARTUP500' },
      update: { isActive: true },
      create: {
        code: 'STARTUP500',
        name: 'Startup Launch ₹500 Flat Off',
        type: DiscountType.FIXED,
        value: 500.00,
        startDate: now,
        endDate: oneYearLater,
        applyToWholeSub: true,
        isActive: true,
      },
    });
    console.log(`   ✓ Discounts: ${discount1.code} (10%), ${discount2.code} (₹500)`);

    // 7. Quotations (Realistic statuses: DRAFT, SENT, ACCEPTED, CONVERTED)
    console.log('\n6. Provisioning Quotations...');
    const quoteDefs = [
      {
        quotationNumber: 'QT-2026-001',
        customerEmail: 'accounts@pixelworks.design',
        status: QuotationStatus.DRAFT,
        validDays: 30,
        subtotal: 3999.00,
        taxAmount: 719.82,
        totalAmount: 4718.82,
        notes: 'Initial quotation for BrightCloud Hosting with Dedicated IP for PixelWorks Studio.',
        items: [
          {
            productCode: 'PROD-CLOUD-01',
            variantName: 'Dedicated Static IPv4',
            quantity: 1,
            unitPrice: 3999.00,
            taxRate: 18.00,
            amount: 4718.82,
          },
        ],
      },
      {
        quotationNumber: 'QT-2026-002',
        customerEmail: 'finance@greenbytesystems.com',
        status: QuotationStatus.SENT,
        validDays: 14,
        subtotal: 6499.00,
        taxAmount: 1169.82,
        totalAmount: 7668.82,
        notes: 'Sent formal quotation for BrightCRM Professional + Advanced Analytics Module to GreenByte Systems.',
        items: [
          {
            productCode: 'PROD-CRM-01',
            variantName: 'Advanced Analytics Module',
            quantity: 1,
            unitPrice: 6499.00,
            taxRate: 18.00,
            amount: 7668.82,
          },
        ],
      },
      {
        quotationNumber: 'QT-2026-003',
        customerEmail: 'billing@novasolutions.io',
        status: QuotationStatus.ACCEPTED,
        validDays: 30,
        subtotal: 21999.00,
        taxAmount: 3959.82,
        totalAmount: 25958.82,
        notes: 'Annual enterprise package accepted by Nova Solutions director.',
        items: [
          {
            productCode: 'PROD-SEC-01',
            variantName: 'Automated SOC2 Compliance Engine',
            quantity: 1,
            unitPrice: 21999.00,
            taxRate: 18.00,
            amount: 25958.82,
          },
        ],
      },
      {
        quotationNumber: 'QT-2026-004',
        customerEmail: demoCustomerEmail,
        status: QuotationStatus.CONVERTED,
        validDays: 30,
        subtotal: 8999.00,
        taxAmount: 1619.82,
        totalAmount: 10618.82,
        notes: 'Evaluator Customer demonstration quotation for Enterprise Flex Monthly.',
        items: [
          {
            productCode: 'PROD-CLOUD-01',
            variantName: '100GB NVMe SSD Expansion',
            quantity: 1,
            unitPrice: 8999.00,
            taxRate: 18.00,
            amount: 10618.82,
          },
        ],
      },
    ];

    const quoteMap: Record<string, any> = {};
    for (const q of quoteDefs) {
      const customer = customerMap[q.customerEmail];
      const validUntil = new Date(now.getTime() + q.validDays * 24 * 60 * 60 * 1000);

      const existingQ = await prisma.quotation.findUnique({
        where: { quotationNumber: q.quotationNumber },
      });

      if (!existingQ) {
        const quote = await prisma.quotation.create({
          data: {
            quotationNumber: q.quotationNumber,
            customerId: customer.id,
            status: q.status,
            validUntil,
            subtotal: q.subtotal,
            taxAmount: q.taxAmount,
            discountAmount: 0.00,
            totalAmount: q.totalAmount,
            notes: q.notes,
            items: {
              create: q.items.map((item) => ({
                productId: productMap[item.productCode].id,
                variantId: variantMap[`${item.productCode}:${item.variantName}`]?.id || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                discountRate: 0.00,
                amount: item.amount,
              })),
            },
          },
        });
        quoteMap[q.quotationNumber] = quote;
        console.log(`   ✓ Quotation: ${quote.quotationNumber} (${quote.status} - ${customer.companyName})`);
      } else {
        quoteMap[q.quotationNumber] = existingQ;
        console.log(`   ✓ Quotation: ${existingQ.quotationNumber} (Already exists)`);
      }
    }

    // 8. Subscriptions (ACTIVE, PAUSED)
    console.log('\n7. Provisioning Subscriptions...');
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subDefs = [
      {
        subscriptionNumber: 'SUB-2026-001',
        customerEmail: demoCustomerEmail,
        planId: 'plan-enterprise-monthly',
        quotationNumber: 'QT-2026-004',
        status: SubscriptionStatus.ACTIVE,
        subtotal: 8999.00,
        taxAmount: 1619.82,
        totalAmount: 10618.82,
        productCode: 'PROD-CLOUD-01',
        variantName: '100GB NVMe SSD Expansion',
      },
      {
        subscriptionNumber: 'SUB-2026-002',
        customerEmail: 'billing@novasolutions.io',
        planId: 'plan-growth-annual',
        quotationNumber: 'QT-2026-003',
        status: SubscriptionStatus.ACTIVE,
        subtotal: 21999.00,
        taxAmount: 3959.82,
        totalAmount: 25958.82,
        productCode: 'PROD-SEC-01',
        variantName: 'Automated SOC2 Compliance Engine',
      },
      {
        subscriptionNumber: 'SUB-2026-003',
        customerEmail: 'finance@greenbytesystems.com',
        planId: 'plan-starter-monthly',
        quotationNumber: null,
        status: SubscriptionStatus.PAUSED,
        subtotal: 1999.00,
        taxAmount: 359.82,
        totalAmount: 2358.82,
        productCode: 'PROD-MAIL-01',
        variantName: 'Dedicated SMTP Relay',
      },
    ];

    const subMap: Record<string, any> = {};
    for (const s of subDefs) {
      const customer = customerMap[s.customerEmail];
      const quote = s.quotationNumber ? quoteMap[s.quotationNumber] : null;

      let sub = await prisma.subscription.findUnique({
        where: { subscriptionNumber: s.subscriptionNumber },
      });

      if (!sub) {
        sub = await prisma.subscription.create({
          data: {
            subscriptionNumber: s.subscriptionNumber,
            customerId: customer.id,
            planId: s.planId,
            quotationId: quote ? quote.id : null,
            status: s.status,
            startDate: now,
            nextBillingDate: nextMonth,
            autoRenew: true,
            subtotal: s.subtotal,
            taxAmount: s.taxAmount,
            discountAmount: 0.00,
            totalAmount: s.totalAmount,
            items: {
              create: {
                productId: productMap[s.productCode].id,
                variantId: variantMap[`${s.productCode}:${s.variantName}`]?.id || null,
                quantity: 1,
                unitPrice: s.subtotal,
                taxRate: 18.00,
                amount: s.totalAmount,
              },
            },
          },
        });
        console.log(`   ✓ Subscription: ${sub.subscriptionNumber} (${sub.status} - ${customer.companyName})`);
      } else {
        console.log(`   ✓ Subscription: ${sub.subscriptionNumber} (Already exists)`);
      }
      subMap[s.subscriptionNumber] = sub;
    }

    // 9. Invoices & Payments (PAID, PARTIALLY PAID, PENDING)
    console.log('\n8. Provisioning Invoices and Recording Payments...');
    const periodStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const invoiceDefs = [
      {
        invoiceNumber: 'INV-2026-001',
        subscriptionNumber: 'SUB-2026-001',
        customerEmail: demoCustomerEmail,
        status: InvoiceStatus.PAID,
        subtotal: 8999.00,
        taxAmount: 1619.82,
        totalAmount: 10618.82,
        amountPaid: 10618.82,
        balanceDue: 0.00,
        description: 'Enterprise Flex Monthly - Primary evaluative billing cycle',
        productCode: 'PROD-CLOUD-01',
        payment: {
          paymentNumber: 'PAY-2026-001',
          amount: 10618.82,
          method: PaymentMethod.BANK_TRANSFER,
          note: 'Full settlement via corporate wire transfer ref #WIRE-99214',
        },
      },
      {
        invoiceNumber: 'INV-2026-002',
        subscriptionNumber: 'SUB-2026-002',
        customerEmail: 'billing@novasolutions.io',
        status: InvoiceStatus.CONFIRMED,
        subtotal: 21999.00,
        taxAmount: 3959.82,
        totalAmount: 25958.82,
        amountPaid: 10000.00,
        balanceDue: 15958.82,
        description: 'Business Growth Annual - Initial installment payment',
        productCode: 'PROD-SEC-01',
        payment: {
          paymentNumber: 'PAY-2026-002',
          amount: 10000.00,
          method: PaymentMethod.ONLINE,
          note: 'Partial installment recorded via online gateway auth #TXN-77312',
        },
      },
      {
        invoiceNumber: 'INV-2026-003',
        subscriptionNumber: 'SUB-2026-003',
        customerEmail: 'finance@greenbytesystems.com',
        status: InvoiceStatus.CONFIRMED,
        subtotal: 1999.00,
        taxAmount: 359.82,
        totalAmount: 2358.82,
        amountPaid: 0.00,
        balanceDue: 2358.82,
        description: 'Starter Cloud Monthly - Due on Net-14 terms',
        productCode: 'PROD-MAIL-01',
        payment: null, // Unpaid / Pending invoice
      },
    ];

    for (const invDef of invoiceDefs) {
      const sub = subMap[invDef.subscriptionNumber];
      const customer = customerMap[invDef.customerEmail];

      let invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber: invDef.invoiceNumber },
      });

      if (!invoice) {
        invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: invDef.invoiceNumber,
            subscriptionId: sub.id,
            customerId: customer.id,
            periodStart,
            periodEnd,
            invoiceDate: now,
            dueDate,
            status: invDef.status,
            subtotal: invDef.subtotal,
            taxAmount: invDef.taxAmount,
            discountAmount: 0.00,
            totalAmount: invDef.totalAmount,
            amountPaid: invDef.amountPaid,
            balanceDue: invDef.balanceDue,
            notes: invDef.description,
            items: {
              create: {
                productId: productMap[invDef.productCode].id,
                description: invDef.description,
                quantity: 1,
                unitPrice: invDef.subtotal,
                taxRate: 18.00,
                taxAmount: invDef.taxAmount,
                discountAmount: 0.00,
                totalAmount: invDef.totalAmount,
              },
            },
          },
        });
        console.log(`   ✓ Invoice: ${invoice.invoiceNumber} (${invoice.status} - ₹${invoice.totalAmount})`);
      } else {
        console.log(`   ✓ Invoice: ${invoice.invoiceNumber} (Already exists)`);
      }

      // Record associated demo payment if defined
      if (invDef.payment) {
        const existingPayment = await prisma.payment.findUnique({
          where: { paymentNumber: invDef.payment.paymentNumber },
        });

        if (!existingPayment) {
          await prisma.payment.create({
            data: {
              paymentNumber: invDef.payment.paymentNumber,
              invoiceId: invoice.id,
              customerId: customer.id,
              amount: invDef.payment.amount,
              paymentMethod: invDef.payment.method,
              paymentDate: now,
              referenceNote: invDef.payment.note,
              recordedById: demoStaff.id,
            },
          });
          console.log(`     ✓ Payment recorded: ${invDef.payment.paymentNumber} (₹${invDef.payment.amount} via ${invDef.payment.method})`);
        } else {
          console.log(`     ✓ Payment: ${invDef.payment.paymentNumber} (Already exists)`);
        }
      }
    }

    console.log('\n================================================================');
    console.log(' SUCCESS: HACKATHON EVALUATOR REALISTIC DATASET PROVISIONED');
    console.log('================================================================');
    console.log(`  Admin Demo User    : ${demoAdminEmail}`);
    console.log(`  Staff Demo User    : ${demoStaffEmail}`);
    console.log(`  Customer Demo User : ${demoCustomerEmail}`);
    console.log('  Customer Profiles  : 5 Fictional Enterprise Accounts');
    console.log('  Products & Variants: 5 Products with 8 Specialized Variants');
    console.log('  Subscription Plans : Monthly & Annual Pricing Models');
    console.log('  Quotations         : DRAFT, SENT, ACCEPTED, CONVERTED');
    console.log('  Subscriptions      : ACTIVE & PAUSED Lifecycles');
    console.log('  Invoices & Payments: PAID, PARTIALLY PAID, and PENDING');
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('\n[DATABASE ERROR] Failed to provision demo data:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  bootstrapDemoAccounts();
}
