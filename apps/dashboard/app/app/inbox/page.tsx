import Link from "next/link";
import { redirect } from "next/navigation";
import { getConversationDetail, listTenantConversations } from "@/lib/chat-service";
import { getSessionUser } from "@/lib/auth";

interface InboxPageProps {
  searchParams?: Promise<{
    conversationId?: string;
  }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const conversations = await listTenantConversations(session.tenantId);
  const activeConversationId = params.conversationId ?? conversations[0]?.id ?? null;
  const activeConversation = activeConversationId
    ? await getConversationDetail(session.tenantId, activeConversationId)
    : null;

  return (
    <main style={{ padding: "32px 20px" }}>
      <section style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 20 }}>
        <header
          style={{
            padding: 28,
            borderRadius: 28,
            background: "rgba(255, 253, 248, 0.94)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 80px rgba(23, 32, 51, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
            <div>
              <p style={{ margin: 0, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Tenant workspace
              </p>
              <h1 style={{ margin: "12px 0 8px", fontSize: 40 }}>Inbox for {session.tenantName}</h1>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                Human escalation lives here. AI-first conversations should land in this inbox only when they need a real person.
              </p>
            </div>
            <Link href="/app" style={navLinkStyle}>
              Back to configurator
            </Link>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "320px minmax(0, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          <aside style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>Conversations</h2>
              <span style={{ color: "var(--muted)" }}>{conversations.length}</span>
            </div>

            {conversations.length === 0 ? (
              <p style={{ margin: 0, lineHeight: 1.6, color: "var(--muted)" }}>
                No conversations yet. The first one will appear here after the widget creates a session and sends a message.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;

                  return (
                    <Link
                      key={conversation.id}
                      href={`/app/inbox?conversationId=${conversation.id}`}
                      style={{
                        display: "grid",
                        gap: 8,
                        padding: 16,
                        borderRadius: 18,
                        textDecoration: "none",
                        border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: isActive ? "#fff6ef" : "var(--panel)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <strong>{conversation.visitorName ?? "Anonymous visitor"}</strong>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>{conversation.status}</span>
                      </div>
                      <span style={{ color: "var(--muted)", fontSize: 14 }}>
                        {conversation.lastMessagePreview ?? "No messages yet"}
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>
                        {conversation.sourceTitle ?? conversation.sourceUrl}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>

          <section style={panelStyle}>
            {!activeConversation ? (
              <div>
                <h2 style={{ marginTop: 0 }}>No active thread</h2>
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                  Once a visitor starts chatting, their thread will open here so an agent can reply.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 18 }}>
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    paddingBottom: 16,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <h2 style={{ margin: "0 0 6px" }}>{activeConversation.visitorName ?? "Anonymous visitor"}</h2>
                    <p style={{ margin: 0, color: "var(--muted)" }}>{activeConversation.visitorEmail ?? "No email captured"}</p>
                  </div>
                  <div style={{ textAlign: "right", color: "var(--muted)", fontSize: 14 }}>
                    <div>{activeConversation.sourceTitle ?? activeConversation.sourceUrl}</div>
                    <div>{new Date(activeConversation.lastMessageAt).toLocaleString()}</div>
                  </div>
                </header>

                <div style={{ display: "grid", gap: 12 }}>
                  {activeConversation.messages.map((message) => (
                    <article
                      key={message.id}
                      style={{
                        maxWidth: "78%",
                        marginLeft: message.senderType === "AGENT" ? "auto" : 0,
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: message.senderType === "AGENT" ? "#1f2937" : "#f3eadc",
                        color: message.senderType === "AGENT" ? "white" : "var(--ink)",
                      }}
                    >
                      <p style={{ margin: 0, lineHeight: 1.6 }}>{message.body}</p>
                      <p style={{ margin: "8px 0 0", opacity: 0.7, fontSize: 12 }}>
                        {message.senderType} · {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>

                <form action={`/api/app/conversations/${activeConversation.id}/messages`} method="post" style={{ display: "grid", gap: 12 }}>
                  <textarea
                    name="body"
                    placeholder="Reply as the agent"
                    rows={4}
                    style={{
                      width: "100%",
                      border: "1px solid var(--border)",
                      borderRadius: 18,
                      padding: 14,
                      resize: "vertical",
                      font: "inherit",
                    }}
                  />
                  <button type="submit" style={buttonStyle}>
                    Send reply
                  </button>
                </form>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

const panelStyle = {
  padding: 22,
  borderRadius: 28,
  background: "rgba(255, 253, 248, 0.94)",
  border: "1px solid var(--border)",
  boxShadow: "0 24px 80px rgba(23, 32, 51, 0.08)",
};

const buttonStyle = {
  width: "fit-content",
  border: 0,
  borderRadius: 14,
  padding: "13px 16px",
  font: "inherit",
  fontWeight: 700,
  color: "white",
  background: "var(--accent)",
  cursor: "pointer",
};

const navLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  color: "var(--ink)",
  textDecoration: "none",
  fontWeight: 700,
};
