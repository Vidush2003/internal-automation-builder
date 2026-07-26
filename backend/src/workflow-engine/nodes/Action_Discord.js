import { interpolateString } from '../../utils/interpolation.js';

/**
 * Action_Discord — sends a message to a Discord Incoming Webhook URL.
 * Discord's webhook body uses the "content" field (not "text" like Slack).
 * Non-2xx responses are thrown so the engine records this node as failed.
 */
export const execute = async (node, ctx) => {
  const webhookUrl = interpolateString(node.data.webhookUrl, ctx);
  const message    = interpolateString(node.data.message,    ctx);

  if (!webhookUrl) throw new Error('Discord Action: webhookUrl is required.');
  if (!message)    throw new Error('Discord Action: message is required.');

  console.log(`[Node: ${node.id}] Sending Discord message to ${webhookUrl}`);

  // Discord Incoming Webhook payload uses the "content" field.
  const body = JSON.stringify({ content: message });

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(`Discord Action: request failed — ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Discord returns 204 No Content on success — treat any 2xx as success.
  if (!response.ok) {
    const responseBody = await response.text().catch(() => '(unreadable body)');
    throw new Error(
      `Discord Action: non-2xx response — HTTP ${response.status}: ${responseBody}`
    );
  }

  return { success: true, status: response.status };
};
