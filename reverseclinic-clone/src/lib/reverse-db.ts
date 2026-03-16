import "server-only";

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { sanitizeCommunityItemInput } from "@/lib/reverse-admin-payload";
import { getTenantConfig } from "@/lib/tenant-registry";
import {
  buildDefaultCommunityItems,
  extractPopupBannerSeedsFromHomeMirror,
} from "@/lib/reverse-admin-seed";
import type { TenantId } from "@/lib/tenant-types";
import type {
  AdminSessionUser,
  CommunityBoardType,
  CommunityItem,
  MirrorLocale,
  PopupBanner,
  ReverseSessionUser,
} from "@/lib/reverseclinic-types";

type MemberRow = {
  id: string;
  tenant_id: string;
  login_id: string;
  name: string;
  phone: string;
  email: string | null;
  password_hash: string;
  created_at: string;
};

type SessionRow = {
  token: string;
  tenant_id: string;
  member_id: string;
  created_at: string;
  expires_at: string;
};

type AdminUserRow = {
  id: string;
  tenant_id: string;
  login_id: string;
  name: string;
  role: "super_admin";
  password_hash: string;
  created_at: string;
};

type AdminSessionRow = {
  token: string;
  tenant_id: string;
  admin_user_id: string;
  created_at: string;
  expires_at: string;
};

type SubmissionInput = {
  name: string;
  phone: string;
  branch: string;
  message: string;
  requestType: string;
  sourceSlug: string;
  locale: MirrorLocale;
  pagePath: string;
};

type FeedbackInput = {
  name: string;
  phone: string;
  branch: string;
  feedbackType: string;
  message: string;
  agreed: boolean;
  requestType: string;
  sourceSlug: string;
  locale: MirrorLocale;
  pagePath: string;
};

type MemberInput = {
  loginId: string;
  name: string;
  phone: string;
  email: string | null;
  password: string;
};

type CommunityItemInput = Omit<CommunityItem, "id"> & {
  id?: string;
};

type PopupBannerInput = Omit<PopupBanner, "id"> & {
  id?: string;
};

type BaseRequestRow = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  branch: string;
  message: string;
  request_type: string;
  source_slug: string;
  locale: MirrorLocale;
  page_path: string;
  created_at: string;
};

type FeedbackRequestRow = BaseRequestRow & {
  feedback_type: string;
  agreed: boolean;
};

type TenantStore = {
  members: MemberRow[];
  sessions: SessionRow[];
  adminUsers: AdminUserRow[];
  adminSessions: AdminSessionRow[];
  consultRequests: BaseRequestRow[];
  reservationRequests: BaseRequestRow[];
  feedbackRequests: FeedbackRequestRow[];
  communityItems: CommunityItem[];
  popupBanners: PopupBanner[];
};

const ADMIN_SESSION_COOKIE_NAME = "reverseclinic_admin_session";

// In-memory store - replaces file-based JSON persistence for Vercel compatibility
const storeMap = new Map<string, TenantStore>();

function now() {
  return new Date().toISOString();
}

function sessionExpiry(days = 30) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const hashedBuffer = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");

  if (hashedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashedBuffer, storedBuffer);
}

function mapMember(row: MemberRow): ReverseSessionUser {
  return {
    id: row.id,
    loginId: row.login_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
  };
}

