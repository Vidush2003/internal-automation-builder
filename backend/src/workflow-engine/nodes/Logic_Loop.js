import { interpolateString } from '../../utils/interpolation.js';

/**
 * Logic_Loop — For-Each iterator node.
 *
 * Resolves `node.data.arrayInput` to an actual JS array, then runs the
 * subgraph connected to the "loop" handle once per item (sequentially).
 * When all iterations complete, the engine continues along the "done" handle.
 *
 * Recursive sub-execution approach (per Phase 6 spec, decision #2):
 *   - Each iteration spawns an isolated call to `executeWorkflow` with a fresh
 *     context copy that injects the current item under `itemVariableName`.
 *   - No shared mutable state between iterations.
 *
 * Failure policy — fail-fast (decision #4):
 *   - If any iteration throws, the loop stops immediately and re-throws with
 *     the failing iteration index and message attached.
 *
 * Empty array (edge case):
 *   - Zero iterations. Skips the loop body entirely and returns immediately
 *     so the engine continues to the "done" handle.
 *
 * NOTE: Iterations run sequentially for Phase 6 (decision #3).
 * TODO: concurrent iteration via Promise.all/pool — revisit when rate-limit
 *       and partial-failure semantics are defined for this platform.
 *
 * @param {object} node - The ReactFlow node definition including node.data.
 * @param {object} ctx  - Shared execution context.
 * @param {object} loopHelpers - Injected by engine.js to avoid circular imports:
 *   { executeSubgraph: fn, nodes: [], edges: [], loopHandleTarget: string|null }
 */
export const execute = async (node, ctx, loopHelpers = {}) => {
  const { executeSubgraph, loopNodes, loopEdges } = loopHelpers;

  // Resolve arrayInput — supports {{...}} expressions.
  const rawInput       = node.data.arrayInput || '';
  const itemVarName    = node.data.itemVariableName || 'item';
  const interpolated   = interpolateString(rawInput, ctx);

  // Attempt to parse if the result is a JSON string representing an array.
  let items;
  if (Array.isArray(interpolated)) {
    items = interpolated;
  } else if (typeof interpolated === 'string') {
    try {
      const parsed = JSON.parse(interpolated);
      if (!Array.isArray(parsed)) {
        throw new Error(
          `Loop Node: expression "${rawInput}" resolved to a non-array value (${typeof parsed}). ` +
          `Ensure the referenced path points to a JSON array.`
        );
      }
      items = parsed;
    } catch (parseErr) {
      // If it wasn't valid JSON at all, the interpolation didn't resolve.
      if (interpolated === rawInput) {
        throw new Error(
          `Loop Node: expression "${rawInput}" could not be resolved — the referenced path ` +
          `does not exist in the execution context.`
        );
      }
      throw new Error(
        `Loop Node: expression "${rawInput}" resolved to a non-array string value. ` +
        `Value: "${interpolated}". Expected a JSON array.`
      );
    }
  } else {
    throw new Error(
      `Loop Node: expression "${rawInput}" resolved to an unexpected type ` +
      `(${typeof interpolated}). Expected a JSON array.`
    );
  }

  console.log(`[Node: ${node.id}] Loop starting — ${items.length} iteration(s) over "${rawInput}"`);

  // Empty array — proceed to "done" immediately, no iterations.
  if (items.length === 0) {
    console.log(`[Node: ${node.id}] Loop: empty array — skipping loop body.`);
    return { success: true, iterationCount: 0, results: [] };
  }

  // Guard: if the engine didn't provide a subgraph executor (misconfiguration),
  // fall back gracefully rather than crashing with an opaque error.
  if (typeof executeSubgraph !== 'function') {
    throw new Error(
      'Loop Node: executeSubgraph helper was not injected by the engine. ' +
      'This is an engine misconfiguration, not a workflow error.'
    );
  }

  const results = [];

  // Sequential iteration — see TODO above for concurrent alternative.
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[Node: ${node.id}] Loop iteration ${i + 1}/${items.length}`);

    // Build a child context: deep-copy parent context, inject current item.
    const childCtx = {
      ...ctx,
      global: { ...ctx.global },
      nodes:  { ...ctx.nodes },
      // Expose the current item under the user-configured variable name.
      [itemVarName]: item,
      loopIndex: i,
    };

    try {
      const iterResult = await executeSubgraph(loopNodes, loopEdges, childCtx);
      results.push({ index: i, result: iterResult });
    } catch (iterErr) {
      // Fail-fast: stop on first iteration failure, surface which index failed.
      throw new Error(
        `Loop Node: iteration ${i} (0-indexed) failed — ${iterErr.message}`
      );
    }
  }

  return { success: true, iterationCount: items.length, results };
};
