import type { TenantConfig, TenantId, TenantRuntime } from "@/lib/tenant-types";
import {
  reverseClinicTenantConfig,
  reverseClinicTenantRuntime,
} from "@/tenants/reverseclinic/config";
import {
  wishLabTenantConfig,
  wishLabTenantRuntime,
} from "@/tenants/wishlab/config";

const TENANT_CONFIG_MAP = {
  reverseclinic: reverseClinicTenantConfig,
  wishlab: wishLabTenantConfig,
} as const satisfies Record<string, TenantConfig>;

const TENANT_RUNTIME_MAP = {
  reverseclinic: reverseClinicTenantRuntime,
  wishlab: wishLabTenantRuntime,
} as const satisfies Record<string, TenantRuntime>;

export type RegisteredTenantId = keyof typeof TENANT_CONFIG_MAP;

const FALLBACK_TENANT_ID: RegisteredTenantId = "reverseclinic";

function normalizeHost(rawHost: string | undefined | null) {
  if (!rawHost) {
    return "";
  }

  return rawHost
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();
}

export function isRegisteredTenantId(value: string): value is RegisteredTenantId {
  return value in TENANT_CONFIG_MAP;
}

export function getRegisteredTenantIds(): RegisteredTenantId[] {
  return Object.keys(TENANT_CONFIG_MAP) as RegisteredTenantId[];
}

export function getTenantConfig(tenantId: TenantId | undefined | null): TenantConfig {
  if (tenantId && isRegisteredTenantId(tenantId)) {
    return TENANT_CONFIG_MAP[tenantId];
  }

  return TENANT_CONFIG_MAP[FALLBACK_TENANT_ID];
}

export function getTenantRuntime(tenantId: TenantId | undefined | null): TenantRuntime {
  if (tenantId && isRegisteredTenantId(tenantId)) {
    return TENANT_RUNTIME_MAP[tenantId];
  }

  return TENANT_RUNTIME_MAP[FALLBACK_TENANT_ID];
}

export function getDefaultTenantId(): RegisteredTenantId {
  const envTenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
  if (envTenant && isRegisteredTenantId(envTenant)) {
    return envTenant;
  }

  return FALLBACK_TENANT_ID;
}

export function getDefaultTenantConfig() {
  return TENANT_CONFIG_MAP[getDefaultTenantId()];
}

export function getDefaultTenantRuntime() {
  return TENANT_RUNTIME_MAP[getDefaultTenantId()];
}

export function matchTenantIdFromHost(rawHost: string | undefined | null) {
  const host = normalizeHost(rawHost);
  if (!host) {
    return {
      tenantId: getDefaultTenantId(),
      matched: true,
      host,
    } as const;
  }

  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
    // 로컬 단일 서버 실행에서는 env 기본 tenant를 그대로 사용한다.
    return {
      tenantId: getDefaultTenantId(),
      matched: true,
      host,
    } as const;
  }

  for (const tenantId of getRegisteredTenantIds()) {
    const config = TENANT_CONFIG_MAP[tenantId];
    if (
      config.host.canonicalHost === host ||
      (config.host.acceptedHosts as readonly string[]).includes(host) ||
      (Object.values(config.host.localeHosts) as Array<string | undefined>).includes(host)
    ) {
      return {
        tenantId,
        matched: true,
        host,
      } as const;
    }
  }

  // 알 수 없는 host는 기록만 남기고, 기존 fallback 결정은 상위 request guard가 맡는다.
  return {
    tenantId: getDefaultTenantId(),
    matched: false,
    host,
  } as const;
}

export function resolveTenantIdFromHost(rawHost: string | undefined | null): RegisteredTenantId {
  return matchTenantIdFromHost(rawHost).tenantId;
}

export function resolveTenantId(
  requestedTenantId: string | undefined | null,
  rawHost: string | undefined | null,
): RegisteredTenantId {
  if (requestedTenantId && isRegisteredTenantId(requestedTenantId)) {
    return requestedTenantId;
  }

  return resolveTenantIdFromHost(rawHost);
}

export function resolveTenantConfigFromHost(rawHost: string | undefined | null) {
  return TENANT_CONFIG_MAP[resolveTenantIdFromHost(rawHost)];
}
