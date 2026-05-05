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

    const userKnown = messages.length > 1;
    const userContext = messages[1]?.content || "";

    /* =========================
       🌐 LANGUAGE DETECT
    ========================= */
    function detectLanguage(text) {
      const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
      const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
      return hindiChars > englishChars ? "hi" : "en";
    }

    const isHindi = detectLanguage(lastUserMessage) === "hi";

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
          ? "यह decision problem नहीं है.\n\nऐसा सवाल पूछो जहाँ फैसला लेना हो।"
          : "This isn't a decision problem.\n\nAsk something where a decision is required."
      });
    }

    /* =========================
       🔥 LOOP 1
    ========================= */
    if (loopLevel === 1) {

      if (!userKnown) {
        return res.status(200).json({
          reply: isHindi
            ? "पहले ये साफ करो — तुम करते क्या हो?\n\nऔर अभी क्या काम नहीं कर रहा?"
            : "Before we go deeper — what do you actually do?\n\nWhat is not working right now?"
        });
      }

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

  const base = lastUserMessage.slice(0, 40).replace(/\n/g, " ");

  const hooks = [
    `You said: "${base}"\nAnd still nothing changed.`,
    `You said: "${base}"\nBut you're repeating the same pattern.`,
    `You said: "${base}"\nYou already saw this before.`,
    `You said: "${base}"\nSo why are you still stuck?`
  ];

  const pick = hooks[Math.floor(Math.random() * hooks.length)];

  return res.status(200).json({
    reply:
`${pick}

Same effort.
Same loop.
Same result.

Pay to continue.`,
    
    paywall: true
  });
    }

    /* =========================
       🔒 LOOP 6+
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
          ? "अब commit करो।"
          : "Now commit.",
        paywall: true
      });
    }

    /* =========================
       🧠 SYSTEM PROMPT
    ========================= */
    const systemPrompt = `
You are TruthLoop.

USER CONTEXT:
${userContext}

You expose, not guide.
FLOW RULE:

- Do NOT ask multiple questions
- Only ONE question at the end
- Before question:
  → expose pattern
  → give 1 uncomfortable action

If response is only questions → invalid
OUTPUT:
- 5 lines only
- Each line under 15 words
- No fluff

CORE:
- Use only user's words
- No assumptions
- Go deeper each line
- No repetition
If response feels safe → rewrite harsher
If response feels like coaching → reject
ACTION:
- One uncomfortable action
- Doable today
- Every response must include ONE action
- If no action → response invalid
- Action must come BEFORE the question
LINK:
- No verify
- No assume
- Focus on gap

STYLE:
- Direct
- Personal
- Use "you"

END:
- Last line must be a question

If weak → go sharper
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
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-6)
          ],
          temperature: 0.6,
          max_tokens: 100
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    /* =========================
       📤 RESPONSE
    ========================= */
    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "";

    if (!reply || reply.length < 10) {
      reply = isHindi
        ? "सीधे बोलो — क्या काम नहीं कर रहा?"
        : "Be direct — what's not working?";
    }

    if (!reply.includes("\n")) {
      reply = reply.replace(/\. /g, "\n");
    }

    if (!reply.trim().endsWith("?")) {
      reply += isHindi
        ? "\n\nतुम किस बात से बच रहे हो?"
        : "\n\nWhat are you avoiding?";
    }

    /* =========================
       ✅ FINAL
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
