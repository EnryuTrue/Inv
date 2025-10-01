import type { Client } from "@/types/invoice";

export const sampleClients: Omit<Client, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    taxId: "123-45-6789",
    address: {
      street: "123 Business Ave",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
  },
  {
    name: "Sarah Johnson",
    email: "sarah@techsolutions.com",
    phone: "+1 (555) 987-6543",
    company: "Tech Solutions Ltd",
    taxId: "987-65-4321",
    address: {
      street: "456 Innovation Dr",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
    },
  },
  {
    name: "Mike Davis",
    email: "mike@creativeagency.com",
    phone: "+1 (555) 456-7890",
    company: "Creative Agency",
    taxId: "456-78-9012",
    address: {
      street: "789 Design St",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "USA",
    },
  },
  {
    name: "Lisa Chen",
    email: "lisa@restaurant.com",
    phone: "+1 (555) 321-6547",
    company: "Local Restaurant",
    taxId: "321-65-4789",
    address: {
      street: "321 Food Court",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA",
    },
  },
];