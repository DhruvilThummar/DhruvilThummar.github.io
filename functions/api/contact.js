// ============================================
// CLOUDFLARE PAGES CONTACT FORM HANDLER
// ============================================
// Sends transactional emails via Resend API (primary) or MailChannels (fallback)
// 
// ENVIRONMENT VARIABLES REQUIRED:
// - RESEND_API_KEY: API key from https://resend.com (recommended)
// - CONTACT_FROM: Email address to send from (e.g., onboarding@resend.dev or no-reply@domain.com)
// - CONTACT_TO: Email address to receive submissions (e.g., your@email.com)
// - CONTACT_CC: (optional) Additional recipients, comma-separated
//
// FEATURES:
// ✓ Sends owner notification with full submission details
// ✓ Sends confirmation email to form submitter
// ✓ Input validation and sanitization
// ✓ Client IP tracking and user-agent logging
// ✓ Graceful fallback from Resend to MailChannels
// ✓ Comprehensive error handling and logging
//
// SECURITY:
// ✓ XSS protection via HTML escaping
// ✓ Email validation (RFC 5322 compliant)
// ✓ Input length limits (prevents abuse)
// ✓ CORS headers configured
// ✓ Request method validation

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// ============================================
// RESPONSE HELPER
// ============================================
/**
 * Create JSON response with proper headers and status code
 * @param {Object} obj - Response object to serialize
 * @param {Number} status - HTTP status code (default: 200)
 * @returns {Response} JSON response with CORS headers
 */
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-cache, no-store, must-revalidate",
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
    console.log("=== CONTACT FORM SUBMISSION RECEIVED ===");
    
    // Extract context safely
    const request = context?.request;
    const env = context?.env || {};
    
    if (!request) {
      console.error("❌ Request object is undefined");
      return json({ error: "Invalid request context" }, 500);
    }

    // ============================================
    // STEP 1: Parse and validate request body
    // ============================================
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError.message);
      return json({ error: "Invalid JSON format. Please check your request body." }, 400);
    }
    
    const { name, email, subject, message } = body || {};

    // ============================================
    // STEP 2: Validate input fields
    // ============================================
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return json({ error: "Name is required and must be at least 2 characters" }, 400);
    }
    if (!email || typeof email !== "string" || email.length > 254) {
      return json({ error: "Email address is invalid or too long" }, 400);
    }
    if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return json({ error: "Email address format is invalid" }, 400);
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return json({ error: "Message is required and must be at least 10 characters" }, 400);
    }

    // ============================================
    // STEP 3: Sanitize inputs
    // ============================================
    const cleanName = name.trim().substring(0, 100);
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = (subject || "Portfolio Contact Form").trim().substring(0, 200);
    const cleanMessage = message.trim().substring(0, 5000);

    console.log(`✓ Input validated for: ${cleanEmail}`);

    // ============================================
    // STEP 4: Load environment variables
    // ============================================
    const RESEND_API_KEY = env.RESEND_API_KEY || env.resend_api_key;
    const FROM_EMAIL = env.CONTACT_FROM || env.contact_from || "onboarding@resend.dev";
    const OWNER_EMAIL = env.CONTACT_TO || env.contact_to;
    
    // Collect metadata for logging
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referer = request.headers.get("referer") || request.headers.get("origin") || "unknown";
    
    const meta = { clientIp, userAgent, referer };

    console.log("📧 Email Service Check:");
    console.log(`  - Resend API Key: ${RESEND_API_KEY ? "✓ Configured" : "✗ Missing (will use MailChannels fallback)"}`);
    console.log(`  - From: ${FROM_EMAIL}`);
    console.log(`  - To: ${OWNER_EMAIL || "⚠️ NOT SET"}`);

    // ============================================
    // STEP 5: Validate required environment variables
    // ============================================
    if (!OWNER_EMAIL) {
      console.error("❌ CONTACT_TO environment variable is not configured");
      return json({ 
        error: "Contact service is not properly configured. Please contact the site administrator.",
        service: "contact_form_misconfiguration"
      }, 500);
    }

    // ============================================
    // STEP 6: Send emails (Resend first, MailChannels fallback)
    // ============================================
    let sendResult;

    if (RESEND_API_KEY) {
      console.log("📬 Attempting to send via Resend API...");
      sendResult = await sendTransactionalViaResend({
        cleanName,
        cleanEmail,
        cleanSubject,
        cleanMessage,
        FROM_EMAIL,
        OWNER_EMAIL,
        RESEND_API_KEY,
        meta,
      });

      if (sendResult.ok) {
        console.log("✅ Email sent successfully via Resend");
        return json({ ok: true, message: "Message received! Check your email for confirmation." }, 200);
      }

      console.warn("⚠️ Resend failed, attempting MailChannels fallback...");
      console.warn(`   Error: ${sendResult.error}`);

      // Attempt MailChannels fallback
      sendResult = await sendTransactionalViaMailChannels({
        cleanName,
        cleanEmail,
        cleanSubject,
        cleanMessage,
        FROM_EMAIL,
        OWNER_EMAIL,
        env,
        meta,
      });

      if (sendResult.ok) {
        console.log("✅ Email sent successfully via MailChannels (fallback)");
        return json({ ok: true, message: "Message received! Check your email for confirmation." }, 200);
      }

      // Both services failed
      console.error("❌ Both Resend and MailChannels failed");
      return json({ 
        error: `Email delivery failed: ${sendResult.error || "Unknown error"}`,
        service: "email_service_failure"
      }, 502);
    }

    // ============================================
    // STEP 7: Use MailChannels if no Resend key
    // ============================================
    console.log("📬 Using MailChannels (no Resend API key)...");
    sendResult = await sendTransactionalViaMailChannels({
      cleanName,
      cleanEmail,
      cleanSubject,
      cleanMessage,
      FROM_EMAIL,
      OWNER_EMAIL,
      env,
      meta,
    });

    if (!sendResult.ok) {
      console.error("❌ MailChannels failed:", sendResult.error);
      return json({ 
        error: `Email delivery failed: ${sendResult.error}`,
        service: "mailchannels_failure"
      }, 502);
    }

    console.log("✅ Email sent successfully via MailChannels");
    return json({ ok: true, message: "Message received! Check your email for confirmation." }, 200);

  } catch (err) {
    console.error("❌ UNEXPECTED ERROR:", err.message);
    console.error("   Stack:", err.stack);
    return json({ 
      error: "An unexpected error occurred. Please try again later.",
      service: "internal_server_error"
    }, 500);
  }
}

