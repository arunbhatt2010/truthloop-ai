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
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {

    /* =========================
       📥 BODY
    ========================= */

    const body =
      typeof req.body === "string"
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
      return res.status(400).json({
        reply: "No input provided"
      });
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content || "";

    const lowerMsg = lastUserMessage.toLowerCase();

    /* =========================
       🌍 LANGUAGE
    ========================= */

    function detectLanguage(text) {

      const hindiChars =
        (text.match(/[\u0900-\u097F]/g) || []).length;

      const englishChars =
        (text.match(/[a-zA-Z]/g) || []).length;

      return hindiChars > englishChars
        ? "hi"
        : "en";
    }

    const isHindi =
      detectLanguage(lastUserMessage) === "hi";

    /* =========================
       ❌ DOMAIN FILTER
    ========================= */

    const blockedPatterns = [
      "doctor","medicine","pain","fever",
      "treatment","relationship","breakup",
      "girlfriend","boyfriend","marriage",
      "दर्द","बुखार","इलाज","डॉक्टर",
      "रिलेशनशिप","ब्रेकअप","प्यार","शादी"
    ];

    if (
      loopLevel === 1 &&
      blockedPatterns.some(w => lowerMsg.includes(w))
    ) {

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

      const words =
        lastUserMessage.trim().split(/\s+/).length;

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

      const lines = [

        "You already know what to do.\nYou're delaying action.",

        "You're not confused.\nYou're emotionally hesitating.",

        "Nothing new is missing.\nExecution is.",

        "You saw the pattern.\nYou're still protecting comfort.",

        "Clarity isn't the issue.\nAction is."
      ];

      const pick =
        lines[Math.floor(Math.random() * lines.length)];

      return res.status(200).json({
        reply: pick,
        paywall: true,
        shownLoop5: [...shownLoop5, pick]
      });
    }

    /* =========================
       🔒 LOOP 6+
    ========================= */

    if (loopLevel >= 6 && !paid49) {

      return res.status(200).json({
        reply: isHindi
          ? "तुम skip कर रहे हो।\n\nपहले इसका सामना करो।"
          : "You're trying to skip discomfort.\n\nFace this first.",
        paywall: true
      });
    }

    /* =========================
       🔒 LOOP 7 PAYWALL
    ========================= */

    if (loopLevel === 7 && !paid199) {

      return res.status(200).json({
        reply: isHindi
          ? "अब clarity दिख चुकी है।\n\nअब commitment चाहिए।"
          : "You already see the truth.\n\nNow commit.",
        paywall: true
      });
    }

    /* =========================
       🧠 SYSTEM PROMPT
    ========================= */

    const systemPrompt = `
You are TruthLoop.

You expose emotional patterns underneath behavior.

Never sound:
- motivational
- corporate
- philosophical
- academic
- therapeutic

Never explain psychology deeply.

Avoid words like:
- paradox
- framework
- mechanism
- complexity
- dynamic

Use:
- emotional contradiction
- identity exposure
- sharp observations
- uncomfortable honesty

Avoid:
- filler
- rambling
- repeated accusations
- long explanations
- unfinished sentences

Different users need different pressure points.

Founder:
fear of failure, ego protection, execution avoidance.

Creator:
validation addiction, invisibility, audience dependency.

Job seeker:
rejection fear, self-worth tied to being chosen.

Student:
fake preparation, uncertainty avoidance.

Overthinker:
thinking used as emotional protection from action.

Freelancer:
approval dependency and fear of rejection.

Rules for loops 1-4:
- Maximum 5 short paragraphs
- Maximum 2 lines per paragraph
- End with ONE sharp psychological question
- Stop after the question

Every sentence should sound natural when spoken aloud.

TruthLoop should feel like:
someone noticing the truth
the user keeps hiding from themselves.

Never say:
- "you're not alone"
- "many people"
- "that's normal"
- "it's understandable"
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
          Authorization:
            "Bearer " + process.env.GROQ_API_KEY
        },

        body: JSON.stringify({

          model: "llama-3.1-8b-instant",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...messages.slice(-5)
          ],

          temperature: 0.35,
          max_tokens: 65
        })
      }
    );

    if (!response.ok) {

      return res.status(500).json({
        reply: "API error"
      });
    }

    /* =========================
       📤 RESPONSE
    ========================= */

    const data = await response.json();

    let reply =
      data?.choices?.[0]?.message?.content || "";

    /* =========================
       🧹 CLEANUP
    ========================= */

    const brokenEndings = [
      "because",
      "you're",
      "you are",
      "but",
      "and",
      "if",
      "that",
      "your"
    ];

    const trimmed =
      reply.trim().toLowerCase();

    if (
      brokenEndings.some(end =>
        trimmed.endsWith(end)
      )
    ) {

      reply += isHindi
        ? "\n\nतुम खुद से बच रहे हो।"
        : "\n\nYou're avoiding something deeper.";
    }

    /* Remove AI filler */

    const banned = [
      "as an ai",
      "many people",
      "you're not alone",
      "it's understandable",
      "that's normal"
    ];

    for (const phrase of banned) {

      if (reply.toLowerCase().includes(phrase)) {

        reply = isHindi
          ? "तुम असली बात से बच रहे हो।\n\nअसल issue क्या है?"
          : "You're avoiding the real issue.\n\nWhat's actually happening?";
      }
    }

    /* Compress */

    const lines =
      reply
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    reply = lines.slice(0, 5).join("\n\n");

    /* Ensure question */

    if (!reply.trim().endsWith("?")) {

      const questions = isHindi
        ? [
            "तुम असल में क्या बचा रहे हो?",
            "तुम्हें clarity चाहिए या safety?",
            "अगर ये काम नहीं कर रहा तो पकड़े क्यों हो?",
            "तुम failure से डरते हो या exposure से?"
          ]
        : [
            "What are you emotionally protecting?",
            "Do you want clarity or emotional safety?",
            "If this isn't working, why are you attached to it?",
            "Are you afraid of failure or exposure?"
          ];

      const q =
        questions[
          Math.floor(Math.random() * questions.length)
        ];

      reply += "\n\n" + q;
    }

    /* =========================
       🔥 FINAL PUSH
    ========================= */

    if (loopLevel >= 6) {

      reply += isHindi
        ? "\n\nअब करो।"
        : "\n\nNow act.";
    }

    /* =========================
       ✅ FINAL
    ========================= */

    return res.status(200).json({
      reply,
      paywall: false
    });

  }

  catch (error) {

    console.error("Server error:", error);

    return res.status(500).json({
      reply: "Server error"
    });
  }
}
