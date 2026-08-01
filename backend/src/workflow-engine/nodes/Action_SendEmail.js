import { Resend } from 'resend';
import { logSystemAction } from '../../utils/logger.js';
import { interpolateString } from '../../utils/interpolation.js';
import { ENV } from '../../config/env.js';

export const execute = async (node, ctx) => {
  const to = interpolateString(node.data.to, ctx);
  const subject = interpolateString(node.data.subject, ctx);
  const body = interpolateString(node.data.body, ctx);
  const executionId = ctx.executionId;
  
  try {
    if (!ENV.RESEND_API_KEY) {
      console.warn('[Action_SendEmail] RESEND_API_KEY is not set! Skipping email delivery.');
      return { success: false, message: 'RESEND_API_KEY is not configured.' };
    }

    const resend = new Resend(ENV.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: ENV.EMAIL_FROM_ADDRESS,
      to: [to],
      subject: subject,
      text: body,
      html: `<p>${body}</p>`,
    });

    if (error) {
      throw new Error(error.message);
    }

    await logSystemAction({
      action: 'SEND_EMAIL',
      status: 'success',
      message: `Sent email to ${to} via Resend`,
      metadata: {
        nodeId: node.id,
        resendId: data.id
      },
      triggeredBy: ctx.userId,
      orgId: ctx.orgId
    });

    return { 
      success: true, 
      message: 'Email sent successfully via Resend.', 
      resendId: data.id 
    };
  } catch (error) {
    await logSystemAction({
      action: 'SEND_EMAIL',
      status: 'error',
      message: `Failed to send email to ${to}: ${error.message}`,
      metadata: { nodeId: node.id },
      triggeredBy: ctx.userId,
      orgId: ctx.orgId
    });
    
    return { success: false, error: error.message };
  }
};
