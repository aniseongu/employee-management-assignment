# 2026-07-08 직원관리 시스템 구현 계획서

> 이 문서는 현재 저장소를 실제로 분석한 뒤 갱신한 계획서다.
> 승인 전에는 소스 코드를 수정하지 않는다.

> **2026-07-08 재검증**: `ddl/tables/*.sql` 4개 파일, `ddl/functions/F_AUDIT_LOG.sql`, `ddl/run_all.sql`, `docker-compose.yml`, `.claude/rules/development-workflow.md`, `.claude/skills/employee-management-assignment/SKILL.md`, `docs/specs/employee-management-requirements.md`, `docs/guides/employee-erd-guide.md`, `CLAUDE_APPEND_ONLY.md`를 다시 읽고 아래 §2의 분석 내용이 실제 파일 상태와 일치함을 확인했다. `T_EMPLOYEE.EMAIL`은 이미 `not null`이고 `MEMO text` 컬럼도 이미 존재한다 (Step 1 반영 상태 유지, UNIQUE는 미적용 상태 그대로). 저장소 루트에는 여전히 `package.json`이 없고 `server/`, `client/` 등 애플리케이션 코드도 없다 — Backend/Frontend는 아직 시작 전이다. §6 승인 필요 항목은 그대로 유효하며, 아직 사용자 승인을 받지 않았으므로 이번 세션에서도 코드/DDL은 수정하지 않는다.

## 0. 저장소 현황 (분석 결과)

- 이 저장소는 아직 **애플리케이션 코드가 없는 상태**다. `package.json`, `server/`, `client/` 등은 존재하지 않는다.
- 존재하는 것: `.claude/rules`, `.claude/skills`(6개 도메인 스킬 + 과제 스킬), `ddl/`(4개 테이블 + 감사 함수), `docker-compose.yml`(Postgres 16.4 + pgAdmin), `.env`(DB_PASSWORD, PGADMIN_PASSWORD), `docs/`(spec·guide·plan·report 템플릿).
- `.claude/skills/README.md`는 "이 프로젝트는 Oracle ORDS를 쓰고 PostgreSQL DB 객체를 직접 만들지 않는다"는 매핑 노트를 담고 있으나, 이는 스킬을 가져온 **원본 프로젝트(kist) 기준 설명**이다. 실제 이 저장소는 `docker-compose.yml`과 `ddl/`이 증명하듯 **PostgreSQL 직접 사용** 구조이므로, `db-development-postgres` 스킬(별도 존재)과 `backend-service-architecture`/`frontend-ssr`의 범용 본문을 이 프로젝트에 맞게 적용한다. README의 ORDS 관련 서술은 이번 과제에는 적용하지 않는다.
- `package.json`이 없으므로 **백엔드 스택은 이번에 새로 결정**해야 한다 (아래 §6 승인 필요 항목 참고).

## 1. 목표

기존 직원 구성도 ERD/DDL(`ddl/tables/T_DEPARTMENT.sql`, `T_POSITION.sql`, `T_EMPLOYEE.sql`, `T_EMPLOYMENT_HISTORY.sql`)을 기준으로 PostgreSQL 기반 직원관리 웹사이트를 구현한다.

필수 기능:

- 직원 목록 조회
- 직원 등록
- 직원 상세 조회
- 직원 수정
- 직원 상태 변경 (`ACTIVE`/`LEAVE`/`RESIGNED`)
- 상태 변경 이력 저장 (`T_EMPLOYMENT_HISTORY`)
- 부서/직책/직속상사 관계를 통한 조직 구조 표현
- 로컬 실행 및 검증 (배포 없음)

## 2. 기존 DDL 분석

### 2.1 실제 컬럼/제약 (guide의 mermaid 초안과 명칭이 다름 — DDL이 기준)

