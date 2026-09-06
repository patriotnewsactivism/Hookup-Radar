// Surge email invitation sender — Supabase Edge Function (Deno).
// Deploy: `bunx supabase functions deploy send-invite`
// Requires: RESEND_API_KEY secret, FROM_EMAIL (optional) config.
// Requests: POST with `Authorization: Bearer <user JWT>`
//           body { recipient_email: string, message?: string }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "https://esm.sh/resend@4.7.0";

const APP_URL = "https://surgeonline-wtpnews.netlify.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Surge <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }
  if (RESEND_API_KEY.length === 0) {
    return json({ error: "server not configured for email" }, 503);
  }

  // Verify the caller's JWT — auth.uid() inside RPCs is derived from this.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { recipient_email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const recipientEmail = (body.recipient_email || "").trim().toLowerCase();
  const message = (body.message || "").trim().slice(0, 500);
  if (!EMAIL_RE.test(recipientEmail)) {
    return json({ error: "invalid recipient email" }, 400);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return json({ error: "unauthorized" }, 401);
  }

  // Load the sender's profile + referral code.
  const { data: profiles } = await userClient
    .from("surge_users")
    .select("id, username, display_name, referral_code, auth_email")
    .eq("auth_id", user.id)
    .limit(1);
  const sender = profiles?.[0];
  if (!sender) {
    return json({ error: "profile not found" }, 404);
  }

  let code = sender.referral_code;
  if (!code) {
    const { data: codeData, error: codeError } = await userClient.rpc(
      "surge_ensure_referral_code"
    );
    if (codeError) return json({ error: "referral code unavailable" }, 500);
    code = String(codeData);
  }

  const refUrl = `${APP_URL}/?ref=${encodeURIComponent(code)}`;
  const senderName = sender.display_name || sender.username || "Someone";
  const shareText = message ||
    `Hey! ${senderName} invited you to SURGE — the app for finding hookups with real people nearby. Skip the games and meet tonight. ⚡`;
  const subject = `${senderName} invited you to SURGE ⚡`;
  const ctaUrl = escapeHtml(refUrl);
  const htmlBody = `
    <div style="max-width:560px;margin:0 auto;background:#050c1a;color:#e8eaf2;font-family:Arial,sans-serif;border-radius:16px;padding:32px;border:1px solid rgba(212,168,67,.3)">
      <div style="text-align:center;padding-bottom:16px">
        <span style="font-size:28px;font-weight:900;letter-spacing:1px">⚡ SURGE</span>
      </div>
      <p style="font-size:15px;line-height:1.6">${escapeHtml(shareText)}</p>
      <p style="font-size:15px">Use ${escapeHtml(senderName)}'s code to get <b>7 free Premium days</b> when you join:</p>
      <div style="text-align:center;margin:20px 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#d4a843;color:#050c1a;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:12px;text-decoration:none">Claim 7 free days</a>
      </div>
      <p style="font-size:13px;color:#8fa3bf;text-align:center">You're getting this because a SURGE member invited you.</p>
    </div>`;

  // sending with resend
  try {
    const resend = new Resend(RESEND_API_KEY);
    const sent = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject,
      html: htmlBody,
    });
    if (sent.error) {
      console.error("resend error", sent.error);
      return json({ error: "email send failed" }, 502);
    }
  } catch (err) {
    console.error("resend exception", err);
    return json({ error: "email send failed" }, 502);
  }

  // Record the invite row (service role) and grant the +1 day (user token).
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { error: insertError } = await adminClient.from("surge_invites").insert({
    inviter_id: sender.id,
    invite_code: code,
    recipient_email: recipientEmail,
    channel: "email",
    status: "sent",
  });
  if (insertError) {
    console.error("invite insert failed", insertError);
  }

  let days = 0;
  const { data: rpcData, error: rpcError } = await userClient.rpc("surge_record_invite", {
    p_channel: "email",
  });
  if (!rpcError && rpcData?.ok) {
    days = Number(rpcData.days || 0);
  }

  return json({ ok: true, days, ref_url: refUrl });
});

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}