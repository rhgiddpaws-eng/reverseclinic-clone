import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { chromium } from "playwright";
import { getMirrorTenant } from "./mirror-tenants.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const blockedQueryKeys = new Set([
  "__db__",
  "__upload",
  "_ajaxpage",
  "_post",
  "_get",
  "mvwiz",
  "exec",
  "mvwizhistory_id",
]);

const assetLikePattern =
  /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|ico|mp4|mov|avi|ttf|woff2?|eot|map|pdf)$/i;
const linkAssetRels = new Set([
  "icon",
  "shortcut icon",
  "apple-touch-icon",
  "mask-icon",
  "preload",
  "prefetch",
]);
const resourceAttributeNames = ["src", "data-src", "data-original", "poster"];
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const captureDefaults = {
  navigationTimeoutMs: 45_000,
  networkIdleTimeoutMs: 12_000,
  settleDelayMs: 1_000,
  scrollStepPx: 900,
  scrollDelayMs: 180,
  maxScrollPasses: 24,
  viewport: {
    width: 1440,
    height: 2400,
  },
};

const pageCache = new Set();
const assetCache = new Map();
const scriptCache = new Map();
const stylesCache = new Map();

function parseArgs(argv) {
  const values = {
    tenant: "reverseclinic",
    origin: "",
    canonicalHost: "",
    publicRootDir: "",
    manifestPath: "",
    headless: true,
    maxPages: 0,
    entryUrls: [],
    append: false,
    siteIds: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const nextValue = argv[index + 1];

    if (current === "--tenant" && nextValue) {
      values.tenant = nextValue;
      index += 1;
    } else if (current === "--origin" && nextValue) {
      values.origin = nextValue;
      index += 1;
    } else if (current === "--canonical-host" && nextValue) {
      values.canonicalHost = nextValue;
      index += 1;
    } else if (current === "--public-root-dir" && nextValue) {
      values.publicRootDir = nextValue;
      index += 1;
    } else if (current === "--manifest-path" && nextValue) {
      values.manifestPath = nextValue;
      index += 1;
    } else if (current === "--max-pages" && nextValue) {
      values.maxPages = Number.parseInt(nextValue, 10) || 0;
      index += 1;
    } else if (current === "--entry-url" && nextValue) {
      values.entryUrls.push(nextValue);
      index += 1;
    } else if (current === "--site-id" && nextValue) {
      values.siteIds.push(nextValue);
      index += 1;
    } else if (current === "--append") {
      values.append = true;
    } else if (current === "--headed") {
      values.headless = false;
    }
  }

  return values;
}

function resolveTenantOptions() {
  const cliArgs = parseArgs(process.argv.slice(2));
  const preset = getMirrorTenant(cliArgs.tenant);
  if (!preset) {
    throw new Error(`Unknown tenant: ${cliArgs.tenant}`);
  }

  const options = {
    ...preset,
    origin: cliArgs.origin || preset.origin,
    canonicalHost: cliArgs.canonicalHost || preset.canonicalHost,
    publicRootDir: cliArgs.publicRootDir || preset.publicRootDir,
    manifestPath: cliArgs.manifestPath || preset.manifestPath,
    headless: cliArgs.headless,
    maxPages: cliArgs.maxPages,
    entryUrls: cliArgs.entryUrls,
    append: cliArgs.append,
  };

  return {
    ...options,
    publicRoot: path.join(projectRoot, "public", options.publicRootDir),
    pageRoot: path.join(projectRoot, "public", options.publicRootDir, "pages"),
    assetRoot: path.join(projectRoot, "public", options.publicRootDir, "site"),
    manifestRoot: path.join(projectRoot, path.dirname(options.manifestPath)),
    manifestAbsolutePath: path.join(projectRoot, options.manifestPath),
    pagePublicDir: `/${options.publicRootDir}/pages`,
    sites:
      options.sites?.filter((site) => cliArgs.siteIds.length === 0 || cliArgs.siteIds.includes(site.siteId))
        .map((site) => ({
          ...site,
          tenantId: options.tenantId,
          publicRootDir: options.publicRootDir,
          headless: options.headless,
          maxPages: options.maxPages,
          append: options.append,
          entryUrls: options.entryUrls,
          commonExtraPagePaths: options.commonExtraPagePaths ?? [],
          publicRoot: path.join(projectRoot, "public", options.publicRootDir),
          pageRoot: path.join(projectRoot, "public", options.publicRootDir, "pages", site.siteId),
          assetRoot: path.join(projectRoot, "public", options.publicRootDir, "site"),
          manifestRoot: path.join(projectRoot, path.dirname(site.manifestPath)),
          manifestAbsolutePath: path.join(projectRoot, site.manifestPath),
          pagePublicDir: `/${options.publicRootDir}/pages/${site.siteId}`,
        })) ?? null,
  };
}