| 테이블 | 주요 컬럼 | PK/UK | FK | CHECK |
|---|---|---|---|---|
| `T_DEPARTMENT` | `DEPT_ID`, `DEPT_UUID`, `DEPT_NAME`, `PARENT_DEPT_ID`, `USE_YN` | PK `DEPT_ID`, UK `DEPT_UUID` | `PARENT_DEPT_ID` → 자기참조 | `USE_YN in ('Y','N')` |
| `T_POSITION` | `POSITION_ID`, `POSITION_UUID`, `POSITION_NAME`, `POSITION_LEVEL`, `USE_YN` | PK, UK `POSITION_UUID`, UK `POSITION_NAME` | 없음 | `USE_YN in ('Y','N')` |
| `T_EMPLOYEE` | `EMP_ID`, `EMP_UUID`, `EMP_NO`, `EMP_NAME`, `EMAIL`, `PHONE`, `HIRE_DATE`, `DEPT_ID`, `POSITION_ID`, `MANAGER_ID`, `EMP_STATUS` | PK, UK `EMP_UUID`, UK `EMP_NO` | `DEPT_ID`→`T_DEPARTMENT`, `POSITION_ID`→`T_POSITION`, `MANAGER_ID`→자기참조 | `EMP_STATUS in ('ACTIVE','LEAVE','RESIGNED')` |
| `T_EMPLOYMENT_HISTORY` | `HISTORY_ID`, `HISTORY_UUID`, `EMP_ID`, `CHANGE_TYPE`, `DEPT_ID`, `POSITION_ID`, `EFFECTIVE_DATE`, `REMARK` | PK, UK `HISTORY_UUID` | `EMP_ID`→`T_EMPLOYEE`, `DEPT_ID`→`T_DEPARTMENT`, `POSITION_ID`→`T_POSITION` | `CHANGE_TYPE in ('HIRE','TRANSFER','PROMOTION','LEAVE','RETURN','RESIGN')` |

감사 컬럼(`CREATED_ON/BY`, `UPDATED_ON/BY`) + `F_AUDIT_LOG()` 트리거는 4개 테이블 모두 정상 연결되어 있다. `ddl/run_all.sql`의 실행 순서(함수 → DEPARTMENT → POSITION → EMPLOYEE → EMPLOYMENT_HISTORY)도 FK 의존성상 올바르다.

### 2.2 요구사항 대비 갭 (스키마 변경이 필요할 수 있는 항목)

| # | 항목 | 요구사항 | 현재 DDL | 비고 |
|---|---|---|---|---|
| G1 | 이메일 | 필수 + 이메일 형식, 사실상 유일해야 자연스러움 | `EMAIL varchar(255)` — nullable, unique 없음 | `NOT NULL` + `UNIQUE` 추가 여부 결정 필요 |
| G2 | 메모 | 등록/수정 시 선택 입력 필드 | `T_EMPLOYEE`에 `MEMO` 컬럼 없음 | 컬럼 추가 필요 |
| G3 | 퇴직일 | "퇴직일이 있다면 입사일보다 빠를 수 없다" validation | `T_EMPLOYEE`에 `RESIGNED_ON` 컬럼 없음 | (a) 컬럼 추가 또는 (b) `T_EMPLOYMENT_HISTORY`에서 `CHANGE_TYPE='RESIGN'`의 `EFFECTIVE_DATE`로 대체 — **(b) 권장** (스키마 변경 최소화) |
| G4 | 상태 이력 표현 | "이전 상태 → 새 상태" | `CHANGE_TYPE`(HIRE/TRANSFER/PROMOTION/LEAVE/RETURN/RESIGN)만 있고 `PREV_STATUS`/`NEW_STATUS` 컬럼 없음 | 스키마 변경 없이 매핑으로 해결 가능 (§3 참고) — **컬럼 추가 불필요, 앱 로직에서 매핑** |
| G5 | 부서명 unique | guide 체크리스트는 "부서 코드 unique" 요구 | `T_DEPARTMENT`에 코드 컬럼 자체가 없고, `DEPT_NAME`도 unique 아님 | 기능 요구사항엔 부서명 중복 금지가 명시되지 않음 — **변경 불필요(선택)** |
| G6 | 상사 자기참조 방지 | "자기 자신을 상사로 지정할 수 없다" | DB에 `CHECK (MANAGER_ID <> EMP_ID)` 없음, 앱 검증만 존재 | **DB 미변경, 앱 레벨 검증으로 충분** (선택: `CHECK (MANAGER_ID IS DISTINCT FROM EMP_ID)` 추가 가능) |
| G7 | 상태 전이 규칙 (`RESIGNED`→불가) | DB가 전이 규칙까지 강제하는가 | `EMP_STATUS` CHECK는 허용값만 검사, 전이 규칙은 미검사 | **앱(트랜잭션) 레벨에서 강제** — 과제 스킬 지침과 일치, 변경 불필요 |
| G8 | seed 데이터 | 로컬 검증용 샘플 데이터 | 없음 | `ddl/seed.sql` 신규 추가(선택, guide 권장) |

