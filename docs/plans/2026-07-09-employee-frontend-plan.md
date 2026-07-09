# 2026-07-09 직원관리 프론트엔드 구현 계획서

> 승인 전에는 소스 코드를 수정하지 않는다.

## 0. 현재 상태 (조사 결과)

- 백엔드는 `feature/employee-management` 브랜치에 구현 완료 상태다 (커밋 `9d2b015`).
- 실제 서버: `server/server.js` (Express, ESM), `npm run dev` → `node --watch server/server.js`, 포트는 `.env`의 `APP_PORT`(기본 3000).
- 정적 파일 서빙(`express.static`)과 `client/` 디렉터리는 아직 없음 — 이번 작업에서 신설한다.
- 승인된 기존 엔드포인트 (모두 `/employees` 하위):

| Method | Path | 설명 |
|---|---|---|
| GET | `/employees` | 목록 (부서명/직책명/상사명 join, snake_case 응답) |
| POST | `/employees` | 등록 (요청 body는 camelCase) |
| GET | `/employees/:id` | 상세 (응답에 `history` 배열 포함) |
| PATCH | `/employees/:id` | 수정 (empName/email/phone/deptId/positionId/managerId/memo) |
| PATCH | `/employees/:id/status` | 상태 변경 (status/effectiveDate/remark) |

- **응답 필드 표기 불일치 확인**: 요청 body는 camelCase(`empNo`, `deptId` 등), 응답 데이터는 snake_case(`emp_no`, `dept_id`, `dept_name` 등) 그대로 내려온다. 프론트 JS에서 이 차이를 그대로 다룬다(백엔드 수정 범위 아님).
- 공통 응답 envelope: `{ success, data, message, errors? }`. `errors`는 zod `flatten().fieldErrors` 형태(필드명 → 메시지 배열).
- **미해결 항목(사용자 확인 완료)**: 부서/직책 select 옵션을 채울 조회 API가 없었음 → **사용자가 "부서/직책 목록 API 추가"를 선택**. 이번 계획에 포함한다.

## 1. 목표

`employee-frontend-current-stack` 스킬 기준으로, 기존 5개 API에 붙는 화면 3개(목록/등록/상세·수정)와 상태 변경 UI, 조직 구조 확인 영역을 구현한다. 프레임워크 추가 없이 Vanilla HTML/CSS + fetch 기반 vanilla JS로 만든다.

## 2. 백엔드 추가 범위 (승인 필요 — 최소 변경)

기존 5개 엔드포인트는 건드리지 않는다. 아래 2개를 **신규 추가**한다.

| Method | Path | 설명 |
|---|---|---|
| GET | `/departments` | 부서 목록 (`dept_id`, `dept_name` 등, `USE_YN='Y'`만) |
| GET | `/positions` | 직책 목록 (`position_id`, `position_name`, `position_level`, `USE_YN='Y'`만) |

- 기존 계층 구조(Router→Controller→Service→Repository)를 그대로 따른다.
- `departmentRepository.js`/`positionRepository.js`에 이미 있는 단건 조회 로직 옆에 목록 조회 함수만 추가(기존 함수는 유지).
- 신규 파일: `server/routes/departmentRoutes.js`, `server/routes/positionRoutes.js`, 대응하는 controller/service 최소 구현. 응답 envelope은 기존 방식과 동일하게 맞춘다(snake_case 유지, 기존 컨벤션 따름).
- `routes/index.js`에 두 라우터 마운트 추가.

## 3. 프론트엔드 구현 범위

### 3.1 디렉터리 (신규)

```
client/
 ├── pages/
 │    ├── employee-list.html      # 목록 + 상태 배지 + 조직 구조 보기 + 등록 버튼
 │    ├── employee-form.html      # 등록 폼
 │    └── employee-detail.html    # 상세/수정 폼 + 상태 변경 UI + 이력 표시
 └── public/
      ├── css/styles.css          # 공통 스타일, 상태 배지 클래스(ACTIVE/LEAVE/RESIGNED)
      └── js/
           ├── api.js              # fetch 래퍼, envelope 파싱, 에러 메시지 추출
           ├── employee-list.js
           ├── employee-form.js
           └── employee-detail.js
```

### 3.2 서버 변경

- `server/server.js`: `app.use(express.static(path.join(process.cwd(), 'client/public')))` 한 줄 추가.
- `server/routes/pageRoutes.js` 신설: `GET /`, `/employees-page`(또는 `/`), `/employees-page/new`, `/employees-page/:id` 등 페이지 라우트가 `client/pages/*.html`을 `res.sendFile`로 응답. API 라우트(`/employees`, `/departments`, `/positions`)와 경로가 겹치지 않도록 페이지 경로는 별도 prefix로 분리한다(예: 정적 페이지는 `/`, `/new`, `/:id` 형태를 `client` 서빙 전용으로 두고 API는 그대로 `/employees` 유지 — 상세 경로는 구현 시 충돌 없는지 재확인).

### 3.3 화면별 내용