let tenantOptions = resolveTenantOptions();

function publicPathFromFilePath(filePath) {
  const publicRoot = path.join(projectRoot, "public");
  return `/${path.relative(publicRoot, filePath).replaceAll("\\", "/")}`;
}

function isInternalMirrorHost(hostname) {
  const normalizedHost = hostname.replace(/^www\./, "");

  if (tenantOptions.blockedLanguageHosts.includes(normalizedHost)) {
    return false;
  }

  return normalizedHost === tenantOptions.canonicalHost;
}

function sortSearchParams(url) {
  const sortedEntries = [...url.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyCompare = leftKey.localeCompare(rightKey);
    if (keyCompare !== 0) {
      return keyCompare;
    }

    return leftValue.localeCompare(rightValue);
  });

  url.search = "";
  for (const [key, value] of sortedEntries) {
    url.searchParams.append(key, value);
  }
}

function shouldSkipPage(url) {
  if (!isInternalMirrorHost(url.hostname)) {
    return true;
  }

  if (assetLikePattern.test(url.pathname)) {
    return true;
  }

  for (const key of blockedQueryKeys) {
    if (url.searchParams.has(key)) {
      return true;
    }
  }

  const simpleApps = url.searchParams.get("_simpleApps");
  if (simpleApps && !simpleApps.startsWith("member/")) {
    return true;
  }

  return false;
}

function normalizePageUrl(rawHref, baseUrl = `${tenantOptions.origin}/`) {
  if (!rawHref || rawHref === "#" || rawHref.startsWith("javascript:")) {
    return null;
  }

  let url;

  try {
    url = new URL(rawHref, baseUrl);
  } catch {
    return null;
  }

  if (url.protocol === "http:") {
    url.protocol = "https:";
  }

  if (url.hostname === `www.${tenantOptions.canonicalHost}`) {
    url.hostname = tenantOptions.canonicalHost;
  }

  if (url.searchParams.has("__login__") && !url.searchParams.has("idx") && !url.searchParams.has("_simpleApps")) {
    return `${tenantOptions.origin}/?_simpleApps=member/login`;
  }

  url.searchParams.delete("__login__");
  url.hash = "";
  sortSearchParams(url);

  if (shouldSkipPage(url)) {
    return null;
  }

  if (url.pathname === "/" && url.search === "?_main=index") {
    return `${tenantOptions.origin}/`;
  }

  return url.toString();
}

