---
name: employee-frontend-current-stack
description: "이 저장소(spacework)의 실제 프론트엔드 스택 기준. 기존 frontend-ssr 스킬은 다른 프로젝트(kist, TypeScript+services/web 모노레포) 기준이라 이 저장소에는 그대로 적용하지 않는다. 직원관리 과제 화면(목록/등록/상세·수정)을 구현할 때는 이 스킬을 기준으로 한다."
---

# 직원관리 과제 — 프론트엔드 현재 스택 표준

`frontend-ssr` 스킬 문서가 가정하는 프로젝트(TypeScript, `services/web` 모노레포, `ssrRenderer.ts`)는 이 저장소와 다르다. 이 저장소는 백엔드가 `employee-backend-current-stack` 기준(순수 JS ESM + Express)으로 이미 구현되어 있고, 프론트엔드는 **그 서버가 정적/HTML을 직접 서빙하는 단일 프로젝트** 구조로 붙인다. `frontend-ssr`에서는 **원칙만** 가져온다: 프레임워크 없는 HTML 조립, `escapeHtml`을 통한 XSS 방어. 파일 경로·언어·빌드 방식은 이 문서를 따른다.

## 실제/예정 스택

- 템플릿 엔진·React/Vue 등 프레임워크 **추가하지 않는다**. 순수 HTML/CSS + 최소한의 vanilla JS(`fetch`)로 구성한다.
- 화면은 서버(`server/server.js`)가 Express `express.static` + 간단한 HTML 조립 함수로 서빙한다. 별도 빌드 스텝(webpack/vite 등) 없음 — 이 과제는 "로컬 실행만 확인, 배포 없음"이 범위이므로 `frontend-ssr`의 dev/prod 분기 빌드(`build.js`, `dist/web`)는 **적용하지 않는다**. 개발 중 소스를 그대로 서빙한다.
- 화면에서 필요한 데이터는 이미 구현된 JSON API(`GET/POST/PATCH /employees`)를 `fetch`로 호출해 채운다. 서버가 페이지를 렌더링할 때 최초 데이터까지 박아 넣는 완전 SSR은 필수가 아니다 — 목록 초기 로딩만 서버 사이드로 하거나, 클라이언트에서 `fetch` 후 렌더링해도 된다(택 1, 과하게 설계하지 않는다).

## 디렉터리 구조 (신규 예정)

```
client/
 ├── pages/
 │    ├── employee-list.html      # 목록 화면 뼈대 (표 + 상태 배지 + 등록 버튼)
 │    ├── employee-form.html      # 등록 화면 뼈대 (폼)
 │    └── employee-detail.html    # 상세/수정 화면 뼈대 (수정 폼 + 상태 변경 UI + 이력)
 ├── public/
 │    ├── css/styles.css          # 공통 스타일 (상태 배지 클래스 포함)
 │    └── js/
 │         ├── api.js              # fetch 래퍼 (JSON Envelope 파싱, 에러 메시지 추출)
 │         ├── employee-list.js
 │         ├── employee-form.js
 │         └── employee-detail.js
 └── layouts/
      └── base.html                # 공통 헤더/네비게이션 (선택 — 화면이 3개뿐이라 생략 가능)
```

`server/server.js`의 정적 서빙 지점(이미 정해진 미들웨어 순서의 4번)에 아래 한 줄을 추가한다:
```js
app.use(express.static(path.join(process.cwd(), 'client/public')));
```
페이지 라우팅은 `server/routes/`에 페이지 전용 라우터(`pageRoutes.js`)를 추가해 `client/pages/*.html`을 `res.sendFile` 또는 최소 조립 함수로 응답한다. 기존 `employeeRoutes.js`(API)는 건드리지 않는다 — 페이지 라우트와 API 라우트는 분리 마운트한다(`/` 하위 페이지, `/employees` 하위 API).

## XSS 방어 (그대로 적용)

- 서버에서 동적 데이터를 HTML 문자열에 직접 삽입하는 지점이 있다면 `frontend-ssr`의 `escapeHtml` 유틸을 그대로 가져와 `server/utils/escapeHtml.js`에 둔다.
- 클라이언트 JS(`api.js` 등)에서 `innerHTML`로 서버 응답 데이터를 렌더링할 때도 반드시 텍스트 이스케이프를 거친다(예: `textContent` 우선 사용, 불가피하게 `innerHTML` 써야 하면 이스케이프 함수 통과).

## 화면별 요구사항 (요구사항 문서 §3 기준, 임의 추가 금지)

- **목록 화면**: 표(사번/이름/이메일/부서/직책/직속상사/상태/입사일) + 상태 배지(`ACTIVE`=재직/`LEAVE`=휴직/`RESIGNED`=퇴직) + 등록 버튼 + 상세 이동 버튼. 검색/필터는 선택 기능이므로 여유 있을 때만.
- **등록 화면**: 폼(사번/이름/이메일/부서/직책/상태/입사일 필수, 전화번호/직속상사/메모 선택) + validation 오류 메시지(서버 `errors` 필드를 필드별로 매핑) + 저장 성공 시 목록으로 이동.
- **상세/수정 화면**: 상세 정보 + 수정 폼(이름/이메일/전화/부서/직책/직속상사/메모) + 상태 변경 UI(현재 상태에서 허용되는 다음 상태만 선택 가능하게, 서버가 최종 검증) + 상태 변경 이력 표시(`GET /employees/:id` 응답의 `history` 배열 사용).
- 부서/직책/직속상사 선택 UI(select)는 목록 데이터를 채워야 하므로, 이 화면 구현 단계에서 **부서/직책 조회용 보조 API가 필요한지 여부를 먼저 사용자에게 확인**한다(현재 승인된 API 목록엔 없음 — 임의로 새 엔드포인트를 추가하지 않는다).

## 이 스킬이 하지 않는 것 (참고 스킬로 위임)

- API 응답 규격·검증·트랜잭션 등 서버 내부 로직 → `employee-backend-current-stack`.
- `frontend-ssr`/`backend-service-architecture`는 다른 프로젝트 기준이므로 원칙(파편 조립, XSS 방어)만 참고하고 파일 경로·언어·빌드 파이프라인은 따르지 않는다.
