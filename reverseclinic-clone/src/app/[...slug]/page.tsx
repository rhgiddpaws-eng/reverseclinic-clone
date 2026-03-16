import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

type CatchAllPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: CatchAllPageProps) {
  const { slug } = await params;
  return buildSiteEntryMetadata("ko", "gangnam", slug);
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  return renderSiteEntryPage("ko", "gangnam", slug);
}
