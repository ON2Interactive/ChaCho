import { randomUUID } from "node:crypto";

function getRequiredEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "SUPABASE_STORAGE_BUCKET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getFileExtension(contentType: string, originalName: string) {
  const fromName = originalName.includes(".") ? originalName.split(".").pop()?.toLowerCase() : null;

  if (fromName) {
    return fromName;
  }

  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/svg+xml") return "svg";

  return "bin";
}

export async function uploadWidgetAsset(input: {
  tenantId: string;
  widgetId: string;
  file: File;
  kind: "logo" | "header" | "footer";
}) {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = getRequiredEnv("SUPABASE_STORAGE_BUCKET");

  const extension = getFileExtension(input.file.type, input.file.name);
  const path = `tenants/${input.tenantId}/widgets/${input.widgetId}/${input.kind}-${randomUUID()}.${extension}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
  const body = Buffer.from(await input.file.arrayBuffer());

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": input.file.type,
      "x-upsert": "true",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase upload failed: ${errorText}`);
  }

  return {
    path,
    publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,
  };
}
