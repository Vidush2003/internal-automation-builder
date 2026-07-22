export const execute = async (node, ctx) => {
  console.log(`[Node: ${node.id}] Executing Manual Trigger`);
  
  // Triggers usually output the global payload that initiated the workflow
  return ctx.global || {};
};
