# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

두 개의 독립 서브프로젝트로 구성:
- **reverseclinic-clone/**: Next.js 15 + React 19 다중 테넌트 클리닉 웹사이트 (주요 프로젝트)
- **Jisoo2_admin/**: 팬 플랫폼 관리자 대시보드 (별도 독립 프로젝트, 별도 .git)

## Commands

### reverseclinic-clone (cd reverseclinic-clone)

```bash
npm run dev          # 개발 서버 (predev로 Node 버전 자동 검증)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
npm run mirror:build # 원본 사이트 크롤 → generated JSON 재생성
npm run qa:long-page # 스크린샷 회귀 테스트
```

### Jisoo2_admin (cd Jisoo2_admin)

```bash
npm run dev    # 개발 서버 (Turbopack)
npm run build  # 프로덕션 빌드
npm run lint   # ESLint
```

**Node 버전**: 20.x (reverseclinic-clone/.nvmrc에 20.18.0 지정)

## Architecture (reverseclinic-clone)

### Multi-Tenant System

요청의 Host 헤더로 테넌트를 자동 결정하는 구조:

```
Host 헤더 / x-tenant-id
  → src/lib/tenant-request.ts (resolveRequestTenantContext)
  → src/lib/tenant-registry.ts (getTenantConfig)
  → TenantConfig (locale, host, brand, theme, routes, storage)
  → Root Layout에서 data-tenant-id + CSS 변수로 스킨 주입
```

테넌트 설정: `src/tenants/{reverseclinic,wishlab}/config.ts`
테넌트 추가 시: tenants/ 에 config.ts 생성 + tenant-registry.ts에 등록

### Mirror Page System

원본 클리닉 사이트를 크롤링해서 정적 JSON으로 저장 후 동적 렌더링:

```
npm run mirror:build (scripts/build-mirror-pages.mjs)
  → src/generated/reverse-mirror-pages.*.json (지점/언어별 카탈로그)
  → src/app/[...slug]/page.tsx → reverse-mirror-page.tsx 로 렌더링
```

미러 페이지 내용 수정 시 반드시 `npm run mirror:build` 재실행 필요.

### i18n

4개 언어(ko/en/jp/cn) × 8개 지점(gangnam, hongdae, myeongdong, incheon-guwol, suwon, nowon, ilsan, bundang) = 32개 사이트 변형.

- 로케일별 라우트: `/` (ko), `/en`, `/jp`, `/cn`
- 다국어 메시지: `src/data/reverseclinic-locales.ts`
- 지점 설정: `src/tenants/reverseclinic/site-registry.ts`

### Database (SQLite)

`src/lib/reverse-db.ts`에서 better-sqlite3로 로컬 SQLite 사용.
DB 파일 경로: `data/{tenantId}-local.db`

테이블: Members, Sessions, AdminUsers, AdminSessions, CommunityItems, PopupBanners, Submissions

### Authentication

세션 토큰 + httpOnly 쿠키 방식. 일반 회원과 관리자가 분리된 세션 테이블 사용.

- 일반 회원 API: `/api/auth/*`, `/api/session`
- 관리자 API: `/api/admin/auth/*`, `/api/admin/session`

### Path Alias

`@/*` → `./src/*` (tsconfig.json)

## Key Files

| 역할 | 경로 |
|------|------|
| 테넌트 해결 | `src/lib/tenant-request.ts` |
| 테넌트 레지스트리 | `src/lib/tenant-registry.ts` |
| 테넌트 설정 | `src/tenants/*/config.ts` |
| DB 스키마/로직 | `src/lib/reverse-db.ts` |
| 미러 라우팅 | `src/lib/reverse-mirror-routing.ts` |
| 미러 페이지 모델 | `src/lib/reverse-page-models.ts` |
| 다국어 데이터 | `src/data/reverseclinic-locales.ts` |
| 미러 생성 데이터 | `src/generated/reverse-mirror-pages.*.json` |
| 메인 레이아웃 래퍼 | `src/components/reverseclinic-shell.tsx` |
| 에셋 프록시 | `src/lib/reverse-asset-proxy.ts` |
| 관리자 Shell | `src/components/admin/admin-shell.tsx` |

## Environment Variables

`.env` 파일에 관리자 초기 계정 설정 (REVERSECLINIC_ADMIN_LOGIN_ID, REVERSECLINIC_ADMIN_PASSWORD, REVERSECLINIC_ADMIN_NAME).
