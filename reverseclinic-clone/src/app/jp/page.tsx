import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

export async function generateMetadata() {
  return buildSiteEntryMetadata("jp", "gangnam", []);
}

export default async function JapaneseHomePage() {
  return renderSiteEntryPage("jp", "gangnam", []);
}
