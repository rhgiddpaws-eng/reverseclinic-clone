export type MirrorLinkItem = {
  label: string;
  href: string;
  labelKo?: string;
  target?: "_blank";
};

export type MirrorLanguageItem = MirrorLinkItem & {
  iconSrc: string;
};

export type MirrorMenuGroup = {
  label: string;
  href: string;
  items: MirrorLinkItem[];
};

export type MirrorHeroSlide = {
  id: string;
  kind: "video" | "image";
  src: string;
  alt: string;
};

export type MirrorCard = {
  title: string;
  price?: string;
  href: string;
  imageSrc: string;
};

// 원본의 /_files 경로를 로컬 미러 경로로 고정한다.
const file = (name: string) => `/reverseclinic-mirror/files/${name}`;

export const mirrorAssets = {
  logoDesktop: file("6yaF00sT7.webp"),
  logoMobile: file("6yaF3p3ap.webp"),
  menuIcon: file("5T_VCCodx.webp"),
  mobileMenuIcon: file("5P6dTap56.webp"),
  cartIcon: file("5UeBz5roE.webp"),
  dropdownArrow: file("65O7j5zM7.webp"),
  languageKr: file("65O7j5Ecs.webp"),
  languageEn: file("65O7j5Fha.webp"),
  languageJp: file("65O7j5GZY.webp"),
  languageCn: file("65O7j5Icw.webp"),
  networkArrow: file("5U48MHEUQ.webp"),
  heroVideo: file("6AOywqTea.mp4"),
  heroImage02: file("6y-IGILID.webp"),
  heroImage03: file("5T_VtSVBY.webp"),
  heroImage04: file("5T_VuxbQr.webp"),
  heroImage05: file("5T_VuRZLc.webp"),
  heroArrow: file("6uHYN04We.webp"),
  eventNext: file("5U06DZf-W.webp"),
  eventPrev: file("5U06m8iT3.webp"),
  tvPoster: file("6ykpMK4Lc.webp"),
  bestHoverIcon: file("5U07uCibo.webp"),
  infoBanner: file("6hRCIsFcK.webp"),
  footerArrow: file("5MR1U6mr1.webp"),
  footerKakao: file("5TsU7Mz94.webp"),
  footerKakaoHover: file("5U5HQoGlZ.webp"),
  quickMenuBar: file("5TWCxbKVw.webp"),
} as const;

export const mirrorMeta = {
  siteTitle: "리버스클리닉 강남점",
  businessName: "리버스의원",
  branch: "강남점",
  address: "서울특별시 서초구 강남대로 415, 9층 (서초동, 대동빌딩)",
  owner: "신영호",
  businessNumber: "363-20-02101",
  phone: "1544.0890",
  copyrightBrand: "REVERSE CLINIC",
  youtubeWatch: "https://www.youtube.com/watch?v=75Wse6QFbuw",
} as const;

export const mirrorTopNav: MirrorLinkItem[] = [
  { label: "BEST", labelKo: "베스트", href: "/index.php?idx=_devnull_/c5db932a7bb848" },
  { label: "PRICE", labelKo: "비용안내", href: "/index.php?idx=_devnull_/c5db932a7bb84a" },
  { label: "EVENT", labelKo: "이벤트", href: "/index.php?idx=_devnull_/c5db932a7bb84c" },
  { label: "TALK", labelKo: "상담·예약", href: "/index.php?idx=_devnull_/c5db932a7bb84e" },
];

