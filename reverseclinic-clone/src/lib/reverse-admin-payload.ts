import {
  parseCommunityBoardType,
  reverseCommunityBoardMeta,
} from "@/lib/reverse-community";
import type {
  BeforeAfterImageAsset,
  CommunityBoardType,
  CommunityContentBlock,
  CommunityItem,
  PopupBanner,
} from "@/lib/reverseclinic-types";

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1";
  }

  return fallback;
}

function cleanNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function cleanNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return cleanNumber(value, 0);
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => cleanString(entry))
    .filter(Boolean);
}

function sanitizeImageAsset(value: unknown): BeforeAfterImageAsset | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<BeforeAfterImageAsset>;
  const src = cleanString(candidate.src);
  if (!src) {
    return null;
  }

  return {
    src,
    alt: cleanString(candidate.alt, "업로드 이미지"),
    caption: cleanString(candidate.caption) || undefined,
  };
}

function sanitizeGalleryImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => sanitizeImageAsset(entry))
    .filter((entry): entry is BeforeAfterImageAsset => Boolean(entry));
}

export function sanitizeCommunityBlocks(value: unknown) {
  if (!Array.isArray(value)) {
    return [] satisfies CommunityContentBlock[];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Partial<CommunityContentBlock> & {
        images?: unknown;
        image?: unknown;
      };
      const blockId = cleanString(candidate.id, `block-${index + 1}`);
      const heading = cleanString(candidate.heading) || undefined;

      if (candidate.type === "text") {
        const body = cleanString(candidate.body);
        if (!body) {
          return null;
        }

        return {
          id: blockId,
          type: "text",
          heading,
          body,
        } satisfies CommunityContentBlock;
      }

      if (candidate.type === "image") {
        const image = sanitizeImageAsset(candidate.image);
        if (!image) {
          return null;
        }

        return {
          id: blockId,
          type: "image",
          heading,
          image,
          body: cleanString(candidate.body) || undefined,
        } satisfies CommunityContentBlock;
      }

      if (candidate.type === "gallery") {
        const images = sanitizeGalleryImages(candidate.images);
        if (images.length === 0) {
          return null;
        }

        return {
          id: blockId,
          type: "gallery",
          heading,
          images,
          body: cleanString(candidate.body) || undefined,
        } satisfies CommunityContentBlock;
      }

      return null;
    })
    .filter(Boolean) as CommunityContentBlock[];
}

export function sanitizeCommunityItemInput(
  value: unknown,
  boardTypeOverride?: CommunityBoardType,
): Omit<CommunityItem, "id"> & { id?: string } {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const boardType =
    boardTypeOverride ?? parseCommunityBoardType(cleanString(candidate.boardType)) ?? "reviews";
  const title = cleanString(candidate.title, reverseCommunityBoardMeta[boardType].title);
  const summary = cleanString(candidate.summary, title);
  const publishedAt = cleanString(candidate.publishedAt, new Date().toISOString());

  return {
    id: cleanString(candidate.id) || undefined,
    boardType,
    title,
    summary,
    author: cleanString(candidate.author, "리버스클리닉"),
    publishedAt,
    tags: cleanStringArray(candidate.tags),
    isPinned: cleanBoolean(candidate.isPinned, false),
    displayNumber: cleanNullableNumber(candidate.displayNumber),
    viewCount: cleanNumber(candidate.viewCount, 0),
    category: cleanString(candidate.category) || null,
    requiresLogin: cleanBoolean(candidate.requiresLogin, true),
    coverImage: sanitizeImageAsset(candidate.coverImage),
    blocks: sanitizeCommunityBlocks(candidate.blocks),
  };
}

export function sanitizePopupBannerInput(
  value: unknown,
): Omit<PopupBanner, "id"> & { id?: string } {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: cleanString(candidate.id) || undefined,
    title: cleanString(candidate.title, "메인 팝업"),
    alt: cleanString(candidate.alt, "메인 팝업"),
    href: cleanString(candidate.href, "#"),
    imageSrc: cleanString(candidate.imageSrc),
    mobileImageSrc: cleanString(candidate.mobileImageSrc) || null,
    enabled: cleanBoolean(candidate.enabled, true),
    order: cleanNumber(candidate.order, 0),
  };
}

export function sanitizeAdminAccountInput(value: unknown) {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    userId: cleanString(candidate.userId),
    name: cleanString(candidate.name),
    loginId: cleanString(candidate.loginId),
    password: cleanString(candidate.password) || undefined,
  };
}

export const adminSubmissionKinds = ["consult", "reservation", "feedback"] as const;

export type AdminSubmissionKind = (typeof adminSubmissionKinds)[number];
