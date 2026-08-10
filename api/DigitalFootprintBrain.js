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
import {
    loadCrossEvidenceBrain
} from "./CrossEvidenceBrain.js";
/* ============================================================
   DIGITAL FOOTPRINT BRAIN

   
PRIMARY MISSION

Identify the person behind the profile.

The goal is NOT to understand the platform.

The goal is NOT to understand the website.

The goal is NOT to understand the brand.

The goal is to identify repeated public signals
created by the profile owner.

Evidence Priority

1. Public Posts
2. Public Articles
3. Public Comments
4. Public Activity
5. Public Repositories
6. Public Videos
7. Public Timeline Events
8. Public Communities

Low Priority

- Website navigation
- Menus
- Headers
- Footers
- SEO metadata
- CTA buttons
- Privacy pages
- Terms pages
- Branding content

These are not behavioral evidence.

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

    

// =====================================================
// STEP 3
// Public Profile / Website Adapter
// =====================================================

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

// Public Profile / Website Adapter
let publicContentPackage = null;
if (hasProfileLinks) {

    const urlPackage =
        await loadPublicContentFetcher({
            url: normalizedProfileLinks[0]
        });

    const rawPackage =
        await acquirePublicContent(
            urlPackage
        );
    console.log(
  "URL_PACKAGE_DEBUG",
  JSON.stringify(urlPackage, null, 2)
);
console.log(
    "RAW_PACKAGE_DEBUG",
    JSON.stringify(rawPackage, null, 2)
);
    const validatedPackage =
        validatePublicContent(
            rawPackage
        );

    const cleanPackage =
        cleanPublicContent(
            validatedPackage
        );

    const extractedPackage =
        extractPublicContent(
            cleanPackage
        );



 publicContentPackage =
    buildPublicContentPackage(
        rawPackage,
        extractedPackage
    );

console.log(
    "FINAL_PUBLIC_PACKAGE",
    {
        success:
            publicContentPackage?.success,

        sourceType:
            publicContentPackage?.sourceType,

        visibleTextLength:
            publicContentPackage?.visibleText?.length || 0,

        hasReadableContent:
            publicContentPackage?.hasReadableContent,

        extractionQuality:
            publicContentPackage?.extractionQuality
    }
);

if (!publicContentPackage?.success) {

    return {

        success: false,

        stage: "Public Evidence Adapter",

        reason:
            publicContentPackage?.reason ||
            "Public Content Package failed."

    };

}

    
    

    console.log(
        "FINAL_PUBLIC_PACKAGE",
        {
            success:
                publicContentPackage?.success,

            sourceType:
                publicContentPackage?.sourceType,

            visibleTextLength:
                publicContentPackage?.visibleTextLength,

            hasReadableContent:
                publicContentPackage?.hasReadableContent,

            extractionQuality:
                publicContentPackage?.extractionQuality
        }
    );

    if (!publicContentPackage?.success) {

        return {

            success: false,

            stage: "Public Evidence Adapter",

            reason:
                publicContentPackage?.reason ||
                "Public Content Package failed."

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
    console.log("🔥 CEREBRAS FUNCTION ENTERED 🔥");
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

PROFILE OWNER INVESTIGATION MODE

Do not analyze the website.

Do not analyze the company.

Do not analyze branding.

Do not analyze product descriptions.

Investigate only signals created by the profile owner.

If a source contains mostly navigation,
marketing copy,
SEO content,
or CTA text,

treat it as weak evidence.

Do not allow it to dominate the final package.

Cross-source evidence is stronger than
single-source evidence.

TruthLoop Package does not receive
automatic priority.

Website content does not receive
automatic priority.

MISSION

Build a structured Evidence Intelligence Package that can be used by TruthLoop Loop 7 Investigation Engine.

The package must provide evidence that can support:

- Investigation Summary
- Cross Analysis
- Contradictions
- Strong Patterns
- Weak Patterns
- Hidden Pattern
- Final Investigation

Do not generate these sections.
Do not infer these sections.
Only provide evidence that may support them.
The investigation target is always the evidence.
If no profile-owner evidence exists:

Return:

INSUFFICIENT PROFILE EVIDENCE

Do not substitute website content,
marketing content,
or branding content as evidence.
Evidence Hierarchy

Tier 1
Content created by the profile owner

Tier 2
Interactions created by the profile owner

Tier 3
Public reactions to the profile owner

Tier 4
Platform metadata

Tier 5
Website branding and marketing content

Lower tiers can never override higher tiers.

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

LOOP 7 INVESTIGATION REQUEST

CURRENT LOOP

${currentLoop}

━━━━━━━━━━━━━━━━━━━━
TRUTHLOOP PACKAGE
━━━━━━━━━━━━━━━━━━━━

${JSON.stringify(truthLoopPackage, null, 2)}

━━━━━━━━━━━━━━━━━━━━
PUBLIC EVIDENCE PACKAGE
━━━━━━━━━━━━━━━━━━━━

${JSON.stringify(publicContentPackage, null, 2)}

━━━━━━━━━━━━━━━━━━━━
INVESTIGATION OBJECTIVE
━━━━━━━━━━━━━━━━━━━━

Generate evidence for the following investigation structure:

1. Investigation Summary

2. Cross Analysis

3. Contradictions

4. Strong Patterns

5. Weak Patterns

6. Hidden Pattern

7. Final Investigation

   A. Conclusion

   B. One Next Step

━━━━━━━━━━━━━━━━━━━━
EVIDENCE RULES
━━━━━━━━━━━━━━━━━━━━

Use only evidence contained inside:

- TruthLoop Package
- Public Evidence Package

Never use external knowledge.

Never invent facts.

Never invent sources.

Never invent evidence.

Never generate unsupported conclusions.

If evidence is missing:

Return:
Evidence Unavailable

If evidence is weak:

Keep confidence low.

If evidence conflicts:

Show the conflict.

Do not resolve unsupported conflicts.

━━━━━━━━━━━━━━━━━━━━
SOURCE PRIORITY
━━━━━━━━━━━━━━━━━━━━

Prefer evidence from:

- visibleText
- title
- description
- headings
- posts
- articles
- comments
- documents
- public media
- public profiles

Use actual evidence whenever available.

━━━━━━━━━━━━━━━━━━━━
TRACEABILITY RULE
━━━━━━━━━━━━━━━━━━━━

Every finding must include:

- Source
- Source Type
- Evidence Excerpt
- Confidence

Every statement must be traceable.

Every pattern must be traceable.

Every contradiction must be traceable.

Every conclusion must be traceable.

Every hidden pattern must be traceable.

If traceability cannot be shown:

Return null.

━━━━━━━━━━━━━━━━━━━━
MINIMUM EVIDENCE RULE
━━━━━━━━━━━━━━━━━━━━

Whenever evidence exists:

Investigation Summary:
Minimum 5 evidence items.

Cross Analysis:
Minimum 5 evidence items.

Contradictions:
Minimum 5 evidence items.

Strong Patterns:
Minimum 5 evidence items.

Weak Patterns:
Minimum 5 evidence items.

Hidden Pattern:
Minimum 5 evidence items.

If fewer than 5 evidence items are returned while evidence exists:

Rewrite the section.

━━━━━━━━━━━━━━━━━━━━
STRICT PROHIBITIONS
━━━━━━━━━━━━━━━━━━━━

Do not infer personality.

Do not infer motivation.

Do not infer emotional state.

Do not infer psychological traits.

Do not infer private relationships.

Do not infer hidden facts.

Do not generate narrative filler.

Do not generate motivational language.

Do not generate therapy language.

Do not generate coaching language.

Do not generate assumptions.

Only use evidence-supported observations.

━━━━━━━━━━━━━━━━━━━━
SELF VALIDATION
━━━━━━━━━━━━━━━━━━━━

Before returning output verify:

✓ Investigation Summary contains evidence

✓ Cross Analysis contains evidence

✓ Contradictions contain evidence

✓ Strong Patterns contain evidence

✓ Weak Patterns contain evidence

✓ Hidden Pattern contains evidence

✓ Final Investigation is evidence-backed

✓ Every section contains traceability

✓ Every section contains confidence

✓ Every section contains source references

If validation fails:

Rewrite the failing section.

Return only the final validated investigation package.

`;
        /*throw new Error(
  JSON.stringify({
    userPromptLength: userPrompt.length,

    hasPublicEvidencePackage:
      userPrompt.includes("PUBLIC EVIDENCE PACKAGE"),

    hasTruthloop:
      userPrompt.includes("truthloop.in"),

    preview:
      userPrompt.substring(0, 500)
  })
);*/
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

  console.log("===== CEREBRAS REQUEST =====");
  console.log("MODEL:", requestBody.model);

  console.log(
    "===== CEREBRAS MESSAGES =====",
    JSON.stringify(requestBody.messages, null, 2)
  );

  console.log(
    "===== CEREBRAS REQUEST BODY =====",
    JSON.stringify(requestBody, null, 2)
  );

  console.log("🔥 BEFORE CEREBRAS FETCH 🔥");
  console.log(
    "API KEY EXISTS:",
    !!process.env.CEREBRAS_API_KEY
  );

  console.log("ENDPOINT:", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Authorization:
        `Bearer ${process.env.CEREBRAS_API_KEY}`
    },

    body: JSON.stringify(requestBody)
  });

  console.log("🔥 AFTER CEREBRAS FETCH 🔥");
  console.log("STATUS:", response.status);

  if (!response.ok) {

    const errorText = await response.text();

    console.error(
      "🔥 CEREBRAS HTTP ERROR 🔥",
      errorText
    );

    intelligence.errors.push(
      `Universal Evidence API Error: HTTP ${response.status}`
    );

    return intelligence;
  }

  const result = await response.json();

  console.log("🔥 CEREBRAS JSON RECEIVED 🔥");

  intelligence.rawResponse = result;

  console.log(
    "CEREBRAS_RESPONSE",
    JSON.stringify(result, null, 2)
  );

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

  console.log("🔥 CEREBRAS SUCCESS 🔥");

  return intelligence;

} catch (error) {

  console.error(
    "🚨 CEREBRAS CRASH 🚨"
  );

  console.error(error);

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
