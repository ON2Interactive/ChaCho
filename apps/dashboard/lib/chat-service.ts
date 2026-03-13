import { randomUUID } from "node:crypto";
import { prisma } from "@chacho/db";
import type { SessionUser } from "@/lib/auth";
import { readDevStore, writeDevStore } from "@/lib/dev-store";
import { getMockWidgetByKey } from "@/lib/mock-widget";

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function isoNow() {
  return new Date().toISOString();
}

type JsonObjectLike = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObjectLike {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface ConversationSummary {
  id: string;
  status: "OPEN" | "CLOSED";
  sourceUrl: string;
  sourceTitle: string | null;
  startedAt: string;
  lastMessageAt: string;
  visitorName: string | null;
  visitorEmail: string | null;
  lastMessagePreview: string | null;
}

export interface ConversationMessage {
  id: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
  body: string;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
}

export async function getWidgetByPublicKey(widgetKey: string) {
  if (!isDatabaseConfigured()) {
    const widget = getMockWidgetByKey(widgetKey);
    return widget ?? null;
  }

  const widget = await prisma.widget.findUnique({
    where: { publicKey: widgetKey },
    select: {
      id: true,
      tenantId: true,
      name: true,
      publicKey: true,
      isActive: true,
      domainAllowlist: true,
      themeJson: true,
    },
  });

  if (!widget) {
    return null;
  }

  return {
    id: widget.id,
    tenantId: widget.tenantId,
    name: widget.name,
    publicKey: widget.publicKey,
    isActive: widget.isActive,
    domainAllowlist: Array.isArray(widget.domainAllowlist) ? widget.domainAllowlist : [],
    theme:
      isJsonObject(widget.themeJson)
        ? {
            primaryColor: typeof widget.themeJson.primaryColor === "string" ? widget.themeJson.primaryColor : "#c86b3c",
            position: widget.themeJson.position === "left" ? "left" : "right",
            title: typeof widget.themeJson.title === "string" ? widget.themeJson.title : "Chat with us",
            subtitle:
              typeof widget.themeJson.subtitle === "string"
                ? widget.themeJson.subtitle
                : "We usually reply within a few minutes.",
            ...(typeof widget.themeJson.logoUrl === "string" ? { logoUrl: widget.themeJson.logoUrl } : {}),
          }
        : {
            primaryColor: "#c86b3c",
            position: "right",
            title: "Chat with us",
            subtitle: "We usually reply within a few minutes.",
          },
  };
}

export async function createWidgetSession(input: {
  widgetKey: string;
  browserToken: string;
  visitorName: string | null;
  visitorEmail: string | null;
  pageUrl: string;
  pageTitle: string;
}) {
  if (isDatabaseConfigured()) {
    const widget = await prisma.widget.findUnique({
      where: { publicKey: input.widgetKey },
    });

    if (!widget || !widget.isActive) {
      return null;
    }

    const existingVisitor = await prisma.visitor.findFirst({
      where: {
        tenantId: widget.tenantId,
        browserToken: input.browserToken,
      },
    });

    const visitor = existingVisitor
      ? await prisma.visitor.update({
          where: { id: existingVisitor.id },
          data: {
            name: input.visitorName ?? existingVisitor.name,
            email: input.visitorEmail ?? existingVisitor.email,
            lastSeenAt: new Date(),
          },
        })
      : await prisma.visitor.create({
          data: {
            id: randomUUID(),
            tenantId: widget.tenantId,
            widgetId: widget.id,
            browserToken: input.browserToken,
            name: input.visitorName,
            email: input.visitorEmail,
          },
        });

    const conversation = await prisma.conversation.findFirst({
      where: {
        tenantId: widget.tenantId,
        widgetId: widget.id,
        visitorId: visitor.id,
        status: "OPEN",
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return {
      visitorToken: `dev_visitor_token_${input.browserToken}`,
      visitorId: visitor.id,
      conversationId: conversation?.id ?? null,
      widgetId: widget.id,
      tenantId: widget.tenantId,
    };
  }

  const store = await readDevStore();
  const widget = store.widgets.find((candidate) => candidate.publicKey === input.widgetKey && candidate.isActive);

  if (!widget) {
    return null;
  }

  const now = isoNow();
  let visitor = store.visitors.find(
    (candidate) => candidate.tenantId === widget.tenantId && candidate.browserToken === input.browserToken,
  );

  if (!visitor) {
    visitor = {
      id: randomUUID(),
      tenantId: widget.tenantId,
      widgetId: widget.id,
      browserToken: input.browserToken,
      name: input.visitorName,
      email: input.visitorEmail,
      firstSeenAt: now,
      lastSeenAt: now,
    };
    store.visitors.push(visitor);
  } else {
    visitor.name = input.visitorName ?? visitor.name;
    visitor.email = input.visitorEmail ?? visitor.email;
    visitor.lastSeenAt = now;
  }

  await writeDevStore(store);

  const conversation = store.conversations
    .filter((candidate) => candidate.visitorId === visitor.id && candidate.status === "OPEN")
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))[0];

  return {
    visitorToken: `dev_visitor_token_${input.browserToken}`,
    visitorId: visitor.id,
    conversationId: conversation?.id ?? null,
    widgetId: widget.id,
    tenantId: widget.tenantId,
  };
}

export async function createConversation(input: {
  widgetKey: string;
  browserToken: string;
  sourceUrl: string;
  sourceTitle: string;
}) {
  if (isDatabaseConfigured()) {
    const widget = await prisma.widget.findUnique({
      where: { publicKey: input.widgetKey },
    });

    if (!widget) {
      return null;
    }

    const visitor = await prisma.visitor.findFirst({
      where: {
        tenantId: widget.tenantId,
        browserToken: input.browserToken,
      },
    });

    if (!visitor) {
      return null;
    }

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: widget.tenantId,
        widgetId: widget.id,
        visitorId: visitor.id,
        sourceUrl: input.sourceUrl,
        sourceTitle: input.sourceTitle,
      },
    });

    return conversation;
  }

  const store = await readDevStore();
  const widget = store.widgets.find((candidate) => candidate.publicKey === input.widgetKey && candidate.isActive);

  if (!widget) {
    return null;
  }

  const visitor = store.visitors.find(
    (candidate) => candidate.tenantId === widget.tenantId && candidate.browserToken === input.browserToken,
  );

  if (!visitor) {
    return null;
  }

  const now = isoNow();
  const conversation = {
    id: randomUUID(),
    tenantId: widget.tenantId,
    widgetId: widget.id,
    visitorId: visitor.id,
    status: "OPEN" as const,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    startedAt: now,
    lastMessageAt: now,
    closedAt: null,
  };

  store.conversations.unshift(conversation);
  await writeDevStore(store);
  return conversation;
}

