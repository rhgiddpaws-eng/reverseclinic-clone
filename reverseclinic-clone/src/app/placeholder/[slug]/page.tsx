import type { Metadata } from "next";
import { ReversePlaceholderPage } from "@/components/reverse-placeholder-page";
import { resolveRequestTenantContext } from "@/lib/tenant-request";

type PlaceholderPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PlaceholderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tenantConfig } = await resolveRequestTenantContext();
  const decodedSlug = decodeURIComponent(slug).replaceAll("--", " / ").replaceAll("_", " ");

  return {
    title: `${decodedSlug} | ${tenantConfig.brand.siteTitle}`,
    description: `${tenantConfig.brand.siteTitle} 상세 페이지 placeholder입니다. 공용 셸과 자산 구조를 유지한 채 안전하게 대체합니다.`,
  };
}

export default async function PlaceholderPage({ params }: PlaceholderPageProps) {
  const { slug } = await params;
  const { tenantId } = await resolveRequestTenantContext();

  // Vercel 환경에서는 런타임에 public/ 파일 존재 여부를 fs.access로 확인할 수 없으므로
  // 항상 placeholder 컴포넌트를 렌더링한다.
  return <ReversePlaceholderPage slug={decodeURIComponent(slug)} tenantId={tenantId} />;
}
