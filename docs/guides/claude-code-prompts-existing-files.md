# Claude Code 프롬프트 모음 — 기존 파일 유지 버전

아래 프롬프트는 기존 프로젝트 파일을 덮어쓰지 않고, 필요한 문서와 과제용 스킬만 추가한 상태에서 사용한다.

---

## Prompt 1 — 기존 파일 분석 + 계획서 작성

```text
너는 이 저장소의 기존 Claude Code 규칙과 스킬을 유지하면서 직원관리 시스템 과제를 구현하는 개발자야.

중요:
- 기존 파일을 덮어쓰지 마.
- 기존 .claude/rules/development-workflow.md는 유지해.
- 기존 .claude/skills/* 스킬들은 삭제하거나 이름을 바꾸지 마.
- 기존 ddl/tables/*.sql, ddl/functions/*.sql, ddl/run_all.sql을 구현의 기준으로 삼아.
- 새로 필요한 문서는 docs/specs, docs/plans, docs/reports 아래에 추가하거나 갱신해.
- 과제 전용 스킬은 .claude/skills/employee-management-assignment/SKILL.md를 사용해.

먼저 현재 저장소를 분석해.
반드시 확인할 파일:
- CLAUDE.md
- .claude/rules/development-workflow.md
- docs/guides/development-process.md
- docs/specs/employee-management-requirements.md
- docs/guides/employee-erd-guide.md
- docs/plans/2026-07-08-employee-management-plan.md
- ddl/functions/F_AUDIT_LOG.sql
- ddl/tables/T_DEPARTMENT.sql
- ddl/tables/T_POSITION.sql
- ddl/tables/T_EMPLOYEE.sql
- ddl/tables/T_EMPLOYMENT_HISTORY.sql
- ddl/run_all.sql
- docker-compose.yml
- package.json이 있으면 package.json도 확인

과제 목표:
- 직원관리 웹사이트 구현
- PostgreSQL 사용
- 직원 목록 조회
- 직원 등록
- 직원 상세 조회
- 직원 수정
- 직원 상태 변경
- 상태값은 ACTIVE, LEAVE, RESIGNED 사용
- 상태 변경 이력은 T_EMPLOYMENT_HISTORY에 저장
- 부서, 직책, 직속상사 관계를 활용해 직원 구성도 또는 조직 구조를 표현할 수 있게 구현

지금 단계에서는 코드를 수정하지 말고 다음만 해:
1. 기존 파일 구조 요약
2. 기존 DDL이 과제 요구사항을 만족하는지 점검
3. 기존 파일을 유지하면서 추가/수정해야 할 문서/코드 목록 제안
4. 구현 계획 작성
5. docs/plans/2026-07-08-employee-management-plan.md 갱신
6. 사용자 승인이 필요한 항목 정리

마지막에는 반드시 이렇게 묻고 멈춰:
“이 계획대로 기존 파일을 유지한 채 구현을 진행해도 될까요?”
```

---

## Prompt 2 — 승인 후 DDL 점검/보강

```text
좋아. 이 계획대로 기존 파일을 유지한 채 진행해.

먼저 DDL 쪽만 점검하고 필요한 부분만 보강해줘.

범위:
- 기존 ddl/tables/*.sql 확인
- T_DEPARTMENT, T_POSITION, T_EMPLOYEE, T_EMPLOYMENT_HISTORY 관계 확인
- EMPLOYMENT_STATUS CHECK 확인 또는 추가
- 사번/이메일/부서코드/직책코드 unique 제약 확인
- 직속상사 self FK 확인
- 감사 컬럼과 F_AUDIT_LOG 트리거 연결 확인
- ddl/run_all.sql 실행 순서 확인
- 필요하면 ddl/seed.sql 추가 제안 또는 작성

규칙:
- 기존 DDL을 최대한 유지하고 부족한 부분만 보강해.
- 새 ERD를 처음부터 다시 만들지 마.
- 실행 가능한 SQL이어야 해.
- DDL 완료 후 멈추고 실행/검증 방법을 알려줘.
- 아직 Backend와 Frontend는 구현하지 마.
```

---

## Prompt 3 — Backend CRUD 구현

```text
DDL 점검이 끝났으니 Backend CRUD를 구현해줘.

범위:
- PostgreSQL 연결 모듈
- 직원 목록 조회
- 직원 등록
- 직원 상세 조회
- 직원 수정
- 상태 변경
- 상태 변경 이력 저장

규칙:
- 기존 프로젝트의 스택과 폴더 구조를 우선 따라.
- SQL injection이 없도록 parameterized query를 사용해.
- 상태 변경은 반드시 transaction으로 처리해.
- RESIGNED 상태에서는 ACTIVE/LEAVE로 되돌릴 수 없게 해.
- validation은 서버에서 반드시 수행해.
- 요구사항 밖 로그인/권한 기능은 만들지 마.

완료 후:
- 수정한 파일 목록
- 주요 route/API 목록
- 실행 방법
- 테스트 방법
을 정리해줘.
```

---

## Prompt 4 — Frontend 화면 구현

```text
Backend CRUD가 준비되었으니 직원관리 화면을 구현해줘.

필수 화면:
1. 직원 목록 페이지
2. 직원 등록 페이지
3. 직원 상세/수정 페이지

필수 UI:
- 직원 목록 표
- 상태 배지: 재직/휴직/퇴직
- 등록 버튼
- 상세/수정 버튼
- 상태 변경 버튼 또는 select
- validation 오류 메시지
- 목록으로 돌아가기 링크

규칙:
- 기존 frontend 구조를 우선 따라.
- 화려한 디자인보다 과제 요구사항 확인이 쉬운 UI를 우선해.
- 사용자 입력값 출력 시 HTML escaping을 고려해.
- React/Vue 같은 대형 프레임워크를 새로 추가하지 마. 기존 구조가 있으면 기존 구조를 따라.
- 구현 후 브라우저에서 확인할 수 있는 URL을 알려줘.
```

---

## Prompt 5 — 최종 검증 + 제출물 정리

```text
이제 최종 검증과 제출물 정리를 해줘.

해야 할 일:
1. 요구사항 체크리스트 기준으로 구현 상태 점검
2. 실행 방법 README 정리
3. docs/reports/ai-usage-summary.md 작성 또는 갱신
4. docs/reports/result-checklist.md 작성 또는 갱신
5. 어떤 기존 스킬을 사용했고 employee-management-assignment SKILL.md가 어떤 역할을 했는지 정리
6. 남은 한계나 선택 구현 여부를 솔직하게 정리

주의:
- 실제로 확인하지 않은 것은 성공했다고 쓰지 마.
- 캡처가 필요한 항목은 '캡처 필요'라고 표시해.
- 배포했다고 쓰지 마. 이 과제는 로컬 실행 기준이야.
```
