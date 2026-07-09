import { Router } from 'express';
import * as positionController from '../controllers/positionController.js';

const router = Router();

router.get('/', positionController.list);

export default router;
