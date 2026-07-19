import {
    loadPublicContentFetcher,
    acquirePublicContent,
    validatePublicContent,
    cleanPublicContent,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";
/* ============================================================
   DIGITAL FOOTPRINT BRAIN

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
/* ============================================================
   KNOWLEDGE & CONTENT

   Mission

   Understand what the person publicly knows,
   teaches, creates and consistently shares.

   Collect

   • Content Pillars
   • Knowledge Depth
   • Expertise Areas
   • Writing / Teaching Style
   • Content Consistency

   Never

   • Guess expertise
   • Infer private knowledge
   • Create authority without evidence
   • Invent content themes

============================================================ */


/* ============================================================
   BUSINESS PRESENCE

   Mission

   Understand the person's public business
   footprint and market positioning.

   Collect

   • Products
   • Services
   • Target Audience
   • Business Model
   • Value Proposition
   • Company / Brand Positioning

   Never

   • Guess products
   • Invent business models
   • Create offers
   • Assume target audience

============================================================ */


/* ============================================================
   EVIDENCE QUALITY

   Mission

   Measure the strength, completeness and
   reliability of the collected public evidence.

   Collect

   • Evidence Coverage (%)
   • Confidence
   • Missing Evidence
   • Verification Status
   • Data Freshness
   • Source Count

   Never

   • Inflate confidence
   • Hide missing evidence
   • Ignore conflicting evidence
   • Fabricate verification

============================================================ */

export async function loadDigitalFootprintBrain({
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
            "Digital Footprint Brain is available only after Loop 6."

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
   // STEP 2.5
// Public Content Fetcher

const urlPackage =
    await loadPublicContentFetcher({
        url: normalizedProfileLink
    });

const rawPackage =
    await acquirePublicContent(urlPackage);

const validatedPackage =
    validatePublicContent(rawPackage);

const cleanPackage =
    cleanPublicContent(validatedPackage);

const extractedPackage =
    extractPublicContent(cleanPackage);

const publicContentPackage =
    buildPublicContentPackage(
        rawPackage,
        extractedPackage
    );

if (!publicContentPackage.success) {

    return {

        success: false,

        stage: "Public Content Fetcher",

        reason:
            publicContentPackage.reason

    };

}
   /* ==========================================
   STEP 3
   Platform Detector
========================================== */

const platformDecision =
    detectPlatform(normalizedProfileLink);

if (!platformDecision.supported) {

    return {

        success: false,

        stage: "Platform Detection",

        type: "platformCard",

        platform:
            platformDecision.platform,

        reason:
            platformDecision.reason,

        oauth:
            platformDecision.oauth,

        options:
            platformDecision.options

    };

       }
    // STEP 4
    // Profile Intelligence API
const profileEvidence =

    await ProfileIntelligenceAPI({

    publicContentPackage,

    truthLoopPackage,

    currentLoop,

    provider: "Cerebras"

});
if (!profileEvidence.success) {

    return profileEvidence;

       }
    // STEP 5
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
    // STEP 6
    // Return Evidence Package
return evidencePackage;
}
/* ==========================================
   Platform Detector
========================================== */

function detectPlatform(profileLink) {

    let hostname = "";

    try {

        hostname = new URL(profileLink)
            .hostname
            .replace(/^www\./, "")
            .toLowerCase();

    } catch {

        return {
            platform: "Unknown",
            supported: true
        };

    }

    const restrictedPlatforms = {

        "linkedin.com": {

            platform: "LinkedIn",

            supported: false,

            oauth: true,

            reason:
                "Direct LinkedIn profile analysis is currently unavailable.",

            options: [
                "Use another public website",
                "Connect with LinkedIn (coming soon)"
            ]

        }

    };

    return (

        restrictedPlatforms[hostname] || {

            platform: hostname,

            supported: true

        }

    );

}
async function ProfileIntelligenceAPI({

    publicContentPackage,

    truthLoopPackage,

    currentLoop,

    provider = "Cerebras"

}) {

    const intelligence = {

        success: false,

        provider,

        model: null,

        profileLink:
    publicContentPackage.url,

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
You are TruthLoop Digital Footprint Brain.

MISSION

Build one reusable public Evidence Package using only verified public information.

INPUTS

• TruthLoop Package
• Normalized Public Content Package

The Public Content Package may include:
• URL
• Title
• Description
• Headings
• Links
• Visible Text

Use the Public Content Package as the primary evidence source.
Never analyze the URL alone.
Use URLs only for attribution when evidence already exists.

CORE RULES

• Collect only publicly available evidence.
• Validate every claim before using it.
• Remove duplicate evidence.
• Normalize and compress evidence.
• Return one reusable Evidence Package.
• Return null when evidence is missing.
• Never guess, hallucinate, fabricate, or infer facts.
• Always prefer recent verified evidence.
PUBLIC EVIDENCE

Collect only verifiable public signals:

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
• Professional
• Communication
• Business
• Behavioral
• Reputation
• Credibility
• Expertise
• Community
• Media & Website

EVIDENCE COLLECTION

Default window: last 90 days.

If evidence is insufficient, expand gradually:
• 6 Months
• 12 Months
• Lifetime

Evidence Priority

1. Recent public activity
2. Official profiles
3. Official website
4. Verified media
5. Historical public evidence

Always use the highest-quality, most recent verified evidence.

VALIDATION

• Every claim must be supported by public evidence.
• Ignore unsupported or conflicting claims.
• Remove duplicate signals.
• Preserve evidence integrity.
• Keep evidence reusable.
CONFIDENCE

Confidence reflects evidence quality only.

100 = Official verified evidence
90 = Multiple trusted public sources
75 = Strong consistent evidence
50 = Limited verified evidence
25 = Weak evidence
0 = No verified evidence

Reduce confidence when evidence is weak, conflicting, outdated, or incomplete.

ACCESS RULE

A valid public profile or website URL is required.

Without a public link, return:

{
  "success": false,
  "reason": "A valid public profile or website link is required."
}

Never collect, search, infer, or generate profile evidence without a valid public URL.

SAFETY

• Never use private data.
• Never expose internal reasoning.
• Never generate GTM.
• Never generate advice.
• Never generate psychology analysis.
• Return only verified public evidence.


OUTPUT

Return valid JSON only.

Do not return:
• Markdown
• Explanations
• Code blocks
• Text outside JSON

The JSON must include these sections when evidence exists.

Knowledge & Content

{
  "contentPillars": [],
  "knowledgeDepth": "",
  "expertiseAreas": [],
  "writingStyle": "",
  "contentConsistency": ""
}

Business Presence

{
  "products": [],
  "services": [],
  "targetAudience": "",
  "businessModel": "",
  "valueProposition": "",
  "brandPositioning": ""
}

Evidence Quality

{
  "evidenceCoverage": "",
  "confidence": "",
  "missingEvidence": [],
  "verificationStatus": "",
  "dataFreshness": "",
  "sourceCount": 0
}

This brain exists only to build one reusable public Evidence Package for TruthLoop Main Brain.
`;
       const userPrompt = `

PUBLIC CONTENT PACKAGE

${JSON.stringify(publicContentPackage, null, 2)}

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
console.log(
    "CEREBRAS_RESPONSE",
    JSON.stringify(result, null, 2)
);
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

let parsedEvidence;

try {
    parsedEvidence = JSON.parse(rawEvidence);
} catch {
    parsedEvidence = {
        success: false,
        error: "Invalid public evidence JSON"
    };
}

const normalizedEvidence = {
    profileLink: profileEvidence.profileLink,
    collectedAt: profileEvidence.timestamp,
    provider: profileEvidence.provider,
    model: profileEvidence.model,

    publicEvidence: parsedEvidence,

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

    source: "DigitalFootprintBrain",

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
