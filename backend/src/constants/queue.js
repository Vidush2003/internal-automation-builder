export const QUEUES = Object.freeze({
  WORKFLOW: 'workflowQueue',
});

export const WORKER_OPTIONS = Object.freeze({
  CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY, 10) || 5,
  ATTEMPTS: 3,
  BACKOFF_DELAY: 1000,
});
