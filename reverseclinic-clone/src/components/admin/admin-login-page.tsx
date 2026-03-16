"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img src="/admin-assets/login_logo.png" alt="Reverseclinic admin" className="admin-login-logo" />
          <div className="admin-login-copy">
            <p>Jisoo2_admin 레이아웃 패턴을 Reverseclinic 운영 흐름에 맞게 재구성한 관리자 화면입니다.</p>
            <h1>Reverseclinic 관리자 로그인</h1>
          </div>
        </div>

        <form
          className="admin-login-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setErrorMessage(null);
            setIsPending(true);

            try {
              const response = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({ loginId, password }),
              });
              const data = (await response.json().catch(() => ({}))) as {
                ok?: boolean;
                error?: string;
              };

              if (!response.ok || !data.ok) {
                setErrorMessage(data.error ?? "로그인에 실패했습니다.");
                return;
              }

              router.replace("/admin");
              router.refresh();
            } catch {
              setErrorMessage("관리자 로그인 요청을 처리하지 못했습니다.");
            } finally {
              setIsPending(false);
            }
          }}
        >
          <label>
            <span>아이디</span>
            <input value={loginId} onChange={(event) => setLoginId(event.target.value)} />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {errorMessage ? (
            <p className="admin-form-message admin-form-message--error">{errorMessage}</p>
          ) : null}
          <button type="submit" className="adm-button adm-button--primary" disabled={isPending}>
            {isPending ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
