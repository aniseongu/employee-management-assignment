# Employee Management Minimal Add-on Bundle

이 압축 파일은 기존 프로젝트 파일을 덮어쓰지 않고, 직원관리 과제를 진행하기 위해 **추가만 하는 파일**로 구성되어 있습니다.

## 포함 원칙

- 기존 `.claude/rules/development-workflow.md`는 포함하지 않습니다.
- 기존 `.claude/skills/*`는 포함하지 않습니다.
- 기존 `ddl/tables/*.sql`, `ddl/functions/*.sql`, `ddl/run_all.sql`은 포함하지 않습니다.
- 기존 `CLAUDE.md`도 덮어쓰지 않습니다.
- 필요한 경우 `CLAUDE_APPEND_ONLY.md`의 내용만 기존 `CLAUDE.md` 맨 아래에 붙여 넣습니다.

## 추가될 파일

```text
.claude/skills/employee-management-assignment/SKILL.md

CLAUDE_APPEND_ONLY.md
README.MINIMAL-ADDON.md

docs/specs/employee-management-requirements.md
docs/guides/employee-erd-guide.md
docs/guides/claude-code-prompts-existing-files.md
docs/plans/2026-07-08-employee-management-plan.md
docs/reports/ai-usage-summary.md
docs/reports/result-checklist.md
```

## 적용 방법

1. 이 압축 파일을 프로젝트 루트에 풉니다.
2. 기존 파일과 이름이 겹치면 덮어쓰지 말고 내용을 비교합니다.
3. `CLAUDE_APPEND_ONLY.md`의 내용을 기존 `CLAUDE.md` 맨 아래에 추가합니다.
4. Claude Code에서 `docs/guides/claude-code-prompts-existing-files.md`의 Prompt 1부터 사용합니다.

## 핵심 흐름

```text
기존 DDL 확인 → docs/plans 계획서 작성 → 사용자 승인 → DDL 검증 → Backend 구현 → Frontend 구현 → 제출물 정리
```
