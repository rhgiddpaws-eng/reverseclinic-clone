"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { MirrorAnchor } from "@/components/reverseclinic-shell";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale, PopupBanner } from "@/lib/reverseclinic-types";

const POPUP_COOKIE_NAMES = [
  "mvwiz_close_popup_swiper_popup",
  "mvwiz_close_popup_dimm_roll_popup",
] as const;

function setPopupCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function hasDismissCookie() {
  return POPUP_COOKIE_NAMES.some((cookieName) => document.cookie.includes(`${cookieName}=1`));
}

type HomeAdPopupProps = {
  banners: PopupBanner[];
  locale: MirrorLocale;
  tenantId: TenantId;
};

export function HomeAdPopup({ banners, locale, tenantId }: HomeAdPopupProps) {
  const enabledBanners = useMemo(
    () => [...banners].filter((banner) => banner.enabled).sort((left, right) => left.order - right.order),
    [banners],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (enabledBanners.length === 0 || hasDismissCookie()) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [enabledBanners.length]);

  useEffect(() => {
    if (!visible || enabledBanners.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % enabledBanners.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabledBanners.length, visible]);

  if (!visible || enabledBanners.length === 0) {
    return null;
  }

  const activeBanner = enabledBanners[activeIndex] ?? enabledBanners[0];

  return (
    <div className="reverse-home-popup" role="dialog" aria-modal="true" aria-label="메인 광고 팝업">
      <button
        type="button"
        className="reverse-home-popup__backdrop"
        aria-label="팝업 닫기"
        onClick={() => setVisible(false)}
      />
      <div className="reverse-home-popup__panel">
        <div className="reverse-home-popup__viewport">
          <MirrorAnchor href={activeBanner.href} locale={locale} tenantId={tenantId}>
            <img
              src={activeBanner.imageSrc}
              alt={activeBanner.alt}
              className="reverse-home-popup__image reverse-home-popup__image--desktop"
            />
            <img
              src={activeBanner.mobileImageSrc ?? activeBanner.imageSrc}
              alt={activeBanner.alt}
              className="reverse-home-popup__image reverse-home-popup__image--mobile"
            />
          </MirrorAnchor>

          {enabledBanners.length > 1 ? (
            <>
              <button
                type="button"
                className="reverse-home-popup__arrow reverse-home-popup__arrow--prev"
                aria-label="이전 팝업"
                onClick={() =>
                  setActiveIndex((current) => (current - 1 + enabledBanners.length) % enabledBanners.length)
                }
              />
              <button
                type="button"
                className="reverse-home-popup__arrow reverse-home-popup__arrow--next"
                aria-label="다음 팝업"
                onClick={() => setActiveIndex((current) => (current + 1) % enabledBanners.length)}
              />
            </>
          ) : null}
        </div>

        <div className="reverse-home-popup__footer">
          <div className="reverse-home-popup__dots" aria-label="팝업 페이지">
            {enabledBanners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                aria-label={`${index + 1}번 팝업`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <div className="reverse-home-popup__actions">
            <button
              type="button"
              onClick={() => {
                POPUP_COOKIE_NAMES.forEach((cookieName) => {
                  setPopupCookie(cookieName, "1", 1);
                });
                setVisible(false);
              }}
            >
              오늘 하루 보지 않기
            </button>
            <button type="button" onClick={() => setVisible(false)}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
