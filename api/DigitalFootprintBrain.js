import {
    loadPublicContentFetcher,
    acquirePublicContent,
    validatePublicContent,
    cleanPublicContent,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";
import {
    loadFootprintSupport
} from "./FootprintSupport.js";
/* ============================================================
   DIGITAL FOOTPRINT BRAIN

   
Mission

Build one verified Universal Evidence Package.

The source is never the investigation target.

The evidence is always the investigation target.

   Inputs

• TruthLoop Package
• One or more Evidence Sources

Evidence Sources may include:

• Public Website
• Public Profile
• OAuth Connection
• PDF
• DOCX
• Spreadsheet
• CSV
• Images
• OCR
• Business Records
• Financial Reports
• Chat History
• Future Evidence Adapters
   
   • Discover every available evidence source
• Collect every measurable evidence signal
• Normalize evidence
• Validate evidence
• Cross-link evidence
• Preserve numerical and relationship data
• Compress evidence
• Build one Universal Evidence Package
   
   Never

   • Guess
   • Generate opportunities
   • Generate GTM
   • Give advice
   • Create stories
   • Use private data
   • Never ignore measurable evidence.
• Never stop while usable evidence remains.
• Never prioritize platforms over evidence.
• Never let source type change investigation quality.

   Output

One verified Universal Evidence Package.

   This package is available only after Loop 6
   and can only be requested by TruthLoop Main Brain
   during Loop 7.

============================================================ */

export async function loadDigitalFootprintBrain({

    truthLoopPackage = {},

    profileLink = "",

    identityPackage = null,

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
const hasProfileLink =
    typeof profileLink === "string" &&
    profileLink.trim();

const hasIdentityPackage =
    identityPackage &&
    typeof identityPackage === "object";

if (
    !hasProfileLink &&
    !hasIdentityPackage
) {

    return {

        success: false,

        stage: "Input Validation",

        reason:
            "A public profile link or authenticated profile is required."

    };

}

const normalizedProfileLink =
    hasProfileLink
        ? profileLink.trim()
        : "";
    const footprintContextPackage =
    await loadFootprintSupport({

        truthLoopPackage,

        profileLink:
            normalizedProfileLink,

        currentLoop

    });

if (!footprintContextPackage.success) {

    return footprintContextPackage;

}
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
==========================================

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

*/
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

            supported: true,

            oauth: false,

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

Build one verified Universal Evidence Package from every available evidence source.

The investigation target is always the evidence, never the platform.

Every source is treated as an Evidence Adapter.

Convert every available source into structured, verified, reusable evidence while preserving evidence integrity.

INPUTS

TruthLoop Package

Normalized Evidence Package

The Evidence Package may originate from one or more Evidence Adapters including:

• Public Website
• Public Profile
• OAuth Connection
• PDF
• DOCX
• Spreadsheet
• CSV
• Images
• OCR
• Business Records
• Financial Reports
• Chat History
• Future Evidence Adapters

Treat every source equally.

Never allow source type to change investigation quality.

UNIVERSAL EVIDENCE TYPES

Collect every measurable evidence signal that can be verified.

Examples include:

• Identity Evidence
• Activity Evidence
• Communication Evidence
• Content Evidence
• Business Evidence
• Financial Evidence
• Operational Evidence
• Product Evidence
• Inventory Evidence
• Timeline Evidence
• Relationship Evidence
• Performance Evidence
• Authority Evidence
• Reputation Evidence
• Document Evidence
• Numerical Evidence
• Cross Evidence
• Missing Evidence
• Conflicting Evidence

Never force every category to exist.

Return null when verified evidence is unavailable.

CORE RESPONSIBILITIES

1. Discover every available evidence source.
2. Collect every measurable evidence signal.
3. Verify every claim before using it.
4. Normalize evidence into one reusable structure.
5. Remove duplicate evidence.
6. Preserve entities, relationships, timelines and numerical data.
7. Cross-link related evidence.
8. Compress evidence without losing meaning.
9. Build one reusable Universal Evidence Package.

Evidence first.

Conclusions later.

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

Priority 1

Direct verified evidence.

Priority 2

Multiple independent sources agree.

Priority 3

Official records or authoritative sources.

Priority 4

Consistent historical evidence.

Priority 5

Weak or incomplete evidence.

Never increase confidence without supporting evidence.

Confidence is determined by evidence quality, consistency and verification, never by source popularity.

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

ACCESS RULE

Never begin evidence collection without at least one valid Evidence Source.

A valid Evidence Source may include:

• Public Website
• Public Profile
• OAuth Connection
• PDF
• DOCX
• Spreadsheet
• CSV
• Image
• OCR
• Business Records
• Financial Reports
• Chat History
• Future Evidence Adapters

Without a valid Evidence Source:

• Do not collect evidence.
• Do not guess.
• Do not infer.
• Do not fabricate.
• Do not build a Universal Evidence Package.
• Do not send evidence to TruthLoop Main Brain.

Return:

{
  "success": false,
  "reason": "A valid Evidence Source is required."
}

OUTPUT

Return ONLY valid JSON.

Never return markdown.

Never return explanations.

Never return code blocks.

Never return text outside JSON.

The JSON schema is mandatory.

Return one reusable, verified Universal Evidence Package.

The package must preserve:

• Evidence
• Sources
• Business Relationships
• Timelines
• Numerical Data
• Confidence
• Missing Evidence
• Conflicting Evidence

This brain exists only to build one reusable Universal Evidence Package for TruthLoop Main Brain.

Evidence first.

Conclusions later.
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

        "No verified evidence received."

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
        error: "Invalid Universal Evidence JSON"
    };
}

const normalizedEvidence = {

    packageType: "UniversalEvidencePackage",

    profileLink: profileEvidence.profileLink,

    collectedAt: profileEvidence.timestamp,

    provider: profileEvidence.provider,

    model: profileEvidence.model,

    universalEvidence: parsedEvidence,

    truthLoopPackage

};

        /* ==========================================
   STEP 4
   Refine Evidence
========================================== */

const refinedEvidence = {

    mission:
"Build one verified Universal Evidence Package."

    rules: [

"Discover every available evidence source.",

"Collect every measurable evidence signal.",

"Validate every claim.",

"Normalize duplicate evidence.",

"Cross-link related evidence.",

"Preserve entities, relationships, timelines and numerical data.",

"Keep only reusable evidence.",

"Evidence first.",

"Conclusions later."

],

    evidence:
        normalizedEvidence

};

        /* ==========================================
   STEP 5
   Compress Evidence
========================================== */

evidencePackage.evidence = {

    packageType: "UniversalEvidencePackage",

    source: "DigitalFootprintBrain",

    provider: normalizedEvidence.provider,

    profileLink: normalizedEvidence.profileLink,

    collectedAt: normalizedEvidence.collectedAt,

    evidence: refinedEvidence.evidence,

    rules: refinedEvidence.rules

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
