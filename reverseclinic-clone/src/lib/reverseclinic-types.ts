export type MirrorLocale = "ko" | "en" | "jp" | "cn";

export type MirrorBranch =
  | "gangnam"
  | "hongdae"
  | "myeongdong"
  | "incheon-guwol"
  | "suwon"
  | "nowon"
  | "ilsan"
  | "bundang";

export type MirrorSiteFamily = "ko" | "intl";

export type MirrorSiteId =
  | "gn-ko"
  | "hd-ko"
  | "md-ko"
  | "ic-ko"
  | "sw-ko"
  | "nw-ko"
  | "is-ko"
  | "bd-ko"
  | "gn-en"
  | "gn-jp"
  | "gn-cn"
  | "hd-en"
  | "hd-jp"
  | "hd-cn"
  | "md-en"
  | "md-jp"
  | "md-cn";

export type AuthModalMode = "login" | "join" | null;

export type AuthModalState = {
  mode: AuthModalMode;
  returnTo: string | null;
  routePath: string | null;
  reasonMessage: string | null;
  pendingHash: string | null;
  pendingContentId: string | null;
};

export type CartItem = {
  id: string;
  href: string;
  title: string;
  priceLabel?: string;
  imageSrc?: string;
  quantity: number;
  localeAddedFrom: MirrorLocale;
  siteId: string;
};

export type CartStore = {
  items: CartItem[];
  itemCount: number;
};

export type CartDialogState = {
  isOpen: boolean;
};

export type ReverseSessionUser = {
  id: string;
  loginId: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

export type ReverseSessionState = {
  status: "loading" | "authenticated" | "anonymous";
  user: ReverseSessionUser | null;
};

export type ReverseAuthResult = {
  ok: boolean;
  error?: string;
  user?: ReverseSessionUser;
};

export type MirrorRouteKind =
  | "home"
  | "best"
  | "event"
  | "price"
  | "talk"
  | "reservation"
  | "cart"
  | "generic";

export type MirrorRouteMap = {
  slug: string;
  title: string;
  sourceHref: string;
  kind: "category" | "detail" | "special" | "document";
  description?: string;
  imageSrc?: string;
  parentSlug?: string;
  relatedSlugs?: string[];
};

export type MirrorPageKind =
  | "detail"
  | "category"
  | "board"
  | "talk"
  | "member"
  | "document"
  | "special";

export type MirrorPageFormKind = "consult" | "reservation" | "feedback";

export type MirrorPageForm = {
  id: string;
  kind: MirrorPageFormKind;
};

export type MirrorPageRuntimeScript = {
  type: "external" | "inline";
  value: string;
};

export type MirrorPageEventGallery = {
  viewContainerId: string;
  initialDetailId: string | null;
  detailHtmlById: Record<string, string>;
};

export type MirrorPageIntegrityProfile =
  | "default"
  | "event"
  | "talk"
  | "community"
  | "location";

export type MirrorPageFallbackSource = "local" | "remote-source";

export type MirrorPageModel = {
  siteId: string;
  slug: string;
  title: string;
  sourceHref: string;
  kind: MirrorPageKind;
  imageSrc?: string;
  stylesheets: string[];
  inlineStyles: string[];
  runtimeScripts: MirrorPageRuntimeScript[];
  topBannerHtml: string | null;
  contentHtml: string;
  forms: MirrorPageForm[];
  eventGallery: MirrorPageEventGallery | null;
  fallbackSource: MirrorPageFallbackSource;
  integrityProfile: MirrorPageIntegrityProfile;
  missingSignals: string[];
};

export type CommunityBoardType = "reviews" | "before-after" | "media-in" | "notice";

export type BeforeAfterImageAsset = {
  src: string;
  alt: string;
  caption?: string;
};

export type CommunityContentBlock =
  | {
      id: string;
      type: "text";
      heading?: string;
      body: string;
    }
  | {
      id: string;
      type: "image";
      heading?: string;
      image: BeforeAfterImageAsset;
      body?: string;
    }
  | {
      id: string;
      type: "gallery";
      heading?: string;
      images: BeforeAfterImageAsset[];
      body?: string;
    };

export type CommunityItem = {
  id: string;
  boardType: CommunityBoardType;
  title: string;
  summary: string;
  author: string;
  publishedAt: string;
  tags: string[];
  isPinned: boolean;
  displayNumber: number | null;
  viewCount: number;
  category: string | null;
  requiresLogin: boolean;
  coverImage: BeforeAfterImageAsset | null;
  blocks: CommunityContentBlock[];
};

export type PopupBanner = {
  id: string;
  title: string;
  alt: string;
  href: string;
  imageSrc: string;
  mobileImageSrc: string | null;
  enabled: boolean;
  order: number;
};

export type AdminSessionUser = {
  id: string;
  loginId: string;
  name: string;
  role: "super_admin";
  createdAt: string;
};
