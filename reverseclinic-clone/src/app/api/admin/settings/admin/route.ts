import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import { sanitizeAdminAccountInput } from "@/lib/reverse-admin-payload";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import { listAdminUsers, updateAdminAccount } from "@/lib/reverse-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  return NextResponse.json({
    ok: true,
    adminUsers: listAdminUsers(session.tenantId),
  });
}

export async function PATCH(request: Request) {
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizeAdminAccountInput(body);
  if (!payload.userId || !payload.name || !payload.loginId) {
    return adminBadRequest("이름과 로그인 아이디를 입력해 주세요.");
  }

  try {
    const adminUser = updateAdminAccount(session.tenantId, payload);
    return NextResponse.json({ ok: true, adminUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "관리자 계정을 저장하지 못했습니다.";
    return adminBadRequest(message, 400);
  }
}
