# AI 활용 정리

## 1. 사용 도구

- Claude Code (Sonnet 5)

## 2. 작업 순서

### 2026-07-08 (1차 세션 — 분석 · DDL 확인 · 백엔드)

1. `CLAUDE_APPEND_ONLY.md`, `.claude/rules/development-workflow.md`, `docs/specs/employee-management-requirements.md`, `docs/guides/employee-erd-guide.md`, `ddl/**`, `docker-compose.yml`을 읽고 저장소 현황 분석.
2. `docs/plans/2026-07-08-employee-management-plan.md` 작성 — 기존 DDL 대비 요구사항 갭 분석(메모 컬럼 부재, 이메일 nullable 등) 후 승인 필요 항목 정리.
3. 승인 후 `docker compose up -d postgres` → `ddl/run_all.sql` 적용 → 스키마/제약/트리거를 실제 조회로 확인(DDL 파일 자체는 수정하지 않음).
4. Backend 구현: Node.js(ESM) + Express + `pg` + Zod + winston, Router→Controller→Service→Repository 4계층.
5. curl로 등록/조회/수정/상태변경/이력저장/차단 케이스를 직접 실행해 검증(테스트 데이터는 검증 후 삭제).
6. 이 저장소 실제 스택에 맞는 전용 스킬(`employee-backend-current-stack`, `employee-frontend-current-stack`) 신설 — 기존 `backend-service-architecture`/`frontend-ssr`은 다른 프로젝트(TypeScript+Oracle ORDS) 기준이라 그대로 안 맞았기 때문.
7. git 저장소 초기화, `main`/`feature/employee-management` 브랜치 정리 및 커밋.

### 2026-07-09 (2차 세션 — 프론트엔드 · 최종 검증)

1. 백엔드 구현 상태를 다시 조사(실제 라우트/필드명/응답 envelope/조인 여부/이력 포함 여부)한 뒤, 부서·직책 select 옵션을 채울 조회 API가 없다는 미결 항목을 발견해 사용자에게 처리 방식을 질문 → "부서/직책 목록 API 추가"로 확인받음.
2. `docs/plans/2026-07-09-employee-frontend-plan.md` 작성 → 승인 후 구현 시작.
3. Backend: `GET /departments`, `GET /positions` 최소 추가(기존 5개 API는 무변경, 기존 계층 구조 그대로 따름).
4. `server.js`에 정적 서빙 + `server/routes/pageRoutes.js` 신설.
5. Frontend 3화면(목록/등록/상세·수정) + 상태 변경 UI + 조직 구조 뷰(부서별 그룹 + 상사-부하 들여쓰기) 구현. 프레임워크 추가 없이 Vanilla HTML/CSS + fetch 기반 JS.
6. Docker/Postgres 기동 → 실제 API 호출·DB 조회로 전체 플로우(등록→조회→수정→상태변경→이력저장→차단 케이스→validation 오류)를 curl + psql로 검증. 검증 후 테스트 데이터 삭제, 서버/컨테이너 종료.
7. `docs/reports/ai-usage-summary.md`, `docs/reports/result-checklist.md` 실제 내용으로 갱신(이 문서).

## 3. 사용한 스킬

| 스킬 | 사용 목적 |
|---|---|
| `development-workflow` rule (always-on) | 계획서 작성 → 승인 → 구현 → 검증 → PR 절차, main 직접 커밋 금지 유지 |
| `employee-management-assignment` | 과제 범위(F-01~F-05), 절대 원칙(추측 구현 금지, 기존 파일 유지), 제출물 기준 적용 |
| `employee-backend-current-stack` | 이 저장소 실제 백엔드 스택(순수 JS ESM+Express+pg) 기준 적용 — 범용 `backend-service-architecture`는 다른 프로젝트 기준이라 미적용 |
| `employee-frontend-current-stack` | 이 저장소 실제 프론트 구조(client/pages, client/public, pageRoutes) 기준 적용 — 범용 `frontend-ssr`은 원칙(파편 조립, escapeHtml)만 참고 |
| `writing-plans` / `executing-plans` | 계획서 작성 및 배치 단위 실행·리뷰 체크포인트 |
| `Explore` 서브에이전트 | 기존 백엔드 라우트/필드명/응답 구조를 코드 기준으로 재조사(추측 방지) |

