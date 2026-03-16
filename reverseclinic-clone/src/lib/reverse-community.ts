import type { CommunityBoardType } from "@/lib/reverseclinic-types";

export type ReverseCommunityBoardMeta = {
  boardType: CommunityBoardType;
  title: string;
  description: string;
  listTitle: string;
  searchPlaceholder: string;
};

export const reverseCommunityBoardMeta: Record<CommunityBoardType, ReverseCommunityBoardMeta> = {
  reviews: {
    boardType: "reviews",
    title: "시술후기",
    description: "리버스클리닉과 함께한 고객님들의 시술후기 게시판입니다.",
    listTitle: "시술후기 목록",
    searchPlaceholder: "시술후기 검색어를 입력하세요.",
  },
  "before-after": {
    boardType: "before-after",
    title: "전후사진",
    description: "리버스클리닉과 함께한 고객님들의 전후사진 게시판입니다.",
    listTitle: "전후사진 목록",
    searchPlaceholder: "전후사진 검색어를 입력하세요.",
  },
  "media-in": {
    boardType: "media-in",
    title: "미디어 IN",
    description: "리버스클리닉의 다양한 방송·언론 활동 게시판입니다.",
    listTitle: "미디어 IN 목록",
    searchPlaceholder: "미디어 IN 검색어를 입력하세요.",
  },
  notice: {
    boardType: "notice",
    title: "공지사항",
    description: "리버스클리닉의 주요 소식과 운영 공지를 안내하는 게시판입니다.",
    listTitle: "공지사항 목록",
    searchPlaceholder: "공지사항 검색어를 입력하세요.",
  },
};

export const reverseBeforeAfterCategories = [
  { value: "all", label: "Show all" },
  { value: "피부", label: "피부" },
  { value: "바디", label: "바디" },
  { value: "쁘띠", label: "쁘띠" },
] as const;

const communityBoardTypes = new Set<CommunityBoardType>([
  "reviews",
  "before-after",
  "media-in",
  "notice",
]);

export function parseCommunityBoardType(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return communityBoardTypes.has(value as CommunityBoardType)
    ? (value as CommunityBoardType)
    : null;
}

export function resolveCommunityBoardFromSegments(segments: string[]) {
  if (segments[0] !== "community") {
    return null;
  }

  return parseCommunityBoardType(segments[1]);
}

export function isVisualCommunityBoard(boardType: CommunityBoardType) {
  return boardType === "before-after" || boardType === "media-in";
}

export function getCommunityCategoryOptions(boardType: CommunityBoardType) {
  if (boardType === "before-after") {
    return reverseBeforeAfterCategories
      .map((item) => item.value)
      .filter((value) => value !== "all");
  }

  return [];
}
