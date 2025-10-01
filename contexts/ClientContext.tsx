import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";

import type { Client } from "@/types/invoice";

const CLIENTS_STORAGE_KEY = "invoice_clients";

export const [ClientProvider, useClients] = createContextHook(() => {
  const [clients, setClients] = useState<Client[]>([]);
  const queryClient = useQueryClient();

  // Load clients from storage
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<Client[]> => {
      try {
        const stored = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY);
        if (stored) {
          const parsedClients = JSON.parse(stored);
          // Convert date strings back to Date objects
          return parsedClients.map((client: any) => ({
            ...client,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt),
          }));
        }
        return [];
      } catch (error) {
        console.error("Error loading clients:", error);
        return [];
      }
    },
  });

  // Save clients to storage
  const saveClientsMutation = useMutation({
    mutationFn: async (clientsToSave: Client[]) => {
      try {
        await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clientsToSave));
        return clientsToSave;
      } catch (error) {
        console.error("Error saving clients:", error);
        throw error;
      }
    },
    onSuccess: (savedClients) => {
      setClients(savedClients);
      queryClient.setQueryData(["clients"], savedClients);
    },
  });
  
  const { mutate: saveClients } = saveClientsMutation;

  // Update local state when query data changes
  useEffect(() => {
    if (clientsQuery.data) {
      setClients(clientsQuery.data);
    }
  }, [clientsQuery.data]);

  const addClient = useCallback((clientData: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedClients = [...clients, newClient];
    saveClients(updatedClients);
    return newClient;
  }, [clients, saveClients]);

  const updateClient = useCallback((clientId: string, updates: Partial<Omit<Client, "id" | "createdAt">>) => {
    const updatedClients = clients.map((client) =>
      client.id === clientId
        ? { ...client, ...updates, updatedAt: new Date() }
        : client
    );
    saveClients(updatedClients);
  }, [clients, saveClients]);

  const deleteClient = useCallback((clientId: string) => {
    const updatedClients = clients.filter((client) => client.id !== clientId);
    saveClients(updatedClients);
  }, [clients, saveClients]);

  const getClientById = useCallback((clientId: string): Client | undefined => {
    return clients.find((client) => client.id === clientId);
  }, [clients]);

  const searchClients = useCallback((query: string): Client[] => {
    if (!query.trim()) return clients;
    
    const lowercaseQuery = query.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(lowercaseQuery) ||
        client.email?.toLowerCase().includes(lowercaseQuery) ||
        client.company?.toLowerCase().includes(lowercaseQuery)
    );
  }, [clients]);

  return useMemo(() => ({
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    searchClients,
    isLoading: clientsQuery.isLoading,
    isSaving: saveClientsMutation.isPending,
    error: clientsQuery.error || saveClientsMutation.error,
  }), [clients, addClient, updateClient, deleteClient, getClientById, searchClients, clientsQuery.isLoading, saveClientsMutation.isPending, clientsQuery.error, saveClientsMutation.error]);
});