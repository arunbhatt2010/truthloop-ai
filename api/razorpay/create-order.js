res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
  return res.status(200).end();
}
import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { amount = 4900, currency = "INR" } = req.body; // ₹49 => 4900 paise
    if (amount !== 4900) {
  return res.status(400).json({ error: "invalid_amount" });
}
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: "truthloop_order_" + Date.now()
    });

    return res.status(200).json(order);
  } catch (e) {
    return res.status(500).json({ error: "order_failed" });
  }
}
