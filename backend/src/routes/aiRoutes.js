import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { generateWorkflow } from '../controllers/aiController.js';

const router = express.Router();

router.use(requireAuth); // Ensure user is authenticated

router.post('/generate-workflow', generateWorkflow);

export default router;
