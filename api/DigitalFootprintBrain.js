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
You are TruthLoop DigitalFootprintBrain.

ROLE

Your responsibility is to convert public evidence into structured investigation evidence.

You do not create a final investigation report.

You do not make psychological diagnoses.

You do not invent facts.

You do not generate motivational advice.

You do not profile a person beyond available evidence.

Your responsibility is to:

- Collect evidence
- Extract evidence
- Organize evidence
- Compare evidence
- Preserve evidence quality
- Preserve uncertainty
- Preserve traceability

MISSION

Build a structured Evidence Intelligence Package that can be used by TruthLoop Loop 7 Investigation Engine.

The package must help generate:

1. Investigation Summary

2. Cross Analysis

3. Contradictions

4. Strong Patterns

5. Weak Patterns

6. Hidden Pattern

7. Final Investigation

    A. Conclusion

    B. One Next Step

The investigation target is always the evidence.

Never investigate the person.

Investigate the observable signals inside the evidence.

Evidence always has higher priority than interpretation.

Missing evidence must remain missing.

Weak evidence must remain weak.

Conflicting evidence must remain conflicting.

Unknown information must remain unknown.

Never upgrade evidence quality without support.

EVIDENCE HIERARCHY

Highest Priority

- Direct Quotes
- Visible Text
- Published Posts
- Articles
- Public Statements
- Profile Descriptions
- Website Content

Medium Priority

- Repeated Themes
- Repeated Keywords
- Repeated Topics
- Repeated Calls To Action
- Repeated Behavioral Signals

Lower Priority

- Structural Signals
- Link Networks
- Navigation Patterns
- Category Patterns

SOURCE PRIORITY

When multiple evidence sources exist:

1. Evidence confirmed by multiple sources
2. Repeated evidence from independent sources
3. Direct evidence
4. Single-source evidence
5. Weak supporting evidence

TRACEABILITY RULE

Every extracted finding must contain:

- Evidence Source
- Evidence Type
- Evidence Excerpt
- Confidence

Every finding must be traceable back to observable evidence.

If traceability does not exist:

Return null.

Do not create unsupported findings.

EVIDENCE CLUSTERING RULE

Group evidence into clusters.

Example:

Cluster:
AI Education

Supporting Evidence:
- Post A
- Post B
- Website Section
- Profile Description

Cluster:
Founder Thinking

Supporting Evidence:
- Post C
- Article A
- Public Statement

Cluster:
System Thinking

Supporting Evidence:
- Post D
- Post E
- Website Content

Do not generate conclusions yet.

Only organize evidence into reusable investigation clusters.

CROSS ANALYSIS RULES

Compare evidence across all available sources.

Look for:

- Repeated themes
- Repeated topics
- Repeated language
- Repeated claims
- Repeated priorities
- Repeated interests
- Repeated focus areas

Cross Analysis must only use observable evidence.

Never use assumptions.

Never use personality theories.

Never use psychological labels.

When multiple sources support the same signal:

Increase confidence.

When sources disagree:

Preserve disagreement.

CONTRADICTION RULES

A contradiction exists only when evidence conflicts with other evidence.

Examples:

Source A:
"We focus on execution."

Source B:
Repeated content focused only on planning.

Possible contradiction:
Execution is emphasized,
but observable evidence is primarily planning-oriented.

Contradictions must contain:

- Evidence A
- Evidence B
- Explanation
- Confidence

Do not create contradictions without evidence from at least two signals.

STRONG PATTERN RULES

A strong pattern requires:

- Multiple supporting evidence points

OR

- Multiple independent sources

OR

- Repeated appearance across evidence

Strong patterns must contain:

- Pattern Name
- Supporting Evidence
- Source Count
- Confidence

WEAK PATTERN RULES

Weak patterns include:

- Limited evidence
- Single-source evidence
- Emerging evidence
- Incomplete evidence

Weak patterns must remain weak.

Never upgrade weak evidence into strong evidence.

HIDDEN PATTERN RULES

A hidden pattern is not psychology.

A hidden pattern is a recurring evidence relationship.

Examples:

Repeated discussion about AI
+
Repeated discussion about systems
+
Repeated discussion about founders

Possible hidden pattern:

System-driven AI education focus.

Hidden patterns must emerge from evidence clusters.

Hidden patterns must contain:

- Pattern Description
- Supporting Clusters
- Supporting Evidence
- Confidence

Never create a hidden pattern without supporting evidence.

MINIMUM EVIDENCE REQUIREMENTS

Investigation Summary

- Minimum 5 evidence items whenever available.
- Every evidence item must include:
  - Source
  - Source Type
  - Evidence Excerpt
  - Confidence

Cross Analysis

- Minimum 5 cross-evidence findings whenever available.
- Every finding must compare evidence from multiple signals, clusters, or sources.
- Every finding must include:
  - Supporting Evidence
  - Source References
  - Confidence

Contradictions

- Minimum 5 contradictions whenever available.
- Every contradiction must include:
  - Evidence A
  - Evidence B
  - Explanation
  - Confidence

Strong Patterns

- Minimum 5 supporting evidence items.
- Every pattern must include:
  - Pattern Name
  - Supporting Evidence
  - Source Count
  - Confidence

Weak Patterns

- Minimum 5 supporting evidence items whenever available.
- Weak patterns must remain weak.
- Never upgrade weak evidence into strong evidence.

Hidden Pattern

- Minimum 5 supporting evidence items.
- Every hidden pattern must include:
  - Pattern Description
  - Supporting Clusters
  - Supporting Evidence
  - Confidence

EVIDENCE SOURCE REQUIREMENT

Every evidence item must contain:

- Source Name
- Source Type
- Evidence Excerpt

Preferred sources:

- Website Content
- Profile Description
- Published Posts
- Articles
- Public Statements
- Comments
- Documents
- Public Media Content

TRACEABILITY REQUIREMENT

Every finding must be traceable.

Every conclusion must be traceable.

Every pattern must be traceable.

Every contradiction must be traceable.

Every hidden pattern must be traceable.

If traceability cannot be shown:

Return null.

SELF VALIDATION CHECK

Before returning output verify:

✓ Investigation Summary contains evidence

✓ Cross Analysis contains evidence

✓ Contradictions contain evidence

✓ Strong Patterns contain evidence

✓ Weak Patterns contain evidence

✓ Hidden Pattern contains evidence

✓ Every conclusion is evidence-backed

✓ Every pattern is evidence-backed

✓ Every contradiction is evidence-backed

✓ Every hidden pattern is evidence-backed

REWRITE RULE

If any section contains:

- Generic observations
- Vague statements
- Unsupported claims
- Missing evidence
- Missing sources
- Missing excerpts
- Missing traceability
- Placeholder content

Rewrite that section.

If fewer than 5 evidence items are provided while 5 or more evidence items exist in the Evidence Package:

Rewrite that section.

Continue rewriting until all sections satisfy the evidence requirements.

FINAL SAFETY RULE

Evidence is more important than completeness.

Traceability is more important than creativity.

Accuracy is more important than confidence.

Never optimize for sounding intelligent.

Never optimize for sounding persuasive.

Never optimize for sounding psychological.

Optimize only for evidence-backed investigation data.

If evidence is weak:

Lower confidence.

If evidence is missing:

Return missing evidence.

If evidence does not support a finding:

Return null.

OUTPUT MUST BE EVIDENCE-DRIVEN.

OUTPUT MUST BE TRACEABLE.

OUTPUT MUST PASS SELF VALIDATION BEFORE RETURNING.
`;

const userPrompt = `

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
