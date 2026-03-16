"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  Camera,
  ChevronUp,
  Gift,
  MapPin,
  MessageCircleMore,
  MessageSquareMore,
  NotebookText,
  type LucideIcon,
} from "lucide-react";
import { ReverseAuthModal } from "@/components/reverse-auth-modal";
import { ReverseCartDialog } from "@/components/reverse-cart-dialog";
import { useTenantRuntime } from "@/components/tenant-runtime-provider";
import { normalizeMirrorAppRoute } from "@/lib/reverse-mirror-routing";
import { getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

type ReverseClinicShellProps = {
  children: ReactNode;
  locale: MirrorLocale;
  tenantId: TenantId;
  mode?: "full" | "bare";
  showQuickMenu?: boolean;
};

type MirrorAnchorProps = {
  href: string;
  locale: MirrorLocale;
  tenantId: TenantId;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  target?: "_blank";
  title?: string;
};

const quickLinkIcons: LucideIcon[] = [
  CalendarDays,
  MessageCircleMore,
  MessageSquareMore,
  NotebookText,
  Camera,
  Gift,
  MapPin,
];

function isAuthRoute(href: string) {
  return href.endsWith("/login") || href.endsWith("/join");
}

export function MirrorAnchor({
  href,
  locale,
  tenantId,
  className,
  children,
  onClick,
  target,
  title,
}: MirrorAnchorProps) {
  const { openAuthModal, siteId } = useTenantRuntime();
  const { isExternalMirrorHref } = getTenantRuntime(tenantId);
  const localHref = normalizeMirrorAppRoute(href, locale, tenantId, siteId);
  const external = isExternalMirrorHref(localHref);

  if (href === "#") {
    return (
      <a href="#" className={className} onClick={onClick} title={title}>
        {children}
      </a>
    );
  }

  if (isAuthRoute(localHref)) {
    const mode = localHref.endsWith("/join") ? "join" : "login";
    return (
      <button
        type="button"
        className={className}
        title={title}
        onClick={() => {
          openAuthModal(mode);
          onClick?.();
        }}
      >
        {children}
      </button>
    );
  }

  if (external) {
    return (
      <a
        href={localHref}
        className={className}
        onClick={onClick}
        target={target ?? "_blank"}
        rel="noreferrer"
        title={title}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={localHref} className={className} onClick={onClick} title={title}>
      {children}
    </Link>
  );
}

export function ReverseClinicShell({
  children,
  locale,
  tenantId,
  mode = "full",
  showQuickMenu = true,
}: ReverseClinicShellProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement | null>(null);
  const menuCloseTimerRef = useRef<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isQuickFloating, setIsQuickFloating] = useState(false);
  const { cart, toastMessage, session, logout, isAuthPending, openCartDialog } = useTenantRuntime();
  const tenantRuntime = getTenantRuntime(tenantId);
  const {
    getLocalePrefix,
    localeLabels,
    localeMessages,
    localeOrder,
    mirrorAssets,
    mirrorFooterLinks,
    mirrorMenuGroups,
    mirrorMeta,
    mirrorNetworkLinks,
    mirrorQuickLinks,
    mirrorTopNav,
  } = tenantRuntime;
  const messages = localeMessages[locale];

  useEffect(() => {
    setIsMenuOpen(false);
    setIsLanguageOpen(false);
    setIsNetworkOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsQuickFloating(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current !== null) {
        window.clearTimeout(menuCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (headerRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsLanguageOpen(false);
      setIsNetworkOpen(false);
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const localeLinks = useMemo(
    () =>
      localeOrder.map((value) => ({
        locale: value,
        label: localeLabels[value],
        href: getLocalePrefix(value) || "/",
        iconSrc:
          value === "ko"
            ? mirrorAssets.languageKr
            : value === "en"
              ? mirrorAssets.languageEn
              : value === "jp"
                ? mirrorAssets.languageJp
                : mirrorAssets.languageCn,
      })),
    [
      getLocalePrefix,
      localeLabels,
      localeOrder,
      mirrorAssets.languageCn,
      mirrorAssets.languageEn,
      mirrorAssets.languageJp,
      mirrorAssets.languageKr,
    ],
  );
  const localizedQuickLinks = useMemo(
    () =>
      mirrorQuickLinks.map((item, index) => ({
        ...item,
        label:
          index === 0
            ? messages.quickReservation
            : index === 1
              ? messages.quickKakaoTalk
              : index === 2
                ? messages.quickConsult
                : index === 3
                  ? messages.reviewTitle
                  : index === 4
                    ? messages.beforeAfterTitle
                    : index === 5
                      ? messages.eventTitle
                      : messages.directionsTitle,
        icon: quickLinkIcons[index] ?? MapPin,
      })),
    [
      messages.beforeAfterTitle,
      messages.directionsTitle,
      messages.eventTitle,
      messages.quickConsult,
      messages.quickKakaoTalk,
      messages.quickReservation,
      messages.reviewTitle,
      mirrorQuickLinks,
    ],
  );

  const clearMenuCloseTimer = () => {
    if (menuCloseTimerRef.current === null) {
      return;
    }

    window.clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = null;
  };

  const openMenu = () => {
    clearMenuCloseTimer();
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    clearMenuCloseTimer();
    setIsMenuOpen(false);
  };

  const scheduleMenuClose = () => {
    clearMenuCloseTimer();
    menuCloseTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
      menuCloseTimerRef.current = null;
    }, 120);
  };

  const handleDesktopMenuClick = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    openMenu();
  };

  const handleMenuTrigger = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    clearMenuCloseTimer();
    setIsMenuOpen((current) => !current);
  };

  const supportHref = mirrorMeta.supportHref;
  const supportExternal = /^https?:\/\//i.test(supportHref);

  if (mode === "bare") {
    return (
      <div className="reverseclinic-app reverseclinic-app--bare" data-tenant-id={tenantId}>
        <main className="contents">{children}</main>
        <ReverseAuthModal locale={locale} tenantId={tenantId} />
        <ReverseCartDialog locale={locale} tenantId={tenantId} />
        {toastMessage ? (
          <div className="reverse-toast" role="status" aria-live="polite">
            {toastMessage}
            <span>{messages.addedToCart}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="reverseclinic-app" data-tenant-id={tenantId}>
      <header ref={headerRef} className="header">
        <h1>
          <Link href={getLocalePrefix(locale) || "/"}>
            <img src={mirrorAssets.logoDesktop} alt={mirrorMeta.siteTitle} className="wlogo" />
            <img src={mirrorAssets.logoMobile} alt={mirrorMeta.siteTitle} className="mlogo" />
          </Link>
        </h1>

        <div className="nav">
          {mirrorTopNav.map((item) => (
            <MirrorAnchor key={item.label} href={item.href} locale={locale} tenantId={tenantId}>
              <span className="eng">{item.label}</span>
              <span className="kor">{locale === "ko" ? item.labelKo ?? item.label : item.label}</span>
            </MirrorAnchor>
          ))}
          <button
            type="button"
            className="tmn"
            aria-expanded={isMenuOpen}
            aria-controls="reverse-total-menu"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleMenuClose}
            onFocus={openMenu}
            onClick={handleDesktopMenuClick}
          >
            <img src={mirrorAssets.menuIcon} alt="" />
            {messages.allMenuLabel}
          </button>
        </div>

        <div
          id="reverse-total-menu"
          className={`totalmenu${isMenuOpen ? " is-open" : ""}`}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleMenuClose}
        >
          <ul className="depth1">
            {mirrorMenuGroups.map((group) => (
              <li key={group.label} className="has-child">
                <MirrorAnchor href={group.href} locale={locale} tenantId={tenantId}>
                  {group.label}
                </MirrorAnchor>
                <div>
                  <ul className="depth2">
                    {group.items.map((item) => (
                      <li key={`${group.label}-${item.label}`}>
                        <MirrorAnchor
                          href={item.href}
                          locale={locale}
                          tenantId={tenantId}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </MirrorAnchor>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="mmn"
          aria-expanded={isMenuOpen}
          aria-controls="reverse-total-menu"
          onClick={handleMenuTrigger}
        >
          <img src={mirrorAssets.mobileMenuIcon} alt={messages.allMenuLabel} />
        </button>

        <button type="button" className="cart" onClick={openCartDialog}>
          <img src={mirrorAssets.cartIcon} alt="" />
          {messages.cartTitle} <span id="cart_counter">({cart.itemCount})</span>
        </button>

        <div className="login">
          <ul>
            {session.status === "authenticated" && session.user ? (
              <>
                <li>
                  <span>{session.user.name}</span>
                </li>
                <li>
                  <Link href="/admin">{messages.adminTitle}</Link>
                </li>
                <li>
                  <button type="button" onClick={() => void logout()} disabled={isAuthPending}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <MirrorAnchor href="/index.php?idx=login" locale={locale} tenantId={tenantId}>
                    {messages.loginTitle}
                  </MirrorAnchor>
                </li>
                <li>
                  <MirrorAnchor href="/index.php?idx=join" locale={locale} tenantId={tenantId}>
                    {messages.joinTitle}
                  </MirrorAnchor>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className={`language${isLanguageOpen ? " show" : ""}`}>
          <div>
            <button
              type="button"
              className="btn-dropdown"
              onClick={() => setIsLanguageOpen((current) => !current)}
            >
              {messages.localeLabel} <img src={mirrorAssets.dropdownArrow} alt="" />
            </button>
            <ul>
              {localeLinks.map((item) => (
                <li key={item.locale}>
                  <Link href={item.href} onClick={() => setIsLanguageOpen(false)}>
                    <div className="ico-img">
                      <img src={item.iconSrc} alt="" />
                    </div>
                    <div className="details">
                      <p>{item.label}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`network${isNetworkOpen ? " show" : ""}`}>
          <button type="button" onClick={() => setIsNetworkOpen((current) => !current)}>
            {messages.networkLabel}
            <img src={mirrorAssets.networkArrow} alt="" />
          </button>
          <div className="network_link">
            {mirrorNetworkLinks.map((item) => (
              <MirrorAnchor
                key={item.label}
                href={item.href}
                locale={locale}
                tenantId={tenantId}
                target={item.target}
              >
                {item.label}
              </MirrorAnchor>
            ))}
          </div>
        </div>
      </header>

      {showQuickMenu ? (
        <div id="rnb" className={isQuickFloating ? "scroll" : ""}>
          <div className="reverse-quick-panel">
            <div className="reverse-quick-strip" aria-hidden="true" />
            {localizedQuickLinks.map((item, index) => {
              const Icon = item.icon;
              const href = index === 0 ? "/reservation" : index === 2 ? "/talk" : item.href;

              return (
                <MirrorAnchor
                  key={item.label}
                  href={href}
                  locale={locale}
                  tenantId={tenantId}
                  target={item.target}
                  className="reverse-quick-link"
                  title={item.label}
                >
                  <span className="reverse-quick-link__icon" aria-hidden="true">
                    <Icon size={28} />
                  </span>
                  <span className="reverse-quick-link__label">{item.label}</span>
                </MirrorAnchor>
              );
            })}
            <button
              type="button"
              className="reverse-quick-top"
              aria-label={messages.backToTopLabel}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <ChevronUp size={18} />
              <span>TOP</span>
            </button>
          </div>
        </div>
      ) : null}

      <main className="contents">{children}</main>

      <footer className="footer_02">
        <div className="footer-menu">
          <div className="menu-wrap wrap">
            {mirrorFooterLinks.map((item) => (
              <MirrorAnchor
                key={item.label}
                href={item.href}
                locale={locale}
                tenantId={tenantId}
              >
                {item.label}
              </MirrorAnchor>
            ))}
          </div>
        </div>

        <div className="address-wrap">
          <strong className="tit">{mirrorMeta.siteTitle}</strong>
          {messages.businessNameLabel}: {mirrorMeta.businessName}
          <span>|</span>
          {messages.addressLabel}: {mirrorMeta.address}
          <span>|</span>
          {messages.ownerLabel}: {mirrorMeta.owner}
          <span>|</span>
          {messages.businessNumberLabel}: {mirrorMeta.businessNumber}
          <br />
          <br />

          <div className="sns">
            <a
              href={supportHref}
              target={supportExternal ? "_blank" : undefined}
              rel={supportExternal ? "noreferrer" : undefined}
            >
              support
            </a>
          </div>

          <p className="copy">
            copyright 2020 <strong>{mirrorMeta.copyrightBrand}</strong>. All Rights Reserved.
          </p>
        </div>
      </footer>

      <ReverseAuthModal locale={locale} tenantId={tenantId} />
      <ReverseCartDialog locale={locale} tenantId={tenantId} />

      {toastMessage ? (
        <div className="reverse-toast" role="status" aria-live="polite">
          {toastMessage}
          <span>{messages.addedToCart}</span>
        </div>
      ) : null}
    </div>
  );
}
