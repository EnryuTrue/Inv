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
import { Plus, Minus, ArrowLeft, User, Building, FileText, Search } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useClients } from "@/contexts/ClientContext";
import { useInvoices } from "@/contexts/InvoiceContext";
import type { Client, InvoiceItem, Invoice } from "@/types/invoice";

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

interface OriginalInvoiceSelectorProps {
  selectedInvoice: Invoice | null;
  onSelectInvoice: (invoice: Invoice | null) => void;
  clientId?: string;
}

function OriginalInvoiceSelector({ selectedInvoice, onSelectInvoice, clientId }: OriginalInvoiceSelectorProps) {
  const { invoices } = useInvoices();
  const [showInvoiceList, setShowInvoiceList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter invoices for the selected client and exclude credit notes
  const availableInvoices = invoices.filter(invoice => 
    (!clientId || invoice.clientId === clientId) && 
    invoice.type !== "credit_note" &&
    (invoice.status === "sent" || invoice.status === "paid")
  );

  const filteredInvoices = searchQuery 
    ? availableInvoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableInvoices;

  const handleSelectInvoice = (invoice: Invoice) => {
    onSelectInvoice(invoice);
    setShowInvoiceList(false);
    setSearchQuery("");
  };

  if (showInvoiceList) {
    return (
      <View style={styles.invoiceSelector}>
        <Text style={styles.sectionTitle}>Select Original Invoice</Text>
        
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

        <ScrollView style={styles.invoiceList} nestedScrollEnabled>
          {filteredInvoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceItem}
              onPress={() => handleSelectInvoice(invoice)}
            >
              <View style={styles.invoiceItemContent}>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                <Text style={styles.invoiceAmount}>${invoice.total.toFixed(2)}</Text>
              </View>
              <Text style={styles.invoiceDate}>
                {invoice.issueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
          {filteredInvoices.length === 0 && (
            <Text style={styles.noInvoicesText}>
              {clientId ? "No invoices found for this client" : "Select a client first"}
            </Text>
          )}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowInvoiceList(false);
            setSearchQuery("");
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Original Invoice</Text>
      <TouchableOpacity
        style={styles.invoiceSelectButton}
        onPress={() => setShowInvoiceList(true)}
      >
        {selectedInvoice ? (
          <View style={styles.selectedInvoiceInfo}>
            <FileText color={Colors.primary} size={20} />
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceNumber}>{selectedInvoice.invoiceNumber}</Text>
              <Text style={styles.invoiceAmount}>${selectedInvoice.total.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.selectInvoiceText}>
            {clientId ? "Select original invoice to adjust" : "Select a client first"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

interface CreditItemRowProps {
  item: InvoiceItem;
  onUpdate: (item: InvoiceItem) => void;
  onRemove: () => void;
}

function CreditItemRow({ item, onUpdate, onRemove }: CreditItemRowProps) {
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
    <View style={styles.creditItem}>
      <TextInput
        style={styles.itemDescription}
        placeholder="Credit description (e.g., Returned items, Overpayment)"
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
        <Text style={styles.itemTotal}>-${item.total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Minus color={Colors.danger} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreateCreditNoteScreen() {
  const insets = useSafeAreaInsets();
  const { createInvoice } = useInvoices();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const creditAmount = subtotal; // Credit notes don't typically have tax/discount

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

  const handleClientChange = (client: Client | null) => {
    setSelectedClient(client);
    setSelectedInvoice(null); // Reset selected invoice when client changes
  };

  const handleSaveDraft = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    if (!selectedInvoice) {
      Alert.alert("Error", "Please select the original invoice to adjust");
      return;
    }
    
    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      Alert.alert("Error", "Please add at least one credit item");
      return;
    }

    try {
      const creditNotes = `CREDIT NOTE\n\nOriginal Invoice: ${selectedInvoice.invoiceNumber}\nOriginal Amount: $${selectedInvoice.total.toFixed(2)}\nCredit Amount: -$${creditAmount.toFixed(2)}\n\n${reason ? `Reason: ${reason}\n` : ""}${notes.trim() ? `\nAdditional Notes: ${notes.trim()}` : ""}`;
      
      createInvoice({
        type: "credit_note",
        clientId: selectedClient.id,
        items: validItems,
        taxRate: 0,
        discountRate: 0,
        notes: creditNotes,
        status: "draft",
      });
      
      Alert.alert("Success", "Credit note saved as draft", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save credit note");
    }
  };

  const handleIssueCreditNote = () => {
    if (!selectedClient) {
      Alert.alert("Error", "Please select a client");
      return;
    }
    
    if (!selectedInvoice) {
      Alert.alert("Error", "Please select the original invoice to adjust");
      return;
    }
    
    const validItems = items.filter(item => item.description.trim());
    if (validItems.length === 0) {
      Alert.alert("Error", "Please add at least one credit item");
      return;
    }

    try {
      const creditNotes = `CREDIT NOTE\n\nOriginal Invoice: ${selectedInvoice.invoiceNumber}\nOriginal Amount: $${selectedInvoice.total.toFixed(2)}\nCredit Amount: -$${creditAmount.toFixed(2)}\n\n${reason ? `Reason: ${reason}\n` : ""}${notes.trim() ? `\nAdditional Notes: ${notes.trim()}` : ""}`;
      
      createInvoice({
        type: "credit_note",
        clientId: selectedClient.id,
        items: validItems,
        taxRate: 0,
        discountRate: 0,
        notes: creditNotes,
        status: "sent",
      });
      
      Alert.alert("Success", "Credit note issued successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to issue credit note");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Credit Note",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={Colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Credit Note Notice */}
        <View style={styles.creditNotice}>
          <Text style={styles.creditNoticeText}>
            💳 Create a credit note to adjust or refund an existing invoice. This will show as a negative amount.
          </Text>
        </View>

        {/* Client Selection */}
        <ClientSelector
          selectedClient={selectedClient}
          onSelectClient={handleClientChange}
        />

        {/* Original Invoice Selection */}
        <OriginalInvoiceSelector
          selectedInvoice={selectedInvoice}
          onSelectInvoice={setSelectedInvoice}
          clientId={selectedClient?.id}
        />

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Credit</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g., Returned items, Overpayment, Discount adjustment"
            placeholderTextColor={Colors.gray[400]}
          />
        </View>

        {/* Credit Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Items</Text>
          {items.map((item, index) => (
            <CreditItemRow
              key={item.id}
              item={item}
              onUpdate={(updatedItem) => updateItem(index, updatedItem)}
              onRemove={() => removeItem(index)}
            />
          ))}
          <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
            <Plus color={Colors.primary} size={20} />
            <Text style={styles.addItemText}>Add Credit Item</Text>
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Credit Summary</Text>
          {selectedInvoice && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Original Invoice:</Text>
              <Text style={styles.summaryValue}>${selectedInvoice.total.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Credit Amount:</Text>
            <Text style={styles.creditValue}>-${creditAmount.toFixed(2)}</Text>
          </View>
          {selectedInvoice && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining Balance:</Text>
              <Text style={styles.summaryValue}>
                ${(selectedInvoice.total - creditAmount).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
          <Text style={styles.draftButtonText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleIssueCreditNote}>
          <Text style={styles.sendButtonText}>Issue Credit</Text>
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
  creditNotice: {
    backgroundColor: Colors.danger + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  creditNoticeText: {
    fontSize: 14,
    color: Colors.danger,
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
  invoiceSelector: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  invoiceSelectButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectInvoiceText: {
    color: Colors.gray[500],
    fontSize: 16,
  },
  selectedInvoiceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.muted,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  invoiceList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  invoiceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  invoiceItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  noInvoicesText: {
    textAlign: "center",
    color: Colors.gray[500],
    fontSize: 14,
    padding: 20,
  },
  reasonInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  creditItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
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
    color: Colors.danger,
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
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  creditValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.danger,
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
    backgroundColor: Colors.danger,
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