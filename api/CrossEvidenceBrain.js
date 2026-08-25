/* ============================================================
   CROSS EVIDENCE BRAIN v21
   TruthLoop AI - Universal Public Investigation Pipeline

   Mission
   --------
   1. Receive verified public source links.
   2. Fetch the main source and discover candidate public sources.
   3. Fetch a controlled investigation set:
      - 1 main profile/source
      - up to 10 public articles/posts/content pages
      - up to 10 public social/profile sources
   4. Preserve source-backed content.
   5. Ask Gemini to investigate the fetched evidence and build the
      Universal Public Evidence Package.
   6. Never use Gemini as a substitute for fetching public URLs.

   Design rules
   ------------
   - No raw HTML storage.
   - No TruthLoop conversation storage.
   - No psychological diagnosis.
   - No unsupported claims.
   - Preserve URLs and source traceability.
   - Do not use buildPublicContentPackage() here. That function contains
     a separate legacy content-compression path and can throw away useful
     source context before Gemini sees it.
   ============================================================ */

import {
    loadPublicContentFetcher
} from "./PublicContentFetcher.js";

const MAX_INITIAL_SOURCES = 20;
const MAX_CONTENT_SOURCES = 10;
const MAX_SOCIAL_SOURCES = 10;
const MAX_TOTAL_INVESTIGATION_SOURCES = 21;

