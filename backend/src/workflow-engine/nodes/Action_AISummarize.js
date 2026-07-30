import { interpolateString } from '../../utils/interpolation.js';
import { logSystemAction } from '../../utils/logger.js';
import { generateText } from '../../services/geminiService.js';

export const execute = async (node, ctx) => {
  let { text, length } = node.data;

  // Interpolate
  text = interpolateString(text || '', ctx);
  length = interpolateString(length || 'medium', ctx);

  if (!text.trim()) throw new Error('AI Summarize failed: No text provided.');

  const prompt = `Please summarize the following text. The desired length is: ${length}.\n\nText to summarize:\n${text}`;
  const systemInstruction = "You are a highly capable AI assistant specialized in reading comprehension and summarization. Provide clear, accurate, and well-structured summaries.";

  try {
    const summary = await generateText(prompt, systemInstruction);
    
    // Fallback context mock if running outside of engine (e.g. unit tests)
    if (ctx && ctx.executionId) {
      logSystemAction({
        action: 'ACTION_AI_SUMMARIZE',
        status: 'success',
        message: `AI Summarize generated a ${length} summary (${summary.length} chars).`,
        metadata: { executionId: ctx.executionId, length: summary.length }
      });
    }
    
    return { summary };
  } catch (err) {
    if (ctx && ctx.executionId) {
      logSystemAction({
        action: 'ACTION_AI_SUMMARIZE',
        status: 'error',
        message: `AI Summarize failed: ${err.message}`,
        metadata: { executionId: ctx.executionId, error: err.message }
      });
    }
    throw err;
  }
};
