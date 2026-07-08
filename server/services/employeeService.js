import { pool } from '../lib/db.js';
import { ApiError } from '../utils/ApiError.js';
import * as employeeRepo from '../repositories/employeeRepository.js';
import * as historyRepo from '../repositories/employmentHistoryRepository.js';
import * as departmentRepo from '../repositories/departmentRepository.js';
import * as positionRepo from '../repositories/positionRepository.js';

const ALLOWED_TRANSITIONS = {
    ACTIVE: ['LEAVE', 'RESIGNED'],
    LEAVE: ['ACTIVE', 'RESIGNED'],
    RESIGNED: [],
};

const CHANGE_TYPE_BY_TRANSITION = {
    'ACTIVE->LEAVE': 'LEAVE',
    'LEAVE->ACTIVE': 'RETURN',
    'ACTIVE->RESIGNED': 'RESIGN',
    'LEAVE->RESIGNED': 'RESIGN',
};

function toIsoDate(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value;
}

async function assertDepartmentExists(db, deptId) {
    if (deptId == null) return;
    const dept = await departmentRepo.findDepartmentById(db, deptId);
    if (!dept) throw new ApiError(400, '존재하지 않는 부서입니다.');
}

async function assertPositionExists(db, positionId) {
    if (positionId == null) return;
    const position = await positionRepo.findPositionById(db, positionId);
    if (!position) throw new ApiError(400, '존재하지 않는 직책입니다.');
}

async function assertManagerValid(db, managerId, empId) {
    if (managerId == null) return;
    if (empId != null && managerId === empId) {
        throw new ApiError(400, '자기 자신을 직속상사로 지정할 수 없습니다.');
    }
    const manager = await employeeRepo.findById(db, managerId);
    if (!manager) throw new ApiError(400, '존재하지 않는 직속상사입니다.');
}

export async function listEmployees() {
    return employeeRepo.listAll(pool);
}

export async function getEmployee(empId) {
    const employee = await employeeRepo.findById(pool, empId);
    if (!employee) throw new ApiError(404, '직원을 찾을 수 없습니다.');
    const history = await historyRepo.listByEmployee(pool, empId);
    return { ...employee, history };
}

export async function createEmployee(input) {
    await assertDepartmentExists(pool, input.deptId);
    await assertPositionExists(pool, input.positionId);
    await assertManagerValid(pool, input.managerId ?? null, null);

    const duplicate = await employeeRepo.findByEmpNo(pool, input.empNo);
    if (duplicate) throw new ApiError(409, '이미 존재하는 사번입니다.');

    const empId = await employeeRepo.insert(pool, input);
    return getEmployee(empId);
}

export async function updateEmployee(empId, partial) {
    const current = await employeeRepo.findById(pool, empId);
    if (!current) throw new ApiError(404, '직원을 찾을 수 없습니다.');

    const merged = {
        empName: partial.empName !== undefined ? partial.empName : current.emp_name,
        email: partial.email !== undefined ? partial.email : current.email,
        phone: partial.phone !== undefined ? partial.phone : current.phone,
        deptId: partial.deptId !== undefined ? partial.deptId : current.dept_id,
        positionId: partial.positionId !== undefined ? partial.positionId : current.position_id,
        managerId: partial.managerId !== undefined ? partial.managerId : current.manager_id,
        memo: partial.memo !== undefined ? partial.memo : current.memo,
    };

    await assertDepartmentExists(pool, merged.deptId);
    await assertPositionExists(pool, merged.positionId);
    await assertManagerValid(pool, merged.managerId, empId);

    await employeeRepo.update(pool, empId, merged);
    return getEmployee(empId);
}

export async function changeEmployeeStatus(empId, { status, effectiveDate, remark }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const current = await employeeRepo.findById(client, empId, { forUpdate: true });
        if (!current) throw new ApiError(404, '직원을 찾을 수 없습니다.');

        const fromStatus = current.emp_status;
        if (fromStatus === status) {
            throw new ApiError(400, '현재 상태와 동일한 상태로는 변경할 수 없습니다.');
        }
        const allowedTargets = ALLOWED_TRANSITIONS[fromStatus] || [];
        if (!allowedTargets.includes(status)) {
            throw new ApiError(400, `${fromStatus} 상태에서 ${status} 상태로 변경할 수 없습니다.`);
        }

        const resolvedEffectiveDate = effectiveDate || toIsoDate(new Date());
        if (status === 'RESIGNED' && resolvedEffectiveDate < toIsoDate(current.hire_date)) {
            throw new ApiError(400, '퇴직일은 입사일보다 빠를 수 없습니다.');
        }

        const changeType = CHANGE_TYPE_BY_TRANSITION[`${fromStatus}->${status}`];

        await employeeRepo.updateStatus(client, empId, status);
        await historyRepo.insert(client, {
            empId,
            changeType,
            deptId: current.dept_id,
            positionId: current.position_id,
            effectiveDate: resolvedEffectiveDate,
            remark: remark || `${fromStatus} -> ${status}`,
        });

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }

    return getEmployee(empId);
}
