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
    model: 'gemini-3.6-flash',
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config,
  });
  return JSON.parse(response.text);
};
