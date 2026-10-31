export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string | null;
  customerId?: string | null;
  companyName?: string | null;
}

export type ProductType = 'SOFTWARE' | 'SERVICE' | 'HARDWARE' | 'ADDON';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  description?: string | null;
  additionalPrice: number | string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  type: ProductType;
  salesPrice: number | string;
  costPrice: number | string;
  notes?: string | null;
  isArchived: boolean;
  variants: ProductVariant[];
  createdAt: string;
}

export type BillingFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number | string;
  billingFrequency: BillingFrequency;
  minQuantity: number;
  startDate: string;
  endDate?: string | null;
  autoClose: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  isActive: boolean;
}

export interface Customer {
  id: string;
  userId?: string | null;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  currency: string;
  notes?: string | null;
  createdAt: string;
  financialSummary?: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  subscriptions?: Subscription[];
  invoices?: Invoice[];
  quotations?: Quotation[];
  payments?: Payment[];
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  variantId?: string | null;
  planId?: string | null;
  quantity: number;
  unitPrice: number | string;
  taxRate: number | string;
  discountRate: number | string;
  amount: number | string;
  product?: Product;
  variant?: ProductVariant | null;
  plan?: SubscriptionPlan | null;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  templateId?: string | null;
  status: QuotationStatus;
  validUntil: string;
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  notes?: string | null;
  createdAt: string;
  customer: Customer;
  items: QuotationItem[];
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description?: string | null;
  validityDays: number;
  itemsJson: any;
  isActive: boolean;
}

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number | string;
  taxRate: number | string;
  amount: number | string;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  quotationId?: string | null;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate?: string | null;
  nextBillingDate: string;
  paymentTerms: string;
  autoClose: boolean;
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  createdAt: string;
  customer: Customer;
  plan: SubscriptionPlan;
  items?: SubscriptionItem[];
  invoices?: Invoice[];
}

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  variantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  notes?: string | null;
  isOverdue?: boolean;
  isPartiallyPaid?: boolean;
  customer: Customer;
  subscription: {
    id: string;
    subscriptionNumber: string;
    plan?: SubscriptionPlan;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'ONLINE';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number | string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNote?: string | null;
  customer?: Customer;
  invoice?: Invoice;
  recordedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface TaxRule {
  id: string;
  name: string;
  rate: number | string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export type DiscountType = 'FIXED' | 'PERCENTAGE';

export interface Discount {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  value: number | string;
  minPurchaseAmount?: number | string | null;
  minQuantity?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  timesUsed: number;
  productId?: string | null;
  applyToWholeSub: boolean;
  isActive: boolean;
  product?: { id: string; name: string; code: string } | null;
}

export interface BusinessSettings {
  id: string;
  companyName: string;
  currency: string;
  currencySymbol: string;
  taxNumber?: string | null;
  contactEmail: string;
  contactPhone: string;
  address: string;
  invoicePrefix: string;
  quotationPrefix: string;
  subPrefix: string;
}
