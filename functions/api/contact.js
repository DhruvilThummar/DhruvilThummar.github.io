// Cloudflare Pages Function: Contact form handler using MailChannels
// Expects environment variables configured in the Pages project:
// - CONTACT_FROM (the from/sender address, e.g., no-reply@yourdomain.com)
// - CONTACT_TO   (where owner notifications are sent)
// - CONTACT_CC   (optional, comma-separated list)
// 
// MailChannels setup required:
// 1. Add SPF record to your domain DNS: v=spf1 a mx include:relay.mailchannels.net ~all
// 2. Your domain must be verified in Cloudflare
// 3. Ensure CONTACT_FROM email uses your verified domain
// For testing: Use a MailChannels test endpoint or Resend/SendGrid as alternative

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Helper function to create JSON responses
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Handle GET requests (not supported)
export async function onRequestGet() {
  return json({ error: "Method not allowed. Please use POST to submit the contact form." }, 405);
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      return json({ error: "Invalid request format" }, 400);
    }
    
    const { name, email, subject, message } = body || {};

    // Basic validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return json({ error: "Name must be at least 2 characters" }, 400);
    }
    if (!email || typeof email !== "string" || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return json({ error: "Invalid email address" }, 400);
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return json({ error: "Message must be at least 10 characters" }, 400);
    }

    const cleanName = name.trim().substring(0, 100);
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = (subject || "Portfolio Contact Form").trim().substring(0, 200);
    const cleanMessage = message.trim().substring(0, 5000);

    // Check environment variables - support both MailChannels and Resend
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const FROM_EMAIL = env.CONTACT_FROM;
    const OWNER_EMAIL = env.CONTACT_TO;
    
    console.log("Checking env vars - RESEND_API_KEY:", RESEND_API_KEY ? "set" : "missing", "FROM_EMAIL:", FROM_EMAIL ? "set" : "missing", "OWNER_EMAIL:", OWNER_EMAIL ? "set" : "missing");
    
    // If we have Resend API key, use Resend (recommended)
    if (RESEND_API_KEY) {
      return await handleResendEmail({ cleanName, cleanEmail, cleanSubject, cleanMessage, FROM_EMAIL, OWNER_EMAIL, RESEND_API_KEY, env });
    }
    
    // Fallback to MailChannels if no Resend key
    if (!FROM_EMAIL || !OWNER_EMAIL) {
      console.error("Missing required environment variables (CONTACT_FROM and CONTACT_TO)");
      return json({ error: "Contact service not configured. Please contact the site administrator." }, 500);
    }

    // Validate FROM_EMAIL domain
    const fromDomain = FROM_EMAIL.split("@")[1];
    if (!fromDomain || fromDomain === "localhost" || fromDomain.includes("127.0.0.1")) {
      console.error(`Invalid FROM_EMAIL domain: ${FROM_EMAIL}`);
      return json({ error: "Contact service domain configuration error." }, 500);
    }

    const CC_EMAILS = (env.CONTACT_CC || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`Sending email from ${FROM_EMAIL} to ${OWNER_EMAIL} for ${cleanEmail}`);

    // Send owner notification
    const ownerResult = await sendMail({
      to: OWNER_EMAIL,
      cc: CC_EMAILS,
      from: FROM_EMAIL,
      replyTo: cleanEmail,
      subject: `New Contact: ${cleanSubject} — from ${cleanName}`,
      text: buildOwnerText({ cleanName, cleanEmail, cleanSubject, cleanMessage }),
      html: buildOwnerHtml({ cleanName, cleanEmail, cleanSubject, cleanMessage }),
    });

    if (!ownerResult.ok) {
      console.error(`Owner email failed: ${ownerResult.status} ${ownerResult.statusText}`, ownerResult.error);
      return json({ 
        error: `Failed to send email: ${ownerResult.statusText}. Please contact the site administrator or try again later.`,
        details: ownerResult.error 
      }, 502);
    }

    console.log("Owner notification sent successfully");

    // Send confirmation to sender (best-effort)
    const senderResult = await sendMail({
      to: cleanEmail,
      from: FROM_EMAIL,
      subject: `Thanks for connecting! — ${cleanSubject}`,
      text: buildSenderText({ cleanName, cleanSubject, cleanMessage }),
      html: buildSenderHtml({ cleanName, cleanSubject, cleanMessage }),
    });

    if (!senderResult.ok) {
      console.warn(`Sender confirmation email failed: ${senderResult.status} ${senderResult.statusText}`);
    } else {
      console.log("Confirmation email sent to sender");
    }

    return json({ ok: true, message: "Message received! Check your email for confirmation." }, 200);
  } catch (err) {
    console.error("Contact form unexpected error:", err);
    return json({ error: `Internal error: ${err.message}` }, 500);
  }
}

// Helpers
async function sendMail({ to, cc = [], from, replyTo, subject, text, html }) {
  const recipients = [{ email: to }].concat(cc.map((c) => ({ email: c })));

  // Extract domain from email for MailChannels dkim_domain
  const fromDomain = from.split("@")[1];

  const payload = {
    personalizations: [
      {
        to: recipients,
        ...(replyTo ? { reply_to: { email: replyTo } } : {}),
      },
    ],
    from: { email: from, name: "Dhruvil Thummar" },
    subject,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html },
    ],
  };

  try {
    console.log(`Attempting to send email to ${to} from ${from}`);
    
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Slack-No-Retry": "1",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await res.text().catch(() => "");
    
    if (!res.ok) {
      console.error(`MailChannels error (${res.status} ${res.statusText}):`, responseBody);
      return { 
        ok: false, 
        status: res.status, 
        statusText: res.statusText, 
        error: responseBody 
      };
    }

    console.log(`Email sent successfully to ${to}`);
    return { ok: true, status: res.status, statusText: res.statusText, error: "" };
    
  } catch (err) {
    console.error("MailChannels fetch error:", err);
    return { 
      ok: false, 
      status: 0, 
      statusText: "Network error", 
      error: err.message 
    };
  }
}

