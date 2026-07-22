import { Worker } from 'bullmq';
import { ENV } from '../config/env.js';
import Workflow from '../models/Workflow.js';
import { executeWorkflow } from './engine.js';
import { QUEUES, WORKER_OPTIONS } from '../constants/queue.js';

export const startWorker = () => {
  const worker = new Worker(QUEUES.WORKFLOW, async (job) => {
    const { executionId, workflowId, payload, userId, orgId } = job.data;
    
    console.log(`[Worker] Processing Job ${job.id} for Execution ${executionId}`);
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      throw new Error('Workflow not found in DB');
    }
    
    await executeWorkflow(executionId, workflow, payload, { userId, orgId });
    
  }, {
    connection: { url: ENV.REDIS_URL },
    concurrency: WORKER_OPTIONS.CONCURRENCY,
  });
  
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed.`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
  });
  
  console.log('[Worker] Workflow BullMQ Worker started and listening...');
  return worker;
};