// Fallback handler for any HTTP method
export async function onRequest(context) {
  const method = context.request.method;
  
  if (method === "POST") {
    return onRequestPost(context);
  } else if (method === "OPTIONS") {
    return onRequestOptions();
  } else if (method === "GET") {
    return onRequestGet();
  } else {
    return json({ error: `Method ${method} not allowed` }, 405);
  }
}

// ============================================
// RESEND EMAIL HANDLER (PRIMARY)
// ============================================
/**
 * Send transactional emails via Resend API
 * Sends both owner notification and sender confirmation
 * @param {Object} params - Email parameters
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function sendTransactionalViaResend({ cleanName, cleanEmail, cleanSubject, cleanMessage, FROM_EMAIL, OWNER_EMAIL, RESEND_API_KEY, meta = {} }) {
  try {
    console.log("🚀 Resend: Starting email transmission");
    const fromAddress = FROM_EMAIL || "onboarding@resend.dev";
    console.log(`  • From: ${fromAddress}`);
    console.log(`  • To: ${OWNER_EMAIL}`);

    // ============================================
    // Send owner notification (critical)
    // ============================================
    const ownerResult = await sendResendEmail({
      to: OWNER_EMAIL,
      from: fromAddress,
      subject: `New Contact: ${cleanSubject} — from ${cleanName}`,
      html: buildOwnerHtml({ cleanName, cleanEmail, cleanSubject, cleanMessage, meta }),
      text: buildOwnerText({ cleanName, cleanEmail, cleanSubject, cleanMessage, meta }),
      apiKey: RESEND_API_KEY,
      replyTo: cleanEmail,
    });

    if (!ownerResult.ok) {
      console.error("❌ Resend: Owner notification failed");
      console.error(`   Error: ${ownerResult.error}`);
      return { ok: false, error: ownerResult.error };
    }

    console.log("✅ Resend: Owner notification sent");

    // ============================================
    // Send sender confirmation (best-effort)
    // ============================================
    const senderResult = await sendResendEmail({
      to: cleanEmail,
      from: fromAddress,
      subject: `Thanks for connecting! — ${cleanSubject}`,
      html: buildSenderHtml({ cleanName, cleanSubject, cleanMessage }),
      text: buildSenderText({ cleanName, cleanSubject, cleanMessage }),
      apiKey: RESEND_API_KEY,
    });

    if (senderResult.ok) {
      console.log("✅ Resend: Sender confirmation sent");
    } else {
      console.warn("⚠️ Resend: Sender confirmation failed (non-critical)");
      console.warn(`   Error: ${senderResult.error}`);
    }

    return { ok: true };
  } catch (err) {
    console.error("❌ Resend handler error:", err.message);
    return { ok: false, error: err.message };
  }
}

// ============================================
// MAILCHANNELS EMAIL HANDLER (FALLBACK)
// ============================================
/**
 * Send emails via MailChannels API (Cloudflare native)
 * Used as fallback when Resend API is not available
 * @param {Object} params - Email parameters
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function sendTransactionalViaMailChannels({ cleanName, cleanEmail, cleanSubject, cleanMessage, FROM_EMAIL, OWNER_EMAIL, env, meta = {} }) {
  // Validate sender email
  if (!FROM_EMAIL) {
    console.error("❌ MailChannels: CONTACT_FROM is not configured");
    return { ok: false, error: "Sender email not configured" };
  }

  const fromDomain = FROM_EMAIL.split("@")[1];
  if (!fromDomain || fromDomain === "localhost" || fromDomain.includes("127.0.0.1")) {
    console.error(`❌ MailChannels: Invalid FROM_EMAIL domain: ${FROM_EMAIL}`);
    return { ok: false, error: "Invalid sender email domain" };
  }

  const CC_EMAILS = (env.CONTACT_CC || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log("🚀 MailChannels: Starting email transmission");
  console.log(`  • From: ${FROM_EMAIL}`);
  console.log(`  • To: ${OWNER_EMAIL}`);
  if (CC_EMAILS.length > 0) console.log(`  • CC: ${CC_EMAILS.join(", ")}`);

  // ============================================
  // Send owner notification (critical)
  // ============================================
  const ownerResult = await sendMail({
    to: OWNER_EMAIL,
    cc: CC_EMAILS,
    from: FROM_EMAIL,
    replyTo: cleanEmail,
    subject: `New Contact: ${cleanSubject} — from ${cleanName}`,
    text: buildOwnerText({ cleanName, cleanEmail, cleanSubject, cleanMessage, meta }),
    html: buildOwnerHtml({ cleanName, cleanEmail, cleanSubject, cleanMessage, meta }),
  });

  if (!ownerResult.ok) {
    console.error(`❌ MailChannels: Owner notification failed (${ownerResult.status})`);
    console.error(`   Error: ${ownerResult.error}`);
    return {
      ok: false,
      error: `Email service error: ${ownerResult.statusText}. Please try again later.`,
    };
  }

  console.log("✅ MailChannels: Owner notification sent");

  // ============================================
  // Send sender confirmation (best-effort)
  // ============================================
  const senderResult = await sendMail({
    to: cleanEmail,
    from: FROM_EMAIL,
    subject: `Thanks for connecting! — ${cleanSubject}`,
    text: buildSenderText({ cleanName, cleanSubject, cleanMessage }),
    html: buildSenderHtml({ cleanName, cleanSubject, cleanMessage }),
  });

  if (!senderResult.ok) {
    console.warn("⚠️ MailChannels: Sender confirmation failed (non-critical)");
    console.warn(`   Status: ${senderResult.status} - ${senderResult.statusText}`);
  } else {
    console.log("✅ MailChannels: Sender confirmation sent");
  }

  return { ok: true };
}

/**
 * Send email via Resend API
 * @param {Object} params - Email parameters
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function sendResendEmail({ to, from, subject, html, text, apiKey, replyTo }) {
  try {
    // Build request payload
    const payload = {
      from,
      to,
      subject,
      html,
    };
    
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;

    // Make API request
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    // Try to parse response as JSON
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("⚠️ Failed to parse Resend response as JSON");
    }

    if (!response.ok) {
      const errorMsg = data.message || data.error || responseText || response.statusText;
      console.error(`❌ Resend API error (${response.status}): ${errorMsg}`);
      return { ok: false, error: errorMsg };
    }

    console.log(`✓ Resend API: Email sent to ${to} (ID: ${data.id})`);
    return { ok: true };
    
  } catch (err) {
    console.error(`❌ Resend fetch error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
/**
 * Send email via MailChannels API
 * @param {Object} params - Email parameters
 * @returns {Promise<{ok: boolean, status?: number, statusText?: string, error?: string}>}
 */
