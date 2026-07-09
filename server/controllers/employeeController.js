import * as employeeService from '../services/employeeService.js';
import { validate } from '../utils/validate.js';
import {
    idParamSchema,
    employeeCreateSchema,
    employeeUpdateSchema,
    employeeStatusChangeSchema,
} from '../schemas/employeeSchemas.js';

export async function list(req, res, next) {
    try {
        const employees = await employeeService.listEmployees();
        res.json({ success: true, data: employees, message: null });
    } catch (err) {
        next(err);
    }
}

export async function detail(req, res, next) {
    try {
        const empId = validate(idParamSchema, req.params.id);
        const employee = await employeeService.getEmployee(empId);
        res.json({ success: true, data: employee, message: null });
    } catch (err) {
        next(err);
    }
}

export async function create(req, res, next) {
    try {
        const input = validate(employeeCreateSchema, req.body);
        const employee = await employeeService.createEmployee(input);
        res.status(201).json({ success: true, data: employee, message: '직원이 등록되었습니다.' });
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        const empId = validate(idParamSchema, req.params.id);
        const input = validate(employeeUpdateSchema, req.body);
        const employee = await employeeService.updateEmployee(empId, input);
        res.json({ success: true, data: employee, message: '직원 정보가 수정되었습니다.' });
    } catch (err) {
        next(err);
    }
}

export async function changeStatus(req, res, next) {
    try {
        const empId = validate(idParamSchema, req.params.id);
        const input = validate(employeeStatusChangeSchema, req.body);
        const employee = await employeeService.changeEmployeeStatus(empId, input);
        res.json({ success: true, data: employee, message: '재직상태가 변경되었습니다.' });
    } catch (err) {
        next(err);
    }
}
