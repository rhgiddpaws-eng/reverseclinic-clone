import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import {
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import { listMembers } from "@/lib/reverse-db";

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
    members: listMembers(session.tenantId),
  });
}
