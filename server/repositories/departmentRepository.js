export async function findDepartmentById(db, deptId) {
    const { rows } = await db.query(
        `select DEPT_ID, DEPT_NAME from T_DEPARTMENT where DEPT_ID = $1 and USE_YN = 'Y'`,
        [deptId],
    );
    return rows[0] || null;
}
