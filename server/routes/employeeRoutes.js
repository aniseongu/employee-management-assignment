import { Router } from 'express';
import * as employeeController from '../controllers/employeeController.js';

const router = Router();

router.get('/', employeeController.list);
router.post('/', employeeController.create);
router.get('/:id', employeeController.detail);
router.patch('/:id', employeeController.update);
router.patch('/:id/status', employeeController.changeStatus);

export default router;