function mapAdminUser(row: AdminUserRow): AdminSessionUser {
  return {
    id: row.id,
    loginId: row.login_id,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function cloneEmptyStore(): TenantStore {
  return {
    members: [],
    sessions: [],
    adminUsers: [],
    adminSessions: [],
    consultRequests: [],
    reservationRequests: [],
    feedbackRequests: [],
    communityItems: [],
    popupBanners: [],
  };
}

function normalizeStore(input: unknown): TenantStore {
  if (!input || typeof input !== "object") {
    return cloneEmptyStore();
  }

  const candidate = input as Partial<TenantStore>;
  return {
    members: Array.isArray(candidate.members) ? candidate.members : [],
    sessions: Array.isArray(candidate.sessions) ? candidate.sessions : [],
    adminUsers: Array.isArray(candidate.adminUsers) ? candidate.adminUsers : [],
    adminSessions: Array.isArray(candidate.adminSessions) ? candidate.adminSessions : [],
    consultRequests: Array.isArray(candidate.consultRequests) ? candidate.consultRequests : [],
    reservationRequests: Array.isArray(candidate.reservationRequests)
      ? candidate.reservationRequests
      : [],
    feedbackRequests: Array.isArray(candidate.feedbackRequests) ? candidate.feedbackRequests : [],
    communityItems: Array.isArray(candidate.communityItems)
      ? candidate.communityItems
          .map((item, index) => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const sanitized = sanitizeCommunityItemInput(item);
            return {
              ...sanitized,
              id: sanitized.id ?? `community-item-${index + 1}`,
            };
          })
          .filter((item): item is CommunityItem => Boolean(item))
      : [],
    popupBanners: Array.isArray(candidate.popupBanners) ? candidate.popupBanners : [],
  };
}

function pruneExpiredSessions(store: TenantStore) {
  const currentTime = Date.now();
  const nextSessions = store.sessions.filter((session) => {
    const expiresAt = Date.parse(session.expires_at);
    return Number.isNaN(expiresAt) ? false : expiresAt > currentTime;
  });
  const nextAdminSessions = store.adminSessions.filter((session) => {
    const expiresAt = Date.parse(session.expires_at);
    return Number.isNaN(expiresAt) ? false : expiresAt > currentTime;
  });

  const changed =
    nextSessions.length !== store.sessions.length ||
    nextAdminSessions.length !== store.adminSessions.length;

  if (!changed) {
    return false;
  }

  store.sessions = nextSessions;
  store.adminSessions = nextAdminSessions;
  return true;
}

function ensureSeededStore(store: TenantStore, tenantId: TenantId) {
  let changed = false;

  if (tenantId === "reverseclinic" && store.adminUsers.length === 0) {
    const defaultLoginId = process.env.REVERSECLINIC_ADMIN_LOGIN_ID?.trim() || "admin";
    const defaultPassword =
      process.env.REVERSECLINIC_ADMIN_PASSWORD?.trim() || "change-this-password";
    const defaultName = process.env.REVERSECLINIC_ADMIN_NAME?.trim() || "Reverse 관리자";

    store.adminUsers.push({
      id: randomUUID(),
      tenant_id: tenantId,
      login_id: defaultLoginId,
      name: defaultName,
      role: "super_admin",
      password_hash: hashPassword(defaultPassword),
      created_at: now(),
    });
    changed = true;
  }

  if (tenantId === "reverseclinic" && store.communityItems.length === 0) {
    store.communityItems = buildDefaultCommunityItems();
    changed = true;
  }

  if (tenantId === "reverseclinic" && needsCommunitySeedRefresh(store.communityItems)) {
    store.communityItems = buildDefaultCommunityItems();
    changed = true;
  }

  if (tenantId === "reverseclinic" && store.popupBanners.length === 0) {
    const popupBanners = extractPopupBannerSeedsFromHomeMirror();
    if (popupBanners.length > 0) {
      store.popupBanners = popupBanners;
      changed = true;
    }
  }

  return changed;
}

function getStore(tenantId: TenantId): TenantStore {
  const existing = storeMap.get(tenantId);
  if (existing) return existing;

  const store = cloneEmptyStore();
  ensureSeededStore(store, tenantId);
  storeMap.set(tenantId, store);
  return store;
}

function readCurrentStore(tenantId: TenantId) {
  const store = getStore(tenantId);
  pruneExpiredSessions(store);
  return store;
}

function withWritableStore<T>(tenantId: TenantId, updater: (store: TenantStore) => T) {
  const store = getStore(tenantId);
  pruneExpiredSessions(store);
  const result = updater(store);
  // No disk write needed - store is already mutated in-place in the Map
  return result;
}

function matchesLoginId(member: MemberRow, loginId: string) {
  return member.login_id === loginId || member.email === loginId;
}

const defaultCommunitySeedIds = new Set([
  "reviews-1",
  "reviews-2",
  "before-after-1",
  "before-after-2",
  "media-in-1",
  "media-in-2",
  "notice-1",
  "notice-2",
]);

function needsCommunitySeedRefresh(items: CommunityItem[]) {
  if (items.length !== defaultCommunitySeedIds.size) {
    return false;
  }

  return items.every((item) => {
    return (
      defaultCommunitySeedIds.has(item.id) &&
      item.viewCount === 0 &&
      item.displayNumber === null &&
      item.category === null &&
      item.isPinned === false
    );
  });
}

function sortByCreatedAtDesc<T extends { created_at?: string; publishedAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.created_at ?? left.publishedAt ?? "");
    const rightTime = Date.parse(right.created_at ?? right.publishedAt ?? "");
    return rightTime - leftTime;
  });
}

function uniqueConstraintError(field: "login_id" | "email") {
  return new Error(`unique constraint failed: members.${field}`);
}

export function getSessionCookieName(tenantId: TenantId) {
  return getTenantConfig(tenantId).storage.sessionCookieName;
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE_NAME;
}

