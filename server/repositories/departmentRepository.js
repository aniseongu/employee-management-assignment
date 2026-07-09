export async function findDepartmentById(db, deptId) {
    const { rows } = await db.query(
        `select DEPT_ID, DEPT_NAME from T_DEPARTMENT where DEPT_ID = $1 and USE_YN = 'Y'`,
        [deptId],
    );
    return rows[0] || null;
}

export async function listAll(db) {
    const { rows } = await db.query(
        `select DEPT_ID, DEPT_NAME, PARENT_DEPT_ID from T_DEPARTMENT where USE_YN = 'Y' order by DEPT_ID`,
    );
    return rows;
}
