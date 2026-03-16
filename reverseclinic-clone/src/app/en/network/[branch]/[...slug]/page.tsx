import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type EnglishNetworkBranchCatchAllPageProps = {
  params: Promise<{ branch: MirrorBranch; slug: string[] }>;
};

export async function generateMetadata({ params }: EnglishNetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return buildSiteEntryMetadata("en", branch, slug);
}

export default async function EnglishNetworkBranchCatchAllPage({
  params,
}: EnglishNetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return renderSiteEntryPage("en", branch, slug);
}
