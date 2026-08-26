/* ============================================================
   CROSS EVIDENCE BRAIN v20
   TruthLoop AI

   Mission
   --------
   Collect verified public-source evidence and build ONE compact
   Universal Public Evidence Package for Loop 7.

   Design rules
   ------------
   - No Cerebras.
   - No Gemini.
   - No LLM calls.
   - No raw HTML storage.
   - No raw evidence duplication.
   - No TruthLoop conversation storage.
   - No investigation or psychological interpretation.
   - Preserve source URLs and discovered platform URLs.
   - Keep the final package compact and traceable.

   Upstream
   --------
   DigitalFootprintBrain supplies the verified sourceLinks list.
   PublicContentFetcher is responsible for fetching each source.

   Downstream
   ----------
   EvidenceCompressionBrain / Loop 7 consume:
   result.universalPackage
   or result.crossEvidencePackage.universalPackage
   ============================================================ */

import {
    loadPublicContentFetcher,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";
const MAX_SOURCES = 20;
const MAX_SOCIAL_LINKS_PER_SOURCE = 12;
const MAX_PROFILE_LINKS_TOTAL = 20;
const MAX_TOPICS_PER_SOURCE = 8;
const MAX_EVIDENCE_PER_SOURCE = 4;
const MAX_TEXT_PER_SOURCE = 650;
const MAX_TOTAL_PACKAGE_CHARS = 8000;
async function buildGeminiIntelligence(evidencePackage = {}) {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            status: "disabled",
            reason: "Missing GEMINI_API_KEY"
        };
    }

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
EVIDENCE PRESERVATION RULES:

1. Do NOT reduce all evidence into summaries.

2. Preserve direct evidence snippets.

3. Preserve important website text.

4. Preserve important article excerpts.

5. Preserve important profile descriptions.

6. Preserve important creator statements.

7. Preserve important business claims.

8. Preserve important positioning statements.

9. Preserve important expertise evidence.

10. Preserve evidence-backed contradictions with supporting text.

11. Store preserved evidence inside:

- importantEvidence
- contentSamples
- sourceContent

12. Keep evidence snippets verbatim whenever possible.

13. Preserve the most information-rich evidence first.

14. Maximum 20 evidence snippets.

15. Maximum 500 characters per snippet.

16. Do not invent or rewrite evidence.
Example:

Title:
TruthLoop AI

Visible Text:
TruthLoop AI notices patterns...

Repeated References:
TruthLoop AI

Output:
"importantEvidence": [],
"contentSamples": [],
"sourceContent": []
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
IMPORTANT:

Evidence preservation is more important than compression.

If evidence exists, preserve it.

Do not collapse all source content into short summaries.

Carry forward supporting evidence for later investigation stages.
Preserve all supported evidence signals.

Preserve all discovered profile URLs.

Preserve all source URLs.

{
  "importantEvidence": [
    {
      "claim": null,
      "snippet": null,
      "sourceUrl": null
    }
  ],

  "contentSamples": [
    {
      "type": null,
      "content": null,
      "sourceUrl": null
    }
  ],

  "sourceContent": [
    {
      "sourceUrl": null,
      "content": null
    }
  ]
}