export const mirrorMenuGroups: MirrorMenuGroup[] = [
  {
    label: "베스트",
    href: "/index.php?idx=c5df21019995b8",
    items: [
      { label: "윤곽톡스", href: "/index.php?idx=c5df21019995b8/c5e0d6c5a0aec7" },
      { label: "바디슬림톡스", href: "/index.php?idx=c5df21019995b8/c5df21023995c1" },
      { label: "그리미레이저", href: "/index.php?idx=c5df21019995b8/c67ee586beacf7" },
      { label: "색소킬레이저", href: "/index.php?idx=c5df21019995b8/c5df21024995c5" },
    ],
  },
  {
    label: "레이저",
    href: "/index.php?idx=c5db92aa9f4b1f",
    items: [
      { label: "아꼴레이드", href: "/index.php?idx=c5db92aa9f4b1f/c5db92fedf4b40" },
      { label: "엑셀V플러스", href: "/index.php?idx=c5db92aa9f4b1f/c5db92fedf4b42" },
      { label: "인라이튼", href: "/index.php?idx=c5db92aa9f4b1f/c5de0c19341d52" },
      { label: "엔디메드", href: "/index.php?idx=c5db92aa9f4b1f/c5de0c19341d50" },
      { label: "포텐자", href: "/index.php?idx=c5db92aa9f4b1f/c5de0c19241d4a" },
    ],
  },
  {
    label: "리프팅",
    href: "/index.php?idx=c5db92aa9f4b21",
    items: [
      { label: "울쎄라피 프라임", href: "/index.php?idx=c5db92aa9f4b21/c6936c0e35dc68" },
      { label: "인모드리프팅", href: "/index.php?idx=c5db92aa9f4b21/c5f23897184791" },
      { label: "슈링크 유니버스", href: "/index.php?idx=c5db92aa9f4b21/c5db93004f4b4b" },
      { label: "볼뉴머", href: "/index.php?idx=c5db92aa9f4b21/c5de0c1bb41d6b" },
      { label: "텐트리플", href: "/index.php?idx=c5db92aa9f4b21/c5de0c1ba41d65" },
      { label: "프라임레이즈", href: "/index.php?idx=c5db92aa9f4b21/c5de0c1ba41d69" },
      { label: "올리지오", href: "/index.php?idx=c5db92aa9f4b21/c5de0c1b941d61" },
      { label: "덴서티 하이", href: "/index.php?idx=c5db92aa9f4b21/c686389cb1219a" },
      { label: "써마지 FLX", href: "/index.php?idx=c5db92aa9f4b21/c5db9301bf4b58" },
    ],
  },
  {
    label: "스킨케어",
    href: "/index.php?idx=c5db92aa9f4b23",
    items: [
      { label: "여드름케어", href: "/index.php?idx=c5db92aa9f4b23/c5db9301af4b54" },
      { label: "필링Mall", href: "/index.php?idx=c5db92aa9f4b23/c5db9301bf4b56" },
      { label: "스킨부스터", href: "/index.php?idx=c5db92aa9f4b23/c5db9301bf4b5a" },
    ],
  },
  {
    label: "쁘띠성형",
    href: "/index.php?idx=c5db92aa9f4b25",
    items: [
      { label: "보톡스/땀주사", href: "/index.php?idx=c5db92aa9f4b25/c5db9303af4b63" },
      { label: "윤곽주사/윤곽톡스", href: "/index.php?idx=c5db92aa9f4b25/c5db9303af4b65" },
      { label: "브이올렛", href: "/index.php?idx=c5db92aa9f4b25/c5db9303cf4b69" },
      { label: "하이코/미스코", href: "/index.php?idx=c5db92aa9f4b25/c5db9303bf4b67" },
      { label: "필러", href: "/index.php?idx=c5db92aa9f4b25/c5db9303cf4b6b" },
    ],
  },
  {
    label: "바디/체형",
    href: "/index.php?idx=c5db92f80f4b28",
    items: [
      { label: "울핏:바디슈링크", href: "/index.php?idx=c5db92f80f4b28/c5df06056dcc44" },
      { label: "HPL", href: "/index.php?idx=c5db92f80f4b28/c5db9305ff4b72" },
      { label: "바디슬림톡스", href: "/index.php?idx=c5db92f80f4b28/c5db9305ff4b74" },
      { label: "바디슬림주사", href: "/index.php?idx=c5db92f80f4b28/c5db93060f4b76" },
    ],
  },
  {
    label: "레이저 제모",
    href: "/index.php?idx=c5db92f82f4b2a",
    items: [
      { label: "여자 레이저 제모", href: "/index.php?idx=c5db92f82f4b2a/c5db93075f4b7d" },
      { label: "남자 레이저 제모", href: "/index.php?idx=c5db92f82f4b2a/c5df21023995bd" },
    ],
  },
  {
    label: "리버스 소개",
    href: "/index.php?idx=c5db92f82f4b2c",
    items: [
      { label: "지점소개", href: "/index.php?idx=c5db92f82f4b2c/c5e18003295f46" },
      { label: "리버스 소개", href: "/index.php?idx=c5db92f82f4b2c/c5db93080f4b82" },
      { label: "지점 가맹문의", href: "/index.php?idx=c5db92f82f4b2c/c5db93080f4b84" },
    ],
  },
  {
    label: "커뮤니티",
    href: "/index.php?idx=c5db92f82f4b2e",
    items: [
      { label: "시술후기", href: "/index.php?idx=c5db92f82f4b2e/c5db9308bf4b8b" },
      { label: "전후사진", href: "/index.php?idx=c5db92f82f4b2e/c5db9308bf4b8d" },
      { label: "미디어 IN", href: "/index.php?idx=c5db92f82f4b2e/c5db9308cf4b8f" },
      { label: "공지사항", href: "/index.php?idx=c5db92f82f4b2e/c5db9308cf4b91" },
      { label: "칭찬/불만접수", href: "/index.php?idx=c5db92f82f4b2e/c5db9308cf4b93" },
    ],
  },
];

