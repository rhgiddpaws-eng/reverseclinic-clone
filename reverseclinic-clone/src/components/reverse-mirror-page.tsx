"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReverseClinicShell } from "@/components/reverseclinic-shell";
import {
  buildTenantCartItemId,
  useTenantRuntime,
} from "@/components/tenant-runtime-provider";
import { getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type {
  MirrorLocale,
  MirrorPageEventGallery,
  MirrorPageModel,
} from "@/lib/reverseclinic-types";
import {
  getReverseClinicSite,
  getReverseClinicSiteBranchLabel,
} from "@/tenants/reverseclinic/site-registry";

type ReverseMirrorPageProps = {
  locale: MirrorLocale;
  model: MirrorPageModel;
  submissionMode: "consult" | "reservation";
  tenantId: TenantId;
  siteId?: string;
};

type ReverseFormKind = "consult" | "reservation" | "feedback";

type FormFieldEntry = {
  name: string;
  value: string;
};

function setMirrorPopupCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

const runtimeScriptLoads = new Map<string, Promise<void>>();
const headStylesheetEntries = new Map<
  string,
  {
    element: HTMLLinkElement;
    refs: number;
    promise: Promise<void>;
  }
>();
const ROUGHMAP_LOADER_PATTERN = /roughmapLoader\.js/i;

type RoughmapWindow = Window &
  typeof globalThis & {
    daum?: {
      roughmap?: {
        Lander?: unknown;
        phase?: string;
        cdn?: string;
        URL_KEY_DATA_LOAD_PRE?: string;
        url_protocal?: string;
        url_cdn_domain?: string;
      };
    };
  };

function setFormStatus(form: HTMLFormElement, tone: "success" | "error", message: string) {
  const formId = form.dataset.reverseFormId ?? "reverse-form";
  const container = form.parentElement ?? form;
  let status = container.querySelector<HTMLElement>(`.reverse-form-status[data-for="${formId}"]`);

  if (!status) {
    status = document.createElement("p");
    status.dataset.for = formId;
    status.className = "reverse-form-status";
    container.append(status);
  }

  status.textContent = message;
  status.dataset.tone = tone;
}

function toFormFieldEntries(formData: FormData) {
  return Array.from(formData.entries())
    .map(([name, value]) => ({
      name,
      value: typeof value === "string" ? value.trim() : "",
    }))
    .filter((entry) => entry.value.length > 0);
}

function getFirstFieldValue(entries: FormFieldEntry[], names: string[]) {
  for (const name of names) {
    const match = entries.find((entry) => entry.name === name && entry.value);
    if (match) {
      return match.value;
    }
  }

  return "";
}

function collectPhone(entries: FormFieldEntry[]) {
  const segmentedPhone = entries
    .filter((entry) => entry.name === "phone[]")
    .map((entry) => entry.value)
    .filter(Boolean)
    .join("-");

  if (segmentedPhone) {
    return segmentedPhone;
  }

  return getFirstFieldValue(entries, ["phone"]);
}

function buildSummaryBlock(rows: Array<[string, string]>) {
  return rows
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

// 원본 폼마다 본문 필드 구성이 달라서, 비어 있는 메시지는 선택값 요약으로 보강한다.
function buildSubmissionMessage(formKind: ReverseFormKind, entries: FormFieldEntry[]) {
  const rawMessage = getFirstFieldValue(entries, ["say"]);
  const extraSummary = buildSummaryBlock([
    ["희망 지점", getFirstFieldValue(entries, ["etc[지점선택]", "etc[지점]", "ct"])],
    ["예약 날짜", getFirstFieldValue(entries, ["date"])],
    ["예약 시간", getFirstFieldValue(entries, ["rtime", "etc[통화희망시간]"])],
    ["희망 시술", getFirstFieldValue(entries, ["etc[시술선택]"])],
    ["이메일", getFirstFieldValue(entries, ["etc[email]"])],
  ]);

  if (formKind === "feedback") {
    return rawMessage;
  }

  if (rawMessage && extraSummary) {
    return `${rawMessage}\n\n${extraSummary}`;
  }

  return rawMessage || extraSummary;
}

function resolveEffectiveFormKind(
  formKind: string | undefined,
  submissionMode: "consult" | "reservation",
) {
  if (formKind === "feedback" || formKind === "reservation") {
    return formKind;
  }

  return submissionMode === "reservation" ? "reservation" : "consult";
}

function loadExternalRuntimeScript(src: string) {
  const existingScript = Array.from(
    document.querySelectorAll<HTMLScriptElement>("script[data-reverse-runtime-src]"),
  ).find((element) => element.dataset.reverseRuntimeSrc === src);

  if (existingScript?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  const loadPromise = new Promise<void>((resolve, reject) => {
    const script =
      existingScript ??
      (() => {
        const nextScript = document.createElement("script");
        nextScript.src = src;
        nextScript.async = false;
        nextScript.dataset.reverseRuntimeSrc = src;
        document.head.append(nextScript);
        return nextScript;
      })();

    const handleLoad = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    const handleError = () => {
      runtimeScriptLoads.delete(src);
      reject(new Error(`runtime script load failed: ${src}`));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });

  return loadPromise;
}

async function loadRoughmapRuntimeScript(loaderSrc: string) {
  const roughmapWindow = window as RoughmapWindow;
  if (typeof roughmapWindow.daum?.roughmap?.Lander === "function") {
    return;
  }

  const response = await fetch(loaderSrc, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`roughmap loader fetch failed: ${loaderSrc}`);
  }

  const loaderScript = await response.text();
  const phase = loaderScript.match(/var p="([^"]+)"/)?.[1] ?? "prod";
  const cdnVersion = loaderScript.match(/var a="([^"]+)"/)?.[1];
  if (!cdnVersion) {
    throw new Error(`roughmap loader version missing: ${loaderSrc}`);
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  roughmapWindow.daum = roughmapWindow.daum ?? {};
  roughmapWindow.daum.roughmap = {
    ...(roughmapWindow.daum.roughmap ?? {}),
    phase,
    cdn: cdnVersion,
    URL_KEY_DATA_LOAD_PRE: `${protocol}//t1.daumcdn.net/roughmap/`,
    url_protocal: protocol,
    url_cdn_domain: "//t1.daumcdn.net",
  };

  const landerSrc = `${protocol}//t1.daumcdn.net/kakaomapweb/roughmap/place/${phase}/${cdnVersion}/roughmapLander.js`;
  await loadExternalRuntimeScript(landerSrc);

  if (typeof roughmapWindow.daum?.roughmap?.Lander !== "function") {
    throw new Error(`roughmap lander restore failed: ${landerSrc}`);
  }
}

function loadRuntimeScript(src: string) {
  const cachedLoad = runtimeScriptLoads.get(src);
  if (cachedLoad) {
    return cachedLoad;
  }

  const loadPromise = (async () => {
    try {
      if (ROUGHMAP_LOADER_PATTERN.test(src)) {
        await loadRoughmapRuntimeScript(src);
        return;
      }

      await loadExternalRuntimeScript(src);
    } catch (error) {
      runtimeScriptLoads.delete(src);
      throw error;
    }
  })();

  runtimeScriptLoads.set(src, loadPromise);
  return loadPromise;
}

function loadHeadStylesheet(href: string) {
  const cachedEntry = headStylesheetEntries.get(href);
  if (cachedEntry) {
    cachedEntry.refs += 1;
    return {
      promise: cachedEntry.promise,
      release: () => releaseHeadStylesheet(href),
    };
  }

  const existingStylesheet = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>("link[data-reverse-head-stylesheet]"),
  ).find((element) => element.getAttribute("href") === href);

  const stylesheet =
    existingStylesheet ??
    (() => {
      const element = document.createElement("link");
      element.rel = "stylesheet";
      element.href = href;
      element.dataset.reverseHeadStylesheet = "true";
      document.head.append(element);
      return element;
    })();

  const loadPromise =
    stylesheet.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          const handleLoad = () => {
            stylesheet.dataset.loaded = "true";
            resolve();
          };
          const handleError = () => {
            reject(new Error(`mirror stylesheet load failed: ${href}`));
          };

          stylesheet.addEventListener("load", handleLoad, { once: true });
          stylesheet.addEventListener("error", handleError, { once: true });
        });

  headStylesheetEntries.set(href, {
    element: stylesheet,
    refs: 1,
    promise: loadPromise,
  });

  return {
    promise: loadPromise,
    release: () => releaseHeadStylesheet(href),
  };
}

