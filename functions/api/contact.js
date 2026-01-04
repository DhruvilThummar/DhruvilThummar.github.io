// Cloudflare Pages Function: Contact form handler using MailChannels
// Expects environment variables configured in the Pages project:
// - CONTACT_FROM (the from/sender address, e.g., no-reply@yourdomain.com)
// - CONTACT_TO   (where owner notifications are sent)
// - CONTACT_CC   (optional, comma-separated list)
// 
// MailChannels requires:
// 1. Your domain to be verified in Cloudflare (add SPF/DKIM/DMARC records)
// 2. Proper from email matching your domain

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

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

    // Check environment variables
    const FROM_EMAIL = env.CONTACT_FROM;
    const OWNER_EMAIL = env.CONTACT_TO;
    
    console.log("Checking env vars - FROM_EMAIL:", FROM_EMAIL ? "set" : "missing", "OWNER_EMAIL:", OWNER_EMAIL ? "set" : "missing");
    
    if (!FROM_EMAIL || !OWNER_EMAIL) {
      console.error("Missing required environment variables");
      return json({ error: "Contact service configuration error. Please contact the site administrator." }, 500);
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
        error: `Failed to send notification: ${ownerResult.statusText}. Please verify your email domain is configured with MailChannels.`,
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
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const errorText = res.ok ? "" : await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, statusText: res.statusText, error: errorText };
  } catch (err) {
    console.error("MailChannels fetch error:", err);
    return { ok: false, status: 0, statusText: "Network error", error: err.message };
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
  return `<!doctype html>
<html><body style="font-family: Arial, sans-serif; color: #111;">
  <h2>New Contact Submission</h2>
  <p><strong>Name:</strong> ${escapeHtml(cleanName)}<br/>
  <strong>Email:</strong> <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a><br/>
  <strong>Subject:</strong> ${escapeHtml(cleanSubject)}<br/>
  <strong>Received:</strong> ${new Date().toISOString()}</p>
  <h3>Message</h3>
  <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(cleanMessage)}</pre>
</body></html>`;
}

function buildSenderHtml({ cleanName, cleanSubject, cleanMessage }) {
  return `<!doctype html>
<html><body style="font-family: Arial, sans-serif; color: #111;">
  <h2>Thanks for connecting!</h2>
  <p>Hi ${escapeHtml(firstWord(cleanName))},</p>
  <p>Your message has been received. I'll reply soon.</p>
  <p><strong>Subject:</strong> ${escapeHtml(cleanSubject)}</p>
  <h3>Your message</h3>
  <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(cleanMessage)}</pre>
  <p>Best,<br/>Dhruvil Thummar<br/><a href="https://drthummar.me">drthummar.me</a></p>
</body></html>`;
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
