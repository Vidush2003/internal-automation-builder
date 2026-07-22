import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  triggerWorkflow,
  getExecution
} from '../controllers/workflowController.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .post(createWorkflow)
  .get(listWorkflows);

router.get('/executions/:id', getExecution);

router.route('/:id')
  .get(getWorkflow)
  .put(updateWorkflow)
  .delete(deleteWorkflow);

router.post('/:id/trigger', triggerWorkflow);

export default router;
