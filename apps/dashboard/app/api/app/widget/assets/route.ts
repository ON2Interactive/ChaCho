import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { uploadWidgetAsset } from "@/lib/supabase-storage";
import { getTenantPrimaryWidget, updateTenantWidgetSettings } from "@/lib/widget-service";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const maxFileSizeBytes = 5 * 1024 * 1024;

type AssetKind = "logo" | "header" | "footer";

function isAssetKind(value: FormDataEntryValue | null): value is AssetKind {
  return value === "logo" || value === "header" || value === "footer";
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const widget = await getTenantPrimaryWidget(session.tenantId);

  if (!widget) {
    return NextResponse.json({ error: "Widget not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const kind = formData.get("kind");
  const file = formData.get("file");

  if (!isAssetKind(kind)) {
    return NextResponse.json({ error: "Asset kind is required" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  if (file.size > maxFileSizeBytes) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  try {
    const upload = await uploadWidgetAsset({
      tenantId: session.tenantId,
      widgetId: widget.id,
      file,
      kind,
    });

    const nextTheme = {
      ...widget.theme,
      ...(kind === "logo" ? { logoUrl: upload.publicUrl } : {}),
      ...(kind === "header" ? { headerImageUrl: upload.publicUrl } : {}),
      ...(kind === "footer" ? { footerImageUrl: upload.publicUrl } : {}),
    };

    const updatedWidget = await updateTenantWidgetSettings(session.tenantId, widget.id, {
      name: widget.name,
      isActive: widget.isActive,
      domainAllowlist: widget.domainAllowlist,
      theme: nextTheme,
    });

    if (!updatedWidget) {
      return NextResponse.json({ error: `Unable to update widget ${kind} asset` }, { status: 500 });
    }

    return NextResponse.json({
      kind,
      assetUrl: upload.publicUrl,
      widget: updatedWidget,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload asset",
      },
      { status: 500 },
    );
  }
}