const MAX_SOCIAL_LINKS_PER_SOURCE = 20;
const MAX_PROFILE_LINKS_TOTAL = 20;
const MAX_LINKS_PER_SOURCE = 40;
const MAX_ARTICLES_PER_SOURCE = 10;
const MAX_POSTS_PER_SOURCE = 10;
const MAX_EVIDENCE_PER_SOURCE = 8;
const MAX_TEXT_PER_SOURCE = 3200;
const MAX_GEMINI_SOURCE_TEXT = 2800;
const MAX_GEMINI_INPUT_CHARS = 60000;
const MAX_GEMINI_OUTPUT_TOKENS = 15000;

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
        .replace(/[<>'\]\[),.;]+$/g, "")
        .replace(/^\s*[([{]+/, "");

    if (!cleaned) return "";

    if (/^\/\//.test(cleaned)) {
        cleaned = `https:${cleaned}`;
    }

    if (!/^https?:\/\//i.test(cleaned)) return "";

    try {
        const url = new URL(cleaned);
        if (!/^https?:$/.test(url.protocol)) return "";
        url.hash = "";
        return url.toString();
    } catch {
        return "";
    }
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

function detectPlatform(value = "") {
    try {
        const hostname = new URL(value)
            .hostname
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

function isLikelyContentUrl(value = "") {
    const url = normalizeUrl(value);
    if (!url) return false;

    try {
        const path = new URL(url).pathname.toLowerCase();
        return /(?:^|\/)(?:article|articles|blog|blogs|post|posts|news|insight|insights|guide|guides|resource|resources|learn|tutorial|tutorials|case-study|case-studies|story|stories|writing|essay|essays|journal|research|academy|library|knowledge|perspective|perspectives|newsletter)(?:\/|\.|$)/i.test(path) ||
            /\/20\d{2}(?:\/|$)/i.test(path) ||
            /\/20\d{2}\/\d{1,2}(?:\/|$)/i.test(path);
    } catch {
        return false;
    }
}

function cleanText(value = "", max = MAX_TEXT_PER_SOURCE) {
    if (typeof value !== "string") return "";

    return value
        .replace(/\s+/g, " ")
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, max);
}

function sourceText(source = {}, max = MAX_TEXT_PER_SOURCE) {
    return cleanText(
        source?.visibleText ||
        source?.contentSnippet ||
        source?.description ||
        "",
        max
    );
}

function collectCandidateUrls(source = {}) {
    const social = Array.isArray(source?.socialLinks)
        ? source.socialLinks
        : Array.isArray(source?.socialProfiles)
            ? source.socialProfiles
            : [];

    const content = [
        ...(Array.isArray(source?.contentCandidates) ? source.contentCandidates : [])
            .map(item => item?.url)
            .filter(Boolean),
        ...(Array.isArray(source?.articles) ? source.articles : [])
            .map(item => item?.url)
            .filter(Boolean),
        ...(Array.isArray(source?.posts) ? source.posts : [])
            .map(item => item?.url)
            .filter(Boolean),
        ...(Array.isArray(source?.links) ? source.links : [])
    ];

    return {
        social: uniqueStrings(social, MAX_SOCIAL_LINKS_PER_SOURCE),
        content: uniqueStrings(content, MAX_LINKS_PER_SOURCE)
    };
}

function compactFetchedSource(source = {}, fallbackUrl = "", discoveredFrom = "") {
    const sourceUrl = normalizeUrl(
        source?.sourceUrl ||
        source?.canonicalUrl ||
        fallbackUrl
    );

    const platform =
        source?.sourcePlatform ||
        source?.platform ||
        detectPlatform(sourceUrl);

    const socialLinks = uniqueStrings(
        Array.isArray(source?.socialLinks)
            ? source.socialLinks
            : Array.isArray(source?.socialProfiles)
                ? source.socialProfiles
                : [],
        MAX_SOCIAL_LINKS_PER_SOURCE
    );

    const links = uniqueStrings(
        [
            ...(Array.isArray(source?.links) ? source.links : []),
            ...socialLinks
        ],
        MAX_LINKS_PER_SOURCE
    );

    const evidence = [];
    const addEvidence = (type, value, url = sourceUrl) => {
        const cleaned = cleanText(value, 900);
        if (!cleaned) return;
        evidence.push({
            type,
            sourceUrl: url || null,
            value: cleaned
        });
    };

    addEvidence("title", source?.title);
    addEvidence("description", source?.description);
    addEvidence("content", source?.visibleText);

    for (const item of (Array.isArray(source?.articles) ? source.articles : []).slice(0, MAX_ARTICLES_PER_SOURCE)) {
        addEvidence(
            "article",
            item?.description || item?.title || "",
            item?.url || sourceUrl
        );
    }

    for (const item of (Array.isArray(source?.posts) ? source.posts : []).slice(0, MAX_POSTS_PER_SOURCE)) {
        addEvidence(
            "post",
            item?.description || item?.title || "",
            item?.url || sourceUrl
        );
    }

    return {
        sourceUrl: sourceUrl || null,
        sourcePlatform: platform,
        status: source?.status ?? null,
        title: cleanText(source?.title, 220) || null,
        description: cleanText(source?.description, 500) || null,
        visibleText: sourceText(source, MAX_TEXT_PER_SOURCE) || null,
        contentSnippet: sourceText(source, MAX_TEXT_PER_SOURCE) || null,
        contentLength: Number(source?.contentLength) || String(source?.visibleText || "").length,
        canonicalUrl: normalizeUrl(source?.canonicalUrl || "") || null,
        author: cleanText(source?.author, 200) || null,
        publishedAt: cleanText(source?.publishedAt, 100) || null,
        socialLinks,
        socialProfiles: socialLinks,
        links,
        headings: Array.isArray(source?.headings) ? source.headings.slice(0, 40) : [],
        articles: Array.isArray(source?.articles) ? source.articles.slice(0, MAX_ARTICLES_PER_SOURCE) : [],
        posts: Array.isArray(source?.posts) ? source.posts.slice(0, MAX_POSTS_PER_SOURCE) : [],
        publicEvidence: Array.isArray(source?.publicEvidence) ? source.publicEvidence.slice(0, 40) : [],
        contentCandidates: Array.isArray(source?.contentCandidates) ? source.contentCandidates.slice(0, 40) : [],
        evidence: evidence.slice(0, MAX_EVIDENCE_PER_SOURCE),
        discoveredFrom: discoveredFrom || null
    };
}

async function collectSource(url, discoveredFrom = "") {
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
        return {
            success: false,
            reason: "Invalid public source URL.",
            source: null
        };
    }

    try {
        const rawPackage = await loadPublicContentFetcher({
            profileLinks: [normalizedUrl]
        });

        const fetchedSources = Array.isArray(rawPackage?.sources)
            ? rawPackage.sources
            : [];

        const exactSource = fetchedSources.find(item =>
            normalizeUrl(item?.sourceUrl || "") === normalizedUrl
        );

        const source = exactSource || fetchedSources[0] || null;

        if (!source) {
            return {
                success: false,
                reason: "Public Content Fetcher returned no source.",
                source: null
            };
        }

        return {
            success: true,
            source: compactFetchedSource(
                source,
                normalizedUrl,
                discoveredFrom
            )
        };
    } catch (error) {
        return {
            success: false,
            reason: error?.message || "Source fetch failed.",
            source: null
        };
    }
}

function rankCandidates(mainSource, sources = []) {
    const candidateMap = new Map();
    const social = [];
    const content = [];

    const add = (url, type, reason, parentUrl = "") => {
        const normalized = normalizeUrl(url);
        if (!normalized || normalized === normalizeUrl(mainSource?.sourceUrl || "")) return;
        if (candidateMap.has(normalized)) return;

        const candidate = {
            url: normalized,
            platform: detectPlatform(normalized),
            type,
            reason,
            parentUrl: normalizeUrl(parentUrl) || null
        };

        candidateMap.set(normalized, candidate);

        if (type === "social") social.push(candidate);
        else if (type === "content") content.push(candidate);
    };

    for (const source of sources) {
        const parentUrl = source?.sourceUrl || mainSource?.sourceUrl || "";
        const candidates = collectCandidateUrls(source);

        for (const url of candidates.social) {
            if (isLikelyProfileUrl(url)) {
                add(url, "social", "Discovered public profile or social URL", parentUrl);
            }
        }

        for (const url of candidates.content) {
            if (url === parentUrl) continue;
            if (isLikelyProfileUrl(url)) {
                add(url, "social", "Discovered public profile URL in source links", parentUrl);
            } else if (isLikelyContentUrl(url)) {
                add(url, "content", "Discovered public article/post/content URL", parentUrl);
            }
        }
    }

    // Content first: preserve up to 10 article/post/content candidates.
    const selectedContent = content.slice(0, MAX_CONTENT_SOURCES);
    // Social next: preserve up to 10 platform profiles/channels.
    const selectedSocial = social.slice(0, MAX_SOCIAL_SOURCES);

    return {
        content: selectedContent,
        social: selectedSocial,
        all: [...selectedContent, ...selectedSocial].slice(0, MAX_TOTAL_INVESTIGATION_SOURCES - 1)
    };
}

function dedupeSources(sources = []) {
    const map = new Map();

    for (const source of sources) {
        const key = normalizeUrl(source?.canonicalUrl || source?.sourceUrl || "");
        if (!key) continue;

        const existing = map.get(key);
        if (!existing || (source?.contentLength || 0) > (existing?.contentLength || 0)) {
            map.set(key, source);
        }
    }

    return [...map.values()];
}

function buildCrossFindings(sources = [], sourceLinks = [], discoveredProfiles = []) {
    const findings = [];
    const platforms = new Set();
    const topicCounts = new Map();

    for (const source of sources) {
        if (source?.sourcePlatform && source.sourcePlatform !== "unknown") {
            platforms.add(source.sourcePlatform);
        }

        const topicText = `${source?.title || ""} ${source?.description || ""} ${source?.visibleText || ""}`.toLowerCase();
        const dictionary = [
            "ai",
            "artificial intelligence",
            "systems",
            "system thinking",
            "psychology",
            "behavior",
            "procrastination",
            "overthinking",
            "execution",
            "business",
            "marketing",
            "education",
            "learning",
            "startup",
            "founder",
            "creator",
            "technology",
            "content"
        ];

        for (const topic of dictionary) {
            if (topicText.includes(topic)) {
                topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
            }
        }
    }

    if (sources.length > 1) {
        findings.push({
            type: "multi-source",
            sourceCount: sources.length,
            message: `${sources.length} public evidence sources were investigated.`
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
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

    if (repeatedTopics.length) {
        findings.push({
            type: "repeated-topics",
            topics: repeatedTopics
        });
    }

    const validProfiles = uniqueStrings(
        discoveredProfiles,
        MAX_PROFILE_LINKS_TOTAL
    );

    if (validProfiles.length) {
        findings.push({
            type: "discovered-profiles",
            count: validProfiles.length,
            profileLinks: validProfiles
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
        discoveredProfiles: validProfiles
    };
}

function calculateConfidence({ sources = [], sourceLinks = [], discoveredProfiles = [], findings = [] }) {
    let score = 0;
    score += Math.min(sources.length * 6, 40);
    score += Math.min(sourceLinks.length * 2, 20);
    score += Math.min(discoveredProfiles.length * 2, 20);
    score += Math.min(findings.length * 4, 20);
    return Math.max(0, Math.min(score, 100));
}

function buildGeminiInputPackage({
    sourceLinks = [],
    discoveredProfiles = [],
    investigationQueue = [],
    sources = [],
    findings = [],
    repeatedTopics = []
} = {}) {
    const packageSources = sources.map((source, index) => ({
        index,
        role: index === 0 ? "main-source" : (source?.discoveredFrom ? "discovered-source" : "source"),
        sourceUrl: source?.sourceUrl || null,
        sourcePlatform: source?.sourcePlatform || null,
        discoveredFrom: source?.discoveredFrom || null,
        title: source?.title || null,
        description: source?.description || null,
        visibleText: cleanText(source?.visibleText || source?.contentSnippet || "", MAX_GEMINI_SOURCE_TEXT),
        contentLength: source?.contentLength || 0,
        author: source?.author || null,
        publishedAt: source?.publishedAt || null,
        socialProfiles: uniqueStrings(source?.socialProfiles || source?.socialLinks || [], 12),
        links: uniqueStrings(source?.links || [], 20),
        headings: Array.isArray(source?.headings) ? source.headings.slice(0, 20) : [],
        articles: Array.isArray(source?.articles) ? source.articles.slice(0, MAX_ARTICLES_PER_SOURCE) : [],
        posts: Array.isArray(source?.posts) ? source.posts.slice(0, MAX_POSTS_PER_SOURCE) : [],
        publicEvidence: Array.isArray(source?.publicEvidence) ? source.publicEvidence.slice(0, 20) : [],
        evidence: Array.isArray(source?.evidence) ? source.evidence.slice(0, MAX_EVIDENCE_PER_SOURCE) : []
    }));

    let payload = {
        packageType: "GeminiInvestigationInput",
        mainProfileLink: sourceLinks[0] || null,
        sourceLinks: sourceLinks.slice(0, MAX_PROFILE_LINKS_TOTAL),
        discoveredProfiles: discoveredProfiles.slice(0, MAX_PROFILE_LINKS_TOTAL),
        investigationQueue,
        findings,
        repeatedTopics,
        sources: packageSources
    };

    let serialized = JSON.stringify(payload);

    if (serialized.length > MAX_GEMINI_INPUT_CHARS) {
        payload.sources = payload.sources.map(source => ({
            ...source,
            visibleText: cleanText(source.visibleText, 1800),
            publicEvidence: Array.isArray(source.publicEvidence)
                ? source.publicEvidence.slice(0, 10)
                : [],
            evidence: Array.isArray(source.evidence)
                ? source.evidence.slice(0, 5)
                : []
        }));
        serialized = JSON.stringify(payload);
    }

    if (serialized.length > MAX_GEMINI_INPUT_CHARS) {
        payload.sources = payload.sources.map(source => ({
            ...source,
            visibleText: cleanText(source.visibleText, 1200),
            links: Array.isArray(source.links) ? source.links.slice(0, 12) : [],
            socialProfiles: Array.isArray(source.socialProfiles) ? source.socialProfiles.slice(0, 8) : []
        }));
    }

    return payload;
}

async function buildGeminiIntelligence(evidencePackage = {}) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            status: "disabled",
            reason: "Missing GEMINI_API_KEY"
        };
    }

    const prompt = `
You are TruthLoop's Universal Public Investigation Intelligence Engine.

ROLE:
You are NOT a simple summarizer and you are NOT a final report generator.
You are the evidence-investigation layer that operates on already-fetched public sources.

IMPORTANT LIMITATION:
You cannot directly browse or fetch the internet in this API call.
The source URLs below have already been fetched by TruthLoop's PublicContentFetcher.
Use the fetched public content as the investigation evidence.
Do not claim that a URL was investigated unless its fetched source data is present below.

PRIMARY OBJECTIVE:
Build ONE Universal Public Evidence Package from the complete fetched source set.
Preserve source-backed evidence so the next Loop 7 reasoning stage can perform deep investigation.

INVESTIGATION REQUIREMENTS:
1. Treat the first source as the main profile/source when marked main-source.
2. Treat discovered-source entries as independently fetched public sources.
3. Inspect every provided source, not just the first one.
4. Use the provided source content, headings, articles, posts, publicEvidence, links and profile URLs.
5. Preserve the source URL for every important claim.
6. Identify verified identity signals.
7. Identify repeated topics, expertise, audience, business, creator and positioning signals.
8. Identify evidence-backed contradictions only when supported by the fetched sources.
9. Identify evidence-backed behavioral signals only when explicitly supported by the fetched sources.
10. Preserve the strongest direct evidence instead of replacing it with vague summaries.
11. Preserve article/post titles and excerpts when available.
12. Preserve profile descriptions and page content when available.
13. Preserve discovered platform URLs exactly as provided.
14. Do not treat the existence of a URL as proof of substantive activity.
15. Distinguish inaccessible/login/error pages from real public content.
16. Never invent facts, identities, URLs, posts, articles, followers, metrics or expertise.

SOURCE PRIORITY:
- Main source: highest identity and positioning priority.
- Public article/post sources: highest content priority.
- Public social/profile sources: identity + public activity priority.
- Repeated source-backed signals: higher confidence than one-off claims.

EVIDENCE PRESERVATION:
- Do not collapse the entire investigation into a tiny summary.
- Preserve meaningful source content.
- Preserve direct snippets whenever possible.
- Preserve up to 40 strong evidence records.
- Preserve up to 25 useful content samples.
- Preserve up to 25 source-content records.
- Keep each stored snippet concise enough for JSON, but retain the source wording.
- Never use empty summary fields when direct evidence exists.

OUTPUT:
Return ONLY valid JSON.
Return one Universal Public Evidence Package with this structure:
{
  "identity": {
    "name": null,
    "title": null,
    "company": null,
    "website": null,
    "location": null
  },
  "names": [],
  "usernames": [],
  "handles": [],
  "companies": [],
  "brands": [],
  "websites": [],
  "platforms": [],
  "discoveredProfiles": [],
  "sourceUrls": [],
  "positioning": {
    "summary": null,
    "niche": null,
    "expertise": [],
    "audience": []
  },
  "niches": [],
  "expertiseSignals": [],
  "audienceSignals": [],
  "businessSignals": [],
  "creatorSignals": [],
  "topics": [],
  "behavioralSignals": [],
  "contradictions": [],
  "importantEvidence": [
    {
      "id": "EVID-001",
      "claim": null,
      "snippet": null,
      "sourceUrl": null,
      "sourcePlatform": null
    }
  ],
  "contentSamples": [
    {
      "type": null,
      "title": null,
      "content": null,
      "sourceUrl": null
    }
  ],
  "sourceContent": [
    {
      "sourceUrl": null,
      "sourcePlatform": null,
      "content": null
    }
  ],
  "investigatedSources": []
}

CRITICAL:
- Do not invent missing data.
- Do not turn a URL into proof of activity.
- Do not discard useful fetched content merely to make the JSON shorter.
- Preserve source traceability.
- If a source contains real content, carry that content into sourceContent/contentSamples/importantEvidence.

FETCHED PUBLIC INVESTIGATION INPUT:
${JSON.stringify(evidencePackage)};
`;
console.log(
  "DFB_7_BEFORE_GEMINI"
);
    try {
        console.log("GEMINI_EVIDENCE_SIZE", JSON.stringify(evidencePackage).length);
        console.log("GEMINI_EVIDENCE_KEYS", Object.keys(evidencePackage || {}));
        console.log("GEMINI_REQUEST_START");

        const modelName = "gemini-3.6-flash";
        console.log("GEMINI_MODEL", modelName);

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
                        maxOutputTokens: MAX_GEMINI_OUTPUT_TOKENS
                    }
                })
            }
        );

        console.log("GEMINI_HTTP_STATUS", response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.log("GEMINI_ERROR_BODY", errorBody);
            return {
                status: "failed",
                error: errorBody
            };
        }

        const data = await response.json();
        console.log("GEMINI_CANDIDATES", data?.candidates?.length || 0);
        console.log("GEMINI_RESPONSE_KEYS", Object.keys(data || {}));

        const content =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("GEMINI_RESPONSE_SIZE", content.length);

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
        } catch (error) {
            console.log("GEMINI_PARSE_FAILED_CONTENT", content);
            throw error;
        }

        console.log(
            "GEMINI_OUTPUT_KEYS",
            Object.keys(parsedContent || {})
        );

        return parsedContent;
    } catch (error) {
        console.error("GEMINI_INTELLIGENCE_ERROR", error);
        return {
            status: "failed",
            error: error.message
        };
    }
}

export async function loadCrossEvidenceBrain({
    profileLinks = [],
    footprintPackage = {},
    truthLoopPackage = {}
} = {}) {
    void footprintPackage;
    void truthLoopPackage;

    const requestedLinks = Array.isArray(profileLinks)
        ? profileLinks
        : [];

    const sourceLinks = uniqueStrings(
        requestedLinks,
        MAX_INITIAL_SOURCES
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

    if (!sourceLinks.length) {
        result.errors.push("At least one public source URL is required.");
        return result;
    }

    console.log("CROSS_EVIDENCE_PROFILE_LINKS", sourceLinks);

    /* ------------------------------------------------------------
       PASS 1: FETCH EXPLICIT USER-PROVIDED SOURCES
       ------------------------------------------------------------ */

    const initialSources = [];

    for (const url of sourceLinks) {
        result.sourcesProcessed++;

        const collected = await collectSource(
            url,
            "explicit-input"
        );

        if (collected?.success && collected?.source) {
            result.sourcesSucceeded++;
            initialSources.push(collected.source);
        } else {
            result.sourcesFailed++;
            result.errors.push({
                url,
                reason: collected?.reason || "Source fetch failed."
            });
        }
    }

    if (!initialSources.length) {
        result.errors.push("No explicit public source could be fetched.");
        return result;
    }

    const mainSource = initialSources[0];

    /* ------------------------------------------------------------
       DISCOVERY: BUILD A CONTROLLED INVESTIGATION QUEUE
       ------------------------------------------------------------ */

    const candidateSet = rankCandidates(
        mainSource,
        initialSources
    );

    const investigationQueue = candidateSet.all.map((candidate, index) => ({
        ...candidate,
        priority:
            candidate.type === "content"
                ? 80 - index
                : 60 - index
    }));

    console.log(
        "INVESTIGATION_QUEUE",
        {
            mainProfileLink: mainSource?.sourceUrl || null,
            contentCandidates: candidateSet.content.length,
            socialCandidates: candidateSet.social.length,
            totalCandidates: investigationQueue.length
        }
    );

    /* ------------------------------------------------------------
       PASS 2: FETCH DISCOVERED CONTENT + SOCIAL SOURCES
       ------------------------------------------------------------ */

    const discoveredSources = [];

    for (const candidate of investigationQueue) {
        if (
            discoveredSources.length >=
            MAX_TOTAL_INVESTIGATION_SOURCES - 1
        ) {
            break;
        }

        result.sourcesProcessed++;

        const collected = await collectSource(
            candidate.url,
            candidate.parentUrl || "discovered"
        );

        if (collected?.success && collected?.source) {
            result.sourcesSucceeded++;

            discoveredSources.push({
                ...collected.source,
                discoveredSource: true,
                discoveryType: candidate.type,
                discoveryReason: candidate.reason,
                priority: candidate.priority
            });
        } else {
            result.sourcesFailed++;
            result.errors.push({
                url: candidate.url,
                reason: collected?.reason || "Discovered source fetch failed."
            });
        }
    }

    const allSources = dedupeSources([
        mainSource,
        ...initialSources.slice(1),
        ...discoveredSources
    ]);

    const discoveredProfiles = uniqueStrings(
        allSources.flatMap(source =>
            Array.isArray(source?.socialProfiles)
                ? source.socialProfiles
                : Array.isArray(source?.socialLinks)
                    ? source.socialLinks
                    : []
        ),
        MAX_PROFILE_LINKS_TOTAL
    );

    const allTraceableLinks = uniqueStrings(
        [
            ...sourceLinks,
            ...investigationQueue.map(item => item.url),
            ...discoveredProfiles
        ],
        MAX_PROFILE_LINKS_TOTAL
    );

    const cross = buildCrossFindings(
        allSources,
        allTraceableLinks,
        discoveredProfiles
    );

    const evidenceLedger = allSources
        .flatMap(source =>
            (Array.isArray(source?.evidence) ? source.evidence : [])
                .map((item, index) => ({
                    id: `${source.sourceUrl || "source"}#e${index + 1}`,
                    sourceUrl: item.sourceUrl || source.sourceUrl,
                    sourcePlatform: source.sourcePlatform,
                    sourceType: item.type,
                    evidence: item.value
                }))
        )
        .slice(0, 120);

    const confidence = calculateConfidence({
        sources: allSources,
        sourceLinks: allTraceableLinks,
        discoveredProfiles,
        findings: cross.findings
    });

    const geminiInput = buildGeminiInputPackage({
        sourceLinks,
        discoveredProfiles,
        investigationQueue,
        sources: allSources,
        findings: cross.findings,
        repeatedTopics: cross.repeatedTopics
    });

    console.log(
        "GEMINI_INVESTIGATION_INPUT",
        {
            sources: allSources.length,
            mainProfileLink: mainSource?.sourceUrl || null,
            contentSources: candidateSet.content.length,
            socialSources: candidateSet.social.length,
            inputChars: JSON.stringify(geminiInput).length
        }
    );

    /* ------------------------------------------------------------
       GEMINI: INVESTIGATE FETCHED PUBLIC EVIDENCE
       ------------------------------------------------------------ */

    console.log("GEMINI_TRIGGER");

    const geminiIntelligence =
        await buildGeminiIntelligence(geminiInput);

    console.log(
        "GEMINI_AFTER",
        Object.keys(geminiIntelligence || {})
    );

    /* ------------------------------------------------------------
       UNIVERSAL PACKAGE
       ------------------------------------------------------------ */

    const universalPackage = {
        success: true,
        packageType: "UniversalPublicEvidencePackage",
        version: "21.0",
        mainProfileLink: mainSource?.sourceUrl || sourceLinks[0] || null,
        sourceLinks: allTraceableLinks,
        discoveredProfiles,
        platforms: cross.platforms,
        confidence,
        investigationQueue,
        sources: allSources,
        findings: cross.findings,
        repeatedTopics: cross.repeatedTopics,
        evidenceLedger,
        investigation: geminiIntelligence?.status === "failed"
            ? null
            : geminiIntelligence
    };

    const packageTextSize = JSON.stringify(universalPackage).length;

    console.log(
        "UNIVERSAL_PACKAGE_DEBUG",
        {
            totalSources: allSources.length,
            contentSources: candidateSet.content.length,
            socialSources: candidateSet.social.length,
            discoveredProfiles: discoveredProfiles.length,
            evidenceEntries: evidenceLedger.length,
            packageChars: packageTextSize
        }
    );

    result.confidenceScore = confidence;
    result.universalPackage = universalPackage;
    result.crossEvidencePackage = {
        success: true,
        packageType: "CrossEvidencePackage",
        version: "21.0",
        sourceLinks: allTraceableLinks,
        discoveredProfiles,
        platforms: cross.platforms,
        findings: cross.findings,
        confidence,
        evidenceLedger,
        universalPackage
    };

    result.success = result.sourcesSucceeded > 0;

    console.log("CROSS_EVIDENCE_FINAL", {
        success: result.success,
        sourcesProcessed: result.sourcesProcessed,
        sourcesSucceeded: result.sourcesSucceeded,
        sourcesFailed: result.sourcesFailed,
        sourceLinks: allTraceableLinks.length,
        discoveredProfiles: discoveredProfiles.length,
        platforms: cross.platforms.length,
        confidence,
        universalPackageSize: packageTextSize
    });

    return result;
}

export function getCrossEvidencePlatform(url) {
    return detectPlatform(normalizeUrl(url));
}
