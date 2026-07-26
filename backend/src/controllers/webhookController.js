import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { workflowQueue } from '../workflow-engine/queue.js';

export const handleWebhook = asyncHandler(async (req, res) => {
  const workflowId = req.params.id;
  
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new ApiError(404, 'Workflow not found');
  }

  // Verify the workflow is meant to be triggered by a webhook
  if (workflow.triggerType !== 'webhook') {
    throw new ApiError(400, 'Workflow is not configured for webhook triggers');
  }

  if (workflow.status !== 'active') {
    throw new ApiError(400, 'Cannot trigger an inactive workflow');
  }

  // Create an execution record
  const execution = await WorkflowExecution.create({
    workflowId: workflow._id,
    triggeredBy: null, // Webhooks might not map to a user
    status: 'pending',
    logs: []
  });

  // Push to BullMQ
  await workflowQueue.add('execute-workflow', {
    executionId: execution._id.toString(),
    workflowId: workflow._id.toString(),
    payload: {
      body: req.body,
      query: req.query,
      headers: req.headers
    },
    userId: workflow.createdBy,
    orgId: workflow.orgId
  });

  res.status(202).json({ success: true, message: 'Webhook received', executionId: execution._id });
});
