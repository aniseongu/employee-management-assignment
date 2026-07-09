# 결과 화면 및 검증 체크리스트

> 2026-07-09 세션에서 curl + psql로 실제 실행 확인한 결과. 화면 캡처(스크린샷)는 이 세션 환경에 브라우저 자동화 도구가 없어 만들지 못했다 — §5 한계 참고.

## 1. 실행 환경

- [x] Docker Postgres 실행 (`docker compose up -d postgres`, 컨테이너 `spacework-postgres-1` 정상 기동 확인)
- [x] DDL 적용 확인 (`\dt`로 `t_department`, `t_position`, `t_employee`, `t_employment_history` 4개 테이블 존재 확인 — 기존 볼륨에 이미 적용되어 있던 상태)
- [x] 웹 서버 실행 (`node server/server.js`, `GET /health` → `{"success":true,"data":{"status":"ok"}}`)
- [ ] 브라우저 접속 (직접 클릭 확인 아님 — curl로 각 페이지의 HTML 응답과 필수 DOM 요소 존재만 확인. §5 참고)

## 2. 화면 캡처 목록

이 세션에는 화면 캡처 도구가 없어 스크린샷 파일은 생성하지 못했다. 대신 각 화면이 실제로 어떤 데이터로 채워지는지 API 응답으로 확인했다.

| 항목 | 캡처 여부 | 확인 방법 | 비고 |
|---|---:|---|---|
| 직원 목록 화면 | [ ] | `GET /` 200 + `GET /employees` 응답에 부서명/직책명/상사명 join 확인 | 스크린샷 없음 |
| 직원 등록 화면 | [ ] | `GET /register` 200 + `POST /employees`로 등록·validation 오류 확인 | 스크린샷 없음 |
| 직원 상세/수정 화면 | [ ] | `GET /detail?id=` 200 + `GET/PATCH /employees/:id` 수정 전/후 응답 대조 | 스크린샷 없음 |
| 상태 변경 전 화면 | [ ] | 상태 변경 전 `GET /employees/:id` 응답(`emp_status: ACTIVE`) | 스크린샷 없음 |
| 상태 변경 후 화면 | [ ] | 상태 변경 후 응답(`emp_status: LEAVE`) + 목록 재조회 시 배지 값 변경 확인 | 스크린샷 없음 |
| DB 저장 확인 | [x] | `docker compose exec postgres psql` 로 `t_employee`, `t_employment_history` 직접 조회 | 아래 §4 결과 참고 |
| 상태 이력 확인 | [x] | 상세 응답 `history` 배열 + DB 직접 조회로 이중 확인 | 아래 §4 결과 참고 |

## 3. 기능 체크리스트

- [x] 목록에 직원 주요 필드(사번/이름/이메일/부서/직책/직속상사/입사일)가 보인다 — `GET /employees` 응답 필드 확인.
- [x] 상태가 배지로 보인다 — 프론트 `statusBadgeHtml()`이 `ACTIVE/LEAVE/RESIGNED`를 재직/휴직/퇴직 배지 클래스로 렌더링. 렌더링 로직은 코드 리뷰로 확인, 실제 브라우저 렌더 결과는 미확인.
- [x] 직원 등록이 된다 — `POST /employees`로 2건 등록, `emp_id` 발급 및 응답 확인.
- [x] 등록 validation이 동작한다 — 필수값 누락(사번/이메일/입사일 등), 이메일 형식 오류, 사번 중복 모두 `400 + errors` 응답으로 차단 확인.
- [x] 직원 상세 조회가 된다 — `GET /employees/:id` 응답에 상세 필드 + `history` 배열 확인.
- [x] 직원 수정이 된다 — `PATCH /employees/:id`로 전화번호/메모 수정 후 응답에 반영됨 확인.
- [x] 재직 → 휴직이 된다 — `PATCH /employees/:id/status {status:"LEAVE"}` 성공, `emp_status`가 `LEAVE`로 변경.
- [x] 휴직 → 재직이 된다 — `LEAVE → ACTIVE` 성공.
- [x] 재직/휴직 → 퇴직이 된다 — `ACTIVE → RESIGNED` 성공(`effectiveDate` 반영).
- [x] 퇴직 → 재직/휴직이 막힌다 — `RESIGNED → ACTIVE` 시도 시 `400, "RESIGNED 상태에서 ACTIVE 상태로 변경할 수 없습니다."`로 차단 확인.
- [x] 상태 변경 이력이 저장된다 — 상태 변경 3회(`LEAVE`/`RETURN`/`RESIGN`)가 `T_EMPLOYMENT_HISTORY`에 각각 1건씩, 총 3건 insert됨을 DB 직접 조회로 확인.
- [x] PostgreSQL에 실제 데이터가 저장된다 — §4 결과 참고.
- [x] 자기 자신을 직속상사로 지정할 수 없다 — `PATCH /employees/:id {managerId: 본인ID}` 시도 시 차단 확인.
- [x] 조직 구조를 볼 수 있는 영역이 있다 — 목록 화면에 부서별 그룹 + 상사-부하 들여쓰기 트리 뷰 추가(코드 리뷰로 확인, 실제 렌더링은 미확인).
- [x] (선택) 이름 검색이 된다 — `employee-list.js`의 `applyFilters()`가 `emp_name` 대소문자 무관 부분일치로 필터링(로직 검토 + `node --check` 문법 확인, 실제 입력 이벤트로 화면 갱신되는 것은 미확인).
- [x] (선택) 부서 필터가 된다 — `filter-dept` select를 `GET /departments`로 채우고 `dept_id` 일치 여부로 필터링.
- [x] (선택) 상태 필터가 된다 — `filter-status` select(전체/재직/휴직/퇴직)로 `emp_status` 일치 여부 필터링.
- [x] (선택) 로컬 검증용 샘플 데이터(`ddl/seed.sql`)가 있다 — 부서 3건/직책 3건, 재실행해도 중복 insert 안 되는 것을 실제로 두 번 실행해 확인(두 번째 실행에서 `INSERT 0 0`).

