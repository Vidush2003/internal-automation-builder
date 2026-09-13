import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[EmailService] Missing SMTP credentials in .env! Cannot send email.');
    throw new Error('SMTP credentials not configured');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"AutomataX" <noreply@automatax.com>',
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[EmailService] Message sent: ${info.messageId}`);
  return info;
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Please click the link below to set a new password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
  `;
  return sendEmail({ to: email, subject: 'AutomataX Password Reset', html });
};

export const sendMagicLinkEmail = async (email, magicToken) => {
  const magicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/magic-login?token=${magicToken}`;
  const html = `
    <h2>Your Magic Link</h2>
    <p>Click the link below to securely log into your AutomataX account:</p>
    <a href="${magicUrl}">Log In Automatically</a>
    <p>This link will expire in 15 minutes.</p>
  `;
  return sendEmail({ to: email, subject: 'AutomataX Magic Login', html });
};
