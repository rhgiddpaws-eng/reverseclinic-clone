import { notFound } from "next/navigation";
import {
  listConsultRequests,
  listFeedbackRequests,
  listReservationRequests,
} from "@/lib/reverse-db";
import { requireAdminPageSession } from "@/lib/reverse-admin";

const submissionTitles = {
  consult: "상담 문의",
  reservation: "예약 문의",
  feedback: "칭찬/불만 접수",
} as const;

type SubmissionPageContext = {
  params: Promise<{
    kind: string;
  }>;
};

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

export default async function AdminSubmissionPage(context: SubmissionPageContext) {
  const { kind } = await context.params;
  if (!(kind in submissionTitles)) {
    notFound();
  }

  const { tenantId } = await requireAdminPageSession();
  const items =
    kind === "consult"
      ? listConsultRequests(tenantId)
      : kind === "reservation"
        ? listReservationRequests(tenantId)
        : listFeedbackRequests(tenantId);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-panel-eyebrow">SUBMISSIONS</p>
          <h1>{submissionTitles[kind as keyof typeof submissionTitles]}</h1>
        </div>
      </div>

      <div className="admin-data-table">
        <div className="admin-data-table__head">
          <span>이름</span>
          <span>연락처</span>
          <span>구분</span>
          <span>지점</span>
          <span>내용</span>
          <span>등록일</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="admin-data-table__row admin-data-table__row--wide">
            <span>{item.name}</span>
            <span>{item.phone}</span>
            <span>{item.request_type}</span>
            <span>{item.branch}</span>
            <span>{item.message}</span>
            <span>{formatDate(item.created_at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
