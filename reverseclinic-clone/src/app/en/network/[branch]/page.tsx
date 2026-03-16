import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";
import type { MirrorBranch } from "@/lib/reverseclinic-types";

type EnglishNetworkBranchPageProps = {
  params: Promise<{ branch: MirrorBranch }>;
};

export async function generateMetadata({ params }: EnglishNetworkBranchPageProps) {
  const { branch } = await params;
  return buildSiteEntryMetadata("en", branch, []);
}

export default async function EnglishNetworkBranchPage({
  params,
}: EnglishNetworkBranchPageProps) {
  const { branch } = await params;
  return renderSiteEntryPage("en", branch, []);
}
