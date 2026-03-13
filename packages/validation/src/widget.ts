import { z } from "zod";

export const widgetThemeSchema = z.object({
  primaryColor: z.string().min(4).max(32),
  position: z.enum(["left", "right"]),
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(160),
  logoUrl: z.string().url().optional(),
  headerImageUrl: z.string().url().optional(),
  footerImageUrl: z.string().url().optional(),
});

export const widgetConfiguratorSchema = z.object({
  widgetFontFamily: z.string().min(1).max(120),
  widgetFontSize: z.string().regex(/^\d{1,2}$/),
  accentColor: z.string().min(4).max(32),
  headerFillMode: z.enum(["solid", "gradient"]),
  headerColor: z.string().min(4).max(32),
  headerGradientStart: z.string().min(4).max(32),
  headerGradientEnd: z.string().min(4).max(32),
  headerGradientAngle: z.enum(["90", "135", "180", "225"]),
  headerTextColor: z.string().min(4).max(32),
  bodyColor: z.string().min(4).max(32),
  welcomeTextColor: z.string().min(4).max(32),
  responseTextColor: z.string().min(4).max(32),
  composerColor: z.string().min(4).max(32),
});

export const widgetSettingsSchema = z.object({
  name: z.string().min(1).max(80),
  isActive: z.boolean(),
  domainAllowlist: z.array(z.string().min(1).max(255)).max(50),
  theme: widgetThemeSchema.extend({
    configurator: widgetConfiguratorSchema,
  }),
});

export const widgetSessionSchema = z.object({
  browserToken: z.string().min(8).max(255),
  page: z.object({
    url: z.string().url(),
    title: z.string().min(1).max(200),
    referrer: z.string().optional(),
  }),
  visitor: z.object({
    name: z.string().max(80).nullable(),
    email: z.string().email().nullable(),
  }),
});
