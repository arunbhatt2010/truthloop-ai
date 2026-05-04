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
      ? "यह decision problem नहीं है।\n\nऐसा सवाल पूछो जहाँ फैसला लेना हो।"
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

const urgency = isHindi
? `आपने खुद देखा है।

समस्या नहीं।
pattern।

पहले भी यही किया।
अब भी वही कर रहे हो।

Same effort.
Same loop.
Same result.

कुछ नहीं बदलेगा।`
: `You saw it.

Not the problem.
The pattern.

You've seen this before.

Same effort.
Same loop.
Same result.

Nothing changes.`;

return res.status(200).json({
  reply: pick + "\n\n" + urgency,
  paywall: true,
  shownLoop5: [...shownLoop5, pick]
});
}

/* 🔒 LOOP 7 PAYWALL */
if (loopLevel === 6 && !paid199) {
  return res.status(200).json({
    reply: isHindi
      ? "तुम्हें सच पता है.\n\nतुम बस action टाल रहे हो।"
      : "You already see it.\n\nYou're avoiding action.",
    paywall: true
  });
}

/* 💣 LOOP 4 (FIXED — NO BREAK) */
if (loopLevel === 4) {

let reply;

if(isHindi){
  reply = `तुम रोज़ कर रहे हो।

लेकिन कुछ बदल नहीं रहा।

तो समस्या consistency नहीं है।
direction है।

तुम वही क्यों दोहरा रहे हो जो काम नहीं कर रहा?`;
} else {
  reply = `You're showing up daily.

But nothing is changing.

So it's not consistency.
It's direction.

Why are you repeating what isn't working?`;
}

return res.status(200).json({
  reply,
  paywall: false
});
}

/* 🧠 SYSTEM PROMPT */
const systemPrompt = `

You are TruthLoop.

You do NOT help.
You expose.

LANGUAGE RULE:
- Hindi → Hindi only
- English → English only
- Never mix

STRUCTURE:
1. Repeat situation
2. Show contradiction
3. Expose pattern
4. Reveal real issue
5. Ask uncomfortable question

RULES:
- No advice
- No suggestions
- No fluff
- Short lines
- Direct tone

STAGE: ${loopLevel}
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
temperature: 0.6,
max_tokens: 160
})
}
);

if (!response.ok) {
  return res.status(500).json({ reply: "API error" });
}

const data = await response.json();
let reply = data?.choices?.[0]?.message?.content || "";

/* 🔥 FALLBACK */
if (!reply || reply.length < 20) {
  reply = isHindi
    ? "आप घुमा रहे हैं.\n\nअसल में क्या काम नहीं कर रहा?"
    : "You're avoiding something.\n\nWhat exactly is not working?";
}

/* 🔥 GENERIC FIX */
if (reply.toLowerCase().includes("you should")) {
  reply = isHindi
    ? "आप general बात कर रहे हैं.\n\nअसल में issue क्या है?"
    : "You're being generic.\n\nWhat's actually the issue?";
}

/* 🔥 CLEAN */
if (reply.toLowerCase().includes("as an ai")) {
  reply = isHindi
    ? "सीधे बोलो.\n\nक्या काम नहीं कर रहा?"
    : "Stay direct.\n\nWhat's not working?";
}

/* 🔥 FINAL PUSH */
if (loopLevel >= 6) {
  reply += isHindi ? "\n\nअब करो।" : "\n\nNow act.";
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
