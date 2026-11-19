const PAYPAL_AMOUNT = "9.99";
const PAYPAL_CURRENCY = "USD";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiBase = getPayPalApiBase();
  try {
    const accessToken = await getAccessToken(apiBase);
    const response = await fetchWithTimeout(`${apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: "truthloop-loop7-report",
          description: "TruthLoop AI Investigation Report",
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: PAYPAL_AMOUNT
          }
        }],
        application_context: {
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING"
        }
      })
    });

    const order = await response.json().catch(() => ({}));
    if (!response.ok || !order.id) {
      console.error("PAYPAL_CREATE_ORDER_PROVIDER_ERROR", {
        httpStatus: response.status,
        name: order.name,
        issue: order.details?.[0]?.issue
      });
      return res.status(502).json({
        error: "paypal_order_creation_failed",
        providerStatus: response.status
      });
    }

    return res.status(201).json({ id: order.id });
  } catch (error) {
    console.error("PAYPAL_CREATE_ORDER_ERROR", error?.code || error?.message || error);
    const configurationError = error?.code === "paypal_server_configuration_missing";
    return res.status(configurationError ? 500 : 502).json({
      error: error?.code || "paypal_order_creation_failed"
    });
  }
}
