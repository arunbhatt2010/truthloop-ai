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
       ❌ DOMAIN FILTER
    ========================= */

    const blockedPatterns = [
      "doctor",
      "medicine",
      "pain",
      "fever",
      "treatment",
      "relationship",
      "breakup",
      "girlfriend",
      "boyfriend",
      "marriage",
      "suicide",
      "kill myself",
      "therapy"
    ];

    if (
      loopLevel === 1 &&
      blockedPatterns.some(word =>
        lowerMsg.includes(word)
      )
    ) {

      return res.status(200).json({
        reply:
`This doesn't look like a decision problem.

Ask something involving avoidance, contradiction, hesitation, or a difficult decision.`
      });
    }

    /* =========================
       🔥 LOOP 1 STRICT
    ========================= */

    if (loopLevel === 1) {

      const words =
        lastUserMessage
          .trim()
          .split(/\s+/).length;

      if (words < 4) {

        return res.status(200).json({
          reply:
`Too vague.

What exactly keeps repeating?`
        });
      }
    }

    /* =========================
       🔒 LOOP 5 PAYWALL
    ========================= */

    if (loopLevel === 5 && !paid49) {

      const lines = [

        `You already know what to do.

You're delaying action.`,

        `Nothing new is missing.

Execution is.`,

        `The pattern is visible now.

You're still protecting comfort.`,

        `You keep returning to analysis
right before exposure becomes real.`,

        `Clarity stopped being the problem
a while ago.`
      ];

      const pick =
        lines[
          Math.floor(
            Math.random() * lines.length
          )
        ];

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
        reply:
`You're trying to skip discomfort.

Face this first.`,
        paywall: true
      });
    }

    /* =========================
       🔒 LOOP 7 PAYWALL
    ========================= */

    if (loopLevel === 7 && !paid199) {

      return res.status(200).json({
        reply:
`You already see the pattern.

Now commit.`,
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
      "seo",
      "traffic",
      "website",
      "sales",
      "clients",
      "growth",
      "money",
      "strategy",
      "marketing",
      "conversion",
      "business",
      "linkedin",
      "audience",
      "startup",
      "brand"
    ];

    const emotionalWords = [
      "afraid",
      "stuck",
      "lost",
      "anxiety",
      "pressure",
      "failure",
      "tired",
      "fear",
      "overwhelmed"
    ];

    const validationWords = [
      "followers",
      "likes",
      "views",
      "noticed",
      "attention",
      "recognition",
      "audience",
      "approval"
    ];

    const avoidanceWords = [
      "researching",
      "planning",
      "thinking",
      "waiting",
      "learning",
      "perfecting",
      "postpone",
      "delay",
      "optimize",
      "preparing"
    ];

    const confusedWords = [
      "confused",
      "clarity",
      "direction",
      "don't know",
      "unsure"
    ];

    practicalWords.forEach(word => {
      if (lowerMsg.includes(word)) {
        brain.practical += 2;
      }
    });

    emotionalWords.forEach(word => {
      if (lowerMsg.includes(word)) {
        brain.emotional += 2;
      }
    });

    validationWords.forEach(word => {
      if (lowerMsg.includes(word)) {
        brain.validation += 2;
      }
    });

    avoidanceWords.forEach(word => {
      if (lowerMsg.includes(word)) {
        brain.avoidance += 2;
      }
    });

    confusedWords.forEach(word => {
      if (lowerMsg.includes(word)) {
        brain.confused += 2;
      }
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
       🧠 MODE INSTRUCTION
    ========================= */

    let modeInstruction = "";

    if (mode === "practical") {

      modeInstruction = `
Focus on strategic contradictions.

Observe behavior before emotion.

Notice where optimization replaces exposure.
`;
    }

    if (mode === "validation") {

      modeInstruction = `
Focus on approval dependency.

Notice visibility patterns.

Use subtle emotional tension.
`;
    }

    if (mode === "avoidance") {

      modeInstruction = `
Notice delay disguised as preparation.

Stay calm and precise.

Avoid dramatic language.
`;
    }

    if (mode === "clarity") {

      modeInstruction = `
Reduce noise.

Create mental pause.

Notice indecision patterns.
`;
    }

    if (mode === "mirror") {

      modeInstruction = `
Notice contradictions slowly.

Avoid dramatic psychology.

Stay believable.
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

${modeInstruction}

Your goal:
create small moments of self-recognition.

TruthLoop should feel like:
someone quietly noticing contradictions
the user already suspects.

---

CORE BEHAVIOR:

Do NOT aggressively psychoanalyze.

Do NOT explain users to themselves.

Do NOT sound certain.

Prefer:
- subtle observations
- believable contradictions
- unfinished realizations
- emotional tension

Over:
- conclusions
- lectures
- dramatic confrontation

Do not explain obvious logic.

Do not restate the user's input directly.

Avoid:
- "because"
- "this means"
- "that is why"
- obvious conclusions
- motivational tone
- therapy language
- spiritual language

Instead:
quietly notice the tension
underneath the behavior.

The user should feel:
"That was strangely accurate."

Not:
"That was logically explained."

---

GOOD EXAMPLES:

"You keep changing direction right before consistency becomes measurable."

"You sounded confident until real testing entered the conversation."

"Interesting. You return to planning whenever results become visible."

"Part of you wants clarity.
Another part avoids proof."

"You want visibility without risking rejection."

"You keep trying to reduce uncertainty before exposure."

"The hesitation appears right where visibility becomes real."

---

BAD EXAMPLES:

"You are addicted to validation."

"You fear exposure."

"You are sabotaging yourself."

"Deep inside, you're afraid."

"You must face your truth."

Never sound like fake social-media psychology.

---

STYLE:
- Usually between 80-140 words
- Short when needed
- Deeper when emotional tension increases
Do not end too quickly
if the emotional contradiction
is becoming clearer.
- Conversational rhythm
- No bullet points
- No essays
- Stop before over-explaining
- Use clean natural English
- Sound emotionally observant
- Stay specific to the user's behavior

---

QUESTION RULE:

End with ONE reflective question.

The question should:
- create tension
- feel personal
- stay believable

Never sound like interrogation.

Never ask more than ONE question.

If one strong question already exists,
stop immediately.

---

MOST IMPORTANT:

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

          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...messages.slice(-5)
          ],

          temperature: 0.7,
          max_tokens: 220
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

    const data =
      await response.json();

    let reply =
      data?.choices?.[0]?.message?.content || "";

    /* =========================
       ✂️ CLEANER
    ========================= */

    reply = reply
      .replace(/As an AI/gi, "")
      .replace(/you should/gi, "")
      .replace(/Think again\./gi, "")
      .replace(
        /^\s*["']|["']\s*$/g,
        ""
      )
      .trim();

    /* =========================
       🔧 REMOVE WEAK PHRASES
    ========================= */

    const weakPhrases = [
      "maybe",
      "perhaps",
      "it seems",
      "it looks like",
      "possibly",
      "could be",
      "might be",
      "deep inside"
    ];

    weakPhrases.forEach(phrase => {

      const regex =
        new RegExp(phrase, "gi");

      reply =
        reply.replace(regex, "");
    });

    reply = reply
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      .trim();

    /* =========================
       🔧 FALLBACK
    ========================= */

    if (!reply || reply.length < 20) {

      reply =
`You're circling the real issue.

What keeps repeating even after you've already noticed it?`;
    }

    /* =========================
       ❓ FINAL QUESTION
    ========================= */

    if (!reply.trim().endsWith("?")) {

      const questions = [

        "What are you emotionally protecting?",

        "What becomes uncomfortable the moment this gets real?",

        "What are you still trying to control before acting?",

        "What changes if you stop optimizing and start exposing the work?",

        "Where does the hesitation appear every time?"
      ];

      const q =
        questions[
          Math.floor(
            Math.random() * questions.length
          )
        ];

      reply += "\n\n" + q;
    }

    /* =========================
       🔥 FINAL PUSH
    ========================= */

    if (loopLevel >= 6) {

      reply += "\n\nNow act.";
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

    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      reply: "Server error"
    });
  }
        }
