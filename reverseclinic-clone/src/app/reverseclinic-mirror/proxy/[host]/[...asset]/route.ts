import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTenantConfig } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

type ProxyRouteContext = {
  params: Promise<{
    host: string;
    asset: string[];
  }>;
};

function isAllowedHost(host: string) {
  const normalizedHost = host.replace(/^www\./, "").toLowerCase();
  return getTenantConfig("reverseclinic").mirror.localAssetHosts.includes(normalizedHost);
}

function rewriteCssFontUrls(cssText: string, host: string, assetPath: string) {
  // xeicon 스타일시트 특수 처리
  if (assetPath.endsWith("_files/6uh_iFf98.css")) {
    cssText = cssText.replace(
      /@font-face\{font-family:xeicon;src:url\(fonts\/xeicon\.eot[^}]+font-style:normal\}/,
      '@font-face{font-family:xeicon;src:url(/_files/6uh_ARI7v.woff2) format("woff2");font-weight:400;font-style:normal}',
    );
  }

  // CSS 내 url() 참조를 프록시 경로로 재작성
  const assetDir = assetPath.replace(/\/[^/]+$/, "");
  return cssText.replace(
    /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g,
    (_match, quote: string, rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("/reverseclinic-mirror/")
      ) {
        return `url(${quote}${rawUrl}${quote})`;
      }

      // /_files/ 절대 경로는 프록시 경로로 변환 (우리 서버에 /_files/ 없음)
      if (trimmed.startsWith("/_files/")) {
        return `url(${quote}/reverseclinic-mirror/proxy/${host}${trimmed}${quote})`;
      }

      let resolvedPath: string;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        try {
          const parsed = new URL(trimmed);
          // 외부 도메인 URL은 프록시하지 않고 https로만 업그레이드
          if (parsed.hostname !== host && parsed.hostname !== `www.${host}`) {
            const upgraded = trimmed.replace(/^http:\/\//, "https://");
            return `url(${quote}${upgraded}${quote})`;
          }
          resolvedPath = parsed.pathname.replace(/^\/+/, "");
        } catch {
          return `url(${quote}${rawUrl}${quote})`;
        }
      } else if (trimmed.startsWith("/")) {
        resolvedPath = trimmed.replace(/^\/+/, "");
      } else {
        resolvedPath = `${assetDir}/${trimmed}`;
      }

      return `url(${quote}/reverseclinic-mirror/proxy/${host}/${resolvedPath}${quote})`;
    },
  );
}

export async function GET(request: NextRequest, context: ProxyRouteContext) {
  const { host, asset } = await context.params;
  const normalizedHost = host.replace(/^www\./, "").toLowerCase();
  if (!isAllowedHost(normalizedHost) || asset.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assetPath = asset.join("/");
  const remoteUrl = new URL(`https://${normalizedHost}/${assetPath}`);
  remoteUrl.search = request.nextUrl.search;

  const response = await fetch(remoteUrl, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
    next: { revalidate: 3600 },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const canStreamAsset =
    contentType.includes("text/css") ||
    contentType.startsWith("image/") ||
    contentType.startsWith("font/") ||
    contentType.startsWith("audio/") ||
    contentType.startsWith("video/") ||
    contentType.includes("javascript") ||
    contentType.includes("octet-stream");
  const responseStatus = response.ok || canStreamAsset ? 200 : response.status;

  if (!response.ok && !canStreamAsset) {
    return NextResponse.json({ error: "Asset fetch failed" }, { status: response.status });
  }

  if (contentType?.includes("text/css")) {
    const cssText = rewriteCssFontUrls(await response.text(), normalizedHost, assetPath);
    return new NextResponse(cssText, {
      status: responseStatus,
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  const headers = new Headers();
  if (contentType) {
    headers.set("content-type", contentType);
  }

  // 폰트와 이미지는 장기 캐싱, 나머지는 원본 헤더 사용
  const isFont = /\.(woff2?|ttf|otf|eot|svg)([?#]|$)/i.test(assetPath);
  const isImage = contentType.startsWith("image/");
  if (isFont || isImage) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  } else {
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      headers.set("cache-control", cacheControl);
    }
  }

  return new NextResponse(response.body, {
    status: responseStatus,
    headers,
  });
}
