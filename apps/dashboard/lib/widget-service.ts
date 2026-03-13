import { prisma } from "@chacho/db";
import type { WidgetTheme } from "@chacho/types/chat";
import { getMockWidgetByKey } from "@/lib/mock-widget";

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

type FillMode = "solid" | "gradient";

export interface WidgetConfiguratorSettings {
  widgetFontFamily: string;
  widgetFontSize: string;
  accentColor: string;
  headerFillMode: FillMode;
  headerColor: string;
  headerGradientStart: string;
  headerGradientEnd: string;
  headerGradientAngle: "90" | "135" | "180" | "225";
  headerTextColor: string;
  bodyColor: string;
  welcomeTextColor: string;
  responseTextColor: string;
  composerColor: string;
}

export interface TenantWidgetSettings {
  id: string;
  tenantId: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  domainAllowlist: string[];
  theme: WidgetTheme & {
    configurator: WidgetConfiguratorSettings;
  };
}

const defaultConfiguratorSettings: WidgetConfiguratorSettings = {
  widgetFontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  widgetFontSize: "14",
  accentColor: "#D8891C",
  headerFillMode: "gradient",
  headerColor: "#202734",
  headerGradientStart: "#202734",
  headerGradientEnd: "#3C4E68",
  headerGradientAngle: "135",
  headerTextColor: "#F5F7FB",
  bodyColor: "#FCFCFD",
  welcomeTextColor: "#172033",
  responseTextColor: "#FFFFFF",
  composerColor: "#EEF2F7",
};

