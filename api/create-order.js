export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount } = req.body;

    // Sirf 49 ya 199 allow
    if (amount !== 49 && amount !== 199) {
      return res.status(400).json({
        error: "invalid_amount",
      });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "truthloop_" + Date.now(),
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "order_failed",
    });
  }
};
