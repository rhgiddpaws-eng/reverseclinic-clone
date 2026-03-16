import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildTenantApiContext, unsupportedTenantHostResponse } from "@/lib/tenant-api";
import { destroySession, getSessionCookieName } from "@/lib/reverse-db";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const tenantRequest = resolveTenantRequestFromRequest(request);
  if (tenantRequest.unsupportedHost) {
    return unsupportedTenantHostResponse();
  }

  const tenantId = tenantRequest.tenantId;
  const cookieName = getSessionCookieName(tenantId);
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  destroySession(tenantId, token);

  const response = NextResponse.json({
    ok: true,
    tenant: buildTenantApiContext(tenantId),
  });
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
