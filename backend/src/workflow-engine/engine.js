import WorkflowExecution from '../models/WorkflowExecution.js';
import { emitExecutionUpdate } from '../services/socketService.js';
import * as Trigger_Manual from './nodes/Trigger_Manual.js';
import * as Action_HTTPRequest from './nodes/Action_HTTPRequest.js';
import * as Action_SendEmail from './nodes/Action_SendEmail.js';
import * as Logic_Branch from './nodes/Logic_Branch.js';
import * as Action_AISummarize from './nodes/Action_AISummarize.js';
import * as Action_AIExtract from './nodes/Action_AIExtract.js';
import * as Action_AIDecide from './nodes/Action_AIDecide.js';
import * as Action_Slack from './nodes/Action_Slack.js';
import * as Action_Discord from './nodes/Action_Discord.js';
import * as Logic_Delay from './nodes/Logic_Delay.js';
import * as Logic_Loop from './nodes/Logic_Loop.js';

const NODE_REGISTRY = {
  'TRIGGER_MANUAL':      Trigger_Manual.execute,
  'TRIGGER_WEBHOOK':     async (node, ctx) => ({ success: true, message: 'Webhook triggered' }),
  'TRIGGER_CRON':        async (node, ctx) => ({ success: true, message: 'Cron triggered' }),
  'ACTION_HTTP':         Action_HTTPRequest.execute,
  'ACTION_EMAIL':        Action_SendEmail.execute,
  'LOGIC_BRANCH':        Logic_Branch.execute,
  'ACTION_AI_SUMMARIZE': Action_AISummarize.execute,
  'ACTION_AI_EXTRACT':   Action_AIExtract.execute,
  'ACTION_AI_DECIDE':    Action_AIDecide.execute,
  'ACTION_SLACK':        Action_Slack.execute,
  'ACTION_DISCORD':      Action_Discord.execute,
  'LOGIC_DELAY':         Logic_Delay.execute,
  'LOGIC_LOOP':          Logic_Loop.execute,
};

/* ─── Graph utilities ─────────────────────────────────────────────────────── */

