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
    businessData = "",
    otherEvidence = "",

    uploadedFiles = [],
    connectedApps = null,

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

const hasBusinessData =
    typeof businessData === "string" &&
    businessData.trim();

const hasOtherEvidence =
    typeof otherEvidence === "string" &&
    otherEvidence.trim();

const hasUploadedFiles =
    Array.isArray(uploadedFiles) &&
    uploadedFiles.length > 0;

const hasConnectedApps =
    !!connectedApps;

const hasIdentityPackage =
    identityPackage &&
    typeof identityPackage === "object";
/*
Universal Evidence Contract

Current Evidence Sources

- Public Website
- Public Profile
- Authenticated Identity

Future Evidence Adapters

- OAuth
- PDF
- DOCX
- Spreadsheet
- CSV
- Images
- OCR
- Business Records
- Financial Reports
- Chat History

Only this block should expand as new adapters are added.

The Universal Evidence Pipeline remains unchanged.
*/

const hasEvidenceSource =
    hasProfileLink ||
    hasBusinessData ||
    hasOtherEvidence ||
    hasUploadedFiles ||
    hasConnectedApps ||
    hasIdentityPackage;

if (!hasEvidenceSource) {

    return {

        success: false,

        stage: "Input Validation",

        reason:
            "A valid Evidence Source is required."

    };

}
    // Normalize current Evidence Source
const normalizedProfileLink =
    hasProfileLink
        ? profileLink.trim()
        : "";
    // Build Universal Evidence Context
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
/// STEP 2.5
// Universal Evidence Router

let publicContentPackage = null;

if (hasProfileLink) {

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

publicContentPackage =
    buildPublicContentPackage(
        rawPackage,
        extractedPackage
    );

if (!publicContentPackage.success) {

    return {

        success: false,

        stage: "Public Evidence Adapter",

        reason:
            publicContentPackage.reason

    };

}
}
   /* ==========================================
// STEP 3
// Evidence Source Detection
========================================== 

const platformDecision =
    detectPlatform(normalizedProfileLink);

if (!platformDecision.supported) {

    return {

        success: false,

        stage: "Evidence Source Detection",

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
// Universal Evidence Intelligence
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
// Universal Evidence Processor
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
   Evidence Source Detector
========================================== */
/*
Current Adapter

Website / Public Profile

Future Adapters

- OAuth
- PDF
- DOCX
- Spreadsheet
- CSV
- OCR
- Images

Only the adapter list expands.

The Universal Evidence Engine remains unchanged.
*/
function detectPlatform(profileLink) {

    let hostname = "Unknown";

    try {

        hostname = new URL(profileLink)
            .hostname
            .replace(/^www\./, "")
            .toLowerCase();

    } catch {

        return {

            platform: "Unknown",

            supported: true,

            sourceType: "Unknown",

            adapter: "Unknown"

        };

    }

    return {

        platform: hostname,

        supported: true,

        sourceType: "PublicWebsite",

        adapter: "PublicWebsite"

    };

}

/* ==========================================
   UNIVERSAL EVIDENCE INTELLIGENCE

   Mission

   Convert every available Evidence Source into
   one verified Universal Evidence Package.

   The source may change.

   The investigation rules never change.

========================================== */
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
sourceType: "PublicWebsite",

packageType: "UniversalEvidencePackage",
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

The Universal Evidence Package may originate from one or more Evidence Adapters including:

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

Evidence categories are dynamic.

Collect only categories supported by verified evidence.

Do not create empty categories.

Do not force unavailable evidence into the package.

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
Evidence Coverage

The investigation is incomplete while usable evidence remains unprocessed.

Never force every category to exist.

Return null when verified evidence is unavailable.

CORE RESPONSIBILITIES

1. Discover every available Evidence Source.
2. Collect every measurable Evidence Signal.
3. Verify every claim before using it.
4. Normalize evidence into one reusable structure.
5. Remove duplicate evidence.
6. Preserve entities, timelines and numerical data.
7. Identify Domin Filters from verified evidence.
8. Calculate Evidence Coverage before completion.
9. Compress evidence without losing meaning.
10. Build one reusable Universal Evidence Package.

Evidence first.

Domin Filters emerge from verified evidence.

Conclusions last.



COLLECTION WINDOW

Default collection period is the most recent 90 days.

If reliable evidence is insufficient,
gradually expand to:

