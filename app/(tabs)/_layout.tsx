import { Tabs } from "expo-router";
import { FileText, Plus, Home } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopColor: Colors.light.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}