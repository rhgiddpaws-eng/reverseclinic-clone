import "server-only";

import path from "node:path";
import { readFile } from "node:fs/promises";
import { load } from "cheerio";
import {
  mirrorSlugToAppRoute,
  normalizeMirrorAppRoute,
  resolveMirrorSlugFromSegments,
} from "@/lib/reverse-mirror-routing";
import { buildReverseClinicAssetProxyHref } from "@/lib/reverse-asset-proxy";
import { getTenantConfig } from "@/lib/tenant-registry";
import { getMirrorRouteMap } from "@/lib/reverse-route-map";
import type { TenantId } from "@/lib/tenant-types";
import type {
  MirrorLocale,
  MirrorPageEventGallery,
  MirrorPageFallbackSource,
  MirrorPageForm,
  MirrorPageIntegrityProfile,
  MirrorPageKind,
  MirrorPageModel,
  MirrorPageRuntimeScript,
} from "@/lib/reverseclinic-types";
import {
  getReverseClinicSite,
  getReverseClinicSiteIdFromPath,
  getReverseClinicSiteRootPath,
} from "@/tenants/reverseclinic/site-registry";

type ManifestEntry = {
  sourceUrl: string;
  title: string;
  file: string;
};

type LoadedMirrorPageHtml = {
  html: string;
  source: MirrorPageFallbackSource;
};

type MirrorPageCandidate = {
  contentHtml: string;
  eventGallery: MirrorPageEventGallery | null;
  forms: MirrorPageForm[];
  inlineStyles: string[];
  integrityProfile: MirrorPageIntegrityProfile;
  missingSignals: string[];
  runtimeScripts: MirrorPageRuntimeScript[];
  source: MirrorPageFallbackSource;
  stylesheets: string[];
  topBannerHtml: string | null;
};

const manifestCache = new Map<string, Promise<Record<string, ManifestEntry>>>();
const remotePageHtmlCache = new Map<string, Promise<string | null>>();
const ASSET_PATH_PATTERN =
  /\.(?:css|js|png|jpe?g|gif|svg|webp|avif|mp4|webm|mov|pdf|woff2?|woff|ttf|otf|eot)(?:$|[?#])/i;
const ROUGHMAP_RUNTIME_SCRIPT_SOURCE_PATTERNS = [
  /\/dmaps\/map_js_init\/v3/i,
  /\/mapjsapi\/js\/main\//i,
  /roughmapLoader\.js/i,
  /roughmapLander\.js/i,
];
const ROUGHMAP_RUNTIME_INLINE_PATTERN = /daum\.roughmap\.Lander/i;
const MIRROR_FETCH_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const MIRROR_PAGE_FETCH_TIMEOUT_MS = 15_000;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getManifestEntries(tenantId: TenantId, siteId?: string) {
  const cacheKey = `${tenantId}:${siteId ?? "default"}`;
  const cached = manifestCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const manifestPath = path.join(
    process.cwd(),
    siteId && tenantId === "reverseclinic"
      ? getReverseClinicSite(siteId as never).manifestPath
      : getTenantConfig(tenantId).mirror.manifestPath,
  );
  const manifestPromise = readFile(manifestPath, "utf8")
    .then((raw) => JSON.parse(raw) as Record<string, ManifestEntry>)
    .catch(() => ({} as Record<string, ManifestEntry>));

  manifestCache.set(cacheKey, manifestPromise);
  return manifestPromise;
}

function getNodeErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return "";
  }

  return String((error as { code?: string }).code ?? "");
}

async function fetchRemoteMirrorPageHtml(sourceUrl: string) {
  if (!sourceUrl) {
    return null;
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "*/*",
        Referer: sourceUrl,
        "User-Agent": MIRROR_FETCH_USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(MIRROR_PAGE_FETCH_TIMEOUT_MS),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html")) {
      return null;
    }

    const pageHtml = await response.text();
    return pageHtml.trim() ? pageHtml : null;
  } catch {
    return null;
  }
}

async function getRemoteMirrorPageHtml(sourceUrl: string) {
  const cached = remotePageHtmlCache.get(sourceUrl);
  if (cached) {
    return cached;
  }

  const request = fetchRemoteMirrorPageHtml(sourceUrl).then((pageHtml) => {
    if (!pageHtml) {
      remotePageHtmlCache.delete(sourceUrl);
    }

    return pageHtml;
  });

  remotePageHtmlCache.set(sourceUrl, request);
  return request;
}

async function loadMirrorPageHtml(absoluteFilePath: string, sourceUrl: string) {
  try {
    return {
      html: await readFile(absoluteFilePath, "utf8"),
      source: "local" as const,
    };
  } catch (error) {
    if (getNodeErrorCode(error) !== "ENOENT") {
      throw error;
    }
  }

  const remoteHtml = await getRemoteMirrorPageHtml(sourceUrl);
  if (!remoteHtml) {
    return null;
  }

  return {
    html: remoteHtml,
    source: "remote-source" as const,
  };
}

