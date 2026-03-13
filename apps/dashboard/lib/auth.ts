import { prisma } from "@chacho/db";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "chacho_session";
const encoder = new TextEncoder();

const demoUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "owner@demo.chacho.local",
  name: "Demo Owner",
  passwordHash: "$2b$10$CWQEJD0KDW1nWy4L80inDealtkQLRal38M19NcAtbmLJB2oq5VOTa",
  tenantId: "5b7fe2b8-3c16-4b72-a72d-bf0000000001",
  tenantName: "Demo Tenant",
  role: "OWNER",
} as const;

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  tenantName: string;
  role: "OWNER" | "AGENT";
}

function getSessionSecret() {
  return encoder.encode(process.env.SESSION_SECRET ?? "dev-only-session-secret-change-me");
}

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  if (!isDatabaseConfigured()) {
    const matchesEmail = email.toLowerCase() === demoUser.email;
    const matchesPassword = await bcrypt.compare(password, demoUser.passwordHash);

    if (!matchesEmail || !matchesPassword) {
      return null;
    }

    return {
      userId: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      tenantId: demoUser.tenantId,
      tenantName: demoUser.tenantName,
      role: demoUser.role,
    };
  }

  const membership = await prisma.membership.findFirst({
    where: {
      user: {
        email: email.toLowerCase(),
      },
    },
    select: {
      role: true,
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
        },
      },
    },
  });

  if (!membership?.user.passwordHash) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, membership.user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return {
    userId: membership.user.id,
    email: membership.user.email,
    name: membership.user.name ?? membership.user.email,
    tenantId: membership.tenant.id,
    tenantName: membership.tenant.name,
    role: membership.role,
  };
}

export async function createSession(user: SessionUser) {
  const payload: JWTPayload = {
    userId: user.userId,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getSessionSecret());
    const payload = verified.payload;

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.tenantId !== "string" ||
      typeof payload.tenantName !== "string" ||
      (payload.role !== "OWNER" && payload.role !== "AGENT")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      tenantId: payload.tenantId,
      tenantName: payload.tenantName,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
