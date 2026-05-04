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
paid199 = false
} = body;

if (!messages || !messages.length) {
  return res.status(400).json({ reply: "No input provided" });
}

const lastUserMessage = messages[messages.length - 1]?.content || "";
const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

/* 🔒 LOOP 5 PAYWALL */
if (loopLevel === 5 && !paid49) {
  return res.status(200).json({
    reply: isHindi
      ? "तुम bypass करने की कोशिश कर रहे हो।"
      : "You’re trying to bypass.",
    paywall: true
  });
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
      ? "अब commitment दिखाओ।"
      : "Now show commitment.",
    paywall: true
  });
}

/* 🔥 PROMPT */
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
- No explanation
- No advice
- No suggestions

FLOW (STRICT):
Line 1 → Mirror user situation
Line 2 → Contradiction
Line 3 → Pattern
Line 4 → Real problem
Line 5 → ONE uncomfortable question

RULES:
- Use user's exact words
- No generic lines
- Every line must hit personally
- Make it feel uncomfortable but true

STAGE: ${loopLevel}
`;

/* 🔥 API CALL */
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
    max_tokens: 200
  })
});

/* 🔥 SAFE RESPONSE HANDLING */
let reply = "";

if (!response.ok) {
  const text = await response.text();
  console.error("Groq error:", text);

  reply = isHindi
    ? "AI response fail ho गया.\n\nफिर try करो."
    : "AI response failed.\n\nTry again.";
} else {
  const data = await response.json();
  reply = data?.choices?.[0]?.message?.content || "";
}

/* fallback */
if (!reply || reply.length < 10) {
  reply = isHindi
    ? "तुम avoid कर रहे हो।\n\nक्या?"
    : "You're avoiding something.\n\nWhat?";
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
