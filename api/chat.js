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
      paid199 = false
    } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase();

    const userKnown = messages.length > 1;
    const userContext = messages[1]?.content || "";

    /* =========================
       🌐 LANGUAGE
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

      const base = lastUserMessage.slice(0, 50).replace(/\n/g, " ");

      const hooks = [
        `You said: "${base}"\nBut nothing changed.`,
        `You said: "${base}"\nStill same pattern.`,
        `You said: "${base}"\nSo why repeat it?`,
        `You said: "${base}"\nYou already saw this.`
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
       🔒 LOOP 7
    ========================= */
    if (loopLevel === 7 && !paid199) {
      return res.status(200).json({
        reply: isHindi ? "अब commit करो।" : "Now commit.",
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

OUTPUT:
- 7 to 9 lines
- Each line under 18 words
- Each line deeper than previous

FLOW:
1. Mirror user's exact situation
2. Break belief
3. Show pattern
4. Expose avoidance
5. Apply pressure
6. Give 1 uncomfortable action
7. End with sharp question

RULES:
- Use only user input (no assumptions)
- Do not repeat questions
- Do not generalize
- No teaching, no advice
- No tools or strategy suggestions

ACTION:
- Must reveal truth, not fix it
- Small, real, uncomfortable

STYLE:
- Direct
- Personal
- Use "you"

END:
- Last line must be a question

If weak → go deeper
If generic → rewrite
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
          temperature: 0.7,
          max_tokens: 180
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

    if (!reply || reply.length < 20) {
      reply = isHindi
        ? "सीधे बोलो — क्या काम नहीं कर रहा?"
        : "Be direct — what's not working?";
    }

    // safe formatting (no breaking short replies)
    if (reply.length > 120 && !reply.includes("\n")) {
      reply = reply.replace(/\. /g, "\n");
    }

    // ensure ending question
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
