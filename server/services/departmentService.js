import { pool } from '../lib/db.js';
import * as departmentRepo from '../repositories/departmentRepository.js';

export async function listDepartments() {
    return departmentRepo.listAll(pool);
}
