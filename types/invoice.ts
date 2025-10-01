export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "standard" | "proforma" | "timesheet" | "recurring" | "credit_note";
  clientId: string;
  client?: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate?: Date;
  issueDate: Date;
  notes?: string;
  paymentTerms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetEntry {
  id: string;
  date: Date;
  description: string;
  hours: number;
  hourlyRate: number;
  total: number;
}

export interface RecurringInvoiceSettings {
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  nextDueDate: Date;
  endDate?: Date;
  isActive: boolean;
}