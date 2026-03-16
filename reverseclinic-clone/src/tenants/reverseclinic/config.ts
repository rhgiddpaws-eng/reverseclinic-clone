import {
  isExternalMirrorHref,
  mirrorAssets,
  mirrorBestSellerItems,
  mirrorEventItems,
  mirrorFooterLinks,
  mirrorHeroSlides,
  mirrorInfoLinks,
  mirrorLanguageLinks,
  mirrorMenuGroups,
  mirrorMeta,
  mirrorNetworkLinks,
  mirrorQuickLinks,
  mirrorTopNav,
} from "@/data/reverseclinic-mirror";
import {
  getLocalePrefix,
  localeLabels,
  localeMessages,
  localeOrder,
  reverseClinicLocaleMarketing,
} from "@/data/reverseclinic-locales";
import type { MirrorLocale } from "@/lib/reverseclinic-types";
import type { TenantConfig, TenantRuntime } from "@/lib/tenant-types";
import { reverseClinicMirrorSlugRoute } from "@/tenants/reverseclinic/route-aliases";
import { getAllReverseClinicSites } from "@/tenants/reverseclinic/site-registry";

export const reverseClinicSpecialIdxRoute = {
  "_devnull_/c5db932a7bb848": "best",
  "_devnull_/c5db932a7bb84a": "price",
  "_devnull_/c5db932a7bb84c": "event",
  "_devnull_/c5db932a7bb84e": "talk",
  "terms-of-use": "member/terms-of-use",
  "privacy-policy": "member/privacy-policy",
  "patient-rights": "member/patients-rights",
} as const satisfies Record<string, string>;

export const reverseClinicSimpleAppsRoute = {
  "member/login": "login",
  "member/join": "join",
  "member/terms-of-use": "member/terms-of-use",
  "member/privacy-policy": "member/privacy-policy",
  "member/patients-rights": "member/patients-rights",
} as const satisfies Record<string, string>;

const reverseClinicLocaleHosts = {
  en: "gn-en.reverseclinic.com",
  jp: "gn-jp.reverseclinic.com",
  cn: "gn-cn.reverseclinic.com",
} as const satisfies Partial<Record<Exclude<MirrorLocale, "ko">, string>>;

const reverseClinicMirrorAssets = {
  ...mirrorAssets,
  authCloseIcon: "/reverseclinic-mirror/site/reverseclinic.com/_files/6hRsaRcSl.png",
  authSupportBanner:
    "/reverseclinic-mirror/site/k.kakaocdn.net/14/dn/btqCn0WEmI3/nijroPfbpCa4at5EIsjyf0/o.jpg",
} as const;

export const reverseClinicTenantConfig = {
  id: "reverseclinic",
  isDefault: true,
  locale: {
    defaultLocale: "ko",
    supportedLocales: [...localeOrder],
    localePrefixStrategy: "default-at-root",
    labels: localeLabels,
  },
  host: {
    canonicalHost: "reverseclinic.com",
    acceptedHosts: [
      "reverseclinic.com",
      "www.reverseclinic.com",
      "reverseclinic.localhost",
      "reverseclinic-clone.vercel.app",
      "127.0.0.1",
      "localhost",
      ...getAllReverseClinicSites().map((site) => site.host),
    ],
    localeHosts: reverseClinicLocaleHosts,
    blockedHosts: Object.values(reverseClinicLocaleHosts),
  },
  mirror: {
    origin: "https://reverseclinic.com",
    pageRoot: "/reverseclinic-mirror/pages",
    siteAssetRoot: "/reverseclinic-mirror/site",
    runtimeScriptPath: "/reverseclinic-mirror/runtime.js",
    manifestPath: "src/generated/reverse-mirror-pages.json",
    localAssetHosts: [
      "reverseclinic.com",
      ...getAllReverseClinicSites().map((site) => site.host),
      "k.kakaocdn.net",
      "ssl.daumcdn.net",
      "t1.daumcdn.net",
      "mts.daumcdn.net",
    ],
  },
  routes: {
    specialIdxRoute: reverseClinicSpecialIdxRoute,
    simpleAppsRoute: reverseClinicSimpleAppsRoute,
    mirrorSlugRoute: reverseClinicMirrorSlugRoute,
  },
  storage: {
    cartStorageKey: "reverseclinic-cart-v2",
    sessionCookieName: "reverseclinic_session",
    databaseFileName: "reverseclinic-local.db",
  },
  brand: {
    siteTitle: mirrorMeta.siteTitle,
    businessName: mirrorMeta.businessName,
    branch: mirrorMeta.branch,
    address: mirrorMeta.address,
    owner: mirrorMeta.owner,
    businessNumber: mirrorMeta.businessNumber,
    phone: mirrorMeta.phone,
    copyrightBrand: mirrorMeta.copyrightBrand,
  },
  theme: {
    textColor: "#303030",
    mutedColor: "#707070",
    lightColor: "#909090",
    borderColor: "#cccccc",
    softBorderColor: "#dddddd",
    backgroundColor: "#f7f7f7",
    accentColor: "#ff71b0",
    heroArrowImage: reverseClinicMirrorAssets.heroArrow,
    infoBannerImage: reverseClinicMirrorAssets.infoBanner,
    footerArrowImage: reverseClinicMirrorAssets.footerArrow,
    footerSnsImage: reverseClinicMirrorAssets.footerKakao,
    footerSnsHoverImage: reverseClinicMirrorAssets.footerKakaoHover,
  },
} as const satisfies TenantConfig;

export const reverseClinicTenantRuntime: TenantRuntime = {
  localeMessages,
  localeOrder: [...localeOrder],
  localeLabels,
  localeMarketing: reverseClinicLocaleMarketing,
  getLocalePrefix,
  mirrorAssets: reverseClinicMirrorAssets,
  mirrorMeta: {
    ...mirrorMeta,
    supportHref: "https://pf.kakao.com/_JxfxaxdE",
  },
  mirrorTopNav,
  mirrorMenuGroups,
  mirrorLanguageLinks,
  mirrorNetworkLinks,
  mirrorHeroSlides,
  mirrorEventItems,
  mirrorBestSellerItems,
  mirrorFooterLinks,
  mirrorQuickLinks,
  mirrorInfoLinks,
  isExternalMirrorHref,
};
