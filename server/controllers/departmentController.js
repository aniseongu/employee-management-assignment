import * as departmentService from '../services/departmentService.js';

export async function list(req, res, next) {
    try {
        const departments = await departmentService.listDepartments();
        res.json({ success: true, data: departments, message: null });
    } catch (err) {
        next(err);
    }
}
