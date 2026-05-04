import crypto from "crypto";

export default async function handler(req, res) {

  /* =========================
     🌐 HEADERS (CORS)
  ========================= */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {

    /* =========================
       📥 BODY
    ========================= */
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body || {};

    /* =========================
       ❌ VALIDATION
    ========================= */
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    /* =========================
       🔐 SIGNATURE VERIFY
    ========================= */
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    /* =========================
       ✅ RESULT
    ========================= */
    if (expected === razorpay_signature) {
      // 👉 यहाँ ideally DB/session में mark करना चाहिए
      return res.status(200).json({
        success: true,
        paid49: true
      });
    } else {
      return res.status(400).json({ success: false });
    }

  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).json({ success: false });
  }
}
