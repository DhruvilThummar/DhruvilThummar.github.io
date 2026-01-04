// Simple test endpoint to verify Functions are working
export async function onRequest(context) {
  return new Response(JSON.stringify({ 
    status: "ok", 
    message: "Cloudflare Pages Functions are working!",
    timestamp: new Date().toISOString(),
    env_vars_available: {
      RESEND_API_KEY: context.env?.RESEND_API_KEY ? "set" : "missing",
      CONTACT_FROM: context.env?.CONTACT_FROM || "not set",
      CONTACT_TO: context.env?.CONTACT_TO || "not set"
    }
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
