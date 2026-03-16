import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "./globals.css";
import { TenantRuntimeProvider } from "@/components/tenant-runtime-provider";
import { resolveRequestTenantContext } from "@/lib/tenant-request";
import { getTenantBodyStyle } from "@/lib/tenant-theme";

export async function generateMetadata(): Promise<Metadata> {
  const { tenantConfig, tenantRuntime, unsupportedHost } = await resolveRequestTenantContext();

  if (unsupportedHost) {
    return {
      title: "Unsupported host",
      description: "This host is not mapped to an active tenant.",
    };
  }

  return {
    title: tenantRuntime.localeMarketing[tenantConfig.locale.defaultLocale].homeTitle,
    description: `${tenantConfig.brand.siteTitle} shared multi-site runtime. 메인, BEST, TALK, 장바구니, 회원 기능을 테넌트별로 분리 유지합니다.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { tenantId, unsupportedHost } = await resolveRequestTenantContext();

  // host 매핑이 없는 요청은 기본 tenant를 렌더링하지 않고 404로 차단한다.
  if (unsupportedHost) {
    notFound();
  }

  return (
    <html lang="ko">
      {/* body CSS 변수만 바꿔서 테넌트별 스킨을 공용 레이아웃에 주입한다. */}
      <body data-tenant-id={tenantId} style={getTenantBodyStyle(tenantId)}>
        <TenantRuntimeProvider tenantId={tenantId}>{children}</TenantRuntimeProvider>
      </body>
    </html>
  );
}
