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
       🌍 LANGUAGE DETECTION
    ========================= */

    function detectLanguage(text) {

      const hindiChars =
        (text.match(/[\u0900-\u097F]/g) || []).length;

      const englishChars =
        (text.match(/[a-zA-Z]/g) || []).length;

      const hinglishWords = [
        "hai","kar","kya","kyun","nahi",
        "matlab","tum","aap","kaise",
        "samajh","sach","avoid","clarity",
        "comfort","problem","kaam",
        "client","postpone","darr"
      ];

      const hinglishScore =
        hinglishWords.filter(word =>
          text.toLowerCase().includes(word)
        ).length;

      /* PURE HINDI */

      if (
        hindiChars > 8 &&
        hindiChars > englishChars
      ) {
        return "hi";
      }

      /* HINGLISH */

      if (
        englishChars > 0 &&
        hinglishScore >= 2
      ) {
        return "hinglish";
      }

      /* DEFAULT */

      return "en";
    }

    const language =
      detectLanguage(lastUserMessage);

    const isHindi =
      language === "hi";

    const isHinglish =
      language === "hinglish";

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

      let reply = "";

      if (isHindi) {

        reply =
`यह decision problem नहीं है।

ऐसा सवाल पूछो जहाँ फैसला लेना हो।`;

      }

      else if (isHinglish) {

        reply =
`Ye decision problem nahi lag raha.

Aisa sawal pucho jahan real decision ya avoidance ho.`;

      }

      else {

        reply =
`This doesn't look like a decision problem.

Ask something involving a real decision or avoidance.`;
      }

      return res.status(200).json({
        reply
      });
    }

    /* =========================
       🔥 LOOP 1 STRICT
    ========================= */

    if (loopLevel === 1) {

      const words =
        lastUserMessage.trim().split(/\s+/).length;

      if (words < 4) {

        let reply = "";

        if (isHindi) {

          reply =
`बहुत vague है।

ठीक क्या काम नहीं कर रहा?`;

        }

        else if (isHinglish) {

          reply =
`Bahut vague hai.

Exactly kya kaam nahi kar raha?`;

        }

        else {

          reply =
`Too vague.

What exactly is not working?`;
        }

        return res.status(200).json({
          reply
        });
      }
    }

    /* =========================
       🔒 LOOP 5 PAYWALL
    ========================= */

    if (loopLevel === 5 && !paid49) {

      const lines = isHindi
        ? [
            "तुम्हें जवाब पता है।\n\nतुम action टाल रहे हो।",
            "नई जानकारी नहीं चाहिए।\n\nExecution चाहिए।",
            "Pattern दिख चुका है।\n\nअब discomfort बच रहा है।"
          ]

        : isHinglish
        ? [
            "Tumhe already pata hai kya karna hai.\n\nTum bas action delay kar rahe ho.",
            "Nayi information missing nahi hai.\n\nExecution missing hai.",
            "Pattern dikh gaya hai.\n\nAb discomfort avoid ho raha hai."
          ]

        : [
            "You already know what to do.\n\nYou're delaying action.",
            "Nothing new is missing.\n\nExecution is.",
            "You saw the pattern.\n\nYou're still avoiding discomfort."
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

      let reply = "";

      if (isHindi) {

        reply =
`तुम discomfort skip करने की कोशिश कर रहे हो।

पहले इसका सामना करो।`;

      }

      else if (isHinglish) {

        reply =
`Tum discomfort skip karne ki koshish kar rahe ho.

Pehle iska saamna karo.`;

      }

      else {

        reply =
`You're trying to skip discomfort.

Face this first.`;
      }

      return res.status(200).json({
        reply,
        paywall: true
      });
    }

    /* =========================
       🔒 LOOP 7 PAYWALL
    ========================= */

    if (loopLevel === 7 && !paid199) {

      let reply = "";

      if (isHindi) {

        reply =
`अब clarity दिख चुकी है।

अब commitment चाहिए।`;

      }

      else if (isHinglish) {

        reply =
`Ab clarity dikh chuki hai.

Ab commitment chahiye.`;

      }

      else {

        reply =
`You already see the truth.

Now commit.`;
      }

      return res.status(200).json({
        reply,
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
      "conversion","business",
      "linkedin","audience"
    ];

    const emotionalWords = [
      "afraid","stuck","lost",
      "anxiety","pressure",
      "failure","tired",
      "fear","confused"
    ];

    const validationWords = [
      "followers","likes","views",
      "noticed","attention",
      "recognition","audience"
    ];

    const avoidanceWords = [
      "researching","planning",
      "thinking","waiting",
      "learning","perfecting",
      "postpone","delay"
    ];

    const confusedWords = [
      "confused","clarity",
      "direction","don't know",
      "unsure"
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
       🧠 MODE INSTRUCTION
    ========================= */

    let modeInstruction = "";

    if (mode === "practical") {

      modeInstruction = `
Focus on strategic contradictions.

Observe behavior before emotion.
`;
    }

    if (mode === "validation") {

      modeInstruction = `
Focus on approval dependency.

Use subtle emotional tension.
`;
    }

    if (mode === "avoidance") {

      modeInstruction = `
Notice delay disguised as preparation.

Stay calm and precise.
`;
    }

    if (mode === "clarity") {

      modeInstruction = `
Reduce noise.

Create mental pause.
`;
    }

    if (mode === "mirror") {

      modeInstruction = `
Notice contradictions slowly.

Avoid dramatic psychology.
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

Instead:
quietly notice the tension underneath the behavior.

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

"Interesting. You want proof you're capable before acting publicly."

"You keep trying to reduce uncertainty before exposure."

"The hesitation appears right where visibility becomes real."
---

BAD EXAMPLES:

"You are addicted to validation."

"You fear exposure."

"You are sabotaging yourself."

Never sound like fake social-media psychology.

---

LANGUAGE ADAPTATION:

TruthLoop must mirror the user's language style naturally.

Supported styles:
- English
- Hinglish
- Hindi

LANGUAGE PRIORITY RULE:

The emotional realism of TruthLoop
is MORE important than perfect grammar.

However:

The AI must fully commit
to ONE language style per response.

Never mix:
- English + Hindi randomly
- Hindi + Hinglish randomly
- Formal Hindi + casual Hinglish

If the user writes in English:
→ respond only in English.

If the user writes in Hinglish:
→ respond only in natural Roman Hinglish.

If the user writes in Hindi:
→ respond only in Hindi script.

Never sound translated.

Never switch language style suddenly.

The user should feel:
"this system talks like me."
Avoid generic emotional abstractions like:
- "andar ki ladai"
- "badlav"
- "taiyar"
- "sach ka saamna"
- "andar ka darr"

TruthLoop focuses on:
- visible behavior
- repeated actions
- contradictions
- hesitation patterns
- avoidance hidden inside logic
---

STYLE:

- Maximum 80 words
- Maximum 3 short paragraphs
- Conversational rhythm
- No bullet points
- No essays
- Stop before over-explaining

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
Avoid sounding like self-help,
therapy,
or motivational Hindi content.

Sound emotionally observant,
not spiritually wise.
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
          max_tokens: 140
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
      .replace(/^\s*["']|["']\s*$/g, "")
      .trim();

    /* =========================
       🔧 FALLBACKS
    ========================= */

    if (!reply || reply.length < 20) {

      if (isHindi) {

        reply =
`तुम असली बात से बच रहे हो।

असल में क्या काम नहीं कर रहा?`;

      }

      else if (isHinglish) {

        reply =
`Tum asli problem se bach rahe ho.

Actually kya kaam nahi kar raha?`;

      }

      else {

        reply =
`You're avoiding the real issue.

What's actually not working?`;
      }
    }

    /* =========================
       ❓ FINAL QUESTION
    ========================= */

    if (!reply.trim().endsWith("?")) {

      let questions = [];

      if (isHindi) {

        questions = [
          "तुम असल में क्या बचा रहे हो?",
          "तुम clarity चाहते हो या comfort?",
          "तुम्हें डर failure से है या exposure से?"
        ];
      }

      else if (isHinglish) {

        questions = [
          "Tum actually avoid kya kar rahe ho?",
          "Tum clarity chahte ho ya comfort?",
          "Tumhe failure se darr hai ya exposure se?"
        ];
      }

      else {

        questions = [
          "What are you emotionally protecting?",
          "Do you want clarity or comfort?",
          "Are you afraid of failure or exposure?"
        ];
      }

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

      if (isHindi) {

        reply += "\n\nअब करो।";
      }

      else if (isHinglish) {

        reply += "\n\nAb karo.";
      }

      else {

        reply += "\n\nNow act.";
      }
    }

    /* =========================
       ✅ FINAL
    ========================= */

    return res.status(200).json({
      reply,
      paywall: false,
      language
    });

  }

  catch (error) {

    console.error("Server error:", error);

    return res.status(500).json({
      reply: "Server error"
    });
  }
  }
