export interface Invoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  status_label: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal_amount: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  notes: string | null;
  terms: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  order: InvoiceOrder | null;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface InvoiceOrder {
  id: string;
  reference: string;
  status: string;
  created_at: string;
  user: InvoiceUser | null;
  items: InvoiceOrderItem[];
  payments: InvoicePayment[];
}

export interface InvoiceUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  business_website: string | null;
  gst_number: string | null;
  pan_number: string | null;
  registration_number: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  };
}

export interface InvoiceOrderItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  configuration: any;
  product: {
    id: string;
    name: string;
    sku: string;
    media: Array<{ url: string }>;
  } | null;
}

export interface InvoicePayment {
  id: string;
  status: string;
  amount: string;
  created_at: string;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  status_label: string;
  total_amount: string;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  created_at: string;
  order_reference?: string;
  customer_name?: string;
  order?: {
    id: string;
    reference: string;
    user: {
      name: string;
      email: string;
    } | null;
  } | null;
}

export interface InvoiceListResponse {
  items: InvoiceListItem[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

