import { interpolateString } from '../../utils/interpolation.js';
import { logSystemAction } from '../../utils/logger.js';
import { generateStructured } from '../../services/geminiService.js';

export const execute = async (node, ctx) => {
  let { text, extractionSchema } = node.data;

  // Interpolate
  text = interpolateString(text || '', ctx);
  extractionSchema = interpolateString(extractionSchema || '', ctx);

  if (!text.trim()) throw new Error('AI Extract failed: No text provided.');
  if (!extractionSchema.trim()) throw new Error('AI Extract failed: No extraction instructions provided.');

  const prompt = `Extract data from the following text based on the instructions below. 
Return ONLY a valid JSON object that adheres to the instructions.

INSTRUCTIONS:
${extractionSchema}

TEXT:
${text}`;

  const systemInstruction = "You are an expert data extraction AI. You extract structured data from unstructured text based on instructions. You MUST output strictly valid JSON. Do not include markdown blocks (like ```json), just raw JSON.";

  try {
    const extractedData = await generateStructured(prompt, null, systemInstruction);
    
    if (ctx && ctx.executionId) {
      logSystemAction(ctx.executionId, `AI Extract successfully pulled structured data.`, 'success');
    }
    
    return { data: extractedData };
  } catch (err) {
    if (ctx && ctx.executionId) {
      logSystemAction(ctx.executionId, `AI Extract failed: ${err.message}`, 'error');
    }
    throw err;
  }
};
