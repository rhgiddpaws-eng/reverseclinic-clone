"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { HomeAdPopup } from "@/components/home-ad-popup";
import {
  buildTenantCartItemId,
  useTenantRuntime,
} from "@/components/tenant-runtime-provider";
import { MirrorAnchor, ReverseClinicShell } from "@/components/reverseclinic-shell";
import { getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale, PopupBanner } from "@/lib/reverseclinic-types";

const heroSlideClassNames = ["box01", "box02", "box03", "box04", "box05"] as const;

function getLoopedIndex(index: number, length: number) {
  return (index + length) % length;
}

type ReverseHomePageProps = {
  locale: MirrorLocale;
  popupBanners?: PopupBanner[];
  tenantId: TenantId;
};

export function ReverseHomePage({
  locale,
  popupBanners = [],
  tenantId,
}: ReverseHomePageProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const [isMobileHeroVideo, setIsMobileHeroVideo] = useState(false);
  const { addToCart, openCartDialog, siteId } = useTenantRuntime();
  const tenantRuntime = getTenantRuntime(tenantId);
  const {
    localeMessages,
    mirrorAssets,
    mirrorBestSellerItems,
    mirrorEventItems,
    mirrorHeroSlides,
    mirrorInfoLinks,
    mirrorMeta,
  } = tenantRuntime;
  const messages = localeMessages[locale];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => getLoopedIndex(current + 1, mirrorHeroSlides.length));
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [mirrorHeroSlides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");
    const syncHeroVideoMode = () => {
      setIsMobileHeroVideo(mediaQuery.matches);
    };

    syncHeroVideoMode();
    mediaQuery.addEventListener("change", syncHeroVideoMode);

    return () => {
      mediaQuery.removeEventListener("change", syncHeroVideoMode);
    };
  }, []);

  const eventWindow = [-1, 0, 1].map((offset) => {
    const itemIndex = getLoopedIndex(eventIndex + offset, mirrorEventItems.length);
    return {
      ...mirrorEventItems[itemIndex],
      itemIndex,
    };
  });

  return (
    <ReverseClinicShell locale={locale} tenantId={tenantId}>
      <HomeAdPopup banners={popupBanners} locale={locale} tenantId={tenantId} />
      <div className="reverse-home-page" data-reverse-home-page="true">
        <section className="main_con visual">
          <ul className="rolling">
            {mirrorHeroSlides.map((slide, index) => {
              const heroClassName = heroSlideClassNames[index];

              return (
                <li
                  key={slide.id}
                  className={`box ${heroClassName} ${
                    slide.kind === "image" ? "boxpic" : ""
                  }${index === heroIndex ? " is-active" : ""}`}
                >
                  {slide.kind === "video" ? (
                    <div className="videobox">
                      <div className="video_wrap">
                        <video
                          className={`video ${isMobileHeroVideo ? "mo" : "pc"}`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                        >
                          <source src={slide.src} type="video/mp4" />
                        </video>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="pic"
                      style={{
                        backgroundImage: `url(${slide.src})`,
                      }}
                      aria-label={slide.alt}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="slick-arrow slick-prev"
            aria-label="Previous hero slide"
            onClick={() =>
              setHeroIndex((current) => getLoopedIndex(current - 1, mirrorHeroSlides.length))
            }
          />
          <button
            type="button"
            className="slick-arrow slick-next"
            aria-label="Next hero slide"
            onClick={() =>
              setHeroIndex((current) => getLoopedIndex(current + 1, mirrorHeroSlides.length))
            }
          />

          <ul className="slick-dots" aria-label="Hero slide navigation">
            {mirrorHeroSlides.map((slide, index) => (
              <li key={slide.id} className={index === heroIndex ? "slick-active" : ""}>
                <button type="button" onClick={() => setHeroIndex(index)}>
                  {slide.alt}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="reverse-section-heading reverse-section-heading--event">
          <div className="inner">
            <p className="tit">
              <em>{mirrorMeta.copyrightBrand} EVENT</em> <span>{mirrorMeta.branch}</span>
            </p>
          </div>
        </section>

        <section className="main-event-section">
          <div className="inner">
            <div
              className="main_event_tab"
              role="tablist"
              aria-label={`${mirrorMeta.siteTitle} event`}
            >
              {mirrorEventItems.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={`swiper-slide${index === eventIndex ? " swiper-slide-thumb-active" : ""}`}
                  role="tab"
                  aria-selected={index === eventIndex}
                  onClick={() => setEventIndex(index)}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="main_event">
              <div className="main_event_wrap">
                <div className="swiper-wrapper">
                  {eventWindow.map((item, windowIndex) => (
                    <div
                      key={`${item.title}-${windowIndex}`}
                      className={`swiper-slide${windowIndex === 1 ? " is-centered" : ""}`}
                      data-item-index={item.itemIndex}
                    >
                      <MirrorAnchor href={item.href} locale={locale} tenantId={tenantId}>
                        <img src={item.imageSrc} alt={item.title} />
                        <div className="text_box">
                          <div className="wrap">
                            <strong>{item.title}</strong>
                            {item.price}
                          </div>
                        </div>
                      </MirrorAnchor>
                      <button
                        type="button"
                        className="reverse-card-cart"
                        onClick={() => {
                          addToCart({
                            id: buildTenantCartItemId(item.href, locale, tenantId, siteId),
                            href: item.href,
                            title: item.title,
                            priceLabel: item.price,
                            imageSrc: item.imageSrc,
                            localeAddedFrom: locale,
                            siteId,
                          });
                          openCartDialog();
                        }}
                      >
                        {messages.cartAction}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="swiper-btn-prev"
                aria-label="Previous event slide"
                onClick={() =>
                  setEventIndex((current) => getLoopedIndex(current - 1, mirrorEventItems.length))
                }
              >
                <img src={mirrorAssets.eventPrev} alt="" />
              </button>
              <button
                type="button"
                className="swiper-btn-next"
                aria-label="Next event slide"
                onClick={() =>
                  setEventIndex((current) => getLoopedIndex(current + 1, mirrorEventItems.length))
                }
              >
                <img src={mirrorAssets.eventNext} alt="" />
              </button>
            </div>
          </div>
        </section>

        <section className="reverse-section-heading reverse-section-heading--tv">
          <div className="inner">
            <p className="tit">
              <em>{mirrorMeta.copyrightBrand} TV</em>
            </p>
          </div>
        </section>

        <section className="reverse-tv-section">
          <div className="inner">
            <div className="video1">
              <button
                type="button"
                className="backimg2"
                aria-label="Open clinic video"
                onClick={() => {
                  window.open(mirrorMeta.youtubeWatch, "_blank", "noopener,noreferrer");
                }}
              >
                <img
                  src={mirrorAssets.tvPoster}
                  className="backimg"
                  alt={`${mirrorMeta.siteTitle} poster`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="reverse-section-heading reverse-section-heading--best">
          <div className="inner">
            <p className="tit">
              <em>{messages.bestTitle}</em>
            </p>
          </div>
        </section>

        <section className="best-seller-section" id="best-seller-section">
          <div className="inner">
            <div className="best_seller">
              <ul>
                {mirrorBestSellerItems.map((item) => (
                  <li key={`${item.title}-${item.price}`}>
                    <MirrorAnchor href={item.href} locale={locale} tenantId={tenantId}>
                      <img src={item.imageSrc} alt={item.title} />
                      <div className="txt">
                        <img src={mirrorAssets.bestHoverIcon} alt="View details" />
                        <span>{item.title}</span>
                        <strong>{item.price}</strong>
                      </div>
                    </MirrorAnchor>
                    <button
                      type="button"
                      className="reverse-card-cart"
                      onClick={() => {
                        addToCart({
                          id: buildTenantCartItemId(item.href, locale, tenantId, siteId),
                          href: item.href,
                          title: item.title,
                          priceLabel: item.price,
                          imageSrc: item.imageSrc,
                          localeAddedFrom: locale,
                          siteId,
                        });
                        openCartDialog();
                      }}
                    >
                      {messages.cartAction}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="clinic-info-section">
          <div className="inner">
            <div className="ys_info">
              {mirrorInfoLinks.map((item, index) => {
                const href = index === 0 ? "/talk" : item.href;
                return (
                  <MirrorAnchor
                    key={item.label}
                    href={href}
                    locale={locale}
                    tenantId={tenantId}
                    target={item.target}
                    className={`info-link info-link-${index + 1}`}
                    title={item.label}
                  >
                    <span className="sr-only">{item.label}</span>
                  </MirrorAnchor>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </ReverseClinicShell>
  );
}
