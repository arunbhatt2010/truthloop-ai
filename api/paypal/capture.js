export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: "missing_order_id" });
  }

  try {

    /* =========================
       🔐 GET ACCESS TOKEN
    ========================= */
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
    ).toString("base64");

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
       💰 CAPTURE ORDER
    ========================= */
    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const data = await captureRes.json();

    /* =========================
       ✅ VERIFY PAYMENT
    ========================= */
    if (data.status === "COMPLETED") {

      // 👇 IMPORTANT: यहां user unlock करो
      return res.status(200).json({
        success: true,
        paid49: true
      });
    }

    return res.status(400).json({
      success: false,
      error: "payment_not_completed"
    });

  } catch (error) {

    console.error("PayPal Capture Error:", error);

    return res.status(500).json({
      success: false,
      error: "capture_failed"
    });
  }
        }
