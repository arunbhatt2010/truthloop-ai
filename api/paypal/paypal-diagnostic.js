const allowedVisibilityStatuses = new Set(["YES", "NO"]);
const allowedCheckoutStatuses = new Set([
  "OPENED_CONFIRMED",
  "NOT_OPENED_CONFIRMED",
  "OPENED_LIKELY_NOT_CONFIRMED",
  "OPEN_NOT_CONFIRMED",
  "CHECKOUT_ERROR_OPEN_STATUS_UNKNOWN",
  "AREA_TOUCHED_NO_SDK_CLICK_CALLBACK"
]);

// Best-effort per-instance throttle. The client also sends at most one visibility
// report per report session and one interaction result per PayPal click attempt.
const recentRequests = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;

function clean(value, maxLength = 400) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maxLength);
}

function safeMetrics(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output = {};
  const allowed = [
    "containerFound", "containerVisible", "containerWidth", "containerHeight",
    "iframeCount", "visibleIframeCount", "iframes", "secondsObserved",
    "phase", "popupBlocked", "areaTouch"
  ];
  for (const key of allowed) {
    if (!(key in input)) continue;
    if (key === "iframes" && Array.isArray(input[key])) {
      output.iframes = input[key].slice(0, 4).map(frame => ({
        title: clean(frame?.title, 80),
        width: Number(frame?.width) || 0,
        height: Number(frame?.height) || 0,
        visible: Boolean(frame?.visible),
        inViewport: Boolean(frame?.inViewport)
      }));
    } else {
      const value = input[key];
      output[key] = typeof value === "boolean" ? value :
        (typeof value === "number" ? value : clean(value, 80));
    }
  }
  return output;
}

function allowRequest(req) {
  const now = Date.now();
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const key = forwarded || "unknown";
  const recent = (recentRequests.get(key) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  recentRequests.set(key, recent);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!allowRequest(req)) {
    return res.status(429).json({ error: "diagnostic_rate_limited" });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("PAYPAL_DIAGNOSTIC_EMAIL_MISSING_RESEND_API_KEY");
    return res.status(500).json({ error: "diagnostic_email_not_configured" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const stage = clean(body.stage, 40);
  const status = clean(body.status, 60);
  const isVisibility = stage === "button_visibility" && allowedVisibilityStatuses.has(status);
  const isCheckout = stage === "checkout_interaction" && allowedCheckoutStatuses.has(status);
  if (!isVisibility && !isCheckout) {
    return res.status(400).json({ error: "invalid_diagnostic_stage_or_status" });
  }

  const diagnosticId = clean(body.diagnosticId, 80).replace(/[^A-Za-z0-9_-]/g, "");
  const attemptId = clean(body.attemptId, 110).replace(/[^A-Za-z0-9_-]/g, "");
  const reportMode = body.reportMode === "direct" ? "direct" : "conversation";
  const pagePath = clean(body.pagePath, 100);
  const reason = clean(body.reason, 500) || "No additional reason supplied.";
  const metrics = safeMetrics(body.metrics);
  const timestamp = new Date().toISOString();

  const lines = [
    "TruthLoop AI — PayPal technical diagnostic",
    "Stage: " + (isVisibility ? "Button visibility" : "Checkout interaction"),
    "Status: " + status,
    "Diagnostic ID: " + (diagnosticId || "not supplied"),
    "Attempt ID: " + (attemptId || "not applicable"),
    "Report mode: " + reportMode,
    "Page path: " + (pagePath || "/app"),
    "Server received at (UTC): " + timestamp,
    "Client timestamp: " + clean(body.clientTimestamp, 50),
    "Funding source: " + clean(body.fundingSource, 40),
    "Clicked: " + (body.clicked === true ? "YES" : body.clicked === false ? "NO" : "not supplied"),
    "Server order created: " + (body.orderCreated === true ? "YES" : body.orderCreated === false ? "NO" : "not applicable"),
    "Browser focus/visibility signal: " + (body.externalWindowSignal === true ? "YES" : body.externalWindowSignal === false ? "NO" : "not supplied"),
    "Reason: " + reason,
    "Technical metrics: " + JSON.stringify(metrics),
    "",
    "Interpretation note: the parent page cannot inspect the contents/pixels inside PayPal's cross-origin iframe. A visible iframe confirms SDK rendering geometry, not the inner button pixels. Checkout OPENED_CONFIRMED is sent only after PayPal onCancel/onApprove returns. Other statuses preserve uncertainty rather than inventing a result."
  ];

  const recipient = process.env.PAYPAL_DIAGNOSTIC_TO || "truthloop.in@gmail.com";
  const sender = process.env.RESEND_FROM_EMAIL || "TruthLoop AI Diagnostics <onboarding@resend.dev>";
  const subject = isVisibility
    ? `TruthLoop PayPal | BUTTON VISIBLE: ${status} | ${diagnosticId || "session"}`
    : `TruthLoop PayPal | CHECKOUT: ${status} | ${attemptId || diagnosticId || "attempt"}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject,
        text: lines.join("\n")
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("PAYPAL_DIAGNOSTIC_RESEND_ERROR", {
        httpStatus: response.status,
        message: result.message || result.name || "Resend request failed"
      });
      return res.status(502).json({ error: "diagnostic_email_send_failed" });
    }
    return res.status(200).json({ ok: true, emailId: result.id || null });
  } catch (error) {
    console.error("PAYPAL_DIAGNOSTIC_EMAIL_ERROR", error?.message || error);
    return res.status(502).json({ error: "diagnostic_email_send_failed" });
  }
}
