const nodemailer = require('nodemailer');

/**
 * Contact form API handler
 * Sends emails to both the site owner and the person who submitted the form
 */
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const MAX_NAME_LEN = 100;
const MAX_EMAIL_LEN = 254;
const MAX_SUBJECT_LEN = 200;
const MAX_MESSAGE_LEN = 5000;

function stripNewlines(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text || '').replace(/[&<>"']/g, (m) => map[m]);
}

module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { name, email, subject, message, company, website } = req.body || {};

  // Honeypot (anti-spam): if filled, pretend success and do nothing.
  const trapValue = typeof company === 'string' ? company : (typeof website === 'string' ? website : '');
  if (trapValue && trapValue.trim().length > 0) {
    console.warn('Honeypot triggered; dropping submission', { ip: getClientIp(req) });
    return res.status(200).json({ ok: true, message: 'Message received.' });
  }

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters' });
  }

  const cleanName = name.trim().substring(0, MAX_NAME_LEN);
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.length > MAX_EMAIL_LEN || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  const cleanSubject = stripNewlines(subject || 'Portfolio Contact Form').substring(0, MAX_SUBJECT_LEN);
  const cleanMessage = String(message).trim().substring(0, MAX_MESSAGE_LEN);

  // Configuration - prefer environment variables
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const FROM_EMAIL = process.env.SMTP_FROM || 'official@dhruvilthummar.me';
  const OWNER_EMAIL = process.env.NOTIFY_EMAIL || 'official@dhruvilthummar.me';

  const hasSmtp = SMTP_HOST && SMTP_USER && SMTP_PASS;

  if (!hasSmtp) {
    // Log the submission if SMTP is not configured
    console.log('Contact form submission logged (SMTP not configured):', {
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      timestamp: new Date().toISOString(),
    });
    return res.status(200).json({ 
      ok: true, 
      message: 'Message logged (SMTP not configured)' 
    });
  }

  try {
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Sensible defaults for serverless environments
      connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000', 10),
      greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '10000', 10),
      socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '20000', 10),
    });

    if (process.env.SMTP_VERIFY === 'true') {
      await transporter.verify();
    }

    const fromHeader = process.env.SMTP_FROM_NAME
      ? `${stripNewlines(process.env.SMTP_FROM_NAME)} <${FROM_EMAIL}>`
      : `Dhruvil Thummar <${FROM_EMAIL}>`;

    // Email to site owner with all submission details
    const ownerMailOptions = {
      from: fromHeader,
      to: OWNER_EMAIL,
      replyTo: { name: cleanName, address: cleanEmail },
      subject: `New Contact: ${cleanSubject} — from ${cleanName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Submission</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); padding: 30px 20px; text-align: center; color: white; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .info-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-row:last-child { margin-bottom: 0; }
            .info-label { font-weight: 600; color: #555; width: 100px; }
            .info-value { color: #333; word-break: break-word; flex: 1; }
            .message-box { background: #ffffff; border: 1px solid #e0e0e0; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.6; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
            .footer a { color: #00bfff; text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
            .badge { display: inline-block; background: #00bfff; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📩 New Contact Submission</h1>
              <p>Someone reached out through your portfolio</p>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">Visitor Details</div>
                <div class="info-box">
                  <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value"><strong>${escapeHtml(cleanName)}</strong></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value"><a href="mailto:${cleanEmail}">${cleanEmail}</a></div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Subject:</div>
                    <div class="info-value">${escapeHtml(cleanSubject)}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Received:</div>
                    <div class="info-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Message</div>
                <div class="message-box">${escapeHtml(cleanMessage)}</div>
              </div>

              <div class="section">
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;"><strong>💡 Quick Actions:</strong></p>
                <p style="font-size: 13px; color: #666;">
                  • Reply directly to <strong>${cleanEmail}</strong><br>
                  • Check your portfolio dashboard for management tools<br>
                  • Mark as spam if needed
                </p>
              </div>
            </div>

            <div class="footer">
              <p>This email was sent from your portfolio contact form at <a href="https://drthummar.me/">drthummar.me</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `New Contact Submission\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\nReceived: ${new Date().toISOString()}\n\nMessage:\n${cleanMessage}\n\n---\nReply to: ${cleanEmail}`,
    };

    // Confirmation email to the person who submitted the form
    const senderMailOptions = {
      from: fromHeader,
      to: cleanEmail,
      replyTo: OWNER_EMAIL,
      subject: `Got your message — ${cleanSubject}`,
      html: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="x-apple-disable-message-reformatting" />
            <title>Got your message</title>
            <style>
              body { margin: 0; padding: 0; background: #0b0a12; }
              table { border-collapse: collapse; }
              img { border: 0; outline: none; text-decoration: none; }
              a { color: #a78bfa; text-decoration: none; }
              .container { width: 100%; background: #0b0a12; padding: 28px 12px; }
              .card { width: 100%; max-width: 600px; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 26px rgba(0,0,0,0.35); }
              .header { background: #1b1033; background: linear-gradient(135deg, #1b1033 0%, #2a1450 60%, #1b1033 100%); padding: 26px 20px; color: #ffffff; text-align: left; }
              .h1 { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 26px; line-height: 1.2; margin: 0; }
              .sub { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.5; margin: 10px 0 0; opacity: 0.95; }
              .content { padding: 18px 20px 8px; }
              .p { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #333333; margin: 0 0 12px; }
              .muted { color: #666666; }
              .badge { display: inline-block; background: #1b1033; color: #ffffff; border: 1px solid #a78bfa; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; }
              .sectionTitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.6px; margin: 18px 0 10px; }
              .box { background: #fbfaff; border: 1px solid #eee9ff; border-left: 4px solid #7c3aed; border-radius: 10px; padding: 12px 14px; }
              .row { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #333333; margin: 0; }
              .btn { display: inline-block; background: #7c3aed; color: #ffffff !important; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; }
              .btnOutline { display: inline-block; border: 1px solid #7c3aed; color: #7c3aed !important; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 700; }
              .footer { padding: 14px 20px 22px; }
              .foot { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #888888; margin: 0; text-align: center; }
              .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
            </style>
          </head>
          <body>
            <div class="preheader">Got it — thanks for reaching out. I’ll reply soon.</div>
            <table role="presentation" width="100%" class="container">
              <tr>
                <td align="center">
                  <table role="presentation" class="card" width="600">
                    <tr>
                      <td class="header">
                        <div class="h1">Got your message</div>
                        <div class="sub">Thanks for reaching out — I’ll get back to you soon.</div>
                      </td>
                    </tr>
                    <tr>
                      <td class="content">
                        <div class="badge">Received</div>
                        <p class="p" style="margin-top: 12px;">Hey <strong>${escapeHtml(cleanName.split(' ')[0])}</strong>,</p>
                        <p class="p muted">Just confirming I received your note. I usually reply within 1–2 business days.</p>

                        <div class="sectionTitle">Your submission</div>
                        <div class="box">
                          <p class="row"><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
                          <p class="row"><strong>Received:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</p>
                        </div>

                        <div class="sectionTitle">Message</div>
                        <div class="box" style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(cleanMessage)}</div>

                        <div class="sectionTitle">Quick links</div>
                        <table role="presentation" width="100%" style="margin: 6px 0 0;">
                          <tr>
                            <td align="left" style="padding: 4px 0;">
                              <a class="btn" href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" target="_blank" rel="noopener">LinkedIn</a>
                            </td>
                            <td align="left" style="padding: 4px 0;">
                              <a class="btnOutline" href="https://github.com/DhruvilThummar" target="_blank" rel="noopener">GitHub</a>
                            </td>
                          </tr>
                        </table>

                        <p class="p muted" style="margin-top: 16px;">If it’s urgent, just reply to this email and include a quick note in the subject.</p>
                      </td>
                    </tr>
                    <tr>
                      <td class="footer">
                        <p class="foot">This is an automated confirmation.</p>
                        <p class="foot">Please don’t share sensitive information over email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hey ${cleanName},\n\nGot your message — thanks for reaching out. I usually reply within 1-2 business days.\n\nSubject: ${cleanSubject}\nReceived: ${new Date().toISOString()}\n\nYour message:\n${cleanMessage}\n\n---\n\nPortfolio: https://drthummar.me\nLinkedIn: https://www.linkedin.com/in/dhruvil-thummar-54422731a\nGitHub: https://github.com/DhruvilThummar`,
    };

    // Send both emails
  const ownerInfo = await transporter.sendMail(ownerMailOptions);
  const senderInfo = await transporter.sendMail(senderMailOptions);

    console.log(`Contact form submission processed: ${cleanEmail}`);

    return res.status(200).json({
      ok: true,
      message: 'Emails sent successfully! Check your inbox for confirmation.',
      delivery: {
        ownerMessageId: ownerInfo?.messageId,
        senderMessageId: senderInfo?.messageId,
      },
    });
  } catch (error) {
    console.error('Contact form error:', error?.message || error);
    return res.status(500).json({
      error: 'Failed to send message. Please try again later.',
    });
  }
};