function releaseHeadStylesheet(href: string) {
  const entry = headStylesheetEntries.get(href);
  if (!entry) {
    return;
  }

  entry.refs -= 1;
  if (entry.refs > 0) {
    return;
  }

  entry.element.remove();
  headStylesheetEntries.delete(href);
}

function collectRoughmapContainerIds(model: MirrorPageModel) {
  const containerIds = new Set<string>();

  model.runtimeScripts.forEach((script) => {
    if (script.type !== "inline") {
      return;
    }

    const matches = script.value.matchAll(/"timestamp"\s*:\s*"(\d+)"/g);
    for (const match of matches) {
      containerIds.add(`daumRoughmapContainer${match[1]}`);
    }
  });

  return Array.from(containerIds);
}

function resetRoughmapContainers(model: MirrorPageModel) {
  // 캡처 시점의 정적 지도를 비우고 원본 초기화 스크립트가 다시 렌더하도록 만든다.
  collectRoughmapContainerIds(model).forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.replaceChildren();
  });
}

function resolveEventDetailIdFromHash(hash: string, gallery: MirrorPageEventGallery) {
  const detailId = hash.match(/^#view=([^&]+)/i)?.[1] ?? null;
  if (detailId && gallery.detailHtmlById[detailId]) {
    return detailId;
  }

  return gallery.initialDetailId;
}

function syncEventGalleryHash(detailId: string | null) {
  const url = new URL(window.location.href);
  url.hash = detailId ? `view=${detailId}` : "";
  window.history.replaceState(null, "", url.toString());
}

function renderEventGalleryDetail(
  root: HTMLElement,
  gallery: MirrorPageEventGallery,
  detailId: string | null,
  scrollIntoView = false,
) {
  const viewContainer = root.querySelector<HTMLElement>(`#${gallery.viewContainerId}`);
  if (!viewContainer) {
    return;
  }

  viewContainer.innerHTML = detailId ? gallery.detailHtmlById[detailId] ?? "" : "";

  root.querySelectorAll<HTMLElement>("[data-reverse-event-detail-id]").forEach((item) => {
    const isActive = item.dataset.reverseEventDetailId === detailId;
    item.dataset.reverseEventActive = isActive ? "true" : "false";
    item.setAttribute("aria-pressed", isActive ? "true" : "false");

    const borderTarget = item.firstElementChild;
    if (borderTarget instanceof HTMLElement) {
      borderTarget.style.borderColor = isActive ? "#000000" : "#DDDDDD";
    }
  });

  if (detailId && scrollIntoView) {
    viewContainer.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

/**
 * PRICE 페이지의 카테고리 탭을 클라이언트 사이드 전환으로 변환한다.
 * _devnull_ 링크 클릭 시 fetch로 해당 페이지의 콘텐츠만 가져와 교체한다.
 */
function restorePriceTabs(root: HTMLElement) {
  const priceTab = root.querySelector<HTMLElement>(".price_tab");
  if (!priceTab) return () => {};

  const tabLinks = priceTab.querySelectorAll<HTMLAnchorElement>("a[href]");
  if (tabLinks.length < 2) return () => {};

  // price 탭인지 확인 (_devnull_/c5e05b24 또는 /price 링크 존재)
  const hasPriceLinks = Array.from(tabLinks).some(
    (a) => a.href.includes("_devnull_/c5e05b24") || a.pathname === "/price",
  );
  if (!hasPriceLinks) return () => {};

  // 콘텐츠 영역: .mvwiztemplate_view_dsp 안에서 탭 div 이후 형제들
  const templateContainer = root.querySelector<HTMLElement>(".mvwiztemplate_view_dsp");
  if (!templateContainer) return () => {};

  // 탭을 포함하는 div 찾기
  const templateChildren = Array.from(templateContainer.children);
  const tabContainerIndex = templateChildren.findIndex((el) => el.querySelector(".price_tab"));
  if (tabContainerIndex < 0) return () => {};

  const contentCache = new Map<string, string>();
  let loading = false;

  // 현재 콘텐츠를 캐시에 저장
  const currentHref = Array.from(tabLinks).find(
    (a) => a.closest("li")?.classList.contains("on"),
  )?.getAttribute("href") ?? "/price";
  const getCurrentContent = () => {
    const children = Array.from(templateContainer.children);
    return children.slice(tabContainerIndex + 1).map((el) => el.outerHTML).join("");
  };
  contentCache.set(currentHref, getCurrentContent());

  const switchTab = async (href: string, clickedLink: HTMLAnchorElement) => {
    if (loading) return;
    loading = true;

    // 탭 활성 상태 변경
    tabLinks.forEach((a) => a.closest("li")?.classList.remove("on"));
    clickedLink.closest("li")?.classList.add("on");

    // 캐시에 있으면 즉시 교체
    if (contentCache.has(href)) {
      replaceContent(contentCache.get(href)!);
      loading = false;
      return;
    }

    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // 응답 HTML에서 .mvwiztemplate_view_dsp 안의 탭 div 이후 콘텐츠 추출
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const remoteTemplate = doc.querySelector(".mvwiztemplate_view_dsp");
      if (remoteTemplate) {
        const remoteChildren = Array.from(remoteTemplate.children);
        const remoteTabIdx = remoteChildren.findIndex((el) => el.querySelector(".price_tab"));
        if (remoteTabIdx >= 0) {
          const content = remoteChildren
            .slice(remoteTabIdx + 1)
            .map((el) => el.outerHTML)
            .join("");
          contentCache.set(href, content);
          replaceContent(content);
        }
      }
    } catch {
      // 실패 시 일반 네비게이션으로 폴백
      window.location.href = href;
    } finally {
      loading = false;
    }
  };

  const replaceContent = (html: string) => {
    const children = Array.from(templateContainer.children);
    const tabIdx = children.findIndex((el) => el.querySelector(".price_tab"));
    // 기존 콘텐츠 제거 (탭 div 이후 전부)
    for (let i = children.length - 1; i > tabIdx; i--) {
      children[i].remove();
    }
    // 새 콘텐츠 삽입
    children[tabIdx].insertAdjacentHTML("afterend", html);
  };

  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || !priceTab.contains(anchor)) return;

    const href = anchor.getAttribute("href")?.trim();
    if (!href || href === "#") return;

    // price 카테고리 탭 링크인지 확인
    if (href.includes("_devnull_/c5e05b24") || href === "/price") {
      event.preventDefault();
      event.stopPropagation();
      void switchTab(href, anchor);
    }
  };

  // 캡처 페이즈로 이벤트 등록 — router.push보다 먼저 잡기 위해
  priceTab.addEventListener("click", handleClick, true);

  return () => {
    priceTab.removeEventListener("click", handleClick, true);
  };
}

