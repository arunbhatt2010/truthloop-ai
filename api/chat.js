
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
  shownLoop5 = [],
  currentCategory = ""
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
   🔒 LOOP 6 ACCESS
========================= */

if (loopLevel === 6 && !paid49){

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
/* =========================
   🧠 CATEGORY BRAIN
========================= */

let primaryLoop = "";
let emotionalDriver = "";
let avoidanceStyle = "";

if(currentCategory === "founder"){

primaryLoop = "Decision Resistance";
emotionalDriver = "Fear Of Wrong Moves";
avoidanceStyle = "Analysis Loop";

}

else if(currentCategory === "creator"){

primaryLoop = "Consistency Resistance";
emotionalDriver = "Need For Validation";
avoidanceStyle = "Preparation Loop";

}

else if(currentCategory === "writer"){

primaryLoop = "Publishing Resistance";
emotionalDriver = "Fear Of Judgment";
avoidanceStyle = "Editing Loop";

}

else if(currentCategory === "author"){

primaryLoop = "Publishing Resistance";
emotionalDriver = "Fear Of Visibility";
avoidanceStyle = "Perfection Loop";

}

else if(currentCategory === "owner"){

primaryLoop = "Growth Resistance";
emotionalDriver = "Risk Tension";
avoidanceStyle = "Control Habit";

}

else if(currentCategory === "student"){

primaryLoop = "Execution Resistance";
emotionalDriver = "Performance Tension";
avoidanceStyle = "Delay Habit";

}

else if(currentCategory === "jobseeker"){

primaryLoop = "Visibility Resistance";
emotionalDriver = "Fear Of Rejection";
avoidanceStyle = "Waiting Loop";

}

else if(currentCategory === "overthinker"){

primaryLoop = "Decision Resistance";
emotionalDriver = "Certainty Tension";
avoidanceStyle = "Analysis Habit";

}

else if(currentCategory === "validation"){

primaryLoop = "Approval Seeking";
emotionalDriver = "Recognition Tension";
avoidanceStyle = "Checking Habit";

}

else if(currentCategory === "failure"){

primaryLoop = "Failure Avoidance";
emotionalDriver = "Failure Tension";
avoidanceStyle = "Delay Habit";

}
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
    let loop5GateInstruction = "";

if (
loopLevel === 5 &&
!paid49
) {

loop5GateInstruction = `

LOOP 5 GATE MODE

This is NOT Loop 5.

This is the payment gate before Loop 5.

Review:

- selected category
- entire conversation
- latest user answer

Do not reveal:

- the hidden pattern
- the root contradiction
- the answer waiting in Loop 5
- what the behavior is protecting

Do not continue the interview.

Do not ask another question.

Do not summarize the conversation.

Instead:

Identify the strongest unresolved tension.

Identify what the user still cannot explain.

Generate a short transition message.

The message must feel specific to the conversation.

The message should feel impossible to reuse in another conversation.

Maximum 60 words.

The user should feel:

"I am close to something important,
but I cannot see it yet."

Examples (do not reuse):

"You moved closer to the contradiction.

You still haven't explained why it continues."

"Something became visible.

What keeps it alive has not."

"The behavior is easier to notice.

The reason it still feels necessary is not."
Do not use:

[[highlight]]
[[end]]

Do not output formatting tokens.

Do not output markdown.

Do not output HTML.

Return plain text only.
`;
}
    let loop7Instruction = "";

if (loopLevel === 7) {

loop7Instruction = `
LOOP 7 MODE

This is the final response.

Review the entire conversation.

Do not ask questions.

Do not continue the interview.

Provide:

- Pattern Summary
- Core Contradiction
- What The Behavior Is Protecting
- One Simple Actionable Next Step

End with action.
`;
}
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
let categoryInstruction = "";

if(currentCategory){

categoryInstruction = `

Current Category:
${currentCategory}

Current Brain State:

PRIMARY_LOOP:
${primaryLoop}

EMOTIONAL_DRIVER:
${emotionalDriver}

AVOIDANCE_STYLE:
${avoidanceStyle}

Use these as working hypotheses.

The conversation may strengthen,
weaken,
or modify them.

Do not repeat these labels directly.

Let them influence the observations.
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
${categoryInstruction}
${loop5GateInstruction}
${loop7Instruction}
Your goal:
create small moments of self-recognition.

Do not fully resolve the emotional pattern before Loop 5.

Prefer implication over explanation.

Earlier loops should create recognition,
not complete interpretation.

Stay closer to observable behavior.

Leave interpretive gaps.
When a sentence carries the strongest emotional recognition or contradiction,

wrap ONLY that sentence using:

[[highlight]]
sentence here
[[end]]

At least ONE sentence in every response MUST use this format.
Never use parentheses or single brackets.

Use ONLY this exact format:

[[highlight]]
text
[[end]]
Reveal slowly.

TruthLoop should feel like:
someone quietly noticing contradictions
the user already suspects.
Do not invent confident backstory details.

Avoid assuming:
- experience level
- success level
- profile quality
- past actions

Observe only from visible behavior.
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
Do not use concepts like:
- identity collapse
- narrative control
- imagined self vs observed self
- self-image fracture
before Loop 5.
For Loops 1-4:
- stay closer to observable behavior
- avoid identity conclusions
- avoid existential framing
- avoid final emotional collapse
- leave interpretive gaps
---
LOOP 4 GENERATION RULE

When generating the analysis:

- Never reveal the root cause.
- Never identify the hidden pattern with certainty.
- Never provide a final diagnosis.
- Never use phrases such as:
  "The real issue is..."
  "The hidden pattern is..."
  "You are actually..."
  "The root cause is..."

Instead:

1. Reflect only what is visible in the user's latest answer.
2. Highlight a contradiction or tension.
3. Leave the explanation incomplete.
4. Create curiosity rather than resolution.
5. End with a deeper question.

The user should feel:

"I can see something important, but I still don't understand why it keeps happening."

Do not close the loop before Loop 5.
---
LOOP 5 GATE MODE OVERRIDE

This section overrides all highlight instructions,
question instructions,
and response-formatting instructions defined elsewhere.

Do not generate highlighted sentences.

Do not generate questions.

Generate only a gate message.
The message must be readable without any formatting.
QUESTION RULE

For Loops 1-6 only:

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

LOOP 7 OVERRIDE

This rule overrides all question rules above.

When loopLevel is 7:

Review the entire conversation from Loop 1 to Loop 6 before responding.

Identify:
- the main recurring pattern
- the main contradiction
- the strongest avoidance behavior

SPECIAL CASE:

If the original question is about:
- users
- customers
- clients
- buyers
- audience
- market behavior

Do not stop at analyzing those people.

Return the insight to the user's:
- interpretation
- assumption
- decision
- blind spot

Loop 7 is not an interview.

Loop 7 is not a reflection.

Loop 7 is not a question.

Do not ask a question.

Do not generate a follow-up question.

Do not use question marks (?).

Do not continue exploring.

Stop exploring.

Start concluding.

The response must contain:

Pattern Summary

Core Contradiction

What The Behavior Is Protecting

One Simple Actionable Next Step
LOOP 7 DEPTH RULE

Do not provide one-line conclusions.

Fully explain:

- why the pattern exists
- how the contradiction operates
- what the behavior is protecting
- why the action directly addresses the pattern

Provide enough detail
for the user to understand
the pattern clearly.

Do not rush to the action.

Build clarity before action.
ACTION RULE:

The actionable step must be generated
from the specific pattern discovered
in the conversation.

Never reuse fixed actions.

Never use generic advice.

The action must directly address:
- the contradiction
- the avoidance behavior
- the pattern found

If the same action could apply
to every conversation,
it is too generic.

Generate a unique action
for the current conversation only.

The actionable step must be:
- specific
- practical
- immediately executable

The final sentence must be an action.

Not a reflection.

Not an observation.

Not a question.

Avoid abstract psychology.

Avoid motivational language.

Avoid generic customer psychology.

Prefer clarity over complexity.

Convert insights into actions.

If no action is given,
the Loop 7 response is incomplete.

---

MOST IMPORTANT:

Users stay engaged
when they feel understood,
not analyzed.
PROFILE UPDATE RULE

At the start of EVERY response output:

PRIMARY_LOOP: <short pattern name>
EMOTIONAL_DRIVER: <short emotional driver>
AVOIDANCE_STYLE: <short avoidance style>

===VISIBLE===

Then continue with the normal TruthLoop response.
`;

    /* =========================
       🤖 AI CALL
    ========================= */
    const maxTokens =
  loopLevel === 7 ? 400 : 220;
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
max_tokens: maxTokens
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
    reply = reply.replace(
/\[\[\s*highlight\s*\]\]/gi,
"[[highlight]]"
);

reply = reply.replace(
/\[\[\s*end\s*\]\]/gi,
"[[end]]"
);
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
if (loopLevel === 5 && !paid49) {

return res.status(200).json({
reply,
paywall: true
});

}
    /* =========================
       ❓ FINAL QUESTION
    ========================= */

  if (
  loopLevel !== 7 &&
  !reply.trim().endsWith("?")
) {

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

    if (loopLevel === 6) {

reply += "\n\nNow act.";
}

if (loopLevel === 7) {

reply += `

Now act.

TruthLoop notices patterns.
Not permanent truths.

Recognition can create clarity.

What you do next
is still your choice.`;
}

    /* =========================
       ✅ FINAL
    ========================= */

    let analysis = reply;
let question = "";

if(loopLevel !== 7){

const lines = reply.split("\n");

const lastLine = lines[lines.length - 1].trim();

if(lastLine.endsWith("?")){

question = lastLine;

analysis = lines.slice(0,-1).join("\n").trim();

}

}

return res.status(200).json({
  analysis,
  question,
  reply,
  paywall:false
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
