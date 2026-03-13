import { NextResponse } from "next/server";
import { widgetSettingsSchema } from "@chacho/validation/widget";
import { getSessionUser } from "@/lib/auth";
import { getTenantPrimaryWidget, updateTenantWidgetSettings } from "@/lib/widget-service";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const widget = await getTenantPrimaryWidget(session.tenantId);

  if (!widget) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  return NextResponse.json({ widget });
}

export async function PUT(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = widgetSettingsSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid widget settings payload",
        issues: result.error.flatten(),
      },
      { status: 400 },
    );
  }

  const currentWidget = await getTenantPrimaryWidget(session.tenantId);

  if (!currentWidget) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  const widget = await updateTenantWidgetSettings(session.tenantId, currentWidget.id, result.data);

  if (!widget) {
    return NextResponse.json({ error: "Unable to update widget" }, { status: 404 });
  }

  return NextResponse.json({ widget });
}
