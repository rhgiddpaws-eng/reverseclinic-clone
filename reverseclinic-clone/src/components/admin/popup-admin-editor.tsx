"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { PopupBanner } from "@/lib/reverseclinic-types";

type PopupDraft = {
  id?: string;
  title: string;
  alt: string;
  href: string;
  imageSrc: string;
  mobileImageSrc: string;
  enabled: boolean;
  order: number;
};

function createPopupDraft(): PopupDraft {
  return {
    title: "",
    alt: "",
    href: "#",
    imageSrc: "",
    mobileImageSrc: "",
    enabled: true,
    order: 0,
  };
}

function popupToDraft(banner: PopupBanner): PopupDraft {
  return {
    id: banner.id,
    title: banner.title,
    alt: banner.alt,
    href: banner.href,
    imageSrc: banner.imageSrc,
    mobileImageSrc: banner.mobileImageSrc ?? "",
    enabled: banner.enabled,
    order: banner.order,
  };
}

async function uploadPopupImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "popup");

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    url?: string;
  };

  if (!response.ok || !data.ok || !data.url) {
    throw new Error(data.error ?? "팝업 이미지를 업로드하지 못했습니다.");
  }

  return data.url;
}

type PopupAdminEditorProps = {
  initialBanners: PopupBanner[];
};

