import { Queue } from 'bullmq';
import { ENV } from '../config/env.js';
import { QUEUES, WORKER_OPTIONS } from '../constants/queue.js';

export const workflowQueue = new Queue(QUEUES.WORKFLOW, {
  connection: {
    url: ENV.REDIS_URL,
  },
  defaultJobOptions: {
    removeOnComplete: true, // Keep Redis clean
    removeOnFail: false,
    attempts: WORKER_OPTIONS.ATTEMPTS,
    backoff: {
      type: 'exponential',
      delay: WORKER_OPTIONS.BACKOFF_DELAY,
    },
  },
});
