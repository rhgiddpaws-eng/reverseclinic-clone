import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAdminSessionCookieName,
  getAdminSessionUser,
} from "@/lib/reverse-db";
import { normalizeUploadFileName } from "@/lib/reverse-admin-seed";
import { resolveRequestTenantId, resolveTenantRequestFromRequest } from "@/lib/tenant-request";

function readCookieValue(cookieHeader: string, name: string) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null;
}

export async function getAdminPageSession() {
  const tenantId = await resolveRequestTenantId();
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value ?? null;

  return {
    tenantId,
    user: getAdminSessionUser(tenantId, token),
  };
}

export async function requireAdminPageSession() {
  const session = await getAdminPageSession();
  if (!session.user) {
    redirect("/admin/login");
  }

  return {
    tenantId: session.tenantId,
    user: session.user,
  };
}

export function getAdminApiSession(request: Request) {
  const tenantRequest = resolveTenantRequestFromRequest(request);
  if (tenantRequest.unsupportedHost) {
    return {
      ...tenantRequest,
      token: null,
      user: null,
    };
  }

  const token = readCookieValue(
    request.headers.get("cookie") ?? "",
    getAdminSessionCookieName(),
  );

  return {
    ...tenantRequest,
    token,
    user: getAdminSessionUser(tenantRequest.tenantId, token),
  };
}

export async function saveAdminUploadFile(file: File, folder: string) {
  const safeFolder = folder.replace(/[^a-z0-9/_-]+/gi, "-").replace(/\/{2,}/g, "/");
  const normalizedName = normalizeUploadFileName(file.name || "upload-image.jpg");
  const nextFileName = `${Date.now()}-${normalizedName}`;
  return `/uploads/${safeFolder}/${nextFileName}`.replace(/\/{2,}/g, "/");
}
