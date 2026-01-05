const nodemailer = require('nodemailer');

/**
 * Contact form API handler
 * Sends emails to both the site owner and the person who submitted the form
 */
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { name, email, subject, message } = req.body || {};

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

  const cleanName = name.trim().substring(0, 100);
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  const cleanSubject = (subject || 'Portfolio Contact Form').trim().substring(0, 200);
  const cleanMessage = message.trim().substring(0, 5000);

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
    });

    // Email to site owner with all submission details
    const ownerMailOptions = {
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      replyTo: cleanEmail,
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

    // Send email only to site owner
    await transporter.sendMail(ownerMailOptions);

    console.log(`Contact form submission processed: ${cleanEmail}`);

    return res.status(200).json({
      ok: true,
      message: 'Message sent successfully!',
    });
  } catch (error) {
    console.error('Contact form error:', error?.message || error);
    return res.status(500).json({
      error: 'Failed to send message. Please try again later.',
    });
  }
};

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
