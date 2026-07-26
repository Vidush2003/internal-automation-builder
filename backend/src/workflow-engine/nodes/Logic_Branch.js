import { logSystemAction } from '../../utils/logger.js';

export const execute = async (node, ctx) => {
  let { condition } = node.data;
  
  if (!condition || !condition.trim()) {
    throw new Error('Logic Branch requires a condition');
  }

  // 1. Safely interpolate {{...}} tags into valid JavaScript literal strings/numbers
  let interpolatedCondition = condition.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const parts = path.split('.');
    let current = null;

    if (parts[0] === 'trigger') {
      current = ctx.global;
      parts.shift();
    } else if (ctx.nodes && ctx.nodes[parts[0]]) {
      current = ctx.nodes[parts[0]];
      parts.shift();
    } else {
      current = ctx.global;
    }

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }

    if (current === undefined || current === null) return 'undefined';
    if (typeof current === 'string') return JSON.stringify(current);
    return String(current);
  });

  let result = false;
  try {
    const trigger = ctx.global || {};
    const payload = (ctx.global && ctx.global.payload) ? ctx.global.payload : (ctx.global || {});
    const nodes = ctx.nodes || {};
    const globalData = ctx.global || {};

    // Safely evaluate within a scoped Function context
    const evaluator = new Function(
      'trigger', 'payload', 'nodes', 'global',
      `try {
        with (payload) {
          return Boolean(${interpolatedCondition});
        }
      } catch(e) {
        return false;
      }`
    );
    
    result = evaluator(trigger, payload, nodes, globalData);
  } catch (error) {
    console.warn(`[Logic_Branch] Evaluation fallback for condition "${interpolatedCondition}": ${error.message}`);
    result = false;
  }

  await logSystemAction({
    action: 'LOGIC_BRANCH',
    status: 'success',
    message: `Evaluated condition: "${condition}" (${interpolatedCondition}) -> ${result}`,
    metadata: { nodeId: node.id, result, condition },
    triggeredBy: ctx.userId,
    orgId: ctx.orgId
  });

  return {
    condition: interpolatedCondition,
    result: Boolean(result)
  };
};