## 4. 승인/질문 이력 (임의 구현 방지)

- 2026-07-08: 백엔드 스택, DDL 보강 범위(메모 컬럼, 이메일 제약), 퇴직일 처리 방식, 상태 이력 매핑 방식 등을 계획서 §6에 명시하고 승인 후 진행.
- 2026-07-09: 부서/직책 select 옵션용 조회 API가 승인된 5개 엔드포인트에 없다는 점을 먼저 사용자에게 질문 → "추가(권장)"로 확인 후 계획서에 반영·구현.
- 두 세션 모두 계획서의 "승인 문구"에 대한 답을 받은 뒤에만 소스를 수정했다.

## 5. 기존 파일 유지 방식

- `ddl/tables/*.sql`, `ddl/functions/F_AUDIT_LOG.sql`, `ddl/run_all.sql`은 이번 프론트엔드 작업에서 전혀 수정하지 않았다(1차 세션에서 이미 반영된 `MEMO` 컬럼/`EMAIL NOT NULL` 상태를 그대로 사용).
- 기존 5개 직원 API(`employeeRoutes.js`, `employeeController.js`, `employeeService.js`, `employeeRepository.js`, `employmentHistoryRepository.js`, `employeeSchemas.js`)는 한 줄도 수정하지 않았다. 부서/직책 리포지토리에는 기존 `findDepartmentById`/`findPositionById` 함수를 유지한 채 `listAll` 함수만 추가했다.
- 기존 `.claude/rules`, `.claude/skills`(과제 스킬 포함)는 그대로 유지, 신규 스킬만 별도 파일로 추가(1차 세션에서 이미 완료).

## 6. 신규/수정 파일 목록 (2026-07-09 세션)

### 신규

- `server/services/departmentService.js`, `server/services/positionService.js`
- `server/controllers/departmentController.js`, `server/controllers/positionController.js`
- `server/routes/departmentRoutes.js`, `server/routes/positionRoutes.js`, `server/routes/pageRoutes.js`
- `client/pages/employee-list.html`, `client/pages/employee-form.html`, `client/pages/employee-detail.html`
- `client/public/css/styles.css`
- `client/public/js/api.js`, `employee-list.js`, `employee-form.js`, `employee-detail.js`
- `docs/plans/2026-07-09-employee-frontend-plan.md`
- `ddl/seed.sql` — 선택 기능(로컬 검증용 샘플 부서/직책 데이터, 재실행해도 중복 insert 안 되게 `not exists` 가드)

### 수정

- `server/repositories/departmentRepository.js` — `listAll` 함수 추가(기존 함수 유지)
- `server/repositories/positionRepository.js` — `listAll` 함수 추가(기존 함수 유지)
- `server/routes/index.js` — `/departments`, `/positions` 라우터 마운트 추가
- `server/server.js` — `express.static` 및 `pageRoutes` 마운트 추가
- `client/pages/employee-list.html` — 이름/부서/상태 필터 UI 추가(F-05, 선택 기능)
- `client/public/js/employee-list.js` — 클라이언트 사이드 필터링 로직 추가(백엔드 API 변경 없음, 기존 목록 데이터를 그대로 필터링)
- `client/public/css/styles.css` — `.filter-row` 스타일 추가

## 7. 실행 방법

```bash
cd /home/anseongu/projects/spacework
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"   # node v18+ 필요 (ESM)

docker compose up -d postgres
# 컨테이너를 새로 만든 경우에만 DDL 적용 필요:
docker compose cp ddl postgres:/ddl
docker compose exec -T -w /ddl postgres psql -U emko -d emko -v ON_ERROR_STOP=1 -f run_all.sql

npm install

# (선택) 부서/직책 샘플 데이터 — 최초 1회만 실행하면 됨
docker compose exec -T -w /ddl postgres psql -U emko -d emko -f seed.sql

npm run dev   # 또는 npm start
# http://localhost:3000            직원 목록 (이름/부서/상태 필터 포함)
# http://localhost:3000/register   직원 등록
# http://localhost:3000/detail?id=<emp_id>   직원 상세/수정
```

