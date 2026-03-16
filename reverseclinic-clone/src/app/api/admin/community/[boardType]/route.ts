import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import { sanitizeCommunityItemInput } from "@/lib/reverse-admin-payload";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import { parseCommunityBoardType, reverseCommunityBoardMeta } from "@/lib/reverse-community";
import { listCommunityItems, saveCommunityItem } from "@/lib/reverse-db";

export const runtime = "nodejs";

type CommunityRouteContext = {
  params: Promise<{
    boardType: string;
  }>;
};

export async function GET(request: Request, context: CommunityRouteContext) {
  const { boardType } = await context.params;
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

  return NextResponse.json({
    ok: true,
    board: reverseCommunityBoardMeta[parsedBoardType],
    items: listCommunityItems(session.tenantId, parsedBoardType),
  });
}

export async function POST(request: Request, context: CommunityRouteContext) {
  const { boardType } = await context.params;
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

  const body = await request.json().catch(() => null);
  const payload = sanitizeCommunityItemInput(body, parsedBoardType);

  if (!payload.title || payload.blocks.length === 0) {
    return adminBadRequest("제목과 상세 블록을 입력해 주세요.");
  }

  const item = saveCommunityItem(session.tenantId, payload);
  return NextResponse.json({ ok: true, item });
}
