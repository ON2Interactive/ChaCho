import { NextResponse } from "next/server";
import { createAgentMessage } from "@/lib/chat-service";
import { getSessionUser } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;
  const formData = await request.formData();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return NextResponse.redirect(new URL(`/app?conversationId=${conversationId}`, request.url));
  }

  await createAgentMessage({
    conversationId,
    body,
    user: session,
  });

  return NextResponse.redirect(new URL(`/app?conversationId=${conversationId}`, request.url));
}

