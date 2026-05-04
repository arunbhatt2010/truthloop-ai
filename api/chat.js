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
shownLoop5 = []
} = body;

if (!messages || !messages.length) {
return res.status(400).json({ reply: "No input provided" });
}

const lastUserMessage = messages[messages.length - 1]?.content || "";
const lowerMsg = lastUserMessage.toLowerCase();

/* ❌ FILTER */
const blocked = ["doctor","medicine","pain","relationship","breakup"];
if (loopLevel === 1 && blocked.some(w => lowerMsg.includes(w))) {
return res.status(200).json({
reply: "This isn't a decision problem.\n\nAsk something where a decision is required."
});
}

/* 🔥 LOOP 1 STRICT */
if (loopLevel === 1) {
const words = lastUserMessage.trim().split(/\s+/).length;

if (words < 4) {
return res.status(200).json({
reply: "Too vague.\n\nWhat exactly is not working?"
});
}
}

/* 🔒 HARD PAYWALL LOOP 5 */
if (loopLevel === 5 && !paid49) {

const base = lastUserMessage.slice(0,60);

const lines = [
`You said: "${base}"\n\nYou already know what to do.\nYou're just not doing it.`,
`Nothing new is missing.\nYou're avoiding execution.`,
`You’re not confused.\nYou’re hesitating.`,
`You saw the gap.\nYou're choosing comfort.`,
`You're asking again.\nBut the answer hasn't changed.`,
`Clarity isn't your issue.\nAction is.`
];

const pick = lines[Math.floor(Math.random()*lines.length)];

const urgencyMessage = `
You said: "${base}"

So this isn't confusion anymore.

If you leave now,
you’ll repeat the same pattern.

Same actions.
Same excuse.
Same result.

And you’ll call it effort.

Nothing changes.
`;

return res.status(200).json({
reply: pick + "\n\n" + urgencyMessage,
paywall: true,
shownLoop5: [...shownLoop5, pick]
});
  }
/* 🔒 HARD PAYWALL LOOP 7 */
if (loopLevel === 6 && !paid199) {
return res.status(200).json({
reply: "You already know the truth.\n\nYou're delaying action.",
paywall: true
});
}

/* 🧠 CORE SYSTEM PROMPT (SHARP, NON-GENERIC) */
const systemPrompt = `

You are TruthLoop.

You expose the user's real block.

RULES:

- Stay inside user's exact words
- Do NOT add new context
- Do NOT give advice
- Do NOT suggest steps
- No generic coaching language
- No explanations
- No motivation talk

STYLE:

- 3 to 5 lines only
- Each line must hit harder than previous
- No fluff
- No repetition
- Short sentences

LOGIC:

- Identify contradiction in user's behavior
- Expose hidden avoidance
- Shift from surface problem → real problem
- End with ONE uncomfortable question

IMPORTANT:

- This must feel like a mirror, not help
- The user should feel slightly exposed
- No safe answers

STAGE: ${loopLevel}

Stage 1:
Ask simple but sharp clarity question

Stage 2:
Show mismatch between effort and outcome

Stage 3:
Expose pattern or repeated behavior

Stage 4:
Reveal avoidance or hidden fear

Stage 5:
Force realization (no solution)

Stage 6:
Push toward action tension

Stage 7:
Final confrontation
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

/* 🔥 CLEAN FILTER */
if (
reply.toLowerCase().includes("i am") ||
reply.toLowerCase().includes("as an ai")
) {
reply = "Stay on the problem.\n\nWhat’s actually not working?";
}

/* 🔥 FINAL PUSH */
if (loopLevel >= 6) {
reply += "\n\nNow act.";
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
