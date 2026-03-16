import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type NetworkBranchPageProps = {
  params: Promise<{ branch: MirrorBranch }>;
};

export async function generateMetadata({ params }: NetworkBranchPageProps) {
  const { branch } = await params;
  return buildSiteEntryMetadata("ko", branch, []);
}

export default async function NetworkBranchPage({ params }: NetworkBranchPageProps) {
  const { branch } = await params;
  return renderSiteEntryPage("ko", branch, []);
}
