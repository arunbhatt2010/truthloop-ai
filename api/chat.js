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
paid199 = false,
userGoal = "",
userProblem = "",
userAction = ""
} = body;
const { shownLoop5 = [] } = body;
if (!messages || !messages.length) {
return res.status(400).json({ reply: "No input provided" });
}

const lastUserMessage = messages[messages.length - 1]?.content || "";
const lowerMsg = lastUserMessage.toLowerCase();
const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

// ❌ DOMAIN FILTER (ONLY LOOP 1)
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

// 🚧 PAYWALLS
if (loopLevel >= 5 && !paid49) {
const loop5Lines = [
  "You see the problem.\nBut you're still not moving.",
  "Clarity is there.\nAction is missing.",
  "You understand it.\nYou're not doing it.",
  "Nothing new is needed.\nExecution is missing."
];

// filter already shown
const available = loop5Lines.filter(l => !shownLoop5.includes(l));

// fallback if all used
const finalPool = available.length ? available : loop5Lines;

const randomLine = finalPool[Math.floor(Math.random() * finalPool.length)];
return res.status(200).json({
  reply: randomLine,
  paywall: true,
  shownLoop5: [...shownLoop5, randomLine]
});
if (loopLevel >= 7 && !paid199) {
return res.status(200).json({
reply: "You already know the truth.\nYou're delaying it.",
paywall: true
});
}

// 🧠 UPDATED PROMPT (BALANCED CONTROL)
const systemPrompt = `

You are TruthLoop.

STRICT RULES:

- Stay inside user's exact problem

- Do NOT invent details

- Do NOT ask personal questions

- Do NOT change topic

- Only use what user has said

- Never repeat previous insights

- Each response must introduce a NEW angle

- Do not restate the same problem

- Move deeper every step

- If repeating → change perspective immediately
  STYLE:

- Use short but complete lines

- 2–4 lines per response (flexible)

- Natural human phrasing

- No broken fragments

- No robotic structure

TONE:

- Direct
- Slightly uncomfortable
- No coaching
- No advice

LOGIC:

- Find contradiction in user's own words
- Expose it clearly
- Ask ONE relevant question only

IMPORTANT:

- Do NOT over-explain
- Do NOT solve too early
- Maintain tension

STAGE: ${loopLevel}
Stage 2 → surface mismatch
Stage 3 → behavioral pattern
Stage 4 → hidden truth (root cause)

Do NOT repeat earlier stages
Stage 1:

- 1–2 lines
- Ask ONE simple question

Stage 2:

- 2–3 lines
- Show mismatch
- Ask ONE question

Stage 3:

- 3–4 lines
- Sharpen contradiction
- Add pressure
- Ask ONE question

Stage 4:

- 2–3 lines ONLY
- One uncomfortable truth
- Do NOT solve
- Leave curiosity gap
- Make it shareable

IMPORTANT:

- Clarity here = only 30–40%

Stage 5:

- 4–5 lines
- Define real decision

Stage 6:

- 4–6 lines
- Give practical steps

Stage 7:

- 5–7 lines
- Show outcome difference
- Push action
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
temperature: 0.6,
max_tokens: 180
})
}
);

if (!response.ok) {
return res.status(500).json({ reply: "API error" });
}

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "No response";

// 🔥 ANTI-RANDOM FILTER
if (
reply.toLowerCase().includes("name") ||
reply.toLowerCase().includes("who are you")
) {
reply = "Stay on the problem.\nWhat’s actually not working?";
}

// 🔥 SMART ANTI-REPEAT (ADDED ONLY THIS)
const lastAssistant = messages
.filter(m => m.role === "assistant")
.slice(-2)
.map(m => m.content.toLowerCase());

const replyLower = reply.toLowerCase();

const isRepeating = lastAssistant.some(prev => {
let common = 0;
const words = replyLower.split(" ");

for (let w of words) {
if (prev.includes(w) && w.length > 4) {
common++;
}
}

return common >= 5;
});

if (isRepeating) {
reply = "Same pattern.\nDifferent angle:\nWhat are you avoiding?";
}

// 🔥 LOOP 4 CONTROL
if (loopLevel === 4) {
reply = lastUserMessage.includes("no clear next step")
? "If there’s no clear next step… why would anyone respond?"
: reply.split("\n")[0];
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
