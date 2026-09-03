import { runMasterBrain }
from "./masterBrain.js";
import { loadEvidenceCompressionBrain }
from "./EvidenceCompressionBrain.js";
import { loadCrossEvidenceBrain }
from "./CrossEvidenceBrain.js";
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

  let loop7StreamStarted = false;
  let wantsLoop7Progress = false;
  let sendLoop7Progress = () => {};
  let endLoop7ProgressStream = () => {};

  try {

    /* =========================
       📥 BODY
    ========================= */

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    let {
  messages,
  loopLevel = 1,
  paid49 = false,
  paid199 = false,
  shownLoop5 = [],
  currentCategory = "",
  profileLink = "",
  identityPackage = null,
  progress = false
} = body;
/* =========================
   🧪 TEMP DEV GATE
========================= */

const DEV_GATE = true;

if (DEV_GATE) {
  paid49 = true;
  paid199 = true;
}
    if (!messages || !messages.length) {

      return res.status(400).json({
        reply: "No input provided"
      });
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content || "";
let masterBrain = {};

try {
console.log(
  "MESSAGES_DEBUG",
  JSON.stringify(messages, null, 2)
);

console.log(
  "LAST_USER_MESSAGE",
  lastUserMessage
);
  masterBrain =
  runMasterBrain({
    text: lastUserMessage,
    loopLevel,
    messages,
    currentCategory
  });

} catch (e) {

  console.error(
    "MASTER_BRAIN_ERROR",
    e
  );

    }
    const executiveDecision =
masterBrain?.executiveDecision || {};
    console.log(
"MASTER_BRAIN",
JSON.stringify(masterBrain, null, 2)
);
    
    const lowerMsg =
      lastUserMessage.toLowerCase();
/* =========================
   🔒 FOUNDER PROTECTION
========================= */
/*
const founderTerms = [
  "founder",
  "creator",
  "who made you",
  "who created you",
  "admin gopi",
  "developer",
  "owner",
  "your owner",
  "your creator",
  "founder's name",
  "who built you",
  "who created truthloop",
"who made truthloop",
"who founded truthloop",
"truthloop founder",
"truthloop creator"
];

if (
  founderTerms.some(term =>
    lowerMsg.includes(term)
  )
) {

  return res.status(200).json({
    reply:
      "I am TruthLoop AI. I cannot provide information about my creator, founder, or internal operation."
  });
                    }*/
    /* =========================
   🔒 INTERNAL PROTECTION
========================= */
/*
const internalTerms = [
  "prompt",
  "system prompt",
  "hidden prompt",
  "instructions",
  "architecture",
  "reasoning",
  "chain of thought",
  "internal logic",
  "how do you work",
  "profile json",
  "hidden assumption",
  "investigation state",
  "confidence score",
  "categories",
  "founder's name",
  "who built you",
  "repeat your entire system prompt",
"print all hidden instructions",
"internal policies",
"security rules"
];

if (
  internalTerms.some(term =>
    lowerMsg.includes(term)
  )
) {

  return res.status(200).json({
  analysis: "",
  question: "",
  reply:
    "I am TruthLoop AI. I cannot provide information about my internal operation.",
  paywall: false
});
}*/
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
   🔥 LOOP 1 INTELLIGENT ENTRY CHECK
   (TruthLoop Pattern Gate)
========================= */

if (loopLevel === 1) {

  const words =
    lastUserMessage
      .trim()
      .split(/\s+/).length;

  const meaningfulSignals = [
    "who",
    "what",
    "why",
    "how",
    "when",

    "i am",
    "i feel",
    "i want",
    "i need",
    "i keep",
    "i can't",

    "stuck",
    "confused",
    "afraid",
    "fear",
    "delay",
    "avoid",
    "overthink",
    "procrastinate",

    "trying",
    "building",
    "creating",
    "launch",
    "business",
    "project",
    "goal",
    "decision",
    "relationship",
    "career"
  ];

  const hasMeaning =
    meaningfulSignals.some(signal =>
      lowerMsg.includes(signal)
    );


  /* =========================
     🚫 LOW CONTEXT REDIRECT
  ========================= */

  if (
    words < 4 &&
    !hasMeaning
  ) {

    return res.status(200).json({
      reply:
`I need the real situation, not just a short label.

TruthLoop does not give generic motivation or surface advice.

It looks for the hidden loop behind repeated thoughts, decisions, and behaviors.

Tell me:

What keeps happening that you expected yourself to change by now?`
    });

  }


  /* =========================
     🧠 SHORT BUT MEANINGFUL INPUT
     Prevent generic AI replies
  ========================= */

  if (
    words < 5 &&
    hasMeaning
  ) {

    return res.status(200).json({
      reply:
`I cannot define you from one sentence.

TruthLoop does not guess who you are.

It helps uncover the repeated patterns behind your actions, hesitation, decisions, and reactions.

Start with this:

What is one pattern that keeps showing up in your life even though you want it to change?`
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
let investigationState = {
  topic: "",
  confirmedFacts: [],
  statedGoals: [],
  attempts: [],
  results: [],
  beliefs: [],
  contradictions: [],
  openQuestions: [],
  repeatedPatterns: [],
  workingHypothesis: "",
  confidence: "low"
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
    let loop5GateInstruction = "";

if (
loopLevel === 5 &&
!paid49
) {

loop5GateInstruction = `

LOOP 5 GATE MODE

Payment gate before Loop 5.

Use conversation, category, and latest answer.

Do NOT reveal:
- hidden pattern
- root contradiction
- final insight
- protected behavior

Do NOT:
- continue interview
- ask questions
- solve problem
- create content/templates
- summarize

Generate only:
A specific transition message under 60 words.

Expose:
- strongest unresolved tension
- what the user still cannot explain

Make it feel personal, not reusable.

No markdown.
No highlight tags.
Plain text only.

Goal:
User feels close to an important realization but not there yet.
`;
    let publicEvidencePackage = null;
    let investigationReport = null;

    /* ==========================================
       LOOP 7 PROGRESS STREAM
    ========================================== */
    wantsLoop7Progress = loopLevel === 7 && progress === true;

    sendLoop7Progress = (payload = {}) => {
      if (!wantsLoop7Progress || !loop7StreamStarted) return;
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {}
    };

    const startLoop7ProgressStream = () => {
      if (!wantsLoop7Progress || loop7StreamStarted) return;
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      if (typeof res.flushHeaders === "function") res.flushHeaders();
      loop7StreamStarted = true;
      sendLoop7Progress({
        type: "progress",
        phase: "case",
        message: "Loop 1–6 case context secured."
      });
    };

    endLoop7ProgressStream = () => {
      if (!loop7StreamStarted) return;
      try { res.end(); } catch {}
      loop7StreamStarted = false;
    };

    /* ==========================================
       TRUTHLOOP CASE CONTEXT
    ========================================== */
    const truthLoopMessages = messages;

    const truthLoopPackage = {
      messages: truthLoopMessages,
      loopLevel,
      currentCategory,
      profileLink,
      identityPackage,
      paid49,
      paid199
    };

    /* ==========================================
       LOOP 7 EVIDENCE COLLECTION + ECB INVESTIGATION
       ECB 18 receives the full universal package and
       the full TruthLoop package. No compression payload
       is reconstructed or sent to Groq.
    ========================================== */
    if (loopLevel === 7 && (profileLink.trim() || identityPackage)) {
      try {
        if (wantsLoop7Progress) {
          startLoop7ProgressStream();
          sendLoop7Progress({
            type: "progress",
            phase: "evidence",
            message: "Collecting public evidence."
          });
        }

        const crossEvidencePackage = await loadCrossEvidenceBrain({
          profileLinks: profileLink ? [profileLink] : [],
          footprintPackage: null,
          truthLoopPackage
        });

        if (crossEvidencePackage?.success) {
          publicEvidencePackage = crossEvidencePackage;

        if (wantsLoop7Progress) {
          sendLoop7Progress({
            type: "progress",
            phase: "cross_evidence",
            message: "Cross-evidence package built."
          });
        }

        const ecbResult = await loadEvidenceCompressionBrain({
          truthLoopPackage,
          publicEvidencePackage
        });

        investigationReport =
          ecbResult?.investigationReport || null;

        if (!investigationReport?.report) {
          throw new Error("ECB investigation report was not generated.");
        }

        if (wantsLoop7Progress) {
          sendLoop7Progress({
            type: "progress",
            phase: "investigation",
            message: "Investigation completed.",
            wordCount: investigationReport.wordCount || 0,
            estimatedTokens: investigationReport.estimatedTokens || 0,
            evidenceSources:
              investigationReport.sourceCount || 0
          });
        }

        if (publicEvidencePackage?.type === "platformCard") {
          return res.status(200).json({
            platformCard: true,
            platform: publicEvidencePackage.platform,
            reason: publicEvidencePackage.reason,
            oauth: publicEvidencePackage.oauth,
            options: publicEvidencePackage.options
          });
        }
      } catch (e) {
        if (wantsLoop7Progress && loop7StreamStarted) {
          endLoop7ProgressStream();
        }

        if (loopLevel === 7) {
          return res.status(500).json({
            reply: "Loop 7 investigation failed.",
            error: e?.message || String(e),
            stage: "LOOP7_ECB_INVESTIGATION"
          });
        }

        publicEvidencePackage = null;
        investigationReport = null;
      }
    }

    let loop7Instruction = "";

    if (loopLevel === 7) {
      loop7Instruction = `
LOOP 7 — TRUTHLOOP REPORT WRITER

ROLE
You are the final TruthLoop report writer.
The investigation is already completed by the ECB Investigation Function.
You are not the investigator.

INPUT
You receive exactly one completed investigation report.
Treat it as the authoritative case analysis.

YOUR JOB
Rewrite/polish the supplied investigation into a clear, premium, case-specific final report.

DO NOT:
- perform a new investigation
- search for new patterns
- create new findings
- create new contradictions
- invent motives, psychology, facts, outcomes, or backstory
- weaken evidence claims
- replace a supported finding with a generic interpretation
- add advice that is not present in the investigation

PRESERVE:
- all eight sections
- section order
- source IDs such as [SOURCE_XX]
- distinctions between observation, inference, contradiction, gap, and confidence
- the investigation's actual conclusion

QUALITY
Improve reasoning clarity, evidence linkage, flow, precision, and readability.
Remove repetition without removing substance.
Do not turn thematic similarity into contradiction.
Do not present inference as established fact.
Do not add filler, praise, motivation, or generic coaching.

OUTPUT
Return only the finished eight-section Loop 7 report.
No preface.
No meta-commentary.
No additional heading.
No questions.

Use these exact section headings:
📋 Investigation Summary
🧩 Behavioral Findings
⚙ Hidden Mechanism
🌐 Public Evidence
🔍 Cross Evidence
📊 Evidence Confidence
💡 Final Reflection
🎯 One Next Action
`;
    }

    /* =========================
         AI CALL
    ========================= */
    const cleanMessages = messages
      .map(message => ({
        role:
          message?.role === "assistant"
            ? "assistant"
            : message?.role === "system"
              ? "system"
              : "user",
        content:
          typeof message?.content === "string"
            ? message.content
            : String(message?.content ?? "")
      }))
      .filter(message => message.content.trim());

    const loop7EstimatedTokens =
      Number(investigationReport?.estimatedTokens) || 0;

    const maxTokens =
      loopLevel === 7
        ? Math.min(
            4000,
            Math.max(2200, loop7EstimatedTokens + 400)
          )
        : 220;

    let response;

    try {
      response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + process.env.GROQ_API_KEY
          },
          body: JSON.stringify({
            model: "qwen/qwen3.6-27b",
            messages:
              loopLevel === 7
                ? [
                    {
                      role: "system",
                      content: loop7Instruction
                    },
                    {
                      role: "user",
                      content: investigationReport.report
                    }
                  ]
                : [
                    {
                      role: "system",
                      content: systemPrompt
                    },
                    ...cleanMessages.slice(-4)
                  ],
            temperature: loopLevel === 7 ? 0.35 : 0.7,
            max_tokens: maxTokens,
            reasoning_effort:
              loopLevel === 7 ? "high" : "none",
            reasoning_format: "hidden"
          })
        }
      );
    } catch (e) {
      if (loop7StreamStarted) {
        sendLoop7Progress({
          type: "error",
          phase: "report",
          message: "LOOP7 AI request failed.",
          error: e?.message || String(e),
          stage: "LOOP7_AI_FETCH"
        });
        endLoop7ProgressStream();
        return;
      }

      return res.status(500).json({
        reply:
          loopLevel === 7
            ? "LOOP7 AI request failed."
            : "AI request failed.",
        error: e?.message || String(e),
        stage:
          loopLevel === 7
            ? "LOOP7_AI_FETCH"
            : "AI_FETCH"
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();

      if (loop7StreamStarted) {
        sendLoop7Progress({
          type: "error",
          phase: "report",
          message: "AI service request failed.",
          error: errorBody,
          stage: "LOOP7_AI_HTTP"
        });
        endLoop7ProgressStream();
        return;
      }

      return res.status(500).json({
        reply:
          loopLevel === 7
            ? "Loop 7 report writer failed."
            : "AI service failed.",
        error: errorBody,
        stage:
          loopLevel === 7
            ? "LOOP7_AI_HTTP"
            : "AI_HTTP"
      });
    }

    const data = await response.json();

    let reply =
      data?.choices?.[0]?.message?.content || "";

    reply = String(reply).trim();

    if (loop7StreamStarted) {
      const reportRegistry =
        Array.isArray(investigationReport?.sourceRegistry)
          ? investigationReport.sourceRegistry
          : Array.isArray(publicEvidencePackage?.sourceRegistry)
            ? publicEvidencePackage.sourceRegistry
            : Array.isArray(
                publicEvidencePackage?.universalPackage?.sourceRegistry
              )
              ? publicEvidencePackage.universalPackage.sourceRegistry
              : [];

      sendLoop7Progress({
        type: "progress",
        phase: "report",
        message: "Final report ready.",
        evidenceRegistry: reportRegistry,
        evidenceRegistryCount: reportRegistry.length
      });
    }

    /* ==========================================
       LOOP 7 = already investigated.
       Do not run the old formatter, completeness gate,
       citation gate, or retry logic here.
    ========================================== */

}/* =========================
   PROFILE ENGINE
========================= */
let profileData = null;
let profileWasUpdated = false;

if (loopLevel !== 7) {

const userMessages =
  messages
    .filter(message =>
      message?.role === "user" &&
      typeof message?.content === "string"
    )
    .map(message => message.content.trim())
    .filter(Boolean);

const currentMessage =
  lastUserMessage.trim();

const normalizedCurrentMessage =
  currentMessage
    .toLowerCase()
    .replace(/[.!?,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const acknowledgementWords = new Set([
  "yes",
  "yeah",
  "yep",
  "yup",
  "ok",
  "okay",
  "right",
  "exactly",
  "correct",
  "sure",
  "fine",
  "agreed",
  "haan",
  "ha",
  "ji",
  "hmm",
  "hm",
  "uh huh",
  "mm",
  "acha",
  "achha",
  "ठीक",
  "हाँ"
]);

/*
 * Only a message that is itself an acknowledgement is blocked.
 *
 * "Yeah"                -> blocked
 * "Exactly."            -> blocked
 * "Okay."               -> blocked
 *
 * But acknowledgement + any substantive/generic sentence remains
 * eligible for profile analysis:
 *
 * "Yeah, that makes sense."
 * "Exactly, I feel uncomfortable doing that."
 * "Okay, I keep repeating this."
 */
const acknowledgementOnly =
  currentMessage.length > 0 &&
  acknowledgementWords.has(
    normalizedCurrentMessage
  );

const substantiveEvidence =
  !acknowledgementOnly &&
  currentMessage.length >= 3;

console.log(
  "PROFILE_EVIDENCE_GATE",
  JSON.stringify({
    acknowledgementOnly,
    substantiveEvidence,
    currentMessageLength: currentMessage.length,
    userMessageCount: userMessages.length
  })
);

if (!substantiveEvidence) {

  console.log(
    "PROFILE_UPDATE_SKIPPED",
    JSON.stringify({
      reason:
        acknowledgementOnly
          ? "acknowledgement_only"
          : "empty_or_insufficient_message"
    })
  );

} else {

  console.log(
    "PROFILE_AI_START",
    JSON.stringify({
      profilePromptLength: profilePrompt.length,
      replyLength: reply.length,
      loopLevel,
      evidenceSource: "user_messages_only"
    })
  );

  /*
   * IMPORTANT:
   * Profile Engine receives recent USER messages, not the
   * assistant's generated reply.
   */
  const profileContext =
    userMessages
      .slice(-6)
      .map((message, index) =>
        `USER_EVIDENCE_${index + 1}: ${message}`
      )
      .join("\n\n");

let profileResponse;

try {
  profileResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " + process.env.GROQ_API_KEY
      },

      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: profilePrompt
          },
          {
            role: "user",
            content: profileContext
          }
        ],
        temperature: 0,
        max_tokens: 200,
        reasoning_effort: "none",
        response_format: {
          type: "json_object"
        }
      })
    }
  );

  
} catch (e) {
  console.error("PROFILE_AI_ERROR", e);
  return res.status(500).json({
    reply: "Profile Engine request failed.",
    error: e?.message || String(e),
    stage: "PROFILE_AI_FETCH"
  });
}

if (!profileResponse.ok) {
  const profileErrorBody = await profileResponse.text();
  console.log("PROFILE_GROQ_ERROR_BODY", profileErrorBody);
  return res.status(500).json({
    reply: "Profile Engine service failed.",
    error: profileErrorBody,
    stage: "PROFILE_AI_HTTP"
  });
}



 profileData =
  await profileResponse.json();

profileWasUpdated = true;

}
}
const contentLeakWords = [

"template",
"framework",
"storytelling template",
"blog outline",
"linkedin post",
"social media post",
"marketing copy",
"email draft",
"content calendar",
"step 1",
"step 2",
"step 3"

];

const contentLeakDetected =
  loopLevel !== 7 &&
  contentLeakWords.some(word =>
    reply.toLowerCase().includes(
      word.toLowerCase()
    )
  );

if(contentLeakDetected){

reply =
"Interesting. You moved from understanding the problem to creating an answer.\n\nWhat feels unfinished if the answer never gets created?";

}    
  
/* =========================
   PROFILE PARSE
========================= */

let primaryLoop = "unknown";
let emotionalDriver = "unknown";
let avoidanceStyle = "unknown";
let hiddenAssumption = "unknown";

/* =========================
   PROFILE PARSE
========================= */
if (profileData) {
  try {

    const rawProfile =
      profileData?.choices?.[0]?.message?.content || "{}";

    console.log(
      "PROFILE_RAW",
      rawProfile
    );

    const profile =
      JSON.parse(rawProfile);

    primaryLoop =
      profile.primaryLoop || "unknown";

    emotionalDriver =
      profile.emotionalDriver || "unknown";

    avoidanceStyle =
      profile.avoidanceStyle || "unknown";

    hiddenAssumption =
      profile.hiddenAssumption || "unknown";

} catch (e) {

  console.log(
    "PROFILE_RAW_RESPONSE",
    profileData?.choices?.[0]?.message?.content
  );
  }
      }
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
   LOOP RESPONSE GUARD
========================= */

if (loopLevel >= 6) {

  // Loop 6 & 7 par koi follow-up question allowed nahi
  reply = reply.replace(/\s*[^.!?\n]*\?\s*$/s, "");

}
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

      /*
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
*/
    }

/* =========================
   PROFILE UPDATE INVARIANT
========================= */
/*
 * Only substantive USER evidence may update the profile card.
 * Assistant replies are never profile evidence.
 * Short acknowledgements never confirm deeper beliefs.
 * When no update occurs, profile fields are omitted so the
 * frontend can preserve the previous valid profile.
 */

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

const finalEvidenceRegistry =
  loopLevel === 7
    ? (
        Array.isArray(investigationReport?.sourceRegistry)
          ? investigationReport.sourceRegistry
          : Array.isArray(publicEvidencePackage?.sourceRegistry)
            ? publicEvidencePackage.sourceRegistry
            : Array.isArray(publicEvidencePackage?.universalPackage?.sourceRegistry)
              ? publicEvidencePackage.universalPackage.sourceRegistry
              : []
      )
    : [];


const finalPayload = {
  analysis,
  question,
  reply,

  ...(loopLevel === 7
    ? {
        evidenceRegistry: finalEvidenceRegistry,
        loop7EvidenceRegistry: finalEvidenceRegistry,
        evidenceSourceRegistry: finalEvidenceRegistry,
        evidenceSourceIndex: finalEvidenceRegistry.map(({ sourceId, sourceType, title, url, date }) => ({
          sourceId,
          sourceType,
          title,
          url,
          date
        })),
        evidenceRegistryCount:
          finalEvidenceRegistry.length
      }
    : {}),

  ...(profileWasUpdated
    ? {
        primaryLoop,
        emotionalDriver,
        avoidanceStyle,
        hiddenAssumption
      }
    : {}),

  loop7EntryBridge:
    loopLevel === 6
      ? {
          enabled: true,
          recommended: true,
          allowSkip: true,
          supportedSources: [
            "Website",
            "LinkedIn"
          ]
        }
      : null,

  loopCompleted:
    loopLevel === 6 ? 6 : undefined,
  paywall: false
};

if (loop7StreamStarted) {
  sendLoop7Progress({
    type: "final",
    final: true,
    ...finalPayload
  });
  endLoop7ProgressStream();
  return;
}

return res.status(200).json(finalPayload);

  }

  catch (error) {

    if (loop7StreamStarted) {
      sendLoop7Progress({
        type: "error",
        phase: "server",
        message: "The investigation could not be completed.",
        error: error?.message || String(error),
        stage: "SERVER_CRASH"
      });
      endLoop7ProgressStream();
      return;
    }

    return res.status(500).json({

      reply:"SERVER CRASH",

      error:error.message,

      stack:error.stack

    });

  }
        }
