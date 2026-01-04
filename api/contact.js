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
              <p style="margin-top: 10px; color: #ccc;">Never share your response emails publicly | Keep contact info private</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `New Contact Submission\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject}\nReceived: ${new Date().toISOString()}\n\nMessage:\n${cleanMessage}\n\n---\nReply to: ${cleanEmail}`,
    };

    // Confirmation email to the person who submitted the form
    const senderMailOptions = {
      from: FROM_EMAIL,
      to: cleanEmail,
      subject: `Thanks for connecting! — ${cleanSubject}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thanks for Connecting</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); padding: 40px 20px; text-align: center; color: white; }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .header p { font-size: 15px; opacity: 0.95; }
            .content { padding: 30px 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 13px; font-weight: bold; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .message-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.6; }
            .cta-box { background: linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(0, 153, 204, 0.1) 100%); border: 1px solid #00bfff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cta-box h3 { color: #00bfff; margin-bottom: 12px; font-size: 15px; }
            .cta-links { display: flex; gap: 10px; flex-wrap: wrap; }
            .cta-links a { display: inline-block; padding: 10px 16px; background: #00bfff; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 13px; transition: background 0.3s; }
            .cta-links a:hover { background: #0099cc; }
            .info-box { background: #f9f9f9; padding: 12px 15px; border-radius: 4px; font-size: 13px; color: #666; margin-bottom: 10px; }
            .info-box strong { color: #333; }
            .footer { background: #f5f5f5; padding: 25px 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
            .footer a { color: #00bfff; text-decoration: none; }
            .footer a:hover { text-decoration: underline; }
            .social-links { display: flex; justify-content: center; gap: 15px; margin-top: 15px; }
            .social-links a { color: #00bfff; text-decoration: none; font-weight: 500; }
            .status-badge { display: inline-block; background: #00bfff; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🙏 Thanks for Connecting!</h1>
              <p>Your message has been received</p>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="status-badge">✓ Received & Confirmed</div>
                <p style="font-size: 15px; color: #555;">Hi <strong>${escapeHtml(cleanName.split(' ')[0])}</strong>,</p>
                <p style="margin-top: 10px; color: #666;">Thank you for reaching out! Your message has been successfully received and I'll review it shortly. I appreciate you taking the time to connect.</p>
              </div>

              <div class="section">
                <div class="section-title">Your Submission Summary</div>
                <div class="info-box">
                  <div style="margin-bottom: 8px;"><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</div>
                  <div><strong>Received:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} IST</div>
                </div>
                <div class="message-box" style="margin-top: 12px;">${escapeHtml(cleanMessage)}</div>
              </div>

              <div class="cta-box">
                <h3>What happens next?</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">I'll get back to you within 1-2 business days. In the meantime, feel free to explore my work or reach out on social media.</p>
                <div class="cta-links">
                  <a href="https://drthummar.me/">View Portfolio</a>
                  <a href="https://github.com/DhruvilThummar">GitHub</a>
                  <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a">LinkedIn</a>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Quick Links</div>
                <div class="social-links">
                  <a href="https://github.com/DhruvilThummar" target="_blank">GitHub</a>
                  <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" target="_blank">LinkedIn</a>
                  <a href="https://www.instagram.com/dhruvil_thummar_" target="_blank">Instagram</a>
                </div>
              </div>
            </div>

            <div class="footer">
              <p><strong>Need an immediate response?</strong> Reply to this email directly.</p>
              <p style="margin-top: 12px;">This is an automated confirmation from <a href="https://drthummar.me/">drthummar.me</a></p>
              <p style="margin-top: 8px; color: #ccc;">Please do not reply with sensitive information</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${cleanName},\n\nThanks for reaching out! Your message has been received successfully.\n\nSubject: ${cleanSubject}\n\nMessage:\n${cleanMessage}\n\n---\n\nI'll get back to you within 1-2 business days.\n\nBest regards,\nDhruvil Thummar\nhttps://drthummar.me\n\nGitHub: https://github.com/DhruvilThummar\nLinkedIn: https://www.linkedin.com/in/dhruvil-thummar-54422731a`,
    };

    // Send both emails
    await transporter.sendMail(ownerMailOptions);
    await transporter.sendMail(senderMailOptions);

    console.log(`Contact form submission processed: ${cleanEmail}`);

    return res.status(200).json({
      ok: true,
      message: 'Emails sent successfully! Check your inbox for confirmation.',
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
