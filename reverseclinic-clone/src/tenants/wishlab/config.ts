import {
  getLocalePrefix,
  localeLabels,
  localeMessages,
  localeOrder,
} from "@/data/reverseclinic-locales";
import type {
  TenantConfig,
  TenantMirrorAssets,
  TenantRuntime,
} from "@/lib/tenant-types";

function svgDataUri(markup: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function panelSvg(options: {
  width: number;
  height: number;
  backgroundFrom: string;
  backgroundTo: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  const { width, height, backgroundFrom, backgroundTo, title, subtitle, align = "left" } = options;
  const textAnchor = align === "center" ? "middle" : "start";
  const textX = align === "center" ? width / 2 : 40;

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${backgroundFrom}" />
          <stop offset="100%" stop-color="${backgroundTo}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="24" fill="url(#g)" />
      <circle cx="${width - 90}" cy="90" r="42" fill="rgba(255,255,255,0.22)" />
      <circle cx="${width - 150}" cy="${height - 70}" r="26" fill="rgba(255,255,255,0.18)" />
      <text x="${textX}" y="${height / 2 - 14}" fill="#ffffff" font-size="34" font-family="Arial" font-weight="700" text-anchor="${textAnchor}">${title}</text>
      <text x="${textX}" y="${height / 2 + 26}" fill="rgba(255,255,255,0.88)" font-size="16" font-family="Arial" text-anchor="${textAnchor}">${subtitle ?? ""}</text>
    </svg>
  `);
}

function iconSvg(label: string, background: string, foreground = "#ffffff") {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="18" fill="${background}" />
      <text x="32" y="38" fill="${foreground}" font-size="18" font-family="Arial" font-weight="700" text-anchor="middle">${label}</text>
    </svg>
  `);
}

function lineArrowSvg(color: string, rotate = 0) {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
      <g transform="rotate(${rotate} 25 25)">
        <circle cx="25" cy="25" r="24" fill="none" stroke="${color}" stroke-width="1.5" />
        <path d="M18 25h14M26 17l8 8-8 8" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>
  `);
}

function labelBadge(text: string, background: string, foreground = "#ffffff") {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="74" height="38" viewBox="0 0 74 38">
      <rect width="74" height="38" rx="19" fill="${background}" />
      <text x="37" y="24" fill="${foreground}" font-size="16" font-family="Arial" font-weight="700" text-anchor="middle">${text}</text>
    </svg>
  `);
}

const wishLabAssets: TenantMirrorAssets = {
  logoDesktop: panelSvg({
    width: 320,
    height: 92,
    backgroundFrom: "#0f766e",
    backgroundTo: "#164e63",
    title: "WISHLAB",
    subtitle: "Skin Studio",
  }),
  logoMobile: panelSvg({
    width: 180,
    height: 72,
    backgroundFrom: "#0f766e",
    backgroundTo: "#164e63",
    title: "WISH",
    subtitle: "Lab",
    align: "center",
  }),
  menuIcon: iconSvg("M", "#0f766e"),
  mobileMenuIcon: iconSvg("N", "#164e63"),
  cartIcon: iconSvg("B", "#be185d"),
  dropdownArrow: iconSvg("V", "#0f766e"),
  languageKr: labelBadge("KR", "#0f766e"),
  languageEn: labelBadge("EN", "#164e63"),
  languageJp: labelBadge("JP", "#1d4ed8"),
  languageCn: labelBadge("CN", "#be185d"),
  networkArrow: iconSvg("+", "#0f766e"),
  heroImage02: panelSvg({
    width: 1400,
    height: 860,
    backgroundFrom: "#115e59",
    backgroundTo: "#1d4ed8",
    title: "Quiet Skin Engineering",
    subtitle: "WishLab signature routines",
  }),
  heroImage03: panelSvg({
    width: 1400,
    height: 860,
    backgroundFrom: "#9333ea",
    backgroundTo: "#ec4899",
    title: "Tone & Texture",
    subtitle: "Layered brightening care",
  }),
  heroImage04: panelSvg({
    width: 1400,
    height: 860,
    backgroundFrom: "#0f766e",
    backgroundTo: "#22c55e",
    title: "Lift With Light",
    subtitle: "Non-surgical sculpting plans",
  }),
  heroImage05: panelSvg({
    width: 1400,
    height: 860,
    backgroundFrom: "#b45309",
    backgroundTo: "#f97316",
    title: "Body Balance Lab",
    subtitle: "Fast onboarding sample tenant",
  }),
  heroArrow: lineArrowSvg("#ffffff"),
  eventNext: lineArrowSvg("#0f766e"),
  eventPrev: lineArrowSvg("#0f766e", 180),
  tvPoster: panelSvg({
    width: 960,
    height: 540,
    backgroundFrom: "#0f766e",
    backgroundTo: "#111827",
    title: "WISHLAB TV",
    subtitle: "Local-only poster asset",
    align: "center",
  }),
  bestHoverIcon: iconSvg("GO", "#ffffff", "#0f766e"),
  infoBanner: panelSvg({
    width: 1200,
    height: 381,
    backgroundFrom: "#115e59",
    backgroundTo: "#1e293b",
    title: "WishLab Contact Deck",
    subtitle: "Consultation, reservation, hours and directions",
  }),
  footerArrow: lineArrowSvg("#0f766e"),
  footerKakao: iconSvg("W", "#0f766e"),
  footerKakaoHover: iconSvg("W", "#be185d"),
  quickMenuBar: panelSvg({
    width: 80,
    height: 330,
    backgroundFrom: "#0f766e",
    backgroundTo: "#164e63",
    title: "W",
    subtitle: "",
    align: "center",
  }),
  authCloseIcon: iconSvg("X", "#111827"),
  authSupportBanner: panelSvg({
    width: 560,
    height: 120,
    backgroundFrom: "#164e63",
    backgroundTo: "#be185d",
    title: "WishLab Support",
    subtitle: "Tenant-scoped channel banner",
    align: "center",
  }),
};

const wishLabMeta = {
  siteTitle: "WishLab Skin Studio",
  businessName: "WishLab Skin Studio",
  branch: "Seoul Flagship",
  address: "18 Teheran-ro, Gangnam-gu, Seoul",
  owner: "WishLab Team",
  businessNumber: "100-20-30000",
  phone: "02-555-1700",
  copyrightBrand: "WISHLAB",
  youtubeWatch: "https://www.youtube.com/watch?v=75Wse6QFbuw",
  supportHref: "https://example.com/wishlab-support",
} as const;

const wishLabTopNav = [
  { label: "BEST", labelKo: "BEST", href: "/best" },
  { label: "EVENT", labelKo: "EVENT", href: "/event" },
  { label: "PRICE", labelKo: "PRICE", href: "/price" },
  { label: "TALK", labelKo: "TALK", href: "/talk" },
];

const wishLabMenuGroups = [
  {
    label: "Skin",
    href: "/skin",
    items: [
      { label: "Glow Peel", href: "/skin/glow-peel" },
      { label: "Tone Reset", href: "/skin/tone-reset" },
      { label: "Pore Lab", href: "/skin/pore-lab" },
    ],
  },
  {
    label: "Lift",
    href: "/lift",
    items: [
      { label: "Contour Wave", href: "/lift/contour-wave" },
      { label: "Line Reset", href: "/lift/line-reset" },
      { label: "Tight Frame", href: "/lift/tight-frame" },
    ],
  },
  {
    label: "Body",
    href: "/body",
    items: [
      { label: "Body Ring", href: "/body/body-ring" },
      { label: "Core Slim", href: "/body/core-slim" },
      { label: "Quick Shape", href: "/body/quick-shape" },
    ],
  },
  {
    label: "Brand",
    href: "/brand",
    items: [
      { label: "WishLab Story", href: "/brand/story" },
      { label: "Hours", href: "/brand/hours" },
      { label: "Directions", href: "/brand/directions" },
    ],
  },
];

const wishLabHeroSlides = [
  { id: "wishlab-hero-01", kind: "image" as const, src: wishLabAssets.heroImage02, alt: "WishLab hero 1" },
  { id: "wishlab-hero-02", kind: "image" as const, src: wishLabAssets.heroImage03, alt: "WishLab hero 2" },
  { id: "wishlab-hero-03", kind: "image" as const, src: wishLabAssets.heroImage04, alt: "WishLab hero 3" },
  { id: "wishlab-hero-04", kind: "image" as const, src: wishLabAssets.heroImage05, alt: "WishLab hero 4" },
  { id: "wishlab-hero-05", kind: "image" as const, src: wishLabAssets.heroImage02, alt: "WishLab hero 5" },
];

const wishLabEventItems = [
  {
    title: "Glow Peel",
    price: "Starter 39,000",
    href: "/skin/glow-peel",
    imageSrc: panelSvg({
      width: 520,
      height: 620,
      backgroundFrom: "#0f766e",
      backgroundTo: "#22c55e",
      title: "Glow Peel",
      subtitle: "Starter campaign",
      align: "center",
    }),
  },
  {
    title: "Tone Reset",
    price: "Launch 59,000",
    href: "/skin/tone-reset",
    imageSrc: panelSvg({
      width: 520,
      height: 620,
      backgroundFrom: "#1d4ed8",
      backgroundTo: "#7c3aed",
      title: "Tone Reset",
      subtitle: "Fast scaffold event",
      align: "center",
    }),
  },
  {
    title: "Contour Wave",
    price: "Launch 129,000",
    href: "/lift/contour-wave",
    imageSrc: panelSvg({
      width: 520,
      height: 620,
      backgroundFrom: "#0f766e",
      backgroundTo: "#164e63",
      title: "Contour Wave",
      subtitle: "Lift focus",
      align: "center",
    }),
  },
  {
    title: "Core Slim",
    price: "Launch 99,000",
    href: "/body/core-slim",
    imageSrc: panelSvg({
      width: 520,
      height: 620,
      backgroundFrom: "#b45309",
      backgroundTo: "#be185d",
      title: "Core Slim",
      subtitle: "Body routine",
      align: "center",
    }),
  },
];

const wishLabBestSellerItems = [
  {
    title: "Quiet Reset",
    price: "49,000",
    href: "/skin/quiet-reset",
    imageSrc: panelSvg({
      width: 400,
      height: 400,
      backgroundFrom: "#0f766e",
      backgroundTo: "#164e63",
      title: "Quiet Reset",
      subtitle: "WishLab best",
      align: "center",
    }),
  },
  {
    title: "Glow Layer",
    price: "79,000",
    href: "/skin/glow-layer",
    imageSrc: panelSvg({
      width: 400,
      height: 400,
      backgroundFrom: "#1d4ed8",
      backgroundTo: "#9333ea",
      title: "Glow Layer",
      subtitle: "Tone brightening",
      align: "center",
    }),
  },
  {
    title: "Lift Frame",
    price: "149,000",
    href: "/lift/lift-frame",
    imageSrc: panelSvg({
      width: 400,
      height: 400,
      backgroundFrom: "#115e59",
      backgroundTo: "#22c55e",
      title: "Lift Frame",
      subtitle: "Contour plan",
      align: "center",
    }),
  },
  {
    title: "Body Ring",
    price: "119,000",
    href: "/body/body-ring",
    imageSrc: panelSvg({
      width: 400,
      height: 400,
      backgroundFrom: "#b45309",
      backgroundTo: "#f97316",
      title: "Body Ring",
      subtitle: "Shape program",
      align: "center",
    }),
  },
];

const wishLabFooterLinks = [
  { label: "Brand Story", href: "/brand/story" },
  { label: "Terms", href: "/member/terms-of-use" },
  { label: "Privacy", href: "/member/privacy-policy" },
  { label: "Patient Rights", href: "/member/patients-rights" },
  { label: "Directions", href: "/brand/directions" },
];

const wishLabQuickLinks = [
  { label: "Reserve", href: "/reservation" },
  { label: "Support", href: "https://example.com/wishlab-support", target: "_blank" as const },
  { label: "Consult", href: "/talk" },
  { label: "Review", href: "/brand/story" },
  { label: "Gallery", href: "/skin/glow-peel" },
  { label: "Event", href: "/event" },
  { label: "Directions", href: "/brand/directions" },
];

const wishLabInfoLinks = [
  { label: "Consult", href: "/talk" },
  { label: "Support", href: "https://example.com/wishlab-support", target: "_blank" as const },
  { label: "Hours", href: "/brand/hours" },
  { label: "Directions", href: "/brand/directions" },
];

const wishLabRuntime: TenantRuntime = {
  localeMessages,
  localeOrder: [...localeOrder],
  localeLabels,
  localeMarketing: {
    ko: { homeTitle: "WishLab Skin Studio" },
    en: { homeTitle: "WishLab Skin Studio" },
    jp: { homeTitle: "WishLab Skin Studio" },
    cn: { homeTitle: "WishLab Skin Studio" },
  },
  getLocalePrefix,
  mirrorAssets: wishLabAssets,
  mirrorMeta: wishLabMeta,
  mirrorTopNav: wishLabTopNav,
  mirrorMenuGroups: wishLabMenuGroups,
  mirrorLanguageLinks: [
    { label: "KR", href: "/", iconSrc: wishLabAssets.languageKr },
    { label: "EN", href: "/en", iconSrc: wishLabAssets.languageEn },
    { label: "JP", href: "/jp", iconSrc: wishLabAssets.languageJp },
    { label: "CN", href: "/cn", iconSrc: wishLabAssets.languageCn },
  ],
  mirrorNetworkLinks: [
    { label: "WishLab Seoul", href: "/" },
    { label: "Directions", href: "/brand/directions" },
    { label: "Support", href: "https://example.com/wishlab-support", target: "_blank" },
  ],
  mirrorHeroSlides: wishLabHeroSlides,
  mirrorEventItems: wishLabEventItems,
  mirrorBestSellerItems: wishLabBestSellerItems,
  mirrorFooterLinks: wishLabFooterLinks,
  mirrorQuickLinks: wishLabQuickLinks,
  mirrorInfoLinks: wishLabInfoLinks,
  isExternalMirrorHref: (href: string) => /^https?:\/\//i.test(href),
};

export const wishLabTenantConfig = {
  id: "wishlab",
  isDefault: false,
  locale: {
    defaultLocale: "ko",
    supportedLocales: [...localeOrder],
    localePrefixStrategy: "default-at-root",
    labels: localeLabels,
  },
  host: {
    canonicalHost: "wishlab.example",
    acceptedHosts: [
      "wishlab.example",
      "www.wishlab.example",
      "wishlab.localhost",
    ],
    localeHosts: {},
    blockedHosts: [],
  },
  mirror: {
    origin: "https://wishlab.example",
    pageRoot: "/wishlab-mirror/pages",
    siteAssetRoot: "/wishlab-mirror/site",
    runtimeScriptPath: "/wishlab-mirror/runtime.js",
    manifestPath: "src/generated/wishlab-mirror-pages.json",
    localAssetHosts: ["wishlab.example", "wishlab.localhost"],
  },
  routes: {
    specialIdxRoute: {},
    simpleAppsRoute: {
      "member/login": "login",
      "member/join": "join",
      "member/terms-of-use": "member/terms-of-use",
      "member/privacy-policy": "member/privacy-policy",
      "member/patients-rights": "member/patients-rights",
    },
  },
  storage: {
    cartStorageKey: "wishlab-cart-v1",
    sessionCookieName: "wishlab_session",
    databaseFileName: "wishlab-local.db",
  },
  brand: {
    siteTitle: wishLabMeta.siteTitle,
    businessName: wishLabMeta.businessName,
    branch: wishLabMeta.branch,
    address: wishLabMeta.address,
    owner: wishLabMeta.owner,
    businessNumber: wishLabMeta.businessNumber,
    phone: wishLabMeta.phone,
    copyrightBrand: wishLabMeta.copyrightBrand,
  },
  theme: {
    textColor: "#0f172a",
    mutedColor: "#475569",
    lightColor: "#64748b",
    borderColor: "#cbd5e1",
    softBorderColor: "#dbe4f0",
    backgroundColor: "#f8fafc",
    accentColor: "#0f766e",
    heroArrowImage: wishLabAssets.heroArrow,
    infoBannerImage: wishLabAssets.infoBanner,
    footerArrowImage: wishLabAssets.footerArrow,
    footerSnsImage: wishLabAssets.footerKakao,
    footerSnsHoverImage: wishLabAssets.footerKakaoHover,
  },
} as const satisfies TenantConfig;

export const wishLabTenantRuntime = wishLabRuntime;
