import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
  RefreshCw
} from "lucide-react-native";

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
        return { 
          color: Colors.gray[500], 
          bg: Colors.gray[100], 
          text: "Draft",
          icon: <Edit color={Colors.gray[500]} size={16} />
        };
      case "sent":
        return { 
          color: Colors.primary, 
          bg: "#e0f2fe", 
          text: "Sent",
          icon: <Clock color={Colors.primary} size={16} />
        };
      case "paid":
        return { 
          color: Colors.success, 
          bg: "#dcfce7", 
          text: "Paid",
          icon: <CheckCircle color={Colors.success} size={16} />
        };
      case "overdue":
        return { 
          color: Colors.danger, 
          bg: "#fee2e2", 
          text: "Overdue",
          icon: <XCircle color={Colors.danger} size={16} />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      {config.icon}
      <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

interface ActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
}

function ActionButton({ title, icon, onPress, variant = "secondary" }: ActionButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return { backgroundColor: Colors.primary, textColor: "white" };
      case "success":
        return { backgroundColor: Colors.success, textColor: "white" };
      case "danger":
        return { backgroundColor: Colors.danger, textColor: "white" };
      default:
        return { backgroundColor: Colors.light.card, textColor: Colors.light.text };
    }
  };

  const buttonStyle = getButtonStyle();

  return (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: buttonStyle.backgroundColor }]} 
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.actionButtonText, { color: buttonStyle.textColor }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default function InvoiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getInvoiceById, updateInvoice } = useInvoices();
  const { getClientById } = useClients();
  const [isUpdating, setIsUpdating] = useState(false);

  const invoice = id ? getInvoiceById(id) : null;
  const client = invoice ? getClientById(invoice.clientId) : null;

  if (!invoice || !client) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Invoice Not Found",
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color={Colors.primary} size={24} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invoice not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInvoiceTypeDisplay = (type: string) => {
    switch (type) {
      case "standard": return "Standard Invoice";
      case "proforma": return "Proforma Invoice";
      case "timesheet": return "Timesheet Invoice";
      case "recurring": return "Recurring Invoice";
      case "credit_note": return "Credit Note";
      default: return "Invoice";
    }
  };

  const handleMarkAsPaid = async () => {
    if (invoice.status === "paid") return;
    
    setIsUpdating(true);
    try {
      updateInvoice(invoice.id, { status: "paid" });
      Alert.alert("Success", "Invoice marked as paid");
    } catch (error) {
      Alert.alert("Error", "Failed to update invoice status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (invoice.status === "sent" || invoice.status === "paid") return;
    
    setIsUpdating(true);
    try {
      updateInvoice(invoice.id, { status: "sent" });
      Alert.alert("Success", "Invoice marked as sent");
    } catch (error) {
      Alert.alert("Error", "Failed to update invoice status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `Invoice ${invoice.invoiceNumber}\n\nFrom: Your Business\nTo: ${client.name}\nAmount: $${invoice.total.toFixed(2)}\nStatus: ${invoice.status}\n\nGenerated by Invoice Generator App`;
      
      await Share.share({
        message: shareContent,
        title: `Invoice ${invoice.invoiceNumber}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share invoice");
    }
  };

  const handleExportPDF = () => {
    Alert.alert(
      "Export PDF", 
      "PDF export functionality will be available in the next update. For now, you can share the invoice details.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Share Instead", onPress: handleShare }
      ]
    );
  };

  const handleConvertToStandard = () => {
    if (invoice.type !== "proforma") return;
    
    Alert.alert(
      "Convert to Standard Invoice",
      "This will create a new standard invoice based on this proforma. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Convert", 
          onPress: () => {
            // Navigate to create standard with pre-filled data
            router.push({
              pathname: "/create-standard",
              params: { 
                convertFromProforma: invoice.id,
                clientId: invoice.clientId,
                items: JSON.stringify(invoice.items),
                taxRate: invoice.taxRate.toString(),
                discountRate: invoice.discountRate.toString()
              }
            });
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: invoice.invoiceNumber,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={Colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <Text style={styles.invoiceType}>{getInvoiceTypeDisplay(invoice.type)}</Text>
            </View>
            <StatusBadge status={invoice.status} />
          </View>
          
          <View style={styles.headerBottom}>
            <Text style={styles.totalAmount}>${invoice.total.toFixed(2)}</Text>
            <Text style={styles.issueDate}>Issued: {formatDate(invoice.issueDate)}</Text>
            {invoice.dueDate && (
              <Text style={styles.dueDate}>Due: {formatDate(invoice.dueDate)}</Text>
            )}
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.clientCard}>
            <View style={styles.clientIcon}>
              {client.company ? (
                <Building color={Colors.primary} size={24} />
              ) : (
                <User color={Colors.primary} size={24} />
              )}
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.company && <Text style={styles.clientCompany}>{client.company}</Text>}
              {client.email && <Text style={styles.clientEmail}>{client.email}</Text>}
              {client.phone && <Text style={styles.clientPhone}>{client.phone}</Text>}
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {invoice.items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>@ ${item.unitPrice.toFixed(2)}</Text>
                <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({invoice.taxRate}%):</Text>
              <Text style={styles.summaryValue}>${invoice.taxAmount.toFixed(2)}</Text>
            </View>
          )}
          {invoice.discountRate > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({invoice.discountRate}%):</Text>
              <Text style={styles.summaryValue}>-${invoice.discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionGrid}>
            {/* Status Actions */}
            {invoice.status === "draft" && (
              <ActionButton
                title="Mark as Sent"
                icon={<Clock color="white" size={20} />}
                onPress={handleMarkAsSent}
                variant="primary"
              />
            )}
            
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <ActionButton
                title="Mark as Paid"
                icon={<CheckCircle color="white" size={20} />}
                onPress={handleMarkAsPaid}
                variant="success"
              />
            )}

            {/* Export & Share */}
            <ActionButton
              title="Export PDF"
              icon={<Download color={Colors.light.text} size={20} />}
              onPress={handleExportPDF}
            />
            
            <ActionButton
              title="Share"
              icon={<Share2 color={Colors.light.text} size={20} />}
              onPress={handleShare}
            />

            {/* Convert Proforma */}
            {invoice.type === "proforma" && (
              <ActionButton
                title="Convert to Standard"
                icon={<RefreshCw color={Colors.light.text} size={20} />}
                onPress={handleConvertToStandard}
              />
            )}
          </View>
        </View>
      </ScrollView>
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
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.gray[600],
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  header: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  invoiceType: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  headerBottom: {
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  issueDate: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  clientCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clientIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 2,
  },
  clientCompany: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  itemCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  summarySection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  notesCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});