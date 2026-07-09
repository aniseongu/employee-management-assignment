import { pool } from '../lib/db.js';
import * as positionRepo from '../repositories/positionRepository.js';

export async function listPositions() {
    return positionRepo.listAll(pool);
}
