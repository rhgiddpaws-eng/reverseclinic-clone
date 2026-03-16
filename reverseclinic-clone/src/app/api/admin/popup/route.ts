import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import { sanitizePopupBannerInput } from "@/lib/reverse-admin-payload";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import { listPopupBanners, savePopupBanner } from "@/lib/reverse-db";

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
    banners: listPopupBanners(session.tenantId),
  });
}

export async function POST(request: Request) {
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizePopupBannerInput(body);
  if (!payload.imageSrc) {
    return adminBadRequest("데스크톱 팝업 이미지를 등록해 주세요.");
  }

  const banner = savePopupBanner(session.tenantId, payload);
  return NextResponse.json({ ok: true, banner });
}
