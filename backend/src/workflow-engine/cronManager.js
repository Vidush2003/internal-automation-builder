import { workflowQueue } from './queue.js';
import Workflow from '../models/Workflow.js';

export const syncWorkflowCron = async (workflow) => {
  const jobId = `cron-${workflow._id.toString()}`;

  // Always attempt to remove the old repeatable job first
  const repeatableJobs = await workflowQueue.getRepeatableJobs();
  const existingJob = repeatableJobs.find(job => job.id === jobId);
  
  if (existingJob) {
    await workflowQueue.removeRepeatableByKey(existingJob.key);
  }

  // If the workflow is active and has a cron trigger, schedule it
  if (workflow.status === 'active' && workflow.triggerType === 'schedule') {
    const cronNode = workflow.nodes?.find(n => n.type === 'TRIGGER_CRON');
    if (cronNode && cronNode.data?.cron) {
      await workflowQueue.add('execute-workflow-cron', {
        workflowId: workflow._id.toString(),
        userId: workflow.createdBy,
        orgId: workflow.orgId
      }, {
        repeat: { pattern: cronNode.data.cron },
        jobId
      });
      console.log(`[Cron] Scheduled workflow ${workflow._id} with cron ${cronNode.data.cron}`);
    }
  }
};
