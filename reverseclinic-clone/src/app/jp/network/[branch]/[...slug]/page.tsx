import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type JapaneseNetworkBranchCatchAllPageProps = {
  params: Promise<{ branch: MirrorBranch; slug: string[] }>;
};

export async function generateMetadata({ params }: JapaneseNetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return buildSiteEntryMetadata("jp", branch, slug);
}

export default async function JapaneseNetworkBranchCatchAllPage({
  params,
}: JapaneseNetworkBranchCatchAllPageProps) {
  const { branch, slug } = await params;
  return renderSiteEntryPage("jp", branch, slug);
}