export async function listTenantConversations(tenantId: string): Promise<ConversationSummary[]> {
  if (isDatabaseConfigured()) {
    const conversations = await prisma.conversation.findMany({
      where: { tenantId },
      include: {
        visitor: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return conversations.map((conversation: (typeof conversations)[number]) => ({
      id: conversation.id,
      status: conversation.status,
      sourceUrl: conversation.sourceUrl,
      sourceTitle: conversation.sourceTitle,
      startedAt: conversation.startedAt.toISOString(),
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      visitorName: conversation.visitor.name,
      visitorEmail: conversation.visitor.email,
      lastMessagePreview: conversation.messages[0]?.body ?? null,
    }));
  }

  const store = await readDevStore();
  return store.conversations
    .filter((conversation) => conversation.tenantId === tenantId)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((conversation) => {
      const visitor = store.visitors.find((candidate) => candidate.id === conversation.visitorId);
      const lastMessage = store.messages
        .filter((message) => message.conversationId === conversation.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

      return {
        id: conversation.id,
        status: conversation.status,
        sourceUrl: conversation.sourceUrl,
        sourceTitle: conversation.sourceTitle,
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastMessageAt,
        visitorName: visitor?.name ?? null,
        visitorEmail: visitor?.email ?? null,
        lastMessagePreview: lastMessage?.body ?? null,
      };
    });
}

export async function getConversationDetail(tenantId: string, conversationId: string): Promise<ConversationDetail | null> {
  if (isDatabaseConfigured()) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
      include: {
        visitor: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      status: conversation.status,
      sourceUrl: conversation.sourceUrl,
      sourceTitle: conversation.sourceTitle,
      startedAt: conversation.startedAt.toISOString(),
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      visitorName: conversation.visitor.name,
      visitorEmail: conversation.visitor.email,
      lastMessagePreview: conversation.messages.at(-1)?.body ?? null,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        senderType: message.senderType,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  const store = await readDevStore();
  const conversation = store.conversations.find((candidate) => candidate.id === conversationId && candidate.tenantId === tenantId);

  if (!conversation) {
    return null;
  }

  const visitor = store.visitors.find((candidate) => candidate.id === conversation.visitorId);
  const messages = store.messages
    .filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    id: conversation.id,
    status: conversation.status,
    sourceUrl: conversation.sourceUrl,
    sourceTitle: conversation.sourceTitle,
    startedAt: conversation.startedAt,
    lastMessageAt: conversation.lastMessageAt,
    visitorName: visitor?.name ?? null,
    visitorEmail: visitor?.email ?? null,
    lastMessagePreview: messages.at(-1)?.body ?? null,
    messages: messages.map((message) => ({
      id: message.id,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt,
    })),
  };
}

export async function listConversationMessages(conversationId: string) {
  if (isDatabaseConfigured()) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((message) => ({
      id: message.id,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    }));
  }

  const store = await readDevStore();
  return store.messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((message) => ({
      id: message.id,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt,
    }));
}

export async function createVisitorMessage(input: {
  conversationId: string;
  body: string;
}) {
  if (isDatabaseConfigured()) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
    });

    if (!conversation) {
      return null;
    }

    const message = await prisma.message.create({
      data: {
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
        senderType: "VISITOR",
        body: input.body,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    return message;
  }

  const store = await readDevStore();
  const conversation = store.conversations.find((candidate) => candidate.id === input.conversationId);

  if (!conversation) {
    return null;
  }

  const message = {
    id: randomUUID(),
    tenantId: conversation.tenantId,
    conversationId: conversation.id,
    senderType: "VISITOR" as const,
    senderUserId: null,
    body: input.body,
    createdAt: isoNow(),
  };

  store.messages.push(message);
  conversation.lastMessageAt = message.createdAt;
  await writeDevStore(store);
  return message;
}

export async function createAgentMessage(input: {
  conversationId: string;
  body: string;
  user: SessionUser;
}) {
  if (isDatabaseConfigured()) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        tenantId: input.user.tenantId,
      },
    });

    if (!conversation) {
      return null;
    }

    const message = await prisma.message.create({
      data: {
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
        senderType: "AGENT",
        senderUserId: input.user.userId,
        body: input.body,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    return message;
  }

  const store = await readDevStore();
  const conversation = store.conversations.find(
    (candidate) => candidate.id === input.conversationId && candidate.tenantId === input.user.tenantId,
  );

  if (!conversation) {
    return null;
  }

  const message = {
    id: randomUUID(),
    tenantId: conversation.tenantId,
    conversationId: conversation.id,
    senderType: "AGENT" as const,
    senderUserId: input.user.userId,
    body: input.body,
    createdAt: isoNow(),
  };

  store.messages.push(message);
  conversation.lastMessageAt = message.createdAt;
  await writeDevStore(store);
  return message;
}