function normalizeTitle(rawTitle: string, fallbackTitle: string) {
  return rawTitle.replace(/\s+\|.+$/, "").replace(/^\/\//, "").trim() || fallbackTitle;
}

function resolvePageKind(slug: string, routeKind?: string): MirrorPageKind {
  if (slug === "_devnull_--c5db932a7bb84e") {
    return "talk";
  }

  if (slug.startsWith("_simpleApps=member--")) {
    return slug.endsWith("--login") || slug.endsWith("--join") ? "member" : "document";
  }

  if (slug.startsWith("_devnull_--")) {
    return "special";
  }

  if (routeKind === "category") {
    return "category";
  }

  if (slug.startsWith("c5db92f82f4b2e")) {
    return "board";
  }

  return "detail";
}

function safeUrl(rawValue: string, tenantId: TenantId, siteId?: string) {
  if (!rawValue || rawValue.startsWith("data:") || rawValue.startsWith("blob:")) {
    return null;
  }

  try {
    return new URL(
      rawValue,
      siteId && tenantId === "reverseclinic"
        ? getReverseClinicSite(siteId as never).origin
        : getTenantConfig(tenantId).mirror.origin,
    );
  } catch {
    return null;
  }
}

function isBrokenAssetPlaceholder(rawValue: string, tenantId: TenantId, siteId?: string) {
  const url = safeUrl(rawValue, tenantId, siteId);
  if (!url) {
    return false;
  }

  return /\/_files\/\.(?:png|jpe?g|gif|svg|webp|avif)$/i.test(url.pathname);
}

function resolveMirrorOrigin(tenantId: TenantId, siteId?: string) {
  if (siteId && tenantId === "reverseclinic") {
    return getReverseClinicSite(siteId as never).origin;
  }

  return getTenantConfig(tenantId).mirror.origin;
}

function extractEventDetailIdFromOnclick(onclickCode: string) {
  return (
    onclickCode.match(/idx=view(?:&amp;|&).*?_id=([^'"&;\s]+)/i)?.[1]?.trim() ??
    onclickCode.match(/#view=([^'"&;\s]+)/i)?.[1]?.trim() ??
    null
  );
}

function extractEventJframeSourceHref(onclickCode: string, tenantId: TenantId, siteId?: string) {
  const jframeMatch = onclickCode.match(/jframe\((['"])(.*?)\1/i);
  if (!jframeMatch) {
    return null;
  }

  return safeUrl(jframeMatch[2], tenantId, siteId)?.toString() ?? null;
}

function extractEventRouteHref(
  onclickCode: string,
  locale: MirrorLocale,
  tenantId: TenantId,
  siteId?: string,
) {
  const windowMatch = onclickCode.match(/window\.open\((['"])(.*?)\1/i);
  if (windowMatch) {
    const rewrittenHref = rewriteHref(windowMatch[2], locale, tenantId, siteId);
    return rewrittenHref.startsWith("/") ? rewrittenHref : null;
  }

  const locationMatch = onclickCode.match(
    /(?:window\.|document\.|top\.)?location(?:\.href)?\s*=\s*(['"])(.*?)\1/i,
  );
  if (!locationMatch) {
    return null;
  }

  const rewrittenHref = rewriteHref(locationMatch[2], locale, tenantId, siteId);
  return rewrittenHref.startsWith("/") ? rewrittenHref : null;
}

function popupHrefFromOnclick(onclickCode: string, tenantId: TenantId, siteId?: string) {
  const origin = resolveMirrorOrigin(tenantId, siteId);

  if (/termsofuse\s*\(/i.test(onclickCode)) {
    return `${origin}/?_simpleApps=member/terms-of-use`;
  }

  if (/privacypolicy\s*\(/i.test(onclickCode)) {
    return `${origin}/?_simpleApps=member/privacy-policy`;
  }

  if (/patientsrights\s*\(/i.test(onclickCode)) {
    return `${origin}/?_simpleApps=member/patients-rights`;
  }

  if (/login_open\s*\(/i.test(onclickCode)) {
    return `${origin}/?_simpleApps=member/login`;
  }

  if (/join_open\s*\(/i.test(onclickCode)) {
    return `${origin}/?_simpleApps=member/join`;
  }

  const windowMatch = onclickCode.match(/window_open\((['"])(.*?)\1/i);
  if (windowMatch) {
    return windowMatch[2];
  }

  return null;
}

function normalizeAnchorLabel(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function localeFromAnchorLabel(text: string, title: string) {
  const label = `${normalizeAnchorLabel(text)} ${normalizeAnchorLabel(title)}`.trim();
  if (!label) {
    return null;
  }

  if (["kor", "kr", "korean", "한국어", "ko"].some((token) => label.includes(token))) {
    return "ko" as const;
  }

  if (["eng", "en", "english"].some((token) => label.includes(token))) {
    return "en" as const;
  }

  if (["jpn", "jp", "japanese", "日本語"].some((token) => label.includes(token))) {
    return "jp" as const;
  }

  if (["chn", "cn", "chinese", "中文"].some((token) => label.includes(token))) {
    return "cn" as const;
  }

  return null;
}

function authModeFromAnchorLabel(text: string, title: string) {
  const label = `${normalizeAnchorLabel(text)} ${normalizeAnchorLabel(title)}`.trim();
  if (!label) {
    return null;
  }

  if (
    ["login", "signin", "log-in", "로그인", "ログイン", "会员登录", "會員登入", "登录"].some((token) =>
      label.includes(token),
    )
  ) {
    return "login" as const;
  }

  if (
    [
      "join",
      "signup",
      "signupnow",
      "sign-up",
      "회원가입",
      "joinus",
      "新規登録",
      "会員登録",
      "注册",
      "會員註冊",
    ].some((token) => label.includes(token))
  ) {
    return "join" as const;
  }

  return null;
}

function canonicalAuthHref(mode: "login" | "join", tenantId: TenantId, siteId?: string) {
  return `${resolveMirrorOrigin(tenantId, siteId)}/?_simpleApps=member/${mode}`;
}

function authHrefFromHref(rawValue: string, tenantId: TenantId, siteId?: string) {
  const url = safeUrl(rawValue, tenantId, siteId);
  if (!url) {
    return null;
  }

  const simpleApps = url.searchParams.get("_simpleApps");
  if (simpleApps === "member/login") {
    return canonicalAuthHref("login", tenantId, siteId);
  }

  if (simpleApps === "member/join") {
    return canonicalAuthHref("join", tenantId, siteId);
  }

  if (url.searchParams.has("__login__") || url.searchParams.get("idx") === "login") {
    return canonicalAuthHref("login", tenantId, siteId);
  }

  if (url.searchParams.get("idx") === "join") {
    return canonicalAuthHref("join", tenantId, siteId);
  }

  return null;
}

function resolveAnchorMemberHref(
  href: string,
  onclickCode: string,
  text: string,
  title: string,
  tenantId: TenantId,
  siteId?: string,
) {
  const onclickHref = popupHrefFromOnclick(onclickCode, tenantId, siteId);
  if (onclickHref?.includes("/?_simpleApps=member/")) {
    return onclickHref;
  }

  const canonicalHref = authHrefFromHref(href, tenantId, siteId);
  if (canonicalHref) {
    return canonicalHref;
  }

  const authMode = authModeFromAnchorLabel(text, title);
  if (authMode) {
    return canonicalAuthHref(authMode, tenantId, siteId);
  }

  return onclickHref;
}

function toLocalMirrorAssetHref(rawValue: string, tenantId: TenantId, siteId?: string) {
  const tenantConfig = getTenantConfig(tenantId);
  const mirrorRootPrefix =
    siteId && tenantId === "reverseclinic"
      ? "/reverseclinic-mirror"
      : tenantConfig.mirror.pageRoot.replace(/\/pages$/, "");

  if (!rawValue || rawValue.startsWith(`${mirrorRootPrefix}/`)) {
    return rawValue;
  }

  const url = safeUrl(rawValue, tenantId, siteId);
  if (!url) {
    return rawValue;
  }

  const normalizedHost = url.hostname.replace(/^www\./, "");
  if (!tenantConfig.mirror.localAssetHosts.includes(normalizedHost) || !ASSET_PATH_PATTERN.test(url.pathname)) {
    return rawValue;
  }

  const localHref = `${tenantConfig.mirror.siteAssetRoot}/${normalizedHost}${url.pathname}${url.search}`;

  // Vercel 환경에서는 public/ 파일을 런타임에 existsSync로 확인할 수 없으므로
  // reverseclinic 테넌트는 항상 프록시 경로를 사용하고, 나머지는 localHref를 반환한다.
  if (tenantId === "reverseclinic") {
    return buildReverseClinicAssetProxyHref(normalizedHost, url.pathname, url.search);
  }

  return localHref;
}

function rewriteHref(
  rawValue: string,
  locale: MirrorLocale,
  tenantId: TenantId,
  siteId?: string,
) {
  const tenantConfig = getTenantConfig(tenantId);
  const normalizedRawValue = rawValue.trim().toLowerCase();
  const mirrorPagePattern = new RegExp(
    siteId && tenantId === "reverseclinic"
      ? `${escapeRegExp(`/reverseclinic-mirror/pages/${siteId}`)}/(.+)\\.html(?:[?#].*)?$`
      : `${escapeRegExp(tenantConfig.mirror.pageRoot)}/(.+)\\.html(?:[?#].*)?$`,
  );

  if (!rawValue || rawValue === "#") {
    return rawValue;
  }

  if (
    normalizedRawValue.startsWith("javascript:") ||
    normalizedRawValue.startsWith("javascrip:")
  ) {
    return "#";
  }

  if (rawValue === ";") {
    return "#";
  }

  const url = safeUrl(rawValue, tenantId, siteId);
  const staticPageMatch = rawValue.match(mirrorPagePattern) ?? url?.pathname.match(mirrorPagePattern);
  if (staticPageMatch) {
    const rewritten = mirrorSlugToAppRoute(staticPageMatch[1], locale, tenantId, siteId);
    return url?.hash ? `${rewritten}${url.hash}` : rewritten;
  }

  if (url && ASSET_PATH_PATTERN.test(url.pathname)) {
    return toLocalMirrorAssetHref(rawValue, tenantId, siteId);
  }

  return normalizeMirrorAppRoute(rawValue, locale, tenantId, siteId);
}

function hasRoughmapRuntime(pageHtml: string) {
  return pageHtml.includes("daumRoughmapContainer") || ROUGHMAP_RUNTIME_INLINE_PATTERN.test(pageHtml);
}

function extractRuntimeScripts(
  pageHtml: string,
  tenantId: TenantId,
  siteId?: string,
): MirrorPageRuntimeScript[] {
  if (!hasRoughmapRuntime(pageHtml)) {
    return [];
  }

  const $ = load(pageHtml, null, false);
  const seenScripts = new Set<string>();
  const runtimeScripts: MirrorPageRuntimeScript[] = [];

  $("script").each((_, element) => {
    const script = $(element);
    const source = (script.attr("src") ?? "").trim();

    if (source && ROUGHMAP_RUNTIME_SCRIPT_SOURCE_PATTERNS.some((pattern) => pattern.test(source))) {
      const localSource = toLocalMirrorAssetHref(source, tenantId, siteId);
      const dedupeKey = `external:${localSource}`;
      if (!seenScripts.has(dedupeKey)) {
        seenScripts.add(dedupeKey);
        runtimeScripts.push({
          type: "external",
          value: localSource,
        });
      }
      return;
    }

    const inlineScript = (script.html() ?? "").trim();
    if (!inlineScript || !ROUGHMAP_RUNTIME_INLINE_PATTERN.test(inlineScript)) {
      return;
    }

    const dedupeKey = `inline:${inlineScript}`;
    if (seenScripts.has(dedupeKey)) {
      return;
    }

    seenScripts.add(dedupeKey);
    runtimeScripts.push({
      type: "inline",
      value: inlineScript,
    });
  });

  return runtimeScripts;
}

function extractDocumentStyles(pageHtml: string, tenantId: TenantId, siteId?: string) {
  const $ = load(pageHtml, null, false);
  const seenHref = new Set<string>();
  const seenStyle = new Set<string>();
  const stylesheets: string[] = [];
  const inlineStyles: string[] = [];

  $("link[rel='stylesheet'][href]").each((_, element) => {
    const href = ($(element).attr("href") ?? "").trim();
    if (!href) {
      return;
    }

    const rewrittenHref = toLocalMirrorAssetHref(href, tenantId, siteId);
    if (!seenHref.has(rewrittenHref)) {
      seenHref.add(rewrittenHref);
      stylesheets.push(rewrittenHref);
    }
  });

  $("style").each((_, element) => {
    const styleText = ($(element).html() ?? "").trim();
    if (!styleText || seenStyle.has(styleText)) {
      return;
    }

    seenStyle.add(styleText);
    inlineStyles.push(styleText);
  });

  return {
    stylesheets,
    inlineStyles,
  };
}

function rewriteMirrorDom(
  rootHtml: string,
  locale: MirrorLocale,
  slug: string,
  tenantId: TenantId,
  siteId?: string,
  options?: {
    keepEmbeddedConsultBox?: boolean;
  },
) {
  const $ = load(rootHtml, null, false);
  const forms: MirrorPageForm[] = [];
  const keepEmbeddedConsultBox = options?.keepEmbeddedConsultBox ?? false;

  const isInteractiveMirrorForm = (element: Parameters<typeof $>[0]) => {
    const form = $(element);
    const styleText = (form.attr("style") ?? "").replaceAll(/\s+/g, "").toLowerCase();
    const formId = (form.attr("id") ?? "").toLowerCase();
    const hasMeaningfulField = form
      .find("input[name], select[name], textarea[name]")
      .toArray()
      .some((fieldElement) => {
        const field = $(fieldElement);
        const fieldName = (field.attr("name") ?? "").trim();
        const fieldType = (field.attr("type") ?? "").trim().toLowerCase();
        return Boolean(fieldName) && !["hidden", "file"].includes(fieldType);
      });

    if (!hasMeaningfulField) {
      return false;
    }

    return !styleText.includes("display:none") && !formId.startsWith("mvwizeditor_uploadform");
  };

  const resolveFormKind = (element: Parameters<typeof $>[0]) => {
    const form = $(element);
    const fieldNames = new Set(
      form
        .find("[name]")
        .map((_, fieldElement) => $(fieldElement).attr("name")?.trim() ?? "")
        .get()
        .filter(Boolean),
    );
    const target = (form.attr("target") ?? "").toLowerCase();
    const hiddenType = form.find("input[name='type']").attr("value")?.trim() ?? "";

    if (fieldNames.has("agree")) {
      return "feedback" as const;
    }

    if (
      fieldNames.has("date") ||
      fieldNames.has("rtime") ||
      target.includes("resv") ||
      hiddenType.includes("예약")
    ) {
      return "reservation" as const;
    }

    return "consult" as const;
  };

  const resolveLocaleSwitchHref = (element: Parameters<typeof $>[0]) => {
    if (tenantId !== "reverseclinic" || !siteId) {
      return null;
    }

    const targetLocale = localeFromAnchorLabel(
      $(element).text(),
      $(element).attr("title") ?? "",
    );
    if (!targetLocale) {
      return null;
    }

    const localeMenu = $(element).closest(".lang");
    if (localeMenu.length === 0 || localeMenu.hasClass("network")) {
      return null;
    }

    const currentSite = getReverseClinicSite(siteId as never);
    const targetSiteId = getReverseClinicSiteIdFromPath(targetLocale, currentSite.branch);
    return getReverseClinicSiteRootPath(targetSiteId);
  };

  $("script, style, meta, noscript, link[rel='stylesheet'], link[rel='preload']").remove();
  $("#wp_tg_cts, .event_top").remove();
  $(".header, #rnb, .footer_02, .main_wrap_pop_up, #swiper_popup, #dimm_roll_popup").remove();
  $("#lightboxOverlay, #lightbox, #mvwizajaxloadingstatus").remove();
  if (!keepEmbeddedConsultBox) {
    $(".counselbox").remove();
  }

  // 개인정보 링크는 원본 onclick을 제거하기 전에 별도 트리거로 보존한다.
  $("[onclick*='privacypolicy']").attr("data-reverse-open-privacy", "true");

  // /event 원본은 li onclick + jframe 조합이라 onclick을 지우기 전에 안전한 데이터 속성으로 치환한다.
  $("div[id^='bbs_column_'] li[onclick]").each((_, element) => {
    const item = $(element);
    const onclickCode = (item.attr("onclick") ?? "").trim();
    const detailId = extractEventDetailIdFromOnclick(onclickCode);
    const routeHref = extractEventRouteHref(onclickCode, locale, tenantId, siteId);

    if (detailId) {
      item.attr("data-reverse-event-detail-id", detailId);
      item.attr("role", "button");
      item.attr("tabindex", "0");
    } else if (routeHref) {
      item.attr("data-reverse-event-route", routeHref);
      item.attr("role", "link");
      item.attr("tabindex", "0");
    }
  });

  $("area[onclick]").each((_, element) => {
    const area = $(element);
    const onclickCode = (area.attr("onclick") ?? "").trim();
    const routeHref = extractEventRouteHref(onclickCode, locale, tenantId, siteId);

    if (onclickCode.includes("bbs_view_") && onclickCode.includes("innerHTML")) {
      area.attr("data-reverse-event-close", "true");
      area.attr("href", "#");
      return;
    }

    if (routeHref) {
      area.attr("data-reverse-event-route", routeHref);
      area.attr("href", routeHref);
    }
  });

  $("[onclick]").each((_, element) => {
    const item = $(element);
    if (item.is("a, area, li")) {
      return;
    }

    const routeHref = extractEventRouteHref(item.attr("onclick") ?? "", locale, tenantId, siteId);
    if (!routeHref) {
      return;
    }

    item.attr("data-reverse-route", routeHref);
    if (!item.attr("role")) {
      item.attr("role", "link");
    }
    if (!item.attr("tabindex")) {
      item.attr("tabindex", "0");
    }
  });

  $("a").each((_, element) => {
    const href = ($(element).attr("href") ?? "").trim();
    const onclickCode = ($(element).attr("onclick") ?? "").trim();
    const localeSwitchHref = resolveLocaleSwitchHref(element);

    if (localeSwitchHref) {
      $(element).attr("href", localeSwitchHref);
      $(element).removeAttr("target").removeAttr("rel");
    } else {
    const rewrittenSourceHref = resolveAnchorMemberHref(
      href,
      onclickCode,
      $(element).text(),
      $(element).attr("title") ?? "",
      tenantId,
      siteId,
    );

      if (!rewrittenSourceHref && !href) {
        return;
      }

      $(element).attr(
        "href",
        rewriteHref(rewrittenSourceHref ?? href, locale, tenantId, siteId),
      );

      const rewrittenHref = $(element).attr("href");
      if (!rewrittenHref?.startsWith("http")) {
        $(element).removeAttr("target").removeAttr("rel");
      }
    }

    const anchorText = $(element).text().trim();
    const anchorTitle = ($(element).attr("title") ?? "").trim();
    if (
      $(element).is("#log_cart, .btn_cart") ||
      anchorText.includes("?λ컮援щ땲 ?닿린") ||
      anchorText.includes("移댄듃???닿린") ||
      anchorTitle.includes("移댄듃???닿린")
    ) {
      $(element).attr("data-reverse-cart", "true");
      $(element).attr("href", "#");
    }

    if ($(element).is("#log_counsel") || anchorText.includes("?곷떞?붿껌?섍린")) {
      $(element).attr("data-reverse-scroll-consult", "true");
      $(element).attr("href", "#");
    }

    if ($(element).is(".close_top")) {
      $(element).remove();
    }
  });

  $("*").removeAttr("onclick").removeAttr("onchange").removeAttr("onsubmit");

  $("[src]").each((_, element) => {
    const source = $(element).attr("src");
    if (!source) {
      return;
    }

    if (isBrokenAssetPlaceholder(source, tenantId, siteId)) {
      $(element).remove();
      return;
    }

    $(element).attr("src", toLocalMirrorAssetHref(source, tenantId, siteId));
  });

  $("img").each((_, element) => {
    const image = $(element);
    if (image.attr("src")) {
      return;
    }

    const imageId = image.attr("id") ?? "";
    const imageAlt = image.attr("alt") ?? "";
    const imageSuffix = imageId.startsWith("img_load") ? imageId.replace(/^img_load/, "") : "";
    const sizeCandidates = ["1200", "1080", "900", "830", "800", "1400", "1500", "1600"];
    const hiddenCandidate = imageSuffix
      ? sizeCandidates
          .map((size) => $(`input#wt_${size}${imageSuffix}`).attr("value") ?? "")
          .find(Boolean)
      : "";
    const resolvedSource = hiddenCandidate || imageAlt;

    if (resolvedSource && ASSET_PATH_PATTERN.test(resolvedSource)) {
      image.attr("src", toLocalMirrorAssetHref(resolvedSource, tenantId, siteId));
    }
  });

  $("[poster]").each((_, element) => {
    const poster = $(element).attr("poster");
    if (!poster) {
      return;
    }

    $(element).attr("poster", toLocalMirrorAssetHref(poster, tenantId, siteId));
  });

  $("input[type='button']").each((_, element) => {
    const value = ($(element).attr("value") ?? "").trim();
    if (value === "?먯꽭??蹂닿린") {
      $(element).attr("data-reverse-open-privacy", "true");
    }
  });

  $("form").each((index, element) => {
    const form = $(element);
    if (!isInteractiveMirrorForm(element)) {
      form.remove();
      return;
    }

    const kind = resolveFormKind(element);
    const formId = `${slug}-form-${index + 1}`;

    form.attr("data-reverse-form-kind", kind);
    form.attr("data-reverse-form-id", formId);
    form.removeAttr("action");
    form.removeAttr("target");
    form.removeAttr("onsubmit");
    form.attr("method", "post");

    forms.push({ id: formId, kind });
  });

  return {
    html: $.root().html() ?? "",
    forms,
  };
}

async function buildEventGallery(
  pageHtml: string,
  locale: MirrorLocale,
  slug: string,
  tenantId: TenantId,
  siteId?: string,
): Promise<MirrorPageEventGallery | null> {
  if (!pageHtml.includes("mvwizBoard/gallery2/main")) {
    return null;
  }

  const $ = load(pageHtml, null, false);
  const viewContainerId = $("div[id^='bbs_view_column_']").first().attr("id")?.trim() ?? "";
  if (!viewContainerId) {
    return null;
  }

  const detailHtmlById = new Map<string, string>();
  const detailRequests = $("div[id^='bbs_column_'] li[onclick]")
    .toArray()
    .map(async (element) => {
      const onclickCode = ($(element).attr("onclick") ?? "").trim();
      const detailId = extractEventDetailIdFromOnclick(onclickCode);
      const detailSourceHref = extractEventJframeSourceHref(onclickCode, tenantId, siteId);

      if (!detailId || !detailSourceHref || detailHtmlById.has(detailId)) {
        return;
      }

      const detailHtml = await getRemoteMirrorPageHtml(detailSourceHref);
      if (!detailHtml) {
        return;
      }

      const rewrittenDetail = rewriteMirrorDom(
        detailHtml,
        locale,
        `${slug}--event-detail-${detailId}`,
        tenantId,
        siteId,
      );
      const trimmedDetail = rewrittenDetail.html.trim();
      if (!trimmedDetail) {
        return;
      }

      detailHtmlById.set(
        detailId,
        `${trimmedDetail}<div style="padding:16px 0 0;text-align:right;"><button type="button" data-reverse-event-close="true">목록보기</button></div>`,
      );
    });

  await Promise.all(detailRequests);

  if (detailHtmlById.size === 0) {
    return null;
  }

  return {
    viewContainerId,
    initialDetailId: null,
    detailHtmlById: Object.fromEntries(detailHtmlById),
  };
}

function selectMeaningfulEventTop(
  pageHtml: string,
  locale: MirrorLocale,
  tenantId: TenantId,
  siteId?: string,
) {
  const $ = load(pageHtml);
  const eventTop = $(".event_top").first().clone();
  const image = eventTop.find(".event_img img").attr("src")?.trim();

  if (!image) {
    return null;
  }

  const sanitized = rewriteMirrorDom($.html(eventTop), locale, "event-top", tenantId, siteId);
  return sanitized.html.trim() || null;
}

function selectContentRoot(pageHtml: string, slug: string) {
  const $ = load(pageHtml, null, false);

  if (slug.startsWith("_simpleApps=member--")) {
    const memberRoot = $("#mvwizBlacksheep_dsp").first().clone();
    if (memberRoot.length > 0) {
      return $.html(memberRoot);
    }
  }

  // 기존 첫 블록만 자르던 방식 때문에 긴 랜딩과 하단 CTA, 지도 iframe이 잘렸다.
  const bodyRoot = $("body").first().clone();
  if (bodyRoot.length > 0) {
    bodyRoot.find("#wp_tg_cts, .event_top").remove();
    bodyRoot.children(".header, #rnb, .footer_02, .main_wrap_pop_up, #swiper_popup, #dimm_roll_popup").remove();
    bodyRoot.find("#lightboxOverlay, #lightbox, #mvwizajaxloadingstatus").remove();
    return bodyRoot.html() ?? "";
  }

  // Some intl mirrors omit <body> and place the visible shell directly at the document root.
  const rootHtml = $.root().html() ?? "";
  if (rootHtml.trim()) {
    const rootClone = load(rootHtml, null, false);
    rootClone("#wp_tg_cts, .event_top").remove();
    rootClone(".header, #rnb, .footer_02, .main_wrap_pop_up, #swiper_popup, #dimm_roll_popup").remove();
    rootClone("#lightboxOverlay, #lightbox, #mvwizajaxloadingstatus").remove();
    return rootClone.root().html() ?? "";
  }

  const contentRoot = $(".contents").first().clone();
  contentRoot.find("#wp_tg_cts, .event_top").remove();
  contentRoot.find(".header, #rnb, .footer_02, .main_wrap_pop_up, #swiper_popup, #dimm_roll_popup").remove();
  contentRoot.find("#lightboxOverlay, #lightbox, #mvwizajaxloadingstatus").remove();
  return $.html(contentRoot) ?? "";
}

function countSelectorMatches(pageHtml: string, selectors: string[]) {
  const $ = load(pageHtml, null, false);
  return selectors.reduce((count, selector) => count + $(selector).length, 0);
}

function resolveIntegrityProfile(
  slug: string,
  sourceUrl: string,
  title: string,
  pageHtml: string,
  pageKind: MirrorPageKind,
): MirrorPageIntegrityProfile {
  const loweredMeta = `${slug} ${sourceUrl} ${title}`.toLowerCase();

  if (
    /new\/eventpage|event2026|\bevent\b/.test(loweredMeta) ||
    pageHtml.includes("bbs_view_column_") ||
    pageHtml.includes("myGallery_bbsgz2")
  ) {
    return "event";
  }

  if (pageKind === "talk" || /\btalk\b|reservation/.test(loweredMeta)) {
    return "talk";
  }

  if (
    /feedback|complain/.test(loweredMeta) ||
    title.includes("칭찬") ||
    title.includes("불만") ||
    pageHtml.includes("의견 접수하기")
  ) {
    return "community";
  }

  if (
    /location/.test(loweredMeta) ||
    title.includes("지점소개") ||
    pageHtml.includes("daumRoughmapContainer")
  ) {
    return "location";
  }

  return "default";
}

function evaluateCandidateIntegrity(
  pageHtml: string,
  contentHtml: string,
  forms: MirrorPageForm[],
  eventGallery: MirrorPageEventGallery | null,
  profile: MirrorPageIntegrityProfile,
) {
  if (profile === "default") {
    return [];
  }

  const missingSignals: string[] = [];
  const loweredContent = contentHtml.toLowerCase();
  const eventSignals = [
    {
      label: "event-gallery",
      ok:
        Boolean(eventGallery) ||
        countSelectorMatches(pageHtml, ["div[id^='bbs_view_column_']", "div[id^='bbs_column_'] li"]) > 0,
    },
    {
      label: "event-top-banner",
      ok: countSelectorMatches(pageHtml, [".event_top .event_img img[src]", ".event_img img[src]"]) > 0,
    },
    {
      label: "event-tail-block",
      ok: loweredContent.includes("counselbox") || forms.length > 0,
    },
  ];
  const talkSignals = [
    {
      label: "talk-forms",
      ok: forms.length >= 2,
    },
    {
      label: "talk-iframe",
      ok: countSelectorMatches(pageHtml, ["iframe"]) >= 1,
    },
    {
      label: "talk-privacy",
      ok:
        pageHtml.includes("개인정보 취급") ||
        pageHtml.includes("개인정보취급") ||
        pageHtml.includes("agreement_"),
    },
  ];
  const communitySignals = [
    {
      label: "community-feedback-form",
      ok:
        forms.some((form) => form.kind === "feedback") ||
        pageHtml.includes('name="ct"') ||
        pageHtml.includes("의견 접수하기"),
    },
    {
      label: "community-submit-cta",
      ok: pageHtml.includes("의견 접수하기") || pageHtml.includes("칭찬/불만접수"),
    },
    {
      label: "community-privacy",
      ok:
        pageHtml.includes("개인정보 취급") ||
        pageHtml.includes("개인정보취급") ||
        pageHtml.includes("privacypolicy"),
    },
  ];
  const locationSignals = [
    {
      label: "location-roughmap",
      ok:
        pageHtml.includes("daumRoughmapContainer") ||
        countSelectorMatches(pageHtml, [".wrap_map", ".roughmap_maker_label"]) > 0,
    },
    {
      label: "location-runtime-script",
      ok:
        pageHtml.includes("roughmapLoader.js") ||
        pageHtml.includes("roughmapLander.js") ||
        pageHtml.includes("daum.roughmap.Lander"),
    },
  ];

  // 특수 페이지는 모든 selector를 하드코딩하지 않고, 블록군별 신호가 일정 개수 이상 살아있는지만 본다.
  const integrityMatrix = {
    event: {
      required: 2,
      signals: eventSignals,
    },
    talk: {
      required: 2,
      signals: talkSignals,
    },
    community: {
      required: 2,
      signals: communitySignals,
    },
    location: {
      required: 2,
      signals: locationSignals,
    },
  } satisfies Record<
    Exclude<MirrorPageIntegrityProfile, "default">,
    { required: number; signals: Array<{ label: string; ok: boolean }> }
  >;

  const profileConfig = integrityMatrix[profile];
  const passedCount = profileConfig.signals.filter((signal) => signal.ok).length;
  if (passedCount >= profileConfig.required) {
    return [];
  }

  profileConfig.signals.forEach((signal) => {
    if (!signal.ok) {
      missingSignals.push(signal.label);
    }
  });

  return missingSignals;
}

async function buildMirrorPageCandidate({
  loadedPage,
  locale,
  pageKind,
  siteId,
  slug,
  sourceUrl,
  tenantId,
  title,
}: {
  loadedPage: LoadedMirrorPageHtml;
  locale: MirrorLocale;
  pageKind: MirrorPageKind;
  siteId?: string;
  slug: string;
  sourceUrl: string;
  tenantId: TenantId;
  title: string;
}) {
  const documentStyles = extractDocumentStyles(loadedPage.html, tenantId, siteId);
  const contentRoot = selectContentRoot(loadedPage.html, slug);
  const rewritten = rewriteMirrorDom(contentRoot, locale, slug, tenantId, siteId, {
    keepEmbeddedConsultBox: pageKind === "talk",
  });
  const runtimeScripts = extractRuntimeScripts(loadedPage.html, tenantId, siteId);
  const eventGallery = await buildEventGallery(loadedPage.html, locale, slug, tenantId, siteId);
  const integrityProfile = resolveIntegrityProfile(
    slug,
    sourceUrl,
    title,
    loadedPage.html,
    pageKind,
  );

  return {
    source: loadedPage.source,
    stylesheets: documentStyles.stylesheets,
    inlineStyles: documentStyles.inlineStyles,
    runtimeScripts,
    topBannerHtml: selectMeaningfulEventTop(loadedPage.html, locale, tenantId, siteId),
    contentHtml: rewritten.html,
    forms: rewritten.forms,
    eventGallery,
    integrityProfile,
    missingSignals: evaluateCandidateIntegrity(
      loadedPage.html,
      rewritten.html,
      rewritten.forms,
      eventGallery,
      integrityProfile,
    ),
  } satisfies MirrorPageCandidate;
}

export async function loadMirrorPageModel(
  tenantId: TenantId,
  locale: MirrorLocale,
  slug: string,
  siteId?: string,
): Promise<MirrorPageModel | null> {
  const tenantConfig = getTenantConfig(tenantId);
  const manifestEntries = await getManifestEntries(tenantId, siteId);
  const manifestEntry = manifestEntries[slug];
  if (!manifestEntry) {
    return null;
  }

  const absoluteFilePath = path.join(process.cwd(), "public", manifestEntry.file.replace(/^\//, ""));
  const loadedPage = await loadMirrorPageHtml(absoluteFilePath, manifestEntry.sourceUrl);
  if (!loadedPage) {
    return null;
  }
  const route = await getMirrorRouteMap(tenantId, slug, siteId);
  const pageKind = resolvePageKind(slug, route?.kind);
  let candidate = await buildMirrorPageCandidate({
    loadedPage,
    locale,
    pageKind,
    siteId,
    slug,
    sourceUrl: manifestEntry.sourceUrl,
    tenantId,
    title: route?.title ?? manifestEntry.title,
  });

  if (candidate.source === "local" && candidate.missingSignals.length > 0) {
    const remotePageHtml = await getRemoteMirrorPageHtml(manifestEntry.sourceUrl);
    if (remotePageHtml) {
      const remoteCandidate = await buildMirrorPageCandidate({
        loadedPage: {
          html: remotePageHtml,
          source: "remote-source",
        },
        locale,
        pageKind,
        siteId,
        slug,
        sourceUrl: manifestEntry.sourceUrl,
        tenantId,
        title: route?.title ?? manifestEntry.title,
      });

      if (remoteCandidate.missingSignals.length < candidate.missingSignals.length) {
        candidate = remoteCandidate;
      }
    }
  }

  return {
    siteId: siteId ?? tenantId,
    slug,
    title: route?.title ?? normalizeTitle(manifestEntry.title, tenantConfig.brand.siteTitle),
    sourceHref: route?.sourceHref ?? manifestEntry.sourceUrl,
    kind: pageKind,
    imageSrc: route?.imageSrc,
    stylesheets: candidate.stylesheets,
    inlineStyles: candidate.inlineStyles,
    runtimeScripts: candidate.runtimeScripts,
    topBannerHtml: candidate.topBannerHtml,
    contentHtml: candidate.contentHtml,
    forms: candidate.forms,
    eventGallery: candidate.eventGallery,
    fallbackSource: candidate.source,
    integrityProfile: candidate.integrityProfile,
    missingSignals: candidate.missingSignals,
  };
}

export async function loadMirrorPageModelForSegments(
  tenantId: TenantId,
  locale: MirrorLocale,
  segments: string[],
  siteId?: string,
) {
  const slug = resolveMirrorSlugFromSegments(segments, tenantId, siteId);
  if (!slug) {
    return null;
  }

  return loadMirrorPageModel(tenantId, locale, slug, siteId);
}
