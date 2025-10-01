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
import { Plus, Minus, ArrowLeft, User, Building, Calendar, Repeat } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useClients } from "@/contexts/ClientContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import type { Client, InvoiceItem, RecurringInvoiceSettings } from "@/types/invoice";

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

interface InvoiceItemRowProps {
  item: InvoiceItem;
  onUpdate: (item: InvoiceItem) => void;
  onRemove: () => void;
}

function InvoiceItemRow({ item, onUpdate, onRemove }: InvoiceItemRowProps) {
  const handleDescriptionChange = (description: string) => {
    onUpdate({ ...item, description });
  };

  const handleQuantityChange = (text: string) => {
    const quantity = parseFloat(text) || 0;
    const total = quantity * item.unitPrice;
    onUpdate({ ...item, quantity, total });
  };

  const handleUnitPriceChange = (text: string) => {
    const unitPrice = parseFloat(text) || 0;
    const total = item.quantity * unitPrice;
    onUpdate({ ...item, unitPrice, total });
  };

  return (
    <View style={styles.invoiceItem}>
      <TextInput
        style={styles.itemDescription}
        placeholder="Description (e.g., Monthly membership fee)"
        value={item.description}
        onChangeText={handleDescriptionChange}
        placeholderTextColor={Colors.gray[400]}
      />
      <View style={styles.itemRow}>
        <TextInput
          style={styles.itemInput}
          placeholder="Qty"
          value={item.quantity.toString()}
          onChangeText={handleQuantityChange}
          keyboardType="numeric"
          placeholderTextColor={Colors.gray[400]}
        />
        <TextInput
          style={styles.itemInput}
          placeholder="Price"
          value={item.unitPrice.toString()}
          onChangeText={handleUnitPriceChange}
          keyboardType="numeric"
          placeholderTextColor={Colors.gray[400]}
        />
        <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Minus color={Colors.danger} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface FrequencyPickerProps {
  frequency: RecurringInvoiceSettings["frequency"];
  onFrequencyChange: (frequency: RecurringInvoiceSettings["frequency"]) => void;
}

function FrequencyPicker({ frequency, onFrequencyChange }: FrequencyPickerProps) {
  const frequencies: { value: RecurringInvoiceSettings["frequency"]; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

  return (
    <View style={styles.frequencyPicker}>
      {frequencies.map((freq) => (
        <TouchableOpacity
          key={freq.value}
          style={[
            styles.frequencyOption,
            frequency === freq.value && styles.frequencyOptionSelected,
          ]}
          onPress={() => onFrequencyChange(freq.value)}
        >
          <Text
            style={[
              styles.frequencyOptionText,
              frequency === freq.value && styles.frequencyOptionTextSelected,
            ]}
          >
            {freq.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CreateRecurringInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const { createInvoice } = useInvoices();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ]);
  const [taxRate, setTaxRate] = useState<string>("0");
  const [discountRate, setDiscountRate] = useState<string>("0");
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState<RecurringInvoiceSettings["frequency"]>("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * parseFloat(taxRate)) / 100;
  const discountAmount = (subtotal * parseFloat(discountRate)) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const addItem = useCallback(() => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((index: number, updatedItem: InvoiceItem) => {
    setItems((prev) => prev.map((item, i) => (i === index ? updatedItem : item)));
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getNextDueDateFromFrequency = (frequency: RecurringInvoiceSettings["frequency"]) => {
    const now = new Date();
    switch (frequency) {
      case "weekly":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "monthly":
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case "quarterly":
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case "yearly":
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  };

  const handleSetupRecurring = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }

    try {
      const calculatedNextDueDate = nextDueDate 
        ? new Date(nextDueDate) 
        : getNextDueDateFromFrequency(frequency);

      const recurringNotes = `RECURRING INVOICE - ${frequency.toUpperCase()}\n\nThis invoice will be automatically generated ${frequency}.\nNext invoice date: ${calculatedNextDueDate.toLocaleDateString()}\n${endDate ? `End date: ${new Date(endDate).toLocaleDateString()}\n` : ""}${notes.trim() ? `\nNotes: ${notes.trim()}` : ""}`;
      
      createInvoice({
        type: "recurring",
        clientId: selectedClient.id,
        items: validItems,
        taxRate: parseFloat(taxRate) || 0,
        discountRate: parseFloat(discountRate) || 0,
        notes: recurringNotes,
        status: "draft",
        dueDate: calculatedNextDueDate,
      });
      
      Alert.alert(
        "Success", 
        `Recurring invoice template created! The first invoice will be generated on ${calculatedNextDueDate.toLocaleDateString()}.`, 
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to create recurring invoice");
    }
  };

  const handleActivateRecurring = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }

    try {
      const calculatedNextDueDate = nextDueDate 
        ? new Date(nextDueDate) 
        : getNextDueDateFromFrequency(frequency);

      const recurringNotes = `RECURRING INVOICE - ${frequency.toUpperCase()} (ACTIVE)\n\nThis invoice will be automatically generated ${frequency}.\nNext invoice date: ${calculatedNextDueDate.toLocaleDateString()}\n${endDate ? `End date: ${new Date(endDate).toLocaleDateString()}\n` : ""}${notes.trim() ? `\nNotes: ${notes.trim()}` : ""}`;
      
      createInvoice({
        type: "recurring",
        clientId: selectedClient.id,
        items: validItems,
        taxRate: parseFloat(taxRate) || 0,
        discountRate: parseFloat(discountRate) || 0,
        notes: recurringNotes,
        status: "sent",
        dueDate: calculatedNextDueDate,
      });
      
      Alert.alert(
        "Success", 
        `Recurring invoice activated! The first invoice has been sent and future invoices will be generated ${frequency}.`, 
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to activate recurring invoice");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Recurring Invoice",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={Colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recurring Notice */}
        <View style={styles.recurringNotice}>
          <Repeat color={Colors.primary} size={20} />
          <Text style={styles.recurringNoticeText}>
            Set up automatic invoice generation. Perfect for subscriptions, memberships, and regular services.
          </Text>
        </View>

        {/* Client Selection */}
        <ClientSelector
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
        />

        {/* Recurring Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurring Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Frequency</Text>
            <FrequencyPicker frequency={frequency} onFrequencyChange={setFrequency} />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Next Invoice Date (Optional)</Text>
            <View style={styles.dateContainer}>
              <Calendar color={Colors.primary} size={16} />
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD (leave empty for auto)"
                value={nextDueDate}
                onChangeText={setNextDueDate}
                placeholderTextColor={Colors.gray[400]}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>End Date (Optional)</Text>
            <View style={styles.dateContainer}>
              <Calendar color={Colors.primary} size={16} />
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD (leave empty for no end)"
                value={endDate}
                onChangeText={setEndDate}
                placeholderTextColor={Colors.gray[400]}
              />
            </View>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <InvoiceItemRow
              key={item.id}
              item={item}
              onUpdate={(updatedItem) => updateItem(index, updatedItem)}
              onRemove={() => removeItem(index)}
            />
          ))}
          <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
            <Plus color={Colors.primary} size={20} />
            <Text style={styles.addItemText}>Add Item</Text>
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
          <Text style={styles.sectionTitle}>Recurring Amount</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frequency:</Text>
            <Text style={styles.summaryValue}>{frequency.charAt(0).toUpperCase() + frequency.slice(1)}</Text>
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
            <Text style={styles.totalLabel}>Amount per {frequency}:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.draftButton} onPress={handleSetupRecurring}>
          <Text style={styles.draftButtonText}>Setup Template</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleActivateRecurring}>
          <Text style={styles.sendButtonText}>Activate & Send</Text>
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
  recurringNotice: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recurringNoticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
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
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  frequencyPicker: {
    flexDirection: "row",
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  frequencyOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  frequencyOptionTextSelected: {
    color: "white",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
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
  invoiceItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemDescription: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemInput: {
    flex: 1,
    backgroundColor: Colors.light.muted,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    minWidth: 80,
    textAlign: "right",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.muted,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addItemText: {
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
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
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
    color: Colors.primary,
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
    backgroundColor: Colors.primary,
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