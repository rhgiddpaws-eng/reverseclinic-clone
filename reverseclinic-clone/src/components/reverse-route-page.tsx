"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ReverseCartContent } from "@/components/reverse-cart-content";
import { ReverseCommunityPage } from "@/components/reverse-community-page";
import { ReverseHomePage } from "@/components/reverse-home-page";
import { ReverseMirrorPage } from "@/components/reverse-mirror-page";
import { ReverseClinicShell } from "@/components/reverseclinic-shell";
import { useTenantRuntime } from "@/components/tenant-runtime-provider";
import { routeKindFromSegments, segmentsToSlug } from "@/lib/reverse-mirror-routing";
import { getTenantConfig, getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type {
  CommunityBoardType,
  CommunityItem,
  MirrorLocale,
  MirrorPageModel,
  PopupBanner,
} from "@/lib/reverseclinic-types";
import { getReverseClinicSite } from "@/tenants/reverseclinic/site-registry";

type ReverseRoutePageProps = {
  locale: MirrorLocale;
  segments: string[];
  initialCommunityBoardType: CommunityBoardType | null;
  initialCommunityItems: CommunityItem[];
  initialMirrorPage: MirrorPageModel | null;
  initialPopupBanners: PopupBanner[];
  tenantId: TenantId;
  siteId?: string;
};

function ReverseCartPage({
  locale,
  tenantId,
}: {
  locale: MirrorLocale;
  tenantId: TenantId;
}) {
  const { siteId } = useTenantRuntime();
  const { localeMessages } = getTenantRuntime(tenantId);
  const tenantConfig = getTenantConfig(tenantId);
  const messages = localeMessages[locale];
  const siteTitle =
    tenantId === "reverseclinic" && siteId !== "default"
      ? getReverseClinicSite(siteId as never).homeTitle
      : tenantConfig.brand.siteTitle;

  return (
    <ReverseClinicShell locale={locale} tenantId={tenantId}>
      <section className="reverse-page-hero">
        <p className="reverse-page-eyebrow">CART</p>
        <h2>{messages.cartTitle}</h2>
        <p>{siteTitle} 嚥≪뮇類??怨??袁⑸퓠 ?브쑬????貫而?뤃????낅빍??</p>
      </section>

      <ReverseCartContent locale={locale} tenantId={tenantId} />
    </ReverseClinicShell>
  );
}

function ReverseMissingPage({
  locale,
  slug,
  tenantId,
}: {
  locale: MirrorLocale;
  slug: string;
  tenantId: TenantId;
}) {
  const tenantConfig = getTenantConfig(tenantId);
  const { siteId } = useTenantRuntime();
  const siteTitle =
    tenantId === "reverseclinic" && siteId !== "default"
      ? getReverseClinicSite(siteId as never).homeTitle
      : tenantConfig.brand.siteTitle;

  return (
    <ReverseClinicShell locale={locale} tenantId={tenantId}>
      <section className="reverse-page-hero">
        <p className="reverse-page-eyebrow">MIRROR</p>
        <h2>{slug || siteTitle}</h2>
        <p>{siteTitle} ??륁뵠筌왖 ?怨쀬뵠?怨뺣뮉 ?袁⑹춦 ?怨뚭퍙??? ??녿릭??щ빍??</p>
      </section>
    </ReverseClinicShell>
  );
}

export function ReverseRoutePage({
  locale,
  segments,
  initialCommunityBoardType,
  initialCommunityItems,
  initialMirrorPage,
  initialPopupBanners,
  tenantId,
  siteId,
}: ReverseRoutePageProps) {
  const kind = routeKindFromSegments(segments);
  const { authModal, openAuthModal, session } = useTenantRuntime();
  const pathname = usePathname();
  const slug = segmentsToSlug(segments);
  const routeAuthMode = segments[0] === "login" ? "login" : segments[0] === "join" ? "join" : null;
  const siteFamily =
    tenantId === "reverseclinic" && siteId ? getReverseClinicSite(siteId as never).family : "ko";

  useEffect(() => {
    if (
      routeAuthMode &&
      session.status !== "authenticated" &&
      (authModal.mode !== routeAuthMode || authModal.routePath !== pathname)
    ) {
      openAuthModal(routeAuthMode, { routePath: pathname });
    }
  }, [authModal.mode, authModal.routePath, openAuthModal, pathname, routeAuthMode, session.status]);

  const renderMirrorPage = (model: MirrorPageModel) => (
    <ReverseMirrorPage
      locale={locale}
      model={model}
      submissionMode={kind === "reservation" ? "reservation" : "consult"}
      tenantId={tenantId}
      siteId={siteId}
    />
  );

  if (routeAuthMode) {
    if (initialMirrorPage) {
      return renderMirrorPage(initialMirrorPage);
    }

    return <ReverseHomePage locale={locale} tenantId={tenantId} />;
  }

  if (kind === "home") {
    if (siteFamily === "intl" && initialMirrorPage) {
      return renderMirrorPage(initialMirrorPage);
    }

    return <ReverseHomePage locale={locale} popupBanners={initialPopupBanners} tenantId={tenantId} />;
  }

  if (kind === "cart") {
    return <ReverseCartPage locale={locale} tenantId={tenantId} />;
  }

  if (initialCommunityBoardType) {
    return (
      <ReverseCommunityPage
        boardType={initialCommunityBoardType}
        items={initialCommunityItems}
        locale={locale}
        tenantId={tenantId}
      />
    );
  }

  if (initialMirrorPage) {
    return renderMirrorPage(initialMirrorPage);
  }

  return <ReverseMissingPage locale={locale} slug={slug} tenantId={tenantId} />;
}
