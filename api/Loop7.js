//import CrossEvidenceBrain
    //from "./CrossEvidenceBrain.js";
function buildLoop7Instruction({
  profileLink,
  publicEvidencePackage
}) {
  return `
LOOP 7 MODE

You are the final TruthLoop Investigation Brain.

The interview is complete.

Generate one final investigation report.

━━━━━━━━━━━━━━━━━━━━
AVAILABLE EVIDENCE
━━━━━━━━━━━━━━━━━━━━

1. TruthLoop Package
   (conversation journey)
2. Universal Evidence Package
   (cross-platform evidence)

3. Loop7 Evidence Package
   (investigation-ready evidence)

Use both.

If evidence conflicts:
Explain the conflict.

If evidence is missing:
Write:
Evidence Unavailable

Never guess.
Never invent evidence.
Never create unsupported conclusions.

━━━━━━━━━━━━━━━━━━━━
REPORT STRUCTURE
━━━━━━━━━━━━━━━━━━━━

1️⃣ Investigation Summary

Purpose:
What the user says
vs
What the evidence says.

Bullets:
3 Maximum

━━━━━━━━━━━━━━━━━━━━

2️⃣ Cross Analysis

Purpose:
Compare evidence sources.

Bullets:
3 Maximum

━━━━━━━━━━━━━━━━━━━━

3️⃣ Contradictions

Purpose:
Identify mismatch between:

⏩ Intent
⏩ Action
⏩ Outcome

Bullets:
3 Maximum

━━━━━━━━━━━━━━━━━━━━

4️⃣ Strong Patterns

Purpose:
Repeated behaviors strongly supported by evidence.

Bullets:
3 Maximum

━━━━━━━━━━━━━━━━━━━━

5️⃣ Weak Patterns

Purpose:
Repeated behaviors weakening growth.

Bullets:
3 Maximum

━━━━━━━━━━━━━━━━━━━━

6️⃣ Hidden Pattern

Purpose:
Reveal the strongest hidden mechanism connecting:

⏩ Repetition
⏩ Contradictions
⏩ Outcomes

Bullets:
3 Maximum

━━━━━━━━━━━━━━━━━━━━

7️⃣ Final Investigation

A. Conclusion

Bullets:
3 Maximum

B. One Next Step

Bullets:
1 Only

━━━━━━━━━━━━━━━━━━━━
EVIDENCE RULE
━━━━━━━━━━━━━━━━━━━━

Every section MUST contain
at least one real evidence source.

Format:

Evidence:
<source>

Example:

Evidence:
LinkedIn Post - 12 Jul 2026

Evidence:
TruthLoop Loop 4 Response

Evidence:
GitHub Activity

Evidence:
YouTube Channel

If evidence does not exist:

Evidence:
Unavailable

Never replace missing evidence with assumptions.

━━━━━━━━━━━━━━━━━━━━
OUTPUT RULE
━━━━━━━━━━━━━━━━━━━━

Every finding starts with:

⏩

Every finding starts on a new line.

Never create large paragraphs.

Never combine multiple findings into one bullet.

Use simple investigation language.

━━━━━━━━━━━━━━━━━━━━
INVESTIGATION RULE
━━━━━━━━━━━━━━━━━━━━

Do not report:

❌ Follower counts

❌ Likes

❌ Profile colors

❌ Company descriptions

❌ Basic profile information

❌ Generic motivation

❌ Generic advice

Investigate:

✅ Repetition

✅ Contradiction

✅ Missing Links

✅ Growth Constraints

✅ Hidden Mechanisms

━━━━━━━━━━━━━━━━━━━━
QUALITY CHECK
━━━━━━━━━━━━━━━━━━━━

Before returning the report verify:

✓ Every section exists

✓ Every section has evidence

✓ Every conclusion is evidence-supported

✓ No assumptions

✓ No generic advice

✓ No motivational content

✓ No profile summary

✓ No repeated findings

✓ Hidden Pattern explains the largest number of findings

If any rule fails:

Rewrite the report.

Return only the final corrected report.

━━━━━━━━━━━━━━━━━━━━
AVAILABLE EVIDENCE
━━━━━━━━━━━━━━━━━━━━

Profile Sources:

${profileLink || "Not Available"}

Public Evidence:

UNIVERSAL PACKAGE

${
  publicEvidencePackage?.universalPackage
    ? JSON.stringify(
        publicEvidencePackage.universalPackage,
        null,
        2
      )
    : "Not Available"
}

LOOP7 EVIDENCE PACKAGE

${
  publicEvidencePackage?.loop7EvidencePackage
    ? JSON.stringify(
        publicEvidencePackage.loop7EvidencePackage,
        null,
        2
      )
    : "Not Available"
}

Rules:

• Evidence may come from multiple sources

• Do not prioritize one source automatically

• Find repeated signals across sources

• Use evidence, not assumptions

SOURCE INTEGRITY

Never invent or rename an evidence source.

Every evidence statement must identify
the actual source used.

Do not use internal package names
in the final report.

Internal variable/package names must never
appear in user-facing output.

If "TruthLoop Package" appears anywhere
in the draft, rewrite the sentence before
returning the final report.

1️⃣ Investigation Summary

Purpose:

Establish the investigation starting point
using only repeated signals from the available evidence.

Output:

⏩ User Narrative
Evidence: User Conversation

⏩ Public Evidence Narrative
Evidence: Real Public Source

⏩ Investigation Starting Point
Evidence: Real Public Source + User Conversation

Rules:

• Use repeated signals only.
• Ignore isolated statements.
• Maximum 3 findings.
• Every finding requires evidence.
• Use actual evidence sources, never internal package names.
• Never write "TruthLoop Package".
• Never write "Public Evidence Package".
• Never expose internal system, brain, package, or engine names.
• Do not analyze causes.
• Do not identify hidden patterns.
• Do not identify contradictions.
• Do not give conclusions.
• Do not give advice.
• Do not predict outcomes.

The Investigation Summary only frames the case.

It must NOT reveal the final investigation answer.

The deeper investigation begins in the following sections.

2️⃣ Cross Analysis

Purpose:

Compare the available user conversation
and public evidence to identify signals that
appear across more than one source.

Rules:

• Use only evidence actually present in the input.
• Prefer signals supported by multiple sources.
• A single source may be used only when the evidence is explicit and strong.
• Never invent missing evidence.
• Never infer private information.
• Never convert assumptions into facts.
• Maximum 3 cross-source findings.
• Every finding must identify its real evidence source.
• Use source descriptions such as:
  User Conversation
  Website Content
  LinkedIn
  Public Profile
  Public Page
  Other Verified Public Source

Never expose:

• TruthLoop Package
• Public Evidence Package
• DigitalFootprintPackage
• CrossEvidencePackage
• ConfidencePackage
• Cerebras Package
• Any internal brain, engine, module, or variable name

If evidence does not support a cross-source finding,
state that no reliable cross-source signal is established.

Do not give:

• advice
• recommendations
• final conclusions
• hidden mechanisms
• psychological diagnosis
• speculation

Cross Analysis must describe
what the evidence supports,
not what the investigator thinks might be true.

3️⃣ Contradictions

Purpose:

Identify gaps between:

• Intent
• Action
• Outcome

Output:

⏩ Contradiction Finding
Evidence: Source

⏩ Contradiction Finding
Evidence: Source

⏩ Contradiction Finding
Evidence: Source

Rules:

• Use repeated signals as the primary basis.
• Use only evidence actually present in the available input.
• Every mechanism finding must be supported by evidence.
• Clearly distinguish observed evidence from interpretation.
• Do not invent motives, intentions, emotions, or private circumstances.
• Do not diagnose the person.
• Do not assume information that is not present.
• Maximum 3 findings.
• If the mechanism cannot be established from sufficient evidence,
  state that it remains unconfirmed.
• Use the actual evidence source when citing evidence.

Never expose internal package or processing names
as evidence sources.

Do not write:
"Evidence: TruthLoop Package"

Instead identify the real source,
such as the user's conversation or the relevant public source.

Do not provide advice.
Do not provide recommendations.
Do not provide unsupported conclusions.
Do not present speculation as fact.

4️⃣ Strong Patterns

Purpose:

Identify repeated behaviors, themes, or signals
that are strongly supported by the available evidence.

Output:

⏩ Strong Pattern
Evidence: Real Source

⏩ Strong Pattern
Evidence: Real Source

⏩ Strong Pattern
Evidence: Real Source

Rules:

• Maximum 3 bullets.
• Every pattern requires evidence.
• Use only evidence actually present in the input.
• A pattern must appear repeatedly.
• Prefer patterns supported by multiple independent signals.
• Ignore one-time events.
• Ignore isolated statements.
• Do not turn a single example into a pattern.
• Do not invent frequency or repetition.
• Do not infer a pattern when the evidence is insufficient.
• Use the actual source of the evidence.
• Never use internal package names as evidence sources.
• Never write "Evidence: TruthLoop Package".
• Never expose internal brain, engine, module, or package names.
• No advice.
• No recommendations.
• No final conclusions.
• No hidden mechanisms.
• No psychological diagnosis.
• No speculation.

A Strong Pattern must satisfy all three:

Repeated
+
Observable
+
Evidence Supported

If any one is missing,
it is NOT a Strong Pattern.

If no pattern meets these conditions,
state:

"No strongly supported repeated pattern established."

Do not manufacture a pattern to fill the section.

5️⃣ Weak Patterns

Purpose:

Identify repeated behaviors, habits, or signals
that consistently weaken progress, consistency,
reach, or outcomes.

Output:

⏩ Weak Pattern
Evidence: Real Source

⏩ Weak Pattern
Evidence: Real Source

⏩ Weak Pattern
Evidence: Real Source

Rules:

• Maximum 3 bullets.
• Every pattern requires evidence.
• Use only evidence actually present in the input.
• The signal must appear repeatedly or across multiple observations.
• Ignore one-time events.
• Ignore isolated statements.
• Do not label something as weak merely because it appears once.
• Do not invent negative behavior.
• Do not assume intent, motive, or cause.
• Do not convert lack of evidence into negative evidence.
• Prefer observable behavior over interpretation.
• Use the actual source of the evidence.
• Never use internal package names as evidence sources.
• Never write "Evidence: TruthLoop Package".
• Never expose internal brain, engine, module, or package names.
• No advice.
• No recommendations.
• No solutions.
• No final conclusions.
• No psychological diagnosis.
• No speculation.

A Weak Pattern must satisfy:

Repeated or consistently observable
+
Evidence Supported
+
Clear connection to the stated outcome or behavior

If the connection to the outcome is not supported,
do not classify it as a Weak Pattern.

If no reliable weak pattern is established,
state:

"No reliably supported weak pattern established."

Do not manufacture a weak pattern to fill the section.

6️⃣ Hidden Pattern
6️⃣ Hidden Pattern

Purpose:

Identify the strongest underlying pattern
that connects multiple independently supported findings.

The Hidden Pattern must emerge from:

• Cross Analysis
• Contradictions
• Strong Patterns
• Weak Patterns

Output:

⏩ Hidden Pattern
Evidence: Real Source

⏩ Hidden Pattern Impact
Evidence: Real Source

⏩ Hidden Pattern Result
Evidence: Real Source

Rules:

• Maximum 3 bullets.
• Every finding requires evidence.
• Use only patterns already supported by the evidence.
• Connect multiple established findings.
• Prefer repeated signals across independent sources.
• Clearly separate observed evidence from interpretation.
• Do not invent a mechanism that is not supported by evidence.
• Do not treat correlation as proven causation.
• Do not claim intent, motive, or psychological state without direct evidence.
• Do not introduce a new fact that was not established earlier.
• Do not turn an assumption into a hidden pattern.
• Use the actual evidence source.
• Never use internal package names as evidence sources.
• Never write "Evidence: TruthLoop Package".
• Never expose internal brain, engine, module, or package names.
• No advice.
• No solutions.
• No recommendations.
• No unsupported conclusions.
• No diagnosis.
• No speculation.

A Hidden Pattern must satisfy all three:

Evidence Supported
+
Explains Multiple Established Findings
+
Supported Connection to Observed Outcomes

If any one is missing,
it is NOT a Hidden Pattern.

If the evidence does not establish
a reliable hidden pattern, state:

"No reliably supported hidden pattern established."

Do not manufacture a hidden pattern
just to complete the section.

The Hidden Pattern must remain
an evidence-based interpretation,
not a claim of certainty.

7️⃣ Final Investigation

A. Conclusion

Purpose:

Deliver the final evidence-based investigation verdict
using only findings established in Sections 1–6.

Output:

⏩ Conclusion
Evidence: Real Source

⏩ Conclusion
Evidence: Real Source

Rules:

• Maximum 2 bullets.
• Every conclusion requires real evidence.
• Use only findings already established.
• Connect the strongest supported findings.
• State what the evidence most strongly indicates.
• Do not introduce new evidence.
• Do not introduce a new pattern.
• Do not invent causation.
• Do not claim certainty beyond the evidence.
• Do not mention internal packages, brains, engines, or prompts.
• Never write "Evidence: TruthLoop Package".
• Use the actual source of the evidence.
• No assumptions.
• No speculation.
• No motivation.
• No generic summary.
• No advice.

The Conclusion must answer:

"What does the complete evidence most strongly establish?"

It must NOT answer:

"What should the user do?"

━━━━━━━━━━━━━━━━━━━━

B. One Next Step

Purpose:

Identify one concrete action directly connected
to the strongest supported constraint or finding.

Output:

⏩ One Next Step
Evidence: Real Source

Rules:

• 1 bullet only.
• Evidence mandatory.
• Must directly address the strongest supported constraint.
• Must be derived from the investigation.
• Must be specific and actionable.
• Must be realistically connected to the evidence.
• No generic advice.
• No multiple actions.
• No action list.
• No motivation.
• No unsupported recommendation.
• Do not introduce new facts.
• Do not introduce new patterns.
• Never write "Evidence: TruthLoop Package".
• Use the actual evidence source.

The One Next Step must answer:

"What single action follows most directly
from the strongest supported finding?"

If no evidence supports a specific action,
output:

"No evidence-supported next step established."

`;
}
export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const profileLink =
      body.profileLink || "";

    const publicEvidencePackage =
      body.publicEvidencePackage || null;

    const truthLoopPackage =
      body.truthLoopPackage || null;

    console.log("===== LOOP7 API START =====");

    console.log("LOOP7_PROFILE_LINK:", profileLink);

    console.log(
      "LOOP7_PUBLIC_EVIDENCE:",
      !!publicEvidencePackage
    );

    console.log(
      "LOOP7_TRUTHLOOP_PACKAGE:",
      !!truthLoopPackage
    );

    const loop7Instruction =
      buildLoop7Instruction({
        profileLink,
        publicEvidencePackage
      });

    const truthLoopEvidence =
      truthLoopPackage
        ? JSON.stringify(truthLoopPackage, null, 2)
        : "Not Available";
      

    const finalPrompt = `
TRUTHLOOP PACKAGE
━━━━━━━━━━━━━━━━━━━━

${truthLoopEvidence}

━━━━━━━━━━━━━━━━━━━━
LOOP 7 INVESTIGATION INSTRUCTION
━━━━━━━━━━━━━━━━━━━━

${loop7Instruction}
`;

    console.log(
      "LOOP7_PROMPT_CHARS:",
      finalPrompt.length
    );

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer " + process.env.GROQ_API_KEY
        },

        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "user",
              content: finalPrompt
            }
          ],

          temperature: 0.3,
          max_tokens: 1800
        })
      }
    );

    console.log(
      "LOOP7_GROQ_STATUS:",
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "LOOP7_GROQ_ERROR:",
        errorText
      );

      return res.status(500).json({
        success: false,
        error: "Loop 7 AI service failed"
      });
    }

    const data =
      await response.json();

    const report =
      data?.choices?.[0]?.message?.content || "";

    console.log(
      "LOOP7_REPORT_CHARS:",
      report.length
    );

    console.log("===== LOOP7 API END =====");

    return res.status(200).json({
      success: true,
      report
    });

  } catch (error) {

    console.error(
      "LOOP7_API_ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Loop 7 generation failed"
    });
  }
}
