import type { WidgetTheme } from "@chacho/types/chat";

const defaultTheme: WidgetTheme = {
  primaryColor: "#c86b3c",
  position: "right",
  title: "Chat with us",
  subtitle: "We usually reply within a few minutes.",
};

export interface MockWidgetRecord {
  id: string;
  tenantId: string;
  name: string;
  publicKey: string;
  theme: WidgetTheme;
  isActive: boolean;
  domainAllowlist: string[];
}

const mockWidgets: Record<string, MockWidgetRecord> = {
  local_dev_widget: {
    id: "8e5019cc-fd63-46e8-896f-9bf69d710001",
    tenantId: "5b7fe2b8-3c16-4b72-a72d-bf0000000001",
    name: "Main site widget",
    publicKey: "local_dev_widget",
    theme: defaultTheme,
    isActive: true,
    domainAllowlist: ["localhost", "127.0.0.1"],
  },
};

export function getMockWidgetByKey(widgetKey: string) {
  return mockWidgets[widgetKey] ?? null;
}

