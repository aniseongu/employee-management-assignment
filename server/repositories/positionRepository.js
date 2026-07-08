export async function findPositionById(db, positionId) {
    const { rows } = await db.query(
        `select POSITION_ID, POSITION_NAME from T_POSITION where POSITION_ID = $1 and USE_YN = 'Y'`,
        [positionId],
    );
    return rows[0] || null;
}
