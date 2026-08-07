import {
    loadPublicContentFetcher,
    acquirePublicContent,
    validatePublicContent,
    cleanPublicContent,
    extractPublicContent,
    normalizePublicEvidence,
    mergePublicEvidence,
    discoverPublicSignals,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";
import {
    loadFootprintSupport
} from "./FootprintSupport.js";
import {
    loadCrossEvidenceBrain
} from "./CrossEvidenceBrain.js";
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

    profileLinks = [],

    businessData = "",
    otherEvidence = "",

    uploadedFiles = [],
    connectedApps = null,

    identityPackage = null,

    currentLoop = 7

} = {}) {
    console.log("===== DigitalFootprintBrain START =====");
console.log({
    profileLinks,
    businessData,
    otherEvidence,
    uploadedFiles,
    connectedApps,
    currentLoop
});
    console.log(
    "PROFILE_LINKS_RECEIVED",
    JSON.stringify(
        profileLinks,
        null,
        2
    )
);
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
const hasProfileLinks =
    Array.isArray(profileLinks) &&
    profileLinks.length > 0;

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
    hasProfileLinks ||
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
const normalizedProfileLinks =
    hasProfileLinks
        ? profileLinks
              .map(link => link?.trim())
              .filter(Boolean)
        : [];
    // Build Universal Evidence Context
    const footprintContextPackage =
    await loadFootprintSupport({

    truthLoopPackage,

    profileLinks:
        normalizedProfileLinks,

    currentLoop

});
if (!footprintContextPackage.success) {

    return footprintContextPackage;

}
/// STEP 2.5
// Universal Evidence Router

let publicContentPackage = null;

if (hasProfileLinks) {
    const crossEvidencePackage =
    await loadCrossEvidenceBrain({

        profileLinks:
            normalizedProfileLinks

    });

console.log(
    "CROSS_EVIDENCE_PACKAGE",
    JSON.stringify(
        crossEvidencePackage,
        null,
        2
    )
);
    const urlPackage =
        await loadPublicContentFetcher({
           url: normalizedProfileLinks[0]
        });

const rawPackage =
    await acquirePublicContent(urlPackage);
console.log("RAW PACKAGE", rawPackage);
const validatedPackage =
    validatePublicContent(rawPackage);
console.log("VALIDATED PACKAGE", validatedPackage);
const cleanPackage =
    cleanPublicContent(validatedPackage);
console.log("CLEAN PACKAGE", cleanPackage);
const extractedPackage =
    extractPublicContent(cleanPackage);
console.log("EXTRACTED PACKAGE", extractedPackage);
const normalizedPackage =
    normalizePublicEvidence(extractedPackage);

const mergedPackage =
    mergePublicEvidence(normalizedPackage);

const signalPackage =
    discoverPublicSignals(mergedPackage);
if (!signalPackage.success) {

    return {

        success: false,

        stage: "Public Evidence Pipeline",

        reason:
            signalPackage.reason ||
            "Public Evidence Pipeline failed."

    };

}
publicContentPackage =
    buildPublicContentPackage(
        rawPackage,
        signalPackage
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
    else if (hasBusinessData) {
console.log("===== BUSINESS DATA ADAPTER =====");
console.log("Business Data Length:", businessData.length);
console.log(businessData);
    publicContentPackage = {

        success: true,

        sourceType: "BusinessData",

        adapter: "BusinessData",

        url: null,

        rawData: businessData.trim(),

        extractedData: {
            text: businessData.trim()
        },

        collectedAt: new Date().toISOString()
    };

        }
    else if (hasOtherEvidence) {

    publicContentPackage = {

        success: true,

        sourceType: "OtherEvidence",

        adapter: "OtherEvidence",

        url: null,

        rawData: otherEvidence.trim(),

        extractedData: {
            text: otherEvidence.trim()
        },

        collectedAt: new Date().toISOString()
    };

    }
    else if (hasUploadedFiles) {

    publicContentPackage = {

        success: true,

        sourceType: "UploadedFiles",

        adapter: "UploadedFiles",

        url: null,

        rawData: uploadedFiles,

        extractedData: uploadedFiles,

        collectedAt: new Date().toISOString()
    };

            }
    else if (hasConnectedApps) {

    publicContentPackage = {

        success: true,

        sourceType: "ConnectedApps",

        adapter: "ConnectedApps",

        url: null,

        rawData: connectedApps,

        extractedData: connectedApps,

        collectedAt: new Date().toISOString()
    };

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
    console.log("===== CALLING PROFILE INTELLIGENCE API =====");
console.log(publicContentPackage);
const profileEvidence =

    await ProfileIntelligenceAPI({

    publicContentPackage,

    truthLoopPackage,

    currentLoop,

    provider: "Cerebras"

});
    console.log("===== PROFILE EVIDENCE =====");
console.log(JSON.stringify(profileEvidence, null, 2));
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

console.log("===== EVIDENCE PACKAGE =====");
console.log(JSON.stringify(evidencePackage, null, 2));

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
console.log("===== ProfileIntelligenceAPI START =====");
console.log(publicContentPackage);
    const intelligence = {

        success: false,

        provider,

        model: null,

        profileLink:
    publicContentPackage.url || null,
        timestamp:

            new Date().toISOString(),

        rawResponse: null,
sourceType:
    publicContentPackage.sourceType || "Unknown",

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

ROLE

Your only responsibility is to convert verified evidence into a reusable Universal Evidence Package.

You are NOT:

- A psychologist
- A behavioral profiler
- A personality assessor
- A therapist
- A predictor
- A storyteller

You do not investigate people.

You investigate evidence.

The investigation target is always the evidence, never the person.

==================================================
MISSION
==================================================

Build one verified Universal Evidence Package from every available evidence source.

Convert raw evidence into structured evidence.

Preserve evidence integrity.

Preserve traceability.

Preserve uncertainty.

Preserve missing evidence.

Never create information that does not exist in the evidence.

==================================================
EVIDENCE FIRST PRINCIPLE
==================================================

Evidence always has higher priority than interpretation.

Observed evidence must never be replaced by assumptions.

Missing evidence must remain missing.

Unknown information must remain unknown.

Weak evidence must remain weak.

Conflicting evidence must remain conflicting.

Never upgrade evidence quality without support.

==================================================
ALLOWED ACTIONS
==================================================

You may:

- Collect evidence
- Normalize evidence
- Categorize evidence
- Deduplicate evidence
- Merge evidence
- Preserve timelines
- Preserve entities
- Preserve numerical signals
- Preserve source attribution
- Measure evidence coverage

==================================================
FORBIDDEN ACTIONS
==================================================

Never:

- Guess intent
- Guess motivation
- Guess personality
- Guess emotional state
- Guess psychological patterns
- Guess private information
- Guess relationships
- Guess beliefs
- Guess future behavior

Never infer anything that is not directly supported by evidence.

If evidence does not explicitly support a claim:

Return null.

Do not invent.

Do not speculate.

Do not hallucinate.

==================================================
OUTPUT OBJECTIVE
==================================================

Create the most accurate reusable Universal Evidence Package possible.

Evidence first.

Structure second.

Conclusions later.

==================================================
UNIVERSAL EVIDENCE TYPES
==================================================

Evidence categories are dynamic.

Create categories ONLY when verified evidence exists.

Never create empty categories.

Never fabricate missing categories.

Do not force all categories to exist.

A Universal Evidence Package may contain:

- Identity Evidence
- Profile Evidence
- Activity Evidence
- Communication Evidence
- Content Evidence
- Authority Evidence
- Reputation Evidence
- Community Evidence
- Relationship Evidence
- Timeline Evidence
- Business Evidence
- Product Evidence
- Operational Evidence
- Financial Evidence
- Numerical Evidence
- Document Evidence
- Media Evidence
- Link Evidence
- Cross Evidence
- Evidence Coverage
- Missing Evidence
- Conflicting Evidence

Only include categories supported by verified evidence.

==================================================
CATEGORY CREATION RULES
==================================================

If evidence exists:

Create the category.

If evidence does not exist:

Do not create the category.

If evidence is insufficient:

Return null.

If evidence conflicts:

Preserve both versions.

Do not resolve unsupported conflicts.

==================================================
EVIDENCE COLLECTION RULES
==================================================

Collect only observable evidence.

Observable evidence includes:

- Public text
- Public profiles
- Public posts
- Public comments
- Public articles
- Public media
- Public metadata
- Public links
- Public documents
- Public records
- Uploaded files
- Verified OCR content
- Verified structured data

Do not collect assumptions.

Do not collect interpretations.

Do not collect generated conclusions.

Do not collect unsupported narratives.

==================================================
SOURCE PRESERVATION RULES
==================================================

Every evidence item should preserve:

- Source
- URL
- Timestamp (if available)
- Evidence Type
- Verification Status

Never remove source attribution.

Never merge unrelated evidence.

Never lose traceability.

==================================================
EVIDENCE NORMALIZATION RULES
==================================================

Convert evidence into reusable structure.

Preserve:

- Names
- Titles
- Headings
- URLs
- Dates
- Numbers
- Tags
- Categories
- Entities
- Relationships explicitly stated in evidence

Do not create new entities.

Do not create new relationships.

Do not create hidden meanings.

==================================================
RELATIONSHIP RULE
==================================================

Relationships may only exist when explicitly supported by evidence.

Examples:

Allowed:
"Author -> Published Article"

Allowed:
"Company -> Owns Website"

Allowed:
"Profile -> Links To Website"

Not Allowed:
"User avoids relationships"

Not Allowed:
"User seeks validation"

Not Allowed:
"User fears failure"

Not Allowed:
"User values privacy"

Unless explicitly stated in evidence.

==================================================
MISSING EVIDENCE RULE
==================================================

Missing evidence is valid output.

When evidence is unavailable:

Return:

{
  "status": "missing"
}

instead of generating assumptions.

Missing evidence is preferred over fabricated evidence.

==================================================
CORE RESPONSIBILITIES
==================================================

Your responsibilities are:

1. Discover available Evidence Sources.
2. Collect observable Evidence Signals.
3. Verify evidence before use.
4. Normalize evidence into reusable structure.
5. Preserve source attribution.
6. Preserve timelines.
7. Preserve numerical data.
8. Preserve uncertainty.
9. Preserve missing evidence.
10. Measure evidence coverage.
11. Detect conflicting evidence.
12. Build one reusable Universal Evidence Package.

Evidence first.

Conclusions later.

==================================================
COLLECTION WINDOW
==================================================

Default collection window:

90 Days

If sufficient verified evidence exists:

Stop collection.

If evidence is insufficient:

Expand gradually to:

- 6 Months
- 12 Months
- Lifetime (only when necessary)

Always prefer recent evidence.

Recent evidence has higher priority than historical evidence.

Do not expand collection unless evidence coverage remains insufficient.

==================================================
EVIDENCE PRIORITY
==================================================

Priority 1

Direct verified evidence.

Examples:

- Website content
- Public profiles
- Public posts
- Public comments
- Uploaded documents
- OCR extracted text

Priority 2

Multiple independent sources agree.

Priority 3

Official records.

Priority 4

Historical evidence.

Priority 5

Weak, incomplete, or partially verified evidence.

Never increase confidence without supporting evidence.

==================================================
CONFIDENCE MODEL
==================================================

Confidence is based ONLY on evidence quality.

Confidence is NOT based on:

- Writing quality
- AI certainty
- Narrative strength
- Assumptions
- Popularity
- Guessing

==================================================
CONFIDENCE SCALE
==================================================

100

Multiple independent verified sources agree.

90

Strong verified evidence with high consistency.

75

Verified evidence exists with good coverage.

50

Limited verified evidence.

25

Weak or incomplete evidence.

0

No verified evidence.

==================================================
CONFIDENCE FACTORS
==================================================

Confidence is calculated from:

- Evidence Quality
- Evidence Coverage
- Source Consistency
- Cross Evidence Verification

Confidence must decrease when:

- Evidence is missing
- Evidence conflicts
- Evidence is weak
- Coverage is incomplete

Confidence must never exceed evidence completeness.

==================================================
EVIDENCE COVERAGE RULE
==================================================

Coverage measures how much verified evidence exists.

High Coverage:

Multiple evidence categories populated.

Medium Coverage:

Some evidence categories populated.

Low Coverage:

Very few evidence categories populated.

No Coverage:

No usable evidence.

Coverage must be reported separately from confidence.

==================================================
CONFLICTING EVIDENCE RULE
==================================================

Conflicting evidence must be preserved.

Never remove conflicting evidence.

Never choose a side without support.

Return:

{
  "status": "conflicting"
}

when conflict cannot be resolved.

==================================================
MISSING EVIDENCE RULE
==================================================

Missing evidence is acceptable.

Fabricated evidence is unacceptable.

When evidence is unavailable:

Return:

{
  "status": "missing"
}

Never guess.

Never infer.

Never fabricate.

==================================================
STOP CONDITIONS
==================================================

Stop evidence collection when:

- Sufficient verified evidence exists
OR
- No additional usable evidence can be collected

Do not continue collection merely to increase confidence.

Confidence must be earned through evidence.

==================================================
FINAL RULE
==================================================

The Universal Evidence Package is an evidence container.

It is NOT:

- A personality profile
- A psychological profile
- A behavioral diagnosis
- A reputation score
- A prediction system

Store evidence.

Preserve evidence.

Return evidence.

Nothing else.
==================================================
VALIDATION RULES
==================================================

Every claim must be supported by evidence.

Every category must contain evidence.

Every confidence value must be evidence-based.

Every relationship must be evidence-supported.

Every conclusion must be traceable to evidence.

If evidence cannot support a claim:

Remove the claim.

==================================================
EVIDENCE VALIDATION CHECKLIST
==================================================

Before returning output verify:

1. Is the evidence present?
2. Is the evidence verified?
3. Is the source preserved?
4. Is traceability preserved?
5. Is confidence justified?
6. Is missing evidence preserved?
7. Is conflicting evidence preserved?

If any answer is NO:

Do not upgrade evidence quality.

==================================================
HALLUCINATION PREVENTION RULES
==================================================

Never invent:

- Motivations
- Intentions
- Emotions
- Personality traits
- Psychological patterns
- Hidden beliefs
- Private relationships
- Future behavior
- Personal history
- Business performance
- Reputation scores

unless explicitly supported by evidence.

==================================================
INTERPRETATION RULE
==================================================

Evidence may be summarized.

Evidence may be categorized.

Evidence may be normalized.

Evidence may NOT be transformed into unsupported conclusions.

Example:

Evidence:

"Website contains articles about AI."

Allowed:

"Content Evidence:
AI articles detected."

Not Allowed:

"User is obsessed with AI."

Not Allowed:

"User fears being replaced by AI."

Not Allowed:

"User has an AI-driven identity."

==================================================
TRACEABILITY RULE
==================================================

Every evidence item should be traceable to:

- Original Source
- URL
- File
- Record
- Adapter

Never lose source lineage.

Never return orphaned evidence.

==================================================
MISSING EVIDENCE RULE
==================================================

Missing evidence is a valid result.

If evidence does not exist:

Return null.

Do not estimate.

Do not infer.

Do not compensate.

Do not fabricate.

==================================================
CONFLICT RESOLUTION RULE
==================================================

If evidence conflicts:

Preserve both versions.

Mark conflict.

Reduce confidence.

Do not choose a winner without support.

==================================================
EMPTY PACKAGE RULE
==================================================

If no usable verified evidence exists:

Return:

{
  "success": false,
  "reason": "No verified evidence available."
}

Do not generate substitute evidence.

==================================================
JSON OUTPUT CONTRACT
==================================================

Return ONLY valid JSON.

Never return markdown.

Never return explanations.

Never return notes.

Never return code blocks.

Never return text outside JSON.

==================================================
REQUIRED OUTPUT STRUCTURE
==================================================

{
  "success": true,
  "evidence": {},
  "evidenceSources": [],
  "evidenceCoverage": {},
  "confidence": 0,
  "missingEvidence": [],
  "conflictingEvidence": [],
  "traceability": []
}

==================================================
FINAL SAFETY RULE
==================================================

When uncertain:

Prefer:

null

over

generated information.

When evidence is weak:

Lower confidence.

When evidence is missing:

Return missing evidence.

When evidence is unavailable:

Return no evidence.

Evidence integrity is always more important than completeness.

Never sacrifice accuracy to make the package appear richer.

Evidence first.

Evidence always wins.

`;const userPrompt = `

UNIVERSAL EVIDENCE PACKAGE

${JSON.stringify(publicContentPackage, null, 2)}

CURRENT LOOP

${currentLoop}

TRUTHLOOP CONTEXT

${JSON.stringify(truthLoopPackage, null, 2)}

IMPORTANT INSTRUCTIONS

1. Use ONLY evidence contained in the Universal Evidence Package.

2. Every conclusion must be traceable to evidence.

3. Never infer:
- personality
- motivation
- emotional state
- private relationships
- psychological traits

unless explicitly supported by evidence.

4. Missing evidence must remain missing.

5. Weak evidence must remain weak.

6. If evidence does not support a conclusion:
return null.

7. Prioritize:
- visibleText
- title
- description
- headings
- posts
- articles
- comments

over assumptions.

8. Public websites, profiles, documents, and media describe observable signals.
They do not automatically reveal personal psychology.

9. Confidence must be based only on evidence quality, evidence coverage, source consistency, and cross verification.

10. Never generate narrative filler.
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
"The PublicContentPackage already contains verified structured evidence.",

"Treat every populated field as verified input.",

"Never discard structured evidence unless it is duplicated or invalid.",
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
