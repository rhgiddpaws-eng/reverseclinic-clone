import { NextResponse } from "next/server";
import { localeMessages } from "@/data/reverseclinic-locales";
import { buildTenantApiContext, unsupportedTenantHostResponse } from "@/lib/tenant-api";
import { createMember, createSession, getSessionCookieName } from "@/lib/reverse-db";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";

export const runtime = "nodejs";

type JoinPayload = {
  loginId?: string;
  name?: string;
  phone?: string;
  email?: string;
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
  const body = (await request.json().catch(() => null)) as JoinPayload | null;
  const locale =
    body?.locale === "en" || body?.locale === "jp" || body?.locale === "cn" ? body.locale : "ko";
  const messages = localeMessages[locale];
  const loginId = body?.loginId?.trim();
  const name = body?.name?.trim();
  const phone = body?.phone?.trim();
  const email = body?.email?.trim() || null;
  const password = body?.password?.trim();

  if (!loginId || !name || !phone || !password) {
    return badRequest(messages.authJoinMissingFields);
  }

  if (password.length < 6) {
    return badRequest(messages.authPasswordMinLength);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest(messages.authInvalidEmail);
  }

  try {
    const user = createMember(tenantId, {
      loginId,
      name,
      phone,
      email,
      password,
    });
    const { token, expiresAt } = createSession(tenantId, user.id);
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
  } catch (error) {
    const message =
      error instanceof Error && /unique/i.test(error.message)
        ? messages.authDuplicateUser
        : messages.authJoinServerError;

    return badRequest(message, 409);
  }
}