export function PopupAdminEditor({ initialBanners }: PopupAdminEditorProps) {
  const [banners, setBanners] = useState(
    [...initialBanners].sort((left, right) => left.order - right.order),
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialBanners[0]?.id ?? null);
  const [draft, setDraft] = useState<PopupDraft>(
    initialBanners[0] ? popupToDraft(initialBanners[0]) : createPopupDraft(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isSaving, setIsSaving] = useState(false);

  const selectedBanner = banners.find((banner) => banner.id === selectedId) ?? null;

  const applyMessage = (tone: "success" | "error", nextMessage: string) => {
    setMessageTone(tone);
    setMessage(nextMessage);
  };

  return (
    <div className="admin-editor-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-panel-eyebrow">POPUP</p>
            <h1>메인 광고 팝업 관리</h1>
          </div>
          <button
            type="button"
            className="adm-button adm-button--primary"
            onClick={() => {
              setSelectedId(null);
              setDraft(createPopupDraft());
              setMessage(null);
            }}
          >
            새 팝업
          </button>
        </div>

        <div className="admin-list-card">
          {banners.map((banner) => (
            <button
              key={banner.id}
              type="button"
              className={`admin-list-row${selectedId === banner.id ? " is-active" : ""}`}
              onClick={() => {
                setSelectedId(banner.id);
                setDraft(popupToDraft(banner));
                setMessage(null);
              }}
            >
              <div className="admin-list-row__body">
                <strong>{banner.title}</strong>
                <p>{banner.href}</p>
              </div>
              <span>{banner.enabled ? "노출" : "숨김"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-panel-eyebrow">EDITOR</p>
            <h2>{selectedBanner ? "팝업 수정" : "신규 팝업"}</h2>
          </div>
          {selectedBanner ? (
            <button
              type="button"
              className="adm-button adm-button--danger"
              onClick={async () => {
                if (!selectedBanner || !window.confirm("이 팝업을 삭제하시겠습니까?")) {
                  return;
                }

                const response = await fetch(`/api/admin/popup/${selectedBanner.id}`, {
                  method: "DELETE",
                  credentials: "same-origin",
                });

                if (!response.ok) {
                  applyMessage("error", "팝업을 삭제하지 못했습니다.");
                  return;
                }

                const nextBanners = banners.filter((banner) => banner.id !== selectedBanner.id);
                setBanners(nextBanners);
                setSelectedId(nextBanners[0]?.id ?? null);
                setDraft(nextBanners[0] ? popupToDraft(nextBanners[0]) : createPopupDraft());
                applyMessage("success", "팝업을 삭제했습니다.");
              }}
            >
              삭제
            </button>
          ) : null}
        </div>

        <div className="input-table">
          <div className="input-table-row">
            <div className="input-table-row-th">제목</div>
            <div className="input-table-row-td">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
          </div>
          <div className="input-table-row">
            <div className="input-table-row-th">링크</div>
            <div className="input-table-row-td">
              <input
                value={draft.href}
                onChange={(event) => setDraft((current) => ({ ...current, href: event.target.value }))}
              />
            </div>
          </div>
          <div className="input-table-row">
            <div className="input-table-row-th">정렬 순서</div>
            <div className="input-table-row-td">
              <input
                type="number"
                value={draft.order}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, order: Number(event.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <div className="input-table-row">
            <div className="input-table-row-th">노출 여부</div>
            <div className="input-table-row-td">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, enabled: event.target.checked }))
                  }
                />
                <span>활성화</span>
              </label>
            </div>
          </div>
          <div className="input-table-row flexible">
            <div className="input-table-row-th">데스크톱 이미지</div>
            <div className="input-table-row-td column">
              {draft.imageSrc ? <img src={draft.imageSrc} alt={draft.alt} className="admin-upload-preview" /> : null}
              <div className="admin-upload-row">
                <input
                  value={draft.imageSrc}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, imageSrc: event.target.value }))
                  }
                />
                <label className="adm-button adm-button--ghost">
                  업로드
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      try {
                        const url = await uploadPopupImage(file);
                        setDraft((current) => ({ ...current, imageSrc: url }));
                        applyMessage("success", "데스크톱 이미지를 업로드했습니다.");
                      } catch (error) {
                        const uploadMessage =
                          error instanceof Error ? error.message : "데스크톱 이미지를 업로드하지 못했습니다.";
                        applyMessage("error", uploadMessage);
                      } finally {
                        event.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="input-table-row flexible">
            <div className="input-table-row-th">모바일 이미지</div>
            <div className="input-table-row-td column">
              {draft.mobileImageSrc ? (
                <img src={draft.mobileImageSrc} alt={draft.alt} className="admin-upload-preview" />
              ) : null}
              <div className="admin-upload-row">
                <input
                  value={draft.mobileImageSrc}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, mobileImageSrc: event.target.value }))
                  }
                />
                <label className="adm-button adm-button--ghost">
                  업로드
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      try {
                        const url = await uploadPopupImage(file);
                        setDraft((current) => ({ ...current, mobileImageSrc: url }));
                        applyMessage("success", "모바일 이미지를 업로드했습니다.");
                      } catch (error) {
                        const uploadMessage =
                          error instanceof Error ? error.message : "모바일 이미지를 업로드하지 못했습니다.";
                        applyMessage("error", uploadMessage);
                      } finally {
                        event.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="input-table-row">
            <div className="input-table-row-th">대체 텍스트</div>
            <div className="input-table-row-td">
              <input
                value={draft.alt}
                onChange={(event) => setDraft((current) => ({ ...current, alt: event.target.value }))}
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
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              setMessage(null);

              try {
                const endpoint = selectedBanner ? `/api/admin/popup/${selectedBanner.id}` : "/api/admin/popup";
                const response = await fetch(endpoint, {
                  method: selectedBanner ? "PATCH" : "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "same-origin",
                  body: JSON.stringify({
                    ...draft,
                    mobileImageSrc: draft.mobileImageSrc || null,
                  }),
                });
                const data = (await response.json().catch(() => ({}))) as {
                  ok?: boolean;
                  error?: string;
                  banner?: PopupBanner;
                };

                if (!response.ok || !data.ok || !data.banner) {
                  applyMessage("error", data.error ?? "팝업을 저장하지 못했습니다.");
                  return;
                }

                const nextBanners = [...banners.filter((banner) => banner.id !== data.banner!.id), data.banner].sort(
                  (left, right) => left.order - right.order,
                );
                setBanners(nextBanners);
                setSelectedId(data.banner.id);
                setDraft(popupToDraft(data.banner));
                applyMessage("success", "팝업을 저장했습니다.");
              } catch {
                applyMessage("error", "팝업 저장 중 오류가 발생했습니다.");
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </section>
    </div>
  );
}
