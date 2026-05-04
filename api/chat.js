export default async function handler(req, res) {

res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") return res.status(200).end();
if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

try {

/* 🔥 BODY SAFE PARSE */
let body;
try{
body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}catch{
return res.status(200).json({ reply:"Invalid request" });
}

const {
messages,
loopLevel = 1,
paid49 = false,
paid199 = false
} = body;

if (!messages || !messages.length) {
return res.status(200).json({ reply: "No input provided" });
}

const lastUserMessage = messages[messages.length - 1]?.content || "";
const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

/* 🔥 CRASH GUARD */
if(!process.env.GROQ_API_KEY){
return res.status(200).json({
reply:"Server not configured properly."
});
}

/* 🔒 LOOP 5 PAYWALL (STABLE) */
if (loopLevel === 5 && !paid49) {

const base = lastUserMessage.slice(0,60);

const lines = [
"You said: "${base}"\n\nYou already know what to do.\nYou're just not doing it.",
"Nothing new is missing.\nYou're avoiding execution.",
"You’re not confused.\nYou’re hesitating.",
"You saw the gap.\nYou're choosing comfort.",
"You're asking again.\nBut the answer hasn't changed.",
"Clarity isn't your issue.\nAction is."
];

const pick = lines[Math.floor(Math.random()*lines.length)];

const urgency = isHindi
? `तुमने देख लिया है।

समस्या नहीं।
pattern।

Same effort.
Same loop.
Same result.

कुछ नहीं बदलेगा।":"You saw it.

Not the problem.
The pattern.

Same effort.
Same loop.
Same result.

Nothing changes.`;

return res.status(200).json({
reply: pick + "\n\n" + urgency,
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
? "अब commit करो।"
: "Now commit.",
paywall: true
});
}

/* 🔥 AHA MODE PROMPT */
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

FLOW:
Line 1 → Mirror user
Line 2 → Contradiction
Line 3 → Pattern
Line 4 → Real problem
Line 5 → ONE uncomfortable question

RULES:

- No advice
- No suggestions
- No explanation
- No generic lines
- Use user's exact context

STAGE: ${loopLevel}
`;

/* 🔥 AI CALL SAFE */
let data;
try{
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
max_tokens: 220
})
});

data = await response.json();

}catch(e){
return res.status(200).json({
reply:"System stuck.\n\nTry again."
});
}

let reply = data?.choices?.[0]?.message?.content || "";

/* 🔥 FORCE RESPONSE */
if(!reply || reply.length < 20){
reply = isHindi
? "तुम avoid कर रहे हो।\n\nअसल में क्या नहीं कर रहे?"
: "You're avoiding something.\n\nWhat are you not doing?";
}

if(!reply.includes("?")){
reply += isHindi
? "\n\nअब बताओ — तुम क्या avoid कर रहे हो?"
: "\n\nSo tell me — what are you avoiding?";
}

return res.status(200).json({
reply,
paywall: false
});

} catch (error) {

console.error("SERVER ERROR:",error);

return res.status(200).json({
reply:"Temporary issue.\n\nTry again."
});
}

}