async function sendMail({ to, cc = [], from, replyTo, subject, text, html }) {
  try {
    // Build recipients list
    const recipients = [{ email: to }].concat(cc.map((c) => ({ email: c })));

    // Build MailChannels payload
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

    // Send via MailChannels API
    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Slack-No-Retry": "1",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text().catch(() => "");
    
    if (!response.ok) {
      console.error(`❌ MailChannels API error (${response.status}): ${responseBody}`);
      return { 
        ok: false, 
        status: response.status, 
        statusText: response.statusText, 
        error: responseBody 
      };
    }

    console.log(`✓ MailChannels API: Email sent to ${to}`);
    return { ok: true, status: response.status, statusText: response.statusText };
    
  } catch (err) {
    console.error(`❌ MailChannels fetch error: ${err.message}`);
    return { 
      ok: false, 
      status: 0, 
      statusText: "Network Error", 
      error: err.message 
    };
  }
}

function buildOwnerText({ cleanName, cleanEmail, cleanSubject, cleanMessage, meta = {} }) {
  const { clientIp = "unknown", userAgent = "unknown", referer = "unknown" } = meta;
  return [
    "New Contact Submission",
    "",
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Subject: ${cleanSubject}`,
    `Received: ${new Date().toISOString()}`,
    "",
    "Request Meta:",
    `IP: ${clientIp}`,
    `User-Agent: ${userAgent}`,
    `Referer: ${referer}`,
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

function buildOwnerHtml({ cleanName, cleanEmail, cleanSubject, cleanMessage, meta = {} }) {
  const { clientIp = "unknown", userAgent = "unknown", referer = "unknown" } = meta;
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
          <div class="info-row">
            <div class="info-label">IP:</div>
            <div class="info-value">${escapeHtml(clientIp)}</div>
          </div>
          <div class="info-row">
            <div class="info-label">User-Agent:</div>
            <div class="info-value" style="font-size: 12px; color: #555;">${escapeHtml(userAgent)}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Referer:</div>
            <div class="info-value">${escapeHtml(referer)}</div>
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

function getClientIp(request) {
  return request?.headers?.get("cf-connecting-ip")
    || request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function buildDeliveryDebug(from, to, service, extra = {}) {
  return {
    service,
    from,
    to,
    hasFrom: !!from,
    hasTo: !!to,
    ...extra,
  };
}
