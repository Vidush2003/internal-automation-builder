import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI features will fail.");
}

export const generateText = async (prompt, systemInstruction = null) => {
  if (!ai) throw new Error("Gemini API key is not configured.");
  
  const config = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config,
  });
  
  return response.text;
};

export const generateStructured = async (prompt, schema, systemInstruction = null) => {
  if (!ai) throw new Error("Gemini API key is not configured.");
  
  const config = {
    responseMimeType: "application/json",
  };
  
  if (schema) {
    config.responseSchema = schema;
  }
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error. Falling back to mock response.", error.message);
    // Fallback Mock Workflow
    return {
      name: "Mocked AI Workflow",
      description: `(MOCK) You asked for: ${prompt}`,
      triggerType: "webhook",
      nodes: [
        { id: "node-1", type: "TRIGGER_WEBHOOK", data: {}, position: { x: 250, y: 100 } },
        { id: "node-2", type: "ACTION_AI_DECIDE", data: { text: "{{trigger.payload.body}}", criteria: "Is this a positive message?" }, position: { x: 250, y: 250 } },
        { id: "node-3", type: "LOGIC_BRANCH", data: { condition: "node-2.decision === true" }, position: { x: 250, y: 400 } },
        { id: "node-4", type: "ACTION_EMAIL", data: { to: "team@company.com", subject: "Positive Feedback", body: "We got good feedback!" }, position: { x: 100, y: 550 } },
      ],
      edges: [
        { id: "e1-2", source: "node-1", target: "node-2" },
        { id: "e2-3", source: "node-2", target: "node-3" },
        { id: "e3-4", source: "node-3", target: "node-4", sourceHandle: "true" }
      ]
    };
  }
};
