import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

export async function generateMetadata() {
  return buildSiteEntryMetadata("en", "gangnam", []);
}

export default async function EnglishHomePage() {
  return renderSiteEntryPage("en", "gangnam", []);
}
