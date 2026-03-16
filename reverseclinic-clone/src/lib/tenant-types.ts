import type {
  MirrorCard,
  MirrorHeroSlide,
  MirrorLanguageItem,
  MirrorLinkItem,
  MirrorMenuGroup,
} from "@/data/reverseclinic-mirror";
import type { LocaleUiMessages } from "@/lib/locale-runtime";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

export type TenantId = "reverseclinic" | "wishlab" | (string & {});

export type TenantLocalePolicy = {
  defaultLocale: MirrorLocale;
  supportedLocales: MirrorLocale[];
  localePrefixStrategy: "default-at-root";
  labels: Record<MirrorLocale, string>;
};

export type TenantHostPolicy = {
  canonicalHost: string;
  acceptedHosts: string[];
  localeHosts: Partial<Record<Exclude<MirrorLocale, "ko">, string>>;
  blockedHosts: string[];
};

export type TenantMirrorPolicy = {
  origin: string;
  pageRoot: string;
  siteAssetRoot: string;
  runtimeScriptPath: string;
  manifestPath: string;
  localAssetHosts: string[];
};

export type TenantRouteSourcePolicy = {
  specialIdxRoute: Record<string, string>;
  simpleAppsRoute: Record<string, string>;
  mirrorSlugRoute?: Record<string, string>;
};

export type TenantStoragePolicy = {
  cartStorageKey: string;
  sessionCookieName: string;
  databaseFileName: string;
};

export type TenantBrandMeta = {
  siteTitle: string;
  businessName: string;
  branch: string;
  address: string;
  owner: string;
  businessNumber: string;
  phone: string;
  copyrightBrand: string;
};

export type TenantMirrorMeta = TenantBrandMeta & {
  youtubeWatch: string;
  supportHref: string;
};

export type TenantTheme = {
  textColor: string;
  mutedColor: string;
  lightColor: string;
  borderColor: string;
  softBorderColor: string;
  backgroundColor: string;
  accentColor: string;
  heroArrowImage: string;
  infoBannerImage: string;
  footerArrowImage: string;
  footerSnsImage: string;
  footerSnsHoverImage: string;
};

export type TenantMirrorAssets = {
  logoDesktop: string;
  logoMobile: string;
  menuIcon: string;
  mobileMenuIcon: string;
  cartIcon: string;
  dropdownArrow: string;
  languageKr: string;
  languageEn: string;
  languageJp: string;
  languageCn: string;
  networkArrow: string;
  heroVideo?: string;
  heroImage02: string;
  heroImage03: string;
  heroImage04: string;
  heroImage05: string;
  heroArrow: string;
  eventNext: string;
  eventPrev: string;
  tvPoster: string;
  bestHoverIcon: string;
  infoBanner: string;
  footerArrow: string;
  footerKakao: string;
  footerKakaoHover: string;
  quickMenuBar: string;
  authCloseIcon: string;
  authSupportBanner: string;
};

export type TenantRuntime = {
  localeMessages: Record<MirrorLocale, LocaleUiMessages>;
  localeOrder: MirrorLocale[];
  localeLabels: Record<MirrorLocale, string>;
  localeMarketing: Record<MirrorLocale, { homeTitle: string }>;
  getLocalePrefix: (locale: MirrorLocale) => string;
  mirrorAssets: TenantMirrorAssets;
  mirrorMeta: TenantMirrorMeta;
  mirrorTopNav: MirrorLinkItem[];
  mirrorMenuGroups: MirrorMenuGroup[];
  mirrorLanguageLinks: MirrorLanguageItem[];
  mirrorNetworkLinks: MirrorLinkItem[];
  mirrorHeroSlides: MirrorHeroSlide[];
  mirrorEventItems: MirrorCard[];
  mirrorBestSellerItems: MirrorCard[];
  mirrorFooterLinks: MirrorLinkItem[];
  mirrorQuickLinks: MirrorLinkItem[];
  mirrorInfoLinks: MirrorLinkItem[];
  isExternalMirrorHref: (href: string) => boolean;
};

export type TenantConfig = {
  id: TenantId;
  isDefault: boolean;
  locale: TenantLocalePolicy;
  host: TenantHostPolicy;
  mirror: TenantMirrorPolicy;
  routes: TenantRouteSourcePolicy;
  storage: TenantStoragePolicy;
  brand: TenantBrandMeta;
  theme: TenantTheme;
};
