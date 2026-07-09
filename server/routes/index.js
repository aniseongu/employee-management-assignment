import { Router } from 'express';
import employeeRoutes from './employeeRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import positionRoutes from './positionRoutes.js';

const router = Router();

router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);

export default router;
