# 다마바 (jshop.mhtree.kr) 개발 인계 문서

작성일: 2026-11-20. 다른 AI가 이 프로젝트의 개발을 이어받을 때 필요한 맥락을 정리한 문서다.
이 문서가 최신 정보와 다르면, 최신 정보(사용자의 말, 라이브 사이트, 커밋 기록)를 우선할 것.

## 1. 서비스 개요

- **서비스명: 다마바** — "담아봐"의 자음을 뒤집은 언어유희 (2026-11-20 확정).
- **지금 내용: 일본 쇼핑리스트.** 돈키호테 141개 + 일본 편의점 74개 = 본 목록 215개, 참고용 2개를 더해 카드 217개.
- **라이브 주소: https://jshop.mhtree.kr**
- **확장 방향 (사용자 언급):** 나중에 한국이나 다른 나라 것도, 쇼핑리스트뿐 아니라 맛집이나 여러 목록들도 추가하고 싶어 함. 그래서 이름·이미지·문구는 일본·쇼핑에만 묶이지 않게 할 것. 지금 페이지 구조를 당장 바꿀 필요는 없음.

## 2. 브랜드

- 브랜드 이미지 3종은 `brand/` 폴더에 있음. **v2가 현재 세트**다.
  - `damaba-logo-v2.webp` — 로고 ("다마바" 글자 + 웃는 장바구니, 부제 "여행 목록")
  - `damaba-mascot-v2.webp` — 마스코트 (동그란 장바구니 캐릭터, 빨간 스카프, "TRAVEL LIST" 체크리스트 수첩, 종이비행기)
  - `damaba-header-v2.webp` — 머리말 일러스트 (지도·카메라·여권·체크리스트·커피·지구본·비행기)
  - `damaba-logo-trim.webp` / `damaba-mascot-trim.webp` — 여백 제거 버전. **라이브 페이지에서 실제로 쓰는 건 이 다듬은 버전**이다 (원본은 세로 57%가 빈 흰 여백이라 카드가 커 보이던 문제를 2026-11-20에 수정).
- v1(로고 부제 "여행 쇼핑 리스트", 마스코트 쇼핑 가방, 일러스트에 도리이·후지산·일본 과자)은 쇼핑·일본에만 치우쳤다는 사용자 지적로 폐기됨. 이 저장소에는 넣지 않았고, 원본은 `~/workspace/damaba-brand/`에만 남아 있음.
- 톤: 귀엽고 따뜻함. 파스텔(연분홍·민트·크림·주황). 로고 글자는 제공된 이미지 파일만 쓸 것 — 폰트 재타이핑·AI 재생성 금지(다마바 로고에 한함).

## 3. 저장소·호스팅·배포

- **GitHub: dh75/japan-shopping-list (public, main).** 로컬 클론: `~/workspace/japan-shopping-list-git/`
- **Vercel: 프로젝트 japan-shopping-list-git, 팀 dh7575s-projects (teamId team_Y5f22WgtpkQllAaXf5YQe0Dk).** 도메인 https://jshop.mhtree.kr (mhtree.kr은 Vercel 네임서버 사용, DNS 자동). GitHub Pages (https://dh75.github.io/japan-shopping-list/)도 유지됨.
- **배포: main에 push하면 Vercel이 자동 배포.** 작업 순서: 아티팩트 export → `index.html` 복사 → commit → push → curl로 배포 확인 (배포에 30~60초 걸림, 바로 확인하고 실패로 단정하지 말 것).
- **Vercel MCP는 팀 쓰기가 안 됨 (403) → Vercel CLI를 쓸 것.** 항상 `--scope dh7575s-projects`를 붙이고, CLI 로그인 계정은 dh75 (`vercel login --oob`으로 로그인됨).
- `gh`는 dh75로 로그인됨 (`gh auth setup-git`). **Secure Vault에 저장된 github.com 비밀번호는 재시도하지 말 것** (두 번 거부됨).
- 저장소 루트의 빈 `.nojekyll` 파일은 필수 (GitHub Pages용).

## 4. 파일 구조

