import { Router } from 'express';
import employeeRoutes from './employeeRoutes.js';

const router = Router();

router.use('/employees', employeeRoutes);

export default router;
