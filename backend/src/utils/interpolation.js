/**
 * Interpolates a string with values from the context object.
 * e.g. "Hello {{trigger.payload.name}}" -> "Hello Alice"
 */
export const interpolateString = (template, ctx) => {
  if (typeof template !== 'string') return template;

  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, path) => {
    // path is something like "trigger.payload.email" or "nodes.node-123.output.data"
    // However, our ctx structure is:
    // ctx.global (initial payload) -> usually we can map "trigger.X" to "global.X"
    // ctx.nodes['node-id'] (node outputs) -> "node_id.X"
    
    // Let's resolve the path against ctx
    const parts = path.split('.');
    
    let current = null;
    
    // Special case for 'trigger' - map it to ctx.global
    if (parts[0] === 'trigger') {
      current = ctx.global;
      parts.shift(); // remove 'trigger'
      
      // Flexible payload aliasing:
      if (parts[0] === 'payload') {
        if (current && 'payload' in current) {
          current = current.payload;
        } else if (current && 'body' in current) {
          current = current.body;
        }
        parts.shift(); // remove 'payload'
      }
    } else {
      // It might be a node id like 'node-123'
      const nodeId = parts[0];
      if (ctx.nodes && ctx.nodes[nodeId]) {
        current = ctx.nodes[nodeId];
        parts.shift();
      }
    }

    if (!current) return match; // Unresolved

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return match; // Path not found
      }
    }

    return current !== undefined && current !== null 
      ? (typeof current === 'object' ? JSON.stringify(current) : String(current)) 
      : '';
  });
};

/**
 * Deeply interpolates an object or array.
 */
export const interpolateObject = (obj, ctx) => {
  if (typeof obj === 'string') {
    return interpolateString(obj, ctx);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => interpolateObject(item, ctx));
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value, ctx);
    }
    return result;
  }
  return obj;
};
