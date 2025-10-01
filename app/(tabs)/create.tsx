import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FileText, Receipt, Clock, CreditCard, ArrowRight } from "lucide-react-native";

import Colors from "@/constants/colors";

interface InvoiceTypeProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function InvoiceType({ title, description, icon, onPress }: InvoiceTypeProps) {
  return (
    <TouchableOpacity style={styles.invoiceType} onPress={onPress}>
      <View style={styles.invoiceTypeIcon}>
        {icon}
      </View>
      <View style={styles.invoiceTypeContent}>
        <Text style={styles.invoiceTypeTitle}>{title}</Text>
        <Text style={styles.invoiceTypeDescription}>{description}</Text>
      </View>
      <ArrowRight color={Colors.gray[400]} size={20} />
    </TouchableOpacity>
  );
}

export default function CreateScreen() {
  const insets = useSafeAreaInsets();

  const handleCreateStandard = () => {
    router.push("/create-standard");
  };

  const handleCreateProforma = () => {
    router.push("/create-proforma");
  };

  const handleCreateTimesheet = () => {
    router.push("/create-timesheet");
  };

  const handleCreateRecurring = () => {
    router.push("/create-recurring");
  };

  const handleCreateCreditNote = () => {
    router.push("/create-credit-note");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Invoice</Text>
          <Text style={styles.subtitle}>Choose the type of invoice you want to create</Text>
        </View>

        {/* Invoice Types */}
        <View style={styles.invoiceTypes}>
          <InvoiceType
            title="Standard Invoice"
            description="Regular sales invoice for products or services"
            icon={<FileText color={Colors.primary} size={24} />}
            onPress={handleCreateStandard}
          />
          
          <InvoiceType
            title="Proforma Invoice"
            description="Estimated bill for approval before final invoice"
            icon={<Receipt color={Colors.warning} size={24} />}
            onPress={handleCreateProforma}
          />
          
          <InvoiceType
            title="Timesheet Invoice"
            description="Bill clients based on time tracked sessions"
            icon={<Clock color={Colors.success} size={24} />}
            onPress={handleCreateTimesheet}
          />
          
          <InvoiceType
            title="Recurring Invoice"
            description="Automatically generated invoices on schedule"
            icon={<CreditCard color={Colors.primary} size={24} />}
            onPress={handleCreateRecurring}
          />
          
          <InvoiceType
            title="Credit Note"
            description="Adjustment or refund for existing invoice"
            icon={<FileText color={Colors.danger} size={24} />}
            onPress={handleCreateCreditNote}
          />
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
  invoiceTypes: {
    paddingHorizontal: 20,
    gap: 16,
  },
  invoiceType: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
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
  invoiceTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  invoiceTypeContent: {
    flex: 1,
  },
  invoiceTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  invoiceTypeDescription: {
    fontSize: 14,
    color: Colors.gray[600],
  },
});