import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const routeArgs = [];
const cliOptions = new Map();

for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith("--")) {
    continue;
  }

  const key = token.slice(2);
  const nextValue = process.argv[index + 1];
  if (!nextValue || nextValue.startsWith("--")) {
    cliOptions.set(key, "true");
    continue;
  }

  if (key === "route") {
    routeArgs.push(nextValue);
  } else {
    cliOptions.set(key, nextValue);
  }
  index += 1;
}

const reportDate = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const routes = routeArgs.length > 0 ? routeArgs : ["/lifting"];
const localBaseUrl = (cliOptions.get("local-base-url") ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const originBaseUrl = (cliOptions.get("origin-base-url") ?? "https://reverseclinic.com").replace(
  /\/$/,
  "",
);
const artifactDir = path.resolve(
  process.cwd(),
  cliOptions.get("artifact-dir") ?? "../docs/artifacts",
);
const reportPath = path.join(artifactDir, `reverseclinic-long-page-report-${reportDate}.json`);
const viewport = {
  width: Number.parseInt(cliOptions.get("viewport-width") ?? "1440", 10),
  height: Number.parseInt(cliOptions.get("viewport-height") ?? "900", 10),
};

function buildUrl(baseUrl, routePath) {
  return `${baseUrl}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;
}

async function settlePage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(800);

  // 긴 랜딩은 하단 CTA와 lazy 블록이 늦게 붙으므로 실제 사용자처럼 끝까지 한 번 훑는다.
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const maxScrollY = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      0,
    );
    for (let current = 0; current < maxScrollY; current += 700) {
      window.scrollTo(0, current);
      await delay(120);
    }
    window.scrollTo(0, maxScrollY);
    await delay(300);
    window.scrollTo(0, 0);
  });

  await page.waitForTimeout(1200);
}

async function normalizePage(page) {
  await page.evaluate(() => {
    [
      "#swiper_popup",
      "#dimm_roll_popup",
      "#lightbox",
      "#lightboxOverlay",
      ".lightbox",
      ".lightboxOverlay",
    ].forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.style.display = "none";
          element.style.visibility = "hidden";
        }
      });
    });
  });
}

async function capturePage(page, url, outputPath, label) {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await settlePage(page);
  await normalizePage(page);

  const metrics = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(
      html?.scrollHeight ?? 0,
      body?.scrollHeight ?? 0,
      html?.offsetHeight ?? 0,
      body?.offsetHeight ?? 0,
      html?.clientHeight ?? 0,
    );
    const bottomAnchors = [
      ".counselbox",
      ".footer_02",
      "#footer",
      ".main_btn_wrap",
      ".wrap_map",
    ]
      .map((selector) => {
        const node = document.querySelector(selector);
        if (!(node instanceof HTMLElement)) {
          return null;
        }

        return {
          selector,
          top: Math.round(node.getBoundingClientRect().top + window.scrollY),
          height: Math.round(node.getBoundingClientRect().height),
        };
      })
      .filter(Boolean);
    const mirrorStage = document.querySelector(".reverse-mirror-stage");

    return {
      scrollHeight,
      hasCounselbox: Boolean(document.querySelector(".counselbox")),
      hasFooter: Boolean(document.querySelector(".footer_02, #footer, footer")),
      hasRoughmap: Boolean(document.querySelector(".wrap_map, [id^='daumRoughmapContainer']")),
      mirrorFallbackSource:
        mirrorStage instanceof HTMLElement
          ? mirrorStage.dataset.reverseFallbackSource ?? null
          : null,
      mirrorIntegrityProfile:
        mirrorStage instanceof HTMLElement
          ? mirrorStage.dataset.reverseIntegrityProfile ?? null
          : null,
      mirrorMissingSignals:
        mirrorStage instanceof HTMLElement
          ? mirrorStage.dataset.reverseMissingSignals ?? ""
          : "",
      bottomAnchors,
      textTail: body?.innerText?.slice(-240) ?? "",
    };
  });

  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: "png",
  });

  return {
    label,
    url,
    screenshotPath: outputPath,
    ...metrics,
  };
}

function toFileSafeRoute(routePath) {
  return routePath.replace(/^\/+/, "").replaceAll("/", "-") || "home";
}

function compareCapture(localCapture, originCapture) {
  const heightRatio =
    originCapture.scrollHeight > 0
      ? Number((localCapture.scrollHeight / originCapture.scrollHeight).toFixed(3))
      : null;
  const localBottom = localCapture.bottomAnchors.at(-1)?.top ?? 0;
  const originBottom = originCapture.bottomAnchors.at(-1)?.top ?? 0;
  const bottomGap = originBottom > 0 ? originBottom - localBottom : null;
  const missingBottomBlocks =
    originCapture.bottomAnchors.length > localCapture.bottomAnchors.length
      ? originCapture.bottomAnchors.slice(localCapture.bottomAnchors.length).map((entry) => entry.selector)
      : [];
  const cutOffRisk =
    (heightRatio !== null && heightRatio < 0.9) ||
    Boolean(bottomGap && bottomGap > 900) ||
    missingBottomBlocks.length > 0;

  return {
    heightRatio,
    bottomGap,
    missingBottomBlocks,
    cutOffRisk,
  };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    });
    const results = [];

    for (const routePath of routes) {
      const fileRoute = toFileSafeRoute(routePath);
      const localOutputPath = path.join(
        artifactDir,
        `reverseclinic-${fileRoute}-local-${reportDate}.png`,
      );
      const originOutputPath = path.join(
        artifactDir,
        `reverseclinic-${fileRoute}-origin-${reportDate}.png`,
      );
      const localCapture = await capturePage(
        page,
        buildUrl(localBaseUrl, routePath),
        localOutputPath,
        "local",
      );
      const originCapture = await capturePage(
        page,
        buildUrl(originBaseUrl, routePath),
        originOutputPath,
        "origin",
      );

      results.push({
        route: routePath,
        local: localCapture,
        origin: originCapture,
        comparison: compareCapture(localCapture, originCapture),
      });
    }

    const report = {
      createdAt: new Date().toISOString(),
      localBaseUrl,
      originBaseUrl,
      viewport,
      results,
    };

    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
