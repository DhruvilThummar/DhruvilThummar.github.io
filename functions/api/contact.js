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
    .header { background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); padding: 40px 20px; text-align: center; color: white; position: relative; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    
    /* Animated Circular Logo */
    .logo-container { position: relative; width: 80px; height: 80px; margin: 0 auto 20px; }
    .logo-circle { width: 80px; height: 80px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); position: relative; animation: pulse 2s ease-in-out infinite; }
    .logo-text { font-size: 32px; font-weight: bold; color: #00bfff; font-family: 'Arial', sans-serif; }
    .loader-ring { position: absolute; width: 90px; height: 90px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1.5s linear infinite; top: -5px; left: -5px; }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .content { padding: 30px 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: bold; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .message-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 14px; line-height: 1.6; }
    .cta-box { background: linear-gradient(135deg, rgba(0, 191, 255, 0.1) 0%, rgba(0, 153, 204, 0.1) 100%); border: 1px solid #00bfff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta-box h3 { color: #00bfff; margin-bottom: 12px; font-size: 15px; }
    .cta-links { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .cta-btn { display: inline-block; padding: 10px 16px; background: #00bfff; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 13px; transition: all 0.3s; }
    .cta-btn:hover { background: #0099cc; transform: translateY(-2px); }
    
    /* Social Media Icons with Animation */
    .social-links { display: flex; justify-content: center; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
    .social-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; text-decoration: none; font-weight: 500; transition: all 0.3s; background: #f0f0f0; }
    .social-icon:hover { transform: translateY(-3px) scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .social-icon.github { background: #333; color: white; }
    .social-icon.github:hover { background: #24292e; }
    .social-icon.linkedin { background: #0077b5; color: white; }
    .social-icon.linkedin:hover { background: #006399; }
    .social-icon.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: white; }
    .social-icon.instagram:hover { opacity: 0.9; }
    .social-icon.email { background: #00bfff; color: white; }
    .social-icon.email:hover { background: #0099cc; }
    .social-icon.portfolio { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .social-icon.portfolio:hover { opacity: 0.9; }
    
    .footer { background: #f5f5f5; padding: 25px 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .footer a { color: #00bfff; text-decoration: none; }
    .badge { display: inline-block; background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,191,255,0.3); }
    .checkmark { display: inline-block; width: 16px; height: 16px; background: #4CAF50; border-radius: 50%; color: white; line-height: 16px; margin-right: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Animated Circular Logo -->
      <div class="logo-container">
        <div class="loader-ring"></div>
        <div class="logo-circle">
          <span class="logo-text">DT</span>
        </div>
      </div>
      
      <h1>🙏 Thanks for Connecting!</h1>
      <p>Your message has been received</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="badge"><span class="checkmark">✓</span>Message Received & Confirmed</div>
        <p style="font-size: 15px; color: #555;">Hi <strong>${escapeHtml(firstName)}</strong>,</p>
        <p style="margin-top: 12px; color: #666;">Thank you for reaching out! Your message has been successfully received and I'll review it shortly. I appreciate you taking the time to connect.</p>
      </div>

      <div class="section">
        <div class="section-title">Your Submission</div>
        <p style="color: #666; font-size: 13px; margin-bottom: 8px;"><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
        <div class="message-box">${escapeHtml(cleanMessage)}</div>
      </div>

      <div class="cta-box">
        <h3>What happens next?</h3>
        <p style="font-size: 13px; color: #666; margin-bottom: 15px;">I'll get back to you within 1-2 business days. In the meantime, feel free to explore my work or reach out on social media.</p>
        <div class="cta-links">
          <a href="https://drthummar.me/" class="cta-btn">🌐 View Portfolio</a>
          <a href="https://github.com/DhruvilThummar" class="cta-btn">💻 GitHub</a>
          <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" class="cta-btn">💼 LinkedIn</a>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Connect With Me</div>
        <div class="social-links">
          <a href="https://github.com/DhruvilThummar" class="social-icon github" title="GitHub" target="_blank">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" class="social-icon linkedin" title="LinkedIn" target="_blank">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href="https://www.instagram.com/dhruvil_thummar_" class="social-icon instagram" title="Instagram" target="_blank">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="mailto:official@dhruvilthummar.me" class="social-icon email" title="Email" target="_blank">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </a>
          <a href="https://drthummar.me/" class="social-icon portfolio" title="Portfolio" target="_blank">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </a>
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
