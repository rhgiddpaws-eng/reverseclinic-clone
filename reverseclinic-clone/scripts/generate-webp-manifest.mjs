/**
 * WebP 매니페스트 생성 스크립트
 *
 * public/reverseclinic-mirror/ 디렉토리를 스캔하여
 * 원본 이미지 경로 → WebP 경로 매핑을 생성한다.
 *
 * 빌드 시점에 실행되어 src/generated/webp-manifest.json을 생성하며,
 * 런타임에 이 매니페스트를 참조하여 프록시 없이 로컬 WebP 파일을 직접 서빙한다.
 */

import { readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.resolve("public");
const MIRROR_DIR = path.join(PUBLIC_DIR, "reverseclinic-mirror");
const OUTPUT_PATH = path.resolve("src", "generated", "webp-manifest.json");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif"]);

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  console.log("Scanning", MIRROR_DIR);

  const allFiles = await walkDir(MIRROR_DIR);
  const webpFiles = allFiles.filter((f) => f.endsWith(".webp"));

  console.log(`Found ${webpFiles.length} WebP files`);

  // stem → webp absolute path 매핑
  const webpByStem = new Map();
  for (const wf of webpFiles) {
    const dir = path.dirname(wf);
    const stem = path.basename(wf, ".webp");
    const key = `${dir}/${stem}`;
    webpByStem.set(key, wf);
  }

  const manifest = {};
  let mappings = 0;

  // 원본 이미지(.jpg/.png 등)와 WebP가 함께 있는 경우 매핑
  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const dir = path.dirname(file);
    const stem = path.basename(file, path.extname(file));
    const key = `${dir}/${stem}`;
    const webpPath = webpByStem.get(key);
    if (!webpPath) continue;

    // public/ 기준 상대 경로 → 서빙 경로
    const origServing = "/" + path.relative(PUBLIC_DIR, file).replace(/\\/g, "/");
    const webpServing = "/" + path.relative(PUBLIC_DIR, webpPath).replace(/\\/g, "/");

    manifest[origServing] = webpServing;
    mappings++;
  }

  // WebP만 있고 원본이 없는 파일: HTML이 원본 확장자로 참조할 수 있으므로
  // 가상 원본 경로(.jpg, .png) → WebP 경로 매핑도 추가
  const ORIGINAL_EXTS = [".jpg", ".jpeg", ".png", ".gif"];
  for (const wf of webpFiles) {
    const webpServing = "/" + path.relative(PUBLIC_DIR, wf).replace(/\\/g, "/");
    for (const origExt of ORIGINAL_EXTS) {
      const origServing = webpServing.replace(/\.webp$/, origExt);
      if (!manifest[origServing]) {
        manifest[origServing] = webpServing;
        mappings++;
      }
    }
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Generated ${OUTPUT_PATH}`);
  console.log(`  ${mappings} image → WebP mappings`);
}

main().catch((err) => {
  console.error("Failed to generate WebP manifest:", err);
  process.exit(1);
});
