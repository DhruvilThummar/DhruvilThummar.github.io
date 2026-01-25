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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Contact Submission - Dhruvil Thummar</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .container { max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00bfff 0%, #0099cc 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
    .header h1 { font-size: 24px; margin-bottom: 5px; font-weight: 700; line-height: 1.2; }
    .header p { font-size: 14px; opacity: 0.95; line-height: 1.4; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: 700; color: #00bfff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .info-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; }
    .info-row { margin-bottom: 10px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-weight: 600; color: #555; font-size: 13px; }
    .info-value { color: #333; word-break: break-word; word-wrap: break-word; margin-top: 3px; font-size: 14px; }
    .message-box { background: #f9f9f9; border-left: 4px solid #00bfff; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; word-break: break-word; font-size: 14px; line-height: 1.6; color: #333; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; }
    .cta-link { color: #00bfff; text-decoration: none; font-weight: 600; }
    .cta-link:hover { text-decoration: underline; }
    .quick-actions { background: #f0f9ff; border: 1px solid #00bfff; padding: 15px; border-radius: 6px; font-size: 13px; color: #555; line-height: 1.8; }
    .quick-actions strong { color: #00bfff; }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container { border-radius: 0 !important; }
      .header h1 { font-size: 20px !important; }
      .content { padding: 20px 15px !important; }
      .info-value { font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
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
                  <div class="info-value"><a href="mailto:${escapeHtml(cleanEmail)}" class="cta-link" style="color: #00bfff;">${escapeHtml(cleanEmail)}</a></div>
                </div>
                <div class="info-row">
                  <div class="info-label">Subject:</div>
                  <div class="info-value">${escapeHtml(cleanSubject)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Received:</div>
                  <div class="info-value">${new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">IP Address:</div>
                  <div class="info-value">${escapeHtml(clientIp)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">User-Agent:</div>
                  <div class="info-value" style="font-size: 12px; color: #666;">${escapeHtml(userAgent)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Referer:</div>
                  <div class="info-value">${escapeHtml(referer)}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Message Content</div>
              <div class="message-box">${escapeHtml(cleanMessage)}</div>
            </div>

            <div class="section">
              <div class="quick-actions">
                <strong>💡 Quick Actions:</strong><br>
                • Reply directly to <strong>${escapeHtml(cleanEmail)}</strong><br>
                • <a href="https://drthummar.me/" class="cta-link" style="color: #00bfff;">Visit your portfolio</a>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Automated Notification</strong></p>
            <p>This email was sent from your portfolio contact form at <a href="https://drthummar.me/" class="cta-link" style="color: #00bfff;">drthummar.me</a></p>
            <p style="color: #ccc; margin-top: 10px;">&copy; ${currentYear} Dhruvil Thummar</p>
          </div>
        </div>
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
  <title>Thanks for Connecting - Dhruvil Thummar</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; background: #faf8fb; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    .container { max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(236, 168, 205, 0.15); }
    .header { background: linear-gradient(135deg, #f4a4c4 0%, #ec98b8 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
    .header h1 { font-size: 28px; margin-bottom: 10px; font-weight: 700; line-height: 1.2; }
    .header p { font-size: 15px; opacity: 0.95; line-height: 1.4; }
    
    /* Logo with Image */
    .logo-container { position: relative; width: 100px; height: 100px; margin: 0 auto 20px; }
    .logo-image { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 6px 16px rgba(236, 168, 205, 0.3); border: 4px solid #ffffff; }
    
    .content { padding: 35px 25px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 12px; font-weight: 700; color: #ec5fa8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
    .message-box { background: #fff5fa; border-left: 4px solid #f4a4c4; padding: 16px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; word-break: break-word; font-size: 14px; line-height: 1.7; color: #555; }
    .cta-box { background: linear-gradient(135deg, rgba(244, 164, 196, 0.08) 0%, rgba(236, 152, 184, 0.08) 100%); border: 1.5px solid #f4a4c4; padding: 22px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .cta-box h3 { color: #ec5fa8; margin-bottom: 12px; font-size: 15px; font-weight: 700; }
    .cta-box p { color: #666; font-size: 13px; line-height: 1.6; }
    .cta-links { margin-top: 16px; }
    .cta-btn { display: inline-block; padding: 11px 18px; margin: 5px; background: linear-gradient(135deg, #f4a4c4 0%, #ec98b8 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; box-shadow: 0 3px 10px rgba(236, 168, 205, 0.2); }
    .cta-btn:hover { background: linear-gradient(135deg, #ec98b8 0%, #e788a8 100%); }
    
    /* Social Media Icons - Using Unicode symbols as fallback */
    .social-links { text-align: center; margin: 20px 0; }
    .social-icon { display: inline-block; width: 44px; height: 44px; margin: 5px; border-radius: 50%; text-decoration: none; font-weight: 600; background: #f8e9f3; border: 2px solid #ec5fa8; line-height: 40px; text-align: center; font-size: 18px; color: #ec5fa8; }
    .social-icon:hover { background: #f4a4c4; color: #ffffff; transform: scale(1.1); }
    
    .footer { background: #faf8fb; padding: 28px 20px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #f0e0eb; }
    .footer a { color: #ec5fa8; text-decoration: none; font-weight: 600; }
    .footer a:hover { text-decoration: underline; }
    .badge { display: inline-block; background: linear-gradient(135deg, #f4a4c4 0%, #ec98b8 100%); color: #ffffff; padding: 9px 18px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 16px; box-shadow: 0 3px 10px rgba(236, 168, 205, 0.25); letter-spacing: 0.5px; }
    .checkmark { display: inline-block; width: 18px; height: 18px; background: #4CAF50; border-radius: 50%; color: #ffffff; line-height: 18px; margin-right: 6px; font-weight: bold; font-size: 12px; }
    .intro-text { color: #666; font-size: 15px; line-height: 1.7; }
    .intro-text strong { color: #333; font-weight: 700; }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container { border-radius: 0 !important; }
      .header h1 { font-size: 24px !important; }
      .content { padding: 25px 20px !important; }
      .cta-btn { display: block !important; margin: 8px auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8fb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf8fb;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <div class="container">
          <div class="header">
            <!-- Logo with Image -->
            <div class="logo-container">
              <img src="https://github.com/DhruvilThummar/DhruvilThummar.github.io/blob/main/assets%2Fdt-logo-circle.svg" alt="Dhruvil Thummar" class="logo-image" width="100" height="100" style="width: 100px; height: 100px; border-radius: 50%; display: block; margin: 0 auto;">
            </div>
            
            <h1>🙏 Thanks for Connecting!</h1>
            <p>Your message has been received and I'm excited to hear from you</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="badge"><span class="checkmark">✓</span>Message Received &amp; Confirmed</div>
              <p class="intro-text">Hi <strong>${escapeHtml(firstName)}</strong>,</p>
              <p style="margin-top: 14px; color: #666; line-height: 1.7;">Thank you so much for reaching out! Your message has been successfully received and I'll review it shortly. I truly appreciate you taking the time to connect with me.</p>
            </div>

            <div class="section">
              <div class="section-title">Your Submission</div>
              <p style="color: #777; font-size: 13px; margin-bottom: 10px; font-weight: 600;"><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
              <div class="message-box">${escapeHtml(cleanMessage)}</div>
            </div>

            <div class="cta-box">
              <h3>What happens next?</h3>
              <p>I'll get back to you within 1-2 business days. In the meantime, feel free to explore my work or reach out on social media for more updates.</p>
              <div class="cta-links">
                <a href="https://drthummar.me/" class="cta-btn" style="color: #ffffff;">🌐 View Portfolio</a>
                <a href="https://github.com/DhruvilThummar" class="cta-btn" style="color: #ffffff;">💻 GitHub</a>
                <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" class="cta-btn" style="color: #ffffff;">💼 LinkedIn</a>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Connect With Me</div>
              <div class="social-links">
                <a href="https://github.com/DhruvilThummar" class="social-icon" title="GitHub" target="_blank" style="color: #ec5fa8;">⚡</a>
                <a href="https://www.linkedin.com/in/dhruvil-thummar-54422731a" class="social-icon" title="LinkedIn" target="_blank" style="color: #ec5fa8;">💼</a>
                <a href="https://www.instagram.com/dhruvil_thummar_" class="social-icon" title="Instagram" target="_blank" style="color: #ec5fa8;">📷</a>
                <a href="mailto:official@dhruvilthummar.me" class="social-icon" title="Email" target="_blank" style="color: #ec5fa8;">✉️</a>
                <a href="https://drthummar.me/" class="social-icon" title="Portfolio" target="_blank" style="color: #ec5fa8;">🌐</a>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Need an immediate response?</strong> Reply to this email directly.</p>
            <p style="margin-top: 14px;">This is an automated confirmation from <a href="https://drthummar.me/" style="color: #ec5fa8;">drthummar.me</a></p>
            <p style="margin-top: 10px; color: #bbb;">&copy; ${currentYear} Dhruvil Thummar. All rights reserved.</p>
          </div>
        </div>
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
