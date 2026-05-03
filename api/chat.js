export default async function handler(req, res) {

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
return res.status(200).end();
}

if (req.method !== "POST") {
return res.status(405).json({ reply: "Method not allowed" });
}

try {

const body = typeof req.body === "string"
? JSON.parse(req.body)
: req.body;

const {
messages,
loopLevel = 1,
paid49 = false,
paid199 = false
} = body;

const { shownLoop5 = [] } = body;

if (!messages || !messages.length) {
return res.status(400).json({ reply: "No input provided" });
}

const lastUserMessage = messages[messages.length - 1]?.content || "";
const lowerMsg = lastUserMessage.toLowerCase();
const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

// ❌ DOMAIN FILTER
const healthPatterns = ["दर्द","दांत","सर दर्द","pain","doctor","medicine","health","fever","treatment"];
const relationshipPatterns = ["relationship","breakup","love","girlfriend","boyfriend","wife","husband","marriage","ex"];

const isHealth = healthPatterns.some(word => lowerMsg.includes(word));
const isRelationship = relationshipPatterns.some(word => lowerMsg.includes(word));

if (loopLevel === 1 && (isHealth || isRelationship)) {
return res.status(200).json({
reply: isHindi
? "यह decision problem नहीं है।\n\nऐसा सवाल पूछो जहाँ तुम्हें फैसला लेना हो।"
: "This isn't a decision problem.\n\nAsk something where a decision is required."
});
}

// 🔥 STAGE 1 ENTRY
if (loopLevel === 1) {
const hasDetail =
lastUserMessage.split(" ").length > 6 &&
(lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

if (!hasDetail) {
return res.status(200).json({
reply: isHindi
? "एक लाइन में साफ बोलो:\n→ क्या करते हो\n→ कहाँ करते हो\n→ क्या काम नहीं कर रहा"
: "One line:\n→ What you do\n→ Where\n→ What’s not working"
});
}
}

// 🚧 PAYWALL LOOP 7
if (loopLevel === 7 && !paid199) {
return res.status(200).json({
reply: "You already know the truth.\nYou're delaying it.",
paywall: true
});
}

// 🚧 PAYWALL LOOP 5
const base = lastUserMessage.slice(0, 60);

const loop5Lines = [
  `You said: "${base}"\nBut you're still not acting on it.`,
  `You already described the problem.\nYou're just avoiding fixing it.`,
  `You’re not confused.\nYou’re delaying what you already know.`,
  `Nothing new is needed here.\nYou're just not executing.`,
  `You're asking again.\nBut you already have the answer.`
];
if (loopLevel === 5 && lowerMsg.includes("nahi") || lowerMsg.includes("samajh")) {
  loop5Lines.push("You understand it.\nYou're just resisting it.");
}
  const available = loop5Lines.filter(l => !shownLoop5.includes(l));
  const finalPool = available.length ? available : loop5Lines;

  const randomLine = finalPool[Math.floor(Math.random() * finalPool.length)];

  return res.status(200).json({
    reply: randomLine,
    paywall: true,
    shownLoop5: [...shownLoop5, randomLine]
  });
}

// 🧠 STRONG PROMPT (FIXED)
const systemPrompt = `

You are TruthLoop.

STRICT RULES:

- Stay inside user's exact problem
- Do NOT repeat user's words
- Do NOT give obvious statements
- Every line must feel new or uncomfortable
- If it's obvious → rewrite it

STYLE:

- Short lines
- 2–3 lines max
- Punchy and sharp
- Natural human tone

TONE:

- Direct
- Slightly uncomfortable
- No advice
- No explaining

LOGIC:

- Do NOT ask questions
- Speak in statements only
- Say it like a realization, not a suggestion
- It should feel like: “I didn’t realise this”
- Make it slightly uncomfortable
- No "have you", no "why", no questions

STAGE: ${loopLevel}

Stage 1: simple question  
Stage 2: mismatch  
Stage 3: pattern  
Stage 4: uncomfortable truth  
Stage 5: decision  
Stage 6: action  
Stage 7: push
`;

const response = await fetch(
"https://api.groq.com/openai/v1/chat/completions",
{
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: "Bearer " + process.env.GROQ_API_KEY
},
body: JSON.stringify({
model: "llama-3.3-70b-versatile",
messages: [
{ role: "system", content: systemPrompt },
...messages
],
temperature: 0.9,
max_tokens: 180
})
}
);

if (!response.ok) {
return res.status(500).json({ reply: "API error" });
}

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "No response";

// 🔥 GUIDE OVERRIDE (SHARPER)
if (lowerMsg.includes("guide") || lowerMsg.includes("help")) {
  reply = "You already know what to do.\nYou're just not doing it.\nWhy?";
}

// 🔥 CLEAN FILTER
if (
reply.toLowerCase().includes("name") ||
reply.toLowerCase().includes("who are you")
) {
reply = "Stay on the problem.\nWhat’s actually not working?";
}

// 🔥 LOOP 4 FIX (NO CUTTING INSIGHT)
if (loopLevel === 4) {
reply = reply.split("\n").slice(0,2).join("\n");
}

// 🔥 FINAL PUSH
if (loopLevel >= 6) {
reply += "\n\nNow decide.";
}

return res.status(200).json({
reply,
paywall: false
});

} catch (error) {
console.error("Server error:", error);
return res.status(500).json({
reply: "Server error"
});
}
}
