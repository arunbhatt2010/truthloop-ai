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
  if (req.method !== "POST") return res.status(405).json({error:"method_not_allowed"});

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({error:"payment_configuration_missing"});
    }

    const amountRupees = Number(req.body?.amount);
    if (amountRupees !== 499) {
      return res.status(400).json({error:"invalid_amount", message:"Only INR 499 payments are accepted."});
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: 49900,
      currency: "INR",
      receipt: `truthloop_${Date.now()}`
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("RAZORPAY_ORDER_CREATE_FAILED", error);
    return res.status(500).json({error:"order_failed", message:"Unable to create payment order."});
  }
}
