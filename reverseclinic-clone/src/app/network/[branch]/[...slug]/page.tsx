import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type NetworkBranchCatchAllPageProps = {
  params: Promise<{ branch: MirrorBranch; slug: string[] }>;
};

export async function generateMetadata({ params }: NetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return buildSiteEntryMetadata("ko", branch, slug);
}

export default async function NetworkBranchCatchAllPage({
  params,
}: NetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return renderSiteEntryPage("ko", branch, slug);
}