**결론**: G2(메모 컬럼 추가)는 요구사항상 필요, G1(이메일 제약 강화)은 요구사항에 명시적이므로 권장, 나머지는 앱 레벨 처리로 스키마 변경 없이 해결 가능. G2/G1은 `ALTER TABLE`로 **기존 DDL 파일에 추가하는 방식**(파일 자체를 재작성하지 않음)을 제안한다 — 예: `ddl/tables/T_EMPLOYEE.sql` 하단에 `alter table` 구문 추가, 또는 별도 `ddl/tables/T_EMPLOYEE_ALTER.sql` 신규 파일 + `run_all.sql`에 include 한 줄 추가. **이 방식과 범위는 승인 필요 (§6).**

### 2.3 상태 변경 ↔ CHANGE_TYPE 매핑 (스키마 변경 없이 해결)

| 상태 전이 | `T_EMPLOYMENT_HISTORY.CHANGE_TYPE` |
|---|---|
| `ACTIVE` → `LEAVE` | `LEAVE` |
| `LEAVE` → `ACTIVE` | `RETURN` |
| `ACTIVE`/`LEAVE` → `RESIGNED` | `RESIGN` |

이력 insert 시 `DEPT_ID`/`POSITION_ID`는 변경 시점의 값을 기록하고, `REMARK`에 `이전 상태 → 새 상태`를 텍스트로 남겨 이전/이후 상태를 추적 가능하게 한다.

## 3. 구현 범위

### 필수

- DDL 보강: `MEMO` 컬럼 추가(G2), 이메일 제약 보강 여부 결정(G1) — 승인 후 alter 스크립트 작성
- 백엔드: Express + `pg`(node-postgres) 기반 서버, 직원 목록/등록/상세/수정/상태변경 API
- 프론트: `frontend-ssr` 스킬 방식(Vanilla HTML 파편 조립)으로 목록/등록/상세·수정 화면
- 상태 변경 + 이력 insert는 하나의 트랜잭션
- 서버 측 validation (사번/이름/이메일 필수, 부서·직책 존재 확인, 상태값 검증, 상사 자기참조 금지, 퇴직일 검증)
- 실행 방법 문서화 및 로컬 검증

### 선택 (필수 완료 후)

- 이름/부서/상태 검색·필터
- 조직 구조 간단 표시 (부서별 트리 or 상사-부하 목록)
- `ddl/seed.sql` 샘플 데이터

## 4. 구현 단계

### Step 1. DDL 보강 — 완료

`ddl/tables/T_EMPLOYEE.sql`을 직접 수정했다(별도 alter 파일 없이, 아직 데이터가 없는 그린필드 스키마이므로 `create table` 본문에 반영). 변경 이유:

- `EMAIL varchar(255)` → `EMAIL varchar(255) not null`: 요구사항 F-02/Validation 기준에서 이메일이 필수 입력값으로 명시되어 있는데 기존 컬럼은 nullable이었다. **UNIQUE는 추가하지 않았다** — 요구사항 텍스트가 "필수 + 형식"만 요구하고 중복 금지는 명시하지 않아, 최소 변경 원칙에 따라 보류했다. 필요하면 이후 단계에서 추가 요청 바란다.
- `MEMO` 컬럼 신규 추가(`text`, nullable): 요구사항 F-03에서 메모가 선택 수정 필드로 명시되어 있는데 기존 테이블에 저장할 컬럼 자체가 없어 추가했다.
- 그 외 갭(G3 퇴직일, G4 상태이력, G5 부서명 unique, G6 상사 자기참조, G7 상태전이 강제)은 스키마 변경 없이 앱 레벨 로직으로 처리하기로 확정했다(§2.2, §2.3 참고) — `T_DEPARTMENT`, `T_POSITION`, `T_EMPLOYMENT_HISTORY`, `F_AUDIT_LOG.sql`, `run_all.sql`은 **변경하지 않았다**.
- `ddl/seed.sql`은 아직 만들지 않았다(선택 항목, 필요 시 이후 단계에서 추가).

### Step 2. 백엔드 프로젝트 골격
- `package.json`, Express 서버 엔트리, `pg` connection pool
- `backend-service-architecture` 스킬 기준 계층 구조(Router/Controller/Service) 적용
- 라우트: `GET /employees`, `GET /employees/new`, `POST /employees`, `GET /employees/:id`, `POST|PATCH /employees/:id`, `POST|PATCH /employees/:id/status`

