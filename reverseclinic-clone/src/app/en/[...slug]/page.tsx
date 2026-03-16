import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

type EnglishCatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: EnglishCatchAllPageProps) {
  const { slug } = await params;
  return buildSiteEntryMetadata("en", "gangnam", slug);
}

export default async function EnglishCatchAllPage({ params }: EnglishCatchAllPageProps) {
  const { slug } = await params;
  return renderSiteEntryPage("en", "gangnam", slug);
}
