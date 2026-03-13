import { promises as fs } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "chat-store.json");

export interface DevStoreWidget {
  id: string;
  tenantId: string;
  name: string;
  publicKey: string;
  theme: {
    primaryColor: string;
    position: "left" | "right";
    title: string;
    subtitle: string;
    logoUrl?: string;
  };
  isActive: boolean;
  domainAllowlist: string[];
}

export interface DevStoreVisitor {
  id: string;
  tenantId: string;
  widgetId: string;
  browserToken: string;
  name: string | null;
  email: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface DevStoreConversation {
  id: string;
  tenantId: string;
  widgetId: string;
  visitorId: string;
  status: "OPEN" | "CLOSED";
  sourceUrl: string;
  sourceTitle: string | null;
  startedAt: string;
  lastMessageAt: string;
  closedAt: string | null;
}

export interface DevStoreMessage {
  id: string;
  tenantId: string;
  conversationId: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
  senderUserId: string | null;
  body: string;
  createdAt: string;
}

export interface DevStoreData {
  widgets: DevStoreWidget[];
  visitors: DevStoreVisitor[];
  conversations: DevStoreConversation[];
  messages: DevStoreMessage[];
}

const defaultData: DevStoreData = {
  widgets: [
    {
      id: "8e5019cc-fd63-46e8-896f-9bf69d710001",
      tenantId: "5b7fe2b8-3c16-4b72-a72d-bf0000000001",
      name: "Main site widget",
      publicKey: "local_dev_widget",
      theme: {
        primaryColor: "#c86b3c",
        position: "right",
        title: "Chat with us",
        subtitle: "We usually reply within a few minutes.",
      },
      isActive: true,
      domainAllowlist: ["localhost", "127.0.0.1"],
    },
  ],
  visitors: [],
  conversations: [],
  messages: [],
};

async function ensureStoreFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2), "utf8");
  }
}

export async function readDevStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as DevStoreData;
}

export async function writeDevStore(data: DevStoreData) {
  await ensureStoreFile();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