export const mirrorLanguageLinks: MirrorLanguageItem[] = [
  { label: "KR", href: "/", iconSrc: mirrorAssets.languageKr },
  { label: "EN", href: "https://gn-en.reverseclinic.com/", iconSrc: mirrorAssets.languageEn, target: "_blank" },
  { label: "JP", href: "https://gn-jp.reverseclinic.com/", iconSrc: mirrorAssets.languageJp, target: "_blank" },
  { label: "CN", href: "https://gn-cn.reverseclinic.com/", iconSrc: mirrorAssets.languageCn, target: "_blank" },
];

export const mirrorNetworkLinks: MirrorLinkItem[] = [
  { label: "강남점", href: "http://reverseclinic.com", target: "_blank" },
  { label: "홍대점", href: "http://hd.reverseclinic.com", target: "_blank" },
  { label: "명동점", href: "http://md.reverseclinic.com", target: "_blank" },
  { label: "인천구월점", href: "http://ic.reverseclinic.com", target: "_blank" },
  { label: "수원점", href: "http://sw.reverseclinic.com", target: "_blank" },
  { label: "노원점", href: "http://nw.reverseclinic.com", target: "_blank" },
  { label: "일산점", href: "https://is.reverseclinic.com/", target: "_blank" },
  { label: "분당점", href: "https://bd.reverseclinic.com/", target: "_blank" },
];

export const mirrorHeroSlides: MirrorHeroSlide[] = [
  { id: "hero-01", kind: "video", src: mirrorAssets.heroVideo, alt: "리버스클리닉 메인 비디오" },
  { id: "hero-02", kind: "image", src: mirrorAssets.heroImage02, alt: "리버스클리닉 메인 이미지 2" },
  { id: "hero-03", kind: "image", src: mirrorAssets.heroImage03, alt: "리버스클리닉 메인 이미지 3" },
  { id: "hero-04", kind: "image", src: mirrorAssets.heroImage04, alt: "리버스클리닉 메인 이미지 4" },
  { id: "hero-05", kind: "image", src: mirrorAssets.heroImage05, alt: "리버스클리닉 메인 이미지 5" },
];

export const mirrorEventItems: MirrorCard[] = [
  { title: "윤곽톡스", price: "50,000원", href: "/?idx=c5df21019995b8/c5e0d6c5a0aec7", imageSrc: file("6tZ6NDpGx.webp") },
  { title: "볼뉴머리프팅", price: "99,000원", href: "/?idx=c5db92aa9f4b21/c5de0c1bb41d6b", imageSrc: file("6tZ6S1Mzi.webp") },
  { title: "브라질리언제모 5회", price: "239,000원", href: "/?idx=c5db92f82f4b2a/c5db93075f4b7d", imageSrc: file("6tZ6UGkzG.webp") },
  { title: "남자레이저제모", price: "149,000원", href: "/?idx=c5db92f82f4b2a/c5df21023995bd", imageSrc: file("6tZ6XQ0Fj.webp") },
  { title: "색소킬레이저", price: "99,000원", href: "/?idx=c5db92aa9f4b1f/c5db92fedf4b40", imageSrc: file("6tZ6ZrJOS.webp") },
];

