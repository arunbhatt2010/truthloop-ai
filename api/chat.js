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

// 🚧 PAYWALL LOOP 5 (keep as is)
if (loopLevel === 5 && !paid49) {

  const base = lastUserMessage.slice(0, 60);

  const loop5Lines = [
    `You said: "${base}"\nBut you're still not acting on it.`,
    `You already described the problem.\nYou're just avoiding fixing it.`,
    `You’re not confused.\nYou’re delaying what you already know.`,
    `Nothing new is needed here.\nYou're just not executing.`,
    `You're asking again.\nBut you already have the answer.`
  ];

  const available = loop5Lines.filter(l => !shownLoop5.includes(l));
  const finalPool = available.length ? available : loop5Lines;

  const randomLine = finalPool[Math.floor(Math.random() * finalPool.length)];

  return res.status(200).json({
    reply: randomLine,
    paywall: true,
    shownLoop5: [...shownLoop5, randomLine]
  });
}

// 🧠 ORIGINAL STYLE PROMPT (RESTORED)
const systemPrompt = `

You are TruthLoop.

STRICT RULES:

- Stay inside user's exact problem
- Do NOT invent details
- Do NOT change topic
- Only use what user has said
- Every step must go deeper
- Never repeat same insight

STYLE:

- Short lines
- 2–4 lines
- Natural human phrasing

TONE:

- Direct
- Slightly uncomfortable
- No coaching
- No advice

LOGIC:

- Find contradiction in user's own words
- Expose it clearly
- Ask ONE sharp question

IMPORTANT:

- Each loop must feel deeper
- No generic lines
- No safe statements

STAGE: ${loopLevel}

Stage 1:
- Ask simple question

Stage 2:
- Show mismatch
- Ask question

Stage 3:
- Sharpen contradiction
- Ask question

Stage 4:
- Hit uncomfortable truth
- Ask question

Stage 5:
- Force decision

Stage 6:
- Push action

Stage 7:
- Final push
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
temperature: 0.7,
max_tokens: 180
})
}
);

if (!response.ok) {
return res.status(500).json({ reply: "API error" });
}

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "No response";

// 🔥 CLEAN FILTER
if (
reply.toLowerCase().includes("name") ||
reply.toLowerCase().includes("who are you")
) {
reply = "Stay on the problem.\nWhat’s actually not working?";
}

// ❌ NO CUTTING INSIGHT
// (Loop 4 अब full रहेगा)

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
