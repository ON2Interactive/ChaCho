import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSessionUser();

  if (session) {
    redirect("/app");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "min(100%, 440px)",
          padding: 28,
          borderRadius: 28,
          background: "rgba(255, 253, 248, 0.94)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 80px rgba(23, 32, 51, 0.08)",
        }}
      >
        <p style={{ margin: 0, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Dashboard access
        </p>
        <h1 style={{ margin: "12px 0 8px", fontSize: 36 }}>Sign in</h1>
        <p style={{ margin: "0 0 24px", color: "var(--muted)", lineHeight: 1.6 }}>
          For now, the app supports a demo owner login when no database is configured yet.
        </p>

        <form action="/api/auth/login" method="post" style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              defaultValue="owner@demo.chacho.local"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span>Password</span>
            <input
              type="password"
              name="password"
              defaultValue="password123"
              required
              style={inputStyle}
            />
          </label>

          <button type="submit" style={buttonStyle}>
            Sign in
          </button>
        </form>

        <p style={{ margin: "16px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
          Demo credentials are prefilled so you can test the flow. Once a real database is connected, this page will
          use stored users instead.
        </p>

        <p style={{ margin: "20px 0 0" }}>
          <Link href="/" style={{ color: "var(--accent)" }}>
            Back to project overview
          </Link>
        </p>
      </section>
    </main>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "12px 14px",
  font: "inherit",
  background: "white",
};

const buttonStyle = {
  border: 0,
  borderRadius: 14,
  padding: "13px 16px",
  font: "inherit",
  fontWeight: 700,
  color: "white",
  background: "var(--accent)",
  cursor: "pointer",
};

