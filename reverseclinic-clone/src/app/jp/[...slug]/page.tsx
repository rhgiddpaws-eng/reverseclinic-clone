import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

type JapaneseCatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: JapaneseCatchAllPageProps) {
  const { slug } = await params;
  return buildSiteEntryMetadata("jp", "gangnam", slug);
}

export default async function JapaneseCatchAllPage({ params }: JapaneseCatchAllPageProps) {
  const { slug } = await params;
  return renderSiteEntryPage("jp", "gangnam", slug);
}