export const mirrorBestSellerItems: MirrorCard[] = [
  { title: "턱보톡스", price: "25,000", href: "/?idx=c5db92aa9f4b25/c5db9303af4b63", imageSrc: file("5U4a5tm9M.webp") },
  { title: "볼뉴머 300샷", price: "290,000", href: "/?idx=c5db92aa9f4b21/c5de0c1bb41d6b", imageSrc: file("5U4d6YPG5.webp") },
  { title: "윤곽톡스", price: "50,000", href: "/?idx=c5db92aa9f4b25/c5db9303af4b65", imageSrc: file("5UuRqbAQW.webp") },
  { title: "울핏 500샷", price: "150,000", href: "/?idx=c5db92f80f4b28/c5df06056dcc44", imageSrc: file("5U48-MSro.webp") },
  { title: "바디슬림주사", price: "59,000", href: "/?idx=c5db92f80f4b28/c5db93060f4b76", imageSrc: file("5U497NFOO.webp") },
  { title: "슈링크유니버스 울트라F 100샷", price: "55,000", href: "/?idx=c5db92aa9f4b21/c5db93004f4b4b", imageSrc: file("6cobB85Zk.webp") },
  { title: "인모드 1부위(FX)", price: "69,000", href: "/?idx=c5db92aa9f4b21/c5f23897184791", imageSrc: file("65CmlNOT0.webp") },
  { title: "색소킬레이저", price: "99,000", href: "/?idx=c5db92aa9f4b1f/c5db92fedf4b40", imageSrc: file("5U48UiGCc.webp") },
  { title: "무턱필러 1cc", price: "100,000", href: "/?idx=c5db92aa9f4b25/c5db9303cf4b6b", imageSrc: file("5U4k5n2sD.webp") },
  { title: "이마필러 3cc+이마/미간 보톡스", price: "300,000", href: "/?idx=c5db92aa9f4b25/c5db9303cf4b6b", imageSrc: file("5U4k-L4dK.webp") },
];

export const mirrorFooterLinks: MirrorLinkItem[] = [
  { label: "리버스소개", href: "/index.php?idx=c5db92f82f4b2c/c5db93080f4b82" },
  { label: "이용약관", href: "/index.php?idx=terms-of-use" },
  { label: "개인정보취급방침", href: "/index.php?idx=privacy-policy" },
  { label: "환자권리장전", href: "/index.php?idx=patient-rights" },
  { label: "지점가맹문의", href: "/index.php?idx=c5db92f82f4b2c/c5db93080f4b84" },
];

export const mirrorQuickLinks: MirrorLinkItem[] = [
  { label: "온라인예약", href: "/index.php?idx=_devnull_/c5db932a7bb84e" },
  { label: "카카오톡상담", href: "https://pf.kakao.com/_JxfxaxdE", target: "_blank" },
  { label: "온라인상담", href: "/index.php?idx=_devnull_/c5db932a7bb84e" },
  { label: "시술후기", href: "/index.php?idx=c5db92f82f4b2e/c5db9308bf4b8b" },
  { label: "전후사진", href: "/index.php?idx=c5db92f82f4b2e/c5db9308bf4b8d" },
  { label: "이벤트", href: "/index.php?idx=_devnull_/c5db932a7bb84c" },
  { label: "찾아오시는길", href: "/index.php?idx=c5db92f82f4b2c/c5e18003295f46" },
];

export const mirrorInfoLinks: MirrorLinkItem[] = [
  { label: "온라인상담", href: "/index.php?idx=_devnull_/c5db932a7bb84e" },
  { label: "카카오톡상담", href: "https://pf.kakao.com/_JxfxaxdE", target: "_blank" },
  { label: "진료시간안내", href: "/index.php?idx=c5db92f82f4b2c/c5e18003295f46" },
  { label: "찾아오시는길", href: "/index.php?idx=c5db92f82f4b2c/c5e18003295f46" },
];

const internalPattern = /^(https?:\/\/(?:[a-z0-9-]+\.)?reverseclinic\.com)?(\/.*)?$/i;

// 원본 내부 링크는 placeholder 라우트로 매핑하고 외부 링크는 그대로 둔다.
export function toMirrorAppHref(href: string): string {
  if (!href || href === "#") {
    return "#";
  }

  if (href === "/" || href === "/?_main=index") {
    return "/";
  }

  const internal = href.match(internalPattern);
  if (!internal) {
    return href;
  }

  const path = internal[2] ?? "/";
  const idxMatch = path.match(/[?&]idx=([^&#]+)/);
  if (idxMatch) {
    return `/placeholder/${encodeURIComponent(idxMatch[1].replaceAll("/", "--"))}`;
  }

  if (path.includes("_main=index")) {
    return "/";
  }

  const normalized = path
    .replace(/^\/+/, "")
    .replaceAll("/", "--")
    .replaceAll("?", "_")
    .replaceAll("&", "_");

  return normalized ? `/placeholder/${encodeURIComponent(normalized)}` : "/";
}

export function isExternalMirrorHref(href: string): boolean {
  if (!href) {
    return false;
  }

  if (href === "/") {
    return false;
  }

  return href.startsWith("http://") || href.startsWith("https://");
}
