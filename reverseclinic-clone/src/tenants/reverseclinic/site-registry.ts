import type {
  MirrorBranch,
  MirrorLocale,
  MirrorSiteFamily,
  MirrorSiteId,
} from "@/lib/reverseclinic-types";

type ReverseClinicSiteDefinition = {
  siteId: MirrorSiteId;
  branch: MirrorBranch;
  locale: MirrorLocale;
  family: MirrorSiteFamily;
  host: string;
  origin: string;
  rootPath: string;
  manifestPath: string;
  pageRoot: string;
  homeTitle: string;
};

const KO_BRANCH_ROOT_SEGMENTS: Record<MirrorBranch, string> = {
  gangnam: "",
  hongdae: "network/hongdae",
  myeongdong: "network/myeongdong",
  "incheon-guwol": "network/incheon-guwol",
  suwon: "network/suwon",
  nowon: "network/nowon",
  ilsan: "network/ilsan",
  bundang: "network/bundang",
};

const INTL_BRANCH_ROOT_SEGMENTS: Record<Extract<MirrorBranch, "gangnam" | "hongdae" | "myeongdong">, Record<Exclude<MirrorLocale, "ko">, string>> =
  {
    gangnam: {
      en: "en",
      jp: "jp",
      cn: "cn",
    },
    hongdae: {
      en: "en/network/hongdae",
      jp: "jp/network/hongdae",
      cn: "cn/network/hongdae",
    },
    myeongdong: {
      en: "en/network/myeongdong",
      jp: "jp/network/myeongdong",
      cn: "cn/network/myeongdong",
    },
  };

const REVERSE_CLINIC_BRANCH_LABELS: Record<MirrorBranch, string> = {
  gangnam: "강남점",
  hongdae: "홍대점",
  myeongdong: "명동점",
  "incheon-guwol": "인천구월점",
  suwon: "수원점",
  nowon: "노원점",
  ilsan: "일산점",
  bundang: "분당점",
};

function buildSiteId(code: string, locale: MirrorLocale) {
  return `${code}-${locale}` as MirrorSiteId;
}

function buildManifestPath(siteId: MirrorSiteId) {
  return `src/generated/reverse-mirror-pages.${siteId}.json`;
}

function buildPageRoot(siteId: MirrorSiteId) {
  return `/reverseclinic-mirror/pages/${siteId}`;
}

function createSiteDefinition(
  siteId: MirrorSiteId,
  branch: MirrorBranch,
  locale: MirrorLocale,
  family: MirrorSiteFamily,
  host: string,
  rootPath: string,
  homeTitle: string,
): ReverseClinicSiteDefinition {
  return {
    siteId,
    branch,
    locale,
    family,
    host,
    origin: `https://${host}`,
    rootPath,
    manifestPath: buildManifestPath(siteId),
    pageRoot: buildPageRoot(siteId),
    homeTitle,
  };
}

