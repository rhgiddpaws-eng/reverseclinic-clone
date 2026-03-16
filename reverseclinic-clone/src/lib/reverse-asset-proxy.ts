export function buildReverseClinicAssetProxyHref(
  host: string,
  assetPath: string,
  search = "",
) {
  const normalizedHost = host.replace(/^www\./, "").toLowerCase();
  const normalizedAssetPath = assetPath.replace(/^\/+/, "");
  return `/reverseclinic-mirror/proxy/${normalizedHost}/${normalizedAssetPath}${search}`;
}
