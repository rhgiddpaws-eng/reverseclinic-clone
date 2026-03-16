import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type ChineseNetworkBranchPageProps = {
  params: Promise<{ branch: MirrorBranch }>;
};

export async function generateMetadata({ params }: ChineseNetworkBranchPageProps) {
  const { branch } = await params;
  return buildSiteEntryMetadata("cn", branch, []);
}

export default async function ChineseNetworkBranchPage({
  params,
}: ChineseNetworkBranchPageProps) {
  const { branch } = await params;
  return renderSiteEntryPage("cn", branch, []);
}
