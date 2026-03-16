"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTenantRuntime } from "@/components/tenant-runtime-provider";
import { getTenantConfig, getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

function isAuthPathname(pathname: string) {
  return pathname.endsWith("/login") || pathname.endsWith("/join");
}

type ReverseAuthModalProps = {
  locale: MirrorLocale;
  tenantId: TenantId;
};

export function ReverseAuthModal({ locale, tenantId }: ReverseAuthModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { authModal, closeAuthModal, openAuthModal, login, join, session, isAuthPending } =
    useTenantRuntime();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinForm, setJoinForm] = useState({
    loginId: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const tenantConfig = getTenantConfig(tenantId);
  const tenantRuntime = getTenantRuntime(tenantId);
  const { localeMessages, mirrorAssets, mirrorMeta } = tenantRuntime;
  const messages = localeMessages[locale];
  const supportExternal = /^https?:\/\//i.test(mirrorMeta.supportHref);
  const loginPrompt = messages.authLoginPrompt.replace("{siteTitle}", tenantConfig.brand.siteTitle);
  const joinPrompt = messages.authJoinPrompt.replace(
    "{storageName}",
    tenantConfig.storage.databaseFileName,
  );
  const supportNote = messages.authSupportNote.replace("{siteTitle}", mirrorMeta.siteTitle);

  const buildReturnTarget = useCallback(() => {
    const returnTo = authModal.returnTo ?? "/";
    const pendingHash = authModal.pendingHash?.trim() ?? "";

    if (!pendingHash) {
      return returnTo;
    }

    return `${returnTo}${pendingHash.startsWith("#") ? pendingHash : `#${pendingHash}`}`;
  }, [authModal.pendingHash, authModal.returnTo]);

  const dismissModal = useCallback(() => {
    const returnTarget = buildReturnTarget();
    const isRouteDrivenAuth = authModal.routePath === pathname && isAuthPathname(pathname);

    if (isRouteDrivenAuth && returnTarget !== pathname) {
      router.replace(returnTarget, { scroll: false });
      return;
    }

    closeAuthModal();

    if (isAuthPathname(pathname) && returnTarget !== pathname) {
      router.replace(returnTarget, { scroll: false });
    }
  }, [authModal.routePath, buildReturnTarget, closeAuthModal, pathname, router]);

  useEffect(() => {
    if (authModal.mode === null) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [authModal.mode, dismissModal]);

  useEffect(() => {
    setErrorMessage(null);
  }, [authModal.mode]);

  useEffect(() => {
    if (authModal.mode !== null && session.status === "authenticated") {
      dismissModal();
    }
  }, [authModal.mode, dismissModal, session.status]);

  if (authModal.mode === null) {
    return null;
  }

  const isLogin = authModal.mode === "login";

  return (
    <div
      className="reverse-auth-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dismissModal();
        }
      }}
    >
      <div
        className="reverse-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reverse-auth-title"
      >
        <button
          type="button"
          className="reverse-auth-close"
          aria-label={messages.close}
          onClick={dismissModal}
        >
          <img src={mirrorAssets.authCloseIcon} alt="" />
        </button>

        <div className="reverse-auth-panel">
          {authModal.reasonMessage ? (
            <p className="reverse-auth-error">{authModal.reasonMessage}</p>
          ) : null}
          <p className="reverse-auth-copy">
            {isLogin ? loginPrompt : joinPrompt}
          </p>
          <h2 id="reverse-auth-title">{isLogin ? messages.loginTitle : messages.joinTitle}</h2>

          {isLogin ? (
            <form
              className="reverse-auth-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setErrorMessage(null);

                const result = await login({ loginId, password, locale });
                if (!result.ok) {
                  setErrorMessage(result.error ?? messages.authLoginFailed);
                  return;
                }

                setLoginId("");
                setPassword("");
                dismissModal();
              }}
            >
              <label>
                {messages.authLoginIdLabel}
                <input value={loginId} onChange={(event) => setLoginId(event.target.value)} />
              </label>
              <label>
                {messages.authPasswordLabel}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {errorMessage ? <p className="reverse-auth-error">{errorMessage}</p> : null}
              <div className="reverse-auth-actions">
                <button type="submit" className="reverse-primary-button" disabled={isAuthPending}>
                  {isAuthPending ? messages.authProcessing : messages.loginTitle}
                </button>
                <button
                  type="button"
                  className="reverse-secondary-button"
                  disabled={isAuthPending}
                  onClick={() =>
                    openAuthModal("join", {
                      returnTo: authModal.returnTo,
                      routePath: authModal.routePath,
                      reasonMessage: authModal.reasonMessage,
                      pendingHash: authModal.pendingHash,
                      pendingContentId: authModal.pendingContentId,
                    })
                  }
                >
                  {messages.joinTitle}
                </button>
              </div>
            </form>
          ) : (
            <form
              className="reverse-auth-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setErrorMessage(null);

                const result = await join({ ...joinForm, locale });
                if (!result.ok) {
                  setErrorMessage(result.error ?? messages.authJoinFailed);
                  return;
                }

                setJoinForm({
                  loginId: "",
                  name: "",
                  phone: "",
                  email: "",
                  password: "",
                });
                dismissModal();
              }}
            >
              <label>
                {messages.authLoginIdLabel}
                <input
                  value={joinForm.loginId}
                  onChange={(event) =>
                    setJoinForm((current) => ({ ...current, loginId: event.target.value }))
                  }
                />
              </label>
              <label>
                {messages.authNameLabel}
                <input
                  value={joinForm.name}
                  onChange={(event) =>
                    setJoinForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label>
                {messages.authPhoneLabel}
                <input
                  value={joinForm.phone}
                  onChange={(event) =>
                    setJoinForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label>
                {messages.authEmailLabel}
                <input
                  type="email"
                  value={joinForm.email}
                  onChange={(event) =>
                    setJoinForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label>
                {messages.authPasswordLabel}
                <input
                  type="password"
                  value={joinForm.password}
                  onChange={(event) =>
                    setJoinForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              {errorMessage ? <p className="reverse-auth-error">{errorMessage}</p> : null}
              <div className="reverse-auth-actions">
                <button type="submit" className="reverse-primary-button" disabled={isAuthPending}>
                  {isAuthPending ? messages.authProcessing : messages.joinTitle}
                </button>
                <button
                  type="button"
                  className="reverse-secondary-button"
                  disabled={isAuthPending}
                  onClick={() =>
                    openAuthModal("login", {
                      returnTo: authModal.returnTo,
                      routePath: authModal.routePath,
                      reasonMessage: authModal.reasonMessage,
                      pendingHash: authModal.pendingHash,
                      pendingContentId: authModal.pendingContentId,
                    })
                  }
                >
                  {messages.loginTitle}
                </button>
              </div>
            </form>
          )}

          {session.status === "authenticated" && session.user ? (
            <p className="reverse-auth-note">
              {messages.authLoggedInAs}: {session.user.name}
            </p>
          ) : null}

          <div className="reverse-auth-extra">
            <a
              href={mirrorMeta.supportHref}
              target={supportExternal ? "_blank" : undefined}
              rel={supportExternal ? "noreferrer" : undefined}
            >
              <img src={mirrorAssets.authSupportBanner} alt={`${mirrorMeta.siteTitle} support`} />
            </a>
            <div className="reverse-auth-social">
              <img src={mirrorAssets.footerKakao} alt="" />
              <span>{supportNote}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
