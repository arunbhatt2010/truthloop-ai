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

// Targeted Gemini investigation budget.
// Keep the public contract and existing function names unchanged.
const MAX_GEMINI_SOURCES = 10;
const MAX_GEMINI_CONTENT_LINKS = 5;
const MAX_GEMINI_SOCIAL_LINKS = 4;
const MAX_GEMINI_SOURCE_CHARS = 3500;
const MAX_GEMINI_EVIDENCE_SNIPPETS = 8;
const SOURCE_CACHE = new Map();
async function buildGeminiIntelligence(evidencePackage = {}) {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            status: "disabled",
            reason: "Missing GEMINI_API_KEY"
        };
    }
console.log(
  "GEMINI_INPUT_SIZE",
  JSON.stringify(evidencePackage).length
);
    const prompt = `
You are TruthLoop's Targeted Public Evidence Investigator.

Your job is NOT to summarize a large web crawl.
Your job is to investigate ONLY the explicitly selected public sources below and turn their evidence into ONE compact Universal Public Evidence Package.

INVESTIGATION SCOPE:
- Exactly the selected sources below are the evidence universe.
- Do not treat any other URL mentioned inside the content as investigated evidence.
- Do not invent or fetch additional sources.
- Preserve source traceability for every meaningful finding.

SOURCE ROLES:
- mainProfile: 1 primary public profile / website source.
- content: up to 5 highest-priority public content sources.
- social: up to 4 public social/profile sources.

INVESTIGATION OBJECTIVES:
1. Establish identity only from repeated, explicit evidence.
2. Identify the entity's positioning and recurring subject areas.
3. Identify expertise signals supported by repeated content.
4. Identify audience signals supported by content.
5. Identify business / creator / operator signals when explicitly supported.
6. Identify repeated themes across the selected sources.
7. Identify meaningful contradictions or gaps only when the selected sources support them.
8. Identify evidence-backed behavioral/public activity signals without psychological diagnosis.
9. Preserve the strongest evidence snippets so Loop 7 can verify each conclusion.
10. Produce a compact package rather than a profile summary.

EVIDENCE RULES:
- Never invent names, usernames, platforms, URLs, expertise, audiences, businesses, behavior, or activity.
- Never turn a URL alone into proof of activity.
- Never treat a login page, CDN asset, favicon, policy page, redirect page, or navigation utility URL as substantive evidence.
- Never diagnose psychology.
- Never provide advice.
- A conclusion must have supporting evidence from one or more selected sources.
- Prefer repeated signals across multiple selected sources.
- Preserve the original source URL with each important evidence item.
- Evidence snippets should be concise and close to the source wording.
- If evidence is insufficient, use an empty array / null instead of guessing.

OUTPUT:
Return ONLY valid JSON with this shape:
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
  "recurringTopics": [],
  "behavioralSignals": [],
  "contradictions": [],
  "findings": [],
  "importantEvidence": [
    {
      "claim": null,
      "snippet": null,
      "sourceUrl": null,
      "sourceRole": null
    }
  ],
  "contentSamples": [
    {
      "title": null,
      "content": null,
      "sourceUrl": null,
      "sourceRole": null
    }
  ],
  "sourceContent": [
    {
      "sourceUrl": null,
      "sourceRole": null,
      "content": null
    }
  ],
  "investigation": {
    "sourceCount": 0,
    "mainProfile": null,
    "contentSources": [],
    "socialSources": [],
    "crossSourceSignals": []
  }
}

IMPORTANT OUTPUT RULES:
- sourceUrls must contain only URLs from the selected evidence universe.
- discoveredProfiles must contain only profile URLs actually present in the selected evidence universe.
- Keep the package compact enough for downstream Loop 7 processing.
- Do not omit strong evidence merely to make the output look short.

SELECTED PUBLIC EVIDENCE:
${JSON.stringify(evidencePackage)}
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

        console.log("GEMINI_REQUEST_START");

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
                        maxOutputTokens: 12000
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

        if (!content.trim()) {
            return {
                status: "failed",
                error: "Empty Gemini response"
            };
        }

        let parsedContent;

        try {
            parsedContent = JSON.parse(
                content
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim()
            );
        } catch (e) {
            console.log(
                "GEMINI_PARSE_FAILED_CONTENT",
                content.slice(0, 1200)
            );
            throw e;
        }

        console.log(
            "GEMINI_OUTPUT_KEYS",
            Object.keys(parsedContent || {})
        );
console.log(
  "GEMINI_LINKEDIN_PROFILES",
  JSON.stringify(
    parsedContent.discoveredProfiles || [],
    null,
    2
  )
);

console.log(
  "GEMINI_LINKEDIN_CONTENT",
  JSON.stringify(
    parsedContent.sourceContent?.linkedin || {},
    null,
    2
  )
);

console.log(
  "GEMINI_LINKEDIN_EVIDENCE",
  JSON.stringify(
    parsedContent.evidence?.linkedin || {},
    null,
    2
  )
);
        return parsedContent;

    } catch(error) {

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

function samePublicUrl(a = "", b = "") {
    const left = normalizeUrl(a)
        .replace(/^https?:\/\/www\./i, match => match.startsWith("https:") ? "https://" : "http://")
        .replace(/\/$/, "");
    const right = normalizeUrl(b)
        .replace(/^https?:\/\/www\./i, match => match.startsWith("https:") ? "https://" : "http://")
        .replace(/\/$/, "");
    return !!left && !!right && left === right;
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

    contentCandidates:
        Array.isArray(source.contentCandidates)
            ? source.contentCandidates
                .filter(item => item && item.url)
                .slice(0, 20)
                .map(item => ({
                    title: cleanText(item.title, 180) || null,
                    description: cleanText(item.description, 420) || null,
                    url: normalizeUrl(item.url) || null,
                    sourceType: item.sourceType || "content-link"
                }))
                .filter(item => item.url)
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

function isLikelyContentUrl(value = "") {
    const url = normalizeUrl(value);
    if (!url) return false;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
        const path = parsed.pathname.toLowerCase();

        if (SUPPORTED_PLATFORMS.has(detectPlatform(url))) return false;

        if (/(?:^|\/)(?:privacy|terms|cookie|disclaimer|contact|about|author|login|signin|signup|redirect|sitemap)(?:[\/.-]|$)/i.test(path)) {
            return false;
        }

        if (host.includes("static.") || host.includes("cdn.")) return false;

        return /(?:^|\/)(?:article|articles|blog|blogs|post|posts|news|insight|insights|guide|guides|resource|resources|learn|tutorial|tutorials|case-study|case-studies|story|stories|writing|essay|essays|journal|research|academy|library|knowledge|perspective|perspectives|newsletter)(?:\/|\.|$)/i.test(path)
            || /\/20\d{2}(?:\/|$)/.test(path)
            || path.split("/").filter(Boolean).length >= 2;
    } catch {
        return false;
    }
}

function scoreContentCandidate(candidate = {}) {
    const url = normalizeUrl(candidate.url || "");
    const title = String(candidate.title || "").trim();
    const description = String(candidate.description || "").trim();

    if (!url || !isLikelyContentUrl(url)) return -1;

    let score = 0;

    if (candidate.sourceType === "content-link") score += 40;
    if (candidate.sourceType === "article") score += 35;
    if (candidate.sourceType === "post") score += 35;
    if (candidate.sourceType === "content-heading") score += 10;
    if (title.length >= 20) score += 12;
    if (description.length >= 60) score += 8;
    if (isLikelyContentUrl(url)) score += 15;

    return score;
}


/**
 * PublicEvidenceHunter
 * --------------------
 * Expands an identity seed into additional public-web evidence candidates.
 *
 * Design contract:
 * - Does not remove/rename any existing CEB function.
 * - Uses the LinkedIn/profile URL only as an identity seed.
 * - Searches Google (Custom Search API when configured, public search fallback otherwise),
 *   Bing public search, and DuckDuckGo as an additional fallback.
 * - Produces URL candidates + compact search evidence only; existing PCF/collectSource()
 *   remains the canonical page-content fetcher.
 * - Returns social candidates separately so the existing Gemini source budget is preserved.
 */
async function PublicEvidenceHunter({
    mainSource = {},
    requestedLinks = []
} = {}) {
    const MAX_QUERIES = 8;
    const MAX_RESULTS_PER_QUERY = 8;
    const MAX_DISCOVERED_URLS = 30;
    const MAX_SOCIAL_RESULTS = 8;
    const MAX_EVIDENCE = 12;

    const normalizeSearchUrl = (value = "") => {
        const normalized = normalizeUrl(value);
        if (!normalized) return "";
        try {
            const parsed = new URL(normalized);
            parsed.hash = "";
            parsed.searchParams.delete("utm_source");
            parsed.searchParams.delete("utm_medium");
            parsed.searchParams.delete("utm_campaign");
            return parsed.toString();
        } catch {
            return normalized;
        }
    };

    const decodeHtml = (value = "") => String(value || "")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#x2F;/gi, "/")
        .replace(/&#47;/gi, "/");

    const stripTags = (value = "") => String(value || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const extractLinkedInUsername = (links = []) => {
        for (const raw of links) {
            const url = normalizeUrl(raw);
            if (!url) continue;
            try {
                const parsed = new URL(url);
                if (!parsed.hostname.includes("linkedin.com")) continue;
                const match = parsed.pathname.match(/\/in\/([^/?#]+)/i);
                if (match?.[1]) return decodeURIComponent(match[1]).replace(/[-_]+/g, " ").trim();
            } catch {}
        }
        return "";
    };

    const extractIdentity = () => {
        const links = [
            mainSource?.sourceUrl,
            ...(Array.isArray(requestedLinks) ? requestedLinks : []),
            ...(Array.isArray(mainSource?.socialProfiles) ? mainSource.socialProfiles : []),
            ...(Array.isArray(mainSource?.socialLinks) ? mainSource.socialLinks : [])
        ].filter(Boolean);

        const title = cleanText(mainSource?.title || "", 220);
        const description = cleanText(mainSource?.description || "", 500);
        const visibleText = cleanText(mainSource?.visibleText || "", 1800);
        const combined = [title, description, visibleText].filter(Boolean).join(" ");

        const linkedinUsername = extractLinkedInUsername(links);
        const names = [];
        const companies = [];

        if (linkedinUsername) names.push(linkedinUsername);

        const namePatterns = [
            /\b(?:founder|co-founder|creator|owner|ceo|chief executive officer)\s*[:\-–]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/,
            /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*(?:[|–—-]|$)/
        ];
        for (const pattern of namePatterns) {
            const match = combined.match(pattern);
            if (match?.[1]) {
                names.push(match[1].trim());
                break;
            }
        }

        const companyPatterns = [
            /\b(?:founder|co-founder|ceo|owner)\s+(?:of|at|@)\s+([A-Z][A-Za-z0-9&._-]{1,30}(?:\s+[A-Z][A-Za-z0-9&._-]{1,30}){0,3})/i,
            /\b(?:company|brand|product|startup)\s*[:\-]\s*([A-Z][A-Za-z0-9&._-]{1,30}(?:\s+[A-Z][A-Za-z0-9&._-]{1,30}){0,3})/
        ];
        for (const pattern of companyPatterns) {
            const match = combined.match(pattern);
            if (match?.[1]) {
                companies.push(match[1].trim());
                break;
            }
        }

        const website = normalizeUrl(mainSource?.sourceUrl || "");
        let host = "";
        try {
            host = website ? new URL(website).hostname.replace(/^www\./, "") : "";
        } catch {}

        return {
            linkedinUsername,
            names: [...new Set(names.filter(Boolean))].slice(0, 4),
            companies: [...new Set(companies.filter(Boolean))].slice(0, 4),
            website,
            host,
            rawIdentityText: cleanText([title, description].filter(Boolean).join(" | "), 600)
        };
    };

    const identity = extractIdentity();

    const q = (text, purpose) => ({ query: String(text).trim(), purpose });
    const searchQueries = [];
    const primaryName = identity.names[0] || identity.linkedinUsername || "";
    const company = identity.companies[0] || "";
    const host = identity.host;

    if (primaryName && company) searchQueries.push(q(`"${primaryName}" "${company}"`, "identity-company"));
    if (primaryName) searchQueries.push(q(`"${primaryName}"`, "identity"));
    if (primaryName && company) searchQueries.push(q(`"${primaryName}" "${company}" posts`, "public-activity"));
    if (primaryName) searchQueries.push(q(`"${primaryName}" interview OR podcast OR article`, "public-mentions"));
    if (company) searchQueries.push(q(`"${company}" founder`, "company"));
    if (company) searchQueries.push(q(`"${company}" blog OR article OR interview`, "company-content"));
    if (host) searchQueries.push(q(`site:${host} ${primaryName || company}`, "website"));
    if (primaryName) searchQueries.push(q(`"${primaryName}" GitHub OR YouTube OR Medium OR Substack OR Reddit`, "platform-expansion"));

    const dedupedQueries = [];
    const seenQueries = new Set();
    for (const item of searchQueries) {
        const key = item.query.toLowerCase();
        if (!item.query || seenQueries.has(key)) continue;
        seenQueries.add(key);
        dedupedQueries.push(item);
        if (dedupedQueries.length >= MAX_QUERIES) break;
    }

    const headers = {
        "User-Agent": "Mozilla/5.0 (compatible; TruthLoop-PublicEvidenceHunter/1.0; +https://truthloop.in/)",
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"
    };

    const results = [];

    const addResult = (item = {}) => {
        const url = normalizeSearchUrl(item.url || "");
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) return;
        let hostName = "";
        try { hostName = new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch {}
        if (!hostName || hostName === "google.com" || hostName.endsWith(".google.com") || hostName === "bing.com" || hostName.endsWith(".bing.com")) return;
        if (/^(?:accounts|support|help|policies|privacy|terms)\./i.test(hostName)) return;
        results.push({
            url,
            title: cleanText(item.title || "", 180),
            snippet: cleanText(item.snippet || item.description || "", 500),
            query: item.query || "",
            purpose: item.purpose || "public-mention",
            provider: item.provider || ""
        });
    };

    const googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_CSE_API_KEY;
    const googleSearchCx = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID;

    const searchGoogleApi = async (query, purpose) => {
        if (!googleSearchApiKey || !googleSearchCx) return false;
        try {
            const endpoint = new URL("https://www.googleapis.com/customsearch/v1");
            endpoint.searchParams.set("key", googleSearchApiKey);
            endpoint.searchParams.set("cx", googleSearchCx);
            endpoint.searchParams.set("q", query);
            endpoint.searchParams.set("num", String(Math.min(MAX_RESULTS_PER_QUERY, 10)));

            const response = await fetch(endpoint, { headers: { "User-Agent": headers["User-Agent"] } });
            if (!response.ok) return false;
            const data = await response.json();
            for (const item of Array.isArray(data?.items) ? data.items : []) {
                addResult({
                    url: item?.link,
                    title: item?.title,
                    snippet: item?.snippet,
                    query,
                    purpose,
                    provider: "google-cse"
                });
            }
            return true;
        } catch (error) {
            console.log("PUBLIC_EVIDENCE_HUNTER_GOOGLE_API_ERROR", error?.message || error);
            return false;
        }
    };

    const searchHtmlEngine = async (provider, query, purpose) => {
        try {
            const endpoint = provider === "bing"
                ? `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${MAX_RESULTS_PER_QUERY}`
                : provider === "google"
                    ? `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${MAX_RESULTS_PER_QUERY}`
                    : `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

            const response = await fetch(endpoint, { headers });
            if (!response.ok) return false;
            const html = await response.text();
            if (!html || html.length < 200) return false;

            if (provider === "bing") {
                const regex = /<li class="b_algo"[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    addResult({
                        url: decodeHtml(match[1]),
                        title: stripTags(match[2]),
                        snippet: stripTags(match[3]),
                        query,
                        purpose,
                        provider: "bing-html"
                    });
                }
            } else if (provider === "google") {
                const regex = /<a href="\/url\?q=([^&"]+)[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    addResult({
                        url: decodeURIComponent(match[1]),
                        title: stripTags(match[2]),
                        snippet: "",
                        query,
                        purpose,
                        provider: "google-html"
                    });
                }
                const directRegex = /<a href="(https?:\/\/[^" ]+)"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
                while ((match = directRegex.exec(html)) !== null) {
                    addResult({
                        url: decodeHtml(match[1]),
                        title: stripTags(match[2]),
                        snippet: "",
                        query,
                        purpose,
                        provider: "google-html"
                    });
                }
            } else {
                const regex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    addResult({
                        url: decodeHtml(match[1]),
                        title: stripTags(match[2]),
                        snippet: stripTags(match[3]),
                        query,
                        purpose,
                        provider: "duckduckgo-html"
                    });
                }
            }
            return true;
        } catch (error) {
            console.log("PUBLIC_EVIDENCE_HUNTER_SEARCH_ERROR", provider, error?.message || error);
            return false;
        }
    };

    for (const item of dedupedQueries) {
        let googleWorked = await searchGoogleApi(item.query, item.purpose);
        if (!googleWorked) {
            await searchHtmlEngine("google", item.query, item.purpose);
        }
        await searchHtmlEngine("bing", item.query, item.purpose);
        if (results.length < 6) {
            await searchHtmlEngine("duckduckgo", item.query, item.purpose);
        }
        if (results.length >= MAX_DISCOVERED_URLS * 2) break;
    }

    const bannedHosts = new Set([
        "linkedin.com",
        "facebook.com",
        "instagram.com",
        "x.com",
        "twitter.com",
        "tiktok.com",
        "pinterest.com"
    ]);

    const scoreResult = (item) => {
        let score = 0;
        let hostName = "";
        let path = "";
        try {
            const parsed = new URL(item.url);
            hostName = parsed.hostname.replace(/^www\./, "").toLowerCase();
            path = parsed.pathname.toLowerCase();
        } catch {}

        if (item.purpose === "public-mentions") score += 35;
        if (item.purpose === "company-content") score += 30;
        if (item.purpose === "website") score += 28;
        if (item.purpose === "platform-expansion") score += 24;
        if (item.purpose === "identity-company") score += 18;
        if (hostName && hostName === identity.host) score += 35;
        if (path.match(/\/(blog|article|post|news|insight|story|writing|research|podcast|interview)/i)) score += 20;
        if (item.snippet.length > 80) score += 8;
        if (item.title.length > 20) score += 5;
        if (bannedHosts.has(hostName)) score -= 8;
        if (/\/(privacy|terms|cookie|login|signin|signup|support|help|contact)(\/|$)/i.test(path)) score -= 50;
        return score;
    };

    const unique = new Map();
    for (const item of results) {
        const url = normalizeSearchUrl(item.url);
        if (!url) continue;
        const existing = unique.get(url);
        if (!existing || scoreResult(item) > scoreResult(existing)) {
            unique.set(url, item);
        }
    }

    const ranked = [...unique.values()]
        .filter(item => item.url !== normalizeUrl(mainSource?.sourceUrl || ""))
        .sort((a, b) => scoreResult(b) - scoreResult(a));

    const socialResults = ranked.filter(item => isLikelyProfileUrl(item.url)).slice(0, MAX_SOCIAL_RESULTS);
    const discoveredUrls = ranked
        .filter(item => !isLikelyProfileUrl(item.url))
        .slice(0, MAX_DISCOVERED_URLS)
        .map(item => item.url);

    const compressedEvidence = ranked
        .slice(0, MAX_EVIDENCE)
        .map((item, index) => ({
            id: `HUNTER-${String(index + 1).padStart(3, "0")}`,
            provider: item.provider,
            purpose: item.purpose,
            query: item.query,
            title: item.title || null,
            snippet: cleanText(item.snippet, 320) || null,
            sourceUrl: item.url
        }));

    console.log("PUBLIC_EVIDENCE_HUNTER", {
        identity,
        queryCount: dedupedQueries.length,
        resultCount: ranked.length,
        discoveredUrlCount: discoveredUrls.length,
        socialResultCount: socialResults.length,
        providers: [...new Set(ranked.map(item => item.provider).filter(Boolean))]
    });
