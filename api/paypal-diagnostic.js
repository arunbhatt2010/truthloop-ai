// TruthLoop PayPal visibility diagnostic — Vercel Node.js serverless function.
// Sends only YES/NO and (for NO) a short technical reason to the site owner.
const OWNER_EMAIL = "truthloop.in@gmail.com";
const SENDER_EMAIL = "onboarding@resend.dev";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = String(req.headers.origin || "");
  if (origin && origin !== "https://truthloop.in" && origin !== "https://www.truthloop.in") {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Feedback emails use the same existing Resend integration.
  // This branch is separate from, and does not alter, PayPal diagnostics.
  if (body.type === "feedback") {
    const stage = body.stage === "stage1" ? "Stage 1 — Before report generation"
      : body.stage === "stage2" ? "Stage 2 — After report/paywall" : "";
    const allowedReasons = {
      stage1: [
        "Unclear what the investigation would reveal",
        "Unsure which public URL to enter",
        "Not ready to investigate",
        "Technical issue",
        "Other"
      ],
      stage2: [
        "Free finding was enough",
        "Unclear additional value",
        "Need more time",
        "Price",
        "Not convinced yet",
        "Payment issue",
        "Just exploring",
        "Other"
      ]
    };
    const reason = String(body.reason || "").slice(0, 100);
    if (!stage || !allowedReasons[body.stage].includes(reason)) {
      return res.status(400).json({ error: "Invalid feedback" });
    }
    const detail = String(body.detail || "").replace(/[\\r\\n<>]/g, " ").slice(0, 500);
    const escapeHtml = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Email provider is not configured" });
    const html = "<p><strong>Feedback stage:</strong> " + escapeHtml(stage) + "</p>" +
      "<p><strong>Selected reason:</strong> " + escapeHtml(reason) + "</p>" +
      (detail ? "<p><strong>Additional feedback:</strong><br>" + escapeHtml(detail) + "</p>" : "");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "TruthLoop Feedback <" + SENDER_EMAIL + ">",
          to: [OWNER_EMAIL],
          subject: "TruthLoop Feedback — " + stage,
          html
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("RESEND_FEEDBACK_EMAIL_FAILED", response.status, result?.message || result?.name || "unknown");
        return res.status(502).json({ error: "Feedback email could not be sent" });
      }
      return res.status(200).json({ sent: true });
    } catch (error) {
      console.error("RESEND_FEEDBACK_EMAIL_ERROR", error?.message || error);
      return res.status(502).json({ error: "Feedback email service unavailable" });
    }
  }

  const status = body.status === "YES" ? "YES" : body.status === "NO" ? "NO" : "";
  if (!status) return res.status(400).json({ error: "Invalid diagnostic status" });

  const reason = status === "NO"
    ? String(body.reason || "PayPal button did not become visible").replace(/[\r\n<>]/g, " ").slice(0, 280)
    : "";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Email provider is not configured" });

  const subject = status === "YES"
    ? "TruthLoop PayPal Button: YES"
    : "TruthLoop PayPal Button: NO";
  const html = status === "YES"
    ? "<p><strong>PayPal button visible?</strong> YES</p>"
    : "<p><strong>PayPal button visible?</strong> NO</p><p><strong>Technical reason:</strong> " +
      reason.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "TruthLoop Diagnostics <" + SENDER_EMAIL + ">",
        to: [OWNER_EMAIL],
        subject,
        html
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("RESEND_DIAGNOSTIC_EMAIL_FAILED", response.status, result?.message || result?.name || "unknown");
      return res.status(502).json({ error: "Diagnostic email could not be sent" });
    }
    return res.status(200).json({ sent: true });
  } catch (error) {
    console.error("RESEND_DIAGNOSTIC_EMAIL_ERROR", error?.message || error);
    return res.status(502).json({ error: "Diagnostic email service unavailable" });
  }
};
