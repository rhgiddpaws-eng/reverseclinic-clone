import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import { destroyAdminSession, getAdminSessionCookieName } from "@/lib/reverse-db";
import { adminUnsupportedHost } from "@/lib/reverse-admin-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }

  if (session.token) {
    destroyAdminSession(session.tenantId, session.token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
