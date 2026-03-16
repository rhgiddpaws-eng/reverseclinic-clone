import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

export async function generateMetadata() {
  return buildSiteEntryMetadata("ko", "gangnam", []);
}

export default async function Home() {
  return renderSiteEntryPage("ko", "gangnam", []);
}
