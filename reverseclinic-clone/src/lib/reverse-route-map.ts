import "server-only";

import path from "node:path";
import { readFile } from "node:fs/promises";
import { getTenantConfig } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorRouteMap } from "@/lib/reverseclinic-types";
import { getReverseClinicSite } from "@/tenants/reverseclinic/site-registry";

type ManifestEntry = {
  sourceUrl: string;
  title: string;
  file: string;
};

const routeMapCache = new Map<string, Promise<Map<string, MirrorRouteMap>>>();

function normalizeTitle(rawTitle: string, fallbackTitle: string) {
  return rawTitle.replace(/\s+\|.+$/, "").replace(/^\/\//, "").trim() || fallbackTitle;
}

async function readManifestEntries(tenantId: TenantId, siteId?: string) {
  const manifestPath = path.join(
    process.cwd(),
    siteId && tenantId === "reverseclinic"
      ? getReverseClinicSite(siteId as never).manifestPath
      : getTenantConfig(tenantId).mirror.manifestPath,
  );

  try {
    const raw = await readFile(manifestPath, "utf8");
    return JSON.parse(raw) as Record<string, ManifestEntry>;
  } catch {
    return {} as Record<string, ManifestEntry>;
  }
}

async function buildRouteMap(tenantId: TenantId, siteId?: string) {
  const tenantConfig = getTenantConfig(tenantId);
  const manifestEntries = await readManifestEntries(tenantId, siteId);
  const routes = new Map<string, MirrorRouteMap>();

  Object.entries(manifestEntries).forEach(([slug, entry]) => {
    routes.set(slug, {
      slug,
      title: normalizeTitle(entry.title, tenantConfig.brand.siteTitle),
      sourceHref: entry.sourceUrl,
      kind: slug.startsWith("_simpleApps=") ? "document" : "detail",
    });
  });

  return routes;
}

async function getRouteMapForTenant(tenantId: TenantId, siteId?: string) {
  const cacheKey = `${tenantId}:${siteId ?? "default"}`;
  const cached = routeMapCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const nextValue = buildRouteMap(tenantId, siteId);
  routeMapCache.set(cacheKey, nextValue);
  return nextValue;
}

export async function getMirrorRouteMap(tenantId: TenantId, slug: string, siteId?: string) {
  const routeMap = await getRouteMapForTenant(tenantId, siteId);
  return routeMap.get(slug);
}
