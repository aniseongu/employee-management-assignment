---
name: employee-backend-current-stack
description: "이 저장소(spacework)의 실제 백엔드 스택 기준. 기존 backend-service-architecture 스킬은 다른 프로젝트(kist, TypeScript+Oracle ORDS 모노레포) 기준이라 이 저장소에는 그대로 적용하지 않는다. 직원관리 과제의 백엔드 코드를 작성/수정할 때는 이 스킬을 기준으로 한다."
---

# 직원관리 과제 — 백엔드 현재 스택 표준

이 저장소는 `backend-service-architecture` 스킬 문서가 가정하는 프로젝트(TypeScript, `services/server` 모노레포, Oracle ORDS REST 프록시)와 다르다. 이 저장소는 **PostgreSQL을 직접 사용하는 순수 JS(ESM) + Express** 단일 프로젝트다. 그 스킬은 "계층 분리·JSON Envelope·전역 에러·환경변수 Fail-Fast·로깅" 같은 **언어 무관 원칙만 참고**하고, 파일 경로·언어·데이터 접근 방식은 아래 실제 구조를 따른다.

## 실제 스택 (확인된 사실)

- **런타임**: Node.js (ESM, `"type": "module"`). 이 머신의 기본 `node`는 v12라 ESM/신문법이 깨진다 — 반드시 `nvm`의 v18 이상(`~/.nvm/versions/node/v20.20.2` 등)을 `PATH`에 넣어 실행한다.
- **프레임워크**: Express 4 (`express`, `cors`, `helmet`, `morgan`).
- **DB 접근**: `pg`(node-postgres) `Pool`을 **직접** 사용한다. ORM 없음, Oracle ORDS 없음, Prisma 없음.
- **검증**: `zod` — Controller에서 요청 바디/파라미터 스키마 검증(`server/schemas/*.js`).
- **로깅**: `winston` (console transport). `console.log`/`console.error`는 금지, 단 `config/env.js`의 부트스트랩 실패(로거 생성 이전 시점)는 예외적으로 `console.error` 허용.
- **응답 규격**: 이 저장소에 기존 API가 없었으므로 새로 정한 JSON Envelope를 그대로 유지한다.
  ```json
  { "success": true, "data": { }, "message": "..." }
  { "success": false, "data": null, "message": "...", "errors": { } }
  ```

## 디렉터리 구조 (실제)

```
package.json                 # 루트, "type": "module"
server/
 ├── server.js                # 엔트리: 미들웨어 순서, 라우팅 마운트, graceful shutdown
 ├── config/env.js            # Zod 기반 환경변수 Fail-Fast (DB_HOST/PORT/NAME/USER/PASSWORD, APP_PORT)
 ├── lib/
 │    ├── db.js                # pg Pool 생성
 │    └── logger.js            # winston 로거
 ├── schemas/                  # Zod 스키마 (요청 바디/파라미터 shape 검증만)
 ├── utils/
 │    ├── ApiError.js          # statusCode 있는 커스텀 에러
 │    └── validate.js          # schema.safeParse 래퍼
 ├── repositories/             # Raw SQL, parameterized query. 테이블/컬럼명은 DDL 그대로(대문자) 사용
 ├── services/                 # 비즈니스 규칙(트랜잭션, FK 존재 확인, 상태 전이 규칙 등). 프레임워크 비종속
 ├── controllers/              # HTTP 입출력 + Zod 검증 호출만. 비즈니스 로직 금지
 ├── routes/                   # 경로 ↔ Controller 매핑만
 └── middlewares/errorHandler.js  # 전역 에러 핸들러 + 404 핸들러
```

**`routes/`만 두는 골격 금지** — 반드시 Router → Controller → Service → Repository 4계층을 유지한다.

## app 미들웨어 순서 (`server/server.js`)

1. `helmet()`, `cors()` (보안)
2. `express.json()`
3. `morgan('dev')` → `logger.http()`로 브리지
4. (프론트 정적 서빙은 `employee-frontend-current-stack` 스킬이 이 지점에 한 줄 추가)
5. 라우터 마운트 (`app.use(routes)`)
6. 404 핸들러
7. 전역 에러 핸들러 (가장 마지막)

## 계층별 규칙

