/* ============================================================
   PROFILE SYSTEM BRAIN

   Mission

   Build one verified public evidence package.

   Inputs

   • TruthLoop Package
   • Public Profile / Website Link

   Responsibilities

   • Collect real public signals
   • Normalize evidence
   • Validate evidence
   • Refine evidence
   • Compress evidence
   • Build one Evidence Package

   Never

   • Guess
   • Generate opportunities
   • Generate GTM
   • Give advice
   • Create stories
   • Use private data

   Output

   One verified Evidence Package.

   This package is available only after Loop 6
   and can only be requested by TruthLoop Main Brain
   during Loop 7.

============================================================ */

export async function loadProfileSystemBrain({

    truthLoopPackage = {},

    profileLink = "",

    currentLoop = 7

} = {}) {

    // STEP 1
    // Security
if (currentLoop !== 7) {

    return {

        success: false,

        stage: "Security",

        reason:
            "Profile System Brain is available only after Loop 6."

    };

}
    // STEP 2
    // Input Validation
if (
    typeof profileLink !== "string" ||
    !profileLink.trim()
) {

    return {

        success: false,

        stage: "Input Validation",

        reason: "Public profile or website link is required."

    };

}

const normalizedProfileLink =
    profileLink.trim();
    // STEP 3
    // Profile Intelligence API
const profileEvidence =

    await ProfileIntelligenceAPI({

        profileLink:
            normalizedProfileLink,

        truthLoopPackage,

        currentLoop,

        provider: "Cerebras"

    });

if (!profileEvidence.success) {

    return profileEvidence;

       }
    // STEP 4
    // Profile Main Brain
const evidencePackage =

    await ProfileMainBrain({

        profileEvidence,

        truthLoopPackage,

        currentLoop

    });

if (!evidencePackage.success) {

    return evidencePackage;

   }
    // STEP 5
    // Return Evidence Package
return evidencePackage;
}
async function ProfileIntelligenceAPI({

    profileLink,

    truthLoopPackage,

    currentLoop,

    provider = "Cerebras"

}) {

    const intelligence = {

        success: false,

        provider,

        model: null,

        profileLink,

        timestamp:

            new Date().toISOString(),

        rawResponse: null,

        evidence: null,

        errors: []

    };

    try {

const model = "gpt-oss-120b";

const endpoint =
    "https://api.cerebras.ai/v1/chat/completions";

intelligence.model = model;

const systemPrompt = `
You are TruthLoop Profile System Brain.

MISSION

Build one verified public evidence package from publicly available profile signals.

INPUTS

• TruthLoop Package
• Public Profile or Website Link

CORE RESPONSIBILITIES

1. Collect only publicly available evidence.
2. Validate every signal before using it.
3. Remove duplicate evidence.
4. Normalize all evidence into one structure.
5. Refine weak evidence.
6. Compress evidence without losing meaning.
7. Return one reusable Evidence Package.

PUBLIC SIGNALS TO COLLECT

• Identity
• Career
• Activity
• Content
• Audience
• Authority
• Trust
• Position
• Timeline
• Consistency
• Professional Signals
• Communication Signals
• Business Signals
• Behavioral Signals
• Business & Career Relationship Signals
• Reputation Signals
• Credibility Signals
• Expertise Signals
• Community Signals
• Media & Website Signals

COLLECTION WINDOW

Default collection period is the most recent 90 days.

If reliable evidence is insufficient,
gradually expand to:

• 6 Months
• 12 Months
• Lifetime (only when necessary)

Always prefer the most recent evidence.

Recent evidence has higher priority than historical evidence.

Never use old evidence when newer verified evidence is available.
EVIDENCE PRIORITY
If evidence is unavailable,

do not guess.

Return null.

Never fabricate missing fields.

Missing evidence is acceptable.

False evidence is unacceptable.
Priority 1
Recent public activity (last 90 days)

Priority 2
Official profile information

Priority 3
Official website

Priority 4
Verified media mentions

Priority 5
Historical public evidence
VALIDATION RULES

• Every claim must be supported by public evidence.
• Never assume missing information.
• Ignore unsupported claims.
• Remove duplicated signals.
• Prefer recent evidence over outdated evidence.
• Keep confidence high.
• Keep evidence reusable.
CONFIDENCE RULES

Confidence must always be evidence-based.

100
Official verified evidence.

90
Multiple independent public sources agree.

75
Strong public evidence with high consistency.

50
Limited or partially verified public evidence.

25
Weak or insufficient public evidence.

0
No verified public evidence.

Never increase confidence without supporting evidence.

Confidence must decrease when evidence is weak, inconsistent, outdated, or incomplete.

Always explain why confidence changed.

Confidence is calculated from evidence quality,
not from assumptions.
MISSING EVIDENCE RULES

If evidence is unavailable,

Return null.

Never guess.

Never fabricate missing information.

Missing evidence is acceptable.

False evidence is unacceptable.

Always distinguish between:

• Verified
• Unverified
• Missing
• Conflicting

Never hide uncertainty.

Always preserve evidence integrity.
NEVER

• Never guess.
• Never hallucinate.
• Never invent facts.
• Never create stories.
• Never generate GTM.
• Never generate advice.
• Never generate psychology analysis.
• Never use private data.
• Never expose internal reasoning.
ACCESS RULE

Never collect, generate, infer, estimate, or return any profile evidence unless a valid public profile link, website URL, or other publicly accessible profile URL is explicitly provided.

Without a public link:

• Do not start evidence collection.
• Do not search.
• Do not guess.
• Do not infer identity.
• Do not build an Evidence Package.
• Do not send any profile data to TruthLoop Main Brain.

Instead, return:

{
  "success": false,
  "reason": "A valid public profile or website link is required."
}
OUTPUT

Return ONLY valid JSON.

Never return markdown.

Never return explanations.

Never return code blocks.

Never return text outside JSON.

The JSON schema is mandatory.

This brain exists only to build one reusable public Evidence Package for TruthLoop Main Brain.
`;
       const userPrompt = `
PROFILE LINK

${profileLink}

CURRENT LOOP

${currentLoop}

TRUTHLOOP PACKAGE

${JSON.stringify(truthLoopPackage, null, 2)}
`;

const requestBody = {

    model,

    messages: [

        {
            role: "system",
            content: systemPrompt
        },

        {
            role: "user",
            content: userPrompt
        }

    ],

    temperature: 0.1,

    response_format: {
        type: "json_object"
    }

};
       const response = await fetch(endpoint, {

    method: "POST",

    headers: {

        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${process.env.CEREBRAS_API_KEY}`

    },

    body: JSON.stringify(requestBody)

});

if (!response.ok) {

    intelligence.errors.push(

        `HTTP ${response.status}`

    );

    return intelligence;

}

const result = await response.json();
intelligence.rawResponse = result;

const content =
    result?.choices?.[0]?.message?.content;

if (!content) {

    intelligence.errors.push(
        "No response content returned."
    );

    return intelligence;

}

intelligence.evidence = content;

intelligence.success = true;

return intelligence;

    }

    catch (error) {

        intelligence.errors.push(

            error.message

        );

        return intelligence;

    }

}

async function ProfileMainBrain({

    profileEvidence,

    truthLoopPackage,

    currentLoop

}) {

    const evidencePackage = {

        success: false,

        timestamp:
            new Date().toISOString(),

        profileLink:
            profileEvidence.profileLink,

        evidence: {},

        errors: []

    };

    try {

        /* ==========================================
   STEP 1
   Receive Profile Evidence
========================================== */

const rawEvidence =

    profileEvidence.evidence;

if (!rawEvidence) {

    throw new Error(

        "No public profile evidence received."

    );

}

        /* ==========================================
   STEP 2
   Validate Evidence
========================================== */

if (

    typeof rawEvidence !== "string"

) {

    throw new Error(

        "Invalid evidence format."

    );

}

if (

    !rawEvidence.trim()

) {

    throw new Error(

        "Evidence is empty."

    );

   }

        /* ==========================================
   STEP 3
   Normalize Evidence
========================================== */

const normalizedEvidence = {

    profileLink:
        profileEvidence.profileLink,

    collectedAt:
        profileEvidence.timestamp,

    provider:
        profileEvidence.provider,

    model:
        profileEvidence.model,

    publicEvidence:
        rawEvidence.trim(),

    truthLoopPackage

};

        /* ==========================================
   STEP 4
   Refine Evidence
========================================== */

const refinedEvidence = {

    mission:
        "Build one verified public evidence package.",

    rules: [

        "Collect public evidence only.",

        "Never guess.",

        "Never invent information.",

        "Validate every signal.",

        "Normalize duplicate evidence.",

        "Remove weak evidence.",

        "Keep only reusable evidence.",

        "Evidence first. Conclusions later."

    ],

    evidence:
        normalizedEvidence

};

        /* ==========================================
   STEP 5
   Compress Evidence
========================================== */

evidencePackage.evidence = {

    source: "ProfileSystemBrain",

    provider:
        normalizedEvidence.provider,

    profileLink:
        normalizedEvidence.profileLink,

    collectedAt:
        normalizedEvidence.collectedAt,

    evidence:
        refinedEvidence.evidence,

    rules:
        refinedEvidence.rules

};

evidencePackage.success = true;

return evidencePackage;

        
    }

    catch (error) {

        evidencePackage.errors.push(
            error.message
        );

        return evidencePackage;

    }

   }
