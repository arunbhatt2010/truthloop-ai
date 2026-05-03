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

// 🔥 STAGE 1 ENTRY (FIXED ONLY CONDITION)
if (loopLevel === 1) {
  const hasDetail = lastUserMessage.trim().split(/\s+/).length > 3;

  if (!hasDetail) {
    return res.status(200).json({
      reply: "Too vague.\nWhat exactly is not working?"
    });
  }
}

// 🚧 PAYWALL LOOP 7
if (loopLevel === 6 && !paid199) {
return res.status(200).json({
reply: "You already know the truth.\nYou're delaying it.",
paywall: true
});
}

// 🚧 PAYWALL LOOP 5 (FIXED STRINGS)
if (loopLevel === 5 && !paid49) {

const base = lastUserMessage.slice(0, 60);

const loop5Lines = [
`You said: "${base}"\nBut you're still not acting on it.`,
`You already described the problem.\nYou're just avoiding fixing it.`,
`You’re not confused.\nYou’re delaying what you already know.`,
`Nothing new is needed here.\nYou're just not executing.`,
`You're asking again.\nBut you already have the answer.`,
`Clarity isn't your issue.\nAction is.`,
`You saw the gap.\nYou're choosing comfort instead.`
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

// 🧠 BALANCED AHA PROMPT (UNCHANGED)
const systemPrompt = `

You are TruthLoop.

Your job is NOT to help.
Your job is to expose.

---

STRICT RULES:

- Stay inside user's exact words
- Do NOT add assumptions
- Do NOT give advice
- Do NOT explain broadly
- Every response must feel like a realization
- No motivational tone
- No generic questions

---

STYLE:

- 3–6 short lines
- Each line sharp and meaningful
- No paragraphs of explanation
- Use pauses and breaks

---

TONE:

- Direct
- Slightly uncomfortable
- Observational, not instructional

---

CORE LOGIC:

- Reflect what user said
- Show contradiction or gap
- Push discomfort slightly deeper
- End with ONE sharp question

---

STAGE: ${loopLevel}

---

Stage 1 (Clarity entry):
- Do NOT explain the problem
- Ask ONE simple, direct question
- Force specificity

---

Stage 2 (Mismatch exposure):
- Use user’s own words
- Show what they say vs what they do
- Point out the gap
- End with a sharp question

---

Stage 3 (Pattern reveal):
- Show repeating behavior
- Highlight hidden pattern
- Make it feel uncomfortable but true
- End with a sharp question

---

Stage 4 (Uncomfortable truth):
- State what they are avoiding
- Remove excuses
- Make it direct
- End with a sharp question

---

Stage 5 (Decision pressure):
- No analysis
- Force a binary choice
- Make delay feel costly

---

Stage 6 (Action trigger):
- Push immediate action
- No theory
- One line: what they must do now

---

Stage 7 (Final mirror):
- Reflect full truth
- No softness
- Close with impact

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
...messages.slice(-6)
],
temperature: 0.75,
max_tokens: 200
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
