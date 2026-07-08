---
name: employee-management-assignment
description: "직원관리 과제 구현 시 적용. 기존 직원 ERD/DDL을 기준으로 직원 목록, 등록, 상세/수정, 상태 변경, 상태 이력 저장, 조직 구조 표현을 구현할 때 사용한다. 기존 파일을 덮어쓰지 않고 추가/보강 중심으로 진행한다."
---

# Employee Management Assignment Skill

## 1. 목적

이 스킬은 직원관리 시스템 과제를 기존 프로젝트 구조와 함께 구현하기 위한 과제 전용 지침이다.

핵심 목표는 다음과 같다.

- 기존 `ddl/` SQL 파일을 먼저 읽는다.
- 기존 `.claude/rules`와 `.claude/skills`를 유지한다.
- 직원관리 요구사항에 맞게 부족한 부분만 보강한다.
- Plan First 방식으로 계획서 승인 후 구현한다.
- 구현 결과와 AI 활용 과정을 제출물로 정리한다.

## 2. 절대 원칙

- 기존 파일을 무작정 덮어쓰지 않는다.
- 기존 DDL을 읽지 않고 새 ERD/DDL을 만들지 않는다.
- 승인 전에는 코드 구현을 시작하지 않는다.
- 요구사항 범위 밖 기능을 임의로 추가하지 않는다.
- 애매한 부분은 추측하지 말고 질문한다.

## 3. 먼저 확인할 파일

작업 시작 시 반드시 다음 파일을 확인한다.

- `CLAUDE.md`
- `.claude/rules/development-workflow.md`
- `docs/guides/development-process.md`
- `docs/specs/employee-management-requirements.md`
- `docs/guides/employee-erd-guide.md`
- `docs/plans/2026-07-08-employee-management-plan.md`
- `ddl/functions/F_AUDIT_LOG.sql`
- `ddl/tables/T_DEPARTMENT.sql`
- `ddl/tables/T_POSITION.sql`
- `ddl/tables/T_EMPLOYEE.sql`
- `ddl/tables/T_EMPLOYMENT_HISTORY.sql`
- `ddl/run_all.sql`
- `docker-compose.yml`
- `package.json` if it exists

## 4. 필수 기능

### F-01. 직원 목록 조회

- 직원 주요 필드를 표로 표시한다.
- 부서, 직책, 직속상사, 상태를 함께 표시한다.
- 상태는 배지 형태로 보여준다.

### F-02. 직원 등록

- 직원 정보를 입력해 PostgreSQL에 저장한다.
- 사번, 이름, 이메일, 부서, 직책, 상태, 입사일은 필수로 검증한다.

### F-03. 직원 상세 / 수정

- 직원 1명의 상세 정보를 조회한다.
- 이름, 이메일, 전화번호, 부서, 직책, 직속상사, 메모 등 수정 가능한 필드를 수정한다.

### F-04. 상태 변경

- 상태값은 다음 3개를 사용한다.
  - `ACTIVE`: 재직
  - `LEAVE`: 휴직
  - `RESIGNED`: 퇴직
- 허용 전환은 다음과 같다.
  - `ACTIVE` → `LEAVE`
  - `LEAVE` → `ACTIVE`
  - `ACTIVE` → `RESIGNED`
  - `LEAVE` → `RESIGNED`
- `RESIGNED`에서는 다른 상태로 되돌리지 않는다.
- 상태 변경 시 `T_EMPLOYMENT_HISTORY`에 이력을 저장한다.
- 상태 변경과 이력 저장은 하나의 transaction으로 처리한다.

### F-05. 검색 / 필터

선택 기능이다. 시간이 부족하면 필수 기능 완료 후 진행한다.

- 이름 검색
- 부서 필터
- 상태 필터

## 5. DB 구현 기준

- 테이블명은 기존 `T_` prefix를 따른다.
- 기존 감사 컬럼이 있다면 유지한다.
- `F_AUDIT_LOG()`가 있다면 기존 방식대로 트리거를 연결한다.
- `T_EMPLOYEE`는 부서, 직책, 직속상사 관계를 표현해야 한다.
- `T_EMPLOYMENT_HISTORY`는 상태 변경 이력을 저장해야 한다.
- schema 변경이 필요하면 계획서에 먼저 적고 승인받는다.

## 6. Backend 구현 기준

- 기존 프로젝트의 스택과 구조를 우선 따른다.
- Express 기반이면 Router / Controller / Service 또는 기존 레이어 구조를 따른다.
- SQL injection 방지를 위해 parameterized query를 사용한다.
- 상태 변경은 transaction으로 처리한다.
- validation은 서버에서 반드시 수행한다.

## 7. Frontend 구현 기준

- 기존 화면 구조와 스타일을 우선 따른다.
- 목록, 등록, 상세/수정 화면을 만든다.
- 상태는 한눈에 보이도록 배지로 표시한다.
- 사용자 입력값 출력 시 HTML escaping을 고려한다.
- 과제 확인이 쉬운 단순한 UI를 우선한다.

## 8. 제출물 정리 기준

구현 완료 후 다음 문서를 작성하거나 갱신한다.

- `docs/reports/ai-usage-summary.md`
- `docs/reports/result-checklist.md`
- `README.md` 또는 별도 실행 방법 문서

반드시 실제 확인한 항목과 확인하지 못한 항목을 구분한다.
