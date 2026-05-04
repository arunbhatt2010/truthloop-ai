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
const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);
/* ❌ STRONG DOMAIN FILTER (EN + HINDI + INTENT) */
const blockedPatterns = [
"doctor","medicine","pain","fever","treatment",
"relationship","breakup","girlfriend","boyfriend","marriage",
"दर्द","बुखार","इलाज","डॉक्टर",
"रिलेशनशिप","ब्रेकअप","प्यार","शादी"
];

const isBlocked = blockedPatterns.some(w => lowerMsg.includes(w));

if (loopLevel === 1 && isBlocked) {
return res.status(200).json({
reply: "This isn't a decision problem.\n\nAsk something where you're stuck making a decision."
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

You saw it.

Not the problem.
The pattern.

You've seen this before.

You didn't act then.
You're not acting now.

Same effort.
Same loop.
Same result.

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
reply: "You already see it.\n\nYou're just avoiding action.",
paywall: true
});
}

/* 🧠 CONTEXT COMPRESSION (🔥 IMPORTANT) */
const contextSummary = messages
.slice(-6)
.map(m => `${m.role}: ${m.content}`)
.join("\n");
/* 💣 NUCLEAR LOOP 4 */
if (loopLevel === 4) {

const base = lastUserMessage.slice(0,80);

const nuclearLines = [

`You said: "${base}"

You're doing something.

But you're not checking if it works.

So you're not building anything.
You're just repeating.

Is this progress or just movement?`,

`You think you're trying.

But you're doing what feels productive.

Not what produces results.

So you stay busy.

Is that effort… or avoidance?`,

`You're showing up every day.

But nothing is changing.

So it's not consistency.

It's direction.

Why are you repeating something that isn't working?`,

`You believe you're doing the right things.

But you haven't questioned them.

So you're protecting your process.

Not your result.

What are you avoiding admitting?`,

`You're working.

You're posting.

You're active.

But you're not moving forward.

So what's real here?

Growth… or comfort disguised as effort?`
];

let pick = nuclearLines[Math.floor(Math.random()*nuclearLines.length)];

if(isHindi){
  pick = "आप काम कर रहे हैं.\n\nपर परिणाम नहीं आ रहा.\n\nतो समस्या मेहनत नहीं है.\nदिशा है.\n\nआप वही दोहरा क्यों रहे हैं जो काम नहीं कर रहा?";
}
}
/* 🧠 CORE SYSTEM PROMPT (NOW CONTEXT-AWARE) */
const systemPrompt = `

You are TruthLoop.

You do NOT help.
You expose.

You ONLY use user's words.
LANGUAGE RULE:

- If user writes in Hindi → respond ONLY in Hindi
- If user writes in English → respond ONLY in English
- NEVER mix languages
---

STRUCTURE (MANDATORY):

Line 1: Repeat user's situation in sharper words  
Line 2: Show contradiction  
Line 3: Expose hidden pattern  
Line 4: Shift to real problem  
Line 5: ONE uncomfortable question

---

RULES:

- No advice
- No suggestions
- No general statements
- No explanations
- Every line must connect to user input
- Short sentences only

---

TONE:

- Direct
- Slightly uncomfortable
- Personal

---

STAGE: ${loopLevel}

Stage 1:
- Ask sharp clarity question

Stage 2:
- Show effort vs result gap

Stage 3:
- Expose repetition pattern

Stage 4:
- Reveal avoidance

Stage 5:
- Force realization (no solution)

Stage 6:
- Create tension (action vs delay)

Stage 7:
- Final confrontation

---

EXAMPLE STYLE:

"You say you're posting daily.

But nothing is changing.

So it's not effort.
It's direction.

Are you building or just repeating?"
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
temperature: 0.65,
max_tokens: 180
})
}
);

if (!response.ok) {
return res.status(500).json({ reply: "API error" });
}

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "";
// 🔥 FORCE LANGUAGE CONSISTENCY
if (isHindi) {
  // अगर English leak हो रहा है तो basic fallback
  if (!/[\u0900-\u097F]/.test(reply)) {
    reply = "आप बात घुमा रहे हैं.\n\nअसल में क्या काम नहीं कर रहा?";
  }
}
/* 🔥 EMPTY / GENERIC RESPONSE FIX */
if (!reply || reply.length < 20) {
reply = "You're avoiding something.\n\nWhat are you not facing directly?";
}

/* 🔥 GENERIC DETECTOR (IMPORTANT) */
const genericSignals = [
"it depends","you should","try to","consider","improve","focus on"
];

if (genericSignals.some(w => reply.toLowerCase().includes(w))) {
reply = "You're slipping into general thinking.\n\nWhat exactly are you avoiding here?";
}

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
