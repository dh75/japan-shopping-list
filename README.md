# 일본 쇼핑리스트 — GitHub Pages 공유용 묶음

2026-11-09 기준 합친 리스트(돈키호테 119개 + 편의점 73개 = 192개) 그대로입니다.
사진·가격·근거 링크·타임스탬프 영상 바로보기가 들어 있습니다.

## 들어 있는 것

- `index.html` — 리스트 페이지 본문
- `assets/` — 제품 사진 195개 (상대 경로로 연결돼 있어 폴더 구조만 유지하면 됩니다)

## GitHub Pages로 올리는 방법 (5분)

1. GitHub에서 `New repository` → 이름 예: `japan-shopping-list` → **Public**으로 만들기
   (무료 계정은 공개 저장소만 Pages로 공유할 수 있습니다)
2. 이 폴더 안의 파일(`index.html` + `assets` 폴더)을 통째로 올리기
   - 터미널: 폴더 안에서 `git init` → `git add .` → `git commit -m "일본 쇼핑리스트"` → `git branch -M main` → `git remote add origin https://github.com/사용자명/japan-shopping-list.git` → `git push -u origin main`
   - 또는 저장소 페이지에서 `Add file > Upload files`로 드래그 (폴더째 가능)
3. 저장소 `Settings > Pages` → Source `Deploy from a branch` → Branch `main`, 폴더 `/ (root)` → 저장
4. 1~2분 뒤 주소가 나옵니다: `https://사용자명.github.io/japan-shopping-list/`

## 공유하기 전에 알아둘 것

- **담기·삭제는 각자 브라우저에만 저장**됩니다. 링크를 받은 사람은 전체 192개를 그대로 보고, 그분이 삭제해도 토랑님 목록에는 영향이 없습니다.
- **토랑님이 삭제한 상품은 이 묶음에 그대로 들어 있습니다.** 삭제 저장이 지금 쓰시는 브라우저에만 있어서, 공유용 페이지에는 삭제가 반영되지 않습니다. 삭제한 걸 공유본에서도 빼고 싶으면, 페이지의 '삭제 목록 복사'로 목록을 복사해 알려주세요. 제외 목록에 넣어 다시 묶어 드릴게요.
- 주간 업데이트(첫 실행 2026-11-16 월요일 12:47 KST)로 새 제품이 추가되면, 이 묶음도 그때 다시 만들어야 최신본이 됩니다. 삭제한 제품은 업데이트에서 다시 추가되지 않습니다.
- 공개 저장소라 링크를 아는 사람은 누구나 볼 수 있습니다.
