import WorkflowExecution from '../models/WorkflowExecution.js';
import * as Trigger_Manual from './nodes/Trigger_Manual.js';
import * as Action_HTTPRequest from './nodes/Action_HTTPRequest.js';
import * as Action_SendEmail from './nodes/Action_SendEmail.js';

const NODE_REGISTRY = {
  'TRIGGER_MANUAL': Trigger_Manual.execute,
  'ACTION_HTTP': Action_HTTPRequest.execute,
  'ACTION_EMAIL': Action_SendEmail.execute,
};

const buildAdjacencyList = (nodes, edges) => {
  const adj = {};
  const inDegree = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  });
  
  edges.forEach(e => {
    if (adj[e.source]) {
      adj[e.source].push(e.target);
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
  });
  
  return { adj, inDegree };
};

export const executeWorkflow = async (executionId, workflow, initialPayload, userContext = {}) => {
  console.log(`[Engine] Starting execution ${executionId} for workflow ${workflow._id}`);
  
  const execution = await WorkflowExecution.findById(executionId);
  execution.status = 'running';
  await execution.save();
  
  const { nodes, edges } = workflow;
  const { adj, inDegree } = buildAdjacencyList(nodes, edges);
  
  const queue = nodes.filter(n => inDegree[n.id] === 0);
  
  const ctx = {
    global: initialPayload,
    nodes: {}, // Stores outputs of previous nodes (e.g. ctx.nodes['node_1'].data)
    userId: userContext.userId,
    orgId: userContext.orgId,
    executionId
  };
  
  let executedNodeCount = 0;

  try {
    while (queue.length > 0) {
      const node = queue.shift();
      executedNodeCount++;
      
      const logEntry = {
        nodeId: node.id,
        status: 'running',
        startedAt: new Date()
      };
      
      try {
        const executor = NODE_REGISTRY[node.type];
        if (!executor) {
           throw new Error(`Unknown node type: ${node.type}`);
        } 
        
        const output = await executor(node, ctx);
        ctx.nodes[node.id] = output;
        logEntry.output = output;
        
        logEntry.status = 'success';
        logEntry.completedAt = new Date();
      } catch (error) {
        logEntry.status = 'failed';
        logEntry.completedAt = new Date();
        logEntry.error = error.message;
        execution.logs.push(logEntry);
        throw error;
      }
      
      execution.logs.push(logEntry);
      
      (adj[node.id] || []).forEach(neighborId => {
        inDegree[neighborId]--;
        if (inDegree[neighborId] === 0) {
          queue.push(nodes.find(n => n.id === neighborId));
        }
      });
    }

    if (executedNodeCount !== nodes.length) {
      const errorMsg = 'Cyclic dependency detected or unreachable nodes! Workflow execution aborted.';
      execution.logs.push({
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        error: errorMsg
      });
      throw new Error(errorMsg);
    }
    
    execution.status = 'completed';
    execution.completedAt = new Date();
    await execution.save();
    console.log(`[Engine] Execution ${executionId} completed successfully.`);
  } catch (error) {
    execution.status = 'failed';
    execution.completedAt = new Date();
    await execution.save();
    console.log(`[Engine] Execution ${executionId} failed: ${error.message}`);
    throw error; 
  }
};
