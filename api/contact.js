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
  // IMPORTANT (deliverability): when using Gmail SMTP, FROM should typically match SMTP_USER.
  const FROM_EMAIL = process.env.SMTP_FROM || SMTP_USER || 'dhruvilthummar1303@gmail.com';
  // Admin/owner recipient (fallback to your Gmail so it works even if env is missing)
  const OWNER_EMAIL = process.env.NOTIFY_EMAIL || process.env.CONTACT_TO || 'dhruvilthummar1303@gmail.com';

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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background: #f6f7fb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px 20px; text-align: center; color: white; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .info-box { background: #f4f5ff; border-left: 4px solid #6366f1; padding: 15px; border-radius: 4px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-row:last-child { margin-bottom: 0; }
            .info-label { font-weight: 600; color: #555; width: 100px; }
            .info-value { color: #333; word-break: break-word; flex: 1; }
            .message-box { background: #ffffff; border: 1px solid #e6e8f5; border-left: 4px solid #6366f1; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.6; }
            .footer { background: #f6f7fb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e6e8f5; }
            .footer a { color: #4f46e5; text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
            .badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-right: 8px; }
            .socials { margin-top: 10px; }
            .social-link { display: inline-block; text-decoration: none; margin: 0 6px; }
            .social-badge { display: inline-block; min-width: 34px; height: 34px; line-height: 34px; text-align: center; border-radius: 999px; background: #ffffff; border: 1px solid #e6e8f5; color: #111827; font-weight: 800; font-size: 13px; box-shadow: 0 1px 6px rgba(17, 24, 39, 0.06); }
            .social-badge--li { color: #0a66c2; }
            .social-badge--gh { color: #111827; }
            .social-badge--ig { color: #d946ef; }
            .social-logo { width: 34px; height: 34px; border-radius: 999px; vertical-align: middle; border: 1px solid #e6e8f5; background: #ffffff; box-shadow: 0 1px 6px rgba(17, 24, 39, 0.06); }
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
              <div class="socials">
                <a class="social-link" href="https://drthummar.me/" aria-label="Open portfolio">
                  <img class="social-logo" src="https://drthummar.me/assets/dt-logo-circle.svg" alt="Portfolio" />
                </a>
                <a class="social-link" href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" aria-label="Open LinkedIn">
                  <span class="social-badge social-badge--li">in</span>
                </a>
                <a class="social-link" href="https://github.com/DhruvilThummar" aria-label="Open GitHub">
                  <span class="social-badge social-badge--gh">GH</span>
                </a>
                <a class="social-link" href="https://www.instagram.com/dhruvil_thummar_" aria-label="Open Instagram">
                  <span class="social-badge social-badge--ig">IG</span>
                </a>
              </div>
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Message received</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background: #f6f7fb; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 28px 20px; color: #fff; text-align: center; }
            .header h1 { font-size: 20px; margin-bottom: 6px; }
            .socials { margin-top: 10px; }
            .social-link { display: inline-block; text-decoration: none; margin: 0 6px; }
            .social-badge { display: inline-block; min-width: 34px; height: 34px; line-height: 34px; text-align: center; border-radius: 999px; background: #ffffff; border: 1px solid #e6e8f5; color: #111827; font-weight: 800; font-size: 13px; box-shadow: 0 1px 6px rgba(17, 24, 39, 0.06); }
            .social-badge--li { color: #0a66c2; }
            .social-badge--gh { color: #111827; }
            .social-badge--ig { color: #d946ef; }
            .social-logo { width: 34px; height: 34px; border-radius: 999px; vertical-align: middle; border: 1px solid #e6e8f5; background: #ffffff; box-shadow: 0 1px 6px rgba(17, 24, 39, 0.06); }
            .header p { font-size: 13px; opacity: 0.95; }
            .content { padding: 26px 20px; }
            .greeting { font-size: 15px; margin-bottom: 14px; }
            .card { background: #f4f5ff; border: 1px solid #e6e8f5; border-left: 4px solid #6366f1; border-radius: 8px; padding: 14px 14px; margin: 14px 0; }
            .label { font-size: 12px; letter-spacing: 0.4px; text-transform: uppercase; color: #4f46e5; font-weight: 700; margin-bottom: 10px; }
            .row { margin-bottom: 8px; }
            .row:last-child { margin-bottom: 0; }
            .k { font-weight: 700; color: #374151; display: inline-block; min-width: 84px; }
            .v { color: #222; word-break: break-word; }
            .v { color: #111827; word-break: break-word; }
            .message { background: #fff; border: 1px solid #e6e8f5; border-left: 4px solid #6366f1; border-radius: 8px; padding: 14px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; }
            .cta { margin-top: 16px; font-size: 13px; color: #4b5563; }
            .footer { padding: 18px 20px; background: #f6f7fb; border-top: 1px solid #e6e8f5; text-align: center; font-size: 12px; color: #6b7280; }
            .footer a { color: #4f46e5; text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
            .muted { color: #6b7280; }
          </style>
        </head>
        <body>
          <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
            Thanks for reaching out — I got your message.
          </div>

          <div class="container">
            <div class="header">
              <h1>✅ Got it!</h1>
              <p>Thanks for reaching out — I’ll get back soon.</p>
            </div>

            <div class="content">
              <p class="greeting">Hey <strong>${escapeHtml(cleanName)}</strong>,</p>
              <p class="muted">Just a quick note to say I got your message. I usually reply within <strong>1–2 business days</strong>.</p>

              <div class="card">
                <div class="label">Submission details</div>
                <div class="row"><span class="k">Subject:</span> <span class="v">${escapeHtml(cleanSubject)}</span></div>
                <div class="row"><span class="k">Received:</span> <span class="v">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</span></div>
              </div>

              <div class="label" style="margin-top:16px;">Your message</div>
              <div class="message">${escapeHtml(cleanMessage)}</div>

              <p class="cta"><strong>Forgot something?</strong> Just reply to this email (it comes straight to me), or send another message via the contact form.</p>
            </div>

            <div class="footer">
              <p>Sent from the contact form on <a href="https://drthummar.me/">drthummar.me</a></p>
              <div class="socials">
                <a class="social-link" href="https://drthummar.me/" aria-label="Open portfolio">
                  <img class="social-logo" src="https://drthummar.me/assets/dt-logo-circle.svg" alt="Portfolio" />
                </a>
                <a class="social-link" href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" aria-label="Open LinkedIn">
                  <span class="social-badge social-badge--li">in</span>
                </a>
                <a class="social-link" href="https://github.com/DhruvilThummar" aria-label="Open GitHub">
                  <span class="social-badge social-badge--gh">GH</span>
                </a>
                <a class="social-link" href="https://www.instagram.com/dhruvil_thummar_" aria-label="Open Instagram">
                  <span class="social-badge social-badge--ig">IG</span>
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hey ${cleanName},\n\nJust letting you know I got your message — thanks for reaching out! I usually reply within 1-2 business days.\n\nSubject: ${cleanSubject}\nReceived: ${new Date().toISOString()}\n\nYour message:\n${cleanMessage}\n\n---\n\nLinkedIn: https://www.linkedin.com/in/dhruvil-thummar-54422731a\nGitHub: https://github.com/DhruvilThummar\nInstagram: https://www.instagram.com/dhruvil_thummar_`,
    };

    // Send owner email (critical)
    const ownerInfo = await transporter.sendMail(ownerMailOptions);

    // Send confirmation email (best-effort)
    let senderInfo = null;
    try {
      senderInfo = await transporter.sendMail(senderMailOptions);
    } catch (sendErr) {
      console.warn('Sender confirmation failed (non-critical):', sendErr?.message || sendErr);
    }

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