export function createMember(tenantId: TenantId, input: MemberInput) {
  return withWritableStore(tenantId, (store) => {
    const normalizedEmail = input.email?.toLowerCase() ?? null;

    if (store.members.some((member) => member.login_id === input.loginId)) {
      throw uniqueConstraintError("login_id");
    }

    if (
      normalizedEmail &&
      store.members.some((member) => {
        return member.email !== null && member.email.toLowerCase() === normalizedEmail;
      })
    ) {
      throw uniqueConstraintError("email");
    }

    const createdAt = now();
    const member: MemberRow = {
      id: randomUUID(),
      tenant_id: tenantId,
      login_id: input.loginId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      password_hash: hashPassword(input.password),
      created_at: createdAt,
    };

    store.members.push(member);
    return mapMember(member);
  });
}

export function findMemberByLoginId(tenantId: TenantId, loginId: string) {
  const store = readCurrentStore(tenantId);
  return store.members.find((member) => matchesLoginId(member, loginId)) ?? null;
}

export function authenticateMember(tenantId: TenantId, loginId: string, password: string) {
  const member = findMemberByLoginId(tenantId, loginId);
  if (!member || !verifyPassword(password, member.password_hash)) {
    return null;
  }

  return mapMember(member);
}

export function createSession(tenantId: TenantId, memberId: string) {
  return withWritableStore(tenantId, (store) => {
    const createdAt = now();
    const expiresAt = sessionExpiry();
    const session: SessionRow = {
      token: randomBytes(32).toString("hex"),
      tenant_id: tenantId,
      member_id: memberId,
      created_at: createdAt,
      expires_at: expiresAt,
    };

    store.sessions.push(session);
    return { token: session.token, expiresAt };
  });
}

export function getSessionUser(tenantId: TenantId, token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const store = readCurrentStore(tenantId);
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  const member = store.members.find((entry) => entry.id === session.member_id);
  if (!member) {
    destroySession(tenantId, token);
    return null;
  }

  return mapMember(member);
}

export function destroySession(tenantId: TenantId, token: string | undefined | null) {
  if (!token) {
    return;
  }

  withWritableStore(tenantId, (store) => {
    store.sessions = store.sessions.filter((session) => session.token !== token);
  });
}

export function insertConsultRequest(tenantId: TenantId, input: SubmissionInput) {
  withWritableStore(tenantId, (store) => {
    store.consultRequests.push({
      id: randomUUID(),
      tenant_id: tenantId,
      name: input.name,
      phone: input.phone,
      branch: input.branch,
      message: input.message,
      request_type: input.requestType,
      source_slug: input.sourceSlug,
      locale: input.locale,
      page_path: input.pagePath,
      created_at: now(),
    });
  });
}

export function insertReservationRequest(tenantId: TenantId, input: SubmissionInput) {
  withWritableStore(tenantId, (store) => {
    store.reservationRequests.push({
      id: randomUUID(),
      tenant_id: tenantId,
      name: input.name,
      phone: input.phone,
      branch: input.branch,
      message: input.message,
      request_type: input.requestType,
      source_slug: input.sourceSlug,
      locale: input.locale,
      page_path: input.pagePath,
      created_at: now(),
    });
  });
}

export function insertFeedbackRequest(tenantId: TenantId, input: FeedbackInput) {
  withWritableStore(tenantId, (store) => {
    store.feedbackRequests.push({
      id: randomUUID(),
      tenant_id: tenantId,
      name: input.name,
      phone: input.phone,
      branch: input.branch,
      feedback_type: input.feedbackType,
      message: input.message,
      agreed: input.agreed,
      request_type: input.requestType,
      source_slug: input.sourceSlug,
      locale: input.locale,
      page_path: input.pagePath,
      created_at: now(),
    });
  });
}

export function listMembers(tenantId: TenantId) {
  const store = readCurrentStore(tenantId);
  return sortByCreatedAtDesc(store.members).map(mapMember);
}

export function listConsultRequests(tenantId: TenantId) {
  const store = readCurrentStore(tenantId);
  return sortByCreatedAtDesc(store.consultRequests);
}

export function listReservationRequests(tenantId: TenantId) {
  const store = readCurrentStore(tenantId);
  return sortByCreatedAtDesc(store.reservationRequests);
}

export function listFeedbackRequests(tenantId: TenantId) {
  const store = readCurrentStore(tenantId);
  return sortByCreatedAtDesc(store.feedbackRequests);
}

export function listCommunityItems(
  tenantId: TenantId,
  boardType?: CommunityBoardType,
) {
  const store = readCurrentStore(tenantId);
  const communityItems = boardType
    ? store.communityItems.filter((item) => item.boardType === boardType)
    : store.communityItems;

  return [...communityItems].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    if (left.displayNumber !== null && right.displayNumber !== null) {
      return right.displayNumber - left.displayNumber;
    }

    if (left.displayNumber !== null) {
      return -1;
    }

    if (right.displayNumber !== null) {
      return 1;
    }

    return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
  });
}

