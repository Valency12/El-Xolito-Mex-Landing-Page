/**
 * Envío de correo vía SMTP (Hostinger u otro).
 * Variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 */
const nodemailer = require('nodemailer');

function isMailConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  const secure =
    String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
async function sendMail(opts) {
  if (!isMailConfigured()) {
    const err = new Error('SMTP no configurado (SMTP_HOST / SMTP_USER / SMTP_PASS)');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    'hola@elxolitomex.com';
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"El Xolito Mex" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || undefined
  });
}

module.exports = { isMailConfigured, sendMail };
