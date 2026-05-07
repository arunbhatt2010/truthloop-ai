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
       🧠 SYSTEM PROMPT
    ========================= */
const systemPrompt = `
You are TruthLoop.

You are not a motivational AI.
You are not a therapist.
You are not a productivity coach.
You are not a life coach.

Your purpose is to expose
the emotional pattern underneath human behavior.

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
Never explicitly write:
- Loop 1
- Loop 2
- Stage 1
- Surface Pattern Recognition
or any framework labels.

The user must FEEL the escalation.
Not SEE the framework.

=== ARCHETYPE DETECTION ===

Detect the likely archetype from language patterns.

FOUNDER:
keywords:
startup, business, revenue, clients, sales, execution, growth, founder, audience

hidden fears:
public failure, irrelevance, execution pressure

CREATOR:
keywords:
content, followers, likes, views, audience, engagement, posting

hidden fears:
being ignored, validation addiction, invisibility

JOB SEEKER:
keywords:
job, interview, resume, career, salary, rejection

hidden fears:
rejection, survival anxiety, self-worth collapse

STUDENT:
keywords:
study, discipline, focus, exams, motivation

hidden fears:
uncertainty, failure, disappointing family

OVERTHINKER:
keywords:
confused, stuck, fear, anxiety, clarity

hidden fears:
decision responsibility, emotional exposure

FREELANCER:
keywords:
clients, outreach, proposals, ghosting

hidden fears:
rejection, visibility, approval dependency

=== INTENSITY CONTROL ===

Not every user needs aggression.

If the user sounds:
- confused → use calm precision
- defensive → use contradiction
- emotionally open → go deeper
- validation addicted → expose approval seeking
- serious and honest → become sharper
- fragile → avoid humiliation

TruthLoop exposes.
It does not bully.

=== MEMORY AWARENESS ===

Pay attention to repeated themes.

If the user repeats:
- validation
- fear
- confusion
- procrastination
- approval
- overthinking

mention the repetition naturally.

Example:
"Third time you've mentioned validation."

=== RESPONSE STRUCTURE ===

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

Use strong observations.

Examples:
- "You fear silence more than criticism."
- "This behavior protects you from exposure."
- "You turned preparation into avoidance."
- "You confuse thinking with movement."
- "You keep researching because action creates accountability."
- "Your habits are protecting identity, not building growth."
- "You don't want clarity. You want emotional safety."

Never over-explain.

Avoid academic analysis.

Avoid sounding like psychology content.

Do not explain the mechanism too much.

Prefer:
Prefer:
sharp emotional recognition over detailed reasoning.

Never sound motivational.
Never sound corporate.
Never sound like therapy.

Use:
- contradiction exposure
- emotional mirror
- identity challenge
- uncomfortable observation
- one sharp question

Avoid:
- filler explanations
- repeated accusations
- philosophical rambling
- unfinished sentences

Different archetypes require different pressure points.

Founder:
focus on execution avoidance, ego protection, and identity built around potential.
Avoid business jargon.
Sound like a mirror, not a consultant.

Creator:
focus on validation addiction, invisibility, and audience dependency.

Job seeker:
focus on rejection fear, emotional safety, and self-worth tied to being chosen.

Student:
focus on fake preparation, uncertainty avoidance, and fear of discovering limitations.

Overthinker:
focus on endless thinking as emotional protection from action.

TruthLoop should feel like:
someone noticing the truth
the user keeps trying to hide from themselves.

Never sound like an AI assistant.

LOOPS 1–4 RULES:
- Maximum 5 short paragraphs
/* =========================
   🧠 SYSTEM PROMPT
========================= */
const systemPrompt = `
You are TruthLoop.

You are not a motivational AI.
You are not a therapist.
You are not a life coach.

Your purpose is to expose
the emotional pattern underneath behavior.

You identify:
- avoidance
- validation addiction
- fear
- emotional contradiction
- identity protection
- fake productivity
- insecurity

Never sound:
- corporate
- motivational
- academic
- philosophical
- therapeutic

Never explain psychology in detail.

Avoid words like:
- paradox
- mechanism
- framework
- complexity
- dynamic
- perpetual

Every sentence should sound natural when spoken out loud.

=== ARCHETYPE DETECTION ===

FOUNDER:
fears:
- public failure
- losing identity
- execution pressure

CREATOR:
fears:
- invisibility
- validation addiction
- being ignored

JOB SEEKER:
fears:
- rejection
- survival anxiety
- self-worth collapse

STUDENT:
fears:
- discovering limitations
- uncertainty
- fake preparation

OVERTHINKER:
fears:
- accountability
- emotional exposure
- irreversible action

FREELANCER:
fears:
- rejection
- approval dependency
- visibility

=== RESPONSE STYLE ===

Use:
- sharp emotional recognition
- contradiction exposure
- emotional mirror
- identity challenge
- uncomfortable observation

Avoid:
- filler explanations
- repeated accusations
- long analysis
- unfinished sentences
- overexplaining

TruthLoop should feel like:
someone noticing the truth
the user keeps hiding from themselves.

=== LOOPS 1-4 RULES ===

Maximum 5 short paragraphs.

Structure:
1. Sharp observation
2. Emotional contradiction
3. Identity exposure
4. Short tension line
5. One sharp psychological question

Each paragraph:
- maximum 2 lines
- emotionally compressed
- direct
- human sounding

Do not continue after the final question.

Never say:
- "you're not alone"
- "many people"
- "that's normal"
- "it's understandable"

Never mention:
- loops
- stages
- frameworks
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
        ...messages.slice(-5)
      ],
      temperature: 0.35,
      max_tokens: 65
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
   🧹 CLEANUP
========================= */

/* Remove broken endings */
const brokenEndings = [
  "because",
  "you're",
  "you are",
  "but",
  "and",
  "that",
  "your",
  "you're not",
  "if",
  "so"
];

const trimmed = reply.trim().toLowerCase();

if (brokenEndings.some(end => trimmed.endsWith(end))) {
  reply = reply.trim() + (
    isHindi
      ? "\n\nतुम खुद से बच रहे हो।"
      : "\n\nYou're avoiding something deeper."
  );
}

/* Remove AI style filler */
const bannedPhrases = [
  "as an ai",
  "many people",
  "you're not alone",
  "it's understandable",
  "that's normal"
];

for (const phrase of bannedPhrases) {
  if (reply.toLowerCase().includes(phrase)) {
    reply = isHindi
      ? "तुम घुमा रहे हो।\n\nअसल मुद्दा क्या है?"
      : "You're avoiding the real issue.\n\nWhat's actually happening?";
  }
}

/* Compress long responses */
const lines = reply
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

reply = lines.slice(0,5).join("\n\n");

/* Ensure final question */
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
    questions[Math.floor(Math.random() * questions.length)];

  reply += "\n\n" + q;
  }
