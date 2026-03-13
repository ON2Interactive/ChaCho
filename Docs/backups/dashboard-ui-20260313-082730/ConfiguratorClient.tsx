"use client";

import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import type { TenantWidgetSettings } from "@/lib/widget-service";

type FillMode = "solid" | "gradient";
type OpenMenu = "branding" | "content" | "design" | "fonts" | null;
type LogoShape = "rounded" | "circle";
type ImagePosition = "cover" | "top" | "center";

interface AssistantThemeState {
  title: string;
  instructions: string;
  welcomeMessage: string;
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
  logoEnabled: boolean;
  logoSrc: string | null;
  logoShape: LogoShape;
  headerImageEnabled: boolean;
  headerImageSrc: string | null;
  headerImagePosition: ImagePosition;
  footerImageEnabled: boolean;
  footerImageSrc: string | null;
  footerImagePosition: ImagePosition;
  knowledgeFiles: string[];
}

interface Assistant extends AssistantThemeState {
  id: string;
  name: string;
  description: string;
  date: string;
}

interface ConfiguratorClientProps {
  tenantName: string;
  initialWidget: TenantWidgetSettings | null;
}

const fontOptions = [
  { label: "Helvetica", value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", sans-serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Palatino", value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: "Gill Sans", value: '"Gill Sans", "Gill Sans MT", sans-serif' },
  { label: "Courier New", value: '"Courier New", monospace' },
];

const defaultPreview: AssistantThemeState = {
  title: "ChaCho Concierge",
  instructions: "Helpful, calm, concise. Prioritize reservations, opening hours, and guest questions.",
  welcomeMessage: "Ask about services, menus, and reservations.",
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
  responseTextColor: "#FCFCFC",
  composerColor: "#EEF2F7",
  logoEnabled: false,
  logoSrc: null,
  logoShape: "rounded",
  headerImageEnabled: false,
  headerImageSrc: null,
  headerImagePosition: "cover",
  footerImageEnabled: false,
  footerImageSrc: null,
  footerImagePosition: "center",
  knowledgeFiles: [],
};

