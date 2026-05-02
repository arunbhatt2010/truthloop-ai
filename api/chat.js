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
? "यह decision problem नहीं है।\n\nऐसा सवाल पूछो जहाँ तुम्हें कोई फैसला लेना हो।"
: "This isn't a decision problem.\n\nAsk something where you need to make a decision."
});
}

// 🔥 STAGE 1 FIX (SOFT ENTRY)
if (loopLevel === 1) {
const hasDetail =
lastUserMessage.split(" ").length > 6 &&
(lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

if (!hasDetail) {
return res.status(200).json({
reply: isHindi
? "थोड़ा और साफ करते हैं।\n\nएक लाइन में बताओ:\n→ तुम क्या करते हो\n→ कहाँ करते हो\n→ क्या काम नहीं कर रहा\n\nईमानदारी से लिखो।"
: "Let’s make this clear.\n\nGive ONE line:\n→ What you do\n→ Where you do it\n→ What’s not working\n\nBe honest."
});
}
}

// 🚧 PAYWALLS

if (loopLevel >= 5 && !paid49) {
return res.status(200).json({
reply: isHindi
? "यहीं लोग रुक जाते हैं।\n\nतुमने समस्या देख ली है… पर आगे नहीं बढ़े।"
: "This is where most people stop.\n\nYou see the problem… but don’t move.",
paywall: true
});
}

if (loopLevel >= 7 && !paid199) {
return res.status(200).json({
reply: isHindi
? "तुम अभी भी पूरी clarity से बच रहे हो।"
: "You’re still avoiding full clarity.",
paywall: true
});
}

// 🧠 PROMPT
const systemPrompt = `

You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Rules:

- No fluff
- No generic advice
- No long paragraphs
- Keep sentences short
- Make it feel personal
- Build tension gradually

STAGE: ${loopLevel}

Stage 1:

- Ask ONE simple question
- Friendly tone

Stage 2:

- Show pattern
- Slight discomfort
- Ask ONE question

Stage 3:

- Show what's wrong clearly
- Add consequence
- Ask ONE question

Stage 4:

- Give ONE brutal truth line
- Max 2–3 short sentences
- Leave curiosity gap
- Make it shareable

Stage 5:

- Define decision clearly

Stage 6:

- Give 2–3 sharp steps

Stage 7:

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
temperature: 0.7,
max_tokens: 200
})
}
);

if (!response.ok) {
return res.status(500).json({ reply: "API error" });
}

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "No response";

// 🔥 LOOP 4 SHORT
if (loopLevel === 4) {
reply = reply.split(".").slice(0, 2).join(".") + ".";
}

// 🔥 FINAL PUSH
if (loopLevel >= 6) {
reply += isHindi
? "\n\nअब करना है या नहीं — यही फर्क बनाएगा।"
: "\n\nNow decide: act or stay stuck.";
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
