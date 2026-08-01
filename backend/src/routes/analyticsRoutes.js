import express from 'express';
import { getDashboardAnalytics, getPublicStats } from '../controllers/analyticsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/public', getPublicStats);
router.get('/dashboard', requireAuth, getDashboardAnalytics);

export default router;