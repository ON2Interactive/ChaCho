import { NextResponse } from "next/server";
import { findWidgetByPublicKey } from "@/lib/widget-service";
import { publicOptionsResponse, withPublicCorsHeaders } from "@/lib/http";

interface RouteContext {
  params: Promise<{
    widgetKey: string;
  }>;
}

export function OPTIONS() {
  return publicOptionsResponse();
}

export async function GET(_: Request, context: RouteContext) {
  const { widgetKey } = await context.params;
  const widget = await findWidgetByPublicKey(widgetKey);

  if (!widget || !widget.isActive) {
    return NextResponse.json({ error: "Widget not found" }, withPublicCorsHeaders({ status: 404 }));
  }

  return NextResponse.json({
    widget: {
      id: widget.id,
      name: widget.name,
      theme: widget.theme,
    },
  }, withPublicCorsHeaders());
}