const buildAdjacencyList = (nodes, edges) => {
  const adj      = {};
  const inDegree = {};
  nodes.forEach(n => {
    adj[n.id]      = [];
    inDegree[n.id] = 0;
  });

  edges.forEach(e => {
    if (adj[e.source]) {
      adj[e.source].push({ target: e.target, condition: e.sourceHandle });
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
  });

  return { adj, inDegree };
};

/**
 * Extract all nodes reachable from `startNodeId` via the given `handle`.
 * This extracts the "loop body" subgraph without touching the top-level BFS.
 *
 * @param {string}   startNodeId  - The LOGIC_LOOP node's id.
 * @param {string}   handle       - Source handle to follow (e.g. "loop").
 * @param {object[]} allNodes     - All nodes in the workflow.
 * @param {object[]} allEdges     - All edges in the workflow.
 * @returns {{ subNodes: object[], subEdges: object[] }}
 */
const extractSubgraph = (startNodeId, handle, allNodes, allEdges) => {
  // Find the immediate successor(s) of startNodeId via the given handle.
  const entryEdges = allEdges.filter(
    e => e.source === startNodeId && e.sourceHandle === handle
  );

  if (entryEdges.length === 0) return { subNodes: [], subEdges: [] };

  // BFS to collect all nodes reachable from those entry points.
  const visited    = new Set();
  const queue      = entryEdges.map(e => e.target);
  queue.forEach(id => visited.add(id));

  // Build a node-id lookup for fast access.
  const nodeById = Object.fromEntries(allNodes.map(n => [n.id, n]));

  // Build a forward adjacency map for all edges.
  const fwdAdj = {};
  allEdges.forEach(e => {
    if (!fwdAdj[e.source]) fwdAdj[e.source] = [];
    fwdAdj[e.source].push(e.target);
  });

  while (queue.length > 0) {
    const current = queue.shift();
    (fwdAdj[current] || []).forEach(next => {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }

  const subNodes = [...visited].map(id => nodeById[id]).filter(Boolean);
  const subEdges = allEdges.filter(
    e => visited.has(e.source) && visited.has(e.target)
  );

  return { subNodes, subEdges };
};

/* ─── Subgraph executor (injected into LOGIC_LOOP) ────────────────────────── */

/**
 * Runs a subgraph BFS (used by the Loop node for each iteration).
 * Does NOT create a WorkflowExecution record — this is a lightweight
 * in-process run, not a full top-level execution.
 *
 * @param {object[]} nodes - Subgraph nodes (loop body).
 * @param {object[]} edges - Subgraph edges.
 * @param {object}   ctx   - Child context (already has item injected).
 * @returns {object} - Combined output from all subgraph nodes.
 */
const executeSubgraph = async (nodes, edges, ctx) => {
  if (nodes.length === 0) return {};

  const { adj, inDegree } = buildAdjacencyList(nodes, edges);
  const queue = nodes.filter(n => inDegree[n.id] === 0);
  const subCtx = { ...ctx, nodes: { ...ctx.nodes } };
  let executedCount = 0;

  while (queue.length > 0) {
    const node = queue.shift();
    executedCount++;

    const executor = NODE_REGISTRY[node.type];
    if (!executor) throw new Error(`Unknown node type in loop body: ${node.type}`);

    // Emit sub-node started event so dashboards can follow.
    emitExecutionUpdate(ctx.executionId, 'execution:node_started', { nodeId: node.id, inLoop: true });

    let output;
    try {
      output = await executor(node, subCtx);
      subCtx.nodes[node.id] = output;
      emitExecutionUpdate(ctx.executionId, 'execution:node_completed', {
        nodeId: node.id, output, status: 'success', inLoop: true
      });
    } catch (err) {
      emitExecutionUpdate(ctx.executionId, 'execution:node_failed', {
        nodeId: node.id, error: err.message, status: 'failed', inLoop: true
      });
      throw err;
    }

    // Edge traversal — identical logic to top-level BFS.
    (adj[node.id] || []).forEach(edge => {
      let shouldTraverse = true;
      if (node.type === 'LOGIC_BRANCH' && output && output.result !== undefined) {
        shouldTraverse = (String(output.result) === edge.condition);
      }
      if (shouldTraverse) {
        inDegree[edge.target]--;
        if (inDegree[edge.target] === 0) {
          queue.push(nodes.find(n => n.id === edge.target));
        }
      }
    });
  }

  return subCtx.nodes;
};

/* ─── Main workflow executor ──────────────────────────────────────────────── */

export const executeWorkflow = async (executionId, workflow, initialPayload, userContext = {}) => {
  console.log(`[Engine] Starting execution ${executionId} for workflow ${workflow._id}`);

  const execution = await WorkflowExecution.findById(executionId);
  execution.status = 'running';
  await execution.save();

  emitExecutionUpdate(executionId, 'execution:started', { executionId, status: 'running', workflowId: workflow._id });

  const { nodes, edges } = workflow;
  const { adj, inDegree } = buildAdjacencyList(nodes, edges);

  const queue = nodes.filter(n => inDegree[n.id] === 0);

  const ctx = {
    global:      initialPayload,
    nodes:       {},
    userId:      userContext.userId,
    orgId:       userContext.orgId,
    executionId,
  };

  let executedNodeCount = 0;

  try {
    while (queue.length > 0) {
      const node = queue.shift();
      executedNodeCount++;

      const logEntry = {
        nodeId:    node.id,
        status:    'running',
        startedAt: new Date(),
      };

      try {
        const executor = NODE_REGISTRY[node.type];
        if (!executor) throw new Error(`Unknown node type: ${node.type}`);

        emitExecutionUpdate(executionId, 'execution:node_started', { nodeId: node.id });

        let output;

        if (node.type === 'LOGIC_LOOP') {
          // Extract the subgraph connected to the "loop" handle for this node.
          const { subNodes, subEdges } = extractSubgraph(node.id, 'loop', nodes, edges);

          output = await executor(node, ctx, {
            executeSubgraph,
            loopNodes: subNodes,
            loopEdges: subEdges,
          });
        } else {
          output = await executor(node, ctx);
        }

        ctx.nodes[node.id] = output;
        logEntry.output    = output;
        logEntry.status    = 'success';
        logEntry.completedAt = new Date();

        emitExecutionUpdate(executionId, 'execution:node_completed', { nodeId: node.id, output, status: 'success' });
      } catch (error) {
        logEntry.status      = 'failed';
        logEntry.completedAt = new Date();
        logEntry.error       = error.message;
        execution.logs.push(logEntry);

        emitExecutionUpdate(executionId, 'execution:node_failed', { nodeId: node.id, error: error.message, status: 'failed' });
        throw error;
      }

      execution.logs.push(logEntry);

      // ── Edge traversal ───────────────────────────────────────────────────
      // For LOGIC_LOOP: the "loop" handle's subgraph was already consumed
      // by the recursive sub-execution above. Only follow the "done" handle
      // at the top-level BFS to continue the main flow after the loop.
      //
      // For LOGIC_BRANCH: follow the edge matching the branch result.
      //
      // For all other nodes: follow all outgoing edges.
      const nodeOutput = ctx.nodes[node.id];

      let skippedEdges = [];
      (adj[node.id] || []).forEach(edge => {
        let shouldTraverse = true;

        if (node.type === 'LOGIC_LOOP') {
          // At the top level, only traverse the "done" handle.
          // The "loop" handle was handled by executeSubgraph above.
          shouldTraverse = (edge.condition === 'done');
        } else if (node.type === 'LOGIC_BRANCH' && nodeOutput && nodeOutput.result !== undefined) {
          shouldTraverse = (String(nodeOutput.result) === edge.condition);
        }

        if (shouldTraverse) {
          inDegree[edge.target]--;
          if (inDegree[edge.target] === 0) {
            queue.push(nodes.find(n => n.id === edge.target));
          }
        } else {
          // Don't push "loop" body nodes into the main skip queue — they
          // were already run (or skipped) by executeSubgraph.
          if (node.type !== 'LOGIC_LOOP' || edge.condition !== 'loop') {
            skippedEdges.push(edge.target);
          }
        }
      });

      // BFS to recursively mark skipped branches to avoid cycle false-positives.
      if (skippedEdges.length > 0) {
        let skipQueue    = [...skippedEdges];
        let visitedSkips = new Set();
        while (skipQueue.length > 0) {
          let skipTarget = skipQueue.shift();
          if (visitedSkips.has(skipTarget)) continue;
          visitedSkips.add(skipTarget);

          inDegree[skipTarget]--;
          if (inDegree[skipTarget] === 0) {
            executedNodeCount++;
            execution.logs.push({
              nodeId:      skipTarget,
              status:      'skipped',
              startedAt:   new Date(),
              completedAt: new Date(),
              message:     'Branch skipped',
            });
            emitExecutionUpdate(executionId, 'execution:node_skipped', { nodeId: skipTarget, status: 'skipped' });
            (adj[skipTarget] || []).forEach(e => {
              skipQueue.push(e.target);
            });
          }
        }
      }
    }

    // Cycle / unreachable node detection.
    // Loop body nodes are counted separately inside executeSubgraph (they are
    // NOT part of the top-level BFS, so we adjust the expected count).
    const loopBodyNodeIds = new Set();
    nodes.forEach(n => {
      if (n.type === 'LOGIC_LOOP') {
        const { subNodes } = extractSubgraph(n.id, 'loop', nodes, edges);
        subNodes.forEach(sn => loopBodyNodeIds.add(sn.id));
      }
    });
    const expectedTopLevelCount = nodes.length - loopBodyNodeIds.size;

    if (executedNodeCount !== expectedTopLevelCount) {
      const errorMsg = 'Cyclic dependency detected or unreachable nodes! Workflow execution aborted.';
      execution.logs.push({ status: 'failed', startedAt: new Date(), completedAt: new Date(), error: errorMsg });
      emitExecutionUpdate(executionId, 'execution:failed', { executionId, error: errorMsg });
      throw new Error(errorMsg);
    }

    execution.status      = 'completed';
    execution.completedAt = new Date();
    execution.durationMs  = execution.completedAt - execution.startedAt;
    await execution.save();
    emitExecutionUpdate(executionId, 'execution:completed', { executionId, status: 'completed' });
    console.log(`[Engine] Execution ${executionId} completed successfully.`);
  } catch (error) {
    execution.status      = 'failed';
    execution.completedAt = new Date();
    execution.durationMs  = execution.completedAt - execution.startedAt;
    await execution.save();
    emitExecutionUpdate(executionId, 'execution:failed', { executionId, error: error.message, status: 'failed' });
    console.log(`[Engine] Execution ${executionId} failed: ${error.message}`);
    throw error;
  }
};
