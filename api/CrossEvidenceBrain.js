/* ============================================================
   CROSS EVIDENCE BRAIN
   TruthLoop AI

   Mission

   Collect evidence from one or more public sources
   and build one merged Public Evidence Package.

   This brain never performs investigation.

   It only:

   • Collects
   • Normalizes
   • Deduplicates
   • Scores
   • Packages

   Output

   One Universal Public Evidence Package

============================================================ */

import {
    loadPublicContentFetcher,
    acquirePublicContent,
    validatePublicContent,
    cleanPublicContent,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";

export async function loadCrossEvidenceBrain({

    profileLinks = [],
   truthLoopPackage = {}

} = {}) {

    const result = {

        success: false,

        sourcesProcessed: 0,

        sourcesSucceeded: 0,

        sourcesFailed: 0,

        evidencePackages: [],

        mergedEvidence: null,

        confidenceScore: 0,

        errors: []

    };

    try {
       
console.log(
    "CROSS_EVIDENCE_PROFILE_LINKS",
    profileLinks
);
        if (
            !Array.isArray(profileLinks) ||
            !profileLinks.length
        ) {

            result.errors.push(
                "At least one profile link is required."
            );

            return result;
        }
       const identityPackage =
    await IdentityExtractionBrain({
        profileLinks
    });
       console.log(
  "IDENTITY_PACKAGE",
  JSON.stringify(
    identityPackage,
    null,
    2
  )
);

const discoveryPackage =
    await FootprintDiscoveryBrain(
        identityPackage
    );

        for (const url of profileLinks) {

            const sourceResult =
                await collectSourceEvidence(url);

            result.sourcesProcessed++;

            if (sourceResult.success) {

                result.sourcesSucceeded++;

                result.evidencePackages.push(
                    sourceResult.package
                );

            } else {

                result.sourcesFailed++;

                result.errors.push({
                    url,
                    reason: sourceResult.reason
                });

            }

        }

        result.mergedEvidence =
            mergeEvidencePackages(
                result.evidencePackages
            );
console.log("STEP_1_MERGE_DONE");
        result.confidenceScore =
            calculateEvidenceScore(
                result.mergedEvidence
            );
       console.log("STEP_2_NORMALIZER_START");
const normalizedEvidence =
    await EvidenceNormalizer(
        result.mergedEvidence
    );
       console.log("STEP_3_NORMALIZER_DONE");
       const profileIntelligenceResult =
    await ProfileIntelligenceAPI({
        normalizedEvidence
    });

const universalPackage =
    profileIntelligenceResult?.universalPackage || {};

const cerebrasPackage =
    await CerebrasEvidenceIntelligence({
        profileIntelligence:
            universalPackage
    });
       console.log(
    "CEREBRAS_PACKAGE",
    JSON.stringify(
        cerebrasPackage,
        null,
        2
    )
);
console.log(
    "NORMALIZED_EVIDENCE",
    JSON.stringify(
        normalizedEvidence,
        null,
        2
    )
);

const findingsPackage =
    await CrossEvidenceAnalyzer(
        normalizedEvidence
    );

console.log(
    "FINDINGS_PACKAGE",
    JSON.stringify(
        findingsPackage,
        null,
        2
    )
);

const confidencePackage =
    await EvidenceConfidenceEngine(
        {
            ...normalizedEvidence,
            findings:
                findingsPackage.findings
        }
    );
       const universalPackageText =
    JSON.stringify(
        universalPackage || {}
    );

if (
    !universalPackage ||
    !Object.keys(universalPackage).length ||
    universalPackageText.length > 3000
) {

    result.errors.push(
        "Universal Public Evidence Package is missing or exceeds 3000 characters."
    );

    return result;
}

const crossEvidencePackage =
    await CrossEvidencePackageBuilder({
        identityPackage,
        footprintPackage:
            discoveryPackage,
        findingsPackage,
        confidencePackage,
       universalPackage
    });

result.crossEvidencePackage =
    crossEvidencePackage;
        result.success = true;

        return result;

    } catch (error) {

        result.errors.push(error.message);

        return result;
    }
}

function calculateEvidenceScore(
    mergedEvidence = {}
){

    let score = 0;

    const profiles =
        mergedEvidence.profiles?.length || 0;

    const posts =
        mergedEvidence.posts?.length || 0;

    const articles =
        mergedEvidence.articles?.length || 0;

    const comments =
        mergedEvidence.comments?.length || 0;

    const links =
        mergedEvidence.links?.length || 0;

    const publicSignals =
        mergedEvidence.publicSignals?.length || 0;

    const traceability =
        mergedEvidence.traceability?.length || 0;

    score += Math.min(profiles * 10, 20);

    score += Math.min(posts * 5, 20);

    score += Math.min(articles * 5, 20);

    score += Math.min(comments * 2, 10);

    score += Math.min(links * 1, 10);

    score += Math.min(publicSignals * 5, 10);

    score += Math.min(traceability * 5, 10);

    return Math.max(
        0,
        Math.min(score, 100)
    );
                      }

async function collectSourceEvidence(url) {

    try {
       const identityPackage =
  await IdentityExtractionBrain({
    sourceUrl: url
  });

console.log(
  "IDENTITY_PACKAGE",
  identityPackage
);
const footprintPackage =
  await FootprintDiscoveryBrain(
    identityPackage
);

console.log(
  "FOOTPRINT_PACKAGE",
  footprintPackage
);
        const urlPackage =
await loadPublicContentFetcher({
    profileLinks: [url]
});
console.log(
    "URL_PACKAGE",
    JSON.stringify(urlPackage, null, 2)
);
        const rawPackage =
            await acquirePublicContent(
                urlPackage
            );
console.log(
    "RAW_PACKAGE",
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

        const finalPackage =
            buildPublicContentPackage(
                rawPackage,
                extractedPackage
            );
       console.log(
  "RAW_PACKAGE",
  {
    success: rawPackage?.success,
    htmlLength: rawPackage?.html?.length,
    textLength: rawPackage?.text?.length
  }
);

console.log(
  "EXTRACTED_PACKAGE",
  {
    success: extractedPackage?.success,
    visibleTextLength:
      extractedPackage?.visibleText?.length,
    links:
      extractedPackage?.links?.length
  }
);

        console.log(
            "CROSS_EVIDENCE_FINAL_PACKAGE",
            {
                success:
                    finalPackage?.success,

                title:
                    finalPackage?.title,

                visibleTextLength:
                    finalPackage?.visibleText?.length || 0,

                links:
                    finalPackage?.links?.length || 0,

                headings:
                    finalPackage?.headings?.length || 0
            }
        );
       console.log(
    "FINAL_PACKAGE_BEFORE_CEREBRAS",
    JSON.stringify(finalPackage, null, 2)
);

        return {

            success:
                finalPackage.success,

            package:
                finalPackage,

            reason:
                finalPackage.reason || null

        };

    } catch (error) {

        console.error(
            "COLLECT_SOURCE_EVIDENCE_ERROR",
            error
        );

        return {

            success: false,

            reason: error.message

        };

    }

}
function mergeEvidencePackages(packages) {

    const merged = {

        profiles: [],

        posts: [],

        comments: [],

        articles: [],

        links: [],

        publicSignals: [],

        traceability: []

    };

    for (const pkg of packages) {

        if (!pkg?.success) continue;

        merged.publicSignals.push(
            ...(pkg.publicSignals || [])
        );

        merged.traceability.push(
            ...(pkg.traceability || [])
        );

    }

    return merged;
      }
// ====================================
// Identity Extraction Brain
// ====================================
/*IDENTITY EXTRACTION BRAIN

Goal:
Extract observable identity signals.

Rules:
- Use only provided profile links.
- Never guess.
- Never perform investigation.
- Never generate conclusions.
- Extract names if visible.
- Extract usernames.
- Extract company names.
- Extract websites.
- Extract public identifiers.
- Return structured identity package only.

Output:
Identity Package*/
async function IdentityExtractionBrain({
  profileLinks = []
}) {

  const identity = {

    success: false,

    name: null,

    company: null,

    website: null,

    title: null,

    keywords: [],
identities: [],
    sourceLinks: profileLinks
     
     

  };

  try {

    if (!profileLinks.length) {
      return identity;
    }
     for (const link of profileLinks) {

  try {

    const url = new URL(link);

    identity.identities.push({
      type: "hostname",
      value: url.hostname
    });

    identity.identities.push({
      type: "pathname",
      value: url.pathname
    });
     const segments =
  url.pathname
    .split("/")
    .filter(Boolean);

if (segments.length > 0) {

  const username =
    segments[
      segments.length - 1
    ];

  identity.identities.push({
    type: "username",
    value: username
  });

     }
     let platform = "unknown";

if (
  url.hostname.includes(
    "linkedin"
  )
) {
  platform = "linkedin";
}
else if (
  url.hostname.includes(
    "github"
  )
) {
  platform = "github";
}
else if (
  url.hostname.includes(
    "twitter"
  ) ||
  url.hostname.includes(
    "x.com"
  )
) {
  platform = "x";
}
else if (
  url.hostname.includes(
    "facebook"
  )
) {
  platform = "facebook";
}

identity.identities.push({
  type: "platform",
  value: platform
});

  } catch (error) {

    console.log(
      "IDENTITY_PARSE_ERROR",
      error.message
    );

  }

   }
     console.log(
  "IDENTITY_PACKAGE",
  JSON.stringify(
    identity,
    null,
    2
  )
);

    identity.success = true;

    return identity;

  } catch (error) {

    return {
      ...identity,
      reason: error.message
    };

  }

}

// ====================================
// Footprint Discovery Brain
// ====================================
/*FOOTPRINT DISCOVERY BRAIN

Goal:
Find possible public footprint locations.

Rules:
- Start from Identity Package.
- Never guess hidden accounts.
- Never create evidence.
- Discover only public candidate sources.
- Look for websites.
- Look for social profiles.
- Look for company pages.
- Preserve traceability.
- Return discovery package only.

Output:
Discovery Package*/
async function FootprintDiscoveryBrain(
    identityPackage
) {

    const result = {
        success: false,
        discoveredProfiles: []
    };

    for (
        const identity of
        identityPackage.identities
    ) {

        if (
            identity.type === "profile"
        ) {

            result.discoveredProfiles.push(
                identity.value
            );

        }

    }

    result.success =
        result.discoveredProfiles.length > 0;

    console.log(
        "DISCOVERY_PACKAGE",
        result
    );

    return result;

}

// ====================================
// Evidence Normalizer
// ====================================
/*
EVIDENCE NORMALIZER

Goal:
Convert evidence into one format.

Rules:
- Never analyze.
- Never infer.
- Never score.
- Preserve source.
- Preserve content.
- Preserve traceability.
- Remove duplicates.
- Return normalized package only.

Output:
Normalized Evidence Package
*/
async function EvidenceNormalizer(
    evidencePackages = []
) {

    const normalized = {
        success: true,
        sources: []
    };

    const seen = new Set();

    for (const evidence of evidencePackages) {

        if (!evidence) continue;

        const key =
            evidence.url ||
            JSON.stringify(evidence);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);

        normalized.sources.push(
            evidence
        );

    }

    return normalized;

}

// ====================================
// Cross Evidence Analyzer
// ====================================
/*
CROSS EVIDENCE ANALYZER

Goal:
Compare evidence sources.

Rules:
- Evidence first.
- Never guess.
- Never invent evidence.
- Find overlaps.
- Find contradictions.
- Find repeated signals.
- Preserve traceability.
- Return findings only.

Output:
Cross Evidence Package
*/
async function CrossEvidenceAnalyzer(
    evidencePackage
) {

    const findings = [];

    try {

        const sources =
            evidencePackage?.sources || [];

        const links =
            evidencePackage?.links || [];

        const headings =
            evidencePackage?.headings || [];

        const keywords =
            evidencePackage?.keywords || [];

        if (sources.length > 1) {

            findings.push({
                type: "multi-source",
                message:
                    `${sources.length} evidence sources found`
            });

        }

        if (links.length > 0) {

            findings.push({
                type: "link-footprint",
                message:
                    `${links.length} discovered links`
            });

        }

        if (headings.length > 0) {

            findings.push({
                type: "content-structure",
                message:
                    `${headings.length} content sections found`
            });

        }

        if (keywords.length > 0) {

            findings.push({
                type: "keyword-pattern",
                message:
                    `${keywords.length} recurring keywords found`
            });

        }

        return {

            success: true,

            findings,

            sourceCount:
                sources.length,

            linkCount:
                links.length

        };

    } catch (error) {

        return {

            success: false,

            findings: [],

            reason:
                error.message

        };

    }

               }

// ====================================
// Evidence Confidence Engine
// ====================================
/*
EVIDENCE CONFIDENCE BRAIN

Goal:
Measure evidence strength.

Rules:
- Use evidence only.
- Never analyze psychology.
- Never generate patterns.
- Count sources.
- Count confirmations.
- Count contradictions.
- Assign confidence.
- Return confidence package only.

Output:
Confidence Package
*/
async function EvidenceConfidenceEngine(
    evidencePackage
) {

    try {

        const sources =
            evidencePackage?.sources || [];

        const links =
            evidencePackage?.links || [];

        const findings =
            evidencePackage?.findings || [];

        let confidence = 0;

        confidence +=
            Math.min(
                sources.length * 20,
                40
            );

        confidence +=
            Math.min(
                links.length * 2,
                30
            );

        confidence +=
            Math.min(
                findings.length * 10,
                30
            );

        confidence =
            Math.min(
                confidence,
                100
            );

        return {

            success: true,

            confidence,

            sourceCount:
                sources.length,

            linkCount:
                links.length,

            findingCount:
                findings.length

        };

    } catch (error) {

        return {

            success: false,

            confidence: 0,

            reason:
                error.message

        };

    }

           }
/*CROSS EVIDENCE PACKAGE BUILDER

Goal:
Create one final evidence package.

Rules:
- Never generate evidence.
- Never modify evidence.
- Preserve traceability.
- Merge brain outputs.
- Keep source links.
- Keep confidence.
- Keep findings.
- Return one package only.

Output:
Cross Evidence Package*/

async function CrossEvidencePackageBuilder({

    identityPackage,

    footprintPackage,

    findingsPackage,

    confidencePackage,

    universalPackage

}) {

    return {

        success: true,

        identity:
            identityPackage,

        footprint:
            footprintPackage,

        findings:
            findingsPackage,

        confidence:
            confidencePackage,

        universalPackage

    };

}
async function ProfileIntelligenceAPI({
    normalizedEvidence = {}
}) {

    const prompt = `
You are TruthLoop's Universal Public Evidence Package Generator.

Your ONLY job is to compress normalized public evidence into ONE
small, factual Universal Package for downstream Loop 7 analysis.

INPUT:
Normalized public evidence.

EXTRACT ONLY:

- verified identity
- name
- title / role
- company / brand
- website
- location
- public platforms
- recurring topics
- expertise signals
- audience signals
- business / creator signals
- public activity signals
- repeated behavioral signals explicitly supported by evidence
- contradictions explicitly supported by evidence
- important public evidence
- source URLs

REMOVE COMPLETELY:

- HTML
- CSS
- JavaScript
- page layout
- navigation
- menus
- styling
- images
- technical metadata
- duplicate text
- boilerplate
- raw content dumps
- generic descriptions

RULES:

- Use only evidence explicitly present.
- Never guess.
- Never infer unsupported identity.
- Never invent behavior.
- Never diagnose psychology.
- Never generate advice.
- Never explain reasoning.
- Preserve useful source URLs.
- Prefer repeated and strongly supported signals.
- Missing information must remain null or [].
- Do not reproduce raw evidence.

OUTPUT:

Return ONLY one Universal Public Evidence Package.

Maximum total output: 3000 characters.

Return valid JSON only.

FORMAT:
{
  "identity": {
    "name": null,
    "title": null,
    "company": null,
    "website": null,
    "location": null
  },
  "platforms": [],
  "positioning": {
    "summary": null,
    "niche": null,
    "expertise": [],
    "audience": []
  },
  "businessSignals": [],
  "creatorSignals": [],
  "recurringTopics": [],
  "behavioralSignals": [],
  "contradictions": [],
  "evidence": [],
  "sourceLinks": []
}

NORMALIZED PUBLIC EVIDENCE:
${JSON.stringify(normalizedEvidence)}
`;

    const response =
        await fetch(
            "https://api.cerebras.ai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${process.env.CEREBRAS_API_KEY}`,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    model:
                        "qwen-3-235b-a22b-thinking-2507",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_completion_tokens: 3000
                })
            }
        );

    const data =
        await response.json();

    const content =
        data?.choices?.[0]?.message?.content || "{}";

    let universalPackage = {};

    try {

        universalPackage =
            JSON.parse(content);

    } catch {

        universalPackage = {
            error: "Invalid JSON returned by Cerebras"
        };

    }

    return {

        success: true,

        source: "cerebras",

        universalPackage

    };

}


