import { interpolateString } from '../../utils/interpolation.js';

/**
 * Action_Slack — sends a message to a Slack Incoming Webhook URL.
 * Non-2xx responses are thrown so the engine records this node as failed.
 */
export const execute = async (node, ctx) => {
  const webhookUrl = interpolateString(node.data.webhookUrl, ctx);
  const message    = interpolateString(node.data.message,    ctx);

  if (!webhookUrl) throw new Error('Slack Action: webhookUrl is required.');
  if (!message)    throw new Error('Slack Action: message is required.');

  console.log(`[Node: ${node.id}] Sending Slack message to ${webhookUrl}`);

  // Slack Incoming Webhook payload uses the "text" field.
  const body = JSON.stringify({ text: message });

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
    throw new Error(`Slack Action: request failed — ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '(unreadable body)');
    throw new Error(
      `Slack Action: non-2xx response — HTTP ${response.status}: ${responseBody}`
    );
  }

  return { success: true, status: response.status };
};