console.log(
  "PEH_HUNT_REPORT",
  JSON.stringify(
    {
      identity,
      searchQueries: dedupedQueries,
      discoveredUrls,
      socialProfiles:
        socialResults.map(item => item.url)
    },
    null,
    2
  )
);
    return {
        success: ranked.length > 0,
        identity,
        searchQueries: dedupedQueries,
        discoveredUrls,
        socialProfiles: socialResults.map(item => item.url),
        searchResults: ranked.slice(0, MAX_DISCOVERED_URLS),
        compressedEvidence,
        reason: ranked.length ? null : "No public search results returned."
    };
}

function selectInvestigationSources(mainSource = {}, requestedLinks = []) {
    const mainUrl = normalizeUrl(
        mainSource?.sourceUrl || requestedLinks?.[0] || ""
    );

    const rawCandidates = [
        ...(Array.isArray(mainSource?.contentCandidates)
            ? mainSource.contentCandidates
            : []),
        ...(Array.isArray(mainSource?.articles)
            ? mainSource.articles.map(item => ({
                title: item?.title,
                description: item?.description || item?.content,
                url: item?.url,
                sourceType: "article"
            }))
            : []),
        ...(Array.isArray(mainSource?.posts)
            ? mainSource.posts.map(item => ({
                title: item?.title,
                description: item?.content,
                url: item?.url,
                sourceType: "post"
            }))
            : [])
    ];

    const seenContent = new Set();
    const contentSources = rawCandidates
        .map(candidate => ({
            ...candidate,
            url: normalizeUrl(candidate?.url || "")
        }))
        .filter(candidate => {
            if (!candidate.url || candidate.url === mainUrl) return false;
            const score = scoreContentCandidate(candidate);
            if (score < 0 || seenContent.has(candidate.url)) return false;
            seenContent.add(candidate.url);
            return true;
        })
        .sort((a, b) => {
            const scoreDiff = scoreContentCandidate(b) - scoreContentCandidate(a);
            if (scoreDiff !== 0) return scoreDiff;
            return String(a.title || "").localeCompare(String(b.title || ""));
        })
        .slice(0, MAX_GEMINI_CONTENT_LINKS);

    const socialPool = [
        ...(Array.isArray(mainSource?.socialProfiles)
            ? mainSource.socialProfiles
            : []),
        ...(Array.isArray(mainSource?.socialLinks)
            ? mainSource.socialLinks
            : []),
        ...(Array.isArray(requestedLinks) ? requestedLinks : [])
    ];

    const socialSources = uniqueStrings(
        socialPool.filter(isLikelyProfileUrl),
        MAX_GEMINI_SOCIAL_LINKS
    )
        .filter(url => url !== mainUrl)
        .slice(0, MAX_GEMINI_SOCIAL_LINKS);

    const selectedUrls = uniqueStrings(
        [
            mainUrl,
            ...contentSources.map(item => item.url),
            ...socialSources
        ],
        MAX_GEMINI_SOURCES
    );

    return {
        mainUrl,
        contentSources,
        socialSources,
        selectedUrls
    };
}

