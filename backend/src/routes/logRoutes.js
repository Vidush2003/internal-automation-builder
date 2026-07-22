import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getLogs } from '../controllers/logController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getLogs);

export default router;
