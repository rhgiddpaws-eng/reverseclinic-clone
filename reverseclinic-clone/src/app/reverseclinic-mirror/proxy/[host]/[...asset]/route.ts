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

function rewriteXeiconStylesheet(assetPath: string, cssText: string) {
  if (!assetPath.endsWith("_files/6uh_iFf98.css")) {
    return cssText;
  }

  return cssText.replace(
    /@font-face\{font-family:xeicon;src:url\(fonts\/xeicon\.eot[^}]+font-style:normal\}/,
    '@font-face{font-family:xeicon;src:url(/_files/6uh_ARI7v.woff2) format("woff2");font-weight:400;font-style:normal}',
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
    cache: "no-store",
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
    const cssText = rewriteXeiconStylesheet(assetPath, await response.text());
    return new NextResponse(cssText, {
      status: responseStatus,
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": response.headers.get("cache-control") ?? "public, max-age=3600",
      },
    });
  }

  const headers = new Headers();
  const cacheControl = response.headers.get("cache-control");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  }

  return new NextResponse(response.body, {
    status: responseStatus,
    headers,
  });
}