NORMALIZED PUBLIC EVIDENCE:
${JSON.stringify(evidencePackage)};
`;

    try {
       console.log(
  "GEMINI_EVIDENCE_SIZE",
  JSON.stringify(evidencePackage).length
);

console.log(
  "GEMINI_EVIDENCE_KEYS",
  Object.keys(evidencePackage || {})
);
console.log(
  "GEMINI_REQUEST_START"
);
       const modelName = "gemini-3.6-flash";

console.log(
  "GEMINI_MODEL",
  modelName
);
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 15000
              }
            })
          }
        );
console.log(
  "GEMINI_HTTP_STATUS",
  response.status
);

if (!response.ok) {

  const errorBody = await response.text();

  console.log(
    "GEMINI_ERROR_BODY",
    errorBody
  );

  return {
    status: "failed",
    error: errorBody
  };
}

const data = await response.json();

console.log(
  "GEMINI_HTTP_STATUS",
  response.status
);

console.log(
  "GEMINI_CANDIDATES",
  data?.candidates?.length || 0
);

console.log(
  "GEMINI_RESPONSE_KEYS",
  Object.keys(data || {})
);

const content =
  data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

console.log(
  "GEMINI_RESPONSE_SIZE",
  content.length
);

console.log(
  "GEMINI_RAW_CONTENT",
  content
);

if (!content.trim()) {

  return {
    status: "failed",
    error: "Empty Gemini response"
  };

}


let parsedContent;

try {

  console.log(
    "FIRST_200_CHARS",
    content.slice(0, 200)
  );

  console.log(
    "LAST_200_CHARS",
    content.slice(-200)
  );

  console.log(
    "CONTENT_LENGTH",
    content.length
  );

  parsedContent = JSON.parse(
    content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim()
  );

} catch (e) {

  console.log(
    "GEMINI_PARSE_FAILED_CONTENT",
    content
  );

  throw e;

}

console.log(
  "GEMINI_OUTPUT_KEYS",
  Object.keys(parsedContent || {})
);

return parsedContent;

} catch(error){

  console.error(
    "GEMINI_INTELLIGENCE_ERROR",
    error
  );

  return {
    status: "failed",
    error: error.message
  };
}
                       }
const SUPPORTED_PLATFORMS = new Set([
    "linkedin",
    "facebook",
    "instagram",
    "x",
    "github",
    "youtube",
    "medium",
    "substack",
    "reddit",
    "indiehackers",
    "producthunt",
    "crunchbase",
    "behance",
    "dribbble",
    "threads",
    "tiktok",
    "pinterest",
    "quora",
    "devto",
    "hashnode",
    "gitlab"
]);

function normalizeUrl(value = "") {
    if (typeof value !== "string") return "";

    let cleaned = value
        .trim()
        .replace(/[),.;]+$/g, "");

    if (/^\/\//.test(cleaned)) {
        cleaned = `https:${cleaned}`;
    }

    if (!/^https?:\/\//i.test(cleaned)) return "";

    try {
        const url = new URL(cleaned);
        if (!/^https?:$/.test(url.protocol)) return "";
        return url.toString();
    } catch {
        return "";
    }
}

function detectPlatform(value = "") {
    try {
        const hostname = new URL(value).hostname
            .replace(/^www\./, "")
            .toLowerCase();

        if (hostname.includes("linkedin.com")) return "linkedin";
        if (hostname.includes("facebook.com")) return "facebook";
        if (hostname.includes("instagram.com")) return "instagram";
        if (hostname === "x.com" || hostname.includes("twitter.com")) return "x";
        if (hostname.includes("github.com")) return "github";
        if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";
        if (hostname.includes("medium.com")) return "medium";
        if (hostname.includes("substack.com")) return "substack";
        if (hostname.includes("reddit.com")) return "reddit";
        if (hostname.includes("indiehackers.com")) return "indiehackers";
        if (hostname.includes("producthunt.com")) return "producthunt";
        if (hostname.includes("crunchbase.com")) return "crunchbase";
        if (hostname.includes("behance.net")) return "behance";
        if (hostname.includes("dribbble.com")) return "dribbble";
        if (hostname.includes("threads.net")) return "threads";
        if (hostname.includes("tiktok.com")) return "tiktok";
        if (hostname.includes("pinterest.com")) return "pinterest";
        if (hostname.includes("quora.com")) return "quora";
        if (hostname === "dev.to" || hostname.endsWith(".dev.to")) return "devto";
        if (hostname.includes("hashnode.com")) return "hashnode";
        if (hostname.includes("gitlab.com")) return "gitlab";
        return "website";
    } catch {
        return "unknown";
    }
}

function isLikelyProfileUrl(value = "") {
    const url = normalizeUrl(value);
    if (!url) return false;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
        const path = parsed.pathname.toLowerCase();
        const platform = detectPlatform(url);

        // Reject platform utility / asset / policy URLs.
        const blockedHost =
            host.includes("static.cdninstagram.com") ||
            host.includes("graph.instagram.com") ||
            host === "help.instagram.com" ||
            host === "accountscenter.instagram.com";

        const blockedPath =
            /(?:^|\/)(?:help|legal|privacy|policies|cookies|terms|support|security|developer|webhooks|oauth|accounts)(?:\/|$)/i.test(path) ||
            /(?:^|\/)(?:login|signin|signup|error|redirect|favicon)(?:\/|$)/i.test(path) ||
            path.includes("share");

        if (blockedHost || blockedPath) return false;
        if (!SUPPORTED_PLATFORMS.has(platform)) return false;
        if (!path.split("/").filter(Boolean).length) return false;

        return true;
    } catch {
        return false;
    }
}

function getSourceSocialLinks(source = {}) {
    return uniqueStrings(
        [
            ...(Array.isArray(source.socialLinks) ? source.socialLinks : []),
            ...(Array.isArray(source.socialProfiles) ? source.socialProfiles : [])
        ],
        MAX_SOCIAL_LINKS_PER_SOURCE
    );
}

function uniqueStrings(values = [], limit = 50) {
    const seen = new Set();
    const output = [];

    for (const value of values) {
        const normalized = normalizeUrl(value);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        output.push(normalized);
        if (output.length >= limit) break;
    }

    return output;
}

function cleanText(value = "", max = MAX_TEXT_PER_SOURCE) {
    if (typeof value !== "string") return "";

    return value
        .replace(/\s+/g, " ")
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, max);
}

function extractTopics(source = {}) {
    const raw = [
        source.title,
        source.description,
        source.visibleText
    ].filter(Boolean).join(" ");

    if (!raw) return [];

    const dictionary = [
        "ai",
        "artificial intelligence",
        "systems",
        "system thinking",
        "decision making",
        "psychology",
        "behavior",
        "procrastination",
        "overthinking",
        "execution",
        "business",
        "marketing",
        "conversion",
        "education",
        "learning",
        "startup",
        "founder",
        "creator",
        "technology",
        "digital growth",
        "clients",
        "content"
    ];

    const text = raw.toLowerCase();
    return dictionary.filter(term => text.includes(term)).slice(0, MAX_TOPICS_PER_SOURCE);
}

function compactSource(source = {}, fallbackUrl = "") {
    const sourceUrl = normalizeUrl(
        source.sourceUrl ||
        source.canonicalUrl ||
        fallbackUrl
    );

    const rawSocial = getSourceSocialLinks(source);

    const socialProfiles = uniqueStrings(
        rawSocial.filter(isLikelyProfileUrl),
        MAX_SOCIAL_LINKS_PER_SOURCE
    );

    const allLinks = uniqueStrings(
        [
            ...(Array.isArray(source.links) ? source.links : []),
            ...rawSocial
        ],
        30
    );

    const evidence = [];

    const addEvidence = (type, value) => {
        const cleaned = cleanText(value, 420);
        if (!cleaned) return;
        evidence.push({
            type,
            sourceUrl: sourceUrl || null,
            value: cleaned
        });
    };

    addEvidence("title", source.title);
    addEvidence("description", source.description);
    addEvidence("content", source.visibleText);

    for (const link of socialProfiles.slice(0, 1)) {
        addEvidence("profile-link", link);
    }

    return {
    sourceUrl: sourceUrl || null,

    sourcePlatform:
        source.sourcePlatform ||
        source.platform ||
        detectPlatform(sourceUrl),

    sourceHost:
        source.sourceHost ||
        (() => {
            try {
                return sourceUrl
                    ? new URL(sourceUrl).hostname
                    : null;
            } catch {
                return null;
            }
        })(),

    status: source.status || null,

    title:
        cleanText(source.title, 180) || null,

    description:
        cleanText(source.description, 260) || null,

    visibleText:
        cleanText(
            source.visibleText,
            3000
        ) || null,

    contentSnippet:
        cleanText(
            source.visibleText,
            MAX_TEXT_PER_SOURCE
        ) || null,

    contentLength:
        Number(source.contentLength) ||
        (
            typeof source.visibleText === "string"
                ? source.visibleText.length
                : 0
        ),

    topics: extractTopics(source),

    // Keep both names during the migration so downstream consumers receive
    // the same verified social URLs regardless of which field they read.
    socialLinks: rawSocial,
    socialProfiles,

    links: allLinks.slice(0, 12),

    headings:
        Array.isArray(source.headings)
            ? source.headings.slice(0, 50)
            : [],

    articles:
        Array.isArray(source.articles)
            ? source.articles.slice(0, 50)
            : [],

    posts:
        Array.isArray(source.posts)
            ? source.posts.slice(0, 50)
            : [],

    publicEvidence:
        Array.isArray(source.publicEvidence)
            ? source.publicEvidence.slice(0, 50)
            : [],

    evidence:
        evidence.slice(
            0,
            MAX_EVIDENCE_PER_SOURCE
        )
};
}

function buildCrossFindings(sources = [], sourceLinks = []) {
    const findings = [];
    const platforms = new Set();
    const profileLinks = [];
    const topicCounts = new Map();

    for (const source of sources) {
        const platform = source.sourcePlatform;
        if (platform && platform !== "unknown") platforms.add(platform);

        for (const profile of (source.socialLinks || source.socialProfiles || [])) {
    profileLinks.push(profile);
       }

        for (const topic of source.topics || []) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        }
    }

    if (sources.length > 1) {
        findings.push({
            type: "multi-source",
            sourceCount: sources.length,
            message: `${sources.length} public evidence sources were collected.`
        });
    }

    if (platforms.size > 1) {
        findings.push({
            type: "multi-platform",
            platformCount: platforms.size,
            platforms: [...platforms]
        });
    }

    const repeatedTopics = [...topicCounts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([topic, count]) => ({ topic, count }));

    if (repeatedTopics.length) {
        findings.push({
            type: "repeated-topics",
            topics: repeatedTopics
        });
    }

    const validProfileLinks = uniqueStrings(
        profileLinks,
        MAX_PROFILE_LINKS_TOTAL
    );

    if (validProfileLinks.length) {
        findings.push({
            type: "discovered-profiles",
            count: validProfileLinks.length,
            profileLinks: validProfileLinks
        });
    }

    if (sourceLinks.length) {
        findings.push({
            type: "source-traceability",
            sourceLinks: sourceLinks.slice(0, MAX_PROFILE_LINKS_TOTAL)
        });
    }

    return {
        findings,
        platforms: [...platforms],
        repeatedTopics,
        discoveredProfiles: validProfileLinks
    };
}

function calculateConfidence({
    sources = [],
    sourceLinks = [],
    discoveredProfiles = [],
    findings = []
}) {
    let score = 0;

    score += Math.min(sources.length * 20, 40);
    score += Math.min(sourceLinks.length * 5, 20);
    score += Math.min(discoveredProfiles.length * 5, 20);
    score += Math.min(findings.length * 4, 20);

    return Math.max(0, Math.min(score, 100));
}

function trimPackageToBudget(pkg, maxChars = MAX_TOTAL_PACKAGE_CHARS) {
    let current = JSON.stringify(pkg);
    if (current.length <= maxChars) return pkg;

    const trimmed = {
        ...pkg,
        sources: (pkg.sources || []).map(source => ({
            sourceUrl: source.sourceUrl,
            sourcePlatform: source.sourcePlatform,
            sourceHost: source.sourceHost,
            title: source.title,
            description: source.description,
            contentSnippet: cleanText(source.contentSnippet, 300),
            contentLength: source.contentLength,
            topics: (source.topics || []).slice(0, 5),
            socialLinks: (source.socialLinks || source.socialProfiles || []).slice(0, 6),
            socialProfiles: (source.socialLinks || source.socialProfiles || []).slice(0, 6),
            evidence: (source.evidence || []).slice(0, 2)
        })),
        findings: (pkg.findings || []).slice(0, 6),
        evidenceLedger: (pkg.evidenceLedger || []).slice(0, 30)
    };

    current = JSON.stringify(trimmed);
    if (current.length <= maxChars) return trimmed;

    // Last-resort deterministic reduction: keep source traceability,
    // profile links, platforms, findings and a very small snippet.
    return {
        success: true,
        packageType: "UniversalPublicEvidencePackage",
        sourceLinks: (pkg.sourceLinks || []).slice(0, MAX_PROFILE_LINKS_TOTAL),
        discoveredProfiles: (pkg.discoveredProfiles || []).slice(0, MAX_PROFILE_LINKS_TOTAL),
        platforms: (pkg.platforms || []).slice(0, 12),
        confidence: pkg.confidence || 0,
        findings: (pkg.findings || []).slice(0, 5),
        sources: (pkg.sources || []).map(source => ({
            sourceUrl: source.sourceUrl,
            sourcePlatform: source.sourcePlatform,
            title: source.title,
socialLinks: (source.socialLinks || source.socialProfiles || []).slice(0, 4),
            socialProfiles: (source.socialLinks || source.socialProfiles || []).slice(0, 4),
            contentSnippet: cleanText(source.contentSnippet, 220),
            topics: (source.topics || []).slice(0, 4)
        })).slice(0, 12)
    };
}

async function collectSource(url) {
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
        return {
            success: false,
            reason: "Invalid public source URL.",
            source: null
        };
    }

    try {
        const rawPackage =
    await loadPublicContentFetcher({
        profileLinks: [normalizedUrl]
    });

const extractedPackage =
    extractPublicContent(rawPackage);

const packageResult =
    buildPublicContentPackage(
        rawPackage,
        extractedPackage
    );
        const fetchedSources = Array.isArray(packageResult?.sources)
            ? packageResult.sources
            : [];
console.log(
    "COLLECT_SOURCE_DEBUG",
    {
        requestedUrl: normalizedUrl,
        fetchedSourcesCount: fetchedSources.length,
        fetchedUrls: fetchedSources.map(
            s => s?.sourceUrl
        )
    }
);
        // PCF can crawl additional sources. CEB must retain the source
        // corresponding to the exact URL it asked PCF to fetch.
        const source =
            fetchedSources.find(item =>
                normalizeUrl(item?.sourceUrl || "") === normalizedUrl
            ) ||
            fetchedSources[0] ||
            packageResult?.source ||
            null;
console.log(
    "SOURCE_MATCH_DEBUG",
    {
        requestedUrl: normalizedUrl,
        selectedUrl:
            source?.sourceUrl,
        matched:
            normalizeUrl(
                source?.sourceUrl || ""
            ) === normalizedUrl
    }
);
        if (!source) {
            return {
                success: false,
                reason: "Public Content Fetcher returned no source.",
                source: null
            };
        }
console.log(
    "SOURCE_CONTENT_DEBUG",
    {
        url: normalizedUrl,
        contentLength:
            source?.sourceContent?.length ||
            source?.content?.length ||
            0,

        textLength:
            source?.visibleText?.length ||
            0,

        articles:
            source?.articles?.length ||
            0,

        socialLinks:
            source?.socialLinks?.length ||
            0
    }
);
        return {
            success: true,
            source: compactSource(source, normalizedUrl)
        };
    } catch (error) {
        return {
            success: false,
            reason: error?.message || "Source fetch failed.",
            source: null
        };
    }
}

export async function loadCrossEvidenceBrain({
    profileLinks = [],
    footprintPackage = {},
    truthLoopPackage = {}
} = {}) {
    const requestedLinks = Array.isArray(profileLinks)
        ? profileLinks
        : [];

    const sourceLinks = uniqueStrings(requestedLinks, MAX_SOURCES);

    const result = {
        success: false,
        packageType: "CrossEvidencePackage",
        sourcesProcessed: 0,
        sourcesSucceeded: 0,
        sourcesFailed: 0,
        confidenceScore: 0,
        errors: [],
        universalPackage: null,
        crossEvidencePackage: null
    };

    if (!sourceLinks.length) {
        result.errors.push("At least one public source URL is required.");
        return result;
    }

    // Deliberately ignore truthLoopPackage here. Loop 1–6 conversation
    // must never enter the public-evidence package.
    void truthLoopPackage;

    console.log("CROSS_EVIDENCE_PROFILE_LINKS", sourceLinks);

    const sources = [];

    for (const url of sourceLinks) {
        result.sourcesProcessed++;

        const collected = await collectSource(url);

        if (collected.success && collected.source) {
            result.sourcesSucceeded++;
            sources.push(collected.source);
        } else {
            result.sourcesFailed++;
            result.errors.push({
                url,
                reason: collected.reason
            });
        }
    }

    const discoveredProfiles = uniqueStrings(
    sources.flatMap(
        source => source.socialLinks || source.socialProfiles || []
    ),
    MAX_PROFILE_LINKS_TOTAL
);
/* ==========================================
   PASS 2
   FETCH DISCOVERED PROFILES
========================================== */

const profileSources = [];

for (const profileUrl of discoveredProfiles) {

  const collected = await collectSource(profileUrl);

  if (collected?.success && collected?.source) {

    profileSources.push({
      ...collected.source,
      discoveredProfile: true
    });
  }
}

/* Merge profile evidence */
sources.push(...profileSources);
   
    const allTraceableLinks = uniqueStrings(
        [
            ...sourceLinks,
            ...discoveredProfiles
        ],
        MAX_PROFILE_LINKS_TOTAL
    );

    const cross = buildCrossFindings(
        sources,
        allTraceableLinks
    );

    const evidenceLedger = sources.flatMap(source =>
        (source.evidence || []).map((item, index) => ({
            id: `${source.sourceUrl || "source"}#e${index + 1}`,
            sourceUrl: item.sourceUrl || source.sourceUrl,
            sourcePlatform: source.sourcePlatform,
            sourceType: item.type,
            evidence: item.value
        }))
    ).slice(0, 60);

    const confidence = calculateConfidence({
        sources,
        sourceLinks: allTraceableLinks,
        discoveredProfiles,
        findings: cross.findings
    });

    const universalPackage = trimPackageToBudget({
        success: true,
        packageType: "UniversalPublicEvidencePackage",
        version: "20.0",
        sourceLinks: allTraceableLinks,
        discoveredProfiles,
        platforms: cross.platforms,
        confidence,
        sources,
        findings: cross.findings,
        repeatedTopics: cross.repeatedTopics,
        evidenceLedger
    });
   console.log(
    "CONTENT_COMPRESSION_CHECK",
    {
        exists: !!sources?.[0]?.contentCompressionPackage,
        sourceCount:
            sources?.[0]
                ?.contentCompressionPackage
                ?.sourceCount || 0
    }
);
console.log("GEMINI_TRIGGER");

