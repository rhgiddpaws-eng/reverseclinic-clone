import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveToWebp } from "@/lib/webp-manifest";
import {
  getReverseClinicSite,
  resolveReverseClinicSiteFromPathname,
} from "@/tenants/reverseclinic/site-registry";

export const dynamic = "force-dynamic";

type FilesRouteContext = {
  params: Promise<{
    asset: string[];
  }>;
};

function resolveSiteHostFromReferer(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) {
    return getReverseClinicSite("gn-ko").host;
  }

  try {
    const refererUrl = new URL(referer);
    const siteId = resolveReverseClinicSiteFromPathname(refererUrl.pathname);
    return getReverseClinicSite(siteId).host;
  } catch {
    return getReverseClinicSite("gn-ko").host;
  }
}

export async function GET(request: NextRequest, context: FilesRouteContext) {
  const { asset } = await context.params;
  if (asset.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const host = resolveSiteHostFromReferer(request);
  const normalizedHost = host.replace(/^www\./, "").toLowerCase();
  const assetPath = asset.join("/");

  // 로컬 site 경로로 리디렉트하고 WebP가 있으면 WebP로 치환
  const localHref = `/reverseclinic-mirror/site/${normalizedHost}/_files/${assetPath}`;
  const resolvedHref = resolveToWebp(localHref);
  const localUrl = new URL(resolvedHref, request.url);
  localUrl.search = request.nextUrl.search;
  return NextResponse.redirect(localUrl);
}
