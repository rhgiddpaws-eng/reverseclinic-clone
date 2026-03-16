"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { ReverseClinicShell } from "@/components/reverseclinic-shell";
import { useTenantRuntime } from "@/components/tenant-runtime-provider";
import { getTenantRuntime } from "@/lib/tenant-registry";
import {
  reverseBeforeAfterCategories,
  reverseCommunityBoardMeta,
} from "@/lib/reverse-community";
import type { TenantId } from "@/lib/tenant-types";
import type {
  CommunityBoardType,
  CommunityContentBlock,
  CommunityItem,
  MirrorLocale,
} from "@/lib/reverseclinic-types";

const pageSizeByBoard: Record<CommunityBoardType, number> = {
  reviews: 8,
  "before-after": 8,
  "media-in": 5,
  notice: 8,
};

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function matchQuery(item: CommunityItem, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();
  return [item.title, item.summary, item.author, item.tags.join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function renderBlock(block: CommunityContentBlock) {
  if (block.type === "text") {
    return (
      <article key={block.id} className="reverse-community-article-block">
        {block.heading ? <h4>{block.heading}</h4> : null}
        <p>{block.body}</p>
      </article>
    );
  }

  if (block.type === "image") {
    return (
      <article key={block.id} className="reverse-community-article-block">
        {block.heading ? <h4>{block.heading}</h4> : null}
        <figure className="reverse-community-article-figure">
          <img src={block.image.src} alt={block.image.alt} />
          {block.image.caption ? <figcaption>{block.image.caption}</figcaption> : null}
        </figure>
        {block.body ? <p>{block.body}</p> : null}
      </article>
    );
  }

  return (
    <article key={block.id} className="reverse-community-article-block">
      {block.heading ? <h4>{block.heading}</h4> : null}
      <div className="reverse-community-article-gallery">
        {block.images.map((image) => (
          <figure key={`${block.id}-${image.src}`} className="reverse-community-article-figure">
            <img src={image.src} alt={image.alt} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
      {block.body ? <p>{block.body}</p> : null}
    </article>
  );
}

function getBeforeAfterImages(item: CommunityItem) {
  const galleryBlock = item.blocks.find((block) => block.type === "gallery");
  const imageBlock = item.blocks.find((block) => block.type === "image");
  const beforeImage =
    item.coverImage ??
    (galleryBlock?.type === "gallery" ? galleryBlock.images[0] : null) ??
    (imageBlock?.type === "image" ? imageBlock.image : null);
  const afterImage =
    (galleryBlock?.type === "gallery" ? galleryBlock.images[1] : null) ??
    (imageBlock?.type === "image" ? imageBlock.image : null) ??
    beforeImage;

  return {
    beforeImage,
    afterImage,
  };
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let value = start; value <= end; value += 1) {
    pages.push(value);
  }

  return (
    <div className="reverse-community-pagination">
      {page > 1 ? (
        <button type="button" onClick={() => onChange(page - 1)}>
          이전
        </button>
      ) : null}
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          className={value === page ? "is-active" : ""}
          onClick={() => onChange(value)}
        >
          {value}
        </button>
      ))}
      {page < totalPages ? (
        <button type="button" onClick={() => onChange(page + 1)}>
          다음
        </button>
      ) : null}
    </div>
  );
}

type ReverseCommunityPageProps = {
  boardType: CommunityBoardType;
  items: CommunityItem[];
  locale: MirrorLocale;
  tenantId: TenantId;
};

export function ReverseCommunityPage({
  boardType,
  items,
  locale,
  tenantId,
}: ReverseCommunityPageProps) {
  const detailRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLElement | null>(null);
  const { openAuthModal, session } = useTenantRuntime();
  const messages = getTenantRuntime(tenantId).localeMessages[locale];
  const meta = reverseCommunityBoardMeta[boardType];
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const [requestedItemId, setRequestedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [beforeAfterFilter, setBeforeAfterFilter] = useState<
    (typeof reverseBeforeAfterCategories)[number]["value"]
  >("all");

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "").trim();
      setRequestedItemId(hash && itemMap.has(hash) ? hash : null);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [itemMap]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, beforeAfterFilter, boardType]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!matchQuery(item, searchQuery)) {
        return false;
      }

      if (boardType === "before-after" && beforeAfterFilter !== "all") {
        return item.category === beforeAfterFilter;
      }

      return true;
    });
  }, [beforeAfterFilter, boardType, items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSizeByBoard[boardType]));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSizeByBoard[boardType];
  const visibleItems = filteredItems.slice(pageStart, pageStart + pageSizeByBoard[boardType]);

  const requestedItem = requestedItemId ? itemMap.get(requestedItemId) ?? null : null;
  const activeItem =
    requestedItem && (!requestedItem.requiresLogin || session.status === "authenticated")
      ? requestedItem
      : null;

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeItem]);

  const handleSelectItem = (item: CommunityItem) => {
    const hash = `#${item.id}`;
    window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
    setRequestedItemId(item.id);

    if (item.requiresLogin && session.status !== "authenticated") {
      openAuthModal("login", {
        returnTo: window.location.pathname,
        reasonMessage: messages.communityLoginRequiredReason,
        pendingHash: hash,
        pendingContentId: item.id,
      });
    }
  };

  const handleBackToList = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setRequestedItemId(null);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderEmptyDetail = () => {
    if (requestedItem && !activeItem) {
      return (
        <article className="reverse-community-detail-card reverse-community-detail-card--locked">
          <p className="reverse-community-detail-label">{meta.title} 상세</p>
          <h3>{requestedItem.title}</h3>
          <p>{messages.communityLoginRequiredDetail}</p>
        </article>
      );
    }

    if (boardType === "before-after") {
      return null;
    }

    return (
      <article className="reverse-community-detail-card reverse-community-detail-card--empty">
        <p className="reverse-community-detail-label">{meta.title} 상세</p>
        <h3>목록에서 항목을 선택해 주세요.</h3>
        <p>선택한 항목의 상세 내용이 이 영역에 표시됩니다.</p>
      </article>
    );
  };

  const renderTableRows = () => {
    return visibleItems.map((item, index) => (
      <button
        key={item.id}
        type="button"
        className={`reverse-community-table-row${requestedItemId === item.id ? " is-active" : ""}`}
        onClick={() => handleSelectItem(item)}
      >
        <span className={item.isPinned ? "is-pin" : ""}>
          {item.isPinned ? "공지" : item.displayNumber ?? filteredItems.length - (pageStart + index)}
        </span>
        <span className="reverse-community-table-row__title">{item.title}</span>
        <span>{item.author}</span>
        <span>{formatPublishedAt(item.publishedAt)}</span>
        <span>{item.viewCount}</span>
      </button>
    ));
  };

  const renderTableBoard = () => (
    <>
      <section ref={detailRef} className="reverse-community-detail-section">
        {activeItem ? (
          <article className="reverse-community-detail-card">
            <div className="reverse-community-detail-header">
              <div>
                <p className="reverse-community-detail-label">{meta.title} 상세</p>
                <h3>{activeItem.title}</h3>
              </div>
              <div className="reverse-community-detail-meta">
                <span>{activeItem.author}</span>
                <span>{formatPublishedAt(activeItem.publishedAt)}</span>
                <span>조회수 {activeItem.viewCount}</span>
              </div>
            </div>
            <p className="reverse-community-detail-summary">{activeItem.summary}</p>
            {activeItem.coverImage ? (
              <figure className="reverse-community-detail-cover">
                <img src={activeItem.coverImage.src} alt={activeItem.coverImage.alt} />
                {activeItem.coverImage.caption ? (
                  <figcaption>{activeItem.coverImage.caption}</figcaption>
                ) : null}
              </figure>
            ) : null}
            <div className="reverse-community-article-body">
              {activeItem.blocks.map((block) => renderBlock(block))}
            </div>
            <div className="reverse-community-actions reverse-community-actions--center">
              <button type="button" onClick={handleBackToList}>
                목록
              </button>
            </div>
          </article>
        ) : (
          renderEmptyDetail()
        )}
      </section>

      <section ref={listRef} className="reverse-community-board-section">
        <div className="reverse-community-board-toolbar">
          <div className="reverse-community-board-search">
            <form
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <input
                value={searchQuery}
                placeholder={meta.searchPlaceholder}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button type="submit">검색</button>
            </form>
          </div>
        </div>

        <div className="reverse-community-table">
          <div className="reverse-community-table-head">
            <span>번호</span>
            <span>제목</span>
            <span>작성자</span>
            <span>작성일</span>
            <span>조회수</span>
          </div>
          {renderTableRows()}
        </div>

        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
      </section>
    </>
  );

  const renderMediaBoard = () => (
    <>
      <section ref={detailRef} className="reverse-community-detail-section reverse-community-detail-section--media">
        {activeItem ? (
          <article className="reverse-community-detail-card reverse-community-detail-card--media">
            <header className="reverse-community-media-header">
              <div>
                <p className="reverse-community-detail-label">{meta.title}</p>
                <h3>{activeItem.title}</h3>
              </div>
              <div className="reverse-community-detail-meta">
                <span>{activeItem.author}</span>
                <span>{formatPublishedAt(activeItem.publishedAt)}</span>
                <span>조회수 {activeItem.viewCount}</span>
              </div>
            </header>
            {activeItem.coverImage ? (
              <figure className="reverse-community-media-hero">
                <img src={activeItem.coverImage.src} alt={activeItem.coverImage.alt} />
              </figure>
            ) : null}
            <div className="reverse-community-article-body">
              {activeItem.blocks.map((block) => renderBlock(block))}
            </div>
            <div className="reverse-community-actions reverse-community-actions--right">
              <button type="button" onClick={handleBackToList}>
                목록보기
              </button>
            </div>
          </article>
        ) : (
          renderEmptyDetail()
        )}
      </section>

      <section ref={listRef} className="reverse-community-board-section">
        <div className="reverse-community-table">
          <div className="reverse-community-table-head">
            <span>번호</span>
            <span>제목</span>
            <span>작성자</span>
            <span>작성일</span>
            <span>조회수</span>
          </div>
          {renderTableRows()}
        </div>

        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />

        <div className="reverse-community-board-search reverse-community-board-search--bottom">
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              value={searchQuery}
              placeholder={meta.searchPlaceholder}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button type="submit">검색</button>
          </form>
        </div>

        <div className="reverse-community-actions reverse-community-actions--center">
          <button type="button" onClick={handleBackToList}>
            목록
          </button>
        </div>
      </section>
    </>
  );

  const renderBeforeAfterBoard = () => (
    <section ref={listRef} className="reverse-community-board-section reverse-community-board-section--gallery">
      <div className="reverse-community-tab-list">
        {reverseBeforeAfterCategories.map((category) => (
          <button
            key={category.value}
            type="button"
            className={beforeAfterFilter === category.value ? "is-active" : ""}
            onClick={() => setBeforeAfterFilter(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {activeItem ? (
        <article ref={detailRef} className="reverse-community-detail-card reverse-community-detail-card--gallery">
          <div className="reverse-community-detail-header">
            <div>
              <p className="reverse-community-detail-label">전후사진 상세</p>
              <h3>{activeItem.title}</h3>
            </div>
            <div className="reverse-community-detail-meta">
              <span>{activeItem.category ?? "전체"}</span>
              <span>{formatPublishedAt(activeItem.publishedAt)}</span>
              <span>조회수 {activeItem.viewCount}</span>
            </div>
          </div>
          <div className="reverse-community-gallery-hero">
            {(() => {
              const { beforeImage, afterImage } = getBeforeAfterImages(activeItem);
              return (
                <>
                  {beforeImage ? (
                    <figure>
                      <img src={beforeImage.src} alt={beforeImage.alt} />
                      <figcaption>Before</figcaption>
                    </figure>
                  ) : null}
                  {afterImage ? (
                    <figure>
                      <img src={afterImage.src} alt={afterImage.alt} />
                      <figcaption>After</figcaption>
                    </figure>
                  ) : null}
                </>
              );
            })()}
          </div>
          <div className="reverse-community-article-body">
            {activeItem.blocks.map((block) => renderBlock(block))}
          </div>
        </article>
      ) : requestedItem ? (
        renderEmptyDetail()
      ) : null}

      <div className="reverse-community-gallery-grid">
        {visibleItems.map((item) => {
          const { beforeImage, afterImage } = getBeforeAfterImages(item);
          return (
            <button
              key={item.id}
              type="button"
              className={`reverse-community-gallery-card${requestedItemId === item.id ? " is-active" : ""}`}
              onClick={() => handleSelectItem(item)}
            >
              <div className="reverse-community-gallery-card__images">
                {beforeImage ? (
                  <figure>
                    <img src={beforeImage.src} alt={beforeImage.alt} />
                    <figcaption>Before</figcaption>
                  </figure>
                ) : null}
                {afterImage ? (
                  <figure>
                    <img src={afterImage.src} alt={afterImage.alt} />
                    <figcaption>After</figcaption>
                  </figure>
                ) : null}
              </div>
              <strong>{item.title}</strong>
            </button>
          );
        })}
      </div>

      <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
    </section>
  );

  return (
    <ReverseClinicShell locale={locale} tenantId={tenantId}>
      <section className="reverse-page-hero reverse-page-hero--community">
        <h2>{meta.title}</h2>
        <p>{meta.description}</p>
      </section>

      {boardType === "media-in"
        ? renderMediaBoard()
        : boardType === "before-after"
          ? renderBeforeAfterBoard()
          : renderTableBoard()}
    </ReverseClinicShell>
  );
}
