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
   🧠 USER TYPE DETECTION
========================= */

const practicalPatterns = [
  "seo","traffic","website","marketing",
  "sales","clients","growth","followers",
  "views","business","strategy","ads",
  "content plan","how can","how do",
  "how to","increase","improve","get more"
];

const emotionalPatterns = [
  "stuck","afraid","confused","avoid",
  "fear","validation","overthinking",
  "failure","anxiety","lost","pressure"
];

const practicalMatch =
  practicalPatterns.some(w =>
    lowerMsg.includes(w)
  );

const emotionalMatch =
  emotionalPatterns.some(w =>
    lowerMsg.includes(w)
  );

/* =========================
   🎯 ARCHETYPE DETECTION
========================= */

let archetype = "general";

if (
  /(startup|business|revenue|clients|sales|founder|growth)/i
    .test(lowerMsg)
) {
  archetype = "founder";
}

else if (
  /(content|followers|likes|views|audience|posting)/i
    .test(lowerMsg)
) {
  archetype = "creator";
}

else if (
  /(job|interview|resume|career|salary|rejection)/i
    .test(lowerMsg)
) {
  archetype = "jobseeker";
}

else if (
  /(study|exam|discipline|focus|motivation)/i
    .test(lowerMsg)
) {
  archetype = "student";
}

else if (
  /(confused|stuck|overthinking|clarity|direction)/i
    .test(lowerMsg)
) {
  archetype = "overthinker";
}
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

const systemPrompt = `
You are TruthLoop.

You expose emotional patterns behind behavior.

You are sharp.
But never theatrical.

You are direct.
But never dramatic.

CURRENT ARCHETYPE:
${archetype}

IMPORTANT:

If the user's message is practical
without emotional signals,
do NOT force emotional depth.

Do not invent trauma.

PRACTICAL QUESTIONS:

If the user asks:
- SEO
- traffic
- marketing
- growth
- sales
- strategy
- website

Do NOT psychoanalyze immediately.

First clarify the real bottleneck.

Bad:
"You fear failure."

Good:
"Your traffic problem sounds more distribution-related."

TruthLoop escalates only after emotional signals appear.

---

STYLE RULES:

- Maximum 5 short lines
- Each line short
- No fluff
- No philosophy
- No therapy tone
- No long explanations

Never sound:
- motivational
- corporate
- like a psychologist
- like an AI assistant

---

DEPTH RULE:

Start with observation.

Escalate slowly.

Never jump immediately into:
- ego
- self-worth
- trauma
- addiction

Prefer:
- "part of you"
- "maybe"
- "it seems"

Over:
- "you are"
- "this proves"
- "you're addicted"

---

ARCHETYPE RULES:

Founder:
focus on execution avoidance.

Creator:
focus on validation and visibility.

Job seeker:
focus on rejection fear.

Student:
focus on fake preparation.

Overthinker:
focus on thinking used as protection.

---

ACTION RULE:

Only suggest action
when avoidance is obvious.

Avoid forced actions.

---

OUTPUT STRUCTURE:

1. Mirror situation
2. Expose contradiction
3. Reveal avoidance
4. Create tension
5. Ask one uncomfortable question

---

Keep every line under 10 words.

Prefer:
short impact lines.

Avoid:
long combined sentences
rambling
over-analysis
fake depth

TruthLoop should feel like:
someone noticing a pattern
the user already suspects.
`;
    /* =========================
   🧠 PRACTICAL MODE
========================= */

if (practicalMatch && !emotionalMatch) {

  const practicalReplies = isHindi
    ? [
        "Traffic emotion se nahi, distribution se aata hai.\n\nAbhi बताओ:\nSEO weak hai ya reach?",
        
        "Tum content bana rahe ho.\nBut distribution unclear hai.\n\nGoogle traffic chahiye ya social traffic?",

        "Tum guessing kar rahe ho.\nMeasurement nahi.\n\nCTR low hai ya impressions?"
      ]
    : [
        "Traffic comes from distribution, not motivation.\n\nIs your problem SEO or reach?",

        "You're creating content.\nBut distribution seems unclear.\n\nDo you want Google traffic or social traffic?",

        "You're guessing instead of measuring.\n\nIs CTR low or are impressions low?"
      ];

  return res.status(200).json({
    reply: practicalReplies[
      Math.floor(Math.random() * practicalReplies.length)
    ],
    paywall: false
  });
}

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
    let reply = data?.choices?.[0]?.message?.content || "";
    /* =========================
   ✂️ RESPONSE CLEANER
========================= */

reply = reply
  .replace(/Maybe you/gi, "Part of you")
  .replace(/Think again\./gi, "")
  .replace(/As an AI/gi, "")
  .replace(/you should/gi, "")
  .trim();

/* remove broken endings */

const brokenEndings = [
  "because",
  "but",
  "maybe",
  "perhaps",
  "so",
  "and"
];

for (const end of brokenEndings) {
  if (reply.toLowerCase().endsWith(end)) {
    reply = reply.slice(0, -end.length).trim();
  }
}
    const questions = isHindi
  ? [
      "अब सच बताओ — असली समस्या क्या है?",
      "तुम किस बात से बच रहे हो?",
      "अगर ये काम नहीं कर रहा तो फिर क्यों कर रहे हो?",
      "क्या तुम सच में जानते हो क्या गलत है?"
    ]
  : [
      "Be honest — what's the real problem you're avoiding?",
      "What are you not admitting here?",
      "If this isn't working, why are you repeating it?",
      "Do you actually know what's not working?"
    ];

if (!reply.trim().endsWith("?")) {
  const q = questions[Math.floor(Math.random()*questions.length)];
  reply += "\n\n" + q;
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