- **Router**: `express.Router()`. 경로 정의만, 로직 없음.
- **Controller**: `validate(schema, req.body|req.params)`로 Zod 검증 → Service 호출 → `res.json({ success, data, message })`. try/catch에서 `next(err)`.
- **Service**: DB 커넥션(`pool`)을 받아 비즈니스 규칙을 수행. FK 존재 확인(부서/직책/상사), 상태 전이 규칙, 사번 중복 확인 등 **DB 조회가 필요한 검증은 전부 여기**(Zod는 형식 검증만 담당).
- **Repository**: `db.query(sql, params)` 형태의 parameterized query만. SQL 문자열 조합 금지(injection 방지). 컬럼/테이블명은 `ddl/` 원본 그대로 대문자로 작성한다(`db-development-postgres` 스킬 네이밍 규칙 준수, PostgreSQL이 따옴표 없는 대문자를 소문자로 접어도 무방).

## 트랜잭션 규칙

- 상태 변경(`PATCH /employees/:id/status`)처럼 "직원 상태 UPDATE + `T_EMPLOYMENT_HISTORY` INSERT"가 함께 일어나는 작업은 **반드시 하나의 트랜잭션**으로 묶는다.
  ```js
  const client = await pool.connect();
  try {
      await client.query('BEGIN');
      // SELECT ... FOR UPDATE 로 동시 상태변경 경쟁 방지
      // UPDATE T_EMPLOYEE ...
      // INSERT INTO T_EMPLOYMENT_HISTORY ...
      await client.query('COMMIT');
  } catch (err) {
      await client.query('ROLLBACK');
      throw err;
  } finally {
      client.release();
  }
  ```
- 단순 조회/단일 테이블 쓰기는 `pool.query(...)`를 바로 써도 된다(별도 트랜잭션 불필요).

## 날짜 컬럼 주의 (이 저장소에서 실제로 겪은 버그)

- `pg`가 Postgres `date` 타입을 로컬 타임존 기준 JS `Date` 객체로 파싱한다. 서버 타임존이 KST면 `.toISOString()` 변환 시 하루가 밀릴 수 있다.
- **해결**: `HIRE_DATE`, `EFFECTIVE_DATE` 등 `date` 컬럼은 SELECT 시 `to_char(컬럼, 'YYYY-MM-DD')`로 캐스팅해 순수 문자열로 응답한다. 새로 `date` 컬럼을 조회하는 쿼리를 추가할 때도 동일하게 처리한다.

## 상태값 / 상태 전이 규칙 (요구사항 고정값)

- `EMP_STATUS`: `ACTIVE`(재직) / `LEAVE`(휴직) / `RESIGNED`(퇴직).
- 허용 전이: `ACTIVE→LEAVE`, `LEAVE→ACTIVE`, `ACTIVE→RESIGNED`, `LEAVE→RESIGNED`. `RESIGNED`에서는 어떤 상태로도 되돌리지 않는다. 동일 상태로의 "전이"도 거부한다(400).
- `T_EMPLOYMENT_HISTORY.CHANGE_TYPE` 매핑: `ACTIVE→LEAVE`=`LEAVE`, `LEAVE→ACTIVE`=`RETURN`, `(ACTIVE|LEAVE)→RESIGNED`=`RESIGN`. (컬럼 자체엔 `PREV_STATUS`/`NEW_STATUS`가 없으므로 이 매핑 + `REMARK` 텍스트로 대체)

## 환경변수

`.env`에 이미 있는 `DB_PASSWORD`, `PGADMIN_PASSWORD`는 건드리지 않는다. 앱 실행용으로 `DB_HOST`, `DB_PORT`(compose가 호스트 `5433` 매핑), `DB_NAME`, `DB_USER`, `APP_PORT`를 추가해 사용한다. `server/config/env.js`가 기동 시점에 Zod로 검증하고 실패하면 즉시 종료한다.

## 이 스킬이 하지 않는 것 (참고 스킬로 위임)

- DB 객체 네이밍·감사 트리거·CHECK 제약 표준 → `db-development-postgres` 스킬 (이미 적용됨, `ddl/` 수정 불필요).
- 화면 렌더링·정적 파일 서빙 세부 → `employee-frontend-current-stack` 스킬.
- `backend-service-architecture`/`frontend-ssr`는 **다른 프로젝트 기준**이므로 원칙(계층 분리, JSON Envelope, XSS 방어 등)만 참고하고 파일 경로·언어 매핑은 따르지 않는다.
