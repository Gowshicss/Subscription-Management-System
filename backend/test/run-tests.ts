import { prisma } from '../src/lib/prisma';
import { authService, validatePasswordStrength } from '../src/services/auth.service';
import { productService } from '../src/services/product.service';
import { planService } from '../src/services/plan.service';
import { quotationService } from '../src/services/quotation.service';
import { subscriptionService } from '../src/services/subscription.service';
import { billingService } from '../src/services/billing.service';
import { paymentService } from '../src/services/payment.service';
import { Role, BillingFrequency, PaymentMethod, SubscriptionStatus, InvoiceStatus } from '@prisma/client';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION & QA TEST SUITE');
  console.log('====================================================\n');

  // --- SUITE 1: AUTHENTICATION & PASSWORD POLICIES ---
  console.log('📦 Suite 1: Authentication & Password Complexity Rules');
  const shortPass = validatePasswordStrength('Short1!');
  assert(!shortPass.valid, 'Rejects password <= 8 characters ("Short1!")');

  const noUpper = validatePasswordStrength('lowercaseonly123!');
  assert(!noUpper.valid, 'Rejects password without uppercase letter');

  const noSpecial = validatePasswordStrength('NoSpecialChar1234');
  assert(!noSpecial.valid, 'Rejects password without special symbol');

  const validPass = validatePasswordStrength('ValidCorporatePassword@2026');
  assert(validPass.valid, 'Accepts valid password meeting all 4 criteria');

  // Test Customer Registration
  const testEmail = `test.client.${Date.now()}@example.com`;
  const regResult = await authService.registerCustomer({
    email: testEmail,
    password: 'ValidCorporatePassword@2026',
    firstName: 'Alice',
    lastName: 'Vanderbilt',
    companyName: 'Vanderbilt Logistics',
    phone: '+1 555-888-0011',
    billingAddress: '500 Harbor Blvd, Suite 10',
  });
  assert(!!regResult.token, 'Customer registration succeeds and returns JWT token');
  assert(regResult.user.role === Role.CUSTOMER, 'Registered user is assigned CUSTOMER role');

  // Test Duplicate Email Rejection
  let duplicateRejected = false;
  try {
    await authService.registerCustomer({
      email: testEmail,
      password: 'ValidCorporatePassword@2026',
      firstName: 'Alice',
      lastName: 'Vanderbilt',
      companyName: 'Vanderbilt Logistics',
      phone: '+1 555-888-0011',
      billingAddress: '500 Harbor Blvd, Suite 10',
    });
  } catch (err: any) {
    duplicateRejected = err.code === 'EMAIL_EXISTS';
  }
  assert(duplicateRejected, 'Duplicate registration with same email is strictly rejected');

  // Test Login
  const loginResult = await authService.login({
    email: testEmail,
    password: 'ValidCorporatePassword@2026',
  });
  assert(!!loginResult.token && loginResult.user.email === testEmail, 'Customer login verifies credentials and yields valid session');

  // --- SUITE 2: PRODUCTS, VARIANTS & DYNAMIC PRICING ---
  console.log('\n📦 Suite 2: Product & Variant Catalog');
  const productCode = `TEST-PRD-${Date.now().toString().slice(-4)}`;
  const product = await productService.createProduct({
    name: 'Enterprise Cloud Backup',
    code: productCode,
    salesPrice: 150.00,
    costPrice: 40.00,
    variants: [
      { name: 'Odoo Dedicated Connector', additionalPrice: 560.00 },
      { name: 'Standard S3 Storage', additionalPrice: 0.00 },
    ],
  });
  assert(product.variants.length === 2, 'Creates product with multiple variants');
  const odooVariant = product.variants.find((v) => v.name.includes('Odoo'));
  assert(Number(odooVariant?.additionalPrice) === 560.00, 'Calculates variant additional price (+560.00) correctly');

  // --- SUITE 3: SUBSCRIPTION PLANS & POLICY VALIDATIONS ---
  console.log('\n📦 Suite 3: Subscription Plans');
  let invalidDateRejected = false;
  try {
    await planService.createPlan({
      name: 'Invalid Date Plan',
      basePrice: 50,
      billingFrequency: BillingFrequency.MONTHLY,
      startDate: new Date(),
      endDate: new Date(Date.now() - 100000), // In the past!
    });
  } catch (err: any) {
    invalidDateRejected = err.code === 'INVALID_DATES';
  }
  assert(invalidDateRejected, 'Rejects plan where endDate <= startDate');

  const validPlan = await planService.createPlan({
    name: 'Pro Tier Flex',
    basePrice: 150.00,
    billingFrequency: BillingFrequency.MONTHLY,
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    allowPause: true,
    allowRenewal: true,
    allowEarlyClosure: true,
  });
  assert(validPlan.allowPause === true && validPlan.allowRenewal === true, 'Saves plan policy flags for pause and renewal permissions');

  // --- SUITE 4: QUOTATION & AUTOMATIC SUBSCRIPTION CONVERSION ---
  console.log('\n📦 Suite 4: Quotations & Idempotent Subscription Conversion');
  const quote = await quotationService.createQuotation({
    customerId: regResult.user.customerId!,
    planId: validPlan.id,
    items: [
      {
        productId: product.id,
        variantId: odooVariant!.id,
        quantity: 2, // 2 * (150 + 560) = 2 * 710 = 1420
        taxRate: 10.0,
      },
    ],
  });
  assert(Number(quote.subtotal) === 1420.00, `Calculates line items with variant price: expected $1420, got $${quote.subtotal}`);
  assert(Number(quote.discountAmount) === 50.00, `Automatically detects and applies eligible discount ($50 off): got $${quote.discountAmount}`);
  assert(Number(quote.totalAmount) === 1512.00, `Calculates total with discount ($50) and tax (10% = $142): expected $1512, got $${quote.totalAmount}`);

  // Send quotation
  await quotationService.sendQuotation(quote.id);

  // Customer accepts quotation
  const convertedSub = await quotationService.acceptAndConvertToSubscription(quote.id, regResult.user.customerId!);
  assert(convertedSub.status === SubscriptionStatus.ACTIVE, 'Accepted quotation automatically converts to an ACTIVE subscription');
  assert(convertedSub.quotationId === quote.id, 'Subscription maintains foreign key reference to source quotation');

  // Test Duplicate Conversion Prevention
  let duplicateConversionPrevented = false;
  try {
    await quotationService.acceptAndConvertToSubscription(quote.id, regResult.user.customerId!);
  } catch (err: any) {
    duplicateConversionPrevented = err.code === 'ALREADY_CONVERTED';
  }
  assert(duplicateConversionPrevented, 'Prevents duplicate conversion of an already accepted quotation');

  // --- SUITE 5: SUBSCRIPTION LIFECYCLE & PAUSE/RESUME ---
  console.log('\n📦 Suite 5: Subscription Lifecycle & Permissions');
  const pausedSub = await subscriptionService.pauseSubscription(convertedSub.id, Role.CUSTOMER, regResult.user.customerId!);
  assert(pausedSub.status === SubscriptionStatus.PAUSED, 'Customer pauses subscription successfully when permitted by plan');

  const resumedSub = await subscriptionService.resumeSubscription(convertedSub.id, Role.CUSTOMER, regResult.user.customerId!);
  assert(resumedSub.status === SubscriptionStatus.ACTIVE, 'Customer resumes paused subscription back to ACTIVE');

  // --- SUITE 6: RECURRING BILLING ENGINE & IDEMPOTENCY ---
  console.log('\n📦 Suite 6: Recurring Billing Engine & Safeguards');
  // Set nextBillingDate to now so it qualifies for billing
  await prisma.subscription.update({
    where: { id: convertedSub.id },
    data: { nextBillingDate: new Date(Date.now() - 1000) },
  });

  const billingRun1 = await billingService.runBillingCycle('ADMIN_MANUAL');
  assert(billingRun1.invoicesGenerated >= 1, `Billing engine generates invoice for due subscription (generated: ${billingRun1.invoicesGenerated})`);

  // Run billing cycle AGAIN immediately -> MUST PREVENT DUPLICATES!
  const billingRun2 = await billingService.runBillingCycle('ADMIN_MANUAL');
  assert(billingRun2.invoicesGenerated === 0, 'Idempotency safeguard: Running billing cycle again generates ZERO duplicate invoices');

  // --- SUITE 7: PAYMENTS, PARTIAL PAYMENTS & OVERPAYMENT REJECTION ---
  console.log('\n📦 Suite 7: Payments & Ledger Balance');
  const generatedInvoice = await prisma.invoice.findFirst({
    where: { subscriptionId: convertedSub.id },
  });
  assert(!!generatedInvoice, 'Retrieved generated invoice from billing engine');

  const invoiceTotal = Number(generatedInvoice!.totalAmount);
  const partialAmount = Math.floor(invoiceTotal / 2);

  // Record partial payment
  const partialPayment = await paymentService.recordPayment({
    invoiceId: generatedInvoice!.id,
    amount: partialAmount,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    referenceNote: 'Installment 1 of 2',
  });
  assert(Number(partialPayment.invoice.amountPaid) === partialAmount, `Records partial payment of $${partialAmount}`);
  assert(Number(partialPayment.invoice.balanceDue) === invoiceTotal - partialAmount, `Updates balanceDue accurately to $${invoiceTotal - partialAmount}`);
  assert(partialPayment.invoice.status === InvoiceStatus.CONFIRMED, 'Invoice status remains CONFIRMED while balance is outstanding');

  // Test Overpayment Rejection
  let overpaymentRejected = false;
  try {
    await paymentService.recordPayment({
      invoiceId: generatedInvoice!.id,
      amount: invoiceTotal * 2, // Way more than remaining balance!
      paymentMethod: PaymentMethod.CREDIT_CARD,
    });
  } catch (err: any) {
    overpaymentRejected = err.code === 'OVERPAYMENT_REJECTED';
  }
  assert(overpaymentRejected, 'Strictly rejects payment exceeding outstanding balance');

  // Settle remaining balance
  const remainingBalance = Number(partialPayment.invoice.balanceDue);
  const finalPayment = await paymentService.recordPayment({
    invoiceId: generatedInvoice!.id,
    amount: remainingBalance,
    paymentMethod: PaymentMethod.ONLINE,
  });
  assert(Number(finalPayment.invoice.balanceDue) === 0, 'Remaining balance reaches exactly $0.00 upon final settlement');
  assert(finalPayment.invoice.status === InvoiceStatus.PAID, 'Invoice status updates to PAID upon complete settlement');

  // --- SUITE 8: SECURITY & ACCESS CONTROL ---
  console.log('\n📦 Suite 8: Role-Based Authorization & Data Isolation');
  let customerIsolationPassed = false;
  try {
    // Attempt to access another customer's quotation
    await quotationService.getQuotationById(quote.id, Role.CUSTOMER, 'different-customer-uuid');
  } catch (err: any) {
    customerIsolationPassed = err.code === 'FORBIDDEN';
  }
  assert(customerIsolationPassed, 'Customer cannot access or view another customer quotation records');

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error('Fatal test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