function slugFromUrl(rawUrl) {
  const url = new URL(rawUrl);

  if (url.pathname === "/" && url.search === "") {
    return "__home__";
  }

  if (url.searchParams.get("idx")) {
    return url.searchParams.get("idx").replaceAll("/", "--");
  }

  if (url.searchParams.get("_simpleApps")) {
    return `_simpleApps=${url.searchParams.get("_simpleApps").replaceAll("/", "--")}`;
  }

  const entries = [...url.searchParams.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort();

  const basePath = url.pathname.replace(/^\/+/, "").replaceAll("/", "--");

  if (entries.length === 0) {
    return basePath || "index";
  }

  return [basePath || "query", entries.join("_").replaceAll("/", "--")].join("_");
}

function localMirrorPageHref(rawUrl) {
  const normalized = normalizePageUrl(rawUrl);
  if (!normalized) {
    return rawUrl;
  }

  const slug = slugFromUrl(normalized);
  if (!slug) {
    return "/";
  }

  return `${tenantOptions.pagePublicDir}/${slug}.html`;
}

function hashToken(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function assetPathFromUrl(url, contentType = "") {
  const normalizedHost = url.hostname.replace(/^www\./, "");
  let pathnameValue = url.pathname;

  try {
    pathnameValue = decodeURIComponent(pathnameValue);
  } catch {
    pathnameValue = url.pathname;
  }

  pathnameValue = pathnameValue.replace(/[:*?"<>|]/g, "-");

  if (pathnameValue.endsWith("/")) {
    pathnameValue = `${pathnameValue}index`;
  }

  let extension = path.extname(pathnameValue);

  if (!extension) {
    if (contentType.includes("text/css")) {
      extension = ".css";
    } else if (contentType.includes("javascript")) {
      extension = ".js";
    } else if (contentType.includes("image/png")) {
      extension = ".png";
    } else if (contentType.includes("image/jpeg")) {
      extension = ".jpg";
    } else if (contentType.includes("image/svg")) {
      extension = ".svg";
    } else if (contentType.includes("text/html")) {
      extension = ".html";
    }

    pathnameValue = `${pathnameValue}${extension}`;
  }

  if (url.search) {
    pathnameValue = pathnameValue.replace(
      new RegExp(`${extension.replace(".", "\\.")}$`),
      `__${hashToken(url.search)}${extension}`,
    );
  }

  return path.join(tenantOptions.assetRoot, normalizedHost, pathnameValue.replace(/^\/+/, ""));
}

async function ensureDirectoryForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function isExternalProtocol(value) {
  return (
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  );
}

async function fetchWithMirrorHeaders(url, referer) {
  return fetch(url, {
    headers: {
      Accept: "*/*",
      Referer: referer,
      "User-Agent": userAgent,
    },
  });
}

async function downloadBinaryAsset(rawUrl, baseUrl) {
  const resolved = new URL(rawUrl, baseUrl);
  const cacheKey = resolved.toString();

  if (assetCache.has(cacheKey)) {
    return assetCache.get(cacheKey);
  }

  const response = await fetchWithMirrorHeaders(resolved, baseUrl).catch(() => null);
  if (!response?.ok) {
    assetCache.set(cacheKey, cacheKey);
    return cacheKey;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html") && !assetLikePattern.test(resolved.pathname)) {
    assetCache.set(cacheKey, cacheKey);
    return cacheKey;
  }

  const filePath = assetPathFromUrl(resolved, contentType);
  const publicPath = publicPathFromFilePath(filePath);
  const buffer = Buffer.from(await response.arrayBuffer());

  await ensureDirectoryForFile(filePath);
  await fs.writeFile(filePath, buffer);

  assetCache.set(cacheKey, publicPath);
  return publicPath;
}

async function rewriteCssUrls(cssText, baseUrl) {
  let nextCss = cssText.replace(/@import\s+url\(([^)]+)\);?/gi, "");
  const matches = [...nextCss.matchAll(/url\(([^)]+)\)/gi)];

  for (const match of matches) {
    const rawReference = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (!rawReference || rawReference.startsWith("#") || isExternalProtocol(rawReference)) {
      continue;
    }

    const localAsset = await downloadBinaryAsset(rawReference, baseUrl);
    nextCss = nextCss.replace(match[0], `url("${localAsset}")`);
  }

  return nextCss;
}

async function downloadStylesheet(rawUrl, baseUrl) {
  const resolved = new URL(rawUrl, baseUrl);
  const cacheKey = resolved.toString();

  if (stylesCache.has(cacheKey)) {
    return stylesCache.get(cacheKey);
  }

  const response = await fetchWithMirrorHeaders(resolved, baseUrl).catch(() => null);
  if (!response?.ok) {
    stylesCache.set(cacheKey, cacheKey);
    return cacheKey;
  }

  const cssText = await response.text();
  const sanitizedCss = await rewriteCssUrls(cssText, resolved.toString());
  const filePath = assetPathFromUrl(resolved, "text/css");
  const publicPath = publicPathFromFilePath(filePath);

  await ensureDirectoryForFile(filePath);
  await fs.writeFile(filePath, sanitizedCss, "utf8");

  stylesCache.set(cacheKey, publicPath);
  return publicPath;
}

async function downloadScript(rawUrl, baseUrl) {
  const resolved = new URL(rawUrl, baseUrl);
  const cacheKey = resolved.toString();

  if (scriptCache.has(cacheKey)) {
    return scriptCache.get(cacheKey);
  }

  const response = await fetchWithMirrorHeaders(resolved, baseUrl).catch(() => null);
  if (!response?.ok) {
    scriptCache.set(cacheKey, cacheKey);
    return cacheKey;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    scriptCache.set(cacheKey, cacheKey);
    return cacheKey;
  }

  const scriptText = await response.text();
  const filePath = assetPathFromUrl(resolved, contentType || "application/javascript");
  const publicPath = publicPathFromFilePath(filePath);

  await ensureDirectoryForFile(filePath);
  await fs.writeFile(filePath, scriptText, "utf8");

  scriptCache.set(cacheKey, publicPath);
  return publicPath;
}

function popupHrefFromOnclick(onclickCode) {
  if (/termsofuse\s*\(/i.test(onclickCode)) {
    return `${tenantOptions.origin}/?_simpleApps=member/terms-of-use`;
  }

  if (/privacypolicy\s*\(/i.test(onclickCode)) {
    return `${tenantOptions.origin}/?_simpleApps=member/privacy-policy`;
  }

  if (/patientsrights\s*\(/i.test(onclickCode)) {
    return `${tenantOptions.origin}/?_simpleApps=member/patients-rights`;
  }

  if (/login_open\s*\(/i.test(onclickCode)) {
    return `${tenantOptions.origin}/?_simpleApps=member/login`;
  }

  if (/join_open\s*\(/i.test(onclickCode)) {
    return `${tenantOptions.origin}/?_simpleApps=member/join`;
  }

  const windowMatch = onclickCode.match(/window_open\((['"])(.*?)\1/i);
  if (windowMatch) {
    return windowMatch[2];
  }

  return null;
}

function canonicalAuthHref(mode) {
  return `${tenantOptions.origin}/?_simpleApps=member/${mode}`;
}

function normalizeAnchorLabel(value) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function authModeFromAnchorLabel(text, title) {
  const label = `${normalizeAnchorLabel(text)} ${normalizeAnchorLabel(title)}`.trim();
  if (!label) {
    return null;
  }

  if (
    ["login", "signin", "log-in", "로그인", "ログイン", "会员登录", "會員登入", "登录"].some((token) =>
      label.includes(token),
    )
  ) {
    return "login";
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
    return "join";
  }

  return null;
}

function authHrefFromHref(rawHref, baseUrl) {
  if (!rawHref || rawHref.startsWith("#") || isExternalProtocol(rawHref)) {
    return null;
  }

  try {
    const url = new URL(rawHref, baseUrl);
    const simpleApps = url.searchParams.get("_simpleApps");
    if (simpleApps === "member/login") {
      return canonicalAuthHref("login");
    }

    if (simpleApps === "member/join") {
      return canonicalAuthHref("join");
    }

    if (url.searchParams.has("__login__") || url.searchParams.get("idx") === "login") {
      return canonicalAuthHref("login");
    }

    if (url.searchParams.get("idx") === "join") {
      return canonicalAuthHref("join");
    }
  } catch {
    return null;
  }

  return null;
}

function resolveMemberPopupHref({ href, onclick, text, title, baseUrl }) {
  const onclickHref = popupHrefFromOnclick(onclick);
  if (onclickHref?.includes("/?_simpleApps=member/")) {
    return onclickHref;
  }

  const canonicalHref = authHrefFromHref(href, baseUrl);
  if (canonicalHref) {
    return canonicalHref;
  }

  const authMode = authModeFromAnchorLabel(text, title);
  if (authMode) {
    return canonicalAuthHref(authMode);
  }

  return onclickHref;
}

function rewriteInternalPageHref(rawHref, baseUrl) {
  if (!rawHref || rawHref.startsWith("#") || isExternalProtocol(rawHref)) {
    return rawHref;
  }

  try {
    const absoluteUrl = new URL(rawHref, baseUrl);
    const hash = absoluteUrl.hash;
    absoluteUrl.hash = "";

    const normalized = normalizePageUrl(absoluteUrl.toString(), baseUrl);
    if (normalized) {
      return `${localMirrorPageHref(normalized)}${hash}`;
    }

    return absoluteUrl.toString();
  } catch {
    return rawHref;
  }
}

function rewriteIframeHref(rawHref, baseUrl) {
  if (!rawHref || rawHref.startsWith("#") || isExternalProtocol(rawHref)) {
    return rawHref;
  }

  const normalized = normalizePageUrl(rawHref, baseUrl);
  if (!normalized) {
    return rawHref;
  }

  return localMirrorPageHref(normalized);
}

async function rewriteSrcsetValue(rawValue, baseUrl) {
  const candidates = rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const rewritten = [];

  for (const candidate of candidates) {
    const [resourceUrl, descriptor] = candidate.split(/\s+/, 2);
    if (!resourceUrl || isExternalProtocol(resourceUrl)) {
      rewritten.push(candidate);
      continue;
    }

    const localAsset = await downloadBinaryAsset(resourceUrl, baseUrl);
    rewritten.push([localAsset, descriptor].filter(Boolean).join(" "));
  }

  return rewritten.join(", ");
}

async function rewriteDocument(rawHtml, pageUrl) {
  const $ = load(rawHtml, null, false);

  $("base").remove();
  $("meta[http-equiv]").each((_, element) => {
    const httpEquiv = ($(element).attr("http-equiv") ?? "").toLowerCase();
    if (httpEquiv.includes("content-security-policy")) {
      $(element).remove();
    }
  });

  for (const element of $("link[href]").toArray()) {
    const link = $(element);
    const href = link.attr("href")?.trim();
    const rel = (link.attr("rel") ?? "").toLowerCase();
    if (!href || href.startsWith("#") || isExternalProtocol(href)) {
      continue;
    }

    if (rel.includes("stylesheet")) {
      const localStylesheet = await downloadStylesheet(href, pageUrl);
      link.attr("href", localStylesheet);
      link.removeAttr("integrity").removeAttr("crossorigin").removeAttr("nonce");
      continue;
    }

    if ([...linkAssetRels].some((value) => rel.includes(value)) || assetLikePattern.test(href)) {
      const localAsset = await downloadBinaryAsset(href, pageUrl);
      link.attr("href", localAsset);
      link.removeAttr("integrity").removeAttr("crossorigin").removeAttr("nonce");
      continue;
    }

    link.attr("href", rewriteInternalPageHref(href, pageUrl));
  }

  for (const element of $("style").toArray()) {
    const style = $(element);
    const cssText = style.html();
    if (!cssText) {
      continue;
    }

    style.text(await rewriteCssUrls(cssText, pageUrl));
  }

  for (const element of $("[style]").toArray()) {
    const currentStyle = $(element).attr("style");
    if (!currentStyle) {
      continue;
    }

    $(element).attr("style", await rewriteCssUrls(currentStyle, pageUrl));
  }

  for (const element of $("script[src]").toArray()) {
    const script = $(element);
    const source = script.attr("src")?.trim();
    if (!source || source.startsWith("#") || isExternalProtocol(source)) {
      continue;
    }

    const localScript = await downloadScript(source, pageUrl);
    script.attr("src", localScript);
    script.removeAttr("integrity").removeAttr("crossorigin").removeAttr("nonce");
  }

  for (const element of $("a").toArray()) {
    const anchor = $(element);
    const onclick = anchor.attr("onclick") ?? "";
    let href = anchor.attr("href")?.trim() ?? "";
    const memberPopupHref = resolveMemberPopupHref({
      href,
      onclick,
      text: anchor.text(),
      title: anchor.attr("title") ?? "",
      baseUrl: pageUrl,
    });

    if (memberPopupHref) {
      href = memberPopupHref;
    } else if ((!href || href === "#") && onclick) {
      href = popupHrefFromOnclick(onclick) ?? href;
    }

    if (!href) {
      continue;
    }

    if (assetLikePattern.test(href)) {
      anchor.attr("href", await downloadBinaryAsset(href, pageUrl));
      continue;
    }

    const rewrittenHref = rewriteInternalPageHref(href, pageUrl);
    anchor.attr("href", rewrittenHref);

    if (rewrittenHref.startsWith("/")) {
      anchor.removeAttr("target").removeAttr("rel");
    }
  }

  for (const element of $("iframe[src]").toArray()) {
    const frame = $(element);
    const source = frame.attr("src")?.trim();
    if (!source || source.startsWith("#") || isExternalProtocol(source)) {
      continue;
    }

    frame.attr("src", rewriteIframeHref(source, pageUrl));
  }

  for (const element of $("[srcset]").toArray()) {
    const currentValue = $(element).attr("srcset");
    if (!currentValue) {
      continue;
    }

    $(element).attr("srcset", await rewriteSrcsetValue(currentValue, pageUrl));
  }

  for (const attrName of resourceAttributeNames) {
    for (const element of $(`[${attrName}]`).toArray()) {
      const node = $(element);
      const value = node.attr(attrName)?.trim();
      const tagName = element.tagName?.toLowerCase() ?? "";

      if (!value || value.startsWith("#") || isExternalProtocol(value)) {
        continue;
      }

      if (tagName === "script" && attrName === "src") {
        continue;
      }

      if (tagName === "iframe" && attrName === "src") {
        continue;
      }

      node.attr(attrName, await downloadBinaryAsset(value, pageUrl));
    }
  }

  for (const element of $("object[data], embed[src]").toArray()) {
    const node = $(element);
    const attrName = node.is("object") ? "data" : "src";
    const value = node.attr(attrName)?.trim();

    if (!value || value.startsWith("#") || isExternalProtocol(value)) {
      continue;
    }

    node.attr(attrName, await downloadBinaryAsset(value, pageUrl));
  }

  if ($("body").length > 0) {
    const runtimeSelector = `script[src="/${tenantOptions.publicRootDir}/runtime.js"]`;
    if ($(runtimeSelector).length === 0) {
      $("body").append(`\n<script src="/${tenantOptions.publicRootDir}/runtime.js"></script>\n`);
    }
  }

  return `<!doctype html>\n${$.html()}`;
}

function discoverLinks(html, baseUrl) {
  const $ = load(html, null, false);
  const urls = new Set();

  for (const element of $("a, iframe[src]").toArray()) {
    const node = $(element);
    const isAnchor = node.is("a");
    const href = (isAnchor ? node.attr("href") : node.attr("src"))?.trim() ?? "";
    const onclick = node.attr("onclick") ?? "";
    const candidate = href || (isAnchor ? popupHrefFromOnclick(onclick) : "");
    if (!candidate) {
      continue;
    }

    const normalized = normalizePageUrl(candidate, baseUrl);
    if (normalized) {
      urls.add(normalized);
    }
  }

  return [...urls];
}

async function waitForSettledPage(page) {
  await page.waitForLoadState("domcontentloaded", {
    timeout: captureDefaults.navigationTimeoutMs,
  });

  try {
    await page.waitForLoadState("networkidle", {
      timeout: captureDefaults.networkIdleTimeoutMs,
    });
  } catch {
    // 장시간 유지되는 연결이 있어도 최종 DOM을 저장하기 위해 계속 진행한다.
  }

  await page.waitForTimeout(captureDefaults.settleDelayMs);
}

async function autoScrollPage(page) {
  await page.evaluate(
    async ({ scrollStepPx, scrollDelayMs, maxScrollPasses }) => {
      const sleep = (timeoutMs) => new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
      let previousHeight = 0;
      let stablePasses = 0;

      for (let pass = 0; pass < maxScrollPasses; pass += 1) {
        const scrollHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );

        for (let currentTop = 0; currentTop <= scrollHeight; currentTop += scrollStepPx) {
          window.scrollTo(0, currentTop);
          await sleep(scrollDelayMs);
        }

        window.scrollTo(0, scrollHeight);
        await sleep(scrollDelayMs);

        if (scrollHeight === previousHeight) {
          stablePasses += 1;
        } else {
          stablePasses = 0;
        }

        previousHeight = scrollHeight;
        if (stablePasses >= 1) {
          break;
        }
      }

      window.scrollTo(0, 0);
      await sleep(scrollDelayMs);
    },
    {
      scrollStepPx: captureDefaults.scrollStepPx,
      scrollDelayMs: captureDefaults.scrollDelayMs,
      maxScrollPasses: captureDefaults.maxScrollPasses,
    },
  );
}

async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: tenantOptions.headless,
    });
  } catch (error) {
    if (String(error).includes("Executable doesn't exist")) {
      throw new Error("Playwright Chromium browser is missing. Run `npx playwright install chromium` first.");
    }

    throw error;
  }
}

async function captureRenderedPage(context, url) {
  const page = await context.newPage();
  page.on("dialog", async (dialog) => {
    await dialog.dismiss().catch(() => {});
  });

  try {
    await page.goto(url, {
      timeout: captureDefaults.navigationTimeoutMs,
      waitUntil: "domcontentloaded",
    });

    await waitForSettledPage(page);
    await autoScrollPage(page);
    await waitForSettledPage(page);

    return {
      html: await page.content(),
      title: await page.title(),
    };
  } finally {
    await page.close();
  }
}

async function buildPage(context, url) {
  const captured = await captureRenderedPage(context, url).catch(() => null);
  if (!captured) {
    return null;
  }

  const output = await rewriteDocument(captured.html, url);

  return {
    rawHtml: captured.html,
    title: captured.title || tenantOptions.tenantId,
    output,
  };
}

async function writePageFile(slug, html) {
  const filePath = path.join(tenantOptions.pageRoot, `${slug}.html`);
  await ensureDirectoryForFile(filePath);
  await fs.writeFile(filePath, html, "utf8");
}

async function loadExistingManifest() {
  try {
    const raw = await fs.readFile(tenantOptions.manifestAbsolutePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function runCaptureForCurrentOptions() {
  const pageManifest = tenantOptions.append ? await loadExistingManifest() : {};
  pageCache.clear();

  await fs.mkdir(tenantOptions.pageRoot, { recursive: true });
  await fs.mkdir(tenantOptions.assetRoot, { recursive: true });
  await fs.mkdir(tenantOptions.manifestRoot, { recursive: true });

  const seedUrls =
    tenantOptions.entryUrls.length > 0
      ? tenantOptions.entryUrls
      : [
          `${tenantOptions.origin}/`,
          ...(tenantOptions.commonExtraPagePaths ?? []).map((value) => `${tenantOptions.origin}${value}`),
          ...tenantOptions.extraPageUrls,
        ];
  const queue = seedUrls.map((value) => normalizePageUrl(value) ?? value).filter(Boolean);
  const discovered = new Set(queue);
  const browser = await launchBrowser();
  const context = await browser.newContext({
    locale: "ko-KR",
    userAgent,
    viewport: captureDefaults.viewport,
  });
  await context.addInitScript(() => {
    Object.defineProperty(window.navigator, "webdriver", {
      configurable: true,
      get: () => undefined,
    });
  });

  try {
    while (queue.length > 0) {
      if (tenantOptions.maxPages > 0 && pageCache.size >= tenantOptions.maxPages) {
        break;
      }

      const currentUrl = queue.shift();
      if (!currentUrl || pageCache.has(currentUrl)) {
        continue;
      }

      pageCache.add(currentUrl);
      console.log(`[mirror] capturing ${currentUrl}`);

      const page = await buildPage(context, currentUrl);
      if (!page) {
        console.log(`[mirror] skipped ${currentUrl}`);
        continue;
      }

      const slug = slugFromUrl(currentUrl);
      if (slug) {
        await writePageFile(slug, page.output);
        pageManifest[slug] = {
          sourceUrl: currentUrl,
          title: page.title,
          file: `${tenantOptions.pagePublicDir}/${slug}.html`,
        };
      }

      const nextUrls = discoverLinks(page.rawHtml, currentUrl);
      for (const nextUrl of nextUrls) {
        if (!discovered.has(nextUrl)) {
          discovered.add(nextUrl);
          queue.push(nextUrl);
        }
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  await fs.writeFile(tenantOptions.manifestAbsolutePath, JSON.stringify(pageManifest, null, 2), "utf8");
  console.log(
    `Mirrored ${Object.keys(pageManifest).length} internal pages for ${tenantOptions.tenantId}${tenantOptions.siteId ? `:${tenantOptions.siteId}` : ""}.`,
  );
}

async function main() {
  if (tenantOptions.sites?.length) {
    if (!tenantOptions.append) {
      await fs.rm(tenantOptions.pageRoot, { recursive: true, force: true });
      await fs.rm(tenantOptions.assetRoot, { recursive: true, force: true });
    }

    for (const siteOptions of tenantOptions.sites) {
      tenantOptions = siteOptions;
      if (!tenantOptions.append) {
        await fs.rm(tenantOptions.pageRoot, { recursive: true, force: true });
      }

      await runCaptureForCurrentOptions();
    }
    return;
  }

  if (!tenantOptions.append) {
    await fs.rm(tenantOptions.pageRoot, { recursive: true, force: true });
    await fs.rm(tenantOptions.assetRoot, { recursive: true, force: true });
  }

  await runCaptureForCurrentOptions();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