- `index.html` — 단일 파일. Muse 아티팩트(`donkihote-syopingriseuteu`)의 export 결과로, 에셋이 인라인되어 있음. **라이브 사이트는 이 파일이 배포된 것**이다. 직접 손대지 말고 아티팩트 편집 → export → 복사 → push 순서로 바꿀 것.
- `api/state.js` — Vercel Blob 기반 사용자별 상태 API (`@vercel/blob` ^1.1.1).
- `privacy.html` — 개인정보처리방침 페이지 (OAuth 동의 화면에서 연결됨).
- `brand/` — 다마바 브랜드 이미지 (위 2번 참고).
- `.nojekyll` — 빈 파일, 필수.

## 5. 인증 (Google 로그인)

- OAuth 클라이언트: Google Cloud 프로젝트 open-claw-496406, 이름 jshop, Web application. 승인된 JavaScript 원본 https://jshop.mhtree.kr.
- **Client ID: `93184252693-6v74mb8uvmt9je2vkl0hm3ljbfqd4hok.apps.googleusercontent.com`** (공개 값, 페이지에 그대로 박혀 있음. Client secret은 받은 적 없고 필요 없음).
- `GOOGLE_CLIENT_ID` 환경변수가 Vercel 프로젝트에 설정됨 (Production, Secret).
- OAuth 동의 화면은 프로덕션 게시됨. **앱 이름은 아직 "shopping list" — TODO: "다마바"로 바꾸기 (Google Cloud 콘솔에서).**
- 토큰: localStorage `jp-shopping-list-google-token-v1` (JWT, 약 1시간 유효), 사용자 정보 `jp-shopping-list-google-user-v1`. 만료 시 "로그인이 만료됐어요. 다시 로그인해 주세요." 표시.
- `api/state.js`는 `Authorization: Bearer <Google ID 토큰>`을 요구하고, `https://oauth2.googleapis.com/tokeninfo`로 검증 (aud·exp·iss 확인). 토큰이 없으면 401 → 페이지는 로컬 전용으로 폴백 (비로그인도 상품 보기·검색 가능, 담기·삭제는 브라우저에만 저장).
- 사용자는 브라우저에서 직접 로그인함. Secure Vault 입력 카드를 유일한 경로로 밀지 말 것.

## 6. 데이터 모델

