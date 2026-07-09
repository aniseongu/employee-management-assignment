# 직원관리 시스템

ERD를 바탕으로 PostgreSQL의 조직 데이터를 사용하는 직원관리 웹사이트입니다. 직원 목록/등록/상세·수정, 재직상태 변경과 이력 저장, 부서·직책·직속상사를 통한 조직 구조 표현을 다룹니다.

## 기술 스택

- **Backend**: Node.js(ESM) + Express + [`pg`](https://node-postgres.com/)(직접 연결, ORM 미사용) + Zod(validation) + winston(logging)
- **Frontend**: 프레임워크 없이 Vanilla HTML/CSS + `fetch` 기반 JS (`client/`), Express `static`으로 서빙
- **DB**: PostgreSQL 16 (Docker Compose)
- **계층 구조**: Router → Controller → Service → Repository

## 프로젝트 구조

```text
ddl/                    스키마 DDL
  functions/F_AUDIT_LOG.sql
  tables/{T_DEPARTMENT,T_POSITION,T_EMPLOYEE,T_EMPLOYMENT_HISTORY}.sql
  run_all.sql            스키마 전체 적용 스크립트
  seed.sql               (선택) 로컬 검증용 샘플 부서/직책 데이터

server/                 Express 백엔드
  routes/               employeeRoutes, departmentRoutes, positionRoutes, pageRoutes
  controllers/ services/ repositories/   4계층 구조
  schemas/               Zod validation 스키마
  server.js              앱 엔트리 (정적 서빙 + 라우팅)

client/                 프론트엔드 (정적 파일)
  pages/                 employee-list.html, employee-form.html, employee-detail.html
  public/{css,js}/       공통 스타일, api.js(fetch 래퍼), 화면별 스크립트

docs/
  guides/                ERD 가이드
  reports/               검증 체크리스트
```

## ERD 요약

4개 테이블로 조직 구조를 표현합니다(자세한 내용은 [`docs/guides/employee-erd-guide.md`](docs/guides/employee-erd-guide.md) 참고).

- `T_DEPARTMENT` — 부서 (자기참조로 상위 부서 표현)
- `T_POSITION` — 직책
- `T_EMPLOYEE` — 직원 (부서/직책 FK, `MANAGER_ID` 자기참조로 직속상사 표현)
- `T_EMPLOYMENT_HISTORY` — 재직상태 변경 이력 (`EMP_ID` FK, `CHANGE_TYPE`)

재직상태는 `ACTIVE`(재직) / `LEAVE`(휴직) / `RESIGNED`(퇴직) 3가지이며, 허용되는 전환은 `ACTIVE↔LEAVE`, `ACTIVE/LEAVE→RESIGNED`뿐이고 `RESIGNED`는 종단 상태입니다.

## 로컬 실행 방법 (WSL / Linux)

```bash
# 0. node v18+ 필요 (ESM). nvm으로 관리 중이면:
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"

# 1. PostgreSQL 기동
docker compose up -d postgres

# 2. DDL 적용 (최초 1회, 컨테이너를 새로 만든 경우)
docker compose cp ddl postgres:/ddl
docker compose exec -T -w /ddl postgres psql -U emko -d emko -v ON_ERROR_STOP=1 -f run_all.sql

# 3. (선택) 로컬 검증용 부서/직책 샘플 데이터 — 재실행해도 중복 insert 안 됨
docker compose exec -T -w /ddl postgres psql -U emko -d emko -f seed.sql

# 4. 의존성 설치 및 서버 실행
npm install
npm run dev   # 또는 npm start
```

서버가 뜨면 아래 주소로 접속합니다.

| 화면 | URL |
|---|---|
| 직원 목록 (검색/필터, 조직 구조 뷰 포함) | `http://localhost:3000/` |
| 직원 등록 | `http://localhost:3000/register` |
| 직원 상세/수정 (상태 변경 UI, 이력 표시) | `http://localhost:3000/detail?id=<emp_id>` |

> 부서/직책 데이터가 없으면 등록 화면의 select가 비어 있습니다. 위 3번 단계로 샘플 데이터를 넣거나, `T_DEPARTMENT`/`T_POSITION`에 직접 최소 1건 이상 입력해야 합니다.

DB 연결/포트 등 환경 변수는 `.env.example`을 참고해 `.env`로 복사해 사용합니다(`.env`는 git에 커밋되지 않습니다).

## API

| Method | Path | 설명 |
|---|---|---|
| GET | `/employees` | 직원 목록 (부서명/직책명/상사명 join) |
| POST | `/employees` | 직원 등록 |
| GET | `/employees/:id` | 직원 상세 (상태 변경 이력 `history` 포함) |
| PATCH | `/employees/:id` | 직원 정보 수정 |
| PATCH | `/employees/:id/status` | 재직상태 변경 (이력 저장, 트랜잭션) |
| GET | `/departments` | 부서 목록 |
| GET | `/positions` | 직책 목록 |
| GET | `/health` | 헬스 체크 |

응답 공통 형식: `{ success, data, message, errors? }`. 요청 body는 camelCase(`empNo`, `deptId` 등), 응답 데이터는 DB 컬럼명 그대로인 snake_case(`emp_no`, `dept_id` 등)입니다.

## 문서

- 검증 체크리스트: [`docs/reports/result-checklist.md`](docs/reports/result-checklist.md)

## 범위 / 한계

- 로그인·권한, 배포, 외부 API 연동, 파일 업로드, 복잡한 조직도 시각화 라이브러리, 대용량 페이지네이션 고도화는 요구사항 제외 범위로 구현하지 않았습니다.
- 검색/필터는 백엔드 API 변경 없이 클라이언트에서 이미 불러온 목록을 필터링하는 방식입니다.
- 이 저장소를 다룬 개발 환경에는 브라우저 자동화 도구가 없어, 화면 클릭 검증은 curl + `psql` 기반 API/DB 레벨 검증으로 대체했습니다. 자세한 내용은 [`docs/reports/result-checklist.md`](docs/reports/result-checklist.md)를 참고하세요.
