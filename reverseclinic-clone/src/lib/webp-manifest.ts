import "server-only";

import webpManifest from "@/generated/webp-manifest.json";

const manifest = webpManifest as Record<string, string>;

/**
 * 이미지 경로에 대응하는 WebP 경로를 반환한다.
 * 매니페스트에 없으면 원본 경로를 그대로 반환한다.
 *
 * 쿼리 스트링은 무시하고 경로만 비교한다.
 */
export function resolveToWebp(href: string): string {
  const qIdx = href.indexOf("?");
  const cleanHref = qIdx >= 0 ? href.slice(0, qIdx) : href;
  return manifest[cleanHref] ?? href;
}