const defaultWidgetTheme: TenantWidgetSettings["theme"] = {
  primaryColor: "#c86b3c",
  position: "right",
  title: "Chat with us",
  subtitle: "We usually reply within a few minutes.",
  configurator: defaultConfiguratorSettings,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseThemeJson(rawTheme: unknown): TenantWidgetSettings["theme"] {
  if (!isObject(rawTheme)) {
    return defaultWidgetTheme;
  }

  const configuratorRaw = isObject(rawTheme.configurator) ? rawTheme.configurator : {};

  return {
    primaryColor:
      typeof rawTheme.primaryColor === "string" ? rawTheme.primaryColor : defaultWidgetTheme.primaryColor,
    position: rawTheme.position === "left" ? "left" : "right",
    title: typeof rawTheme.title === "string" ? rawTheme.title : defaultWidgetTheme.title,
    subtitle: typeof rawTheme.subtitle === "string" ? rawTheme.subtitle : defaultWidgetTheme.subtitle,
    ...(typeof rawTheme.logoUrl === "string" ? { logoUrl: rawTheme.logoUrl } : {}),
    ...(typeof rawTheme.headerImageUrl === "string" ? { headerImageUrl: rawTheme.headerImageUrl } : {}),
    ...(typeof rawTheme.footerImageUrl === "string" ? { footerImageUrl: rawTheme.footerImageUrl } : {}),
    configurator: {
      widgetFontFamily:
        typeof configuratorRaw.widgetFontFamily === "string"
          ? configuratorRaw.widgetFontFamily
          : defaultConfiguratorSettings.widgetFontFamily,
      widgetFontSize:
        typeof configuratorRaw.widgetFontSize === "string"
          ? configuratorRaw.widgetFontSize
          : defaultConfiguratorSettings.widgetFontSize,
      accentColor:
        typeof configuratorRaw.accentColor === "string"
          ? configuratorRaw.accentColor
          : defaultConfiguratorSettings.accentColor,
      headerFillMode:
        configuratorRaw.headerFillMode === "solid" ? "solid" : defaultConfiguratorSettings.headerFillMode,
      headerColor:
        typeof configuratorRaw.headerColor === "string"
          ? configuratorRaw.headerColor
          : defaultConfiguratorSettings.headerColor,
      headerGradientStart:
        typeof configuratorRaw.headerGradientStart === "string"
          ? configuratorRaw.headerGradientStart
          : defaultConfiguratorSettings.headerGradientStart,
      headerGradientEnd:
        typeof configuratorRaw.headerGradientEnd === "string"
          ? configuratorRaw.headerGradientEnd
          : defaultConfiguratorSettings.headerGradientEnd,
      headerGradientAngle:
        configuratorRaw.headerGradientAngle === "90" ||
        configuratorRaw.headerGradientAngle === "135" ||
        configuratorRaw.headerGradientAngle === "180" ||
        configuratorRaw.headerGradientAngle === "225"
          ? configuratorRaw.headerGradientAngle
          : defaultConfiguratorSettings.headerGradientAngle,
      headerTextColor:
        typeof configuratorRaw.headerTextColor === "string"
          ? configuratorRaw.headerTextColor
          : defaultConfiguratorSettings.headerTextColor,
      bodyColor:
        typeof configuratorRaw.bodyColor === "string"
          ? configuratorRaw.bodyColor
          : defaultConfiguratorSettings.bodyColor,
      welcomeTextColor:
        typeof configuratorRaw.welcomeTextColor === "string"
          ? configuratorRaw.welcomeTextColor
          : defaultConfiguratorSettings.welcomeTextColor,
      responseTextColor:
        typeof configuratorRaw.responseTextColor === "string"
          ? configuratorRaw.responseTextColor
          : defaultConfiguratorSettings.responseTextColor,
      composerColor:
        typeof configuratorRaw.composerColor === "string"
          ? configuratorRaw.composerColor
          : defaultConfiguratorSettings.composerColor,
    },
  };
}

function mapWidgetRecord(widget: {
  id: string;
  tenantId: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  domainAllowlist: unknown;
  themeJson?: unknown;
  theme?: unknown;
}): TenantWidgetSettings {
  return {
    id: widget.id,
    tenantId: widget.tenantId,
    name: widget.name,
    publicKey: widget.publicKey,
    isActive: widget.isActive,
    domainAllowlist: Array.isArray(widget.domainAllowlist) ? widget.domainAllowlist.filter((value): value is string => typeof value === "string") : [],
    theme: parseThemeJson(widget.themeJson ?? widget.theme),
  };
}

export async function findWidgetByPublicKey(widgetKey: string) {
  if (!isDatabaseConfigured()) {
    const widget = getMockWidgetByKey(widgetKey);
    return widget ? mapWidgetRecord(widget) : null;
  }

  const widget = await prisma.widget.findUnique({
    where: {
      publicKey: widgetKey,
    },
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

  return mapWidgetRecord(widget);
}

export async function getTenantPrimaryWidget(tenantId: string): Promise<TenantWidgetSettings | null> {
  if (!isDatabaseConfigured()) {
    const widget = getMockWidgetByKey("local_dev_widget");
    return widget && widget.tenantId === tenantId ? mapWidgetRecord(widget) : null;
  }

  const widget = await prisma.widget.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
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

  return widget ? mapWidgetRecord(widget) : null;
}

export async function updateTenantWidgetSettings(
  tenantId: string,
  widgetId: string,
  input: Pick<TenantWidgetSettings, "name" | "isActive" | "domainAllowlist" | "theme">,
): Promise<TenantWidgetSettings | null> {
  if (!isDatabaseConfigured()) {
    const widget = getMockWidgetByKey("local_dev_widget");

    if (!widget || widget.id !== widgetId || widget.tenantId !== tenantId) {
      return null;
    }

    return {
      ...mapWidgetRecord(widget),
      name: input.name,
      isActive: input.isActive,
      domainAllowlist: input.domainAllowlist,
      theme: input.theme,
    };
  }

  const widget = await prisma.widget.updateMany({
    where: {
      id: widgetId,
      tenantId,
    },
    data: {
      name: input.name,
      isActive: input.isActive,
      domainAllowlist: input.domainAllowlist,
      themeJson: JSON.parse(JSON.stringify(input.theme)) as never,
    },
  });

  if (widget.count === 0) {
    return null;
  }

  return getTenantPrimaryWidget(tenantId);
}
