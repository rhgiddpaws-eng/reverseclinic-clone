import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

type ChineseCatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: ChineseCatchAllPageProps) {
  const { slug } = await params;
  return buildSiteEntryMetadata("cn", "gangnam", slug);
}

export default async function ChineseCatchAllPage({ params }: ChineseCatchAllPageProps) {
  const { slug } = await params;
  return renderSiteEntryPage("cn", "gangnam", slug);
}
