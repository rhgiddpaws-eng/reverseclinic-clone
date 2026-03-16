import Link from "next/link";
import {
  listCommunityItems,
  listConsultRequests,
  listFeedbackRequests,
  listMembers,
  listPopupBanners,
  listReservationRequests,
} from "@/lib/reverse-db";
import { requireAdminPageSession } from "@/lib/reverse-admin";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminDashboardPage() {
  const { tenantId } = await requireAdminPageSession();
  const members = listMembers(tenantId);
  const consults = listConsultRequests(tenantId);
  const reservations = listReservationRequests(tenantId);
  const feedbacks = listFeedbackRequests(tenantId);
  const communityItems = listCommunityItems(tenantId);
  const popupBanners = listPopupBanners(tenantId);

  const metrics = [
    { label: "회원", value: members.length, href: "/admin/members" },
    { label: "상담 문의", value: consults.length, href: "/admin/submissions/consult" },
    { label: "예약 문의", value: reservations.length, href: "/admin/submissions/reservation" },
    { label: "칭찬/불만", value: feedbacks.length, href: "/admin/submissions/feedback" },
    { label: "커뮤니티", value: communityItems.length, href: "/admin/community/reviews" },
    { label: "팝업", value: popupBanners.length, href: "/admin/popup" },
  ];

  return (
    <div className="admin-page-stack">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-panel-eyebrow">DASHBOARD</p>
            <h1>운영 요약</h1>
          </div>
        </div>

        <div className="admin-metric-grid">
          {metrics.map((metric) => (
            <Link key={metric.label} href={metric.href} className="admin-metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-panel-eyebrow">RECENT</p>
            <h2>최근 등록 문의</h2>
          </div>
        </div>

        <div className="admin-data-table">
          <div className="admin-data-table__head">
            <span>구분</span>
            <span>이름</span>
            <span>연락처</span>
            <span>등록일</span>
          </div>
          {[...consults.slice(0, 2), ...reservations.slice(0, 2), ...feedbacks.slice(0, 2)].map((item) => (
            <div key={item.id} className="admin-data-table__row">
              <span>{item.request_type}</span>
              <span>{item.name}</span>
              <span>{item.phone}</span>
              <span>{formatDate(item.created_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
