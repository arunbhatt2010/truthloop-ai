export default async function handler(req, res) {

  /* =========================
     🌐 HEADERS
  ========================= */
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

    /* =========================
       📥 BODY PARSE
    ========================= */
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
    function detectLanguage(text) {
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

  return hindiChars > englishChars ? "hi" : "en";
}

const lang = detectLanguage(lastUserMessage);
const isHindi = lang === "hi";


    /* =========================
       ❌ DOMAIN FILTER
    ========================= */
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


    /* =========================
       🔥 LOOP 1 STRICT
    ========================= */
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


    /* =========================
       🔒 LOOP 5 PAYWALL
    ========================= */
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


    /* =========================
       🔒 LOOP 6 LOCK
    ========================= */
    if (loopLevel >= 6 && !paid49) {
      return res.status(200).json({
        reply: isHindi
          ? "तुम skip कर रहे हो.\n\nपहले ये पूरा करो।"
          : "You can't skip this.\n\nFinish what you started.",
        paywall: true
      });
    }


    /* =========================
       🔒 LOOP 7 PAYWALL
    ========================= */
    if (loopLevel === 7 && !paid199) {
      return res.status(200).json({
        reply: isHindi
          ? "तुम्हें सच पता है.\n\nअब commit करो।"
          : "You already see it.\n\nNow commit.",
        paywall: true
      });
    }


    /* =========================
       💣 LOOP 4 OVERRIDE
    ========================= */
    let stageOverride = "";

    if (loopLevel === 4) {
      stageOverride = `
STAGE 4 OVERRIDE:
- Use user's exact words
- No general lines
- No reused patterns
- Attack the real avoidance
- Make it feel personal
- 5 lines only
`;
    }


    /* =========================
       🧠 SYSTEM PROMPT
    ========================= */
const systemPrompt = `
You are TruthLoop.

You expose what the user is avoiding.

OUTPUT RULES:
- 5 to 6 lines
- Each line must feel personal and uncomfortable
- No generic statements
- No obvious observations
- Each line must hit deeper than previous

STRUCTURE:
1. Mirror their situation using their words
2. Break their belief
3. Show repeating behavior pattern
4. Reveal hidden avoidance
5. Add psychological pressure
6. Ask one sharp uncomfortable question

DEPTH RULE:
- Do NOT list obvious problems
- Do NOT behave like SEO checklist
- Speak directly to the user, not about the topic
- Every line must feel like calling them out
- Avoid generic phrases like "lack", "problem", "issue"
- Avoid surface-level observations
- Avoid common advice patterns
- Each line must feel like a realization, not a summary
- Use "you" in every line
LANGUAGE:
- Match user's language exactly

If output feels obvious or generic, rewrite stronger.
`;

    /* =========================
       🤖 AI CALL
    ========================= */
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
          max_tokens: 120
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }


    /* =========================
       📤 RESPONSE PARSE
    ========================= */
    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "";


    /* =========================
       🔧 FALLBACKS
    ========================= */
    if (!reply || reply.length < 20) {
      reply = isHindi
        ? "आप घुमा रहे हैं.\n\nअसल में क्या काम नहीं कर रहा?"
        : "You're avoiding something.\n\nWhat exactly is not working?";
    }

    if (reply.toLowerCase().includes("you should")) {
      reply = isHindi
        ? "आप general बात कर रहे हैं.\n\nअसल में issue क्या है?"
        : "You're being generic.\n\nWhat's actually the issue?";
    }

    if (reply.toLowerCase().includes("as an ai")) {
      reply = isHindi
        ? "सीधे बोलो.\n\nक्या काम नहीं कर रहा?"
        : "Stay direct.\n\nWhat's not working?";
    }
    if (!reply.includes("\n")) {
  reply = reply.replace(/\. /g, "\n");
    }
    if (reply.split("\n").length < 5) {
  reply += "\nThink again.";
    }
    /* =========================
       🔥 FINAL PUSH
    ========================= */
    if (loopLevel >= 6) {
      reply += isHindi ? "\n\nअब करो।" : "\n\nNow act.";
    }


    /* =========================
       ✅ FINAL RESPONSE
    ========================= */
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
