import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import { sanitizeCommunityItemInput } from "@/lib/reverse-admin-payload";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import { parseCommunityBoardType } from "@/lib/reverse-community";
import { deleteCommunityItem, getCommunityItem, saveCommunityItem } from "@/lib/reverse-db";

export const runtime = "nodejs";

type CommunityItemRouteContext = {
  params: Promise<{
    boardType: string;
    itemId: string;
  }>;
};

export async function GET(request: Request, context: CommunityItemRouteContext) {
  const { itemId } = await context.params;
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const item = getCommunityItem(session.tenantId, itemId);
  if (!item) {
    return adminBadRequest("게시글을 찾을 수 없습니다.", 404);
  }

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request, context: CommunityItemRouteContext) {
  const { boardType, itemId } = await context.params;
  const parsedBoardType = parseCommunityBoardType(boardType);
  if (!parsedBoardType) {
    return adminBadRequest("유효하지 않은 커뮤니티 게시판입니다.", 404);
  }

  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const current = getCommunityItem(session.tenantId, itemId);
  if (!current) {
    return adminBadRequest("게시글을 찾을 수 없습니다.", 404);
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizeCommunityItemInput(body, parsedBoardType);
  const item = saveCommunityItem(session.tenantId, {
    ...payload,
    id: current.id,
    boardType: parsedBoardType,
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request, context: CommunityItemRouteContext) {
  const { itemId } = await context.params;
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  deleteCommunityItem(session.tenantId, itemId);
  return NextResponse.json({ ok: true });
}
