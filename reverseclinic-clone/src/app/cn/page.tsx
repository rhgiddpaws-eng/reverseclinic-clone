import { buildSiteEntryMetadata, renderSiteEntryPage } from "@/lib/reverse-site-entry";

export async function generateMetadata() {
  return buildSiteEntryMetadata("cn", "gangnam", []);
}

export default async function ChineseHomePage() {
  return renderSiteEntryPage("cn", "gangnam", []);
}
