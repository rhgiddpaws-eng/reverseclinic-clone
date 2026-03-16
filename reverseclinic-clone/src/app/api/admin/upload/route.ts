import { NextResponse } from "next/server";
import { getAdminApiSession, saveAdminUploadFile } from "@/lib/reverse-admin";
import {
  adminBadRequest,
  adminUnauthorized,
  adminUnsupportedHost,
} from "@/lib/reverse-admin-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getAdminApiSession(request);
  if (session.unsupportedHost) {
    return adminUnsupportedHost();
  }
  if (!session.user) {
    return adminUnauthorized();
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const folder = String(formData?.get("folder") ?? "community");

  if (!(file instanceof File) || file.size === 0) {
    return adminBadRequest("업로드 파일을 선택해 주세요.");
  }

  const url = await saveAdminUploadFile(file, folder);
  return NextResponse.json({ ok: true, url });
}
