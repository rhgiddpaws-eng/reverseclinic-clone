import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale, MirrorRouteKind } from "@/lib/reverseclinic-types";
import { getTenantConfig, getTenantRuntime } from "@/lib/tenant-registry";
import {
  buildReverseClinicSitePath,
  getReverseClinicSite,
  getReverseClinicSiteId,
  getReverseClinicSiteIdFromHost,
  getReverseClinicSiteRootPath,
  isKnownReverseClinicSiteHost,
} from "@/tenants/reverseclinic/site-registry";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRoutePath(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

function isReverseClinicTenant(tenantId?: TenantId | null) {
  return (tenantId ?? "reverseclinic") === "reverseclinic";
}

function isIntlReverseClinicSite(siteId?: string) {
  return Boolean(siteId) && getReverseClinicSite(siteId as never).family === "intl";
}

function buildRoutingState(tenantId?: TenantId | null) {
  const tenantConfig = getTenantConfig(tenantId);
  const tenantRuntime = getTenantRuntime(tenantId);
  const internalHostPattern = new RegExp(
    `^(?:https?:\\/\\/)?(?:www\\.)?${escapeRegExp(tenantConfig.host.canonicalHost)}$`,
    "i",
  );
  const languageHostRoute = Object.fromEntries(
    Object.entries(tenantConfig.host.localeHosts).reduce<Array<[string, MirrorLocale]>>(
      (entries, [locale, host]) => {
        if (!host) {
          return entries;
        }

        entries.push([host, locale as MirrorLocale]);
        return entries;
      },
      [],
    ),
  ) as Record<string, MirrorLocale>;
  const specialPageSlug = Object.fromEntries(
    Object.entries(tenantConfig.routes.specialIdxRoute)
      .filter(([, route]) => !route.startsWith("member/"))
      .map(([slug, route]) => [route, slug.replaceAll("/", "--")]),
  ) as Partial<Record<MirrorRouteKind, string>>;
  const mirrorSlugRoute = Object.fromEntries(
    Object.entries(tenantConfig.routes.mirrorSlugRoute ?? {}).map(([slug, route]) => [
      slug,
      normalizeRoutePath(route),
    ]),
  ) as Record<string, string>;
  const routeSlugMap = Object.fromEntries(
    Object.entries(mirrorSlugRoute).map(([slug, route]) => [route, slug]),
  ) as Record<string, string>;

  return {
    tenantConfig,
    tenantRuntime,
    internalHostPattern,
    languageHostRoute,
    specialIdxRoute: tenantConfig.routes.specialIdxRoute,
    simpleAppsRoute: tenantConfig.routes.simpleAppsRoute,
    specialPageSlug,
    mirrorSlugRoute,
    routeSlugMap,
  };
}

function normalizeInternalUrl(
  rawHref: string,
  tenantId?: TenantId | null,
  siteId?: string,
) {
  if (!rawHref || rawHref === "#" || rawHref.startsWith("javascript:")) {
    return null;
  }

  try {
    if (isReverseClinicTenant(tenantId) && siteId) {
      return new URL(rawHref, getReverseClinicSite(siteId as never).origin);
    }

    return new URL(rawHref, getTenantConfig(tenantId).mirror.origin);
  } catch {
    return null;
  }
}

function decodeSlugSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractMirrorStaticSlug(
  pathname: string,
  tenantId?: TenantId | null,
  siteId?: string,
) {
  if (!pathname) {
    return null;
  }

  if (isReverseClinicTenant(tenantId)) {
    const sitePageRoot = siteId ? getReverseClinicSite(siteId as never).pageRoot : null;
    const sitePagePattern = sitePageRoot
      ? new RegExp(`^${escapeRegExp(sitePageRoot)}/([^/]+)\\.html$`, "i")
      : null;
    const sharedPagePattern = /^\/reverseclinic-mirror\/pages(?:\/[^/]+)?\/([^/]+)\.html$/i;
    const match = pathname.match(sitePagePattern ?? sharedPagePattern) ?? pathname.match(sharedPagePattern);
    return match ? decodeSlugSegment(match[1]) : null;
  }

  const pageRoot = getTenantConfig(tenantId).mirror.pageRoot;
  const match = pathname.match(new RegExp(`^${escapeRegExp(pageRoot)}/([^/]+)\\.html$`, "i"));
  return match ? decodeSlugSegment(match[1]) : null;
}

function appendUrlHash(route: string, hash: string) {
  return hash ? `${route}${hash}` : route;
}

function resolveSlugFromUrl(
  url: URL,
  state: ReturnType<typeof buildRoutingState>,
  tenantId?: TenantId | null,
  siteId?: string,
) {
  if (!url.search && normalizeRoutePath(url.pathname) === "") {
    return "__home__";
  }

  if (url.searchParams.get("idx") === "cart") {
    return "cart";
  }

  if (url.searchParams.get("idx")) {
    const rawIdx = url.searchParams.get("idx")!;
    const specialRoute = state.specialIdxRoute[rawIdx];
    if (specialRoute?.startsWith("member/")) {
      return `_simpleApps=${specialRoute.replaceAll("/", "--")}`;
    }

    return rawIdx.replaceAll("/", "--");
  }

  if (url.searchParams.get("_simpleApps")) {
    return `_simpleApps=${url.searchParams.get("_simpleApps")!.replaceAll("/", "--")}`;
  }

  if (url.searchParams.get("__login__")) {
    return "_simpleApps=member--login";
  }

  const staticSlug = extractMirrorStaticSlug(url.pathname, tenantId, siteId);
  if (staticSlug) {
    return staticSlug;
  }

  const pathname = normalizeRoutePath(url.pathname);
  if (pathname) {
    const aliasSlug = state.routeSlugMap[pathname];
    if (aliasSlug) {
      return aliasSlug;
    }
  }

  const normalizedSlug = pathname.replaceAll("/", "--");
  if (normalizedSlug) {
    return normalizedSlug;
  }

  return null;
}

function resolveReverseClinicTargetSiteId(url: URL, currentSiteId: string) {
  const normalizedHost = url.hostname.replace(/^www\./, "");
  if (!normalizedHost) {
    return currentSiteId;
  }

  if (!isKnownReverseClinicSiteHost(normalizedHost)) {
    return null;
  }

  const currentSite = getReverseClinicSite(currentSiteId as never);
  const targetSiteId = getReverseClinicSiteIdFromHost(normalizedHost);
  const targetSite = getReverseClinicSite(targetSiteId as never);

  if (currentSite.family !== "intl" || targetSite.family === "intl") {
    return targetSiteId;
  }

  if (targetSite.branch === "gangnam" || targetSite.branch === "hongdae" || targetSite.branch === "myeongdong") {
    return getReverseClinicSiteId(currentSite.locale, targetSite.branch);
  }

  return targetSiteId;
}

function buildSiteAwareRoute(
  slug: string | null,
  url: URL,
  tenantId?: TenantId | null,
  siteId?: string,
) {
  const state = buildRoutingState(tenantId);
  if (!isReverseClinicTenant(tenantId) || !siteId) {
    return null;
  }

  const isStaticMirrorPage = Boolean(extractMirrorStaticSlug(url.pathname, tenantId, siteId));

  const targetSiteId = resolveReverseClinicTargetSiteId(url, siteId);
  if (!targetSiteId) {
    return null;
  }

  if (!slug || slug === "__home__") {
    return getReverseClinicSiteRootPath(targetSiteId as never);
  }

  if (slug === "cart") {
    return buildReverseClinicSitePath(targetSiteId as never, "cart");
  }

  if (slug.startsWith("_simpleApps=")) {
    const simpleSlug = slug.replace(/^_simpleApps=/, "").replaceAll("--", "/");
    const simpleRoute = state.simpleAppsRoute[simpleSlug];
    return buildReverseClinicSitePath(targetSiteId as never, simpleRoute ?? `member/${simpleSlug}`);
  }

  if (isIntlReverseClinicSite(targetSiteId)) {
    return buildReverseClinicSitePath(targetSiteId as never, slug.replaceAll("--", "/"));
  }

  const specialRoute = Object.entries(state.specialPageSlug).find(
    ([, value]) => value === slug,
  )?.[0];
  if (specialRoute) {
    return buildReverseClinicSitePath(targetSiteId as never, specialRoute);
  }

  const canonicalRoute = state.mirrorSlugRoute[slug];
  if (canonicalRoute) {
    return buildReverseClinicSitePath(targetSiteId as never, canonicalRoute);
  }

  if (!isStaticMirrorPage && !url.search && normalizeRoutePath(url.pathname)) {
    return buildReverseClinicSitePath(targetSiteId as never, normalizeRoutePath(url.pathname));
  }

  return buildReverseClinicSitePath(targetSiteId as never, slug.replaceAll("--", "/"));
}

export function sourceHrefToMirrorSlug(
  rawHref: string,
  tenantId?: TenantId | null,
  siteId?: string,
) {
  const state = buildRoutingState(tenantId);
  const url = normalizeInternalUrl(rawHref, tenantId, siteId);
  if (!url) {
    return null;
  }

  if (isReverseClinicTenant(tenantId)) {
    const normalizedHost = url.hostname.replace(/^www\./, "");
    if (normalizedHost && !isKnownReverseClinicSiteHost(normalizedHost)) {
      return null;
    }

    return resolveSlugFromUrl(url, state, tenantId, siteId);
  }

  const hostname = url.hostname.replace(/^www\./, "");
  if (hostname in state.languageHostRoute) {
    return null;
  }

  if (
    !state.internalHostPattern.test(url.origin) &&
    !url.href.startsWith(state.tenantConfig.mirror.origin)
  ) {
    return null;
  }

  return resolveSlugFromUrl(url, state, tenantId, siteId);
}

export function toMirrorStaticPageFromSlug(
  slug: string,
  tenantId?: TenantId | null,
  siteId?: string,
) {
  if (isReverseClinicTenant(tenantId) && siteId) {
    return `${getReverseClinicSite(siteId as never).pageRoot}/${slug}.html`;
  }

  return `${getTenantConfig(tenantId).mirror.pageRoot}/${slug}.html`;
}

export function segmentsToSlug(segments: string[]) {
  if (segments.length === 0) {
    return "";
  }

  if (segments[0] === "member" && segments.length > 1) {
    return `_simpleApps=${segments.join("--")}`;
  }

  return segments.join("--");
}

export function localePath(locale: MirrorLocale, route = "", tenantId?: TenantId | null) {
  const prefix = getTenantRuntime(tenantId).getLocalePrefix(locale);
  if (!route) {
    return prefix || "/";
  }

  if (route.startsWith("/")) {
    return `${prefix}${route}` || "/";
  }

  return `${prefix}/${route}` || "/";
}

export function normalizeMirrorAppRoute(
  rawHref: string,
  locale: MirrorLocale = "ko",
  tenantId?: TenantId | null,
  siteId?: string,
) {
  const state = buildRoutingState(tenantId);

  if (!rawHref || rawHref === "#") {
    return "#";
  }

  const url = normalizeInternalUrl(rawHref, tenantId, siteId);
  if (!url) {
    return rawHref;
  }

  if (isReverseClinicTenant(tenantId) && siteId) {
    const slug = resolveSlugFromUrl(url, state, tenantId, siteId);
    const siteAwareRoute = buildSiteAwareRoute(slug, url, tenantId, siteId);
    return siteAwareRoute ? appendUrlHash(siteAwareRoute, url.hash) : rawHref;
  }

  const normalizedHost = url.hostname.replace(/^www\./, "");
  const localeHost = state.languageHostRoute[normalizedHost];
  if (localeHost) {
    return localePath(localeHost, "", tenantId);
  }

  if (
    !state.internalHostPattern.test(url.origin) &&
    normalizedHost !== state.tenantConfig.host.canonicalHost &&
    normalizedHost !== ""
  ) {
    return rawHref;
  }

  if (url.pathname === "/" && (!url.search || url.search === "?_main=index")) {
    return localePath(locale, "", tenantId);
  }

  const currentPrefix = state.tenantRuntime.getLocalePrefix(locale);
  if (
    currentPrefix &&
    (url.pathname === currentPrefix || url.pathname.startsWith(`${currentPrefix}/`))
  ) {
    return `${url.pathname}${url.search}`;
  }

  if (url.searchParams.get("__login__")) {
    return localePath(locale, "login", tenantId);
  }

  const simpleApps = url.searchParams.get("_simpleApps");
  if (simpleApps) {
    const simpleRoute = state.simpleAppsRoute[simpleApps];
    return localePath(locale, simpleRoute ?? `member/${simpleApps}`, tenantId);
  }

  const idx = url.searchParams.get("idx");
  if (idx) {
    if (idx === "cart") {
      return localePath(locale, "cart", tenantId);
    }

    if (idx === "login") {
      return localePath(locale, "login", tenantId);
    }

    if (idx === "join") {
      return localePath(locale, "join", tenantId);
    }

    const specialRoute = state.specialIdxRoute[idx];
    if (specialRoute) {
      return localePath(locale, specialRoute, tenantId);
    }

    const canonicalRoute = state.mirrorSlugRoute[idx.replaceAll("/", "--")];
    if (canonicalRoute) {
      return localePath(locale, canonicalRoute, tenantId);
    }

    return localePath(locale, idx, tenantId);
  }

  const aliasSlug = sourceHrefToMirrorSlug(rawHref, tenantId);
  if (aliasSlug) {
    const canonicalRoute = state.mirrorSlugRoute[aliasSlug];
    if (canonicalRoute) {
      return localePath(locale, canonicalRoute, tenantId);
    }
  }

  if (url.pathname && url.pathname !== "/") {
    return localePath(locale, url.pathname.replace(/^\/+/, ""), tenantId);
  }

  return localePath(locale, "", tenantId);
}

export function toMirrorStaticHref(rawHref: string, tenantId?: TenantId | null, siteId?: string) {
  if (!rawHref || rawHref === "#") {
    return "#";
  }

  const slug = sourceHrefToMirrorSlug(rawHref, tenantId, siteId);
  if (!slug) {
    return rawHref;
  }

  if (slug === "cart") {
    return "/placeholder/cart";
  }

  return toMirrorStaticPageFromSlug(slug, tenantId, siteId);
}

export function routeKindFromSegments(segments: string[]): MirrorRouteKind {
  if (segments.length === 0) {
    return "home";
  }

  if (segments[0] === "best") {
    return "best";
  }

  if (segments[0] === "event") {
    return "event";
  }

  if (segments[0] === "price") {
    return "price";
  }

  if (segments[0] === "talk") {
    return "talk";
  }

  if (segments[0] === "reservation") {
    return "reservation";
  }

  if (segments[0] === "cart") {
    return "cart";
  }

  return "generic";
}

export function specialMirrorSlugFromKind(
  kind: MirrorRouteKind,
  tenantId?: TenantId | null,
) {
  return buildRoutingState(tenantId).specialPageSlug[kind] ?? null;
}

export function mirrorSlugToAppRoute(
  slug: string,
  locale: MirrorLocale = "ko",
  tenantId?: TenantId | null,
  siteId?: string,
) {
  const state = buildRoutingState(tenantId);

  if (isReverseClinicTenant(tenantId) && siteId) {
    if (slug === "__home__") {
      return getReverseClinicSiteRootPath(siteId as never);
    }

    if (slug === "cart") {
      return buildReverseClinicSitePath(siteId as never, "cart");
    }

    if (slug.startsWith("_simpleApps=")) {
      const simpleSlug = slug.replace(/^_simpleApps=/, "").replaceAll("--", "/");
      const simpleRoute = state.simpleAppsRoute[simpleSlug];
      return buildReverseClinicSitePath(siteId as never, simpleRoute ?? `member/${simpleSlug}`);
    }

    if (isIntlReverseClinicSite(siteId)) {
      return buildReverseClinicSitePath(siteId as never, slug.replaceAll("--", "/"));
    }

    const specialRoute = Object.entries(state.specialPageSlug).find(
      ([, value]) => value === slug,
    )?.[0];
    if (specialRoute) {
      return buildReverseClinicSitePath(siteId as never, specialRoute);
    }

    const canonicalRoute = state.mirrorSlugRoute[slug];
    if (canonicalRoute) {
      return buildReverseClinicSitePath(siteId as never, canonicalRoute);
    }

    return buildReverseClinicSitePath(siteId as never, slug.replaceAll("--", "/"));
  }

  if (slug === "cart") {
    return localePath(locale, "cart", tenantId);
  }

  if (slug.startsWith("_simpleApps=")) {
    const simpleSlug = slug.replace(/^_simpleApps=/, "").replaceAll("--", "/");
    const simpleRoute = state.simpleAppsRoute[simpleSlug];
    return localePath(locale, simpleRoute ?? `member/${simpleSlug}`, tenantId);
  }

  const specialRoute = Object.entries(state.specialPageSlug).find(
    ([, value]) => value === slug,
  )?.[0];
  if (specialRoute) {
    return localePath(locale, specialRoute, tenantId);
  }

  const canonicalRoute = state.mirrorSlugRoute[slug];
  if (canonicalRoute) {
    return localePath(locale, canonicalRoute, tenantId);
  }

  return localePath(locale, slug.replaceAll("--", "/"), tenantId);
}

export function resolveMirrorSlugFromSegments(
  segments: string[],
  tenantId?: TenantId | null,
  siteId?: string,
) {
  const state = buildRoutingState(tenantId);
  const kind = routeKindFromSegments(segments);

  if (kind === "home") {
    return "__home__";
  }

  if (kind === "cart") {
    return null;
  }

  if (segments[0] === "login") {
    return "_simpleApps=member--login";
  }

  if (segments[0] === "join") {
    return "_simpleApps=member--join";
  }

  if (segments[0] === "member" && segments.length > 1) {
    return segmentsToSlug(segments);
  }

  if (isReverseClinicTenant(tenantId) && isIntlReverseClinicSite(siteId)) {
    return segmentsToSlug(segments);
  }

  if (kind !== "generic") {
    if (kind === "reservation") {
      return state.specialPageSlug.reservation ?? state.specialPageSlug.talk ?? null;
    }

    return state.specialPageSlug[kind] ?? null;
  }

  const canonicalRoute = normalizeRoutePath(segments.join("/"));
  const aliasedSlug = state.routeSlugMap[canonicalRoute];
  if (aliasedSlug) {
    return aliasedSlug;
  }

  if (isReverseClinicTenant(tenantId) && siteId) {
    return segmentsToSlug(segments);
  }

  return segmentsToSlug(segments);
}
