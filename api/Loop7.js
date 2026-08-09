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

1️⃣ Investigation Summary

Purpose:

Summarize:

A. What the user repeatedly expressed
across Loop 1–6.

B. What verified public evidence
repeatedly suggests.

Do not analyze.
Do not explain patterns.
Do not explain contradictions.
Do not give conclusions.

Output:

⏩ User Narrative
Evidence: TruthLoop Package

⏩ Digital Footprint Narrative
Evidence: Real Source

⏩ Investigation Starting Point
Evidence: Real Source

Rules:

• Use repeated signals only
• Ignore one-time statements
• Maximum 3 bullets
• Every bullet requires evidence
• No assumptions
• No advice
• No hidden patterns
• No contradictions
Investigation Summary is not allowed
to reveal the final answer.

Its job is only to frame the case.

The investigation begins afterwards.
EXAMPLE DO NOT COPY THIS EXAMPLE ONLY UNDERSTAND 
1️⃣ Investigation Summary

⏩ User Narrative:
The user repeatedly expresses a desire
to build authority through TruthLoop AI,
attract the right audience,
and create meaningful long-term growth.

Evidence:
TruthLoop Conversation

⏩ Digital Footprint Narrative:
Public content consistently focuses on
behavioral patterns,
hidden mechanisms,
and decision-making psychology.

Evidence:
Website Content

⏩ Investigation Starting Point:
The user's stated goal and public content
appear aligned around pattern recognition,
but the relationship between effort,
consistency,
and growth remains unresolved.

Evidence:
TruthLoop Conversation + Website Content

2️⃣ Cross Analysis

Purpose:

Compare evidence sources.

Identify:

• Alignment
• Mismatch
• Missing Connection

Output:

⏩ Cross Evidence Finding
Evidence: Source A + Source B

⏩ Cross Evidence Finding
Evidence: Source A + Source B

⏩ Cross Evidence Finding
Evidence: Source A + Source B

Rules:

• 3 bullets only

• Compare multiple sources

• Evidence mandatory

• Use real evidence only

• No advice

• No conclusions

• No contradictions

• No hidden patterns
Cross Analysis answers:

"What do different evidence sources say when viewed together?"

It does NOT answer:

"Why does it happen?"

Example:

⏩ Content targets founders but audience engagement comes mainly from beginners.

Evidence:
Posts + Comments

⏩ Website messaging emphasizes pattern recognition while community discussions focus on growth problems.

Evidence:
Website + Community

⏩ Published content is consistent but audience questions repeatedly shift toward execution challenges.

Evidence:
Posts + Audience Responses

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

• 3 bullets only

• Evidence mandatory

• Use real evidence only

• Compare intent vs action

• Compare action vs outcome

• Compare stated goals vs observed behavior

• No advice

• No solutions

• No hidden patterns
Contradictions answers:

"What is not matching?"

It does NOT answer:

"Why is it not matching?"

Example:

⏩ The stated goal is building authority, but published content repeatedly changes direction across unrelated topics.

Evidence:
Posts + Website Content

⏩ The goal is audience growth, but most effort is invested in content creation rather than audience interaction.

Evidence:
Posts + Comments

⏩ Consistency is described as important, but activity appears in bursts followed by long gaps.

Evidence:
Timeline Activity

4️⃣ Strong Patterns

Purpose:

Identify repeated behaviors,
themes,
or signals strongly supported by evidence.

Output:

⏩ Strong Pattern
Evidence: Source

⏩ Strong Pattern
Evidence: Source

⏩ Strong Pattern
Evidence: Source

Rules:

• 3 bullets only

• Evidence mandatory

• Use real evidence only

• Pattern must appear repeatedly

• Pattern must be supported by multiple signals

• Ignore one-time events

• No advice

• No conclusions

• No hidden patterns

A Strong Pattern must satisfy:

Repeated
+
Observable
+
Evidence Supported

If any one is missing,
it is not a Strong Pattern.

Example:

⏩ Content repeatedly focuses on hidden mechanisms rather than surface-level advice.

Evidence:
Posts + Website Content

⏩ Audience engagement increases when pattern-recognition topics are discussed.

Evidence:
Posts + Comments

⏩ Problem diagnosis appears more frequently than solution-focused content.

Evidence:
Posts + Articles

5️⃣ Weak Patterns

Purpose:

Identify repeated behaviors,
habits,
or signals that consistently weaken growth,
consistency,
reach,
or outcomes.

Output:

⏩ Weak Pattern
Evidence: Source

⏩ Weak Pattern
Evidence: Source

⏩ Weak Pattern
Evidence: Source

Rules:

• 3 bullets only

• Evidence mandatory

• Use real evidence only

• Pattern must repeat

• Pattern must reduce growth or outcomes

• Ignore one-time events

• No advice

• No solutions

• No conclusions
A Weak Pattern must satisfy:

Repeated
+
Evidence Supported
+
Growth Limiting

If any one is missing,
it is not a Weak Pattern.

Example:

⏩ Topic focus repeatedly shifts before momentum becomes measurable.

Evidence:
Posts + Timeline

⏩ Audience interaction appears less consistent than content publishing activity.

Evidence:
Posts + Comments

⏩ Multiple directions compete for attention, reducing message clarity.

Evidence:
Website + Posts

6️⃣ Hidden Pattern

Purpose:

Identify the strongest hidden mechanism
connecting:

• Cross Analysis

• Contradictions

• Strong Patterns

• Weak Patterns

Output:

⏩ Hidden Pattern

Evidence: Source

⏩ Hidden Pattern Impact

Evidence: Source

⏩ Hidden Pattern Result

Evidence: Source

Rules:

• 3 bullets only

• Evidence mandatory

• Use real evidence only

• Must explain multiple findings

• Must connect repeated evidence

• Must explain observed outcomes

• No advice

• No solutions

• No conclusions
A Hidden Pattern must satisfy:

Evidence Supported
+
Explains Multiple Findings
+
Explains Outcomes

If any one is missing,
it is not a Hidden Pattern.
Example:

⏩ Growth effort repeatedly expands into multiple directions before a single direction becomes measurable.

Evidence:
Posts + Timeline + Website

⏩ This creates recurring focus fragmentation across content, audience, and positioning.

Evidence:
Cross Analysis + Contradictions

⏩ As a result, effort remains high while measurable momentum remains inconsistent.

Evidence:
Timeline + Outcomes

7️⃣ Final Investigation

A. Conclusion

Purpose:

Deliver the final investigation verdict.

Output:

⏩ Conclusion

Evidence: Source

⏩ Conclusion

Evidence: Source

Rules:

• 2 bullets only

• Evidence mandatory

• Use real evidence only

• Must be supported by previous findings

• No new findings

• No assumptions

• No motivation

━━━━━━━━━━━━━━━━━━━━

B. One Next Step

Purpose:

Identify the single highest-impact action
based on the investigation.

Output:

⏩ One Next Step

Evidence: Source

Rules:

• 1 bullet only

• Evidence mandatory

• Must address the strongest constraint

• Must be supported by findings

• Must be specific

• No generic advice

Example:

⏩ Commit to one primary content direction for the next 30 days before introducing new themes.

Evidence:
Weak Patterns + Hidden Pattern

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
