# AI 활용 정리

> 구현 완료 후 실제 사용한 흐름에 맞게 수정한다.

## 1. 사용 도구

- Claude Code

## 2. 사용한 개발 방식

- 기존 문서와 DDL 분석
- Plan First
- 계획서 승인 후 구현
- DDL → Backend → Frontend → 검증 순서
- 기존 rule/skill 유지
- 과제 전용 skill 추가

## 3. 사용한 스킬

| 스킬 | 사용 목적 |
|---|---|
| 기존 `development-workflow` rule | 계획서 작성, 승인 후 구현, main 직접 커밋 금지 등 작업 흐름 유지 |
| 기존 `db-development-postgres` skill | PostgreSQL DDL, FK, CHECK, 감사 트리거 점검 |
| 기존 `backend-service-architecture` skill | Backend route/service 구현 시 기존 구조 유지 |
| 기존 `frontend-ssr` 또는 기존 frontend skill | 직원 목록/등록/상세 화면 구현 |
| `employee-management-assignment` skill | 직원관리 과제 범위, 상태 전환, 상태 이력, 제출물 정리 기준 적용 |

## 4. 주요 프롬프트

1. 기존 파일 유지 조건으로 저장소 분석 및 계획서 작성 요청
2. DDL 점검 및 보강 요청
3. Backend CRUD 구현 요청
4. Frontend 화면 구현 요청
5. 최종 검증 및 제출물 정리 요청

## 5. 검증 결과

- [ ] PostgreSQL 실행 확인
- [ ] DDL 적용 확인
- [ ] 직원 목록 조회 확인
- [ ] 직원 등록 확인
- [ ] 직원 상세/수정 확인
- [ ] 상태 변경 확인
- [ ] 상태 이력 저장 확인
- [ ] 결과 화면 캡처 완료

## 6. 느낀 점 / 한계

작성 필요.
