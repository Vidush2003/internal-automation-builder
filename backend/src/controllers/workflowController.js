import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { workflowQueue } from '../workflow-engine/queue.js';
import { syncWorkflowCron } from '../workflow-engine/cronManager.js';

export const createWorkflow = asyncHandler(async (req, res) => {
  const { name, description, triggerType, nodes, edges } = req.body;
  
  const workflow = await Workflow.create({
    name,
    description,
    triggerType,
    nodes: nodes || [],
    edges: edges || [],
    createdBy: req.session.userId,
    orgId: req.session.orgId
  });
  await syncWorkflowCron(workflow);

  res.status(201).json({ success: true, workflow });
});

export const listWorkflows = asyncHandler(async (req, res) => {
  // Only fetch workflows belonging to the user's organization (or user if no org)
  const query = req.session.orgId ? { orgId: req.session.orgId } : { createdBy: req.session.userId };
  const workflows = await Workflow.find(query).sort({ createdAt: -1 });
  
  res.status(200).json({ success: true, workflows });
});

export const getWorkflow = asyncHandler(async (req, res) => {
  const query = req.session.orgId 
    ? { _id: req.params.id, orgId: req.session.orgId }
    : { _id: req.params.id, createdBy: req.session.userId };
  const workflow = await Workflow.findOne(query);
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  
  res.status(200).json({ success: true, workflow });
});

export const updateWorkflow = asyncHandler(async (req, res) => {
  const { name, description, triggerType, nodes, edges, status } = req.body;
  
  const query = req.session.orgId 
    ? { _id: req.params.id, orgId: req.session.orgId }
    : { _id: req.params.id, createdBy: req.session.userId };
  
  const workflow = await Workflow.findOneAndUpdate(
    query,
    { name, description, triggerType, nodes, edges, status },
    { new: true, runValidators: true }
  );
  
  if (!workflow) throw new ApiError(404, 'Workflow not found');
    await syncWorkflowCron(workflow);

  res.status(200).json({ success: true, workflow });
});

export const deleteWorkflow = asyncHandler(async (req, res) => {
  const query = req.session.orgId 
    ? { _id: req.params.id, orgId: req.session.orgId }
    : { _id: req.params.id, createdBy: req.session.userId };
    
  const workflow = await Workflow.findOneAndDelete(query);
  if (!workflow) throw new ApiError(404, 'Workflow not found');
    await syncWorkflowCron({ ...workflow.toObject(), status: 'archived' }); // Force remove cron

  res.status(200).json({ success: true, message: 'Workflow deleted' });
});

export const triggerWorkflow = asyncHandler(async (req, res) => {
  const query = req.session.orgId 
    ? { _id: req.params.id, orgId: req.session.orgId }
    : { _id: req.params.id, createdBy: req.session.userId };
    
  const workflow = await Workflow.findOne(query);
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  
  if (workflow.status !== 'active' && workflow.status !== 'draft') {
    throw new ApiError(400, 'Cannot trigger an archived workflow');
  }

  // Create an execution record
  const execution = await WorkflowExecution.create({
    workflowId: workflow._id,
    triggeredBy: req.session.userId,
    status: 'pending',
    logs: []
  });

  // Push to BullMQ
  await workflowQueue.add('execute-workflow', {
    executionId: execution._id.toString(),
    workflowId: workflow._id.toString(),
    payload: req.body.payload || {}, // Initial trigger payload (e.g., webhook body)
    userId: req.session.userId,
    orgId: req.session.orgId
  });

  res.status(202).json({ success: true, message: 'Workflow queued for execution', executionId: execution._id });
});

export const getExecution = asyncHandler(async (req, res) => {
  const execution = await WorkflowExecution.findById(req.params.id).populate('workflowId');
  if (!execution) throw new ApiError(404, 'Execution not found');
  
  const workflow = execution.workflowId;
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  
  const hasAccess = req.session.orgId 
    ? workflow.orgId?.toString() === req.session.orgId.toString()
    : workflow.createdBy?.toString() === req.session.userId.toString();
    
  if (!hasAccess) throw new ApiError(403, 'Access denied');
  
  res.status(200).json(execution);
});