**목록 화면 (`employee-list.html` + `employee-list.js`)**
- `GET /employees` 호출 → 표로 렌더링: 사번/이름/이메일/부서/직책/직속상사/상태 배지/입사일.
- 상태 배지: `ACTIVE`=재직(초록 계열), `LEAVE`=휴직(회색/노랑 계열), `RESIGNED`=퇴직(빨강/톤다운 계열) — CSS 클래스로 구분.
- 등록 버튼(→ 등록 화면 이동), 각 행에 상세 이동 버튼.
- **조직 구조 영역**: 별도 시각화 라이브러리 없이, 목록 데이터를 부서별로 그룹핑하고 그룹 내에서 상사-부하 관계를 들여쓰기(indent)로 표시하는 단순 트리 뷰를 같은 페이지 하단(또는 토글 섹션)에 추가한다. 이미 목록 응답에 `dept_name`, `manager_id`, `manager_name`이 포함되어 있으므로 **추가 API 없이 클라이언트에서 조합**한다.
- 상태 변경 직후에는 상세 화면에서 처리하고 목록으로 돌아오면 다시 `GET /employees`를 호출해 배지가 최신 상태로 보이게 한다(목록 페이지 자체에 상태 변경 버튼은 두지 않음 — 요구사항상 상태 변경 UI는 상세 화면 담당).

**등록 화면 (`employee-form.html` + `employee-form.js`)**
- 필드: 사번/이름/이메일/입사일/상태(필수), 부서/직책(select, `GET /departments`, `GET /positions`로 채움), 전화번호/직속상사(select, `GET /employees`에서 이름만 추출)/메모(선택).
- 상사 select는 "없음"(자기 자신이 없으므로 전체 직원 목록에서 선택, 등록 시점엔 자기참조 검증 대상 없음).
- `POST /employees` 호출(camelCase body). 실패 시 `errors` 필드를 필드별 메시지로 매핑해 입력창 아래 표시.
- 성공 시 목록 화면으로 이동.

**상세/수정 화면 (`employee-detail.html` + `employee-detail.js`)**
- `GET /employees/:id` 호출 → 상세 정보 + `history` 배열 표시(변경일/변경유형/비고).
- 수정 폼: 이름/이메일/전화/부서/직책/직속상사(자기 자신 제외)/메모 → `PATCH /employees/:id`.
- 상태 변경 UI: 현재 상태에 따라 허용되는 다음 상태만 버튼/select로 노출(`ACTIVE`→`LEAVE`,`RESIGNED` / `LEAVE`→`ACTIVE`,`RESIGNED` / `RESIGNED`→ 없음, 버튼 비활성화). `PATCH /employees/:id/status` 호출 후 응답으로 받은 최신 데이터로 화면 갱신(배지, 이력 목록 다시 렌더링).

### 3.4 XSS 방어

- 클라이언트 JS에서 서버 응답값을 렌더링할 때 `textContent` 우선 사용. 표 셀처럼 구조 조립이 필요한 곳만 `innerHTML`을 쓰되, 값 삽입 전 이스케이프 함수(`escapeHtml`)를 거친다. `client/public/js/api.js` 또는 별도 `util.js`에 `escapeHtml` 유틸을 둔다.

## 4. 구현 순서

1. 백엔드: `GET /departments`, `GET /positions` 추가 (§2)
2. `server.js`에 static 서빙 추가, `pageRoutes.js` 신설
3. 목록 화면 (표 + 배지 + 조직 구조 뷰)
4. 등록 화면 (폼 + validation 에러 매핑)
5. 상세/수정 화면 (수정 폼 + 상태 변경 UI + 이력)
6. 브라우저 수동 검증 (아래 §5)

## 5. 검증 체크리스트

- [ ] `GET /departments`, `GET /positions` 정상 응답
- [ ] 목록 화면 접속, 표에 주요 필드 + 상태 배지 표시
- [ ] 조직 구조 영역에서 부서별/상사-부하 구조 확인 가능
- [ ] 등록 폼 제출 → DB 저장 → 목록에 반영
- [ ] 필수값 누락/형식 오류 시 필드별 에러 메시지 표시
- [ ] 상세 화면에서 정보 수정 → 반영 확인
- [ ] 상태 변경(ACTIVE→LEAVE→ACTIVE→RESIGNED) 후 상세 화면과 목록 배지가 모두 갱신됨
- [ ] RESIGNED 상태에서는 다른 상태로 전환 버튼이 비활성화되어 있음
- [ ] 상태 변경 이력이 상세 화면에 표시됨

## 6. 범위 제외 (요구사항 §7과 동일하게 유지)

- 로그인/권한, 배포, 외부 API, 파일 업로드
- 복잡한 조직도 시각화 라이브러리(D3 등) — 단순 그룹핑/들여쓰기로 대체
- 검색/필터, seed 데이터는 이번 범위에 포함하지 않음(필수 화면 우선, 여유 있으면 추후 별도 승인 후 진행)

## 7. 승인 문구

이 계획대로 `GET /departments`/`GET /positions`를 추가하고, `client/` 프론트엔드 화면 3종 + 상태 변경 UI + 조직 구조 뷰를 구현해도 될까요?