• 6 Months
• 12 Months
• Lifetime (only when necessary)

Always prefer the most recent evidence.

Recent evidence has higher priority than historical evidence.

Stop expanding the collection window only when sufficient verified evidence has been collected or no additional usable evidence exists.

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

Evidence Coverage directly influences confidence.

Incomplete evidence collection must reduce overall confidence.

Confidence must never exceed evidence completeness.

VALIDATION RULES

• Every claim must be supported by Universal Evidence.
• Never assume missing information.
• Ignore unsupported claims.
• Remove duplicated signals.
• Prefer recent evidence over outdated evidence.
• Keep confidence high.
• Keep evidence reusable.
• Never remove evidence that may become useful during cross-evidence validation.
• Preserve traceability back to the original Evidence Source.

CONFIDENCE RULES

Confidence must always be evidence-based.

100
Official verified evidence.

90
Multiple independent Univarsal sources agree.

75
Strong Universal Evidence with high consistency.

50
Limited or partially verified Universal Evidence

25
Weak or insufficient Universal Evidence

0
No verified Universal Evidence

Never increase confidence without supporting evidence.

Confidence must decrease when evidence is weak, inconsistent, outdated, or incomplete.

Always explain why confidence changed.

Confidence is calculated from:

• Evidence Quality
• Evidence Coverage
• Evidence Consistency
• Cross Evidence Verification

Never calculate confidence from assumptions or popularity.

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
Missing evidence must never be fabricated.

Missing evidence should become future collection targets when additional Evidence Sources become available.
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
• Evidence Sources
• Entities
• Domin Filters
• Timelines
• Numerical Data
• Evidence Coverage
• Confidence
• Missing Evidence
• Conflicting Evidence

Never remove verified evidence unless it is duplicated or invalid.


This brain exists only to build one reusable Universal Evidence Package for TruthLoop Main Brain.

Evidence first.

Conclusions later.
`;
       const userPrompt = `

CURRENT EVIDENCE SOURCE

${JSON.stringify(publicContentPackage, null, 2)}

CURRENT LOOP

${currentLoop}

TRUTHLOOP PACKAGE

${JSON.stringify(truthLoopPackage, null, 2)}
`;

        /* ==========================================
   AI REQUEST CONTRACT

   Input

   • TruthLoop Package
   • Current Evidence Source

   Output

   • Universal Evidence Package

   JSON only.
========================================== */
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
        // Execute Universal Evidence Intelligence Request
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

        `Universal Evidence API Error: HTTP ${response.status}`

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
    
/* ==========================================
   UNIVERSAL EVIDENCE PACKAGE

   This Brain transforms raw AI evidence into
   one verified TruthLoop Universal Evidence Package.

========================================== */
    const evidencePackage = {

        success: false,

        timestamp:
            new Date().toISOString(),
        packageType: "UniversalEvidencePackage",

contractVersion: "UEP-1.0",

        profileLink:
            profileEvidence.profileLink,

        evidence: {},

        errors: []

    };

    try {

        /* ==========================================
   STEP 1

Receive Verified Evidence
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
// Reject fabricated evidence.

// Reject evidence without verifiable structure.
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

        /* Normalize every Evidence Source into one
   Universal Evidence Contract.

   Every adapter must produce this structure.
*/
const normalizedEvidence = {

    packageType: "UniversalEvidencePackage",
    contractVersion: "UEP-1.0",

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

    mission: "Build one verified Universal Evidence Package.",

    rules: [
"Discover every available Evidence Source.",

"Collect every measurable Evidence Signal.",

"Validate every claim.",

"Normalize duplicate evidence.",

"Cross-check every Domin Filter.",

"Preserve entities, Domin Filters, timelines and numerical data.",

"Keep only reusable evidence.",

"Evidence first.",

"Verification second.",

"Conclusions last."
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
    contractVersion: "UEP-1.0",

    source: "DigitalFootprintBrain",

    provider: normalizedEvidence.provider,

    profileLink: normalizedEvidence.profileLink,

    collectedAt: normalizedEvidence.collectedAt,

    evidence: refinedEvidence.evidence,

    rules: refinedEvidence.rules

};

evidencePackage.success = true;
// Universal Evidence Package ready for TruthLoop Main Brain.
return evidencePackage;

        
    }

    catch (error) {

        evidencePackage.errors.push(
            error.message
        );

        return evidencePackage;

    }

   }
