import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp, FileText, Clock, DollarSign, Plus } from "lucide-react-native";
import { router } from "expo-router";

import Colors, { gradients } from "@/constants/colors";
import { useClients } from "@/contexts/ClientContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import { sampleClients } from "@/mocks/clients";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  gradient: [string, string];
}

function MetricCard({ title, value, icon, color, gradient }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <LinearGradient colors={gradient} style={styles.metricGradient}>
        <View style={styles.metricIcon}>
          {icon}
        </View>
      </LinearGradient>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
    </View>
  );
}

interface QuickActionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function QuickAction({ title, subtitle, icon, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        {icon}
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { clients, addClient } = useClients();
  const { getInvoiceMetrics } = useInvoices();
  
  // Add sample clients if none exist
  React.useEffect(() => {
    if (clients.length === 0) {
      sampleClients.forEach(clientData => {
        addClient(clientData);
      });
    }
  }, [clients.length, addClient]);
  
  const metrics = getInvoiceMetrics();
  
  const handleCreateInvoice = () => {
    router.push("/(tabs)/create");
  };

  const handleViewInvoices = () => {
    router.push("/(tabs)/invoices");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.subtitle}>Let&apos;s manage your invoices</Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <MetricCard
              title="This Month"
              value={`${metrics.thisMonthRevenue.toFixed(0)}`}
              icon={<DollarSign color="white" size={24} />}
              color={Colors.success}
              gradient={gradients.success}
            />
            <MetricCard
              title="Pending"
              value={`${metrics.pendingAmount.toFixed(0)}`}
              icon={<Clock color="white" size={24} />}
              color={Colors.warning}
              gradient={gradients.warning}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Total Invoices"
              value={metrics.totalInvoices.toString()}
              icon={<FileText color="white" size={24} />}
              color={Colors.primary}
              gradient={gradients.primary}
            />
            <MetricCard
              title="Paid"
              value={metrics.paidCount.toString()}
              icon={<TrendingUp color="white" size={24} />}
              color={Colors.success}
              gradient={gradients.success}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              title="Create Invoice"
              subtitle="Generate a new invoice"
              icon={<Plus color={Colors.primary} size={24} />}
              onPress={handleCreateInvoice}
            />
            <QuickAction
              title="View All Invoices"
              subtitle="Manage existing invoices"
              icon={<FileText color={Colors.primary} size={24} />}
              onPress={handleViewInvoices}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>No recent activity</Text>
            <Text style={styles.activitySubtext}>Create your first invoice to get started</Text>
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
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
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
  metricGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  metricIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  quickActions: {
    gap: 12,
  },
  quickAction: {
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  activityCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 24,
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
  activityText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: "center",
  },
});