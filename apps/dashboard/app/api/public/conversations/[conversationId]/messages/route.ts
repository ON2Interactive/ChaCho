import { NextResponse } from "next/server";
import { createVisitorMessage, listConversationMessages } from "@/lib/chat-service";
import { publicOptionsResponse, withPublicCorsHeaders } from "@/lib/http";

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export function OPTIONS() {
  return publicOptionsResponse();
}

export async function GET(_: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  const messages = await listConversationMessages(conversationId);
  return NextResponse.json({ messages }, withPublicCorsHeaders());
}

export async function POST(request: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  const body = await request.json();
  const messageBody = String(body.body ?? "").trim();

  if (!messageBody) {
    return NextResponse.json({ error: "Message body is required" }, withPublicCorsHeaders({ status: 400 }));
  }

  const message = await createVisitorMessage({
    conversationId,
    body: messageBody,
  });

  if (!message) {
    return NextResponse.json({ error: "Conversation not found" }, withPublicCorsHeaders({ status: 404 }));
  }

  return NextResponse.json({
    message: {
      id: message.id,
      senderType: message.senderType,
      body: message.body,
      createdAt: message.createdAt,
    },
  }, withPublicCorsHeaders());
}
