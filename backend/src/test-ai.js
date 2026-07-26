import { generateStructured } from './services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function test() {
  try {
    const prompt = "Trigger on webhook, summarize customer email using AI, and email the team";
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

    const systemInstruction = `You are a Workflow Generator AI for 'AutomataX'.`;
    const result = await generateStructured(prompt, schema, systemInstruction);
    console.log("GENERATED WORKFLOW SUCCESS:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("FAILED:", err);
  }
}
test();
