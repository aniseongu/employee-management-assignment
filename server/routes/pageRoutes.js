import { Router } from 'express';
import path from 'path';

const router = Router();
const PAGES_DIR = path.join(process.cwd(), 'client/pages');

router.get('/', (req, res) => {
    res.sendFile(path.join(PAGES_DIR, 'employee-list.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(path.join(PAGES_DIR, 'employee-form.html'));
});

router.get('/detail', (req, res) => {
    res.sendFile(path.join(PAGES_DIR, 'employee-detail.html'));
});

export default router;
