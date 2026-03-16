import { NextResponse } from "next/server";
import { unsupportedTenantHostResponse } from "@/lib/tenant-api";
import { insertReservationRequest } from "@/lib/reverse-db";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

export const runtime = "nodejs";

type ReservationPayload = {
  name?: string;
  phone?: string;
  branch?: string;
  message?: string;
  requestType?: string;
  sourceSlug?: string;
  locale?: MirrorLocale;
  pagePath?: string;
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  const tenantRequest = resolveTenantRequestFromRequest(request);
  if (tenantRequest.unsupportedHost) {
    return unsupportedTenantHostResponse();
  }

  const tenantId = tenantRequest.tenantId;
  const body = (await request.json().catch(() => null)) as ReservationPayload | null;
  const name = body?.name?.trim();
  const phone = body?.phone?.trim();
  const branch = body?.branch?.trim() ?? "";
  const message = body?.message?.trim();
  const requestType = body?.requestType?.trim() || "온라인예약";
  const sourceSlug = body?.sourceSlug?.trim() || "";
  const locale = body?.locale ?? "ko";
  const pagePath = body?.pagePath?.trim() || "/";

  if (!name || !phone || !message) {
    return badRequest("예약 요청에 필요한 정보를 입력해 주세요.");
  }

  insertReservationRequest(tenantId, {
    name,
    phone,
    branch,
    message,
    requestType,
    sourceSlug,
    locale,
    pagePath,
  });

  return NextResponse.json({
    ok: true,
    message: "예약 요청이 등록되었습니다.",
  });
}
