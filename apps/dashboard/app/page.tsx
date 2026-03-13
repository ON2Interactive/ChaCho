import Link from "next/link";

const phases = [
  {
    name: "1. Tenant setup",
    detail: "Create the business account, owner login, and widget record.",
  },
  {
    name: "2. Installation",
    detail: "Give the tenant one script snippet they can paste on their website.",
  },
  {
    name: "3. Messaging",
    detail: "Store visitor messages and show them inside the inbox.",
  },
  {
    name: "4. Replies",
    detail: "Let agents answer from the dashboard and push updates back to the widget.",
  },
];

export default function HomePage() {
  return (
    <main style={{ padding: "48px 24px" }}>
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          background: "rgba(255, 253, 248, 0.88)",
          border: "1px solid var(--border)",
          borderRadius: 28,
          padding: 32,
          boxShadow: "0 24px 80px rgba(23, 32, 51, 0.08)",
        }}
      >
        <p style={{ margin: 0, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ChaCho foundation
        </p>
        <h1 style={{ margin: "12px 0 16px", fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 1 }}>
          Multi-tenant chat, built in layers.
        </h1>
        <p style={{ maxWidth: 720, fontSize: 18, lineHeight: 1.6, color: "var(--muted)" }}>
          This starter dashboard exists to make the project understandable from day one. The first goal is not polish.
          The first goal is a working backbone for tenants, widgets, conversations, and replies.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "var(--accent)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Open login
          </Link>
          <Link
            href="/app"
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1px solid var(--border)",
              color: "var(--ink)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Open protected app
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 32,
          }}
        >
          {phases.map((phase) => (
            <article
              key={phase.name}
              style={{
                padding: 20,
                borderRadius: 20,
                background: "var(--panel)",
                border: "1px solid var(--border)",
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>{phase.name}</h2>
              <p style={{ margin: 0, lineHeight: 1.6, color: "var(--muted)" }}>{phase.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