주의: 부서/직책 데이터가 없으면 등록 화면의 select가 빈 상태로 보인다. `ddl/run_all.sql`(스키마 전용)에는 seed 데이터가 없으므로, `ddl/seed.sql`을 한 번 실행하거나 `T_DEPARTMENT`/`T_POSITION`에 직접 최소 1건 이상 입력해야 한다.

## 8. 검증 결과 요약 (자세한 항목은 `result-checklist.md` 참고)

- 부서/직책/직원 등록 → 목록/상세 조회(부서명·직책명·상사명 join 확인) → 수정 → 상태 변경(ACTIVE↔LEAVE, →RESIGNED) → 이력 저장 → `RESIGNED`에서 전환 차단까지 curl로 전체 플로우 실행.
- `docker compose exec postgres psql`로 `T_EMPLOYEE`, `T_EMPLOYMENT_HISTORY`에 실제 행이 쌓이는 것을 직접 조회로 확인.
- 필수값 누락, 이메일 형식 오류, 사번 중복, 자기 자신 상사 지정 등 validation 실패 케이스도 모두 의도한 에러 메시지로 차단됨을 확인.
- 정적 페이지(`/`, `/register`, `/detail?id=`)와 css/js 정적 자원이 200으로 응답하고 각 화면에 필요한 DOM 요소(id)가 모두 존재함을 확인(필터 UI 3종 id 포함).
- 이름/부서/상태 필터가 적용된 목록 데이터를 다른 부서·다른 상태의 직원 2건으로 구분해 실제 API 응답 기준으로 필터 로직의 입력값이 맞는지 확인(브라우저 렌더링 자체는 §9 한계 참고).
- 검증에 사용한 테스트 데이터(직원 4건, 이력 3건)는 검증 완료 후 모두 삭제했다. 부서 3건/직책 3건은 로컬 실행 편의를 위해 남겨뒀고, 앱 서버와 postgres 컨테이너는 종료했다.

## 9. 느낀 점 / 한계

- 이 실행 환경(sandboxed WSL 세션)에는 실제 브라우저 자동화 도구(Playwright/Puppeteer 등)가 없어, 화면을 클릭하며 눈으로 확인하는 검증은 하지 못했다. 대신 각 API를 curl로 직접 호출하고 응답/DB 상태를 대조했으며, 각 HTML 페이지의 구조(필요한 입력 필드·id)가 실제로 서빙되는지, JS 문법 오류가 없는지(`node --check`)는 확인했다. **사용자가 브라우저로 직접 최종 클릭 검증(특히 필터 동작)을 한 번 더 하는 것을 권장한다.**
- 백엔드 응답이 snake_case(`emp_no`, `dept_id` 등), 요청 body는 camelCase(`empNo`, `deptId` 등)로 서로 다른 컨벤션을 쓴다. 백엔드 수정 범위가 아니라 프론트 JS에서 이 차이를 그대로 다뤘다(코드 내 필드명이 두 가지로 섞여 있으니 유지보수 시 주의).
- 검색/필터는 백엔드 API를 바꾸지 않고 이미 불러온 목록을 클라이언트에서 필터링하는 방식으로 구현했다 — 직원 수가 매우 많아지면 서버 사이드 필터링으로 바꾸는 게 나을 수 있으나, 이번 과제 범위(대용량 페이지네이션 고도화 제외)에는 맞는 선택이라고 판단했다.
- 조직 구조 뷰는 별도 시각화 라이브러리 없이 부서별 그룹 + 상사-부하 들여쓰기로만 표현했다(요구사항 §7에서 복잡한 시각화 라이브러리는 제외 범위로 명시).
