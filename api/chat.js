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

/* ✅ LANGUAGE DETECTION */
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

/* 🔒 LOOP 5 PAYWALL */
if (loopLevel === 5) {
  return res.status(200).json({
    reply: isHindi
      ? "तुम bypass कर रहे हो.\n\nपहले unlock करो."
      : "You're trying to bypass.\n\nUnlock first.",
    paywall: true
  });
}

/* 🔒 LOOP LOCKS */
if (loopLevel >= 6 && !paid49) {
  return res.status(200).json({
    reply: isHindi
      ? "पहले unlock करो."
      : "Unlock previous step first.",
    paywall: true
  });
}

if (loopLevel === 7 && !paid199) {
  return res.status(200).json({
    reply: isHindi
      ? "अब commit करो."
      : "Now commit.",
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
You reveal.

LANGUAGE:
- Reply ONLY in user's language
- Never mix languages

STYLE:
- EXACTLY 4 lines
- Max 10 words per line
- No filler
- No advice
- No explanation
- No insults
- No guessing words

TONE:
- Calm certainty
- Observational
- Not aggressive

FLOW:
1 Mirror user situation
2 Show contradiction
3 Reveal pattern
4 Expose real problem + question

RULES:
- Use user's context
- No identity attack
- Focus on behavior
- Make it undeniable

CONTEXT:
${context}

USER:
${lastUserMessage}
`;

/* 🔥 AI CALL (FIXED) */
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: "Bearer " + process.env.GROQ_API_KEY
},
body: JSON.stringify({
model: "llama-3.3-70b-versatile",
messages: [
{ role: "system", content: systemPrompt }
],
temperature: 0.6,
max_tokens: 120
})
});

let reply = "";

if (!response.ok) {
  const text = await response.text();
  console.error("Groq error:", text);

  reply = isHindi
    ? "AI fail हुआ.\n\nफिर try करो."
    : "AI failed.\n\nTry again.";
} else {
  const data = await response.json();
  reply = data?.choices?.[0]?.message?.content || "";
}

/* 🔥 HARD FORMAT ENFORCE (CRITICAL FIX) */
if (reply) {
  const lines = reply.split("\n").filter(l => l.trim() !== "");
  reply = lines.slice(0, 4).join("\n");
}

/* 🔥 FALLBACK */
if (!reply || reply.length < 20) {
  reply = isHindi
    ? "तुम कर रहे हो.\nपर बदल कुछ नहीं रहा.\npattern repeat हो रहा है.\nक्यों?"
    : "You're doing it.\nNothing is changing.\nSame pattern repeating.\nWhy?";
}

return res.status(200).json({
  reply,
  paywall: false
});

} catch (error) {
console.error("SERVER ERROR:", error);
return res.status(500).json({ reply: "Server error" });
}

    }
