import { NextResponse } from "next/server";
import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=missing-fields", request.url));
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid-credentials", request.url));
  }

  const token = await createSession(user);
  await setSessionCookie(token);

  return NextResponse.redirect(new URL("/app", request.url));
}

