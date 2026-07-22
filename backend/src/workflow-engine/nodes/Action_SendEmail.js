import nodemailer from 'nodemailer';
import { logSystemAction } from '../../utils/logger.js';

export const execute = async (node, ctx) => {
  const { to, subject, body } = node.data;
  const executionId = ctx.executionId; // Assuming passed in ctx or we extract it
  
  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"automataX System" <no-reply-automataX@gmail.com>',
      to: to,
      subject: subject,
      text: body,
      html: `<p>${body}</p>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    await logSystemAction({
      action: 'SEND_EMAIL',
      status: 'success',
      message: `Sent email to ${to}`,
      metadata: {
        nodeId: node.id,
        previewUrl: previewUrl,
        messageId: info.messageId
      },
      triggeredBy: ctx.userId,
      orgId: ctx.orgId
    });

    return { 
      success: true, 
      message: 'Email sent successfully.', 
      previewUrl: previewUrl 
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
