export async function insert(db, data) {
    await db.query(
        `insert into T_EMPLOYMENT_HISTORY
            (EMP_ID, CHANGE_TYPE, DEPT_ID, POSITION_ID, EFFECTIVE_DATE, REMARK)
         values ($1, $2, $3, $4, $5, $6)`,
        [data.empId, data.changeType, data.deptId ?? null, data.positionId ?? null, data.effectiveDate, data.remark ?? null],
    );
}

export async function listByEmployee(db, empId) {
    const { rows } = await db.query(
        `select HISTORY_ID, HISTORY_UUID, CHANGE_TYPE, DEPT_ID, POSITION_ID,
                to_char(EFFECTIVE_DATE, 'YYYY-MM-DD') as EFFECTIVE_DATE, REMARK, CREATED_ON
         from T_EMPLOYMENT_HISTORY
         where EMP_ID = $1
         order by EFFECTIVE_DATE desc, HISTORY_ID desc`,
        [empId],
    );
    return rows;
}