function buildOwnerText({ cleanName, cleanEmail, cleanSubject, cleanMessage }) {
  return [
    "New Contact Submission",
    "",
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Subject: ${cleanSubject}`,
    `Received: ${new Date().toISOString()}`,
    "",
    "Message:",
    cleanMessage,
  ].join("\n");
}

function buildSenderText({ cleanName, cleanSubject, cleanMessage }) {
  return [
    `Hi ${firstWord(cleanName)},`,
    "",
    "Thanks for reaching out! Your message has been received.",
    "",
    `Subject: ${cleanSubject}`,
    "",
    "Message:",
    cleanMessage,
    "",
    "I'll get back to you within 1-2 business days.",
    "",
    "Best regards,",
    "Dhruvil Thummar",
    "https://drthummar.me",
  ].join("\n");
}

function buildOwnerHtml({ cleanName, cleanEmail, cleanSubject, cleanMessage }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); padding: 30px 20px; text-align: center; color: white; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: bold; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .info-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; }
    .info-row { margin-bottom: 10px; }
    .info-label { font-weight: 600; color: #555; }
    .info-value { color: #333; word-break: break-word; margin-top: 3px; }
    .message-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.6; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .cta-link { color: #00bfff; text-decoration: none; }
    .cta-link:hover { text-decoration: underline; }
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
            <div class="info-value"><a href="mailto:${escapeHtml(cleanEmail)}" class="cta-link">${escapeHtml(cleanEmail)}</a></div>
          </div>
          <div class="info-row">
            <div class="info-label">Subject:</div>
            <div class="info-value">${escapeHtml(cleanSubject)}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Received:</div>
            <div class="info-value">${new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Message</div>
        <div class="message-box">${escapeHtml(cleanMessage)}</div>
      </div>

      <div class="section">
        <p style="font-size: 13px; color: #666;">
          <strong>💡 Quick Actions:</strong><br>
          • Reply directly to <strong>${escapeHtml(cleanEmail)}</strong><br>
          • Visit your portfolio at <a href="https://drthummar.me/" class="cta-link">drthummar.me</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This email was sent from your portfolio contact form</p>
      <p style="margin-top: 10px; color: #ccc;">Automated message • No reply needed</p>
    </div>
  </div>
</body>
</html>`;
}

function buildSenderHtml({ cleanName, cleanSubject, cleanMessage }) {
  const firstName = firstWord(cleanName);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); padding: 40px 20px; text-align: center; color: white; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: bold; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .message-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.6; }
    .cta-box { background: linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(0, 153, 204, 0.1) 100%); border: 1px solid #00bfff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta-box h3 { color: #00bfff; margin-bottom: 12px; font-size: 15px; }
    .cta-links { display: flex; gap: 10px; flex-wrap: wrap; }
    .cta-btn { display: inline-block; padding: 10px 16px; background: #00bfff; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 13px; }
    .cta-btn:hover { background: #0099cc; }
    .social-links { text-align: center; margin: 20px 0; }
    .social-links a { display: inline-block; margin: 0 10px; color: #00bfff; text-decoration: none; font-weight: 500; }
    .social-links a:hover { text-decoration: underline; }
    .footer { background: #f5f5f5; padding: 25px 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .footer a { color: #00bfff; text-decoration: none; }
    .badge { display: inline-block; background: #00bfff; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-bottom: 15px; }
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
        <div class="badge">✓ Message Received & Confirmed</div>
        <p style="font-size: 15px; color: #555;">Hi <strong>${escapeHtml(firstName)}</strong>,</p>
        <p style="margin-top: 12px; color: #666;">Thank you for reaching out! Your message has been successfully received and I'll review it shortly. I appreciate you taking the time to connect.</p>
      </div>

      <div class="section">
        <div class="section-title">Your Submission</div>
        <p style="color: #666; font-size: 13px;"><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
        <div class="message-box">${escapeHtml(cleanMessage)}</div>
      </div>

      <div class="cta-box">
        <h3>What happens next?</h3>
        <p style="font-size: 13px; color: #666; margin-bottom: 15px;">I'll get back to you within 1-2 business days. In the meantime, feel free to explore my work or reach out on social media.</p>
        <div class="cta-links">
          <a href="https://drthummar.me/" class="cta-btn">View Portfolio</a>
          <a href="https://github.com/DhruvilThummar" class="cta-btn">GitHub</a>
          <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" class="cta-btn">LinkedIn</a>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Connect With Me</div>
        <div class="social-links">
          <a href="https://github.com/DhruvilThummar">GitHub</a>
          <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a">LinkedIn</a>
          <a href="https://www.instagram.com/dhruvil_thummar_">Instagram</a>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Need an immediate response?</strong> Reply to this email directly.</p>
      <p style="margin-top: 12px;">This is an automated confirmation from <a href="https://drthummar.me/">drthummar.me</a></p>
      <p style="margin-top: 8px; color: #ccc;">© 2026 Dhruvil Thummar. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}



function firstWord(text) {
  return (text || "").split(/\s+/)[0] || "there";
}

function escapeHtml(text) {
  return (text || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}
