"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getTenantConfig, getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type {
  AuthModalMode,
  AuthModalState,
  CartDialogState,
  CartItem,
  CartStore,
  MirrorLocale,
  ReverseAuthResult,
  ReverseSessionState,
} from "@/lib/reverseclinic-types";
import {
  getReverseClinicSiteRootPath,
  resolveReverseClinicSiteFromPathname,
} from "@/tenants/reverseclinic/site-registry";

function isAuthPathname(pathname: string) {
  return pathname.endsWith("/login") || pathname.endsWith("/join");
}

function buildTenantHomePath(pathname: string, tenantId: TenantId, siteId: string) {
  if (tenantId === "reverseclinic" && siteId !== "default") {
    return getReverseClinicSiteRootPath(siteId as never);
  }

  const localeSegment = pathname.split("/").filter(Boolean)[0];
  if (localeSegment === "en" || localeSegment === "jp" || localeSegment === "cn") {
    return `/${localeSegment}`;
  }

  return "/";
}

type TenantRuntimeContextValue = {
  tenantId: TenantId;
  siteId: string;
  authModal: AuthModalState;
  cartDialog: CartDialogState;
  cart: CartStore;
  session: ReverseSessionState;
  toastMessage: string | null;
  isAuthPending: boolean;
  openAuthModal: (
    mode: Exclude<AuthModalMode, null>,
    options?: {
      returnTo?: string | null;
      routePath?: string | null;
      reasonMessage?: string | null;
      pendingHash?: string | null;
      pendingContentId?: string | null;
    },
  ) => void;
  closeAuthModal: () => void;
  openCartDialog: () => void;
  closeCartDialog: () => void;
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  login: (payload: { loginId: string; password: string; locale?: MirrorLocale }) => Promise<ReverseAuthResult>;
  join: (payload: {
    loginId: string;
    name: string;
    phone: string;
    email: string;
    password: string;
    locale?: MirrorLocale;
  }) => Promise<ReverseAuthResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const TenantRuntimeContext = createContext<TenantRuntimeContextValue | null>(null);

async function fetchSessionState(tenantId: TenantId) {
  const response = await fetch("/api/session", {
    credentials: "same-origin",
    headers: {
      "x-tenant-id": tenantId,
    },
  });
  const data = (await response.json()) as {
    authenticated?: boolean;
    user?: ReverseSessionState["user"];
  };

  if (!response.ok || !data.authenticated || !data.user) {
    return {
      status: "anonymous",
      user: null,
    } satisfies ReverseSessionState;
  }

  return {
    status: "authenticated",
    user: data.user,
  } satisfies ReverseSessionState;
}

type TenantRuntimeProviderProps = PropsWithChildren<{
  tenantId: TenantId;
}>;

export function TenantRuntimeProvider({
  children,
  tenantId,
}: TenantRuntimeProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSiteId = useMemo(() => {
    if (tenantId !== "reverseclinic") {
      return "default";
    }

    return resolveReverseClinicSiteFromPathname(pathname);
  }, [pathname, tenantId]);
  const storageKey = useMemo(
    () => `${getTenantConfig(tenantId).storage.cartStorageKey}:${activeSiteId}`,
    [activeSiteId, tenantId],
  );
  const [authModal, setAuthModal] = useState<AuthModalState>({
    mode: null,
    returnTo: null,
    routePath: null,
    reasonMessage: null,
    pendingHash: null,
    pendingContentId: null,
  });
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<ReverseSessionState>({
    status: "loading",
    user: null,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const lastNonAuthPathRef = useRef<string | null>(null);
  const homePath = useMemo(
    () => buildTenantHomePath(pathname, tenantId, activeSiteId),
    [activeSiteId, pathname, tenantId],
  );
  const cartDialog = useMemo<CartDialogState>(
    () => ({
      isOpen: searchParams.get("cart") === "open",
    }),
    [searchParams],
  );

  const buildCartDialogHref = useCallback(
    (shouldOpen: boolean) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      if (shouldOpen) {
        nextSearchParams.set("cart", "open");
      } else {
        nextSearchParams.delete("cart");
      }

      const nextQuery = nextSearchParams.toString();
      return nextQuery ? `${pathname}?${nextQuery}` : pathname;
    },
    [pathname, searchParams],
  );

  useEffect(() => {
    if (!isAuthPathname(pathname)) {
      lastNonAuthPathRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    setAuthModal((current) => {
      if (!current.routePath || current.routePath === pathname) {
        return current;
      }

      return {
        mode: null,
        returnTo: null,
        routePath: null,
        reasonMessage: null,
        pendingHash: null,
        pendingContentId: null,
      };
    });
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setItems([]);
        return;
      }

      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(
          parsed.filter(
            (item): item is CartItem =>
              Boolean(item) &&
              typeof item.id === "string" &&
              typeof item.href === "string" &&
              typeof item.title === "string" &&
              typeof item.siteId === "string",
          ),
        );
      }
    } catch {
      // 장바구니 값이 깨졌으면 tenant별 저장소를 조용히 초기화한다.
      setItems([]);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toastMessage]);

  useEffect(() => {
    const refreshSession = async () => {
      try {
        setSession(await fetchSessionState(tenantId));
      } catch {
        setSession({ status: "anonymous", user: null });
      }
    };

    void refreshSession();
  }, [tenantId]);

  const value = useMemo<TenantRuntimeContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    const authenticate = async (
      endpoint: string,
      payload: Record<string, string | undefined>,
    ): Promise<ReverseAuthResult> => {
      setIsAuthPending(true);
      const payloadLocale =
        payload.locale === "en" || payload.locale === "jp" || payload.locale === "cn"
          ? payload.locale
          : "ko";
      const authMessages = getTenantRuntime(tenantId).localeMessages[payloadLocale];

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => ({}))) as ReverseAuthResult;

        if (!response.ok || !data.ok || !data.user) {
          return {
            ok: false,
            error: data.error ?? authMessages.requestFailed,
          };
        }

        setSession({ status: "authenticated", user: data.user });
        return {
          ok: true,
          user: data.user,
        };
      } catch {
        return {
          ok: false,
          error: authMessages.networkError,
        };
      } finally {
        setIsAuthPending(false);
      }
    };

    return {
      tenantId,
      siteId: activeSiteId,
      authModal,
      cartDialog,
      cart: {
        items,
        itemCount,
      },
      session,
      toastMessage,
      isAuthPending,
      openAuthModal: (mode, options) => {
        const fallbackReturnTo =
          options?.returnTo ??
          (isAuthPathname(pathname) ? (lastNonAuthPathRef.current ?? homePath) : pathname);

        setAuthModal((current) => ({
          mode,
          returnTo: fallbackReturnTo ?? current.returnTo ?? homePath,
          routePath: options?.routePath ?? current.routePath ?? null,
          reasonMessage: options?.reasonMessage ?? current.reasonMessage ?? null,
          pendingHash: options?.pendingHash ?? current.pendingHash ?? null,
          pendingContentId: options?.pendingContentId ?? current.pendingContentId ?? null,
        }));
      },
      closeAuthModal: () => {
        setAuthModal({
          mode: null,
          returnTo: null,
          routePath: null,
          reasonMessage: null,
          pendingHash: null,
          pendingContentId: null,
        });
      },
      openCartDialog: () => {
        const nextHref = buildCartDialogHref(true);
        router.push(nextHref, { scroll: false });
      },
      closeCartDialog: () => {
        const nextHref = buildCartDialogHref(false);
        router.replace(nextHref, { scroll: false });
      },
      addToCart: (item) => {
        setItems((current) => {
          const existing = current.find((entry) => entry.id === item.id);
          if (existing) {
            return current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    quantity: entry.quantity + (item.quantity ?? 1),
                  }
                : entry,
            );
          }

          return [
            ...current,
            {
              ...item,
              quantity: item.quantity ?? 1,
            },
          ];
        });

        setToastMessage(item.title);
      },
      removeFromCart: (id) => {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      clearCart: () => {
        setItems([]);
      },
      updateQuantity: (id, quantity) => {
        setItems((current) =>
          current
            .map((item) =>
              item.id === id
                ? {
                    ...item,
                    quantity: Math.max(1, quantity),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        );
      },
      login: (payload) => authenticate("/api/auth/login", payload),
      join: (payload) => authenticate("/api/auth/join", payload),
      logout: async () => {
        setIsAuthPending(true);

        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "x-tenant-id": tenantId,
            },
          });
        } finally {
          setSession({ status: "anonymous", user: null });
          setIsAuthPending(false);
        }
      },
      refreshSession: async () => {
        try {
          setSession(await fetchSessionState(tenantId));
        } catch {
          setSession({ status: "anonymous", user: null });
        }
      },
    };
  }, [
    activeSiteId,
    authModal,
    buildCartDialogHref,
    cartDialog,
    homePath,
    isAuthPending,
    items,
    pathname,
    router,
    session,
    tenantId,
    toastMessage,
  ]);

  return <TenantRuntimeContext.Provider value={value}>{children}</TenantRuntimeContext.Provider>;
}

export function useTenantRuntime() {
  const context = useContext(TenantRuntimeContext);
  if (!context) {
    throw new Error("useTenantRuntime must be used inside TenantRuntimeProvider");
  }

  return context;
}

export function buildTenantCartItemId(
  href: string,
  locale: MirrorLocale,
  tenantId: TenantId,
  siteId: string,
) {
  return `${tenantId}:${siteId}:${locale}:${href}`;
}
