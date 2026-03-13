import { NextResponse } from "next/server";
import { createConversation } from "@/lib/chat-service";
import { publicOptionsResponse, withPublicCorsHeaders } from "@/lib/http";

interface RouteContext {
  params: Promise<{
    widgetKey: string;
  }>;
}

export function OPTIONS() {
  return publicOptionsResponse();
}

export async function POST(request: Request, context: RouteContext) {
  const { widgetKey } = await context.params;
  const body = await request.json();

  const browserToken = String(body.browserToken ?? "");
  const sourceUrl = String(body.page?.url ?? "");
  const sourceTitle = String(body.page?.title ?? "");

  if (!browserToken || !sourceUrl || !sourceTitle) {
    return NextResponse.json({ error: "Missing conversation fields" }, withPublicCorsHeaders({ status: 400 }));
  }

  const conversation = await createConversation({
    widgetKey,
    browserToken,
    sourceUrl,
    sourceTitle,
  });

  if (!conversation) {
    return NextResponse.json({ error: "Unable to create conversation" }, withPublicCorsHeaders({ status: 404 }));
  }

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      status: conversation.status,
    },
  }, withPublicCorsHeaders());
}
