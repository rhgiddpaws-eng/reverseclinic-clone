"use client";

import { useState } from "react";
import type { AdminSessionUser } from "@/lib/reverseclinic-types";

type AdminAccountSettingsProps = {
  currentUser: AdminSessionUser;
};

export function AdminAccountSettings({ currentUser }: AdminAccountSettingsProps) {
  const [name, setName] = useState(currentUser.name);
  const [loginId, setLoginId] = useState(currentUser.loginId);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isPending, setIsPending] = useState(false);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-panel-eyebrow">SETTINGS</p>
          <h1>관리자 계정</h1>
        </div>
      </div>

      <div className="input-table">
        <div className="input-table-row">
          <div className="input-table-row-th">이름</div>
          <div className="input-table-row-td">
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
        </div>
        <div className="input-table-row">
          <div className="input-table-row-th">로그인 아이디</div>
          <div className="input-table-row-td">
            <input value={loginId} onChange={(event) => setLoginId(event.target.value)} />
          </div>
        </div>
        <div className="input-table-row">
          <div className="input-table-row-th">비밀번호 변경</div>
          <div className="input-table-row-td">
            <input
              type="password"
              placeholder="변경할 때만 입력"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>
      </div>

      {message ? (
        <p className={`admin-form-message admin-form-message--${messageTone}`}>{message}</p>
      ) : null}

      <div className="admin-submit-row">
        <button
          type="button"
          className="adm-button adm-button--primary"
          disabled={isPending}
          onClick={async () => {
            setIsPending(true);
            setMessage(null);

            try {
              const response = await fetch("/api/admin/settings/admin", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({
                  userId: currentUser.id,
                  name,
                  loginId,
                  password: password || undefined,
                }),
              });
              const data = (await response.json().catch(() => ({}))) as {
                ok?: boolean;
                error?: string;
              };

              if (!response.ok || !data.ok) {
                setMessageTone("error");
                setMessage(data.error ?? "관리자 계정을 저장하지 못했습니다.");
                return;
              }

              setPassword("");
              setMessageTone("success");
              setMessage("관리자 계정을 저장했습니다. 다시 로그인하면 변경된 아이디가 반영됩니다.");
            } catch {
              setMessageTone("error");
              setMessage("관리자 계정 저장 중 오류가 발생했습니다.");
            } finally {
              setIsPending(false);
            }
          }}
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </section>
  );
}