function restoreBestSlider(root: HTMLElement) {
  // Slick 마크업이 있는 경우 (slick-initialized)
  const slickSlider = root.querySelector<HTMLElement>(".sliderdd.single-item.slick-initialized");
  if (slickSlider) {
    return restoreBestSliderSlick(slickSlider);
  }

  // Slick 마크업이 없는 경우 (raw HTML) — CSS 기반 슬라이더로 변환
  const rawSlider = root.querySelector<HTMLElement>(".sliderdd.single-item");
  if (!rawSlider) {
    return () => {};
  }

  const items = Array.from(rawSlider.querySelectorAll<HTMLElement>(":scope > .item"));
  if (items.length === 0) {
    return () => {};
  }

  // 슬라이더 래퍼 구조 생성
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "overflow:hidden;position:relative;width:100%;";

  const track = document.createElement("div");
  track.style.cssText =
    "display:flex;transition:transform 0.5s ease;will-change:transform;";

  // 아이템을 track으로 이동
  items.forEach((item) => {
    item.style.cssText =
      "flex:0 0 100%;max-width:100%;box-sizing:border-box;transition:opacity 0.3s;";
    track.appendChild(item);
  });

  wrapper.appendChild(track);
  rawSlider.innerHTML = "";
  rawSlider.appendChild(wrapper);

  // 화살표 생성
  const createArrow = (label: string, isLeft: boolean) => {
    const btn = document.createElement("button");
    btn.textContent = isLeft ? "‹" : "›";
    btn.setAttribute("aria-label", label);
    btn.style.cssText = `
      position:absolute;top:50%;transform:translateY(-50%);z-index:2;
      border:none;width:60px;height:60px;border-radius:60px;
      background:rgba(255,255,255,0.66);font-size:28px;cursor:pointer;
      ${isLeft ? "left:max(0px,50% - 530px)" : "right:max(0px,50% - 530px)"};
    `;
    return btn;
  };
  const prevBtn = createArrow("이전", true);
  const nextBtn = createArrow("다음", false);
  rawSlider.style.position = "relative";
  rawSlider.appendChild(prevBtn);
  rawSlider.appendChild(nextBtn);

  let currentIndex = 0;

  const updateSlider = () => {
    track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
    items.forEach((item, i) => {
      const img = item.querySelector("img");
      if (img) img.style.opacity = i === currentIndex ? "1" : "0.4";
    });
  };

  const handlePrev = (e: MouseEvent) => {
    e.preventDefault();
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateSlider();
  };
  const handleNext = (e: MouseEvent) => {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % items.length;
    updateSlider();
  };

  prevBtn.addEventListener("click", handlePrev);
  nextBtn.addEventListener("click", handleNext);
  updateSlider();

  // 자동 슬라이드 (5초)
  const autoSlide = setInterval(() => {
    currentIndex = (currentIndex + 1) % items.length;
    updateSlider();
  }, 5000);

  return () => {
    prevBtn.removeEventListener("click", handlePrev);
    nextBtn.removeEventListener("click", handleNext);
    clearInterval(autoSlide);
  };
}

