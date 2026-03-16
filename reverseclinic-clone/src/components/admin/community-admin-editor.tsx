"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import {
  getCommunityCategoryOptions,
  reverseCommunityBoardMeta,
} from "@/lib/reverse-community";
import type {
  BeforeAfterImageAsset,
  CommunityBoardType,
  CommunityItem,
} from "@/lib/reverseclinic-types";

type EditableCommunityBlock = {
  id: string;
  type: "text" | "image" | "gallery";
  heading: string;
  body: string;
  image: BeforeAfterImageAsset;
  images: BeforeAfterImageAsset[];
};

type CommunityDraft = {
  id?: string;
  title: string;
  summary: string;
  author: string;
  publishedAt: string;
  tags: string;
  isPinned: boolean;
  displayNumber: string;
  viewCount: string;
  category: string;
  requiresLogin: boolean;
  coverImage: BeforeAfterImageAsset | null;
  blocks: EditableCommunityBlock[];
};

function createImageAsset(): BeforeAfterImageAsset {
  return {
    src: "",
    alt: "",
    caption: "",
  };
}

function createBlock(type: EditableCommunityBlock["type"]): EditableCommunityBlock {
  return {
    id: crypto.randomUUID(),
    type,
    heading: "",
    body: "",
    image: createImageAsset(),
    images: [createImageAsset(), createImageAsset()],
  };
}

function createDraft(defaultAuthor = "리버스클리닉"): CommunityDraft {
  return {
    title: "",
    summary: "",
    author: defaultAuthor,
    publishedAt: new Date().toISOString().slice(0, 10),
    tags: "",
    isPinned: false,
    displayNumber: "",
    viewCount: "0",
    category: "",
    requiresLogin: true,
    coverImage: null,
    blocks: [createBlock("text")],
  };
}

function sortItems(items: CommunityItem[]) {
  return [...items].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    if (left.displayNumber !== null && right.displayNumber !== null) {
      return right.displayNumber - left.displayNumber;
    }

    return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  });
}

function itemToDraft(item: CommunityItem): CommunityDraft {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    author: item.author,
    publishedAt: item.publishedAt.slice(0, 10),
    tags: item.tags.join(", "),
    isPinned: item.isPinned,
    displayNumber: item.displayNumber === null ? "" : String(item.displayNumber),
    viewCount: String(item.viewCount),
    category: item.category ?? "",
    requiresLogin: item.requiresLogin,
    coverImage: item.coverImage,
    blocks: item.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      heading: block.heading ?? "",
      body: block.type === "text" ? block.body : block.body ?? "",
      image: block.type === "image" ? block.image : createImageAsset(),
      images: block.type === "gallery" ? block.images : [createImageAsset(), createImageAsset()],
    })),
  };
}

function draftToPayload(boardType: CommunityBoardType, draft: CommunityDraft) {
  const parsedDisplayNumber = draft.displayNumber.trim()
    ? Number(draft.displayNumber)
    : null;
  const parsedViewCount = Number(draft.viewCount) || 0;

  return {
    id: draft.id,
    boardType,
    title: draft.title,
    summary: draft.summary,
    author: draft.author,
    publishedAt: new Date(`${draft.publishedAt}T09:00:00+09:00`).toISOString(),
    tags: draft.tags
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    isPinned: draft.isPinned,
    displayNumber: Number.isFinite(parsedDisplayNumber) ? parsedDisplayNumber : null,
    viewCount: parsedViewCount,
    category: draft.category.trim() || null,
    requiresLogin: draft.requiresLogin,
    coverImage: draft.coverImage?.src ? draft.coverImage : null,
    blocks: draft.blocks
      .map((block) => {
        if (block.type === "text") {
          return {
            id: block.id,
            type: "text" as const,
            heading: block.heading || undefined,
            body: block.body,
          };
        }

        if (block.type === "image") {
          return {
            id: block.id,
            type: "image" as const,
            heading: block.heading || undefined,
            body: block.body || undefined,
            image: block.image,
          };
        }

        return {
          id: block.id,
          type: "gallery" as const,
          heading: block.heading || undefined,
          body: block.body || undefined,
          images: block.images.filter((image) => image.src),
        };
      })
      .filter((block) => {
        if (block.type === "text") {
          return Boolean(block.body.trim());
        }

        if (block.type === "image") {
          return Boolean(block.image.src);
        }

        return block.images.length > 0;
      }),
  };
}

async function uploadFile(file: File, folder: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

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
    throw new Error(data.error ?? "업로드에 실패했습니다.");
  }

  return data.url;
}

type CommunityAdminEditorProps = {
  boardType: CommunityBoardType;
  initialItems: CommunityItem[];
};