## 4. DB 체크리스트

검증에 사용한 임시 데이터: 부서 2건(개발팀/인사팀), 직책 2건(팀장/사원), 직원 2건(E001 팀장, E002 사원·E001의 부하), 상태변경 3건(LEAVE→RETURN→RESIGN). 검증 완료 후 전부 삭제했다.

- [x] `T_DEPARTMENT` 데이터 확인 — insert 후 `select`로 2건 조회됨.
- [x] `T_POSITION` 데이터 확인 — insert 후 `select`로 2건 조회됨.
- [x] `T_EMPLOYEE` 데이터 확인 — `POST /employees` 실행 후 `select`로 2건 조회됨(부서/직책/상사 FK 값 포함).
- [x] `T_EMPLOYMENT_HISTORY` 데이터 확인 — 상태 변경 3회 후 `select`로 3건 조회됨(`change_type`이 `LEAVE`/`RETURN`/`RESIGN`으로 정확히 매핑).
- [x] FK 제약 동작 확인 — 존재하지 않는 부서/직책 ID로 등록 시도 시 앱 레벨에서 `400 존재하지 않는 부서입니다` 등으로 차단(서비스 계층에서 FK 대상 존재 여부를 먼저 검사).
- [ ] unique 제약 동작 확인 — 사번 중복은 애플리케이션 레벨 조회(`findByEmpNo`)로 차단하는 것을 확인했으나, DB `UNIQUE` 제약(`EMP_NO`)이 직접 걸리는 것까지는 별도로 재확인하지 않음(기존 DDL에 `UK EMP_UUID`, `UK EMP_NO`로 명시되어 있어 존재 자체는 계획서 §2.1에서 확인됨).
- [x] 상태 CHECK 제약 동작 확인 — 허용되지 않는 상태값(`ACTIVE`/`LEAVE`/`RESIGNED` 외)은 zod validation에서 먼저 막히므로 DB CHECK까지 도달하는 경로는 테스트하지 않았으나, 상태 전이 규칙(앱 레벨)은 위 §3에서 확인 완료.

## 5. 남은 한계

- **실제 브라우저 클릭 검증 미완료**: 이 작업을 수행한 환경에는 Playwright/Puppeteer 같은 브라우저 자동화 도구가 없어, 화면을 열고 클릭하며 확인하는 절차는 수행하지 못했다. 대신 각 페이지의 HTTP 응답(200)과 페이지에 필요한 DOM 요소(`id` 속성) 존재, 그리고 그 화면이 호출하는 API의 실제 동작을 curl로 전부 확인했다. **사용자가 로컬에서 브라우저로 한 번 더 클릭 검증하는 것을 권장한다.**
- **화면 캡처 없음**: 위와 같은 이유로 스크린샷 파일을 생성하지 못했다. 제출물에 화면 캡처가 필요하다면 사용자가 직접 브라우저에서 캡처해야 한다.
- **부서/직책 seed는 선택 실행**: `ddl/run_all.sql`(스키마 전용)에는 데이터가 없다. `ddl/seed.sql`을 별도로 실행하거나(권장) 직접 최소 1건 이상 입력해야 등록 화면의 select가 채워진다.
- **검색/필터는 클라이언트 사이드**: 백엔드 API에 필터 파라미터를 추가하지 않고, 이미 불러온 목록을 브라우저에서 필터링하는 방식으로 구현했다. 직원 수가 아주 많아지면 서버 사이드 필터링이 더 적합할 수 있다.
- **snake_case/camelCase 혼용**: 백엔드 응답(snake_case)과 요청(camelCase) 컨벤션이 다른 상태를 그대로 프론트에서 다뤘다. 백엔드를 새로 건드리는 것은 승인 범위 밖이라 프론트 쪽에서 흡수했다.
