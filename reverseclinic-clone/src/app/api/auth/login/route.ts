import { NextResponse } from "next/server";
import { localeMessages } from "@/data/reverseclinic-locales";
import { buildTenantApiContext, unsupportedTenantHostResponse } from "@/lib/tenant-api";
import {
  authenticateMember,
  createSession,
  findMemberByLoginId,
  getSessionCookieName,
} from "@/lib/reverse-db";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";

export const runtime = "nodejs";

type LoginPayload = {
  loginId?: string;
  password?: string;
  locale?: "ko" | "en" | "jp" | "cn";
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  const tenantRequest = resolveTenantRequestFromRequest(request);
  if (tenantRequest.unsupportedHost) {
    return unsupportedTenantHostResponse();
  }

  const tenantId = tenantRequest.tenantId;
  const body = (await request.json().catch(() => null)) as LoginPayload | null;
  const locale =
    body?.locale === "en" || body?.locale === "jp" || body?.locale === "cn" ? body.locale : "ko";
  const messages = localeMessages[locale];
  const loginId = body?.loginId?.trim();
  const password = body?.password?.trim();

  if (!loginId || !password) {
    return badRequest(messages.authMissingCredentials);
  }

  const user = authenticateMember(tenantId, loginId, password);
  if (!user) {
    return badRequest(messages.authInvalidCredentials, 401);
  }

  const member = findMemberByLoginId(tenantId, loginId);
  if (!member) {
    return badRequest(messages.authMemberNotFound, 404);
  }

  const { token, expiresAt } = createSession(tenantId, member.id);
  const response = NextResponse.json({
    ok: true,
    user,
    tenant: buildTenantApiContext(tenantId),
  });
  response.cookies.set(getSessionCookieName(tenantId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  return response;
}
