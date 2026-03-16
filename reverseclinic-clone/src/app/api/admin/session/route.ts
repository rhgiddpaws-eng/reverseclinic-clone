import { NextResponse } from "next/server";
import { getAdminPageSession } from "@/lib/reverse-admin";
import { buildTenantApiContext } from "@/lib/tenant-api";

export const runtime = "nodejs";

export async function GET() {
  const { tenantId, user } = await getAdminPageSession();

  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    tenant: buildTenantApiContext(tenantId),
  });
}
