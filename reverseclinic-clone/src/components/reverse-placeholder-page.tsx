"use client";

import { ReverseClinicShell } from "@/components/reverseclinic-shell";
import type { TenantId } from "@/lib/tenant-types";

type ReversePlaceholderPageProps = {
  slug: string;
  tenantId: TenantId;
};

function formatSlug(slug: string) {
  return slug.replaceAll("--", " / ").replaceAll("_", " ");
}

export function ReversePlaceholderPage({ slug, tenantId }: ReversePlaceholderPageProps) {
  return (
    <ReverseClinicShell locale="ko" tenantId={tenantId}>
      <section className="placeholder-section">
        <div className="placeholder-panel">
          {/* 상세 페이지를 아직 이관하지 않은 경우에도 현재 셸을 유지한다. */}
          <p className="placeholder-eyebrow">PLACEHOLDER PAGE</p>
          <h2>{formatSlug(slug)}</h2>
          <p>
            이 경로는 아직 미러 HTML 또는 전용 앱 페이지가 연결되지 않았습니다. 공용 셸과
            테넌트 상태는 유지한 채 placeholder 화면으로 안전하게 대체합니다.
          </p>
        </div>
      </section>
    </ReverseClinicShell>
  );
}
