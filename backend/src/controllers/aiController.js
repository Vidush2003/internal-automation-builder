import { asyncHandler } from '../middlewares/asyncHandler.js';
import { generateStructured } from '../services/geminiService.js';
import Workflow from '../models/Workflow.js';

export const generateWorkflow = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Prompt is required' });
  }

  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      triggerType: { type: "string", enum: ["manual", "webhook", "schedule"] },
      nodes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["TRIGGER_MANUAL", "TRIGGER_WEBHOOK", "TRIGGER_CRON", "ACTION_HTTP", "ACTION_EMAIL", "LOGIC_BRANCH", "ACTION_AI_SUMMARIZE", "ACTION_AI_EXTRACT", "ACTION_AI_DECIDE"] },
            data: { type: "object" },
            position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } }
          },
          required: ["id", "type", "position"]
        }
      },
      edges: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            source: { type: "string" },
            target: { type: "string" },
            sourceHandle: { type: "string" },
            targetHandle: { type: "string" }
          },
          required: ["id", "source", "target"]
        }
      }
    },
    required: ["name", "description", "triggerType", "nodes", "edges"]
  };

  const systemInstruction = `You are a Workflow Generator AI for 'AutomataX'. You take a user's request and build a valid JSON workflow graph. 
Nodes can be of the following types:
- TRIGGER_MANUAL: triggered manually.
- TRIGGER_WEBHOOK: triggered via HTTP POST. Data is in \`{{trigger.payload.some_key}}\`.
- TRIGGER_CRON: triggered on a schedule.
- ACTION_HTTP: makes an HTTP request. \`data: { method: 'GET|POST', url: string, body: string, headers: string }\`. Output is usually JSON.
- ACTION_EMAIL: sends an email. \`data: { to: string, subject: string, body: string }\`.
- LOGIC_BRANCH: evaluates a JS condition. \`data: { condition: string }\`. Has source handles "true" and "false".
- ACTION_AI_SUMMARIZE: \`data: { text: string, length: 'short|medium|long' }\`. Outputs \`summary\`.
- ACTION_AI_EXTRACT: \`data: { text: string, extractionSchema: string }\`. Outputs \`data\`.
- ACTION_AI_DECIDE: \`data: { text: string, criteria: string }\`. Outputs \`decision\` (boolean) and \`reasoning\`.

Important rules:
1. Every workflow MUST start with exactly one TRIGGER node.
2. Nodes must have unique \`id\` strings (e.g. 'node-1'). Edges connect them via \`source\` and \`target\`.
3. If using LOGIC_BRANCH, specify \`sourceHandle: "true"\` or \`sourceHandle: "false"\` on the outgoing edge.
4. Arrange positions nicely. e.g. x: 250, y increments by 150 for each step.`;

  const result = await generateStructured(prompt, schema, systemInstruction);

  const sanitizedNodes = result.nodes.map(n => ({
    ...n,
    type: "automation",
    data: { ...(n.data || {}), type: n.type }
  }));

  const workflow = await Workflow.create({
    name: result.name || "AI Generated Workflow",
    description: result.description || prompt,
    triggerType: result.triggerType,
    nodes: sanitizedNodes,
    edges: result.edges,
    createdBy: req.session.userId
  });

  res.status(201).json({ success: true, workflow });
});
