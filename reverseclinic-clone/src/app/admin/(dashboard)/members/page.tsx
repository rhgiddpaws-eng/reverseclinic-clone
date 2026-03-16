import { listMembers } from "@/lib/reverse-db";
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

export default async function AdminMembersPage() {
  const { tenantId } = await requireAdminPageSession();
  const members = listMembers(tenantId);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-panel-eyebrow">MEMBERS</p>
          <h1>회원 목록</h1>
        </div>
      </div>

      <div className="admin-data-table">
        <div className="admin-data-table__head">
          <span>이름</span>
          <span>아이디</span>
          <span>연락처</span>
          <span>이메일</span>
          <span>가입일</span>
        </div>
        {members.map((member) => (
          <div key={member.id} className="admin-data-table__row">
            <span>{member.name}</span>
            <span>{member.loginId}</span>
            <span>{member.phone}</span>
            <span>{member.email ?? "-"}</span>
            <span>{formatDate(member.createdAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