function makeThemeAsset(prompt: string, placement: "header" | "footer") {
  const hue = Array.from(prompt).reduce((sum, char) => sum + char.charCodeAt(0), placement === "header" ? 120 : 220) % 360;
  const start = `hsl(${hue} 42% 24%)`;
  const end = `hsl(${(hue + 28) % 360} 30% 10%)`;
  const accent = `hsla(${(hue + 54) % 360} 92% 76% / 0.42)`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700" viewBox="0 0 1600 700">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
        <radialGradient id="glow" cx="75%" cy="20%" r="70%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#bg)" />
      <rect width="1600" height="700" fill="url(#glow)" />
      <g opacity="${placement === "header" ? "0.42" : "0.3"}" stroke="rgba(255,255,255,0.18)" fill="none">
        <path d="M-40 540 C 220 330, 430 650, 760 420 S 1270 160, 1640 330" stroke-width="2" />
        <path d="M-40 610 C 240 380, 510 700, 840 480 S 1310 240, 1640 420" stroke-width="1.6" />
      </g>
      <g opacity="0.2">
        <circle cx="1260" cy="150" r="210" fill="${accent}" />
        <circle cx="250" cy="620" r="240" fill="${accent}" />
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const mockAssistants: Assistant[] = [
  {
    id: "concierge",
    name: "ChaCho Concierge",
    description: "Warm front-desk tone for reservations, menus, and service questions.",
    date: "March 4, 2026",
    ...defaultPreview,
  },
  {
    id: "reservations",
    name: "Reservations Desk",
    description: "Booking-first assistant with elegant hospitality styling and faster call-to-action focus.",
    date: "March 4, 2026",
    ...defaultPreview,
    title: "Reservations Desk",
    welcomeMessage: "I can help with table bookings, private dining, and availability.",
    bodyColor: "#1E1E1C",
    welcomeTextColor: "#FFFFFF",
    responseTextColor: "#FCFCFC",
    composerColor: "#FFFFFF",
    accentColor: "#0E0901",
    headerImageEnabled: true,
    headerImageSrc: makeThemeAsset("luxury hospitality reservations", "header"),
    footerImageEnabled: true,
    footerImageSrc: makeThemeAsset("luxury hospitality reservations", "footer"),
  },
  {
    id: "vip",
    name: "VIP Stylist",
    description: "Editorial assistant for premium presentation, styling help, and curated brand moments.",
    date: "March 3, 2026",
    ...defaultPreview,
    title: "VIP Stylist",
    welcomeMessage: "Ask about styling, collections, custom requests, and private appointments.",
    headerFillMode: "solid",
    headerColor: "#14161F",
    accentColor: "#C7A76A",
    composerColor: "#F6F0E8",
  },
];

function normalizeHex(value: string, fallback: string) {
  const trimmed = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const expanded = trimmed
      .slice(1)
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded}`.toUpperCase();
  }

  return fallback.toUpperCase();
}

function angleToCss(angle: AssistantThemeState["headerGradientAngle"]) {
  switch (angle) {
    case "90":
      return "90deg";
    case "180":
      return "180deg";
    case "225":
      return "225deg";
    case "135":
    default:
      return "135deg";
  }
}

function positionToCss(position: ImagePosition) {
  switch (position) {
    case "top":
      return "center top";
    case "center":
      return "center center";
    case "cover":
    default:
      return "center center";
  }
}

function copyAssistantTheme(assistant: Assistant): AssistantThemeState {
  return {
    title: assistant.title,
    instructions: assistant.instructions,
    welcomeMessage: assistant.welcomeMessage,
    widgetFontFamily: assistant.widgetFontFamily,
    widgetFontSize: assistant.widgetFontSize,
    accentColor: assistant.accentColor,
    headerFillMode: assistant.headerFillMode,
    headerColor: assistant.headerColor,
    headerGradientStart: assistant.headerGradientStart,
    headerGradientEnd: assistant.headerGradientEnd,
    headerGradientAngle: assistant.headerGradientAngle,
    headerTextColor: assistant.headerTextColor,
    bodyColor: assistant.bodyColor,
    welcomeTextColor: assistant.welcomeTextColor,
    responseTextColor: assistant.responseTextColor,
    composerColor: assistant.composerColor,
    logoEnabled: assistant.logoEnabled,
    logoSrc: assistant.logoSrc,
    logoShape: assistant.logoShape,
    headerImageEnabled: assistant.headerImageEnabled,
    headerImageSrc: assistant.headerImageSrc,
    headerImagePosition: assistant.headerImagePosition,
    footerImageEnabled: assistant.footerImageEnabled,
    footerImageSrc: assistant.footerImageSrc,
    footerImagePosition: assistant.footerImagePosition,
    knowledgeFiles: assistant.knowledgeFiles,
  };
}

function ColorControl({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const inputId = useId();

  return (
    <label className="workspace-control-field" htmlFor={inputId}>
      <span className="workspace-control-label">{label}</span>
      <div className="workspace-color-control">
        <input
          aria-label={label}
          className="workspace-color-swatch"
          type="color"
          value={value}
          onChange={(event) => onCommit(event.target.value.toUpperCase())}
          onInput={(event) => onCommit((event.target as HTMLInputElement).value.toUpperCase())}
        />
        <input
          id={inputId}
          className="workspace-control-input workspace-color-hex-input"
          value={value}
          onChange={(event) => onCommit(event.target.value)}
          onBlur={(event) => onCommit(normalizeHex(event.target.value, value))}
        />
      </div>
    </label>
  );
}

export default function ConfiguratorClient({ tenantName, initialWidget }: ConfiguratorClientProps) {
  const initialAssistant = mockAssistants[0];

  const [assistants, setAssistants] = useState<Assistant[]>(mockAssistants);
  const [currentAssistantId, setCurrentAssistantId] = useState(initialAssistant.id);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [isAssistantsModalOpen, setIsAssistantsModalOpen] = useState(false);
  const [isCreateAssistantModalOpen, setIsCreateAssistantModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [preview, setPreview] = useState<AssistantThemeState>(() => {
    const widgetConfigurator = initialWidget?.theme.configurator;

    return {
      ...copyAssistantTheme(initialAssistant),
      ...(initialWidget
        ? {
            title: initialWidget.theme.title,
            welcomeMessage: initialWidget.theme.subtitle,
            widgetFontFamily: widgetConfigurator?.widgetFontFamily ?? defaultPreview.widgetFontFamily,
            widgetFontSize: widgetConfigurator?.widgetFontSize ?? defaultPreview.widgetFontSize,
            accentColor: widgetConfigurator?.accentColor ?? defaultPreview.accentColor,
            headerFillMode: widgetConfigurator?.headerFillMode ?? defaultPreview.headerFillMode,
            headerColor: widgetConfigurator?.headerColor ?? defaultPreview.headerColor,
            headerGradientStart: widgetConfigurator?.headerGradientStart ?? defaultPreview.headerGradientStart,
            headerGradientEnd: widgetConfigurator?.headerGradientEnd ?? defaultPreview.headerGradientEnd,
            headerGradientAngle: widgetConfigurator?.headerGradientAngle ?? defaultPreview.headerGradientAngle,
            headerTextColor: widgetConfigurator?.headerTextColor ?? defaultPreview.headerTextColor,
            bodyColor: widgetConfigurator?.bodyColor ?? defaultPreview.bodyColor,
            welcomeTextColor: widgetConfigurator?.welcomeTextColor ?? defaultPreview.welcomeTextColor,
            responseTextColor: widgetConfigurator?.responseTextColor ?? defaultPreview.responseTextColor,
            composerColor: widgetConfigurator?.composerColor ?? defaultPreview.composerColor,
            logoSrc: initialWidget.theme.logoUrl ?? defaultPreview.logoSrc,
            headerImageSrc: initialWidget.theme.headerImageUrl ?? defaultPreview.headerImageSrc,
            footerImageSrc: initialWidget.theme.footerImageUrl ?? defaultPreview.footerImageSrc,
          }
        : {}),
    };
  });
  const [draftAssistantName, setDraftAssistantName] = useState("Front Desk Concierge");
  const [draftInstructions, setDraftInstructions] = useState(defaultPreview.instructions);
  const [draftWelcomeMessage, setDraftWelcomeMessage] = useState(defaultPreview.welcomeMessage);
  const [themePrompt, setThemePrompt] = useState("");

  const knowledgeInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const headerImageInputRef = useRef<HTMLInputElement | null>(null);
  const footerImageInputRef = useRef<HTMLInputElement | null>(null);

  const currentAssistant = assistants.find((assistant) => assistant.id === currentAssistantId) ?? assistants[0];
  const currentFontSize = Number(preview.widgetFontSize);
  const previewHeaderBackground = preview.headerImageEnabled && preview.headerImageSrc
    ? `linear-gradient(0deg, rgba(7, 10, 14, 0.34), rgba(7, 10, 14, 0.34)), url("${preview.headerImageSrc}") ${positionToCss(preview.headerImagePosition)} / cover no-repeat`
    : preview.headerFillMode === "solid"
      ? preview.headerColor
      : `linear-gradient(${angleToCss(preview.headerGradientAngle)}, ${preview.headerGradientStart}, ${preview.headerGradientEnd})`;
  const previewFooterBackground = preview.footerImageEnabled && preview.footerImageSrc
    ? `linear-gradient(0deg, rgba(7, 10, 14, 0.44), rgba(7, 10, 14, 0.32)), url("${preview.footerImageSrc}") ${positionToCss(preview.footerImagePosition)} / cover no-repeat`
    : preview.composerColor;

  function setPreviewField<K extends keyof AssistantThemeState>(key: K, value: AssistantThemeState[K]) {
    setPreview((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function loadAssistant(assistantId: string) {
    const assistant = assistants.find((entry) => entry.id === assistantId);

    if (!assistant) {
      return;
    }

    setCurrentAssistantId(assistant.id);
    setPreview(copyAssistantTheme(assistant));
    setIsAssistantsModalOpen(false);
    setOpenMenu(null);
  }

  function persistCurrentAssistant() {
    if (!currentAssistant) {
      return;
    }

    setAssistants((current) =>
      current.map((assistant) =>
        assistant.id === currentAssistant.id
          ? {
              ...assistant,
              ...preview,
              name: preview.title,
              description: preview.instructions,
            }
          : assistant,
      ),
    );
    setSavePulse(true);
    window.setTimeout(() => setSavePulse(false), 900);
  }

  function handleAssistantCreate() {
    const created: Assistant = {
      id: `assistant-${Date.now()}`,
      name: draftAssistantName.trim() || "New Assistant",
      description: draftInstructions.trim() || defaultPreview.instructions,
      date: new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
      ...defaultPreview,
      title: draftAssistantName.trim() || "New Assistant",
      instructions: draftInstructions.trim() || defaultPreview.instructions,
      welcomeMessage: draftWelcomeMessage.trim() || defaultPreview.welcomeMessage,
    };

    setAssistants((current) => [created, ...current]);
    setCurrentAssistantId(created.id);
    setPreview(copyAssistantTheme(created));
    setIsCreateAssistantModalOpen(false);
    setDraftAssistantName("Front Desk Concierge");
    setDraftInstructions(defaultPreview.instructions);
    setDraftWelcomeMessage(defaultPreview.welcomeMessage);
  }

  function applyThemeFromPrompt() {
    const prompt = themePrompt.trim().toLowerCase();

    if (!prompt) {
      return;
    }

    const luxury = prompt.includes("luxury") || prompt.includes("hotel") || prompt.includes("editorial");
    const warm = prompt.includes("warm") || prompt.includes("sunset") || prompt.includes("hospitality");
    const minimal = prompt.includes("minimal") || prompt.includes("clean") || prompt.includes("monochrome");

    const nextTheme: Partial<AssistantThemeState> = luxury
      ? {
          headerFillMode: "gradient",
          headerGradientStart: "#181514",
          headerGradientEnd: "#6D5844",
          bodyColor: "#1B1A18",
          welcomeTextColor: "#F7F3EE",
          responseTextColor: "#FFF7EC",
          composerColor: "#F6F0E8",
          accentColor: "#D7B47A",
        }
      : warm
        ? {
            headerFillMode: "gradient",
            headerGradientStart: "#5E3421",
            headerGradientEnd: "#D8891C",
            bodyColor: "#F5E8D8",
            welcomeTextColor: "#38281D",
            responseTextColor: "#FFF8EF",
            composerColor: "#FFF7EF",
            accentColor: "#D8891C",
          }
        : minimal
          ? {
              headerFillMode: "solid",
              headerColor: "#111318",
              bodyColor: "#F7F8FA",
              welcomeTextColor: "#111827",
              responseTextColor: "#F8FAFC",
              composerColor: "#FFFFFF",
              accentColor: "#1F2937",
            }
          : {
              headerFillMode: "gradient",
              headerGradientStart: "#1C2433",
              headerGradientEnd: "#465B7C",
              bodyColor: "#0F1218",
              welcomeTextColor: "#F8FAFC",
              responseTextColor: "#FFFFFF",
              composerColor: "#F5F7FB",
              accentColor: "#E5A640",
            };

    setPreview((current) => ({
      ...current,
      ...nextTheme,
      headerImageEnabled: true,
      footerImageEnabled: true,
      headerImageSrc: makeThemeAsset(prompt, "header"),
      footerImageSrc: makeThemeAsset(prompt, "footer"),
    }));
    setThemePrompt("");
    setIsThemeModalOpen(false);
  }

  function handleUpload(
    file: File | null,
    apply: (url: string) => void,
  ) {
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    apply(url);
  }

  function handleKnowledgeUpload(files: FileList | null) {
    if (!files || !currentAssistant) {
      return;
    }

    const names = Array.from(files).map((file) => file.name);
    const nextFiles = [...preview.knowledgeFiles, ...names];
    setPreviewField("knowledgeFiles", nextFiles);
    setAssistants((current) =>
      current.map((assistant) =>
        assistant.id === currentAssistant.id
          ? {
              ...assistant,
              knowledgeFiles: nextFiles,
            }
          : assistant,
      ),
    );
  }

  const labelTextStyle = { fontFamily: preview.widgetFontFamily, fontSize: `${currentFontSize}px` };
  const responseTextStyle = {
    fontFamily: preview.widgetFontFamily,
    fontSize: `${currentFontSize}px`,
    color: preview.responseTextColor,
  };
  const welcomeTextStyle = {
    fontFamily: preview.widgetFontFamily,
    fontSize: `${currentFontSize}px`,
    color: preview.welcomeTextColor,
  };

  return (
    <>
      <div className="workspace-shell">
        <header className="workspace-header">
          <div className="workspace-header-actions">
            <button
              aria-label="Theme with AI"
              className="workspace-toolbar-icon"
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
            >
              <WandIcon />
            </button>
            <button
              aria-label="Save assistant"
              className={`workspace-toolbar-icon${savePulse ? " is-saved" : ""}`}
              type="button"
              onClick={persistCurrentAssistant}
            >
              <SaveIcon />
            </button>
            <button
              aria-label="Create assistant"
              className="workspace-toolbar-icon"
              type="button"
              onClick={() => setIsCreateAssistantModalOpen(true)}
            >
              <PlusIcon />
            </button>
          </div>
        </header>

        <div className="workspace-layout-frame">
          <aside className="workspace-sidebar">
            <div className="workspace-nav-shell">
              <div className="workspace-sidebar-topbar">
                <input
                  ref={knowledgeInputRef}
                  className="workspace-file-input"
                  type="file"
                  multiple
                  onChange={(event) => handleKnowledgeUpload(event.target.files)}
                />
                <button
                  aria-label="Upload knowledge"
                  className="workspace-add-button"
                  disabled={!currentAssistant}
                  style={!currentAssistant ? { opacity: 0.36, cursor: "not-allowed" } : undefined}
                  type="button"
                  onClick={() => knowledgeInputRef.current?.click()}
                >
                  <UploadIcon />
                </button>
              </div>

              <div className="workspace-nav-group">
                <button
                  className={`workspace-nav-item${isAssistantsModalOpen ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setIsAssistantsModalOpen(true)}
                >
                  <span>Assistants</span>
                </button>

                <div className="workspace-nav-divider" />

                <AccordionSection
                  isOpen={openMenu === "branding"}
                  label="Branding"
                  onToggle={() => setOpenMenu((current) => (current === "branding" ? null : "branding"))}
                >
                  <div className="workspace-control-group">
                    <p className="workspace-control-group-label">Brand Assets</p>

                    <div className="workspace-control-field">
                      <div className="workspace-branding-row">
                        <div className="workspace-branding-copy">
                          <span className="workspace-control-label">Logo</span>
                          <span className="workspace-branding-caption">Small mark in the header.</span>
                        </div>
                        <input
                          ref={logoInputRef}
                          className="workspace-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleUpload(event.target.files?.[0] ?? null, (url) => {
                              setPreview((current) => ({
                                ...current,
                                logoEnabled: true,
                                logoSrc: url,
                              }));
                            })
                          }
                        />
                        <button className="workspace-branding-upload" type="button" onClick={() => logoInputRef.current?.click()}>
                          <UploadIcon />
                        </button>
                      </div>
                      <label className="workspace-control-field workspace-control-field-inline">
                        <span className="workspace-control-label">Show Logo</span>
                        <input
                          checked={preview.logoEnabled}
                          type="checkbox"
                          onChange={(event) => setPreviewField("logoEnabled", event.target.checked)}
                        />
                      </label>
                      <label className="workspace-control-field">
                        <span className="workspace-control-label">Logo Shape</span>
                        <select
                          className="workspace-control-input"
                          value={preview.logoShape}
                          onChange={(event) => setPreviewField("logoShape", event.target.value as LogoShape)}
                        >
                          <option value="rounded">Rounded Square</option>
                          <option value="circle">Circle</option>
                        </select>
                      </label>
                      {preview.logoSrc ? (
                        <div className="workspace-branding-thumb-row">
                          <div
                            className={`workspace-branding-thumb workspace-branding-thumb-logo${preview.logoShape === "circle" ? " is-circle" : ""}`}
                          >
                            <img alt="Logo preview" src={preview.logoSrc} />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="workspace-control-field">
                      <div className="workspace-branding-row">
                        <div className="workspace-branding-copy">
                          <span className="workspace-control-label">Header Image</span>
                          <span className="workspace-branding-caption">Overrides the color or gradient fill.</span>
                        </div>
                        <input
                          ref={headerImageInputRef}
                          className="workspace-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleUpload(event.target.files?.[0] ?? null, (url) => {
                              setPreview((current) => ({
                                ...current,
                                headerImageEnabled: true,
                                headerImageSrc: url,
                              }));
                            })
                          }
                        />
                        <button
                          className="workspace-branding-upload"
                          type="button"
                          onClick={() => headerImageInputRef.current?.click()}
                        >
                          <UploadIcon />
                        </button>
                      </div>
                      <label className="workspace-control-field workspace-control-field-inline">
                        <span className="workspace-control-label">Enable Header Image</span>
                        <input
                          checked={preview.headerImageEnabled}
                          type="checkbox"
                          onChange={(event) => setPreviewField("headerImageEnabled", event.target.checked)}
                        />
                      </label>
                      <label className="workspace-control-field">
                        <span className="workspace-control-label">Header Image Position</span>
                        <select
                          className="workspace-control-input"
                          value={preview.headerImagePosition}
                          onChange={(event) => setPreviewField("headerImagePosition", event.target.value as ImagePosition)}
                        >
                          <option value="cover">Cover</option>
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                        </select>
                      </label>
                      {preview.headerImageSrc ? (
                        <div className="workspace-branding-thumb-row">
                          <div className="workspace-branding-thumb">
                            <img alt="Header image preview" src={preview.headerImageSrc} />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="workspace-control-field">
                      <div className="workspace-branding-row">
                        <div className="workspace-branding-copy">
                          <span className="workspace-control-label">Footer Image</span>
                          <span className="workspace-branding-caption">Adds a custom footer surface.</span>
                        </div>
                        <input
                          ref={footerImageInputRef}
                          className="workspace-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleUpload(event.target.files?.[0] ?? null, (url) => {
                              setPreview((current) => ({
                                ...current,
                                footerImageEnabled: true,
                                footerImageSrc: url,
                              }));
                            })
                          }
                        />
                        <button
                          className="workspace-branding-upload"
                          type="button"
                          onClick={() => footerImageInputRef.current?.click()}
                        >
                          <UploadIcon />
                        </button>
                      </div>
                      <label className="workspace-control-field workspace-control-field-inline">
                        <span className="workspace-control-label">Enable Footer Image</span>
                        <input
                          checked={preview.footerImageEnabled}
                          type="checkbox"
                          onChange={(event) => setPreviewField("footerImageEnabled", event.target.checked)}
                        />
                      </label>
                      <label className="workspace-control-field">
                        <span className="workspace-control-label">Footer Image Position</span>
                        <select
                          className="workspace-control-input"
                          value={preview.footerImagePosition}
                          onChange={(event) => setPreviewField("footerImagePosition", event.target.value as ImagePosition)}
                        >
                          <option value="cover">Cover</option>
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                        </select>
                      </label>
                      {preview.footerImageSrc ? (
                        <div className="workspace-branding-thumb-row">
                          <div className="workspace-branding-thumb">
                            <img alt="Footer image preview" src={preview.footerImageSrc} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection
                  isOpen={openMenu === "content"}
                  label="Content"
                  onToggle={() => setOpenMenu((current) => (current === "content" ? null : "content"))}
                >
                  <div className="workspace-control-group">
                    <p className="workspace-control-group-label">Assistant Content</p>
                    <label className="workspace-control-field">
                      <span className="workspace-control-label">Title</span>
                      <input
                        className="workspace-control-input"
                        value={preview.title}
                        onChange={(event) => setPreviewField("title", event.target.value)}
                        onInput={(event) => setPreviewField("title", (event.target as HTMLInputElement).value)}
                      />
                    </label>
                    <label className="workspace-control-field">
                      <span className="workspace-control-label">Welcome Message</span>
                      <textarea
                        className="workspace-control-input workspace-control-textarea"
                        value={preview.welcomeMessage}
                        onChange={(event) => setPreviewField("welcomeMessage", event.target.value)}
                        onInput={(event) => setPreviewField("welcomeMessage", (event.target as HTMLTextAreaElement).value)}
                      />
                    </label>
                  </div>
                </AccordionSection>

                <AccordionSection
                  isOpen={openMenu === "design"}
                  label="Design"
                  onToggle={() => setOpenMenu((current) => (current === "design" ? null : "design"))}
                >
                  <div className="workspace-control-group">
                    <p className="workspace-control-group-label">Color Theme</p>

                    <label className="workspace-control-field">
                      <span className="workspace-control-label">Header Fill</span>
                      <select
                        className="workspace-control-input"
                        value={preview.headerFillMode}
                        onChange={(event) => setPreviewField("headerFillMode", event.target.value as FillMode)}
                      >
                        <option value="solid">Solid</option>
                        <option value="gradient">Gradient</option>
                      </select>
                    </label>

                    {preview.headerFillMode === "gradient" ? (
                      <label className="workspace-control-field">
                        <span className="workspace-control-label">Header Gradient Angle</span>
                        <select
                          className="workspace-control-input"
                          value={preview.headerGradientAngle}
                          onChange={(event) =>
                            setPreviewField(
                              "headerGradientAngle",
                              event.target.value as AssistantThemeState["headerGradientAngle"],
                            )
                          }
                        >
                          <option value="90">Horizontal</option>
                          <option value="135">Diagonal</option>
                          <option value="180">Vertical</option>
                          <option value="225">Reverse Diagonal</option>
                        </select>
                      </label>
                    ) : null}

                    <ColorControl label="Header Base" value={preview.headerColor} onCommit={(value) => setPreviewField("headerColor", normalizeHex(value, preview.headerColor))} />
                    {preview.headerFillMode === "gradient" ? (
                      <>
                        <ColorControl
                          label="Header Gradient Start"
                          value={preview.headerGradientStart}
                          onCommit={(value) => setPreviewField("headerGradientStart", normalizeHex(value, preview.headerGradientStart))}
                        />
                        <ColorControl
                          label="Header Gradient End"
                          value={preview.headerGradientEnd}
                          onCommit={(value) => setPreviewField("headerGradientEnd", normalizeHex(value, preview.headerGradientEnd))}
                        />
                      </>
                    ) : null}
                    <ColorControl
                      label="Header Text"
                      value={preview.headerTextColor}
                      onCommit={(value) => setPreviewField("headerTextColor", normalizeHex(value, preview.headerTextColor))}
                    />
                    <ColorControl
                      label="Chat Background"
                      value={preview.bodyColor}
                      onCommit={(value) => setPreviewField("bodyColor", normalizeHex(value, preview.bodyColor))}
                    />
                    <ColorControl
                      label="Welcome Text"
                      value={preview.welcomeTextColor}
                      onCommit={(value) => setPreviewField("welcomeTextColor", normalizeHex(value, preview.welcomeTextColor))}
                    />
                    <ColorControl
                      label="Response Text"
                      value={preview.responseTextColor}
                      onCommit={(value) => setPreviewField("responseTextColor", normalizeHex(value, preview.responseTextColor))}
                    />
                    <ColorControl
                      label="Composer Background"
                      value={preview.composerColor}
                      onCommit={(value) => setPreviewField("composerColor", normalizeHex(value, preview.composerColor))}
                    />
                    <ColorControl
                      label="Accent Color"
                      value={preview.accentColor}
                      onCommit={(value) => setPreviewField("accentColor", normalizeHex(value, preview.accentColor))}
                    />
                  </div>
                </AccordionSection>

                <AccordionSection
                  isOpen={openMenu === "fonts"}
                  label="Fonts"
                  onToggle={() => setOpenMenu((current) => (current === "fonts" ? null : "fonts"))}
                >
                  <div className="workspace-control-group">
                    <p className="workspace-control-group-label">Typography</p>
                    <label className="workspace-control-field">
                      <span className="workspace-control-label">Widget Font</span>
                      <select
                        className="workspace-control-input"
                        value={preview.widgetFontFamily}
                        onChange={(event) => setPreviewField("widgetFontFamily", event.target.value)}
                      >
                        {fontOptions.map((font) => (
                          <option key={font.label} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="workspace-control-field">
                      <span className="workspace-control-label">Font Size</span>
                      <select
                        className="workspace-control-input"
                        value={preview.widgetFontSize}
                        onChange={(event) => setPreviewField("widgetFontSize", event.target.value)}
                      >
                        <option value="12">12</option>
                        <option value="14">14</option>
                        <option value="16">16</option>
                      </select>
                    </label>
                  </div>
                </AccordionSection>
              </div>
            </div>
          </aside>

          <main className="workspace-main">
            <div className="workspace-main-surface">
              <div className="widget-preview-shell">
                <div className="widget-preview-frame" style={{ fontFamily: preview.widgetFontFamily }}>
                  <div className="widget-preview-header" style={{ background: previewHeaderBackground }}>
                    <div className={`widget-preview-header-main${preview.headerImageEnabled ? " is-overlay" : ""}`}>
                      {preview.logoEnabled && preview.logoSrc ? (
                        <div className={`widget-preview-logo${preview.logoShape === "circle" ? " is-circle" : ""}`}>
                          <img alt="Assistant logo" src={preview.logoSrc} />
                        </div>
                      ) : null}
                      <div className="widget-preview-header-copy" style={{ color: preview.headerTextColor }}>
                        <h2 style={{ fontSize: `${Math.max(currentFontSize + 6, 18)}px` }}>{preview.title}</h2>
                      </div>
                    </div>
                  </div>

                  <div className="widget-preview-body" style={{ background: preview.bodyColor }}>
                    <div className="widget-preview-message widget-preview-message-agent" style={welcomeTextStyle}>
                      {preview.welcomeMessage}
                    </div>
                    <div
                      className="widget-preview-message widget-preview-message-user"
                      style={{
                        ...responseTextStyle,
                        background: preview.accentColor,
                      }}
                    >
                      I need something polished and easy to customize.
                    </div>
                  </div>

                  <div className="widget-preview-footer" style={{ background: previewFooterBackground }}>
                    <div
                      className={`widget-preview-composer${preview.footerImageEnabled ? " is-overlay" : ""}`}
                      style={{
                        background: preview.footerImageEnabled ? undefined : preview.composerColor,
                      }}
                    >
                      <span className="widget-preview-placeholder" style={labelTextStyle}>
                        Type your message...
                      </span>
                      <button
                        aria-label="Send message"
                        className="widget-preview-send"
                        style={{ color: preview.accentColor }}
                        type="button"
                      >
                        <PaperPlaneIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="workspace-utility">
            <div className="workspace-utility-header" />
            <div className="workspace-utility-body">
              <div className="workspace-utility-card" />
              <div className="workspace-utility-card workspace-utility-card-tall" />
            </div>
          </aside>
        </div>
      </div>

      {isAssistantsModalOpen ? (
        <div className="workspace-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="assistants-title">
          <button aria-label="Close assistants" className="workspace-modal-dismiss" type="button" onClick={() => setIsAssistantsModalOpen(false)}>
            <CloseIcon />
          </button>
          <div className="workspace-modal">
            <div className="workspace-modal-header">
              <h2 id="assistants-title">Assistants</h2>
            </div>
            <div className="workspace-modal-body">
              {assistants.map((assistant) => (
                <button key={assistant.id} className="workspace-assistant-card" type="button" onClick={() => loadAssistant(assistant.id)}>
                  <div className="workspace-assistant-media">
                    <div
                      className="workspace-assistant-swatch"
                      style={{
                        background: assistant.headerImageEnabled && assistant.headerImageSrc
                          ? `url("${assistant.headerImageSrc}") center / cover no-repeat`
                          : assistant.headerFillMode === "gradient"
                            ? `linear-gradient(${angleToCss(assistant.headerGradientAngle)}, ${assistant.headerGradientStart}, ${assistant.headerGradientEnd})`
                            : assistant.headerColor,
                      }}
                    />
                  </div>
                  <div className="workspace-assistant-copy">
                    <span className="workspace-assistant-date">{assistant.date}</span>
                    <strong>{assistant.name}</strong>
                    <span>{assistant.description}</span>
                  </div>
                  <span className="workspace-assistant-action">
                    Load
                    <ArrowRightIcon />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isCreateAssistantModalOpen ? (
        <div className="workspace-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-assistant-title">
          <button
            aria-label="Close new assistant modal"
            className="workspace-modal-dismiss"
            type="button"
            onClick={() => setIsCreateAssistantModalOpen(false)}
          >
            <CloseIcon />
          </button>
          <div className="workspace-modal workspace-modal-form">
            <div className="workspace-modal-header">
              <h2 id="create-assistant-title">New Assistant</h2>
            </div>
            <div className="workspace-modal-body workspace-modal-form-body">
              <label className="workspace-minimal-field">
                <span className="workspace-minimal-label">Assistant Name</span>
                <input
                  className="workspace-minimal-input"
                  placeholder="Front Desk Concierge"
                  value={draftAssistantName}
                  onChange={(event) => setDraftAssistantName(event.target.value)}
                />
              </label>
              <label className="workspace-minimal-field">
                <span className="workspace-minimal-label">Assistant Instructions</span>
                <textarea
                  className="workspace-minimal-input workspace-minimal-textarea"
                  placeholder="Helpful, calm, concise. Prioritize reservations, opening hours, and guest questions."
                  value={draftInstructions}
                  onChange={(event) => setDraftInstructions(event.target.value)}
                />
              </label>
              <label className="workspace-minimal-field">
                <span className="workspace-minimal-label">Welcome Message</span>
                <textarea
                  className="workspace-minimal-input workspace-minimal-textarea"
                  placeholder="Ask about services, menus, and reservations."
                  value={draftWelcomeMessage}
                  onChange={(event) => setDraftWelcomeMessage(event.target.value)}
                />
              </label>
              <div className="workspace-modal-form-actions">
                <button className="workspace-modal-link" type="button" onClick={() => setIsCreateAssistantModalOpen(false)}>
                  Cancel
                </button>
                <button className="workspace-modal-link" type="button" onClick={handleAssistantCreate}>
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isThemeModalOpen ? (
        <div className="workspace-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="theme-ai-title">
          <button aria-label="Close AI theme modal" className="workspace-modal-dismiss" type="button" onClick={() => setIsThemeModalOpen(false)}>
            <CloseIcon />
          </button>
          <div className="workspace-modal workspace-modal-form">
            <div className="workspace-modal-header">
              <h2 id="theme-ai-title">Theme with AI</h2>
            </div>
            <div className="workspace-modal-body workspace-modal-form-body">
              <label className="workspace-minimal-field">
                <span className="workspace-minimal-label">Prompt</span>
                <textarea
                  className="workspace-minimal-input workspace-minimal-textarea"
                  placeholder="Describe the look for the header and footer. Example: warm luxury hospitality with editorial lighting and deep bronze tones."
                  value={themePrompt}
                  onChange={(event) => setThemePrompt(event.target.value)}
                />
              </label>
              <div className="workspace-modal-form-actions">
                <button className="workspace-ai-submit" type="button" onClick={applyThemeFromPrompt}>
                  <PaperPlaneIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AccordionSection({
  children,
  isOpen,
  label,
  onToggle,
}: {
  children: ReactNode;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="workspace-nav-group">
      <button className={`workspace-nav-item${isOpen ? " is-active" : ""}`} type="button" onClick={onToggle}>
        <span>{label}</span>
        <span className="workspace-nav-chevron">
          <ChevronIcon />
        </span>
      </button>
      {isOpen ? <div className="workspace-nav-panel">{children}</div> : null}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10L12 6L16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4H16L19 7V19H5V5C5 4.44772 5.44772 4 6 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 4V9H15V4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 15H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20L14 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 5V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 10H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 6.5L19.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 13.5L19.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7L17 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.478 2.559a.75.75 0 0 1 .815-.145l16.5 7.5a.75.75 0 0 1 0 1.366l-16.5 7.5A.75.75 0 0 1 3.25 18.1V13.18a.75.75 0 0 1 .553-.724L11.72 10.5 3.803 8.544a.75.75 0 0 1-.553-.724V2.9a.75.75 0 0 1 .228-.541Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
