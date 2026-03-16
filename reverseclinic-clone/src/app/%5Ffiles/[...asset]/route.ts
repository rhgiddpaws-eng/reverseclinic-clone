import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildReverseClinicAssetProxyHref } from "@/lib/reverse-asset-proxy";
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
  const proxyHref = buildReverseClinicAssetProxyHref(host, `/_files/${asset.join("/")}`);
  const proxyUrl = new URL(proxyHref, request.url);
  proxyUrl.search = request.nextUrl.search;
  return NextResponse.redirect(proxyUrl);
}