function restoreBestSliderSlick(slider: HTMLElement) {
  const track = slider.querySelector<HTMLElement>(".slick-track");
  const list = slider.querySelector<HTMLElement>(".slick-list");
  const prevButton = slider.querySelector<HTMLButtonElement>(".slick-prev");
  const nextButton = slider.querySelector<HTMLButtonElement>(".slick-next");

  if (!track || !list || !prevButton || !nextButton) {
    return () => {};
  }

  const baseSlides = Array.from(track.querySelectorAll<HTMLElement>(".slick-slide")).filter(
    (slide) => {
      if (slide.classList.contains("slick-cloned")) {
        return false;
      }

      const index = Number(slide.dataset.slickIndex ?? "");
      return Number.isInteger(index) && index >= 0;
    },
  );

  if (baseSlides.length === 0) {
    return () => {};
  }

  const allSlides = Array.from(track.querySelectorAll<HTMLElement>(".slick-slide"));
  let currentIndex = Math.max(
    0,
    baseSlides.findIndex((slide) => slide.classList.contains("slick-current")),
  );

  // 슬라이드 너비를 신뢰성 있게 측정: offsetWidth → getBoundingClientRect → 이미지 naturalWidth → 폴백 순으로 시도
  const resolveSlideWidth = (slide: HTMLElement): number => {
    const ow = slide.offsetWidth;
    if (ow > 0) return ow;

    const rect = slide.getBoundingClientRect();
    if (rect.width > 0) return rect.width;

    // 이미지 naturalWidth를 폴백으로 사용 (화면 외부에 있어 offsetWidth가 0인 경우 대비)
    const img = slide.querySelector<HTMLImageElement>("img");
    if (img && img.naturalWidth > 0) return img.naturalWidth;

    return 0;
  };

  const updateSlider = () => {
    const visibleWidth = list.clientWidth;

    allSlides.forEach((slide) => {
      slide.classList.remove("slick-current", "slick-active", "slick-center");
      slide.setAttribute("aria-hidden", "true");
      slide.tabIndex = -1;
      slide.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
        anchor.tabIndex = -1;
      });
    });

    const currentSlide = baseSlides[currentIndex] ?? baseSlides[0];
    const prevSlide = baseSlides[(currentIndex - 1 + baseSlides.length) % baseSlides.length];
    const nextSlide = baseSlides[(currentIndex + 1) % baseSlides.length];

    [prevSlide, currentSlide, nextSlide].forEach((slide) => {
      slide.classList.add("slick-active");
      slide.setAttribute("aria-hidden", slide === currentSlide ? "false" : "true");
    });

    currentSlide.classList.add("slick-current", "slick-center");
    currentSlide.tabIndex = 0;
    currentSlide.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
      anchor.tabIndex = 0;
    });

    const slideWidth = resolveSlideWidth(currentSlide);
    if (slideWidth === 0) {
      // 아직 레이아웃이 완성되지 않은 경우 — 다음 프레임에서 재시도
      requestAnimationFrame(updateSlider);
      return;
    }

    // offsetLeft가 정확하지 않을 경우 인덱스 기반으로 직접 계산
    const offsetLeft =
      currentSlide.offsetLeft > 0 || currentIndex === 0
        ? currentSlide.offsetLeft
        : currentIndex * slideWidth;
    const listPadding = parseFloat(list.style.paddingLeft || "0") || 0;
    const targetX = Math.max(
      0,
      offsetLeft - listPadding - Math.max(0, (visibleWidth - slideWidth) / 2),
    );
    track.style.transform = `translate3d(-${targetX}px, 0px, 0px)`;
  };

  const handlePrev = (event: MouseEvent) => {
    event.preventDefault();
    currentIndex = (currentIndex - 1 + baseSlides.length) % baseSlides.length;
    updateSlider();
  };

  const handleNext = (event: MouseEvent) => {
    event.preventDefault();
    currentIndex = (currentIndex + 1) % baseSlides.length;
    updateSlider();
  };

  prevButton.addEventListener("click", handlePrev);
  nextButton.addEventListener("click", handleNext);
  window.addEventListener("resize", updateSlider);

  // 초기화: RAF로 레이아웃 완료 후 실행
  requestAnimationFrame(updateSlider);

  return () => {
    prevButton.removeEventListener("click", handlePrev);
    nextButton.removeEventListener("click", handleNext);
    window.removeEventListener("resize", updateSlider);
  };
}

