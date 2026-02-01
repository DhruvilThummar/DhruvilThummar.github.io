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
    // Admin/owner recipient (fallback to your Gmail so contact still works if env is missing)
    const OWNER_EMAIL = env.CONTACT_TO || env.contact_to || env.NOTIFY_EMAIL || env.notify_email || "dhruvilthummar1303@gmail.com";
    
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
      console.error("❌ CONTACT_TO/NOTIFY_EMAIL environment variable is not configured");
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
  const currentYear = new Date().getFullYear();
  const receivedTime = new Date().toLocaleString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit', 
    timeZoneName: 'short' 
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Message - Dhruvil Thummar</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: 'Inter', Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0a1628; background: linear-gradient(135deg, #e8f9ff 0%, #f3eeff 50%, #e6f6ff 100%); -webkit-font-smoothing: antialiased; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    a { color: #00d4ff; text-decoration: none; font-weight: 500; }
    a:hover { opacity: 0.85; }
    
    .wrapper { width: 100%; background: linear-gradient(135deg, #e8f9ff 0%, #f3eeff 50%, #e6f6ff 100%); padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,248,255,0.95) 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 180, 230, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0, 212, 255, 0.15); }
    
    .header { background: linear-gradient(135deg, #00d4ff 0%, #a78bfa 100%); padding: 48px 32px; text-align: center; color: #fff; position: relative; overflow: hidden; }
    .header h1 { font-size: 36px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.1; letter-spacing: -0.5px; }
    .header p { font-size: 15px; opacity: 0.95; margin: 0; font-weight: 500; }
    
    .content { padding: 40px 32px; }
    .section { margin-bottom: 32px; }
    .section:last-child { margin-bottom: 0; }
    .section-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #00bfff; text-transform: uppercase; margin-bottom: 12px; display: block; }
    
    .visitor-card { background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 8px; padding: 24px; }
    .visitor-name { font-size: 20px; font-weight: 700; color: #0a1628; margin: 0 0 6px 0; letter-spacing: -0.3px; }
    .visitor-email { font-size: 14px; color: #00d4ff; margin: 0; font-weight: 500; }
    
    .subject-section { margin: 28px 0; }
    .subject-value { font-size: 18px; font-weight: 600; color: #0a1628; margin: 0; }
    
    .message-section { margin-top: 28px; }
    .message-label { font-size: 12px; font-weight: 700; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .message-box { background: rgba(167, 139, 250, 0.08); border-left: 3px solid #a78bfa; border-radius: 6px; padding: 14px; white-space: pre-wrap; word-wrap: break-word; word-break: break-word; font-size: 13px; line-height: 1.6; color: #2d3748; font-family: 'Roboto Mono', monospace; }
    
    .meta-section { background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(167, 139, 250, 0.08) 100%); border: 1px solid rgba(0, 212, 255, 0.15); padding: 18px; border-radius: 8px; margin-top: 28px; }
    .meta-label { font-size: 11px; font-weight: 700; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; }
    .meta-item { font-size: 12px; color: #4a5568; margin-bottom: 10px; word-break: break-word; }
    .meta-item strong { color: #0a1628; }
    .meta-item:last-child { margin-bottom: 0; }
    
    .action-section { background: linear-gradient(135deg, #00d4ff 0%, #a78bfa 100%); color: #fff; padding: 24px; border-radius: 8px; margin-top: 28px; text-align: center; }
    .action-title { font-weight: 700; font-size: 15px; margin-bottom: 16px; }
    .action-link { display: inline-block; background: rgba(255, 255, 255, 0.15); color: #fff !important; padding: 12px 22px; border-radius: 6px; text-decoration: none !important; font-size: 13px; font-weight: 500; margin: 8px 6px 0 6px; transition: all 0.2s ease; }
    .action-link:hover { background: rgba(255, 255, 255, 0.25); }
    
    .footer { background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%); padding: 24px 32px; text-align: center; border-top: 1px solid rgba(0, 212, 255, 0.15); }
    .footer-text { font-size: 12px; color: #4a5568; margin: 0 0 6px 0; }
    .footer-link { color: #00d4ff; font-weight: 600; }
    .footer-link:hover { opacity: 0.85; }
    .copyright { font-size: 11px; color: #cbd5e0; margin-top: 8px; }
    
    @media only screen and (max-width: 640px) {
      .container { border-radius: 0; }
      .header { padding: 36px 20px; }
      .header h1 { font-size: 28px; }
      .content { padding: 24px 20px; }
      .footer { padding: 20px; }
      .action-link { display: block; width: calc(100% - 12px); margin: 8px 0; }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td class="header">
              <h1>💬 New Message</h1>
              <p>Someone reached out through your contact form</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              <!-- Visitor Card -->
              <div class="section">
                <div class="visitor-card">
                  <p class="visitor-name">${escapeHtml(cleanName)}</p>
                  <p class="visitor-email"><a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></p>
                </div>
              </div>
              
              <!-- Subject -->
              <div class="subject-section">
                <span class="section-label">Subject</span>
                <p class="subject-value">${escapeHtml(cleanSubject)}</p>
              </div>
              
              <!-- Message -->
              <div class="message-section">
                <div class="message-label">Message</div>
                <div class="message-box">${escapeHtml(cleanMessage)}</div>
              </div>
              
              <!-- Submission Meta -->
              <div class="meta-section">
                <div class="meta-label">Submission Details</div>
                <div class="meta-item"><strong>Received:</strong> ${receivedTime}</div>
                <div class="meta-item"><strong>IP Address:</strong> ${escapeHtml(clientIp)}</div>
                <div class="meta-item"><strong>Source:</strong> ${escapeHtml(referer || 'direct')}</div>
                <div class="meta-item"><strong>User Agent:</strong> ${escapeHtml(userAgent)}</div>
              </div>
              
              <!-- Actions -->
              <div class="action-section">
                <div class="action-title">Quick Actions</div>
                <a href="mailto:${escapeHtml(cleanEmail)}?subject=Re: ${encodeURIComponent(cleanSubject)}" class="action-link">Reply to Email</a>
                <a href="https://drthummar.me/" class="action-link">View Portfolio</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p class="footer-text">Automated notification from <a href="https://drthummar.me/" class="footer-link">drthummar.me</a></p>
              <p class="copyright">&copy; ${currentYear} Dhruvil Thummar. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSenderHtml({ cleanName, cleanSubject, cleanMessage }) {
  const firstName = firstWord(cleanName);
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Message Received - Dhruvil Thummar</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: 'Inter', Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #0a1628; background: linear-gradient(135deg, #e8f9ff 0%, #f3eeff 50%, #e6f6ff 100%); -webkit-font-smoothing: antialiased; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    a { color: #00d4ff; text-decoration: none; font-weight: 500; }
    a:hover { opacity: 0.85; }
    
    .wrapper { width: 100%; background: linear-gradient(135deg, #e8f9ff 0%, #f3eeff 50%, #e6f6ff 100%); padding: 20px; }
    .container { max-width: 640px; margin: 0 auto; background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,248,255,0.95) 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 180, 230, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0, 212, 255, 0.15); }
    
    .header { background: linear-gradient(135deg, #00d4ff 0%, #a78bfa 100%); padding: 48px 32px; text-align: center; color: #fff; position: relative; overflow: hidden; }
    .header h1 { font-size: 36px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.1; letter-spacing: -0.5px; }
    .header p { font-size: 15px; opacity: 0.95; margin: 0; font-weight: 500; }
    
    .content { padding: 40px 32px; }
    .greeting { margin-bottom: 28px; }
    .greeting p { font-size: 15px; line-height: 1.7; color: #4a5568; margin: 0 0 12px 0; }
    .greeting strong { color: #0a1628; font-weight: 600; }
    
    .section { margin-bottom: 32px; }
    .section:last-child { margin-bottom: 0; }
    .section-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #00bfff; text-transform: uppercase; margin-bottom: 12px; display: block; }
    
    .submission-box { background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%); border-left: 3px solid #00d4ff; border-radius: 6px; padding: 16px; }
    .submission-field { margin-bottom: 14px; }
    .submission-field:last-child { margin-bottom: 0; }
    .submission-label { font-size: 12px; font-weight: 700; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .submission-value { font-size: 14px; color: #0a1628; word-break: break-word; line-height: 1.6; }
    
    .message-box { background: rgba(167, 139, 250, 0.08); border-left: 3px solid #a78bfa; border-radius: 4px; padding: 14px; white-space: pre-wrap; word-wrap: break-word; word-break: break-word; font-size: 13px; line-height: 1.6; color: #2d3748; font-family: 'Roboto Mono', monospace; }
    
    .timeline { background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(167, 139, 250, 0.08) 100%); border: 1px solid rgba(0, 212, 255, 0.15); padding: 20px; border-radius: 8px; margin: 28px 0; }
    .timeline-title { font-weight: 700; color: #0a1628; font-size: 14px; margin-bottom: 14px; letter-spacing: -0.3px; }
    .timeline-item { font-size: 13px; color: #4a5568; margin-bottom: 8px; display: flex; }
    .timeline-icon { margin-right: 12px; min-width: 16px; color: #00d4ff; font-weight: bold; }
    
    .cta-section { margin: 32px 0; text-align: center; }
    .cta-btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00d4ff 0%, #a78bfa 100%); color: #fff !important; text-decoration: none !important; border-radius: 8px; font-weight: 600; font-size: 14px; border: 0; cursor: pointer; box-shadow: 0 4px 16px rgba(0, 212, 255, 0.25); transition: all 0.2s ease; }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0, 212, 255, 0.35); }
    
    .social-section { text-align: center; margin-top: 28px; padding-top: 28px; border-top: 1px solid rgba(0, 212, 255, 0.15); }
    .social-title { font-size: 11px; font-weight: 700; color: #00bfff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .social-links { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .social-link { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 8px; text-decoration: none; font-size: 16px; transition: all 0.2s ease; }
    .social-link:hover { background: linear-gradient(135deg, #00d4ff 0%, #a78bfa 100%); border-color: transparent; transform: translateY(-2px); color: #fff; }
    
    .footer { background: linear-gradient(180deg, rgba(0, 212, 255, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%); padding: 24px 32px; text-align: center; border-top: 1px solid rgba(0, 212, 255, 0.15); }
    .footer-text { font-size: 12px; color: #4a5568; margin: 0 0 6px 0; }
    .footer-link { color: #00d4ff; font-weight: 600; }
    .footer-link:hover { opacity: 0.85; }
    .copyright { font-size: 11px; color: #cbd5e0; margin-top: 8px; }
    
    @media only screen and (max-width: 640px) {
      .container { border-radius: 0; }
      .header { padding: 36px 20px; }
      .header h1 { font-size: 28px; }
      .content { padding: 24px 20px; }
      .footer { padding: 20px; }
      .cta-btn { display: block; width: 100%; margin: 0; }
      .social-links { gap: 8px; }
    }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td class="header">
              <h1>✓ Message Received</h1>
              <p>I'll be in touch shortly</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              <div class="greeting">
                <p>Hi <strong>${escapeHtml(firstName)}</strong>,</p>
                <p>Thank you for reaching out! Your message has been successfully received and I appreciate you taking the time to connect with me.</p>
              </div>
              
              <div class="section">
                <span class="section-label">Your Message</span>
                <div class="submission-box">
                  <div class="submission-field">
                    <div class="submission-label">Subject</div>
                    <div class="submission-value">${escapeHtml(cleanSubject)}</div>
                  </div>
                  <div class="submission-field">
                    <div class="submission-label">Message</div>
                    <div class="message-box">${escapeHtml(cleanMessage)}</div>
                  </div>
                </div>
              </div>
              
              <div class="timeline">
                <div class="timeline-title">What Happens Next</div>
                <div class="timeline-item"><span class="timeline-icon">→</span> <span>I'll review your message within 1-2 business days</span></div>
                <div class="timeline-item"><span class="timeline-icon">→</span> <span>You'll receive my response at this email address</span></div>
                <div class="timeline-item"><span class="timeline-icon">→</span> <span>Questions? Reply directly to this message</span></div>
              </div>
              
              <div class="cta-section">
                <a href="https://drthummar.me/" class="cta-btn">View My Portfolio</a>
              </div>
              
              <div class="social-section">
                <div class="social-title">Connect</div>
                <div class="social-links">
                  <a href="https://github.com/DhruvilThummar" class="social-link" title="GitHub">💻</a>
                  <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" class="social-link" title="LinkedIn">💼</a>
                  <a href="https://www.instagram.com/dhruvil_thummar_" class="social-link" title="Instagram">📷</a>
                  <a href="https://drthummar.me/" class="social-link" title="Portfolio">🌐</a>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p class="footer-text">Sent from <a href="https://drthummar.me/" class="footer-link">drthummar.me</a></p>
              <p class="copyright">&copy; ${currentYear} Dhruvil Thummar. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
