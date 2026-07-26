// TODO: durable delay via BullMQ — required before any Delay node is used
// with a multi-hour+ duration in production, since in-memory sleep does not
// survive worker restarts/deploys.

import { interpolateString } from '../../utils/interpolation.js';
import { emitExecutionUpdate } from '../../services/socketService.js';

/**
 * Logic_Delay — pauses workflow execution for a configured duration.
 * Emits a "sleeping" socket event before waiting so the AppViewer shows live
 * progress rather than appearing hung. Resolves via setTimeout (in-memory).
 */
export const execute = async (node, ctx) => {
  const rawDuration = interpolateString(String(node.data.duration || '0'), ctx);
  const unit        = node.data.unit || 'seconds'; // 'seconds' | 'minutes'
  const duration    = parseFloat(rawDuration);

  if (isNaN(duration) || duration < 0) {
    throw new Error(`Delay Node: invalid duration value "${rawDuration}". Must be a non-negative number.`);
  }

  const ms = unit === 'minutes' ? duration * 60 * 1000 : duration * 1000;

  console.log(`[Node: ${node.id}] Sleeping for ${duration} ${unit} (${ms}ms)`);

  // Emit a "sleeping" status so the dashboard and AppViewer can show it live.
  emitExecutionUpdate(ctx.executionId, 'execution:node_sleeping', {
    nodeId:    node.id,
    status:    'sleeping',
    durationMs: ms,
    message:   `Waiting ${duration} ${unit}…`,
  });

  await new Promise((resolve) => setTimeout(resolve, ms));

  return { success: true, durationMs: ms, unit };
};
