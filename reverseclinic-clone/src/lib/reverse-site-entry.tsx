import { notFound } from "next/navigation";
import { ReverseRoutePage } from "@/components/reverse-route-page";
import { listCommunityItems, listPopupBanners } from "@/lib/reverse-db";
import { resolveCommunityBoardFromSegments } from "@/lib/reverse-community";
import { loadMirrorPageModelForSegments } from "@/lib/reverse-page-models";
import { routeKindFromSegments } from "@/lib/reverse-mirror-routing";
import {
  buildTenantHomeMetadata,
  buildTenantRouteMetadata,
} from "@/lib/tenant-page-metadata";
import { resolveRequestTenantId } from "@/lib/tenant-request";
import type { MirrorBranch, MirrorLocale } from "@/lib/reverseclinic-types";
import {
  getReverseClinicSite,
  getReverseClinicSiteIdFromPath,
} from "@/tenants/reverseclinic/site-registry";

export async function buildSiteEntryMetadata(
  locale: MirrorLocale,
  branch: MirrorBranch,
  segments: string[],
) {
  const tenantId = await resolveRequestTenantId();
  const siteId =
    tenantId === "reverseclinic" ? getReverseClinicSiteIdFromPath(locale, branch) : undefined;

  if (segments.length === 0) {
    return buildTenantHomeMetadata(tenantId, locale, siteId);
  }

  return buildTenantRouteMetadata(tenantId, locale, segments, siteId);
}

export async function renderSiteEntryPage(
  locale: MirrorLocale,
  branch: MirrorBranch,
  segments: string[],
) {
  const tenantId = await resolveRequestTenantId();
  const siteId =
    tenantId === "reverseclinic" ? getReverseClinicSiteIdFromPath(locale, branch) : undefined;
  const siteFamily =
    tenantId === "reverseclinic" && siteId ? getReverseClinicSite(siteId as never).family : "ko";
  const routeKind = routeKindFromSegments(segments);
  const communityBoardType =
    tenantId === "reverseclinic" && siteFamily === "ko"
      ? resolveCommunityBoardFromSegments(segments)
      : null;
  const popupBanners =
    tenantId === "reverseclinic" && siteFamily === "ko" && segments.length === 0
      ? listPopupBanners(tenantId, true)
      : [];
  const communityItems = communityBoardType
    ? listCommunityItems(tenantId, communityBoardType)
    : [];
  const initialMirrorPage =
    (segments.length === 0 && siteFamily !== "intl") || Boolean(communityBoardType)
      ? null
      : await loadMirrorPageModelForSegments(tenantId, locale, segments, siteId);

  if (siteFamily === "intl" && routeKind !== "cart" && !initialMirrorPage) {
    notFound();
  }

  return (
    <ReverseRoutePage
      locale={locale}
      segments={segments}
      initialMirrorPage={initialMirrorPage}
      initialPopupBanners={popupBanners}
      initialCommunityBoardType={communityBoardType}
      initialCommunityItems={communityItems}
      tenantId={tenantId}
      siteId={siteId}
    />
  );
}