async function CerebrasEvidenceIntelligence({
    truthLoopPackage = {},
    profileIntelligence = {}
}) {

    const prompt = `
You are TruthLoop's Evidence Intelligence Engine.

Your ONLY job is to convert the Universal Public Evidence Package
into compact investigation-ready evidence intelligence.

Use ONLY the supplied Universal Package.

IDENTIFY:

- strongest verified identity signals
- strongest public positioning signals
- repeated themes
- meaningful behavioral signals
- business / creator signals
- contradictions
- supporting evidence
- missing evidence
- cross-platform signals
- source links

RULES:

- Evidence first.
- Never guess.
- Never invent evidence.
- Never diagnose psychology.
- Never generate advice.
- Never return raw evidence.
- Never return HTML or technical data.
- Never return the TruthLoop conversation.
- Every important finding must be supported by a source URL.
- If evidence is missing, mark it as missing.
- Keep the package compact.
- Maximum output: 3000 characters.
- Return valid JSON only.

OUTPUT:
{
  "identitySignals": [],
  "positioningSignals": [],
  "repeatedThemes": [],
  "behavioralSignals": [],
  "businessSignals": [],
  "contradictions": [],
  "supportingEvidence": [],
  "missingEvidence": [],
  "crossPlatformSignals": [],
  "sourceLinks": []
}

UNIVERSAL PUBLIC EVIDENCE PACKAGE:
${JSON.stringify(profileIntelligence)}
`;

    const response =
        await fetch(
            "https://api.cerebras.ai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${process.env.CEREBRAS_API_KEY}`,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    model:
                        "qwen-3-235b-a22b-thinking-2507",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_completion_tokens: 3000
                })
            }
        );

    const data =
        await response.json();

    const content =
        data?.choices?.[0]?.message?.content || "{}";

    let intelligencePackage = {};

    try {

        intelligencePackage =
            JSON.parse(content);

    } catch {

        intelligencePackage = {
            error:
                "Invalid JSON returned by Cerebras"
        };

    }

    return {

        success: true,

        source: "cerebras",

        intelligencePackage

    };

}
