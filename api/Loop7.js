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

2. Public Evidence Package
   (digital footprint evidence)

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

${
  publicEvidencePackage
    ? JSON.stringify(publicEvidencePackage, null, 2)
    : "Not Available"
}

Rules:

• Evidence may come from multiple sources

• Do not prioritize one source automatically

• Find repeated signals across sources

• Use evidence, not assumptions
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
