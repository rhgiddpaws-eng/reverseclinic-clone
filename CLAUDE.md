# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vercel 배포: **https://reverseclinic-clone.vercel.app**
GitHub: **https://github.com/rhgiddpaws-eng/reverseclinic-clone**

- **reverseclinic-clone/**: Next.js 16.1.6 + React 19.2.4 다중 테넌트 클리닉 웹사이트 (주요 프로젝트)
- **Jisoo2_admin/**: 팬 플랫폼 관리자 대시보드 (별도 독립 프로젝트, 별도 .git, 배포 대상 아님)

## Commands

### reverseclinic-clone (cd reverseclinic-clone)

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run mirror:build # 원본 사이트 크롤 → generated JSON 재생성
npm run qa:long-page # 스크린샷 회귀 테스트
```

**Node 버전**: >=20

## Deployment (Vercel)

```bash
cd reverseclinic-clone && npx vercel --yes --prod
```

- Vercel Root Directory: `reverseclinic-clone`
- Hobby 플랜 제한: serverless 함수 12개 이내
- 환경변수: REVERSECLINIC_ADMIN_LOGIN_ID, REVERSECLINIC_ADMIN_PASSWORD, REVERSECLINIC_ADMIN_NAME
- Vercel 호스트 `reverseclinic-clone.vercel.app`이 `acceptedHosts`에 등록되어 있어야 함
  (`src/tenants/reverseclinic/config.ts`)

### Vercel 호환성 규칙

- `node:fs` 쓰기(writeFileSync, mkdirSync) 사용 금지 → 인메모리 Map 사용
- `existsSync()` 호출 금지 (public/ 파일은 런타임에 존재하지 않음)
- `readFile` 읽기는 OK (번들된 파일 읽기 가능)
- DB는 인메모리 목업 (`src/lib/reverse-db.ts`의 `storeMap`)
- 서버리스 인스턴스 재시작 시 데이터 초기화됨

## Architecture (reverseclinic-clone)

### Multi-Tenant System

```
Host 헤더 / x-tenant-id
  → src/lib/tenant-request.ts (resolveRequestTenantContext)
  → src/lib/tenant-registry.ts (getTenantConfig)
  → TenantConfig (locale, host, brand, theme, routes, storage)
  → Root Layout에서 data-tenant-id + CSS 변수로 스킨 주입
```

### Routing (Vercel 최적화됨)

로케일/네트워크 라우트가 `[...slug]` catch-all로 통합됨:
- `/en/...`, `/jp/...`, `/cn/...` → `[...slug]`에서 로케일 파싱
- `/network/<branch>/...` → `[...slug]`에서 branch 파싱
- 이유: Vercel Hobby 플랜 serverless 함수 12개 제한

### Database (인메모리 목업)

`src/lib/reverse-db.ts` — `Map<string, TenantStore>` 인메모리 저장소.
실제 DB 없음 (Vercel serverless 호환).
초기 데이터: `src/lib/reverse-admin-seed.ts`의 시드 데이터로 자동 생성.

### Authentication

세션 토큰 + httpOnly 쿠키. 일반 회원/관리자 분리.
로그인 후 헤더에 "관리" 버튼 표시 → `/admin` 링크.

### Path Alias

`@/*` → `./src/*` (tsconfig.json)

## Key Files

| 역할 | 경로 |
|------|------|
| 테넌트 해결 | `src/lib/tenant-request.ts` |
| 테넌트 레지스트리 | `src/lib/tenant-registry.ts` |
| 테넌트 설정 | `src/tenants/*/config.ts` |
| DB (인메모리) | `src/lib/reverse-db.ts` |
| 미러 페이지 모델 | `src/lib/reverse-page-models.ts` |
| 다국어 데이터 | `src/data/reverseclinic-locales.ts` |
| 메인 레이아웃 | `src/components/reverseclinic-shell.tsx` |
| 통합 라우터 | `src/app/[...slug]/page.tsx` |
| 로딩바 | `src/app/loading.tsx` |
| next.config | `next.config.ts` (rewrites, excludes, image optimization) |

---

## 진행 중인 작업 (이어서 할 것)

### 완료된 작업
- [x] Next.js 15.5.12 → 16.1.6 업그레이드
- [x] DB를 인메모리 목업으로 교체 (Vercel 호환)
- [x] node:fs 쓰기 작업 모두 제거
- [x] 로케일/네트워크 라우트를 [...slug]로 통합 (함수 12개 제한 대응)
- [x] Vercel 배포 완료 (https://reverseclinic-clone.vercel.app)
- [x] 메인 헤더에 Admin 버튼 추가 (로그인 후 표시)
- [x] 깨진 로컬 폰트 삭제 (80MB), CDN으로 교체
- [x] 로딩바 추가 (loading.tsx)

### 남은 작업
- [ ] 미러 페이지 CSS에서 참조하는 폰트(.woff)가 여전히 깨짐 — 원본 CSS 파일 내부의 @font-face 경로 문제
- [ ] 이미지 웹 최적화 — public/reverseclinic-mirror/ 내 PNG/JPG를 WebP/AVIF로 변환하거나, Next.js Image Optimization 적용
- [ ] BEST 페이지 등 미러 페이지 레이아웃 검증 (폰트 로드 후 가로 배열 복원 확인)
- [ ] 성능 추가 개선 — 이미지 lazy loading, CDN 캐싱 최적화
