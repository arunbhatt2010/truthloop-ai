/*============================================================
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

if (
  identityPackage?.identities?.length > 0 &&
  identityPackage.identities.some(
    x =>
      x.type !== "platform" ||
      x.value !== "unknown"
  )
) {
  result.identityPackage =
    identityPackage;
}

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
console.log(
    "BEFORE_MERGE_EVIDENCE"
);
       console.log(
    "EVIDENCE_PACKAGES_COUNT",
    result.evidencePackages.length
);

console.log(
    "EVIDENCE_PACKAGES_SAMPLE",
    JSON.stringify(
        result.evidencePackages[0],
        null,
        2
    )
);
        result.mergedEvidence =
            mergeEvidencePackages(
                result.evidencePackages
            );
       console.log(
    "ALL_EVIDENCE_PACKAGES",
    JSON.stringify(
        result.evidencePackages,
        null,
        2
    )
);
       console.log(
    "AFTER_MERGE_EVIDENCE"
);
console.log("STEP_1_MERGE_DONE");
        result.confidenceScore =
            calculateEvidenceScore(
                result.mergedEvidence
            );
       console.log("STEP_2_NORMALIZER_START");
       console.log(
    "MERGED_EVIDENCE_TYPE",
    typeof result.mergedEvidence
);

console.log(
    "MERGED_EVIDENCE",
    JSON.stringify(
        result.mergedEvidence,
        null,
        2
    )
);
const normalizedEvidence =
    await EvidenceNormalizer(
        result.mergedEvidence
    );
       console.log("STEP_3_NORMALIZER_DONE");
       const universalPackage = {
    identity: identityPackage || {},
  //  footprint: discoveryPackage || {},
    sourceLinks: normalizedEvidence?.sourceLinks || [],
    normalizedEvidence,
    rawEvidence: result.mergedEvidence || {}
};
console.log(
    "UNIVERSAL_PACKAGE_FROM_PROFILE_INTELLIGENCE",
    JSON.stringify(universalPackage).length
);
       console.log("BEFORE_CEREBRAS_CALL");
const cerebrasPackage = { success:true, skipped:true };
console.log(
    "SENDING_TO_CEREBRAS",
    JSON.stringify(universalPackage).length
);
       console.log(
    "CEREBRAS_PACKAGE",
    JSON.stringify(
        cerebrasPackage,
        null,
        2
    )
);
       console.log(
    "CEREBRAS_PACKAGE_SIZE",
    JSON.stringify(cerebrasPackage || {}).length
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
console.log(
    "FINAL_UNIVERSAL_PACKAGE_SIZE",
    universalPackageText.length
);
if (
    !universalPackage ||
    !Object.keys(universalPackage).length
) {

    result.errors.push(
        "Universal Public Evidence Package is missing."
    );

    return result;
}

const crossEvidencePackage =
    await CrossEvidencePackageBuilder({
        identityPackage,
      //  footprintPackage:
            //discoveryPackage,
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
//console.log(
 // "DEFAULT_IDENTITY_PACKAGE",
 // identityPackage
//);
       
const footprintPackage = {
    success: false,
    discoveredProfiles: []
};
        const urlPackage =
await loadPublicContentFetcher({
    profileLinks: [url]
});
console.log(
    "URL_PACKAGE",
    JSON.stringify(urlPackage, null, 2)
);
        const rawPackage = urlPackage;
       console.log(
    "RAW_SOURCE_0",
    JSON.stringify(
        rawPackage?.sources?.[0],
        null,
        2
    )
);
            await acquirePublicContent(
                urlPackage
            );
console.log(
    "RAW_PACKAGE",
    JSON.stringify(rawPackage, null, 2)
);
        const validatedPackage = rawPackage;
            

        const cleanPackage =
            cleanPublicContent(
                validatedPackage
            );

        const extractedPackage = {
  success: true,
  visibleText:
    rawPackage?.sources?.[0]?.visibleText || "",

  socialLinks:
    rawPackage?.sources?.[0]?.socialLinks || [],

  title:
    rawPackage?.sources?.[0]?.title || "",

  description:
    rawPackage?.sources?.[0]?.description || ""
};
console.log(
  "EXTRACTED_PACKAGE_FULL",
  JSON.stringify(extractedPackage, null, 2)
);
       console.log(
  "RAW_VISIBLE_TEXT_LENGTH",
  rawPackage?.sources?.[0]?.visibleText?.length
);

console.log(
  "RAW_TITLE",
  rawPackage?.sources?.[0]?.title
);

console.log(
  "RAW_DESCRIPTION",
  rawPackage?.sources?.[0]?.description
);
       console.log(
  "EXTRACTED_VISIBLE_TEXT_LENGTH",
  extractedPackage?.visibleText?.length
);
        const finalPackage =
            buildPublicContentPackage(
                rawPackage,
                extractedPackage
            );
       const publicContentPackage = finalPackage;
       console.log(
  "FINAL_PACKAGE_KEYS",
  Object.keys(finalPackage || {})
);
       console.log(
    "VISIBLE_TEXT_LENGTH",
    publicContentPackage?.visibleText?.length || 0
);

console.log(
    "SOCIAL_LINK_COUNT",
    publicContentPackage?.socialLinks?.length || 0
);

console.log(
    "PUBLIC_CONTENT_PREVIEW",
    publicContentPackage?.visibleText?.slice(0,500)
);
       console.log(
  "FIRST_SOURCE",
  JSON.stringify(
    finalPackage?.sources?.[0],
    null,
    2
  )
);
       console.log(
  "FINAL_PACKAGE_FULL",
  JSON.stringify(finalPackage, null, 2)
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

            package: {
    ...finalPackage,
    sourceUrl: url,
    sourcePlatform:
        finalPackage?.sources?.[0]?.platform ||
        "unknown",
    sourceHost:
        (() => {
            try {
                return new URL(url).hostname;
            } catch {
                return null;
            }
        })()
},
            reason:
                finalPackage.reason || null

        };

    } catch (error) {

    console.error(
        "COLLECT_SOURCE_EVIDENCE_ERROR",
        {
            message: error?.message,
            stack: error?.stack,
            name: error?.name
        }
    );

    return {
        success: false,
        reason: error?.message
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
        traceability: [],
        sources: []
    };

    const seen = new Set();

    const pushUnique = (target, items = []) => {

        for (const item of items) {

            const key =
                typeof item === "string"
                    ? item
                    : JSON.stringify(item);

            if (!key) continue;

            const scopedKey = `${target}:${key}`;

            if (seen.has(scopedKey)) continue;

            seen.add(scopedKey);
            merged[target].push(item);
        }
    };

    for (const pkg of packages || []) {
console.log(
    "MERGE_PKG",
    JSON.stringify(pkg, null, 2)
);
    if (!pkg?.success) continue;

    const sources =
        Array.isArray(pkg.sources) && pkg.sources.length
            ? pkg.sources
            : [pkg];

    for (const source of sources) {
console.log(
    "MERGE_SOURCE",
    JSON.stringify(source, null, 2)
);
        merged.sources.push({

            sourceUrl:
                source.sourceUrl ||
                pkg.sourceUrl ||
                pkg.url ||
                null,

            sourcePlatform:
                source.platform ||
                source.sourcePlatform ||
                pkg.sourcePlatform ||
                "unknown",

            sourceHost:
                source.sourceHost ||
                pkg.sourceHost ||
                (() => {
                    try {
                        return source.sourceUrl
                            ? new URL(source.sourceUrl).hostname
                            : null;
                    } catch {
                        return null;
                    }
                })(),

            title:
                source.title ||
                pkg.title ||
                null,

            description:
                source.description ||
                pkg.description ||
                null,

            visibleText:
                source.visibleText ||
                "",

            socialLinks:
                Array.isArray(source.socialLinks)
                    ? source.socialLinks.slice(0, 50)
                    : [],

            contentLength:
                source.contentLength ||
                source.visibleText?.length ||
                0,

            canonicalUrl:
                source.canonicalUrl ||
                pkg.canonicalUrl ||
                null,

            status:
                source.status ||
                pkg.status ||
                null,

            contentType:
                source.contentType ||
                pkg.contentType ||
                null,

            language:
                source.language ||
                pkg.language ||
                null,

            headings:
                Array.isArray(source.headings)
                    ? source.headings.slice(0, 20)
                    : [],

            posts:
                Array.isArray(source.posts)
                    ? source.posts.slice(0, 20)
                    : [],

            comments:
                Array.isArray(source.comments)
                    ? source.comments.slice(0, 20)
                    : [],

            articles:
                Array.isArray(source.articles)
                    ? source.articles.slice(0, 20)
                    : [],

            links:
                Array.isArray(source.links)
                    ? source.links.slice(0, 50)
                    : [],

            publicSignals:
                Array.isArray(source.publicSignals)
                    ? source.publicSignals.slice(0, 30)
                    : [],

            traceability:
                Array.isArray(source.traceability)
                    ? source.traceability.slice(0, 30)
                    : []
        });
    }

    pushUnique("profiles", pkg.profiles);
    pushUnique("posts", pkg.posts);
    pushUnique("comments", pkg.comments);
    pushUnique("articles", pkg.articles);
    pushUnique("links", pkg.links);
    pushUnique("publicSignals", pkg.publicSignals);
    pushUnique("traceability", pkg.traceability);
}

return merged;
}

// ====================================
// Evidence Input Builder
// ====================================
function buildEvidenceLedger(mergedEvidence = {}) {
   console.log(
    "LEDGER_MERGED_EVIDENCE",
    JSON.stringify(mergedEvidence, null, 2)
);
   console.log(
  "LEDGER_ENTER"
);
   console.log(
    "LEDGER_OBJECT",
    JSON.stringify(mergedEvidence, null, 2)
);

console.log(
    "LEDGER_SOURCE_COUNT",
    mergedEvidence?.sources?.length
);
   console.log(
  "LEDGER_FUNCTION_ENTERED",
  mergedEvidence?.sources?.length
);

    const ledger = [];
console.log(
    "LEDGER_SOURCES_COUNT",
    mergedEvidence?.sources?.length
);
    for (const source of mergedEvidence.sources || []) {
       console.log(
  "LEDGER_LOOP_START",
  source.sourceUrl
);
       console.log(
  "SOURCE_KEYS",
  Object.keys(source || {})
);
console.log(
    "VISIBLE_TEXT_TYPE",
    typeof source.visibleText
  );

  console.log(
    "VISIBLE_TEXT_LENGTH",
    source.visibleText?.length
  );

  console.log(
    "VISIBLE_TEXT_SAMPLE",
    source.visibleText?.slice(0, 300)
  );
        const sourceUrl =
            source.sourceUrl ||
            source.canonicalUrl ||
            null;

        const sourceId =
            sourceUrl ||
            source.sourceHost ||
            `source-${ledger.length + 1}`;

        const addEvidence = (type, value, index) => {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return;
  }

  const evidence = String(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!evidence) return;

  ledger.push({
    id: `${sourceId}#${type}-${index + 1}`,
    sourceUrl,
    sourcePlatform:
      source.sourcePlatform || "unknown",
    sourceType: type,
    evidence: evidence.slice(0, 700)
  });
};

        if (source.title) {
            addEvidence("title", source.title, 0);
        }
       if (source.visibleText) {
    addEvidence(
        "visibleText",
        source.visibleText.slice(0, 5000),
        0
    );
       }
console.log(
    "LEDGER_BEFORE_ADD",
    ledger.length
);
        (source.headings || [])
            .slice(0, 15)
            .forEach(
                (item, index) =>
                    addEvidence("heading", item, index)
            );

        (source.posts || [])
            .slice(0, 20)
            .forEach(
                (item, index) =>
                    addEvidence("content", item, index)
            );

        (source.articles || [])
            .slice(0, 10)
            .forEach(
                (item, index) =>
                    addEvidence("article", item, index)
            );
       console.log(
    "LEDGER_LOOP_END",
    source.sourceUrl,
    ledger.length
  );
    }
console.log(
    "FINAL_LEDGER_COUNT",
    ledger.length
);

console.log(
    "FINAL_LEDGER_SAMPLE",
    ledger.slice(0, 3)
);
   console.log(
  "LEDGER_DONE",
  ledger.length
);
    return ledger.slice(0, 80);
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

    profileLinks = [],
    sourceLinks = []

}) {

  const identity = {

    success: false,

    name: null,
    company: null,
    website: null,
    title: null,

    keywords: [],
    identities: [],

    sourceLinks: [
        ...profileLinks,
        ...sourceLinks
    ]

};

  try {

    if (
    !profileLinks.length &&
    !sourceLinks.length
) {
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
  "EXTRACTED_IDENTITY_PACKAGE",
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
    identityPackage = {}
) {

    const discoveredProfiles = [];

    // 1. Direct source links
    for (
        const link of
        (identityPackage.sourceLinks || [])
    ) {

        if (
            typeof link === "string" &&
            link.startsWith("http")
        ) {

            discoveredProfiles.push(link);

        }

    }

    // 2. Publicly discovered profiles
    for (
        const profile of
        (identityPackage.profiles || [])
    ) {

        const url =
            profile?.url ||
            profile?.value;

        if (
            typeof url === "string" &&
            url.startsWith("http")
        ) {

            discoveredProfiles.push(url);

        }

    }

    // 3. Legacy identity support
    for (
        const identity of
        (identityPackage.identities || [])
    ) {

        if (
            identity?.type === "profile" &&
            identity?.value
        ) {

            discoveredProfiles.push(
                identity.value
            );

        }

    }

    // 4. Remove duplicates
    const uniqueProfiles =
        [...new Set(discoveredProfiles)];

    // 5. Platform detection
    const normalizedProfiles =
        uniqueProfiles.map(url => {

            let platform = "website";

            if (
                url.includes("linkedin.com")
            ) {
                platform = "linkedin";
            }

            else if (
                url.includes("instagram.com")
            ) {
                platform = "instagram";
            }

            else if (
                url.includes("facebook.com")
            ) {
                platform = "facebook";
            }

            else if (
                url.includes("youtube.com") ||
                url.includes("youtu.be")
            ) {
                platform = "youtube";
            }

            else if (
                url.includes("x.com") ||
                url.includes("twitter.com")
            ) {
                platform = "x";
            }

            else if (
                url.includes("github.com")
            ) {
                platform = "github";
            }

            return {
                url,
                platform
            };

        });

    const result = {
        success:
            normalizedProfiles.length > 0,

        discoveredProfiles:
            normalizedProfiles,

        profileCount:
            normalizedProfiles.length
    };

    console.log(
        "DISCOVERY_PACKAGE",
        JSON.stringify(
            result,
            null,
            2
        )
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

    console.log("NORMALIZER_ENTERED");

    if (!Array.isArray(evidencePackages)) {
        evidencePackages = [evidencePackages];
    }

    const normalized = {
        success: true,
        sources: [],
        sourceLinks: [],
        evidenceLedger: []
    };

    const seen = new Set();

    for (const evidence of evidencePackages) {

        if (!evidence) continue;

        // Preserve incoming sourceLinks
        if (
            Array.isArray(evidence?.sourceLinks)
        ) {

            for (const link of evidence.sourceLinks) {

                if (
                    typeof link === "string" &&
                    /^https?:\/\//i.test(link) &&
                    !normalized.sourceLinks.includes(link)
                ) {
                    normalized.sourceLinks.push(link);
                }

            }

        }

        const sources =
            Array.isArray(evidence.sources)
                ? evidence.sources
                : [evidence];

        for (const source of sources) {

            const sourceUrl =
                source?.sourceUrl ||
                source?.canonicalUrl ||
                source?.url ||
                null;

            const key =
                sourceUrl ||
                JSON.stringify(source);

            if (seen.has(key)) continue;

            seen.add(key);

            normalized.sources.push({

  sourceUrl,

  sourcePlatform:
    source?.sourcePlatform ||
    source?.platform ||
    "unknown",

  sourceHost:
    source?.sourceHost ||
    null,

  title:
    source?.title ||
    null,

  description:
    source?.description ||
    null,

  visibleText:
    source?.visibleText ||
    source?.text ||
    source?.content ||
    "",

  socialLinks:
    Array.isArray(source?.socialLinks)
      ? source.socialLinks
      : [],

  contentLength:
    source?.contentLength ||
    (
      source?.visibleText
      ? source.visibleText.length
      : 0
    ),

  canonicalUrl:
    source?.canonicalUrl ||
    null,

  status:
    source?.status ||
    null,

  contentType:
    source?.contentType ||
    null,

  language:
    source?.language ||
    null,

  headings:
    Array.isArray(source?.headings)
      ? source.headings.slice(0,20)
      : [],

  posts:
    Array.isArray(source?.posts)
      ? source.posts.slice(0,20)
      : [],

  comments:
    Array.isArray(source?.comments)
      ? source.comments.slice(0,20)
      : [],

  articles:
    Array.isArray(source?.articles)
      ? source.articles.slice(0,20)
      : [],

  links:
    Array.isArray(source?.links)
      ? source.links.slice(0,50)
      : [],

  publicSignals:
    Array.isArray(source?.publicSignals)
      ? source.publicSignals.slice(0,30)
      : [],

  traceability:
    Array.isArray(source?.traceability)
      ? source.traceability.slice(0,30)
      : []

});

            if (
                sourceUrl &&
                !normalized.sourceLinks.includes(sourceUrl)
            ) {
                normalized.sourceLinks.push(sourceUrl);
            }
        }
    }
console.log(
  "BEFORE_LEDGER_BUILD"
);
   console.log(
    "LEDGER_INPUT",
    JSON.stringify({
        sourceCount: normalized.sources?.length,
        firstSource: normalized.sources?.[0]
    }, null, 2)
);
    normalized.evidenceLedger =
        buildEvidenceLedger({
            sources: normalized.sources
        });
   console.log(
  "AFTER_LEDGER_BUILD",
  normalized.evidenceLedger?.length
);
   console.log(
  "NORMALIZED_SOURCE_COUNT",
  normalized.sources.length
);

normalized.sources.forEach((s, i) => {
  console.log(
    `NORMALIZED_SOURCE_${i}`,
    JSON.stringify(s, null, 2)
  );
});

    console.log(
        "NORMALIZER_DONE",
        {
            sources:
                normalized.sources.length,
            sourceLinks:
                normalized.sourceLinks.length,
            evidenceUnits:
                normalized.evidenceLedger.length
        }
    );

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

        const ledger =
            evidencePackage?.evidenceLedger || [];

        const sourceLinks =
            evidencePackage?.sourceLinks || [];

        const discoveredLinks = new Set();

        for (const source of sources) {

    const allLinks = [

        ...(source?.links || []),

        ...(source?.socialLinks || []),

        ...(source?.sourceLinks || [])

    ];

    for (const link of allLinks) {

        if (
            typeof link === "string" &&
            /^https?:\/\//i.test(link)
        ) {
            discoveredLinks.add(link);
        }

    }

        }
        if (sources.length > 1) {
            findings.push({
                type: "multi-source",
                message:
                    `${sources.length} public evidence sources were collected.`,
                sourceLinks
            });
        }

        if (discoveredLinks.size > 0) {
            findings.push({
                type: "link-footprint",
                message:
                    `${discoveredLinks.size} public links were discovered inside supplied sources.`,
                sourceLinks:
                    Array.from(discoveredLinks).slice(0, 30)
            });
        }

        const headingsCount =
            sources.reduce(
                (sum, source) =>
                    sum + (source?.headings?.length || 0),
                0
            );

        if (headingsCount > 0) {
            findings.push({
                type: "content-structure",
                message:
                    `${headingsCount} public content sections were available for evidence extraction.`,
                sourceLinks
            });
        }

        if (ledger.length > 0) {
            findings.push({
                type: "traceable-evidence",
                message:
                    `${ledger.length} source-backed evidence units are available for investigation.`,
                evidenceCount: ledger.length,
                sourceLinks
            });
        }

        return {

    success: true,

    findings,

    sourceCount:
        sources.length,

    linkCount:
        discoveredLinks.size,

    evidenceCount:
        ledger.length,

    sourceLinks,

    discoveredLinks:
        Array.from(discoveredLinks)

};

    } catch (error) {

        return {
            success: false,
            findings: [],
            reason: error.message
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

        const ledger =
            evidencePackage?.evidenceLedger || [];

        const sourceLinks =
            evidencePackage?.sourceLinks || [];

        const findings =
            evidencePackage?.findings || [];

        const platforms = new Set(
            sources
                .map(
                    source =>
                        source?.sourcePlatform
                )
                .filter(Boolean)
        );

        let confidence = 0;

        confidence +=
            Math.min(
                sources.length * 20,
                40
            );

        confidence +=
            Math.min(
                ledger.length,
                25
            );

        confidence +=
            Math.min(
                sourceLinks.length * 5,
                15
            );

        confidence +=
            Math.min(
                platforms.size * 10,
                10
            );

        confidence +=
            Math.min(
                findings.length * 2,
                10
            );

        return {
            success: true,
            confidence: Math.min(confidence, 100),
            sourceCount: sources.length,
            sourceLinkCount: sourceLinks.length,
            evidenceCount: ledger.length,
            platformCount: platforms.size,
            findingCount: findings.length
        };

    } catch (error) {

        return {
            success: false,
            confidence: 0,
            reason: error.message
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

        universalPackage,

        evidenceLedger:
            universalPackage?.evidenceLedger ||
            [],

        sourceLinks:
            universalPackage?.sourceLinks ||
            []

    };

}
async function ProfileIntelligenceAPI({
    normalizedEvidence = {}
}) {

    const evidenceInput = {
        sourceLinks:
            normalizedEvidence?.sourceLinks || [],
        sources:
            normalizedEvidence?.sources || [],
        evidenceLedger:
            normalizedEvidence?.evidenceLedger || []
    };
console.log(
   "PROMPT_LENGTH",
   prompt?.length || 0
);

console.log(
   "PROMPT_PREVIEW",
   prompt?.slice(0,1000)
);
    const prompt = `
You are TruthLoop's Universal Public Evidence & Discovery Intelligence Engine.

INPUT:
Normalized public evidence collected from websites, profiles, articles, posts, social platforms, repositories, videos, and discovered public sources.

PRIMARY OBJECTIVE:

Build ONE Universal Public Evidence Package that helps TruthLoop identify:

- who this entity is
- where this entity exists online
- what this entity repeatedly talks about
- what public signals repeatedly appear
- what additional platforms should be investigated

DISCOVERY RULES:

1. Extract every verified identity signal.

2. Detect:
- personal names
- founder names
- creator names
- company names
- brand names
- product names
- website names
- usernames
- handles
- aliases
- repeated identity references

3. If a username, handle, company, brand, website title, creator name, founder name, or repeated identifier appears multiple times across evidence, treat it as a strong identity signal.

4. Extract platform-specific identity clues from:
- URLs
- profile links
- social links
- visible text
- titles
- descriptions
- author references
- bylines
- usernames
- handles

5. Generate platform discovery candidates.

Identify likely presence on:
- LinkedIn
- X
- Facebook
- Instagram
- YouTube
- GitHub
- Reddit
- Medium
- Substack
- Product Hunt
- Indie Hackers
- Crunchbase
- Behance
- Personal Websites
- Other Public Platforms

6. Preserve every discovered profile URL.

7. Preserve every discovered source URL.

8. Detect repeated public topics.

9. Detect repeated expertise signals.

10. Detect repeated audience signals.

11. Detect repeated creator, founder, business, operator, builder, educator, consultant, researcher, or community signals.

12. Detect evidence-backed contradictions only when supported by multiple sources.

13. Detect evidence-backed behavioral signals only when explicitly supported by public evidence.

SAFETY RULES:

- Never invent identities.
- Never invent usernames.
- Never invent profile URLs.
- Never invent platforms.
- Never invent expertise.
- Never invent behavioral claims.
- Never diagnose psychology.
- Never give advice.
- Never generate analysis.
- Never output unsupported facts.

EXTRACTION RULES:

When evidence strongly supports an identity:

Do NOT leave fields null unnecessarily.

Example:

Title:
TruthLoop AI

Visible Text:
TruthLoop AI notices patterns...

Repeated References:
TruthLoop AI

Output:

{
  "company": "TruthLoop AI"
}

because the evidence explicitly supports it.

OUTPUT REQUIREMENTS:

Return ONLY valid JSON.

Return ONE Universal Public Evidence Package.

Include:

{
  "identity": {},
  "names": [],
  "usernames": [],
  "handles": [],
  "companies": [],
  "brands": [],
  "websites": [],
  "platforms": [],
  "discoveredProfiles": [],
  "sourceUrls": [],
  "positioning": [],
  "niches": [],
  "expertiseSignals": [],
  "audienceSignals": [],
  "businessSignals": [],
  "creatorSignals": [],
  "topics": [],
  "behavioralSignals": [],
  "contradictions": [],
  "importantEvidence": []
}

Return complete JSON.

Do not truncate output.

Preserve all supported evidence signals.

Preserve all discovered profile URLs.

Preserve all source URLs.

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
  "evidence": [
    {
      "id": null,
      "claim": null,
      "sourceUrl": null,
      "support": null
    }
  ],
  "sourceLinks": []
}

NORMALIZED PUBLIC EVIDENCE:
${JSON.stringify(evidenceInput)}
`;
console.log("GEMINI_BEFORE");
  const response =
    await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],

                generationConfig: {
                    responseMimeType:
                        "application/json",

                    maxOutputTokens: 3000
                }
            })
        }
    );

console.log(
    "GEMINI_TRIGGER",
    {
        status: response.status,
        ok: response.ok
    }
);

const data =
    await response.json();

console.log(
    "GEMINI_RESPONSE_KEYS",
    Object.keys(data || {})
);

const content =
    data?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text || "{}";
console.log(
    "GEMINI_CONTENT_PREVIEW",
    content.slice(0,500)
);

let universalPackage = {};

try {

    let cleanContent =
        content
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

    universalPackage =
        JSON.parse(cleanContent);

    console.log(
        "GEMINI_AFTER",
        {
            success: true,
            keys: Object.keys(
                universalPackage || {}
            )
        }
    );

} catch (error) {

    console.error(
        "GEMINI_JSON_PARSE_ERROR",
        error
    );

    console.error(
        "GEMINI_RAW_RESPONSE",
        content
    );

    universalPackage = {
        error:
            "Invalid JSON returned by Gemini"
    };

       }

return {

    success: response.ok,

    source: "gemini",

    universalPackage

};

}


async function CerebrasEvidenceIntelligence({
    truthLoopPackage = {},
    profileIntelligence = {}
}) {

    const traceablePackage = {
        ...profileIntelligence,
        sourceLinks:
            profileIntelligence?.sourceLinks || [],
        evidence:
            Array.isArray(profileIntelligence?.evidence)
                ? profileIntelligence.evidence
                : []
    };

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
  "supportingEvidence": [
    {
      "id": null,
      "claim": null,
      "sourceUrl": null,
      "evidence": null
    }
  ],
  "missingEvidence": [],
  "crossPlatformSignals": [],
  "sourceLinks": []
}

UNIVERSAL PUBLIC EVIDENCE PACKAGE:
${JSON.stringify(traceablePackage)}
`;

   console.log("CEREBRAS_BEFORE");
console.log(
    "UNIVERSAL_PACKAGE_SIZE",
    JSON.stringify(profileIntelligence).length
);

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
                model: "gpt-oss-120b",
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

console.log(
    "CEREBRAS_HTTP_STATUS",
    response.status
);

const data =
    await response.json();

console.log(
    "CEREBRAS_RESPONSE",
    JSON.stringify(
        data,
        null,
        2
    )
);

console.log(
    "CEREBRAS_AFTER",
    {
        hasChoices:
            !!data?.choices,
        choicesLength:
            data?.choices?.length || 0,
        hasError:
            !!data?.error
    }
);

const content =
   data?.choices?.[0]?.message?.content || "";

console.log(
   "CEREBRAS_CONTENT",
   content
);

let intelligencePackage = {};

if (!content || !content.trim()) {

   console.log(
      "CEREBRAS_EMPTY_RESPONSE"
   );

   intelligencePackage = {
      error: "Empty Cerebras response"
   };

} else {

   try {

      intelligencePackage =
         JSON.parse(content);

      console.log(
         "CEREBRAS_JSON_PARSED"
      );

   } catch (error) {
   console.log(
    "CEREBRAS_FATAL_ERROR",
    error?.message
);

console.log(
    "CEREBRAS_FATAL_STACK",
    error?.stack
);

    console.log(
        "CEREBRAS_JSON_PARSE_ERROR",
        error?.message
    );

    intelligencePackage = {

        rawContent:
            content,

        parseError:
            error?.message,

        error:
            "Invalid JSON returned by Cerebras"

    };

}
      }

return {

    success: true,

    source: "cerebras",

    intelligencePackage

};

}