function buildGeminiEvidencePackage(sources = [], selection = {}) {
    const roleMap = new Map();

    if (selection.mainUrl) {
        roleMap.set(selection.mainUrl, "mainProfile");
    }

    for (const item of selection.contentSources || []) {
        const normalized = normalizeUrl(item?.url || "");
        if (normalized) roleMap.set(normalized, "content");
    }

    for (const url of selection.socialSources || []) {
        const normalized = normalizeUrl(url);
        if (normalized) roleMap.set(normalized, "social");
    }

    const selectedSources = [];

    for (const source of sources) {
        const sourceUrl = normalizeUrl(source?.sourceUrl || "");
        const sourceRole = roleMap.get(sourceUrl);
        if (!sourceUrl || !sourceRole) continue;

        selectedSources.push({
            sourceUrl,
            sourceRole,
            platform:
                source?.sourcePlatform ||
                source?.platform ||
                detectPlatform(sourceUrl),
            title: source?.title || null,
            description: source?.description || null,
            visibleText: cleanText(
                source?.visibleText || source?.contentSnippet || "",
                MAX_GEMINI_SOURCE_CHARS
            ) || null,
            headings: Array.isArray(source?.headings)
                ? source.headings.slice(0, 12)
                : [],
            contentCandidates: Array.isArray(source?.contentCandidates)
                ? source.contentCandidates.slice(0, 8)
                : [],
            socialProfiles: uniqueStrings(
                source?.socialProfiles || source?.socialLinks || [],
                8
            ),
            publicEvidence: Array.isArray(source?.publicEvidence)
                ? source.publicEvidence.slice(0, 12).map(item => ({
                    type: item?.type || null,
                    sourceUrl: item?.sourceUrl || sourceUrl,
                    value: cleanText(item?.value || "", 700)
                }))
                : [],
            evidence: Array.isArray(source?.evidence)
                ? source.evidence.slice(0, MAX_GEMINI_EVIDENCE_SNIPPETS)
                : []
        });
    }

    return {
        investigationMode: "targeted-gemini-investigation",
        sourceCount: selectedSources.length,
        selectedSourceUrls: selectedSources.map(item => item.sourceUrl),
        mainProfile: selection.mainUrl || null,
        contentSources: selectedSources
            .filter(item => item.sourceRole === "content")
            .map(item => item.sourceUrl),
        socialSources: selectedSources
            .filter(item => item.sourceRole === "social")
            .map(item => item.sourceUrl),
        sources: selectedSources
    };
}

