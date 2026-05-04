export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {

    /* =========================
       🔐 AUTH TOKEN (IMPORTANT)
    ========================= */
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
    ).toString("base64");

    // Step 1: Get Access Token
    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(500).json({ error: "paypal_token_failed" });
    }

    /* =========================
       💰 ORDER CREATE
    ========================= */
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: "2.99" // 👈 $2.99 (₹249 approx)
            }
          }
        ]
      })
    });

    const orderData = await orderRes.json();

    return res.status(200).json(orderData);

  } catch (error) {

    console.error("PayPal Error:", error);

    return res.status(500).json({
      error: "paypal_order_failed"
    });
  }
}
