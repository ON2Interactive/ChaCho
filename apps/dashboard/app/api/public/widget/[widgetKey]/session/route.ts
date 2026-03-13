import { NextResponse } from "next/server";
import { widgetSessionSchema } from "@chacho/validation/widget";
import { createWidgetSession, getWidgetByPublicKey } from "@/lib/chat-service";
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
  const widget = await getWidgetByPublicKey(widgetKey);

  if (!widget || !widget.isActive) {
    return NextResponse.json({ error: "Widget not found" }, withPublicCorsHeaders({ status: 404 }));
  }

  const body = await request.json();
  const result = widgetSessionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid widget session payload",
        issues: result.error.flatten(),
      },
      withPublicCorsHeaders({ status: 400 }),
    );
  }

  const session = await createWidgetSession({
    widgetKey,
    browserToken: result.data.browserToken,
    visitorName: result.data.visitor.name,
    visitorEmail: result.data.visitor.email,
    pageUrl: result.data.page.url,
    pageTitle: result.data.page.title,
  });

  if (!session) {
    return NextResponse.json({ error: "Unable to create widget session" }, withPublicCorsHeaders({ status: 500 }));
  }

  return NextResponse.json(session, withPublicCorsHeaders());
}
