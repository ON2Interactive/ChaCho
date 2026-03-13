/// <reference types="vite/client" />

import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

declare global {
  interface Window {
    __CHACHO_EMBED__?: {
      widgetKey?: string;
    };
  }
}

type FillMode = "solid" | "gradient";

interface WidgetConfig {
  id: string;
  name: string;
  theme: {
    primaryColor: string;
    position: "left" | "right";
    title: string;
    subtitle: string;
    logoUrl?: string;
    headerImageUrl?: string;
    footerImageUrl?: string;
    configurator?: {
      widgetFontFamily?: string;
      widgetFontSize?: string;
      accentColor?: string;
      headerFillMode?: FillMode;
      headerColor?: string;
      headerGradientStart?: string;
      headerGradientEnd?: string;
      headerGradientAngle?: "90" | "135" | "180" | "225";
      headerTextColor?: string;
      bodyColor?: string;
      welcomeTextColor?: string;
      responseTextColor?: string;
      composerColor?: string;
    };
  };
}

interface ChatMessage {
  id: string;
  senderType: "VISITOR" | "AGENT" | "SYSTEM";
  body: string;
  createdAt: string;
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000";
const widgetKey = window.__CHACHO_EMBED__?.widgetKey ?? "local_dev_widget";
const browserTokenKey = `chacho_browser_token:${widgetKey}`;
const pollIntervalMs = 3000;

function getBrowserToken() {
  const existing = window.localStorage.getItem(browserTokenKey);

  if (existing) {
    return existing;
  }

  const token = `browser_${crypto.randomUUID()}`;
  window.localStorage.setItem(browserTokenKey, token);
  return token;
}

function getThemeStyles(theme: WidgetConfig["theme"] | null) {
  const configurator = theme?.configurator;
  const primaryColor = theme?.primaryColor ?? "#c86b3c";
  const accentColor = configurator?.accentColor ?? primaryColor;
  const headerFillMode = configurator?.headerFillMode ?? "gradient";
  const headerColor = configurator?.headerColor ?? "#202734";
  const headerGradientStart = configurator?.headerGradientStart ?? "#202734";
  const headerGradientEnd = configurator?.headerGradientEnd ?? "#3C4E68";
  const headerGradientAngle = configurator?.headerGradientAngle ?? "135";

  return {
    "--widget-font-family": configurator?.widgetFontFamily ?? '"Helvetica Neue", Helvetica, Arial, sans-serif',
    "--widget-font-size": `${configurator?.widgetFontSize ?? "14"}px`,
    "--widget-primary": primaryColor,
    "--widget-accent": accentColor,
    "--widget-header-text": configurator?.headerTextColor ?? "#F5F7FB",
    "--widget-body": configurator?.bodyColor ?? "#FCFCFD",
    "--widget-welcome-text": configurator?.welcomeTextColor ?? "#172033",
    "--widget-response-text": configurator?.responseTextColor ?? "#FFFFFF",
    "--widget-composer": configurator?.composerColor ?? "#EEF2F7",
    "--widget-header-background":
      headerFillMode === "solid"
        ? headerColor
        : `linear-gradient(${headerGradientAngle}deg, ${headerGradientStart}, ${headerGradientEnd})`,
  } as React.CSSProperties;
}

function WidgetApp() {
  const [config, setConfig] = React.useState<WidgetConfig | null>(null);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [status, setStatus] = React.useState("Connecting");
  const [error, setError] = React.useState<string | null>(null);

  async function loadMessages(activeConversationId: string) {
    const messageResponse = await fetch(`${apiBaseUrl}/api/public/conversations/${activeConversationId}/messages`);
    const messageData = await messageResponse.json();

    if (!messageResponse.ok) {
      throw new Error(messageData.error ?? "Unable to load messages");
    }

    setMessages(messageData.messages);
  }

  React.useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const browserToken = getBrowserToken();

        const configResponse = await fetch(`${apiBaseUrl}/api/public/widget/${widgetKey}/config`);
        const configData = await configResponse.json();

        if (!configResponse.ok) {
          throw new Error(configData.error ?? "Unable to load widget config");
        }

        if (!cancelled) {
          setConfig(configData.widget);
        }

        const sessionResponse = await fetch(`${apiBaseUrl}/api/public/widget/${widgetKey}/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            browserToken,
            page: {
              url: window.location.href,
              title: document.title || "Widget Preview",
              referrer: document.referrer,
            },
            visitor: {
              name: null,
              email: null,
            },
          }),
        });

        const sessionData = await sessionResponse.json();

        if (!sessionResponse.ok) {
          throw new Error(sessionData.error ?? "Unable to create widget session");
        }

        if (!cancelled) {
          setConversationId(sessionData.conversationId);
          setStatus("Connected");
        }

        if (sessionData.conversationId) {
          await loadMessages(sessionData.conversationId);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unknown widget error");
          setStatus("Error");
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!conversationId) {
      return;
    }

    let cancelled = false;

    async function pollMessages() {
      try {
        const messageResponse = await fetch(`${apiBaseUrl}/api/public/conversations/${conversationId}/messages`);
        const messageData = await messageResponse.json();

        if (!messageResponse.ok) {
          throw new Error(messageData.error ?? "Unable to refresh messages");
        }

        if (!cancelled) {
          setMessages((current) => {
            const currentIds = current.map((message) => message.id).join(",");
            const nextIds = (messageData.messages as ChatMessage[]).map((message) => message.id).join(",");
            return currentIds === nextIds ? current : messageData.messages;
          });
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh messages");
          setStatus("Error");
        }
      }
    }

    const intervalId = window.setInterval(() => {
      void pollMessages();
    }, pollIntervalMs);

    void pollMessages();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [conversationId]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();

    if (!body) {
      return;
    }

    setError(null);

    try {
      let activeConversationId = conversationId;
      const browserToken = getBrowserToken();

      if (!activeConversationId) {
        const conversationResponse = await fetch(`${apiBaseUrl}/api/public/widget/${widgetKey}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            browserToken,
            page: {
              url: window.location.href,
              title: document.title || "Widget Preview",
            },
          }),
        });

        const conversationData = await conversationResponse.json();

        if (!conversationResponse.ok) {
          throw new Error(conversationData.error ?? "Unable to create conversation");
        }

        activeConversationId = conversationData.conversation.id;
        setConversationId(activeConversationId);
      }

      const messageResponse = await fetch(`${apiBaseUrl}/api/public/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      const messageData = await messageResponse.json();

      if (!messageResponse.ok) {
        throw new Error(messageData.error ?? "Unable to send message");
      }

      setMessages((current) => [...current, messageData.message]);
      setStatus("Connected");
      setDraft("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send message");
      setStatus("Error");
    }
  }

  const themeStyles = getThemeStyles(config?.theme ?? null);
  const headerStyle = config?.theme.headerImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(12, 18, 28, 0.34), rgba(12, 18, 28, 0.56)), url("${config.theme.headerImageUrl}")`,
      }
    : undefined;
  const footerStyle = config?.theme.footerImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(248, 250, 252, 0.80), rgba(248, 250, 252, 0.88)), url("${config.theme.footerImageUrl}")`,
      }
    : undefined;

  return (
    <div className="shell" style={{ justifyItems: config?.theme.position === "left" ? "start" : "end" }}>
      <div className="badge">Widget preview</div>
      <div className="panel" style={themeStyles}>
        <header className="panel-header" style={headerStyle}>
          <div className="header-copy">
            <div className="eyebrow-row">
              {config?.theme.logoUrl ? <img className="logo-mark" src={config.theme.logoUrl} alt="Widget logo" /> : null}
              <p className="eyebrow">ChaCho</p>
            </div>
            <h1>{config?.theme.title ?? "Chat with us"}</h1>
            <p className="subtitle">{config?.theme.subtitle ?? "We usually reply within a few minutes."}</p>
          </div>
          <div className="status">{status}</div>
        </header>
        <div className="messages">
          {messages.length === 0 ? (
            <div className="message agent">Send a message here, then open the dashboard inbox to reply as the agent.</div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`message ${message.senderType === "AGENT" ? "agent" : "visitor"}`}>
                {message.body}
              </div>
            ))
          )}
        </div>
        {error ? <p className="error">{error}</p> : null}
        <form className="composer-shell" style={footerStyle} onSubmit={handleSend}>
          <div className="composer">
            <input
              placeholder="Type your message"
              aria-label="Message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.4 20.4 21 12 3.4 3.6l1.9 6.7 8 1.7-8 1.7-1.9 6.7Z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WidgetApp />
  </React.StrictMode>,
);
