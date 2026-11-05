import crypto from "crypto";
import Razorpay from "razorpay";

const ALLOWED_ORIGINS = new Set([
  "https://truthloop.in",
  "https://www.truthloop.in"
]);

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({success:false, error:"method_not_allowed"});

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({success:false, error:"missing_payment_fields"});
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({success:false, error:"payment_configuration_missing"});
    }

    // Verify Checkout's signature with the server-only Razorpay secret.
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const suppliedBuffer = Buffer.from(String(razorpay_signature), "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (suppliedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      return res.status(400).json({success:false, error:"signature_verification_failed"});
    }

    // Fetch the payment from Razorpay itself; never trust amount/status from the browser.
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id ||
        payment.amount !== 49900 ||
        payment.currency !== "INR") {
      return res.status(400).json({success:false, error:"payment_details_mismatch"});
    }

    // Only captured funds unlock the report. Authorized-but-not-captured stays locked.
    if (payment.status !== "captured") {
      return res.status(409).json({
        success:false,
        paid:false,
        error:"payment_not_captured",
        message:"Payment is not captured yet. The report remains locked."
      });
    }

    return res.status(200).json({
      success:true,
      paid:true,
      amount:payment.amount,
      currency:payment.currency,
      payment_id:payment.id,
      order_id:payment.order_id
    });
  } catch (error) {
    console.error("RAZORPAY_PAYMENT_VERIFY_FAILED", error);
    return res.status(500).json({success:false, error:"verification_failed"});
  }
}
