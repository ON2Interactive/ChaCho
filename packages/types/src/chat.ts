export type TenantRole = "owner" | "agent";

export type ConversationStatus = "open" | "closed";

export type MessageSenderType = "visitor" | "agent" | "system";

export interface WidgetTheme {
  primaryColor: string;
  position: "left" | "right";
  title: string;
  subtitle: string;
  logoUrl?: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
}
