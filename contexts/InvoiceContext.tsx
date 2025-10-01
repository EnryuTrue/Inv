import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";

import type { Invoice, InvoiceItem } from "@/types/invoice";

const INVOICES_STORAGE_KEY = "invoice_invoices";

export const [InvoiceProvider, useInvoices] = createContextHook(() => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const queryClient = useQueryClient();

  // Load invoices from storage
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: async (): Promise<Invoice[]> => {
      try {
        const stored = await AsyncStorage.getItem(INVOICES_STORAGE_KEY);
        if (stored) {
          const parsedInvoices = JSON.parse(stored);
          // Convert date strings back to Date objects
          return parsedInvoices.map((invoice: any) => ({
            ...invoice,
            issueDate: new Date(invoice.issueDate),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
            createdAt: new Date(invoice.createdAt),
            updatedAt: new Date(invoice.updatedAt),
          }));
        }
        return [];
      } catch (error) {
        console.error("Error loading invoices:", error);
        return [];
      }
    },
  });

  // Save invoices to storage
  const saveInvoicesMutation = useMutation({
    mutationFn: async (invoicesToSave: Invoice[]) => {
      try {
        await AsyncStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoicesToSave));
        return invoicesToSave;
      } catch (error) {
        console.error("Error saving invoices:", error);
        throw error;
      }
    },
    onSuccess: (savedInvoices) => {
      setInvoices(savedInvoices);
      queryClient.setQueryData(["invoices"], savedInvoices);
    },
  });
  
  const { mutate: saveInvoices } = saveInvoicesMutation;

  // Update local state when query data changes
  useEffect(() => {
    if (invoicesQuery.data) {
      setInvoices(invoicesQuery.data);
    }
  }, [invoicesQuery.data]);

  const generateInvoiceNumber = useCallback(() => {
    const count = invoices.length + 1;
    return `INV-${count.toString().padStart(3, "0")}`;
  }, [invoices.length]);

  const calculateInvoiceTotals = useCallback((
    items: InvoiceItem[],
    taxRate: number = 0,
    discountRate: number = 0
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = (subtotal * discountRate) / 100;
    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total,
    };
  }, []);

  const createInvoice = useCallback((invoiceData: {
    type: Invoice["type"];
    clientId: string;
    items: InvoiceItem[];
    taxRate?: number;
    discountRate?: number;
    dueDate?: Date;
    notes?: string;
    paymentTerms?: string;
    status?: Invoice["status"];
  }) => {
    const { subtotal, taxAmount, discountAmount, total } = calculateInvoiceTotals(
      invoiceData.items,
      invoiceData.taxRate || 0,
      invoiceData.discountRate || 0
    );

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(),
      type: invoiceData.type,
      clientId: invoiceData.clientId,
      items: invoiceData.items,
      subtotal,
      taxRate: invoiceData.taxRate || 0,
      taxAmount,
      discountRate: invoiceData.discountRate || 0,
      discountAmount,
      total,
      status: invoiceData.status || "draft",
      dueDate: invoiceData.dueDate,
      issueDate: new Date(),
      notes: invoiceData.notes,
      paymentTerms: invoiceData.paymentTerms,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedInvoices = [...invoices, newInvoice];
    saveInvoices(updatedInvoices);
    return newInvoice;
  }, [invoices, generateInvoiceNumber, calculateInvoiceTotals, saveInvoices]);

  const updateInvoice = useCallback((invoiceId: string, updates: Partial<Omit<Invoice, "id" | "createdAt">>) => {
    const updatedInvoices = invoices.map((invoice) =>
      invoice.id === invoiceId
        ? { ...invoice, ...updates, updatedAt: new Date() }
        : invoice
    );
    saveInvoices(updatedInvoices);
  }, [invoices, saveInvoices]);

  const deleteInvoice = useCallback((invoiceId: string) => {
    const updatedInvoices = invoices.filter((invoice) => invoice.id !== invoiceId);
    saveInvoices(updatedInvoices);
  }, [invoices, saveInvoices]);

  const getInvoiceById = useCallback((invoiceId: string): Invoice | undefined => {
    return invoices.find((invoice) => invoice.id === invoiceId);
  }, [invoices]);

  const getInvoicesByStatus = useCallback((status: Invoice["status"]): Invoice[] => {
    return invoices.filter((invoice) => invoice.status === status);
  }, [invoices]);

  const getInvoicesByClient = useCallback((clientId: string): Invoice[] => {
    return invoices.filter((invoice) => invoice.clientId === clientId);
  }, [invoices]);

  const searchInvoices = useCallback((query: string): Invoice[] => {
    if (!query.trim()) return invoices;
    
    const lowercaseQuery = query.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
        invoice.notes?.toLowerCase().includes(lowercaseQuery)
    );
  }, [invoices]);

  const getInvoiceMetrics = useCallback(() => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === "paid");
    const pendingInvoices = invoices.filter(inv => inv.status === "sent");
    const overdueInvoices = invoices.filter(inv => inv.status === "overdue");
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Calculate this month's revenue
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = paidInvoices
      .filter(inv => inv.issueDate >= thisMonth)
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalInvoices,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      totalRevenue,
      pendingAmount,
      overdueAmount,
      thisMonthRevenue,
    };
  }, [invoices]);

  return useMemo(() => ({
    invoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByStatus,
    getInvoicesByClient,
    searchInvoices,
    getInvoiceMetrics,
    calculateInvoiceTotals,
    generateInvoiceNumber,
    isLoading: invoicesQuery.isLoading,
    isSaving: saveInvoicesMutation.isPending,
    error: invoicesQuery.error || saveInvoicesMutation.error,
  }), [
    invoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByStatus,
    getInvoicesByClient,
    searchInvoices,
    getInvoiceMetrics,
    calculateInvoiceTotals,
    generateInvoiceNumber,
    invoicesQuery.isLoading,
    saveInvoicesMutation.isPending,
    invoicesQuery.error,
    saveInvoicesMutation.error,
  ]);
});