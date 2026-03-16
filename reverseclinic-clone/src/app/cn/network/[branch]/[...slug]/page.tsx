import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type ChineseNetworkBranchCatchAllPageProps = {
  params: Promise<{ branch: MirrorBranch; slug: string[] }>;
};

export async function generateMetadata({ params }: ChineseNetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return buildSiteEntryMetadata("cn", branch, slug);
}

export default async function ChineseNetworkBranchCatchAllPage({
  params,
}: ChineseNetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return renderSiteEntryPage("cn", branch, slug);
}
