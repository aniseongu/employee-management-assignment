const LIST_SELECT = `
    select
        e.EMP_ID, e.EMP_UUID, e.EMP_NO, e.EMP_NAME, e.EMAIL, e.PHONE,
        to_char(e.HIRE_DATE, 'YYYY-MM-DD') as HIRE_DATE, e.EMP_STATUS,
        e.DEPT_ID, d.DEPT_NAME,
        e.POSITION_ID, p.POSITION_NAME,
        e.MANAGER_ID, m.EMP_NAME as MANAGER_NAME
    from T_EMPLOYEE e
    left join T_DEPARTMENT d on d.DEPT_ID = e.DEPT_ID
    left join T_POSITION p on p.POSITION_ID = e.POSITION_ID
    left join T_EMPLOYEE m on m.EMP_ID = e.MANAGER_ID
`;

const DETAIL_SELECT = `
    select
        e.EMP_ID, e.EMP_UUID, e.EMP_NO, e.EMP_NAME, e.EMAIL, e.PHONE,
        to_char(e.HIRE_DATE, 'YYYY-MM-DD') as HIRE_DATE, e.EMP_STATUS, e.MEMO,
        e.DEPT_ID, d.DEPT_NAME,
        e.POSITION_ID, p.POSITION_NAME,
        e.MANAGER_ID, m.EMP_NAME as MANAGER_NAME
    from T_EMPLOYEE e
    left join T_DEPARTMENT d on d.DEPT_ID = e.DEPT_ID
    left join T_POSITION p on p.POSITION_ID = e.POSITION_ID
    left join T_EMPLOYEE m on m.EMP_ID = e.MANAGER_ID
`;

export async function listAll(db) {
    const { rows } = await db.query(`${LIST_SELECT} order by e.EMP_ID`);
    return rows;
}

export async function findById(db, empId, { forUpdate = false } = {}) {
    const lockClause = forUpdate ? 'for update of e' : '';
    const { rows } = await db.query(`${DETAIL_SELECT} where e.EMP_ID = $1 ${lockClause}`, [empId]);
    return rows[0] || null;
}

export async function findByEmpNo(db, empNo) {
    const { rows } = await db.query('select EMP_ID from T_EMPLOYEE where EMP_NO = $1', [empNo]);
    return rows[0] || null;
}

export async function insert(db, data) {
    const { rows } = await db.query(
        `insert into T_EMPLOYEE
            (EMP_NO, EMP_NAME, EMAIL, PHONE, HIRE_DATE, DEPT_ID, POSITION_ID, MANAGER_ID, EMP_STATUS, MEMO)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning EMP_ID`,
        [
            data.empNo,
            data.empName,
            data.email,
            data.phone ?? null,
            data.hireDate,
            data.deptId ?? null,
            data.positionId ?? null,
            data.managerId ?? null,
            data.empStatus,
            data.memo ?? null,
        ],
    );
    return rows[0].emp_id;
}

export async function update(db, empId, data) {
    await db.query(
        `update T_EMPLOYEE
         set EMP_NAME = $1, EMAIL = $2, PHONE = $3, DEPT_ID = $4, POSITION_ID = $5, MANAGER_ID = $6, MEMO = $7
         where EMP_ID = $8`,
        [
            data.empName,
            data.email,
            data.phone ?? null,
            data.deptId ?? null,
            data.positionId ?? null,
            data.managerId ?? null,
            data.memo ?? null,
            empId,
        ],
    );
}

export async function updateStatus(db, empId, empStatus) {
    await db.query('update T_EMPLOYEE set EMP_STATUS = $1 where EMP_ID = $2', [empStatus, empId]);
}
