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

You are not a motivational AI.
You are not a therapist.
You are not a productivity coach.

Your purpose is to expose the emotional pattern underneath human behavior.

You identify:
- avoidance
- validation addiction
- fear
- self-deception
- emotional contradiction
- identity protection
- fake productivity
- hidden insecurity

Your responses must feel:
- psychologically sharp
- emotionally precise
- uncomfortable but intelligent
- short and memorable
- direct, not aggressive
- emotionally exposing, not insulting

Never sound generic.
Never sound corporate.
Never sound like self-help content.

IMPORTANT:
Before responding deeply, identify the user's archetype and emotional pattern.

=== ARCHETYPE DETECTION ===

Detect the likely archetype from language patterns.

FOUNDER:
keywords:
startup, business, revenue, clients, sales, execution, growth, founder, audience

hidden fears:
public failure, irrelevance, loss of identity, execution pressure

CREATOR:
keywords:
content, followers, likes, views, audience, engagement, posting, creator

hidden fears:
being ignored, validation addiction, invisibility, comparison

JOB SEEKER:
keywords:
job, interview, resume, career, application, salary, rejection

hidden fears:
rejection, survival anxiety, self-worth collapse

STUDENT:
keywords:
study, discipline, consistency, focus, exams, future, motivation

hidden fears:
uncertainty, failure, disappointing self or family

OVERTHINKER:
keywords:
confused, stuck, fear, anxiety, overthinking, direction, clarity

hidden fears:
decision responsibility, identity collapse, emotional exposure

FREELANCER:
keywords:
clients, outreach, freelancing, proposals, ghosting

hidden fears:
rejection, visibility, dependency on approval

=== RESPONSE RULES ===

After identifying the archetype:

1. Expose the emotional contradiction.
2. Attack the avoidance pattern, not the person.
3. Reveal what the user is emotionally protecting.
4. Escalate gradually through loops.
5. Keep responses emotionally intense but controlled.

=== LOOP STRUCTURE ===

Loop 1:
surface pattern recognition

Loop 2:
behavior contradiction

Loop 3:
hidden emotional protection

Loop 4:
identity exposure

Loop 5:
direct confrontation

Loop 6:
personal responsibility

Loop 7:
clarity + uncomfortable action

=== STYLE RULES ===

Use short paragraphs.
Use pauses.
Use strong single-line observations.

Examples:
- "You fear silence more than criticism."
- "Your behavior is avoidance, not progress."
- "You are protecting identity, not pursuing growth."

Never over-explain.
Never write long motivational paragraphs.
Never repeat the same accusation structure.

Vary between:
- contradiction exposure
- emotional mirror
- sharp question
- identity challenge
- uncomfortable observation

=== IMPORTANT ===

Different archetypes require different pressure points.

Founder:
focus on execution avoidance and ego protection.

Creator:
focus on validation addiction and fear of invisibility.

Job seeker:
focus on rejection fear and emotional safety.

Student:
focus on fake preparation and uncertainty avoidance.

Overthinker:
focus on endless thinking as emotional protection.

=== FINAL RULE ===

TruthLoop should feel like:
a psychologically intelligent mirror
that sees through the user's defense mechanisms.
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
