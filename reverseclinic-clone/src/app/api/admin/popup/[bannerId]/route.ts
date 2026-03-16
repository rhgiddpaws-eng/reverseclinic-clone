import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import { sanitizePopupBannerInput } from "@/lib/reverse-admin-payload";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import { deletePopupBanner, listPopupBanners, savePopupBanner } from "@/lib/reverse-db";

export const runtime = "nodejs";

type PopupRouteContext = {
  params: Promise<{
    bannerId: string;
  }>;
};

export async function GET(request: Request, context: PopupRouteContext) {
  const { bannerId } = await context.params;
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const banner =
    listPopupBanners(session.tenantId).find((entry) => entry.id === bannerId) ?? null;
  if (!banner) {
    return adminBadRequest("팝업을 찾을 수 없습니다.", 404);
  }

  return NextResponse.json({ ok: true, banner });
}

export async function PATCH(request: Request, context: PopupRouteContext) {
  const { bannerId } = await context.params;
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const current =
    listPopupBanners(session.tenantId).find((entry) => entry.id === bannerId) ?? null;
  if (!current) {
    return adminBadRequest("팝업을 찾을 수 없습니다.", 404);
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizePopupBannerInput(body);
  if (!payload.imageSrc) {
    return adminBadRequest("데스크톱 팝업 이미지를 등록해 주세요.");
  }

  const banner = savePopupBanner(session.tenantId, {
    ...payload,
    id: current.id,
  });

  return NextResponse.json({ ok: true, banner });
}

export async function DELETE(request: Request, context: PopupRouteContext) {
  const { bannerId } = await context.params;
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  deletePopupBanner(session.tenantId, bannerId);
  return NextResponse.json({ ok: true });
}