export function CommunityAdminEditor({
  boardType,
  initialItems,
}: CommunityAdminEditorProps) {
  const meta = reverseCommunityBoardMeta[boardType];
  const categoryOptions = getCommunityCategoryOptions(boardType);
  const [items, setItems] = useState(() => sortItems(initialItems));
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null);
  const [draft, setDraft] = useState<CommunityDraft>(() =>
    initialItems[0] ? itemToDraft(initialItems[0]) : createDraft(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [isSaving, setIsSaving] = useState(false);
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const resetToNew = () => {
    setSelectedId(null);
    setDraft(createDraft(draft.author || "리버스클리닉"));
    setMessage(null);
  };

  const applyMessage = (tone: "success" | "error", nextMessage: string) => {
    setMessageTone(tone);
    setMessage(nextMessage);
  };

  const patchDraftBlock = (
    blockId: string,
    updater: (block: EditableCommunityBlock) => EditableCommunityBlock,
  ) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((entry) => (entry.id === blockId ? updater(entry) : entry)),
    }));
  };

  return (
    <div className="admin-editor-grid">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-panel-eyebrow">COMMUNITY</p>
            <h1>{meta.title} 관리</h1>
          </div>
          <button type="button" className="adm-button adm-button--primary" onClick={resetToNew}>
            새 항목
          </button>
        </div>

        <div className="admin-list-card">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-list-row${selectedId === item.id ? " is-active" : ""}`}
              onClick={() => {
                setSelectedId(item.id);
                setDraft(itemToDraft(item));
                setMessage(null);
              }}
            >
              <div className="admin-list-row__body">
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <small>
                  {item.isPinned ? "공지" : `번호 ${item.displayNumber ?? "-"}`}
                  {" · "}
                  조회수 {item.viewCount}
                  {item.category ? ` · ${item.category}` : ""}
                </small>
              </div>
              <span>{item.publishedAt.slice(0, 10)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-panel-eyebrow">EDITOR</p>
            <h2>{selectedItem ? "항목 수정" : "신규 등록"}</h2>
          </div>
          {selectedItem ? (
            <button
              type="button"
              className="adm-button adm-button--danger"
              onClick={async () => {
                if (!selectedItem || !window.confirm("선택한 항목을 삭제하시겠습니까?")) {
                  return;
                }

                const response = await fetch(`/api/admin/community/${boardType}/${selectedItem.id}`, {
                  method: "DELETE",
                  credentials: "same-origin",
                });

                if (!response.ok) {
                  applyMessage("error", "항목을 삭제하지 못했습니다.");
                  return;
                }

                const nextItems = items.filter((item) => item.id !== selectedItem.id);
                setItems(nextItems);
                setSelectedId(nextItems[0]?.id ?? null);
                setDraft(nextItems[0] ? itemToDraft(nextItems[0]) : createDraft());
                applyMessage("success", "항목을 삭제했습니다.");
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
          <div className="input-table-row flexible">
            <div className="input-table-row-th">요약</div>
            <div className="input-table-row-td">
              <textarea
                value={draft.summary}
                rows={3}
                onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
              />
            </div>
          </div>
          <div className="input-table-row" data-grid="2">
            <div className="input-table-row-th">작성자</div>
            <div className="input-table-row-td">
              <input
                value={draft.author}
                onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))}
              />
            </div>
          </div>
          <div className="input-table-row" data-grid="2">
            <div className="input-table-row-th">게시일</div>
            <div className="input-table-row-td">
              <input
                type="date"
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, publishedAt: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="input-table-row" data-grid="3">
            <div className="input-table-row-th">고정 공지</div>
            <div className="input-table-row-td">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={draft.isPinned}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      isPinned: event.target.checked,
                      displayNumber: event.target.checked ? "" : current.displayNumber,
                    }))
                  }
                />
                <span>상단 공지로 노출</span>
              </label>
            </div>
          </div>
          <div className="input-table-row" data-grid="3">
            <div className="input-table-row-th">번호</div>
            <div className="input-table-row-td">
              <input
                value={draft.displayNumber}
                placeholder={draft.isPinned ? "고정 공지는 번호 없음" : "예: 874"}
                disabled={draft.isPinned}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, displayNumber: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="input-table-row" data-grid="3">
            <div className="input-table-row-th">조회수</div>
            <div className="input-table-row-td">
              <input
                value={draft.viewCount}
                onChange={(event) => setDraft((current) => ({ ...current, viewCount: event.target.value }))}
              />
            </div>
          </div>
          {categoryOptions.length > 0 ? (
            <div className="input-table-row">
              <div className="input-table-row-th">카테고리</div>
              <div className="input-table-row-td">
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  <option value="">카테고리 선택</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          <div className="input-table-row flexible">
            <div className="input-table-row-th">태그</div>
            <div className="input-table-row-td">
              <input
                value={draft.tags}
                placeholder="쉼표로 구분"
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              />
            </div>
          </div>
          <div className="input-table-row">
            <div className="input-table-row-th">로그인 필요</div>
            <div className="input-table-row-td">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={draft.requiresLogin}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, requiresLogin: event.target.checked }))
                  }
                />
                <span>상세 열람 시 로그인 요구</span>
              </label>
            </div>
          </div>
          <div className="input-table-row flexible">
            <div className="input-table-row-th">커버 이미지</div>
            <div className="input-table-row-td column">
              {draft.coverImage?.src ? (
                <img
                  src={draft.coverImage.src}
                  alt={draft.coverImage.alt || draft.title}
                  className="admin-upload-preview"
                />
              ) : null}
              <div className="admin-upload-row">
                <input
                  value={draft.coverImage?.src ?? ""}
                  placeholder="이미지 URL"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      coverImage: {
                        ...(current.coverImage ?? createImageAsset()),
                        src: event.target.value,
                      },
                    }))
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
                        const url = await uploadFile(file, `community/${boardType}`);
                        setDraft((current) => ({
                          ...current,
                          coverImage: {
                            ...(current.coverImage ?? createImageAsset()),
                            src: url,
                            alt: current.coverImage?.alt || current.title || meta.title,
                            caption: current.coverImage?.caption,
                          },
                        }));
                        applyMessage("success", "커버 이미지를 업로드했습니다.");
                      } catch (error) {
                        applyMessage(
                          "error",
                          error instanceof Error ? error.message : "커버 이미지를 업로드하지 못했습니다.",
                        );
                      } finally {
                        event.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
              <input
                value={draft.coverImage?.alt ?? ""}
                placeholder="대체 텍스트"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    coverImage: {
                      ...(current.coverImage ?? createImageAsset()),
                      src: current.coverImage?.src ?? "",
                      alt: event.target.value,
                      caption: current.coverImage?.caption,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="admin-block-editor">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-panel-eyebrow">DETAIL BLOCKS</p>
              <h2>상세 블록</h2>
            </div>
            <div className="admin-action-group">
              <button
                type="button"
                className="adm-button adm-button--ghost"
                onClick={() =>
                  setDraft((current) => ({ ...current, blocks: [...current.blocks, createBlock("text")] }))
                }
              >
                텍스트
              </button>
              <button
                type="button"
                className="adm-button adm-button--ghost"
                onClick={() =>
                  setDraft((current) => ({ ...current, blocks: [...current.blocks, createBlock("image")] }))
                }
              >
                이미지
              </button>
              <button
                type="button"
                className="adm-button adm-button--ghost"
                onClick={() =>
                  setDraft((current) => ({ ...current, blocks: [...current.blocks, createBlock("gallery")] }))
                }
              >
                갤러리
              </button>
            </div>
          </div>

          {draft.blocks.map((block, blockIndex) => (
            <div key={block.id} className="admin-block-card">
              <div className="admin-block-card__top">
                <strong>
                  블록 {blockIndex + 1} · {block.type}
                </strong>
                <button
                  type="button"
                  className="adm-button adm-button--ghost"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      blocks: current.blocks.filter((entry) => entry.id !== block.id),
                    }))
                  }
                >
                  제거
                </button>
              </div>

              <div className="admin-block-fields">
                <select
                  value={block.type}
                  onChange={(event) =>
                    patchDraftBlock(block.id, () =>
                      createBlock(event.target.value as EditableCommunityBlock["type"]),
                    )
                  }
                >
                  <option value="text">text</option>
                  <option value="image">image</option>
                  <option value="gallery">gallery</option>
                </select>
                <input
                  value={block.heading}
                  placeholder="블록 제목"
                  onChange={(event) =>
                    patchDraftBlock(block.id, (entry) => ({ ...entry, heading: event.target.value }))
                  }
                />
                <textarea
                  rows={4}
                  value={block.body}
                  placeholder="본문 또는 캡션"
                  onChange={(event) =>
                    patchDraftBlock(block.id, (entry) => ({ ...entry, body: event.target.value }))
                  }
                />
              </div>

              {block.type === "image" ? (
                <div className="admin-upload-stack">
                  <div className="admin-upload-row">
                    <input
                      value={block.image.src}
                      placeholder="이미지 URL"
                      onChange={(event) =>
                        patchDraftBlock(block.id, (entry) => ({
                          ...entry,
                          image: { ...entry.image, src: event.target.value },
                        }))
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
                            const url = await uploadFile(file, `community/${boardType}`);
                            patchDraftBlock(block.id, (entry) => ({
                              ...entry,
                              image: {
                                ...entry.image,
                                src: url,
                                alt: entry.image.alt || draft.title,
                              },
                            }));
                            applyMessage("success", "상세 이미지를 업로드했습니다.");
                          } catch (error) {
                            applyMessage(
                              "error",
                              error instanceof Error ? error.message : "상세 이미지를 업로드하지 못했습니다.",
                            );
                          } finally {
                            event.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    value={block.image.alt}
                    placeholder="대체 텍스트"
                    onChange={(event) =>
                      patchDraftBlock(block.id, (entry) => ({
                        ...entry,
                        image: { ...entry.image, alt: event.target.value },
                      }))
                    }
                  />
                  <input
                    value={block.image.caption ?? ""}
                    placeholder="캡션"
                    onChange={(event) =>
                      patchDraftBlock(block.id, (entry) => ({
                        ...entry,
                        image: { ...entry.image, caption: event.target.value },
                      }))
                    }
                  />
                </div>
              ) : null}

              {block.type === "gallery" ? (
                <div className="admin-gallery-editor">
                  {block.images.map((image, imageIndex) => (
                    <div key={`${block.id}-${imageIndex}`} className="admin-gallery-row">
                      <div className="admin-upload-row">
                        <input
                          value={image.src}
                          placeholder="이미지 URL"
                          onChange={(event) =>
                            patchDraftBlock(block.id, (entry) => ({
                              ...entry,
                              images: entry.images.map((galleryImage, galleryIndex) =>
                                galleryIndex === imageIndex
                                  ? { ...galleryImage, src: event.target.value }
                                  : galleryImage,
                              ),
                            }))
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
                                const url = await uploadFile(file, `community/${boardType}`);
                                patchDraftBlock(block.id, (entry) => ({
                                  ...entry,
                                  images: entry.images.map((galleryImage, galleryIndex) =>
                                    galleryIndex === imageIndex
                                      ? {
                                          ...galleryImage,
                                          src: url,
                                          alt: galleryImage.alt || draft.title,
                                        }
                                      : galleryImage,
                                  ),
                                }));
                                applyMessage("success", "갤러리 이미지를 업로드했습니다.");
                              } catch (error) {
                                applyMessage(
                                  "error",
                                  error instanceof Error ? error.message : "갤러리 이미지를 업로드하지 못했습니다.",
                                );
                              } finally {
                                event.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        value={image.alt}
                        placeholder="대체 텍스트"
                        onChange={(event) =>
                          patchDraftBlock(block.id, (entry) => ({
                            ...entry,
                            images: entry.images.map((galleryImage, galleryIndex) =>
                              galleryIndex === imageIndex
                                ? { ...galleryImage, alt: event.target.value }
                                : galleryImage,
                            ),
                          }))
                        }
                      />
                      <input
                        value={image.caption ?? ""}
                        placeholder="캡션"
                        onChange={(event) =>
                          patchDraftBlock(block.id, (entry) => ({
                            ...entry,
                            images: entry.images.map((galleryImage, galleryIndex) =>
                              galleryIndex === imageIndex
                                ? { ...galleryImage, caption: event.target.value }
                                : galleryImage,
                            ),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="adm-button adm-button--ghost"
                        onClick={() =>
                          patchDraftBlock(block.id, (entry) => ({
                            ...entry,
                            images: entry.images.filter((_, galleryIndex) => galleryIndex !== imageIndex),
                          }))
                        }
                      >
                        이미지 삭제
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="adm-button adm-button--ghost"
                    onClick={() =>
                      patchDraftBlock(block.id, (entry) => ({
                        ...entry,
                        images: [...entry.images, createImageAsset()],
                      }))
                    }
                  >
                    갤러리 이미지 추가
                  </button>
                </div>
              ) : null}
            </div>
          ))}
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
                const payload = draftToPayload(boardType, draft);
                const endpoint = selectedItem
                  ? `/api/admin/community/${boardType}/${selectedItem.id}`
                  : `/api/admin/community/${boardType}`;
                const response = await fetch(endpoint, {
                  method: selectedItem ? "PATCH" : "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "same-origin",
                  body: JSON.stringify(payload),
                });
                const data = (await response.json().catch(() => ({}))) as {
                  ok?: boolean;
                  error?: string;
                  item?: CommunityItem;
                };

                if (!response.ok || !data.ok || !data.item) {
                  applyMessage("error", data.error ?? "항목을 저장하지 못했습니다.");
                  return;
                }

                const nextItems = sortItems(
                  selectedItem
                    ? items.map((item) => (item.id === data.item!.id ? data.item! : item))
                    : [data.item, ...items],
                );
                setItems(nextItems);
                setSelectedId(data.item.id);
                setDraft(itemToDraft(data.item));
                applyMessage("success", "항목을 저장했습니다.");
              } catch {
                applyMessage("error", "항목 저장 중 오류가 발생했습니다.");
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
