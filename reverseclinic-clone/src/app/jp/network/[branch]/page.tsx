import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type JapaneseNetworkBranchPageProps = {
  params: Promise<{ branch: MirrorBranch }>;
};

export async function generateMetadata({ params }: JapaneseNetworkBranchPageProps) {
  const { branch } = await params;
  return buildSiteEntryMetadata("jp", branch, []);
}

export default async function JapaneseNetworkBranchPage({
  params,
}: JapaneseNetworkBranchPageProps) {
  const { branch } = await params;
  return renderSiteEntryPage("jp", branch, []);
}