function normalizeGeminiIntelligence(intelligence = {}, selection = {}) {
    if (!intelligence || typeof intelligence !== "object") {
        return {};
    }

    const recurringTopics = Array.isArray(intelligence.recurringTopics)
        ? intelligence.recurringTopics
        : Array.isArray(intelligence.topics)
            ? intelligence.topics
            : Array.isArray(intelligence.niches)
                ? intelligence.niches
                : [];

    const evidence = Array.isArray(intelligence.evidence)
        ? intelligence.evidence
        : Array.isArray(intelligence.importantEvidence)
            ? intelligence.importantEvidence
            : [];

    return {
        ...intelligence,
        recurringTopics,
        evidence,
        investigation: {
            ...(intelligence.investigation || {}),
            sourceCount: selection.selectedUrls?.length || 0,
            mainProfile: selection.mainUrl || null,
            contentSources:
                (selection.contentSources || [])
                    .map(item => normalizeUrl(item?.url || ""))
                    .filter(Boolean),
            socialSources:
                (selection.socialSources || [])
                    .map(normalizeUrl)
                    .filter(Boolean)
        }
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
        const cachedSource =
            [...SOURCE_CACHE.values()].find(item =>
                samePublicUrl(item?.sourceUrl || "", normalizedUrl)
            );

        if (cachedSource) {
            return {
                success: true,
                source: compactSource(cachedSource, normalizedUrl)
            };
        }

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

        for (const fetchedSource of fetchedSources) {
            const fetchedUrl = normalizeUrl(
                fetchedSource?.sourceUrl ||
                fetchedSource?.canonicalUrl ||
                ""
            );

            if (fetchedUrl) {
                SOURCE_CACHE.set(fetchedUrl, fetchedSource);
            }
        }

        const source =
            fetchedSources.find(item =>
                samePublicUrl(item?.sourceUrl || "", normalizedUrl)
            ) ||
            (samePublicUrl(packageResult?.sourceUrl || "", normalizedUrl)
                ? packageResult
                : null);

        if (!source) {
            return {
                success: false,
                reason: "Public Content Fetcher returned no exact source.",
                source: null
            };
        }

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

    const primaryRequestedUrl = normalizeUrl(
        requestedLinks?.[0] ||
        footprintPackage?.profileLink ||
        footprintPackage?.sourceUrl ||
        ""
    );

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

    if (!primaryRequestedUrl) {
        result.errors.push("At least one public source URL is required.");
        return result;
    }

    // Deliberately ignore truthLoopPackage here. Loop 1–6 conversation
    // must never enter the public-evidence package.
    void truthLoopPackage;
    void footprintPackage;

    console.log("CROSS_EVIDENCE_PROFILE_LINKS", [primaryRequestedUrl]);

    // PASS 1: fetch only the main profile so PCF can reveal its
    // top content candidates and verified social/profile links.
    const mainCollected = await collectSource(primaryRequestedUrl);

    if (!mainCollected?.success || !mainCollected?.source) {
        result.sourcesFailed = 1;
        result.errors.push({
            url: primaryRequestedUrl,
            reason: mainCollected?.reason || "Main public source fetch failed."
        });
        return result;
    }

    result.sourcesProcessed = 1;
    result.sourcesSucceeded = 1;

    const selection = selectInvestigationSources(
        mainCollected.source,
        [primaryRequestedUrl, ...requestedLinks]
    );

    // PUBLIC EVIDENCE HUNTER: expand the identity seed across the public web.
    // Existing source selection remains intact; hunter candidates only fill/expand
    // the already-existing investigation budget before Gemini is called.
    const publicEvidenceHunter = await PublicEvidenceHunter({
        mainSource: mainCollected.source,
        requestedLinks: [primaryRequestedUrl, ...requestedLinks]
    });

    const hunterContentCandidates = (publicEvidenceHunter?.discoveredUrls || []).map(url => ({
        title: null,
        description: null,
        url,
        sourceType: "public-mention"
    }));

    const mergedContentCandidates = [
        ...(selection.contentSources || []),
        ...hunterContentCandidates
    ];
    const seenMergedContent = new Set();
    selection.contentSources = mergedContentCandidates
        .map(item => ({
            ...item,
            url: normalizeUrl(item?.url || "")
        }))
        .filter(item => {
            if (!item.url || seenMergedContent.has(item.url)) return false;
            seenMergedContent.add(item.url);
            return true;
        })
        .slice(0, MAX_GEMINI_CONTENT_LINKS);

    selection.socialSources = uniqueStrings(
        [
            ...(selection.socialSources || []),
            ...(publicEvidenceHunter?.socialProfiles || [])
        ],
        MAX_GEMINI_SOCIAL_LINKS
    );

    // Guarantee the main source remains the first investigation source.
    const selectedUrls = [
        selection.mainUrl,
        ...(selection.contentSources || []).map(item => normalizeUrl(item?.url || "")),
        ...(selection.socialSources || []).map(normalizeUrl)
    ].filter(Boolean);

    const selectedUniqueUrls = uniqueStrings(
        selectedUrls,
        MAX_GEMINI_SOURCES
    );

    const sourceMap = new Map();
    sourceMap.set(
        normalizeUrl(mainCollected.source.sourceUrl || primaryRequestedUrl),
        mainCollected.source
    );

    // PASS 2: fetch ONLY the remaining selected targets.
    for (const url of selectedUniqueUrls.slice(1)) {
        const collected = await collectSource(url);

        result.sourcesProcessed++;

        if (collected?.success && collected?.source) {
            result.sourcesSucceeded++;
            sourceMap.set(
                normalizeUrl(collected.source.sourceUrl || url),
                collected.source
            );
        } else {
            result.sourcesFailed++;
            result.errors.push({
                url,
                reason: collected?.reason || "Selected public source fetch failed."
            });
        }
    }

    const sources = selectedUniqueUrls
        .map(url => sourceMap.get(normalizeUrl(url)))
        .filter(Boolean);

    const discoveredProfiles = uniqueStrings(
        sources.flatMap(source =>
            source?.socialProfiles || source?.socialLinks || []
        ).filter(isLikelyProfileUrl),
        MAX_GEMINI_SOCIAL_LINKS
    );

    const selectedTraceableLinks = uniqueStrings(
        selectedUniqueUrls,
        MAX_GEMINI_SOURCES
    );

    const cross = buildCrossFindings(
        sources,
        selectedTraceableLinks
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
        sourceLinks: selectedTraceableLinks,
        discoveredProfiles,
        findings: cross.findings
    });

    const universalPackage = trimPackageToBudget({
        success: true,
        packageType: "UniversalPublicEvidencePackage",
        version: "20.0",
        investigationMode: "targeted-10-source",
        sourceLinks: selectedTraceableLinks,
        discoveredProfiles,
        platforms: cross.platforms,
        confidence,
        sources,
        findings: cross.findings,
        repeatedTopics: cross.repeatedTopics,
        evidenceLedger,
        investigationSources: {
            mainProfile: selection.mainUrl,
            contentSources: selection.contentSources?.map(item => item.url) || [],
            socialSources: selection.socialSources || [],
            selectedCount: selectedUniqueUrls.length
        }
    });

    const geminiInput = buildGeminiEvidencePackage(
        sources,
        {
            ...selection,
            selectedUrls: selectedUniqueUrls
        }
    );

    // Pass the hunter's compact search evidence alongside the fetched source evidence.
    // This gives Gemini additional public-web context even when a selected page
    // returns little/no body text through PCF.
    geminiInput.publicEvidenceHunter = {
        identity: publicEvidenceHunter?.identity || {},
        searchQueries: publicEvidenceHunter?.searchQueries || [],
        compressedEvidence: publicEvidenceHunter?.compressedEvidence || [],
        discoveredUrls: publicEvidenceHunter?.discoveredUrls || [],
        socialProfiles: publicEvidenceHunter?.socialProfiles || []
    };

    console.log(
        "GEMINI_TARGETED_SOURCES",
        JSON.stringify({
            mainProfile: geminiInput.mainProfile,
            contentSources: geminiInput.contentSources,
            socialSources: geminiInput.socialSources,
            sourceCount: geminiInput.sourceCount
        }, null, 2)
    );

    console.log("GEMINI_TRIGGER");
console.log(
  "GEMINI_SOCIAL_SOURCES_RAW",
  JSON.stringify(
    geminiInput.socialSources || [],
    null,
    2
  )
);

console.log(
  "GEMINI_CONTENT_SOURCES_RAW",
  JSON.stringify(
    geminiInput.contentSources || [],
    null,
    2
  )
);

console.log(
  "GEMINI_SELECTED_URLS",
  JSON.stringify(
    geminiInput.selectedSourceUrls || [],
    null,
    2
  )
);
    const geminiIntelligence =
        await buildGeminiIntelligence(
            geminiInput
        );
console.log(
  "GEMINI_INPUT_DEBUG",
  JSON.stringify(geminiInput, null, 2)
);

console.log(
  "GEMINI_OUTPUT_DEBUG",
  JSON.stringify(geminiIntelligence, null, 2)
);
    const normalizedGeminiIntelligence =
        normalizeGeminiIntelligence(
            geminiIntelligence,
            {
                ...selection,
                selectedUrls: selectedUniqueUrls
            }
        );

    universalPackage.intelligence =
        normalizedGeminiIntelligence;

    universalPackage.investigation = {
        mode: "targeted-10-source",
        sourceCount: selectedUniqueUrls.length,
        mainProfile: selection.mainUrl,
        contentSources:
            (selection.contentSources || [])
                .map(item => item.url)
                .filter(Boolean),
        socialSources:
            selection.socialSources || [],
        fetchedSourceUrls:
            sources.map(source => source.sourceUrl).filter(Boolean),
        hunterQueries:
            publicEvidenceHunter?.searchQueries || [],
        hunterDiscoveredUrls:
            publicEvidenceHunter?.discoveredUrls || []
    };

    const packageTextSize = JSON.stringify(universalPackage).length;

    console.log(
        "CEB_RETURN_SIZE",
        packageTextSize
    );

    console.log("UNIVERSAL_PACKAGE_DEBUG", {
        success: universalPackage.success,
        sourceCount: sources.length,
        selectedSourceCount: selectedUniqueUrls.length,
        discoveredProfiles: discoveredProfiles.length,
        intelligenceStatus: normalizedGeminiIntelligence?.status || "ok",
        packageTextSize
    });

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
        confidence,
        evidenceLedger: universalPackage.evidenceLedger || [],
        universalPackage
    };

    result.success = result.sourcesSucceeded > 0;

    console.log("CROSS_EVIDENCE_FINAL", {
        success: result.success,
        sourcesProcessed: result.sourcesProcessed,
        sourcesSucceeded: result.sourcesSucceeded,
        sourcesFailed: result.sourcesFailed,
        selectedSources: selectedUniqueUrls.length,
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