export function getCommunityItem(tenantId: TenantId, itemId: string) {
  const store = readCurrentStore(tenantId);
  return store.communityItems.find((item) => item.id === itemId) ?? null;
}

export function saveCommunityItem(tenantId: TenantId, input: CommunityItemInput) {
  return withWritableStore(tenantId, (store) => {
    const nextItem: CommunityItem = {
      ...input,
      id: input.id ?? `${input.boardType}-${randomUUID()}`,
      tags: input.tags ?? [],
      isPinned: input.isPinned ?? false,
      displayNumber: input.displayNumber ?? null,
      viewCount: input.viewCount ?? 0,
      category: input.category ?? null,
      coverImage: input.coverImage ?? null,
    };
    const existingIndex = store.communityItems.findIndex((item) => item.id === nextItem.id);

    if (existingIndex >= 0) {
      store.communityItems[existingIndex] = nextItem;
      return nextItem;
    }

    store.communityItems.push(nextItem);
    return nextItem;
  });
}

export function deleteCommunityItem(tenantId: TenantId, itemId: string) {
  withWritableStore(tenantId, (store) => {
    store.communityItems = store.communityItems.filter((item) => item.id !== itemId);
  });
}

export function listPopupBanners(tenantId: TenantId, activeOnly = false) {
  const store = readCurrentStore(tenantId);
  const popupBanners = activeOnly
    ? store.popupBanners.filter((banner) => banner.enabled)
    : store.popupBanners;

  return [...popupBanners].sort((left, right) => left.order - right.order);
}

export function savePopupBanner(tenantId: TenantId, input: PopupBannerInput) {
  return withWritableStore(tenantId, (store) => {
    const nextBanner: PopupBanner = {
      ...input,
      id: input.id ?? `popup-${randomUUID()}`,
      mobileImageSrc: input.mobileImageSrc ?? null,
    };
    const existingIndex = store.popupBanners.findIndex((banner) => banner.id === nextBanner.id);

    if (existingIndex >= 0) {
      store.popupBanners[existingIndex] = nextBanner;
      return nextBanner;
    }

    store.popupBanners.push(nextBanner);
    return nextBanner;
  });
}

export function deletePopupBanner(tenantId: TenantId, bannerId: string) {
  withWritableStore(tenantId, (store) => {
    store.popupBanners = store.popupBanners.filter((banner) => banner.id !== bannerId);
  });
}

export function listAdminUsers(tenantId: TenantId) {
  const store = readCurrentStore(tenantId);
  return store.adminUsers.map(mapAdminUser);
}

export function authenticateAdmin(tenantId: TenantId, loginId: string, password: string) {
  const store = readCurrentStore(tenantId);
  const adminUser = store.adminUsers.find((user) => user.login_id === loginId) ?? null;
  if (!adminUser || !verifyPassword(password, adminUser.password_hash)) {
    return null;
  }

  return mapAdminUser(adminUser);
}

export function createAdminSession(tenantId: TenantId, adminUserId: string) {
  return withWritableStore(tenantId, (store) => {
    const createdAt = now();
    const expiresAt = sessionExpiry(7);
    const session: AdminSessionRow = {
      token: randomBytes(32).toString("hex"),
      tenant_id: tenantId,
      admin_user_id: adminUserId,
      created_at: createdAt,
      expires_at: expiresAt,
    };

    store.adminSessions.push(session);
    return { token: session.token, expiresAt };
  });
}

export function getAdminSessionUser(tenantId: TenantId, token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const store = readCurrentStore(tenantId);
  const session = store.adminSessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  const adminUser = store.adminUsers.find((entry) => entry.id === session.admin_user_id);
  if (!adminUser) {
    destroyAdminSession(tenantId, token);
    return null;
  }

  return mapAdminUser(adminUser);
}

export function destroyAdminSession(tenantId: TenantId, token: string | undefined | null) {
  if (!token) {
    return;
  }

  withWritableStore(tenantId, (store) => {
    store.adminSessions = store.adminSessions.filter((session) => session.token !== token);
  });
}

export function updateAdminAccount(
  tenantId: TenantId,
  input: {
    userId: string;
    name: string;
    loginId: string;
    password?: string;
  },
) {
  return withWritableStore(tenantId, (store) => {
    const currentUser = store.adminUsers.find((user) => user.id === input.userId);
    if (!currentUser) {
      throw new Error("admin user not found");
    }

    const duplicate = store.adminUsers.find(
      (user) => user.id !== input.userId && user.login_id === input.loginId,
    );
    if (duplicate) {
      throw new Error("duplicate admin login id");
    }

    currentUser.name = input.name;
    currentUser.login_id = input.loginId;
    if (input.password) {
      currentUser.password_hash = hashPassword(input.password);
    }

    return mapAdminUser(currentUser);
  });
}