const KO_SITES: ReverseClinicSiteDefinition[] = [
  createSiteDefinition(buildSiteId("gn", "ko"), "gangnam", "ko", "ko", "reverseclinic.com", "", "리버스클리닉 강남점"),
  createSiteDefinition(buildSiteId("hd", "ko"), "hongdae", "ko", "ko", "hd.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS.hongdae}`, "리버스클리닉 홍대점"),
  createSiteDefinition(buildSiteId("md", "ko"), "myeongdong", "ko", "ko", "md.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS.myeongdong}`, "리버스클리닉 명동점"),
  createSiteDefinition(buildSiteId("ic", "ko"), "incheon-guwol", "ko", "ko", "ic.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS["incheon-guwol"]}`, "리버스클리닉 인천구월점"),
  createSiteDefinition(buildSiteId("sw", "ko"), "suwon", "ko", "ko", "sw.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS.suwon}`, "리버스클리닉 수원점"),
  createSiteDefinition(buildSiteId("nw", "ko"), "nowon", "ko", "ko", "nw.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS.nowon}`, "리버스클리닉 노원점"),
  createSiteDefinition(buildSiteId("is", "ko"), "ilsan", "ko", "ko", "is.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS.ilsan}`, "리버스클리닉 일산점"),
  createSiteDefinition(buildSiteId("bd", "ko"), "bundang", "ko", "ko", "bd.reverseclinic.com", `/${KO_BRANCH_ROOT_SEGMENTS.bundang}`, "리버스클리닉 분당점"),
];

const INTL_SITES: ReverseClinicSiteDefinition[] = [
  createSiteDefinition(buildSiteId("gn", "en"), "gangnam", "en", "intl", "gn-en.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.gangnam.en}`, "REVERSE CLINIC GANGNAM ENG"),
  createSiteDefinition(buildSiteId("gn", "jp"), "gangnam", "jp", "intl", "gn-jp.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.gangnam.jp}`, "REVERSE CLINIC GANGNAM JPN"),
  createSiteDefinition(buildSiteId("gn", "cn"), "gangnam", "cn", "intl", "gn-cn.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.gangnam.cn}`, "REVERSE CLINIC GANGNAM CHN"),
  createSiteDefinition(buildSiteId("hd", "en"), "hongdae", "en", "intl", "hd-en.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.hongdae.en}`, "REVERSE CLINIC HONGDAE ENG"),
  createSiteDefinition(buildSiteId("hd", "jp"), "hongdae", "jp", "intl", "hd-jp.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.hongdae.jp}`, "REVERSE CLINIC HONGDAE JPN"),
  createSiteDefinition(buildSiteId("hd", "cn"), "hongdae", "cn", "intl", "hd-cn.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.hongdae.cn}`, "REVERSE CLINIC HONGDAE CHN"),
  createSiteDefinition(buildSiteId("md", "en"), "myeongdong", "en", "intl", "md-en.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.myeongdong.en}`, "REVERSE CLINIC MYEONGDONG ENG"),
  createSiteDefinition(buildSiteId("md", "jp"), "myeongdong", "jp", "intl", "md-jp.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.myeongdong.jp}`, "REVERSE CLINIC MYEONGDONG JPN"),
  createSiteDefinition(buildSiteId("md", "cn"), "myeongdong", "cn", "intl", "md-cn.reverseclinic.com", `/${INTL_BRANCH_ROOT_SEGMENTS.myeongdong.cn}`, "REVERSE CLINIC MYEONGDONG CHN"),
];

export const reverseClinicSites = [...KO_SITES, ...INTL_SITES] as const;

const reverseClinicSiteMap = Object.fromEntries(
  reverseClinicSites.map((site) => [site.siteId, site]),
) as Record<MirrorSiteId, ReverseClinicSiteDefinition>;

const reverseClinicHostMap = Object.fromEntries(
  reverseClinicSites.flatMap((site) => {
    const aliases = site.siteId === "gn-ko" ? ["www.reverseclinic.com"] : [];
    return [site.host, ...aliases].map((host) => [host, site.siteId] as const);
  }),
) as Record<string, MirrorSiteId>;

export function isKnownReverseClinicSiteHost(host: string) {
  return host in reverseClinicHostMap;
}

export function getReverseClinicSite(siteId: MirrorSiteId) {
  return reverseClinicSiteMap[siteId];
}

export function getReverseClinicSiteBranchLabel(siteId: MirrorSiteId) {
  return REVERSE_CLINIC_BRANCH_LABELS[getReverseClinicSite(siteId).branch];
}

export function getAllReverseClinicSites() {
  return reverseClinicSites;
}

export function getReverseClinicSiteIdFromHost(rawHost: string | null | undefined) {
  if (!rawHost) {
    return "gn-ko" as MirrorSiteId;
  }

  const normalizedHost = rawHost
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase()
    .replace(/^www\./, "");

  return reverseClinicHostMap[normalizedHost] ?? ("gn-ko" as MirrorSiteId);
}

export function getReverseClinicSiteId(locale: MirrorLocale, branch: MirrorBranch = "gangnam") {
  const code =
    branch === "gangnam"
      ? "gn"
      : branch === "hongdae"
        ? "hd"
        : branch === "myeongdong"
          ? "md"
          : branch === "incheon-guwol"
            ? "ic"
            : branch === "suwon"
              ? "sw"
              : branch === "nowon"
                ? "nw"
                : branch === "ilsan"
                  ? "is"
                  : "bd";

  return buildSiteId(code, locale);
}

export function getReverseClinicSiteRootPath(siteId: MirrorSiteId) {
  return getReverseClinicSite(siteId).rootPath || "/";
}

export function buildReverseClinicSitePath(siteId: MirrorSiteId, route = "") {
  const rootPath = getReverseClinicSite(siteId).rootPath;
  if (!route) {
    return rootPath || "/";
  }

  const normalizedRoute = route.replace(/^\/+/, "");
  if (!rootPath) {
    return `/${normalizedRoute}`;
  }

  return `${rootPath}/${normalizedRoute}`.replace(/\/{2,}/g, "/");
}

export function getReverseClinicSiteIdFromPath(
  locale: MirrorLocale,
  branch: MirrorBranch = "gangnam",
) {
  if (locale === "ko") {
    return getReverseClinicSiteId("ko", branch);
  }

  if (!["gangnam", "hongdae", "myeongdong"].includes(branch)) {
    return getReverseClinicSiteId(locale, "gangnam");
  }

  return getReverseClinicSiteId(locale, branch);
}

export function resolveReverseClinicSiteFromPathname(pathname: string) {
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const localeSegment = segments[0];
  const locale = localeSegment === "en" || localeSegment === "jp" || localeSegment === "cn"
    ? localeSegment
    : "ko";

  const branch =
    locale === "ko"
      ? segments[0] === "network"
        ? (segments[1] as MirrorBranch | undefined)
        : "gangnam"
      : segments[1] === "network"
        ? (segments[2] as MirrorBranch | undefined)
        : "gangnam";

  return getReverseClinicSiteIdFromPath(locale, branch ?? "gangnam");
}