- localStorage 키: `jp-shopping-list-saved-v1`, `jp-shopping-list-bought-v1`, `jp-shopping-list-deleted-v1`, `jp-shopping-list-history-v1`.
- saved 항목: `{id, name, ..., plannedQty, localPrice}` — plannedQty=구매예정 수량, localPrice=사용자가 현지에서 확인한 1개 가격(엔).
- bought 항목: `{id, name, ..., boughtQty, plannedQty, localPrice, boughtAt}`.
- history: `{type, id, name, at}` — 서버는 최신 500건 유지, '내 기록' 대시보드에 요약 카드 + 최신순 이력으로 표시.
- 서버 state.json: `deleted` / `saved` / `purchased`(=`bought`, 같은 목록을 두 이름으로 유지) / `history`. 사용자당 blob 경로 `users/<sha256(sub + STATE_READ_WRITE_TOKEN) 앞 32자>/state.json` (이메일·이름 저장 안 함). Blob 스토어: public `japan-shopping-list-state-public` (환경변수 `STATE_READ_WRITE_TOKEN`).
- **수량 기능 (2026-11-20 추가):** 담은 상품마다 구매예정 수량(기본 1개, −/+ 버튼으로만 조절, 숫자 입력칸 없음), "구매 +1"을 누를 때마다 산 개수 1씩 증가, 산 개수 −로 줄이기(0이 되면 구매한 목록에서 빠짐). 처음 살 때 현지 1개 가격 입력 모달이 뜸 (대표 가격이 있으면 미리 채움, 비워두면 "금액 미입력"으로 총액에서 제외). 가격은 구매한 목록·상세에서 수정 가능하고, 산 개수가 0이 돼도 담은 항목에 가격이 남아 다음 구매 때 다시 씀. 통계: 살 예정 총 N개 · 산 것 총 M개 · 남은 것 총 K개 · 구매한 총액(엔, 산 개수 × 현지 가격) + 가게별 소계 + 상품별 "5/10개 삼" 진행 표시. **예산 금액은 없음** — "대략 몇 개 구매할 예정"만 관리.
- **삭제 규칙:** 삭제는 상세 화면 하단에서만. 담은 항목은 경고 모달을 띄워 담기를 취소한 뒤 삭제하도록 유도. **사용자가 삭제한 상품은 이후 업데이트에서 절대 다시 추가하지 말 것.** 사용자의 삭제 목록은 현재 비어 있음.
- **NEW 규칙:** `addedDate` 기준 7일만 표시 (2026-11-16 등록분은 2026-11-23까지, 2026-11-24부터 자동 사라짐). "새로 등록된 제품" 안내판(#newboard) + 카드 NEW 배지. 안내판의 NEW는 23개 전부 빨간 배지로 통일됨 (2026-11-20 수정 — 원래 TOP 10의 1·2·3위 빨간 배지 규칙이 새어 들어와 앞 3개만 빨간 배지·뒤 20개는 빨간 글자였음). TOP 10은 1·2·3위만 빨간 배지 그대로.

## 7. 주요 기능

- 탭: 전체 목록 / 담은 목록 / 구매한 목록 / 내 기록 / 참고 정보.
- 검색(검색어 하이라이트), 16개 카테고리 칩, 편의점 브랜드 필터(세븐·패밀리·로손), 담기, 담은 것만 보기, 담은 목록 복사, 정렬, 인쇄.
- 언급 건수 칩, 많이 언급된 TOP 10 (1위 세븐일레븐 과일 스무디, 약 7개 영상. 동점 처리: ① 언급 건수 → ② 근거 영상 수 → ③ 원래 순서).
- 출처 영상 77개(돈키호테 42 + 편의점 35), "바로 보기" 타임스탬프 링크. 출처 영상·조사 방법·한계는 "참고 정보" 탭에 분리.
- 수입 주의사항: EVE(이부프로펜) 진통제 제외(한국 반입 금지, 2025-04~), 곤약젤리 컵형 반입 불가·튜브형만, 냉장·냉동·신선식품은 현지 소비용, 의약품은 치료제가 아님.
- 레이아웃: **한 화면 단일 스크롤** (별도 패널 스크롤 금지), 카탈로그 작게·상세 크게, 상세는 누른 상품 행 아래로 인라인 확장.
- 로그인 전 화면: 제목·핵심 숫자(돈키호테 141개·편의점 74개·전체 215개)·사이트 설명·로그인 시 할 수 있는 것·주의사항 요약만 보이고, 검색·필터·상품 목록은 로그인 후에만 펼쳐지며 로그아웃하면 소개 화면으로 돌아감.
- 머리말: 배너 일러스트(최상단, 좌우 블리드, 로그인 후 숨김) → 로고(모바일 240px, 흰 둥근 카드, 로그인 후 148px로 축소) → 부제목 "일본 — 돈키호테 141 + 편의점 74"(18px·굵기 800) → 설명 → 숫자 칩 → 사진 → 로그인 카드(마스코트 120px).

## 8. 사용자 규칙 (지킬 것)

- **존댓말로 응대할 것.**
- **개선하기 전에 사용자에게 먼저 물어보고, 사용자가 고른 것만 고칠 것.** 단, 사용자가 직접 "고쳐줘"라고 한 건 바로 진행.
- 사이트 문구는 쉬운 일상 말로 쓸 것. '기기 간 동기화' 같은 기술 용어 금지.
- 모바일 우선 점검 (390px·360px 실측), 데스크톱도 확인.
- 디자인 변경과 실제 게시/업로드는 구분할 것 (외부 게시·계정 변경은 별도 승인).
- 사용자의 직접 보고("샀어", "했어")는 백그라운드의 '미검증' 기록보다 우선. "미확인"을 "미실행"으로 단정하지 말 것.
- 링크는 채팅에서 잘 안 눌리므로 URL은 복사할 수 있는 평문으로 보낼 것.

## 9. 검증 방법 (중요 — 그대로 따를 것)

- 클라우드 브라우저는 390px로 줄일 수 없음 → **Playwright 로컬 서빙 방법**을 쓸 것.
- 방법: export된 html을 로컬에서 서빙 (`python3 -m http.server 8123 --bind 127.0.0.1`), Playwright Chromium headless로 `http://127.0.0.1:8123/donkihote-syopingriseuteu.html` 접속, viewport 390×844, deviceScaleFactor 2, is_mobile. venv는 `/tmp/pw-venv` (없으면 `python3 -m venv /tmp/pw-venv && /tmp/pw-venv/bin/pip install playwright && /tmp/pw-venv/bin/python -m playwright install chromium`).
- **headless Chromium은 라이브 사이트에 닿지 않음** (VM 프록시가 CONNECT 거부, `ERR_TUNNEL_CONNECTION_FAILED`) → 반드시 로컬 서빙.
- 로그인 시드: `add_init_script`로 localStorage에 가짜 JWT 주입. **페이로드는 ASCII만** — `btoa`는 한글에서 에러 (이름 'test' 사용). `exp = now+3600`. 시드 코드는 IIFE로 감쌀 것 (그냥 화살표 함수 문자열은 실행 안 됨).
- 시드 키: 토큰 `jp-shopping-list-google-token-v1`, 사용자 `jp-shopping-list-google-user-v1`, saved/bought/history는 위 6번 키.
- **서버 죽일 때 `pkill -f "http.server 8123"` 금지** — 자기 셸까지 죽임. PID로 죽이거나 `fuser -k 8123/tcp` 사용.

## 10. 현재 상태 (2026-11-20 기준)

- 최신 커밋: `a7ff28d` (NEW 배지 통일). 그 전: `8f850cf` (머리말 비율 다듬기), `e08e4ae` (머리말 '다마바' 교체), `f34db45` (수량 영역 다듬기), `6e23b63` (수량 기능), `577e237` (390px 두 가지 수정), `0fd67ce` (모바일 8가지 수정).
- 사용자의 담은 목록: 12개(돈키호테 7 + 편의점 5), 구매 0개, 삭제 0개, 합계 ¥6,200 (돈키호테 ¥5,276 + 편의점 ¥924).
- **내 기록에 검증용 테스트 이력 9건이 남아 있음** (킷캣 구매/취소 토글 등). 사용자에게 알림済. 실제 사용하면서 밀려나니 지우지 말고, 따로 물어보지도 말 것.
- 테스트로 담은 "킷캣 일본 한정맛"이 사용자의 담은 목록에 남아 있음.
- 주간 업데이트 크론 `weekly-japan-shopping-update` (168시간 간격, 이 채팅으로 보고): 새 한국어 유튜브 돈키호테·드럭스토어·편의점 영상에서 **강력추천 제품만** 추가 (TOP Pick/필수템 또는 여러 영상에서 반복). 약한 언급·광고 의심·관광객용 제품은 제외. 삭제된 제품 재추가 금지. 새로 추가된 제품은 `addedDate` + NEW 배지 7일. 첫 실행 2026-11-16에 23개 추가 완료.
- 간사이 여행(2027-01-12~15, 5명) 숙소는 오사카 NOVI Dotonbori 예약 확정·결제 예정 2027-01-03. 이 쇼핑리스트는 그 여행 준비용으로 시작됨.

## 11. TODO / 열린 항목

- OAuth 동의 화면 앱 이름 "shopping list" → "다마바"로 변경 (Google Cloud 콘솔).
- 가격 미확인 84개 제품의 가격 조사 (UI 작업이 아니라 리서치).
- 내 기록 "더 보기" 버튼 동작 미확인 (이력 적을 때 안 보임).
- 확장: 한국/다른 나라 목록, 맛집 목록 등 (이름·브랜드는 이미 확장 대비됨).
- Muse 내장 영상 생성은 이 계정·지역에서 불가 (403 video_not_available) — 재시도·결제 금지.
