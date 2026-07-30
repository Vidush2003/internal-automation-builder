import { interpolateString } from '../../utils/interpolation.js';
import { logSystemAction } from '../../utils/logger.js';
import { generateStructured } from '../../services/geminiService.js';

export const execute = async (node, ctx) => {
  let { text, criteria } = node.data;

  // Interpolate
  text = interpolateString(text || '', ctx);
  criteria = interpolateString(criteria || '', ctx);

  if (!text.trim()) throw new Error('AI Decide failed: No text provided.');
  if (!criteria.trim()) throw new Error('AI Decide failed: No decision criteria provided.');

  const prompt = `Evaluate the following text against the decision criteria.
Return ONLY a valid JSON object with a boolean 'decision' and a string 'reasoning'.

CRITERIA:
${criteria}

TEXT:
${text}`;

  const systemInstruction = "You are an analytical AI that evaluates text against specific criteria. You MUST output strictly valid JSON with the format {\"decision\": true/false, \"reasoning\": \"string\"}. Do not include markdown blocks (like ```json), just raw JSON.";

  try {
    const result = await generateStructured(prompt, null, systemInstruction);
    
    if (ctx && ctx.executionId) {
      logSystemAction({
        action: 'ACTION_AI_DECIDE',
        status: 'success',
        message: `AI Decision: ${result.decision} (Reason: ${result.reasoning})`,
        metadata: { executionId: ctx.executionId, result }
      });
    }
    
    return result;
  } catch (err) {
    if (ctx && ctx.executionId) {
      logSystemAction({
        action: 'ACTION_AI_DECIDE',
        status: 'error',
        message: `AI Decide failed: ${err.message}`,
        metadata: { executionId: ctx.executionId, error: err.message }
      });
    }
    throw err;
  }
};
