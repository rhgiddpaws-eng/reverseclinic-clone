import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorLocale, MirrorBranch } from "@/lib/reverseclinic-types";

const LOCALES = new Set<string>(["en", "jp", "cn"]);
const BRANCHES = new Set<string>([
  "gangnam", "hongdae", "myeongdong", "incheon-guwol",
  "suwon", "nowon", "ilsan", "bundang",
]);

function parseSegments(segments: string[]): {
  locale: MirrorLocale;
  branch: MirrorBranch;
  slug: string[];
} {
  let locale: MirrorLocale = "ko";
  let branch: MirrorBranch = "gangnam";
  let rest = segments;

  // Check for locale prefix: /en/..., /jp/..., /cn/...
  if (rest.length > 0 && LOCALES.has(rest[0])) {
    locale = rest[0] as MirrorLocale;
    rest = rest.slice(1);
  }

  // Check for network prefix: .../network/<branch>/...
  if (rest.length >= 2 && rest[0] === "network" && BRANCHES.has(rest[1])) {
    branch = rest[1] as MirrorBranch;
    rest = rest.slice(2);
  }

  return { locale, branch, slug: rest };
}

type CatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: CatchAllPageProps) {
  const { slug: segments } = await params;
  const { locale, branch, slug } = parseSegments(segments);
  return buildSiteEntryMetadata(locale, branch, slug);
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug: segments } = await params;
  const { locale, branch, slug } = parseSegments(segments);
  return renderSiteEntryPage(locale, branch, slug);
}
