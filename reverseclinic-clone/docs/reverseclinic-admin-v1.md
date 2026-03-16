# Reverseclinic 관리자 v1 기능 문서

## 1. 목적
- 공개 사이트의 홈 팝업과 커뮤니티 콘텐츠를 현재 앱 내부에서 직접 운영할 수 있도록 관리자 콘솔을 추가한다.
- 저장은 외부 DB 없이 `data/reverseclinic-local.json`과 `public/uploads`에 고정한다.
- UI는 `Jisoo2_admin`의 레이아웃, 로그인 화면, 사이드바, 리스트/폼 스타일 패턴을 최대한 재사용한다.

## 2. 현재 프로젝트에 필요한 관리자 기능
### 2.1 필수 메뉴
- `대시보드` : 회원 수, 문의 수, 커뮤니티 수, 팝업 수 요약
- `커뮤니티`
  - `시술후기`
  - `전후사진`
  - `미디어인`
  - `공지사항`
- `메인 노출`
  - `광고 팝업`
- `문의 관리`
  - `상담 문의`
  - `예약 문의`
  - `칭찬/불만`
- `회원`
  - `회원 목록`
- `설정`
  - `관리자 계정`

### 2.2 각 메뉴에서 필요한 동작
- 커뮤니티
  - 목록 조회
  - 신규 작성
  - 수정/삭제
  - 커버 이미지 업로드
  - 상세 블록 편집
  - 텍스트, 이미지, 갤러리 블록 혼합 저장
  - `requiresLogin` 설정
- 광고 팝업
  - 목록 조회
  - 신규 작성
  - 수정/삭제
  - 데스크톱/모바일 이미지 업로드
  - 링크, 노출 순서, 활성화 여부 관리
- 문의 관리
  - 상담/예약/칭찬불만 목록 조회
  - 접수 시각과 유입 페이지 확인
- 회원
  - 가입 회원 목록 조회
- 관리자 계정
  - 관리자 계정 목록 확인
  - 로그인 아이디, 이름, 비밀번호 변경

## 3. 현재 구현된 라우트
### 3.1 관리자 화면
- `/admin/login`
- `/admin`
- `/admin/community/reviews`
- `/admin/community/before-after`
- `/admin/community/media-in`
- `/admin/community/notice`
- `/admin/popup`
- `/admin/submissions/consult`
- `/admin/submissions/reservation`
- `/admin/submissions/feedback`
- `/admin/members`
- `/admin/settings/admin`

### 3.2 관리자 API
- `/api/admin/session`
- `/api/admin/auth/login`
- `/api/admin/auth/logout`
- `/api/admin/community/[boardType]`
- `/api/admin/community/[boardType]/[itemId]`
- `/api/admin/popup`
- `/api/admin/popup/[bannerId]`
- `/api/admin/submissions/[kind]`
- `/api/admin/members`
- `/api/admin/settings/admin`
- `/api/admin/upload`

## 4. 공개 사이트와의 연결 방식
- 홈 광고 팝업은 `popupBanners`를 읽어 `HomeAdPopup`에서 렌더한다.
- `시술후기`, `전후사진`, `미디어인`, `공지사항`은 미러 HTML 대신 synthetic React 페이지로 렌더한다.
- 공개 리스트는 누구나 볼 수 있고, 상세는 `requiresLogin`일 때 로그인 후 확인한다.
- 비로그인 상태에서 항목 클릭 시 로그인 모달에 `로그인 하세요` 문구가 표시되고 현재 URL 해시가 유지된다.
- 로그인 성공 후 `pendingHash`, `pendingContentId`를 사용해 같은 상세를 바로 다시 연다.

## 5. 데이터 구조
### 5.1 JSON 저장 항목
- `members`
- `sessions`
- `adminUsers`
- `adminSessions`
- `consultRequests`
- `reservationRequests`
- `feedbackRequests`
- `communityItems`
- `popupBanners`

### 5.2 업로드 규칙
- 업로드 파일은 `public/uploads/...` 아래에 저장한다.
- 전후사진 시드/업로드 시 `.jpg.save`는 `.jpg`로 정규화한다.
- `.png`는 그대로 유지한다.

## 6. Jisoo2_admin 재사용 매핑
### 6.1 직접 재사용한 자산
- 로그인 로고 이미지
- 페이징 화살표 이미지
- 관리자 화면의 좌측 네비게이션 구조
- 상단 바, 카드, 리스트, 폼, 편집기 스타일 톤

### 6.2 패턴만 재사용하고 계약은 교체한 부분
- 토큰 기반 인증 흐름은 제거하고 서버 쿠키 세션으로 교체
- 외부 API 연동 코드는 제거하고 현재 앱의 Next.js route handler로 교체
- 기존 관리자 항목명은 Reverseclinic 운영 범위에 맞게 재구성

## 7. 제외한 레거시 모듈
- 외부 백오피스 서버 의존 API
- 기존 프로젝트 전용 통계/광고/정산 메뉴
- 이번 범위와 무관한 타 사이트 운영 메뉴
- 국제 사이트별 별도 콘텐츠 번역 관리자

## 8. 운영 메모
- 기본 관리자 계정은 `.env`, `.env.production`의 placeholder를 읽어 시드한다.
- 기본값은 `admin / change-this-password / Reverse 관리자`다.
- 실제 운영 전에는 비밀번호와 계정명을 반드시 교체해야 한다.
- 로컬 JSON이 없으면 첫 요청 시 기본 관리자, 커뮤니티, 팝업 데이터가 자동 생성된다.
