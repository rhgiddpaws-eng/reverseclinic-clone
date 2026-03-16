import { NextResponse } from "next/server";
import { getTenantConfig } from "@/lib/tenant-registry";
import type { RegisteredTenantId } from "@/lib/tenant-registry";

export function buildTenantApiContext(tenantId: RegisteredTenantId) {
  const tenantConfig = getTenantConfig(tenantId);

  return {
    id: tenantId,
    siteTitle: tenantConfig.brand.siteTitle,
    defaultLocale: tenantConfig.locale.defaultLocale,
    canonicalHost: tenantConfig.host.canonicalHost,
  };
}

export function unsupportedTenantHostResponse() {
  // 알 수 없는 host 요청은 기본 tenant로 흘리지 않고 여기서 바로 막는다.
  return NextResponse.json(
    {
      ok: false,
      error: "지원되지 않는 호스트입니다.",
    },
    { status: 404 },
  );
}
