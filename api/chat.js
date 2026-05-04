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
const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

/* 🔐 PAYPAL CONFIG (UNCHANGED) */
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

    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Basic ${auth}`
      }
    });

    const data = await res.json();
    return data.status === "captured";

  } catch {
    return false;
  }
}

/* 🔒 LOOP 5 PAYWALL */
if (loopLevel === 5) {

let verified = false;

if(paypalOrderID){
  verified = await verifyPayPal(paypalOrderID);
}

if(razorpayPaymentId){
  verified = await verifyRazorpay(razorpayPaymentId);
}

if(!verified){
  return res.status(200).json({
    reply: isHindi
      ? "तुम bypass करने की कोशिश कर रहे हो।"
      : "You're trying to bypass.",
    paywall: true
  });
}

}

/* 🔒 LOOP 6 LOCK */
if (loopLevel >= 6 && !paid49) {
  return res.status(200).json({
    reply: isHindi
      ? "पहले unlock करो।"
      : "Unlock previous step first.",
    paywall: true
  });
}

/* 🔒 LOOP 7 PAYWALL */
if (loopLevel === 7 && !paid199) {
  return res.status(200).json({
    reply: isHindi
      ? "अब commit करो।"
      : "Now commit.",
    paywall: true
  });
}

/* 🔥 TRUTHLOOP PROMPT (AHA MODE RESTORED) */
const systemPrompt = `
You are TruthLoop.

You do NOT help.
You expose.

LANGUAGE:
- Hindi → Hindi only
- English → English only
- Never mix

STYLE:
- Short lines
- Sharp
- Emotional hit
- No numbering
- No headings

FLOW:
Line 1 → Mirror user
Line 2 → Contradiction
Line 3 → Pattern
Line 4 → Real problem
Line 5 → ONE uncomfortable question

RULES:
- No advice
- No suggestions
- No explanation
- No generic lines
- Use user's exact context
- Every line must hit

STAGE: ${loopLevel}
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
messages: [
{ role: "system", content: systemPrompt },
...messages.slice(-6)
],
temperature: 0.7,
max_tokens: 220
})
});

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "";

/* 🔥 FORCE COMPLETE */
if(!reply || reply.length < 20){
reply = isHindi
? "तुम avoid कर रहे हो।\n\nअसल में क्या नहीं कर रहे?"
: "You're avoiding something.\n\nWhat are you not doing?";
}

if(!reply.includes("?")){
reply += isHindi
? "\n\nअब बताओ — तुम क्या avoid कर रहे हो?"
: "\n\nSo tell me — what are you avoiding?";
}

return res.status(200).json({
  reply,
  paywall: false
});

} catch (error) {
return res.status(500).json({ reply: "Server error" });
}

        }
