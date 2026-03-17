#!/usr/bin/env node
/**
 * public/reverseclinic-mirror/ 내 PNG/JPG 이미지를 WebP로 변환
 * - 원본 파일은 삭제하고 .webp로 대체
 * - 폰트/CSS/HTML/JS 등 비이미지 파일은 무시
 * - GIF는 애니메이션 가능성으로 건너뜀
 */
import sharp from "sharp";
import { readdir, stat, unlink } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const MIRROR_ROOT = join(import.meta.dirname, "..", "public", "reverseclinic-mirror");
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg"]);
const MIN_SIZE = 1024; // 1KB 미만 파일 건너뜀 (아이콘 등)

let totalFiles = 0;
let converted = 0;
let skipped = 0;
let savedBytes = 0;
let errors = 0;

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function convertFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return;

  totalFiles++;

  const fileStat = await stat(filePath);
  if (fileStat.size < MIN_SIZE) {
    skipped++;
    return;
  }

  const webpPath = filePath.replace(/\.(png|jpe?g)$/i, ".webp");

  try {
    const result = await sharp(filePath)
      .webp({ quality: 80, effort: 4 })
      .toFile(webpPath);

    const originalSize = fileStat.size;
    const newSize = result.size;

    if (newSize < originalSize) {
      savedBytes += originalSize - newSize;
      try {
        await unlink(filePath);
      } catch {
        // 원본 삭제 실패 시 WebP만 유지 (Windows 파일 잠금)
      }
      converted++;
      if (converted % 50 === 0) {
        console.log(`  ... ${converted} files converted`);
      }
    } else {
      // WebP가 더 크면 원본 유지, WebP 삭제
      try { await unlink(webpPath); } catch {}
      skipped++;
    }
  } catch (err) {
    errors++;
    if (errors <= 5) {
      console.error(`  Error: ${basename(filePath)}: ${err.message}`);
    }
  }
}

console.log("=== WebP 변환 시작 ===");
console.log(`대상 디렉토리: ${MIRROR_ROOT}\n`);

const startTime = Date.now();

for await (const filePath of walkDir(MIRROR_ROOT)) {
  await convertFile(filePath);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const savedMB = (savedBytes / 1024 / 1024).toFixed(1);

console.log(`\n=== 변환 완료 (${elapsed}s) ===`);
console.log(`총 이미지: ${totalFiles}`);
console.log(`변환 성공: ${converted}`);
console.log(`건너뜀: ${skipped}`);
console.log(`에러: ${errors}`);
console.log(`절약 용량: ${savedMB} MB`);