const geminiIntelligence =
    await buildGeminiIntelligence(
        universalPackage
    );

universalPackage.intelligence =
    geminiIntelligence;

console.log(
    "GEMINI_AFTER",
    Object.keys(
        geminiIntelligence || {}
    )
);
    const packageTextSize = JSON.stringify(universalPackage).length;
console.log(
    "UNIVERSAL_PACKAGE_DEBUG",
    JSON.stringify(universalPackage, null, 2)
);
    result.confidenceScore = confidence;
    result.universalPackage = universalPackage;
    result.crossEvidencePackage = {
        success: true,
        packageType: "CrossEvidencePackage",
        version: "20.0",
        sourceLinks: universalPackage.sourceLinks || [],
        discoveredProfiles: universalPackage.discoveredProfiles || [],
        platforms: universalPackage.platforms || [],
        findings: universalPackage.findings || [],
        confidence: confidence,
        evidenceLedger: universalPackage.evidenceLedger || [],
        universalPackage
    };
    result.success = result.sourcesSucceeded > 0;

    console.log("CROSS_EVIDENCE_FINAL", {
        success: result.success,
        sourcesProcessed: result.sourcesProcessed,
        sourcesSucceeded: result.sourcesSucceeded,
        sourcesFailed: result.sourcesFailed,
        sourceLinks: universalPackage.sourceLinks?.length || 0,
        discoveredProfiles: universalPackage.discoveredProfiles?.length || 0,
        platforms: universalPackage.platforms?.length || 0,
        confidence,
        universalPackageSize: packageTextSize
    });

    return result;
}

// Optional named export retained for simple unit checks.
export function getCrossEvidencePlatform(url) {
    return detectPlatform(normalizeUrl(url));
}
