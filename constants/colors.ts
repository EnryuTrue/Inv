const primary = "#1e40af";
const success = "#10b981";
const warning = "#f59e0b";
const danger = "#ef4444";
const gray = {
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
};

export default {
  primary,
  success,
  warning,
  danger,
  gray,
  light: {
    text: gray[900],
    background: "#fff",
    tint: primary,
    tabIconDefault: gray[400],
    tabIconSelected: primary,
    border: gray[200],
    card: "#fff",
    muted: gray[100],
  },
};

export const gradients = {
  primary: ["#1e40af", "#3b82f6"] as [string, string],
  success: ["#10b981", "#34d399"] as [string, string],
  warning: ["#f59e0b", "#fbbf24"] as [string, string],
};