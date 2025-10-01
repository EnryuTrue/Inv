import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, Filter, X, Check } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useInvoices } from "@/contexts/InvoiceContext";
import { useClients } from "@/contexts/ClientContext";

interface StatusBadgeProps {
  status: "draft" | "sent" | "paid" | "overdue";
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "draft":
        return { color: Colors.gray[500], bg: Colors.gray[100], text: "Draft" };
      case "sent":
        return { color: Colors.primary, bg: "#e0f2fe", text: "Sent" };
      case "paid":
        return { color: Colors.success, bg: "#dcfce7", text: "Paid" };
      case "overdue":
        return { color: Colors.danger, bg: "#fee2e2", text: "Overdue" };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

interface InvoiceItemProps {
  invoiceNumber: string;
  clientName: string;
  amount: string;
  date: string;
  status: "draft" | "sent" | "paid" | "overdue";
  onPress: () => void;
}

function InvoiceItem({ invoiceNumber, clientName, amount, date, status, onPress }: InvoiceItemProps) {
  return (
    <TouchableOpacity style={styles.invoiceItem} onPress={onPress}>
      <View style={styles.invoiceHeader}>
        <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.clientName}>{clientName}</Text>
      <View style={styles.invoiceFooter}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "sent" | "paid" | "overdue">("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { invoices, searchInvoices, getInvoiceMetrics } = useInvoices();
  const { getClientById } = useClients();
  
  const filteredInvoices = React.useMemo(() => {
    let result = searchQuery ? searchInvoices(searchQuery) : invoices;
    
    if (statusFilter !== "all") {
      result = result.filter(invoice => invoice.status === statusFilter);
    }
    
    return result;
  }, [invoices, searchQuery, statusFilter, searchInvoices]);
  
  const displayInvoices = filteredInvoices;
  const metrics = getInvoiceMetrics();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getClientName = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.name || 'Unknown Client';
  };

  const handleInvoicePress = (invoiceId: string) => {
    router.push(`/invoice/${invoiceId}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
          <Text style={styles.subtitle}>Manage all your invoices</Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search color={Colors.gray[400]} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search invoices..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.gray[400]}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Filter color={Colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{metrics.totalInvoices}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{metrics.paidCount}</Text>
            <Text style={styles.summaryLabel}>Paid</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>{metrics.pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>{metrics.overdueCount}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
        </View>

        {/* Status Filter Pills */}
        {statusFilter !== "all" && (
          <View style={styles.filterPillContainer}>
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>Status: {statusFilter}</Text>
              <TouchableOpacity onPress={() => setStatusFilter("all")}>
                <X color={Colors.gray[600]} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Invoice List */}
        <View style={styles.invoiceList}>
          {displayInvoices.length > 0 ? (
            displayInvoices.map((invoice) => (
              <InvoiceItem
                key={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                clientName={getClientName(invoice.clientId)}
                amount={`${invoice.total.toFixed(2)}`}
                date={formatDate(invoice.issueDate)}
                status={invoice.status}
                onPress={() => handleInvoicePress(invoice.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No invoices found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Create your first invoice to get started'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Invoices</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color={Colors.gray[600]} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {["all", "draft", "sent", "paid", "overdue"].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.filterOption}
                  onPress={() => {
                    setStatusFilter(status as typeof statusFilter);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.filterOptionText}>
                    {status === "all" ? "All Invoices" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  {statusFilter === status && (
                    <Check color={Colors.primary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.gray[600],
    textAlign: "center",
  },
  invoiceList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  invoiceItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clientName: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 12,
  },
  invoiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  date: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: "center",
  },
  filterPillContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "20",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    gap: 8,
  },
  filterPillText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
});