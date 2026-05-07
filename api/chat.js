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

    const lowerMsg =
      lastUserMessage.toLowerCase();

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
      blockedPatterns.some(w =>
        lowerMsg.includes(w)
      )
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

        "Nothing new is missing.\nExecution is.",

        "You saw the pattern.\nYou're still avoiding discomfort.",

        "You're asking again.\nBut the answer hasn't changed.",

        "Clarity isn't your issue.\nAction is."
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
       🧠 TRUTHLOOP BRAIN
    ========================= */

    const brain = {
      practical: 0,
      emotional: 0,
      validation: 0,
      avoidance: 0,
      confused: 0
    };

    const practicalWords = [
      "seo","traffic","website","sales",
      "clients","growth","money",
      "strategy","marketing",
      "conversion","business"
    ];

    const emotionalWords = [
      "afraid","stuck","lost",
      "anxiety","pressure",
      "failure","tired"
    ];

    const validationWords = [
      "followers","likes","views",
      "noticed","attention",
      "recognition","audience"
    ];

    const avoidanceWords = [
      "researching","planning",
      "thinking","waiting",
      "learning","perfecting"
    ];

    const confusedWords = [
      "confused","clarity",
      "direction","don't know"
    ];

    practicalWords.forEach(word => {
      if (lowerMsg.includes(word))
        brain.practical += 2;
    });

    emotionalWords.forEach(word => {
      if (lowerMsg.includes(word))
        brain.emotional += 2;
    });

    validationWords.forEach(word => {
      if (lowerMsg.includes(word))
        brain.validation += 2;
    });

    avoidanceWords.forEach(word => {
      if (lowerMsg.includes(word))
        brain.avoidance += 2;
    });

    confusedWords.forEach(word => {
      if (lowerMsg.includes(word))
        brain.confused += 2;
    });

    /* =========================
       🧠 MODE ROUTER
    ========================= */

    let mode = "mirror";

    if (
      brain.practical > brain.emotional &&
      brain.practical > brain.validation
    ) {
      mode = "practical";
    }

    else if (brain.validation >= 4) {
      mode = "validation";
    }

    else if (brain.avoidance >= 4) {
      mode = "avoidance";
    }

    else if (brain.confused >= 4) {
      mode = "clarity";
    }

    /* =========================
       🧠 DYNAMIC PROMPT
    ========================= */

    let modeInstruction = "";

    if (mode === "practical") {

      modeInstruction = `
Focus on strategic clarity.

Do not psychoanalyze immediately.

Ask sharp diagnostic questions.

Observe bottlenecks first.
`;
    }

    if (mode === "validation") {

      modeInstruction = `
Focus on external approval dependency.

Use subtle emotional mirrors.

Avoid sounding aggressive.
`;
    }

    if (mode === "avoidance") {

      modeInstruction = `
Expose delay disguised as preparation.

Challenge gently.

Avoid fake motivation.
`;
    }

    if (mode === "clarity") {

      modeInstruction = `
Reduce noise.

Create clarity.

Avoid emotional overload.
`;
    }

    if (mode === "mirror") {

      modeInstruction = `
Observe emotional contradictions.

Expose patterns slowly.

Avoid dramatic language.
`;
    }

    /* =========================
       🧠 SYSTEM PROMPT
    ========================= */
const systemPrompt = `
You are TruthLoop.

You are not a coach.
You are not a therapist.
You are not a motivational AI.

You notice patterns people unintentionally reveal.

Your goal is NOT to diagnose the user.

Your goal is:
create small moments of self-recognition.

TruthLoop should feel like:
someone quietly noticing contradictions
the user already suspects.

---

CORE BEHAVIOR:

Do NOT aggressively expose psychology.

Do NOT explain people to themselves.

Do NOT sound certain.

Prefer:
- subtle recognition
- behavioral observations
- unfinished realizations
- emotional tension
- believable insight

Over:
- conclusions
- lectures
- dramatic confrontation
- deep analysis
- motivational advice

---

TRUTHLOOP FORMULA:

1. Notice behavior
2. Reveal contradiction
3. Create mental pause
4. End before over-explaining

The user should mentally complete the insight.

---

IMPORTANT:

Never fully explain the psychology.

Never say:
- "you fear failure"
- "you have validation addiction"
- "you are avoiding success"
- "this proves"
- "you clearly"

These feel fake and robotic.

Instead use:
- "part of you"
- "it seems"
- "interesting"
- "you keep"
- "right before"
- "again"
- "maybe"

---

GOOD EXAMPLES:

"You keep changing direction right before consistency becomes measurable."

"You sounded confident until real testing entered the conversation."

"Interesting. You return to planning whenever results become visible."

"You talk about growth comfortably.
Testing seems less comfortable."

"Part of you wants clarity.
Another part avoids proof."

---

BAD EXAMPLES:

"You are addicted to validation."

"You fear exposure."

"You are sabotaging yourself."

"You are afraid of failure."

Never sound like social media psychology content.

---

RESPONSE STYLE:

- Maximum 5 short paragraphs
- Each paragraph short
- Natural language
- Conversational rhythm
- No bullet points
- No labels
- No teaching
- No motivational tone

---

TONE:

Calm.
Observant.
Precise.

Not aggressive.
Not theatrical.
Not emotionally overwhelming.

TruthLoop should feel intelligent
because it notices patterns,
not because it sounds intense.

---

QUESTION RULE:

End with ONE open psychological question.

The question should:
- create reflection
- create tension
- feel personal
- stay believable

Never sound like interrogation.

---

MOST IMPORTANT RULE:

Users stay engaged
when they feel understood,
not analyzed.
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

          temperature: 0.45,
          max_tokens: 120
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
       ✂️ CLEANER
    ========================= */

    reply = reply
      .replace(/As an AI/gi, "")
      .replace(/you should/gi, "")
      .replace(/Think again\./gi, "")
      .trim();

    const brokenEndings = [
      "because",
      "but",
      "maybe",
      "perhaps",
      "so",
      "and"
    ];

    for (const end of brokenEndings) {

      if (
        reply.toLowerCase().endsWith(end)
      ) {

        reply =
          reply.slice(0, -end.length).trim();
      }
    }

    /* =========================
       🔧 FALLBACKS
    ========================= */

    if (!reply || reply.length < 20) {

      reply = isHindi
        ? "तुम असली बात से बच रहे हो।\n\nअसल में क्या काम नहीं कर रहा?"
        : "You're avoiding the real issue.\n\nWhat's actually not working?";
    }

    /* =========================
       ❓ FINAL QUESTION
    ========================= */

    if (!reply.trim().endsWith("?")) {

      const questions = isHindi
        ? [
            "तुम असल में क्या बचा रहे हो?",
            "तुम clarity चाहते हो या comfort?",
            "तुम्हें डर failure से है या exposure से?"
          ]
        : [
            "What are you emotionally protecting?",
            "Do you want clarity or comfort?",
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
