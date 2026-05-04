export default async function handler(req, res) {

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") return res.status(200).end();
if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

try {

const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

const {
messages,
loopLevel = 1,
paid49 = false,
paid199 = false,
paypalOrderID,
razorpayPaymentId
} = body;

if (!messages || !messages.length) {
  return res.status(400).json({ reply: "No input provided" });
}

const lastUserMessage = messages[messages.length - 1]?.content || "";
const lowerMsg = lastUserMessage.toLowerCase();

/* 🔥 LANGUAGE DETECTION */
const hindiChars = (lastUserMessage.match(/[\u0900-\u097F]/g) || []).length;
const englishChars = (lastUserMessage.match(/[a-zA-Z]/g) || []).length;
const isHindi = hindiChars > englishChars;

/* ❌ DOMAIN FILTER */
const blockedPatterns = [
"doctor","medicine","pain","fever","treatment",
"relationship","breakup","girlfriend","boyfriend","marriage",
"दर्द","बुखार","इलाज","डॉक्टर",
"रिलेशनशिप","ब्रेकअप","प्यार","शादी"
];

if (loopLevel === 1 && blockedPatterns.some(w => lowerMsg.includes(w))) {
  return res.status(200).json({
    reply: isHindi
      ? "यह decision problem नहीं है.\n\nऐसा सवाल पूछो जहाँ फैसला लेना हो."
      : "This isn't a decision problem.\n\nAsk something where a decision is required."
  });
}

/* 🔥 LOOP 1 STRICT */
if (loopLevel === 1) {
  const words = lastUserMessage.trim().split(/\s+/).length;
  if (words < 4) {
    return res.status(200).json({
      reply: isHindi
        ? "बहुत vague है.\n\nठीक क्या काम नहीं कर रहा?"
        : "Too vague.\n\nWhat exactly is not working?"
    });
  }
}

/* 🔐 PAYPAL CONFIG */
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_ENV === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

/* 🔐 VERIFY PAYPAL */
async function verifyPayPal(orderID){
  try{
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");

    const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const orderData = await orderRes.json();

    return orderData.status === "COMPLETED";
  } catch {
    return false;
  }
}

/* 🔐 VERIFY RAZORPAY */
async function verifyRazorpay(paymentId){
  try{
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET}`).toString("base64");

    const r = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Basic ${auth}` }
    });

    const data = await r.json();
    return data.status === "captured";
  } catch {
    return false;
  }
}

/* 🔒 LOOP 5 PAYWALL */
if (loopLevel === 5) {

let verified = false;

if (paypalOrderID) verified = await verifyPayPal(paypalOrderID);
if (razorpayPaymentId) verified = await verifyRazorpay(razorpayPaymentId);

if (!verified) {
  return res.status(200).json({
    reply: isHindi
      ? "तुमने देख लिया है.\nAction नहीं.\nSame pattern repeat.\nक्यों?"
      : "You saw the gap.\nNo action.\nSame pattern repeats.\nWhy?",
    paywall: true
  });
}

}

/* 🔒 LOOP LOCKS */
if (loopLevel >= 6 && !paid49) {
  return res.status(200).json({
    reply: isHindi ? "पहले unlock करो." : "Unlock previous step first.",
    paywall: true
  });
}

if (loopLevel === 7 && !paid199) {
  return res.status(200).json({
    reply: isHindi ? "अब commit करो." : "Now commit.",
    paywall: true
  });
}

/* 🔥 CONTEXT */
const context = messages.slice(-6).map(m =>
`${m.role === "user" ? "User" : "TruthLoop"}: ${m.content}`
).join("\n");

/* 🔥 FINAL AHA PROMPT */
const systemPrompt = `
You are TruthLoop.

You do NOT help.
You expose.

LANGUAGE:
Reply only in user's language.

STYLE:
4 lines only.
Max 10 words each.
No filler.

FLOW:
1 Mirror situation
2 Contradiction
3 Pattern
4 Real problem + question

CONTEXT:
${context}

USER:
${lastUserMessage}
`;

/* 🔥 AI CALL */
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: "Bearer " + process.env.GROQ_API_KEY
},
body: JSON.stringify({
model: "llama-3.3-70b-versatile",
messages: [{ role: "system", content: systemPrompt }],
temperature: 0.6,
max_tokens: 120
})
});

let reply = "";

if (!response.ok) {
  reply = isHindi
    ? "AI fail हुआ.\nफिर try करो."
    : "AI failed.\nTry again.";
} else {
  const data = await response.json();
  reply = data?.choices?.[0]?.message?.content || "";
}

/* 🔥 HARD FORMAT FIX */
if (reply) {
  const lines = reply.split("\n").filter(l => l.trim());
  reply = lines.slice(0, 4).join("\n");
}

/* 🔥 FALLBACK */
if (!reply || reply.length < 20) {
  reply = isHindi
    ? "तुम कर रहे हो.\nकुछ बदल नहीं रहा.\npattern repeat.\nक्यों?"
    : "You're doing it.\nNothing changes.\nSame pattern.\nWhy?";
}

return res.status(200).json({
  reply,
  paywall: false
});

} catch (error) {
console.error(error);
return res.status(500).json({ reply: "Server error" });
}

    }
