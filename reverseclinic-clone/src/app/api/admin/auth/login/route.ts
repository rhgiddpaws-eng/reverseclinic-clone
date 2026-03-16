import { NextResponse } from "next/server";
import { getAdminSessionCookieName } from "@/lib/reverse-db";
import { adminBadRequest, adminUnsupportedHost } from "@/lib/reverse-admin-response";
import { authenticateAdmin, createAdminSession } from "@/lib/reverse-db";
import { buildTenantApiContext } from "@/lib/tenant-api";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";

export const runtime = "nodejs";

type AdminLoginPayload = {
  loginId?: string;
  password?: string;
};

export async function POST(request: Request) {
  const tenantRequest = resolveTenantRequestFromRequest(request);
  if (tenantRequest.unsupportedHost) {
    return adminUnsupportedHost();
  }

  const body = (await request.json().catch(() => null)) as AdminLoginPayload | null;
  const loginId = body?.loginId?.trim();
  const password = body?.password?.trim();

  if (!loginId || !password) {
    return adminBadRequest("관리자 아이디와 비밀번호를 입력해 주세요.");
  }

  const user = authenticateAdmin(tenantRequest.tenantId, loginId, password);
  if (!user) {
    return adminBadRequest("관리자 계정 정보가 올바르지 않습니다.", 401);
  }

  const { token, expiresAt } = createAdminSession(tenantRequest.tenantId, user.id);
  const response = NextResponse.json({
    ok: true,
    user,
    tenant: buildTenantApiContext(tenantRequest.tenantId),
  });

  response.cookies.set(getAdminSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  return response;
}
