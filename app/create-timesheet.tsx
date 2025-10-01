import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Plus, Minus, ArrowLeft, User, Building, Calendar, Clock } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useClients } from "@/contexts/ClientContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import type { Client, TimesheetEntry } from "@/types/invoice";

interface ClientSelectorProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
}

function ClientSelector({ selectedClient, onSelectClient }: ClientSelectorProps) {
  const { clients } = useClients();
  const [showClientList, setShowClientList] = useState(false);

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setShowClientList(false);
  };

  if (showClientList) {
    return (
      <View style={styles.clientSelector}>
        <Text style={styles.sectionTitle}>Select Client</Text>
        <ScrollView style={styles.clientList} nestedScrollEnabled>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={styles.clientItem}
              onPress={() => handleSelectClient(client)}
            >
              <View style={styles.clientIcon}>
                {client.company ? (
                  <Building color={Colors.primary} size={20} />
                ) : (
                  <User color={Colors.primary} size={20} />
                )}
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.name}</Text>
                {client.company && <Text style={styles.clientCompany}>{client.company}</Text>}
                {client.email && <Text style={styles.clientEmail}>{client.email}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowClientList(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Client</Text>
      <TouchableOpacity
        style={styles.clientSelectButton}
        onPress={() => setShowClientList(true)}
      >
        {selectedClient ? (
          <View style={styles.selectedClientInfo}>
            <View style={styles.clientIcon}>
              {selectedClient.company ? (
                <Building color={Colors.primary} size={20} />
              ) : (
                <User color={Colors.primary} size={20} />
              )}
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{selectedClient.name}</Text>
              {selectedClient.company && (
                <Text style={styles.clientCompany}>{selectedClient.company}</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.selectClientText}>Select a client</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

interface TimesheetEntryRowProps {
  entry: TimesheetEntry;
  onUpdate: (entry: TimesheetEntry) => void;
  onRemove: () => void;
}

function TimesheetEntryRow({ entry, onUpdate, onRemove }: TimesheetEntryRowProps) {
  const handleDateChange = (text: string) => {
    onUpdate({ ...entry, date: new Date(text || Date.now()) });
  };

  const handleDescriptionChange = (description: string) => {
    onUpdate({ ...entry, description });
  };

  const handleHoursChange = (text: string) => {
    const hours = parseFloat(text) || 0;
    const total = hours * entry.hourlyRate;
    onUpdate({ ...entry, hours, total });
  };

  const handleRateChange = (text: string) => {
    const hourlyRate = parseFloat(text) || 0;
    const total = entry.hours * hourlyRate;
    onUpdate({ ...entry, hourlyRate, total });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <View style={styles.timesheetEntry}>
      <View style={styles.entryHeader}>
        <View style={styles.dateContainer}>
          <Calendar color={Colors.primary} size={16} />
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            value={formatDate(entry.date)}
            onChangeText={handleDateChange}
            placeholderTextColor={Colors.gray[400]}
          />
        </View>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Minus color={Colors.danger} size={20} />
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.entryDescription}
        placeholder="Session description (e.g., Cardio, Strength Training)"
        value={entry.description}
        onChangeText={handleDescriptionChange}
        placeholderTextColor={Colors.gray[400]}
      />
      
      <View style={styles.entryRow}>
        <View style={styles.entryInputContainer}>
          <Text style={styles.inputLabel}>Hours</Text>
          <TextInput
            style={styles.entryInput}
            placeholder="0"
            value={entry.hours.toString()}
            onChangeText={handleHoursChange}
            keyboardType="numeric"
            placeholderTextColor={Colors.gray[400]}
          />
        </View>
        <View style={styles.entryInputContainer}>
          <Text style={styles.inputLabel}>Rate/Hour</Text>
          <TextInput
            style={styles.entryInput}
            placeholder="0"
            value={entry.hourlyRate.toString()}
            onChangeText={handleRateChange}
            keyboardType="numeric"
            placeholderTextColor={Colors.gray[400]}
          />
        </View>
        <View style={styles.entryTotalContainer}>
          <Text style={styles.inputLabel}>Total</Text>
          <Text style={styles.entryTotal}>${entry.total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CreateTimesheetInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const { createInvoice } = useInvoices();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([
    {
      id: "1",
      date: new Date(),
      description: "",
      hours: 1,
      hourlyRate: 0,
      total: 0,
    },
  ]);
  const [taxRate, setTaxRate] = useState<string>("0");
  const [discountRate, setDiscountRate] = useState<string>("0");
  const [notes, setNotes] = useState("");

  const subtotal = entries.reduce((sum, entry) => sum + entry.total, 0);
  const taxAmount = (subtotal * parseFloat(taxRate)) / 100;
  const discountAmount = (subtotal * parseFloat(discountRate)) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const addEntry = useCallback(() => {
    const newEntry: TimesheetEntry = {
      id: Date.now().toString(),
      date: new Date(),
      description: "",
      hours: 1,
      hourlyRate: 0,
      total: 0,
    };
    setEntries((prev) => [...prev, newEntry]);
  }, []);

  const updateEntry = useCallback((index: number, updatedEntry: TimesheetEntry) => {
    setEntries((prev) => prev.map((entry, i) => (i === index ? updatedEntry : entry)));
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveDraft = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    const validEntries = entries.filter(entry => entry.description.trim() && entry.hours > 0);
    if (validEntries.length === 0) {
      Alert.alert("Error", "Please add at least one timesheet entry");
      return;
    }

    try {
      // Convert timesheet entries to invoice items
      const items = validEntries.map(entry => ({
        id: entry.id,
        description: `${entry.date.toLocaleDateString()} - ${entry.description} (${entry.hours}h @ $${entry.hourlyRate}/hr)`,
        quantity: entry.hours,
        unitPrice: entry.hourlyRate,
        total: entry.total,
      }));

      const timesheetNotes = `TIMESHEET INVOICE\n\nDetailed breakdown by session:\n${validEntries.map(entry => 
        `• ${entry.date.toLocaleDateString()} - ${entry.description}: ${entry.hours}h @ $${entry.hourlyRate}/hr = $${entry.total.toFixed(2)}`
      ).join('\n')}\n${notes.trim() ? `\nAdditional Notes: ${notes.trim()}` : ""}`;
      
      createInvoice({
        type: "timesheet",
        clientId: selectedClient.id,
        items,
        taxRate: parseFloat(taxRate) || 0,
        discountRate: parseFloat(discountRate) || 0,
        notes: timesheetNotes,
        status: "draft",
      });
      
      Alert.alert("Success", "Timesheet invoice saved as draft", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save timesheet invoice");
    }
  };

  const handleSendInvoice = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    const validEntries = entries.filter(entry => entry.description.trim() && entry.hours > 0);
    if (validEntries.length === 0) {
      Alert.alert("Error", "Please add at least one timesheet entry");
      return;
    }

    try {
      // Convert timesheet entries to invoice items
      const items = validEntries.map(entry => ({
        id: entry.id,
        description: `${entry.date.toLocaleDateString()} - ${entry.description} (${entry.hours}h @ $${entry.hourlyRate}/hr)`,
        quantity: entry.hours,
        unitPrice: entry.hourlyRate,
        total: entry.total,
      }));

      const timesheetNotes = `TIMESHEET INVOICE\n\nDetailed breakdown by session:\n${validEntries.map(entry => 
        `• ${entry.date.toLocaleDateString()} - ${entry.description}: ${entry.hours}h @ $${entry.hourlyRate}/hr = $${entry.total.toFixed(2)}`
      ).join('\n')}\n${notes.trim() ? `\nAdditional Notes: ${notes.trim()}` : ""}`;
      
      createInvoice({
        type: "timesheet",
        clientId: selectedClient.id,
        items,
        taxRate: parseFloat(taxRate) || 0,
        discountRate: parseFloat(discountRate) || 0,
        notes: timesheetNotes,
        status: "sent",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      
      Alert.alert("Success", "Timesheet invoice sent successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to send timesheet invoice");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Timesheet Invoice",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={Colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Timesheet Notice */}
        <View style={styles.timesheetNotice}>
          <Clock color={Colors.success} size={20} />
          <Text style={styles.timesheetNoticeText}>
            Track your sessions and bill clients based on time worked. Perfect for trainers, consultants, and service providers.
          </Text>
        </View>

        {/* Client Selection */}
        <ClientSelector
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
        />

        {/* Timesheet Entries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Entries</Text>
          {entries.map((entry, index) => (
            <TimesheetEntryRow
              key={entry.id}
              entry={entry}
              onUpdate={(updatedEntry) => updateEntry(index, updatedEntry)}
              onRemove={() => removeEntry(index)}
            />
          ))}
          <TouchableOpacity style={styles.addEntryButton} onPress={addEntry}>
            <Plus color={Colors.primary} size={20} />
            <Text style={styles.addEntryText}>Add Time Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Tax and Discount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax & Discount</Text>
          <View style={styles.taxDiscountRow}>
            <View style={styles.taxDiscountItem}>
              <Text style={styles.inputLabel}>Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>
            <View style={styles.taxDiscountItem}>
              <Text style={styles.inputLabel}>Discount (%)</Text>
              <TextInput
                style={styles.input}
                value={discountRate}
                onChangeText={setDiscountRate}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes for the client..."
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Total Hours & Amount</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hours:</Text>
            <Text style={styles.summaryValue}>{entries.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}h</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax ({taxRate}%):</Text>
            <Text style={styles.summaryValue}>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount ({discountRate}%):</Text>
            <Text style={styles.summaryValue}>-${discountAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
          <Text style={styles.draftButtonText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendInvoice}>
          <Text style={styles.sendButtonText}>Send Invoice</Text>
        </TouchableOpacity>
      </View>
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
  timesheetNotice: {
    backgroundColor: Colors.success + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timesheetNoticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.success,
    fontWeight: "500",
    lineHeight: 20,
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
  clientSelector: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  clientSelectButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectClientText: {
    color: Colors.gray[500],
    fontSize: 16,
  },
  selectedClientInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  clientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  clientIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  clientCompany: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 2,
  },
  clientEmail: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.gray[700],
    fontWeight: "600",
  },
  timesheetEntry: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.muted,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  entryDescription: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 8,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  entryInputContainer: {
    flex: 1,
  },
  entryInput: {
    backgroundColor: Colors.light.muted,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
  },
  entryTotalContainer: {
    flex: 1,
    alignItems: "center",
  },
  entryTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gray[600],
    marginBottom: 4,
    textAlign: "center",
  },
  addEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.muted,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addEntryText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
  taxDiscountRow: {
    flexDirection: "row",
    gap: 16,
  },
  taxDiscountItem: {
    flex: 1,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  notesInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  summarySection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    color: Colors.success,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  draftButton: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray[700],
  },
  sendButton: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});