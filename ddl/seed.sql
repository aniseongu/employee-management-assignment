-- =========================================================
-- 로컬 검증용 샘플 데이터 (선택 사항)
-- run_all.sql과 분리된 파일 — 스키마 실행 후 필요할 때만 별도로 실행한다.
-- 사용:  psql "$DATABASE_URL" -f ddl/seed.sql
-- 이미 존재하는 이름은 다시 넣지 않는다(재실행해도 중복 insert 안 됨).
-- =========================================================

insert into T_DEPARTMENT (DEPT_NAME)
select v.name
from (values ('개발팀'), ('인사팀'), ('영업팀')) as v(name)
where not exists (
    select 1 from T_DEPARTMENT d where d.DEPT_NAME = v.name
);

insert into T_POSITION (POSITION_NAME, POSITION_LEVEL)
select v.name, v.level
from (values ('팀장', 1), ('과장', 2), ('사원', 3)) as v(name, level)
where not exists (
    select 1 from T_POSITION p where p.POSITION_NAME = v.name
);