### Step 3. 백엔드 구현
- 목록/등록/상세/수정 조회·저장 로직 (parameterized query)
- 상태 변경: 전이 규칙 검증 → `T_EMPLOYEE.EMP_STATUS` update + `T_EMPLOYMENT_HISTORY` insert (단일 트랜잭션)
- 서버 validation

### Step 4. 프론트엔드 구현
- 목록 페이지(표 + 상태 배지 + 등록/상세 버튼)
- 등록 페이지(폼 + validation 오류 표시)
- 상세/수정 페이지(수정 폼 + 상태 변경 UI + 이력 표시)
- `frontend-ssr` 스킬의 `escapeHtml` 방식으로 XSS 방지

### Step 5. 검증
- `docker compose up -d postgres` 실행 확인
- `ddl/run_all.sql` (+보강분) 적용 확인
- 브라우저에서 각 화면 및 상태 전이 규칙 확인
- DB에서 실제 저장/이력 확인

### Step 6. 제출 정리
- `docs/reports/ai-usage-summary.md`, `docs/reports/result-checklist.md` 갱신
- 실행 방법 README 작성
- 확인한 것/못한 것 구분

## 5. 검증 체크리스트

- [ ] `docker compose up -d postgres` 실행 가능
- [ ] `ddl/run_all.sql`(+보강 스크립트) 실행 가능
- [ ] 직원 목록 페이지 접속 가능
- [ ] 직원 등록 시 DB에 저장됨
- [ ] 필수값 누락/형식 오류 시 오류 표시
- [ ] 직원 상세 조회 가능
- [ ] 직원 수정 시 DB에 반영됨
- [ ] 재직 → 휴직 변경 가능
- [ ] 휴직 → 재직 변경 가능
- [ ] 재직/휴직 → 퇴직 변경 가능
- [ ] 퇴직 → 재직/휴직 변경 불가 (DB 또는 앱에서 차단)
- [ ] 상태 변경 이력이 `T_EMPLOYMENT_HISTORY`에 저장됨
- [ ] 목록의 상태 배지가 바뀜
- [ ] 상사 자기참조 등록 시도 시 차단됨
- [ ] 퇴직일이 입사일보다 빠른 경우 차단됨(해당 필드 구현 시)

## 6. 승인 필요 항목

아래 항목은 구현 시작 전 사용자 확인이 필요하다.

1. **백엔드 스택**: `package.json`이 없는 그린필드 상태다. Express + `pg`(node-postgres) 직접 연결 + `frontend-ssr` 스킬 방식(Vanilla HTML 조립)으로 새로 구성해도 되는가? (다른 스택을 원하면 지정)
2. **DDL 보강 범위**:
   - `T_EMPLOYEE.MEMO` 컬럼 추가 — 진행해도 되는가?
   - `T_EMPLOYEE.EMAIL`에 `NOT NULL` + `UNIQUE` 제약 추가 — 진행해도 되는가, 아니면 앱 레벨 검증만 할지?
   - 위 변경을 기존 `T_EMPLOYEE.sql` 파일에 직접 추가할지, 별도 alter 파일로 분리할지?
3. **퇴직일 처리 방식**: `T_EMPLOYEE`에 `RESIGNED_ON` 컬럼을 추가할지, 아니면 `T_EMPLOYMENT_HISTORY`의 `RESIGN` 이력의 `EFFECTIVE_DATE`로 대체할지(계획서는 후자를 권장).
4. **상태 이력 매핑**: `CHANGE_TYPE`(LEAVE/RETURN/RESIGN)을 상태 전이 이력으로 사용하는 방식(§2.3)에 동의하는지.
5. **검색/필터, 조직 구조 표시, seed 데이터**: 선택 기능을 이번 범위에 포함할지.
6. **환경 변수**: 앱 연결용 `DATABASE_URL`(또는 개별 DB_HOST/PORT/NAME/USER/PASSWORD) 및 앱 `PORT`를 `.env`에 추가해도 되는지 (기존 `DB_PASSWORD`, `PGADMIN_PASSWORD`는 유지).

## 7. 승인 문구

이 계획대로 기존 파일을 유지한 채 구현을 진행해도 될까요?
