# CLAUDE.md에 추가할 내용만 모은 파일

아래 내용을 기존 `CLAUDE.md`의 맨 아래에 붙여 넣으세요.  
기존 `CLAUDE.md` 파일 자체를 이 파일로 교체하지 마세요.

---

## Employee Management Assignment

This repository includes an employee management assignment.

### Source of Truth

Use the existing DDL and assignment documents as the source of truth.

Primary files:

- `docs/specs/employee-management-requirements.md`
- `docs/guides/employee-erd-guide.md`
- `docs/plans/2026-07-08-employee-management-plan.md`
- `ddl/run_all.sql`
- `ddl/functions/F_AUDIT_LOG.sql`
- `ddl/tables/T_DEPARTMENT.sql`
- `ddl/tables/T_POSITION.sql`
- `ddl/tables/T_EMPLOYEE.sql`
- `ddl/tables/T_EMPLOYMENT_HISTORY.sql`

### Assignment Rules

- Do not replace existing rules or skills.
- Do not delete or rename existing `.claude/skills/*` directories.
- Do not rewrite the DDL from scratch without reading the existing SQL files.
- Follow the existing Plan First workflow.
- Before modifying source code, create or update the implementation plan under `docs/plans/` and wait for user approval.
- Implement only the assignment scope: employee list, create, detail, update, status change, and status history.
- Use PostgreSQL as the persistence layer.
- Do not add login, deployment, external API integration, or unnecessary advanced features unless explicitly requested.
- If DDL and requirements conflict, stop and ask before changing schema.

### Assignment Skill

Use this skill when working on the employee management assignment:

- `.claude/skills/employee-management-assignment/SKILL.md`
