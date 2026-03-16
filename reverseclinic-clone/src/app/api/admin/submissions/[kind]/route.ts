import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/reverse-admin";
import {
  AdminSubmissionKind,
  adminSubmissionKinds,
} from "@/lib/reverse-admin-payload";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";
import {
  listConsultRequests,
  listFeedbackRequests,
  listReservationRequests,
} from "@/lib/reverse-db";

export const runtime = "nodejs";

type SubmissionRouteContext = {
  params: Promise<{
    kind: string;
  }>;
};

function parseSubmissionKind(value: string) {
  return adminSubmissionKinds.includes(value as AdminSubmissionKind)
    ? (value as AdminSubmissionKind)
    : null;
}

export async function GET(request: Request, context: SubmissionRouteContext) {
  const { kind } = await context.params;
  const parsedKind = parseSubmissionKind(kind);
  if (!parsedKind) {
    return adminBadRequest("유효하지 않은 문의 타입입니다.", 404);
  }

  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const items =
    parsedKind === "consult"
      ? listConsultRequests(session.tenantId)
      : parsedKind === "reservation"
        ? listReservationRequests(session.tenantId)
        : listFeedbackRequests(session.tenantId);

  return NextResponse.json({ ok: true, kind: parsedKind, items });
}
