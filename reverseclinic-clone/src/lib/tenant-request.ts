import { headers } from "next/headers";
import {
  getTenantConfig,
  getTenantRuntime,
  isRegisteredTenantId,
  matchTenantIdFromHost,
} from "@/lib/tenant-registry";
import type { RegisteredTenantId } from "@/lib/tenant-registry";

type HeaderBag =
  | Headers
  | {
      get(name: string): string | null;
    };

function readHeader(headersLike: HeaderBag, name: string) {
  return headersLike.get(name);
}

function resolveTenantRequest(headersLike: HeaderBag) {
  const explicitTenantId = readHeader(headersLike, "x-tenant-id");
  const forwardedHost = readHeader(headersLike, "x-forwarded-host");
  const host = forwardedHost || readHeader(headersLike, "host");

  if (explicitTenantId && isRegisteredTenantId(explicitTenantId)) {
    return {
      tenantId: explicitTenantId,
      unsupportedHost: false,
      host,
      matchedBy: "explicit",
    } as const;
  }

  const hostMatch = matchTenantIdFromHost(host);
  return {
    tenantId: hostMatch.tenantId,
    unsupportedHost: Boolean(hostMatch.host) && !hostMatch.matched,
    host,
    matchedBy: hostMatch.host ? "host" : "default",
  } as const;
}

export type TenantRequestResolution = {
  tenantId: RegisteredTenantId;
  unsupportedHost: boolean;
  host: string | null;
  matchedBy: "explicit" | "host" | "default";
};

export function resolveTenantIdFromHeaders(headersLike: HeaderBag) {
  return resolveTenantRequest(headersLike).tenantId;
}

export async function resolveRequestTenantId() {
  const requestHeaders = await headers();
  return resolveTenantRequest(requestHeaders).tenantId;
}

export async function resolveRequestTenantContext() {
  const requestHeaders = await headers();
  const tenantRequest = resolveTenantRequest(requestHeaders);
  const tenantId = tenantRequest.tenantId;

  return {
    ...tenantRequest,
    tenantId,
    tenantConfig: getTenantConfig(tenantId),
    tenantRuntime: getTenantRuntime(tenantId),
  };
}

export function resolveTenantIdFromRequest(request: Request) {
  return resolveTenantRequest(request.headers).tenantId;
}

export function resolveTenantRequestFromRequest(request: Request): TenantRequestResolution {
  return resolveTenantRequest(request.headers);
}
