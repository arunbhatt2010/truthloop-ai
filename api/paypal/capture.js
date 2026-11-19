const EXPECTED_AMOUNT = "9.99";
const EXPECTED_CURRENCY = "USD";

function getPayPalApiBase() {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function fetchWithTimeout(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getAccessToken(apiBase) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    const error = new Error("paypal_server_configuration_missing");
    error.code = "paypal_server_configuration_missing";
    throw error;
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const response = await fetchWithTimeout(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const error = new Error(data.error_description || data.error || "paypal_token_failed");
    error.code = "paypal_token_failed";
    throw error;
  }
  return data.access_token;
}

function isExpectedOrder(order) {
  const unit = order?.purchase_units?.[0];
  return unit?.amount?.currency_code === EXPECTED_CURRENCY &&
    String(unit?.amount?.value) === EXPECTED_AMOUNT;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  const orderID = String(req.body?.orderID || "").trim();
  if (!/^[A-Za-z0-9-]{8,80}$/.test(orderID)) {
    return res.status(400).json({ success: false, error: "invalid_order_id" });
  }

  const apiBase = getPayPalApiBase();
  try {
    const accessToken = await getAccessToken(apiBase);
    const orderUrl = `${apiBase}/v2/checkout/orders/${encodeURIComponent(orderID)}`;
    const orderResponse = await fetchWithTimeout(orderUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const order = await orderResponse.json().catch(() => ({}));

    if (!orderResponse.ok) {
      console.error("PAYPAL_ORDER_LOOKUP_ERROR", { httpStatus: orderResponse.status, name: order.name });
      return res.status(502).json({ success: false, error: "paypal_order_verification_failed" });
    }
    if (!isExpectedOrder(order)) {
      return res.status(400).json({ success: false, error: "paypal_order_amount_mismatch" });
    }

    // A retry after a successful capture must not attempt to charge again.
    if (order.status === "COMPLETED") {
      return res.status(200).json({ success: true, status: "COMPLETED", orderID });
    }
    if (order.status !== "APPROVED") {
      return res.status(409).json({ success: false, error: "paypal_order_not_approved", orderStatus: order.status || "UNKNOWN" });
    }

    const captureResponse = await fetchWithTimeout(`${orderUrl}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        "PayPal-Request-Id": `tl-capture-${orderID}`.slice(0, 38)
      },
      body: "{}"
    });
    const capture = await captureResponse.json().catch(() => ({}));
    if (!captureResponse.ok || capture.status !== "COMPLETED") {
      console.error("PAYPAL_CAPTURE_PROVIDER_ERROR", {
        httpStatus: captureResponse.status,
        name: capture.name,
        issue: capture.details?.[0]?.issue,
        status: capture.status
      });
      return res.status(502).json({ success: false, error: "paypal_capture_not_completed" });
    }

    return res.status(200).json({ success: true, status: "COMPLETED", orderID });
  } catch (error) {
    console.error("PAYPAL_CAPTURE_ERROR", error?.code || error?.message || error);
    const configurationError = error?.code === "paypal_server_configuration_missing";
    return res.status(configurationError ? 500 : 502).json({
      success: false,
      error: error?.code || "paypal_capture_failed"
    });
  }
}