export function ReverseMirrorPage({
  locale,
  model,
  submissionMode,
  tenantId,
}: ReverseMirrorPageProps) {
  const hasEmbeddedQuickNav = /class=["'][^"']*\bquick-nav\b/.test(model.contentHtml);
  const usesSourceShell =
    tenantId === "reverseclinic" && getReverseClinicSite(model.siteId as never).family === "intl";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { addToCart, cart, openCartDialog } = useTenantRuntime();
  const { getLocalePrefix } = getTenantRuntime(tenantId);
  const [stylesReady, setStylesReady] = useState(
    model.stylesheets.length === 0 && model.inlineStyles.length === 0,
  );

  useEffect(() => {
    let cancelled = false;
    const releaseStylesheets: Array<() => void> = [];
    const inlineStyleElements: HTMLStyleElement[] = [];

    const mountHeadStyles = async () => {
      setStylesReady(false);

      model.inlineStyles.forEach((styleText, index) => {
        const styleElement = document.createElement("style");
        styleElement.dataset.reverseHeadInlineStyle = `${model.slug}:${index}`;
        styleElement.textContent = styleText;
        document.head.append(styleElement);
        inlineStyleElements.push(styleElement);
      });

      try {
        await Promise.all(
          model.stylesheets.map((href) => {
            const stylesheetHandle = loadHeadStylesheet(href);
            releaseStylesheets.push(stylesheetHandle.release);
            return stylesheetHandle.promise;
          }),
        );
      } catch (error) {
        console.warn("mirror stylesheet restore failed", error);
      } finally {
        if (!cancelled) {
          setStylesReady(true);
        }
      }
    };

    void mountHeadStyles();

    return () => {
      cancelled = true;
      inlineStyleElements.forEach((element) => element.remove());
      releaseStylesheets.forEach((release) => release());
    };
  }, [model.inlineStyles, model.slug, model.stylesheets]);

  useEffect(() => {
    const root = containerRef.current;
    const gallery = model.eventGallery;
    if (!root || !gallery || !stylesReady) {
      return;
    }

    const applyFromHash = () => {
      renderEventGalleryDetail(root, gallery, resolveEventDetailIdFromHash(window.location.hash, gallery));
    };

    applyFromHash();
    const delayedApply = window.setTimeout(applyFromHash, 120);
    window.addEventListener("hashchange", applyFromHash);

    return () => {
      window.clearTimeout(delayedApply);
      window.removeEventListener("hashchange", applyFromHash);
    };
  }, [model.eventGallery, stylesReady]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    root.querySelectorAll<HTMLElement>("#cart_counter").forEach((element) => {
      element.textContent = `(${cart.itemCount})`;
    });
  }, [cart.itemCount, model.contentHtml]);

  useEffect(() => {
    if (!stylesReady) {
      return;
    }

    const root = containerRef.current;
    if (!root) {
      return;
    }

    return restoreBestSlider(root);
  }, [model.contentHtml, stylesReady]);

  // PRICE 페이지 탭 클라이언트 전환
  useEffect(() => {
    if (!stylesReady) return;
    const root = containerRef.current;
    if (!root) return;
    return restorePriceTabs(root);
  }, [model.contentHtml, stylesReady]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    const dismissRollPopup = (persistForDay = false) => {
      const popup = root.querySelector<HTMLElement>("#swiper_popup");
      const popupWrap = root.querySelector<HTMLElement>(".main_wrap_pop_up");
      const overlay = root.querySelector<HTMLElement>("#dimm_roll_popup");

      popupWrap?.style.setProperty("display", "none");

      if (popup) {
        popup.style.opacity = "0";
        popup.style.transition = "0.3s";
        popup.style.zIndex = "-1001";
        popup.style.display = "none";
        if (persistForDay) {
          popup.innerHTML = "";
        }
      }

      if (overlay) {
        overlay.style.opacity = "0";
        overlay.style.transition = "0.9s";
        overlay.style.zIndex = "-1001";
        overlay.style.display = "none";
        if (persistForDay) {
          overlay.innerHTML = "";
        }
      }

      if (persistForDay) {
        setMirrorPopupCookie("mvwiz_close_popup_swiper_popup", "1", 1);
        setMirrorPopupCookie("mvwiz_close_popup_dimm_roll_popup", "1", 1);
      }
    };

    if (
      document.cookie.includes("mvwiz_close_popup_swiper_popup=1") ||
      document.cookie.includes("mvwiz_close_popup_dimm_roll_popup=1")
    ) {
      dismissRollPopup();
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const eventCloseTrigger = target.closest<HTMLElement>("[data-reverse-event-close='true']");
      if (eventCloseTrigger && model.eventGallery) {
        event.preventDefault();
        renderEventGalleryDetail(root, model.eventGallery, null);
        syncEventGalleryHash(null);
        return;
      }

      const eventDetailTrigger = target.closest<HTMLElement>("[data-reverse-event-detail-id]");
      if (eventDetailTrigger && model.eventGallery) {
        const detailId = eventDetailTrigger.dataset.reverseEventDetailId ?? "";
        if (model.eventGallery.detailHtmlById[detailId]) {
          event.preventDefault();
          renderEventGalleryDetail(root, model.eventGallery, detailId, true);
          syncEventGalleryHash(detailId);
          return;
        }
      }

      const eventRouteTrigger = target.closest<HTMLElement>("[data-reverse-event-route]");
      if (eventRouteTrigger) {
        const routeHref = eventRouteTrigger.dataset.reverseEventRoute?.trim();
        if (routeHref) {
          event.preventDefault();
          router.push(routeHref);
          return;
        }
      }

      const routeTrigger = target.closest<HTMLElement>("[data-reverse-route]");
      if (routeTrigger) {
        const routeHref = routeTrigger.dataset.reverseRoute?.trim();
        if (routeHref) {
          event.preventDefault();
          router.push(routeHref);
          return;
        }
      }

      const privacyTrigger = target.closest<HTMLElement>("[data-reverse-open-privacy='true']");
      if (privacyTrigger) {
        event.preventDefault();
        const prefix = getLocalePrefix(locale);
        router.push(prefix ? `${prefix}/member/privacy-policy` : "/member/privacy-policy");
        return;
      }

      const cartOpenTrigger = target.closest<HTMLElement>(
        ".cart, [data-reverse-cart-open='true']",
      );
      if (cartOpenTrigger) {
        event.preventDefault();
        openCartDialog();
        return;
      }

      const cartTrigger = target.closest<HTMLElement>(
        "[data-reverse-cart-add='true'], [data-reverse-cart='true']",
      );
      if (cartTrigger) {
        event.preventDefault();
        addToCart({
          id: buildTenantCartItemId(model.sourceHref, locale, tenantId, model.siteId),
          href: model.sourceHref,
          title: model.title,
          imageSrc: model.imageSrc,
          localeAddedFrom: locale,
          siteId: model.siteId,
        });
        openCartDialog();
        return;
      }

      const consultTrigger = target.closest<HTMLElement>("[data-reverse-scroll-consult='true']");
      if (consultTrigger) {
        event.preventDefault();
        const consultForm = root.querySelector(".counselbox form");
        if (consultForm) {
          consultForm.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          return;
        }

        const prefix = getLocalePrefix(locale);
        router.push(prefix ? `${prefix}/talk` : "/talk");
        return;
      }

      const popupHideForDayTrigger = target.closest<HTMLElement>(".__no__2");
      if (popupHideForDayTrigger) {
        event.preventDefault();
        dismissRollPopup(true);
        return;
      }

      const popupCloseTrigger = target.closest<HTMLElement>(
        "#xrotateroll, #swiper_popup a:not([href]), #dimm_roll_popup",
      );
      if (popupCloseTrigger) {
        event.preventDefault();
        dismissRollPopup();
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href")?.trim();
      if (!href || href === "#" || anchor.target === "_blank") {
        return;
      }

      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      event.preventDefault();
      router.push(href);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const keyboardTrigger = target.closest<HTMLElement>(
        "[data-reverse-event-detail-id], [data-reverse-event-route], [data-reverse-route], [data-reverse-event-close='true']",
      );
      if (!keyboardTrigger) {
        return;
      }

      event.preventDefault();
      keyboardTrigger.click();
    };

    const handleSubmit = async (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      event.preventDefault();

      const formData = new FormData(form);
      const entries = toFormFieldEntries(formData);
      const formKind = resolveEffectiveFormKind(form.dataset.reverseFormKind, submissionMode);
      const externalAgreement =
        form.parentElement?.querySelector<HTMLInputElement>("input[id^='agreement_']") ?? null;
      const name = getFirstFieldValue(entries, ["name"]);
      const phone = collectPhone(entries);
      const requestType =
        getFirstFieldValue(entries, ["type"]) ||
        (formKind === "feedback"
          ? "칭찬/불만 접수"
          : formKind === "reservation"
            ? "온라인 예약"
            : "간편문자상담");
      const message = buildSubmissionMessage(formKind, entries);
      const branch =
        formKind === "feedback"
          ? getFirstFieldValue(entries, ["etc[지점]", "etc[지점선택]"])
          : getFirstFieldValue(entries, ["ct", "etc[지점선택]", "etc[지점]"]);
      const resolvedBranch =
        tenantId === "reverseclinic"
          ? getReverseClinicSiteBranchLabel(model.siteId as never)
          : branch || model.title;
      const feedbackType = getFirstFieldValue(entries, ["ct"]);
      const agreed =
        Boolean(getFirstFieldValue(entries, ["agree", "agreement"])) ||
        Boolean(externalAgreement?.checked);

      if (!name || !phone) {
        setFormStatus(form, "error", "이름과 연락처를 입력해 주세요.");
        return;
      }

      if (formKind === "feedback" && (!feedbackType || !message)) {
        setFormStatus(form, "error", "의견 종류와 내용을 모두 입력해 주세요.");
        return;
      }

      if (!message) {
        setFormStatus(form, "error", "상담 내용을 입력하거나 선택 항목을 확인해 주세요.");
        return;
      }

      if ((formKind === "feedback" || formKind === "reservation" || requestType) && !agreed) {
        setFormStatus(form, "error", "개인정보 취급방침 동의 후 진행해 주세요.");
        return;
      }

      const submitters = [
        ...form.querySelectorAll<HTMLButtonElement>("button[type='submit']"),
        ...form.querySelectorAll<HTMLInputElement>("input[type='submit']"),
      ];
      submitters.forEach((element) => {
        element.disabled = true;
      });

      const endpoint =
        formKind === "feedback"
          ? "/api/submissions/feedback"
          : formKind === "reservation"
            ? "/api/submissions/reservation"
            : "/api/submissions/consult";

      const payloadBase = {
        name,
        phone,
        branch: resolvedBranch,
        message,
        requestType,
        sourceSlug: model.slug,
        locale,
        pagePath: window.location.pathname,
      };

      const body =
        formKind === "feedback"
          ? {
              ...payloadBase,
              feedbackType,
              agreed,
            }
          : payloadBase;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
          credentials: "same-origin",
          body: JSON.stringify(body),
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          message?: string;
        };

        if (!response.ok || !data.ok) {
          setFormStatus(form, "error", data.error ?? "요청을 처리할 수 없습니다.");
          return;
        }

        form.reset();
        setFormStatus(form, "success", data.message ?? "요청이 등록되었습니다.");
      } catch {
        setFormStatus(form, "error", "서버와 통신할 수 없습니다.");
      } finally {
        submitters.forEach((element) => {
          element.disabled = false;
        });
      }
    };

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);
    root.addEventListener("submit", handleSubmit);

    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("submit", handleSubmit);
    };
  }, [
    addToCart,
    getLocalePrefix,
    locale,
    cart.itemCount,
    model.imageSrc,
    model.siteId,
    model.slug,
    model.sourceHref,
    model.title,
    model.eventGallery,
    openCartDialog,
    router,
    submissionMode,
    tenantId,
  ]);

  useEffect(() => {
    if (!stylesReady || model.runtimeScripts.length === 0) {
      return;
    }

    let cancelled = false;
    const injectedInlineScripts: HTMLScriptElement[] = [];

    const restoreRuntimeScripts = async () => {
      try {
        for (const script of model.runtimeScripts) {
          if (cancelled || script.type !== "external") {
            continue;
          }

          await loadRuntimeScript(script.value);
        }

        if (cancelled) {
          return;
        }

        resetRoughmapContainers(model);

        model.runtimeScripts.forEach((script, index) => {
          if (script.type !== "inline") {
            return;
          }

          const inlineScript = document.createElement("script");
          inlineScript.dataset.reverseRuntimeInline = `${model.slug}:${index}`;
          inlineScript.text = script.value;
          document.body.append(inlineScript);
          injectedInlineScripts.push(inlineScript);
        });
      } catch (error) {
        console.warn("roughmap runtime restore failed", error);
      }
    };

    void restoreRuntimeScripts();

    return () => {
      cancelled = true;
      injectedInlineScripts.forEach((script) => script.remove());
    };
  }, [model, model.runtimeScripts, model.slug, stylesReady]);

  return (
    <ReverseClinicShell
      locale={locale}
      tenantId={tenantId}
      mode={usesSourceShell ? "bare" : "full"}
      showQuickMenu={usesSourceShell ? false : !hasEmbeddedQuickNav}
    >
      <div
        aria-busy={!stylesReady}
        style={{
          visibility: stylesReady ? "visible" : "hidden",
        }}
      >
        {model.topBannerHtml ? (
          <div
            className="reverse-mirror-top-banner"
            dangerouslySetInnerHTML={{ __html: model.topBannerHtml }}
          />
        ) : null}
        <div
          ref={containerRef}
          className={`reverse-mirror-stage reverse-mirror-stage--${model.kind}`}
          data-reverse-fallback-source={model.fallbackSource}
          data-reverse-integrity-profile={model.integrityProfile}
          data-reverse-missing-signals={model.missingSignals.join(",")}
          dangerouslySetInnerHTML={{ __html: model.contentHtml }}
        />
      </div>
    </ReverseClinicShell>
  );
}
