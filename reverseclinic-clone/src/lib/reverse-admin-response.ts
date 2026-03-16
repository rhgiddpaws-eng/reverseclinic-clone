import { NextResponse } from "next/server";
import { unsupportedTenantHostResponse } from "@/lib/tenant-api";

export function adminBadRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function adminUnauthorized(message = "관리자 로그인이 필요합니다.") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export function adminUnsupportedHost() {
  return unsupportedTenantHostResponse();
}
