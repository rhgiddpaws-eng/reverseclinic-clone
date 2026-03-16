import "server-only";

import type { Metadata } from "next";
import { loadMirrorPageModelForSegments } from "@/lib/reverse-page-models";
import { routeKindFromSegments, segmentsToSlug } from "@/lib/reverse-mirror-routing";
import { getTenantConfig, getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale } from "@/lib/reverseclinic-types";
import { getReverseClinicSite } from "@/tenants/reverseclinic/site-registry";

function buildMirrorDescription(siteTitle: string, title: string) {
  return `${title} ?섏씠吏瑜?${siteTitle} 濡쒖뺄 誘몃윭?먯꽌 蹂듦뎄???붾㈃?낅땲??`;
}

function resolveTenantSiteTitle(tenantId: TenantId, siteId?: string) {
  if (tenantId === "reverseclinic" && siteId) {
    return getReverseClinicSite(siteId as never).homeTitle;
  }

  return getTenantConfig(tenantId).brand.siteTitle;
}

export function buildTenantHomeMetadata(
  tenantId: TenantId,
  locale: MirrorLocale,
  siteId?: string,
): Metadata {
  const tenantRuntime = getTenantRuntime(tenantId);
  const siteTitle = resolveTenantSiteTitle(tenantId, siteId);

  return {
    title: siteTitle ?? tenantRuntime.localeMarketing[locale].homeTitle,
    description: `${siteTitle} shared multi-site runtime. 硫붿씤, BEST, TALK, ?λ컮援щ땲, ?뚯썝 湲곕뒫???뚮꼳?몃퀎濡?遺꾨━ ?좎??⑸땲??`,
  };
}

export async function buildTenantRouteMetadata(
  tenantId: TenantId,
  locale: MirrorLocale,
  segments: string[],
  siteId?: string,
): Promise<Metadata> {
  if (segments.length === 0) {
    return buildTenantHomeMetadata(tenantId, locale, siteId);
  }

  const tenantRuntime = getTenantRuntime(tenantId);
  const siteTitle = resolveTenantSiteTitle(tenantId, siteId);
  const mirrorPage = await loadMirrorPageModelForSegments(tenantId, locale, segments, siteId);

  if (mirrorPage) {
    return {
      title: mirrorPage.title,
      description: buildMirrorDescription(siteTitle, mirrorPage.title),
    };
  }

  const routeKind = routeKindFromSegments(segments);
  const localeMessages = tenantRuntime.localeMessages[locale];
  const fallbackTitle =
    routeKind === "cart"
      ? localeMessages.cartTitle
      : segments[0] === "login"
        ? localeMessages.loginTitle
        : segments[0] === "join"
          ? localeMessages.joinTitle
          : `${siteTitle} | ${segmentsToSlug(segments).replaceAll("--", " / ")}`;

  return {
    title: fallbackTitle,
    description: buildMirrorDescription(siteTitle, fallbackTitle),
  };
}
