import { NextResponse } from "next/server";
import { unsupportedTenantHostResponse } from "@/lib/tenant-api";
import { insertFeedbackRequest } from "@/lib/reverse-db";
import { resolveTenantRequestFromRequest } from "@/lib/tenant-request";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

export const runtime = "nodejs";

type FeedbackPayload = {
  name?: string;
  phone?: string;
  branch?: string;
  feedbackType?: string;
  message?: string;
  agreed?: boolean;
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
  const body = (await request.json().catch(() => null)) as FeedbackPayload | null;
  const name = body?.name?.trim();
  const phone = body?.phone?.trim();
  const branch = body?.branch?.trim() ?? "";
  const feedbackType = body?.feedbackType?.trim();
  const message = body?.message?.trim();
  const agreed = Boolean(body?.agreed);
  const requestType = body?.requestType?.trim() || "칭찬/불만 접수";
  const sourceSlug = body?.sourceSlug?.trim() || "";
  const locale = body?.locale ?? "ko";
  const pagePath = body?.pagePath?.trim() || "/";

  if (!name || !phone || !feedbackType || !message) {
    return badRequest("피드백 접수에 필요한 정보를 입력해 주세요.");
  }

  if (!agreed) {
    return badRequest("개인정보 취급 방침에 동의해 주세요.");
  }

  insertFeedbackRequest(tenantId, {
    name,
    phone,
    branch,
    feedbackType,
    message,
    agreed,
    requestType,
    sourceSlug,
    locale,
    pagePath,
  });

  return NextResponse.json({
    ok: true,
    message: "피드백이 등록되었습니다.",
  });
}
