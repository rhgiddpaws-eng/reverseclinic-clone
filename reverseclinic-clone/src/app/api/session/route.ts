import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildTenantApiContext, unsupportedTenantHostResponse } from "@/lib/tenant-api";
import { getSessionCookieName, getSessionUser } from "@/lib/reverse-db";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const tenantRequest = resolveTenantRequestFromRequest(request);
  if (tenantRequest.unsupportedHost) {
    return unsupportedTenantHostResponse();
  }

  const tenantId = tenantRequest.tenantId;
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName(tenantId))?.value;
  const user = getSessionUser(tenantId, token);

  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    tenant: buildTenantApiContext(tenantId),
  });
}
