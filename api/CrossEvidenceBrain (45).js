/* ============================================================
   CROSS EVIDENCE BRAIN v20 — EVIDENCE PRESERVATION UPDATE
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
const MAX_TOTAL_PACKAGE_CHARS = 14000;
const MAX_WEBSITE_INVESTIGATION_LINKS = 10;
const MAX_LINKEDIN_INVESTIGATION_POSTS = 5;
const MAX_LINKEDIN_INVESTIGATION_ARTICLES = 5;
const MAX_LINKEDIN_ITEM_TEXT = 650;
const MAX_LINKEDIN_ABOUT_CHARS = 1400;

// Targeted Gemini investigation budget.
// Keep the public contract and existing function names unchanged.
const MAX_GEMINI_SOURCES = 12;
const MAX_GEMINI_CONTENT_LINKS = 10;
const MAX_GEMINI_SOCIAL_LINKS = 1;

// Active public evidence routes.
// Keep future platform support in this file, but do not execute it yet.
const ENABLE_LINKEDIN_APIFY = true;
const ENABLE_X = false;
const ENABLE_REDDIT = false;
const ENABLE_OTHER_SOCIAL = false;

// Apify actor selected and already verified manually in Apify Console.
const APIFY_ACTOR_ID = "crawlerbros~linkedin-profile-scraper";
const APIFY_TIMEOUT_SECONDS = 120;
const MAX_GEMINI_SOURCE_CHARS = 3500;
const MAX_GEMINI_EVIDENCE_SNIPPETS = 8;
const MAX_GEMINI_CONTENT_ITEMS = 6;
const MAX_GEMINI_CONTENT_ITEM_CHARS = 700;
const SOURCE_CACHE = new Map();
async function buildGeminiIntelligence(evidencePackage = {}) {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            status: "disabled",
            reason: "Missing GEMINI_API_KEY"
        };
    }

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
- content: up to 10 highest-priority public content sources.
- social: at most 1 public LinkedIn profile source.

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
If a selected social/profile URL contains no extracted page body,
use any captured social-page evidence attached to that source.
Do not classify the profile as empty unless both page content and
attached evidence are absent.
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
            "GEMINI_EVIDENCE_KEYS",
            Object.keys(evidencePackage || {})
        );

        

        const modelName = "gemini-3.6-flash";

        

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

        // Guarantee that downstream Loop 7 always receives traceable content
        // for every selected source, even if Gemini compresses sourceContent
        // down to identity metadata only. This is deterministic preservation,
        // not new evidence.
        const guaranteedSourceContent = (evidencePackage.sources || [])
            .map(source => ({
                sourceUrl: source?.sourceUrl || null,
                sourceRole: source?.sourceRole || null,
                content: cleanText(
                    [
                        source?.title || "",
                        source?.description || "",
                        source?.visibleText || "",
                        ...(Array.isArray(source?.contentSamples)
                            ? source.contentSamples.map(item =>
                                [item?.title || "", item?.content || ""]
                                    .filter(Boolean)
                                    .join(": ")
                            )
                            : [])
                    ]
                        .filter(Boolean)
                        .join("\n"),
                    1800
                ) || null
            }))
            .filter(item => item.sourceUrl && item.content);

        const existingSourceUrls = new Set(
            (Array.isArray(parsedContent.sourceContent)
                ? parsedContent.sourceContent
                : []
            )
                .map(item => normalizeUrl(item?.sourceUrl || ""))
                .filter(Boolean)
        );

        if (!Array.isArray(parsedContent.sourceContent)) {
            parsedContent.sourceContent = [];
        }

        for (const sourceContent of guaranteedSourceContent) {
            const normalizedSourceUrl = normalizeUrl(sourceContent.sourceUrl);
            if (!normalizedSourceUrl) continue;

            if (!existingSourceUrls.has(normalizedSourceUrl)) {
                parsedContent.sourceContent.push(sourceContent);
                existingSourceUrls.add(normalizedSourceUrl);
            }
        }

        parsedContent.sourceContent = parsedContent.sourceContent
            .slice(0, MAX_GEMINI_SOURCES);

        console.log(
            "GEMINI_OUTPUT_KEYS",
            Object.keys(parsedContent || {})
        );
const geminiLinkedInSource = (parsedContent.sourceContent || []).find(item =>
    item?.sourceRole === "social" ||
    String(item?.sourceUrl || "").toLowerCase().includes("linkedin.com")
) || null;

const geminiLinkedInEvidence = (parsedContent.evidence || []).filter(item =>
    String(item?.sourceUrl || "").toLowerCase().includes("linkedin.com")
);

console.log(
  "GEMINI_LINKEDIN_PROFILES",
  JSON.stringify(parsedContent.discoveredProfiles || [], null, 2)
);
console.log(
  "GEMINI_SOURCE_CONTENT_RAW",
  JSON.stringify(
    parsedContent.sourceContent || [],
    null,
    2
  )
);
console.log(
  "FIRST_SOURCE_CONTENT",
  JSON.stringify(
    parsedContent.sourceContent?.[0] || {},
    null,
    2
  )
);

console.log(
  "SECOND_SOURCE_CONTENT",
  JSON.stringify(
    parsedContent.sourceContent?.[1] || {},
    null,
    2
  )
);
console.log(
  "GEMINI_EVIDENCE_RAW",
  JSON.stringify(
    parsedContent.evidence || [],
    null,
    2
  )
);
console.log(
  "GEMINI_LINKEDIN_CONTENT",
  JSON.stringify(geminiLinkedInSource || {}, null, 2)
);

console.log(
  "GEMINI_LINKEDIN_EVIDENCE",
  JSON.stringify(geminiLinkedInEvidence, null, 2)
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

        // LinkedIn host canonicalization
        if (
            url.hostname === "in.linkedin.com" ||
            url.hostname === "www.linkedin.com"
        ) {
            url.hostname = "www.linkedin.com";
        }

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


function normalizeIdentityText(value = "") {
    return String(value || "")
        .toLowerCase()
        .replace(/https?:\/\/|www\./g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buildIdentityAnchors(identity = {}) {
    const names = Array.isArray(identity?.names)
        ? identity.names
        : [];
    const companies = Array.isArray(identity?.companies)
        ? identity.companies
        : [];

    const host = String(identity?.host || "")
        .replace(/^www\./i, "")
        .toLowerCase()
        .trim();

    const linkedinUsername =
        String(identity?.linkedinUsername || "")
            .trim()
            .toLowerCase();

    const brandFromHost = host
        ? host.split(".")[0].replace(/[^a-z0-9]+/gi, " ").trim()
        : "";

    const normalizedNames = [...new Set(
        [
            ...names,
            linkedinUsername
                .replace(/[-_]+/g, " ")
                .replace(/\b\d{4,}\b/g, " ")
        ]
            .map(normalizeIdentityText)
            .filter(Boolean)
    )];

    const normalizedCompanies = [...new Set(
        companies
            .map(normalizeIdentityText)
            .filter(Boolean)
    )];

    const normalizedBrand = normalizeIdentityText(
        brandFromHost
    );

    return {
        host,
        linkedinUsername,
        names: normalizedNames,
        companies: normalizedCompanies,
        brand: normalizedBrand
    };
}

function scoreIdentityMatch(candidate = {}, identity = {}) {
    const anchors = buildIdentityAnchors(identity);

    const url = normalizeUrl(candidate?.url || "");
    const title = normalizeIdentityText(candidate?.title || "");
    const snippet = normalizeIdentityText(
        candidate?.snippet ||
        candidate?.description ||
        ""
    );
    const haystack = [
        title,
        snippet,
        normalizeIdentityText(url)
    ]
        .filter(Boolean)
        .join(" ");

    let hostName = "";
    let path = "";

    try {
        const parsed = new URL(url);
        hostName = parsed.hostname
            .replace(/^www\./, "")
            .toLowerCase();
        path = parsed.pathname.toLowerCase();
    } catch {}

    // Strongest possible match: exact requested/main website domain.
    if (
        anchors.host &&
        (
            hostName === anchors.host ||
            hostName.endsWith(`.${anchors.host}`)
        )
    ) {
        return 100;
    }

    // Strongest social identity match: exact LinkedIn username/slug.
    if (
        anchors.linkedinUsername &&
        (
            url.toLowerCase().includes(
                `/in/${anchors.linkedinUsername}`
            ) ||
            haystack.includes(anchors.linkedinUsername)
        )
    ) {
        return 100;
    }

    const nameMatch = anchors.names.some(name => {
        if (!name) return false;
        return haystack.includes(name);
    });

    const companyMatch = anchors.companies.some(company => {
        if (!company) return false;
        return haystack.includes(company);
    });

    const brandMatch =
        anchors.brand &&
        haystack.includes(anchors.brand);

    // External evidence must carry at least two independent identity anchors.
    if (nameMatch && companyMatch) return 96;
    if (nameMatch && brandMatch) return 94;
    if (companyMatch && brandMatch) return 92;

    // A two-token personal name plus the site brand is also strong.
    const primaryName = anchors.names[0] || "";
    const nameTokens = primaryName
        .split(" ")
        .filter(token => token.length >= 3);

    if (
        nameTokens.length >= 2 &&
        nameTokens.filter(token => haystack.includes(token)).length >= 2 &&
        brandMatch
    ) {
        return 90;
    }

    // Do not accept a generic name, generic company, or search-query relevance
    // on its own as verified identity evidence.
    return 0;
}

function isStrongIdentityMatch(candidate = {}, identity = {}) {
    return scoreIdentityMatch(candidate, identity) >= 90;
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

    linkedinProfile:
        source?.linkedinProfile && typeof source.linkedinProfile === "object"
            ? {
                profileUrl: normalizeUrl(source.linkedinProfile.profileUrl || sourceUrl) || sourceUrl || null,
                name: cleanText(source.linkedinProfile.name || "", 180) || null,
                headline: cleanText(source.linkedinProfile.headline || "", 260) || null,
                about: cleanText(source.linkedinProfile.about || "", MAX_LINKEDIN_ABOUT_CHARS) || null,
                location: cleanText(source.linkedinProfile.location || "", 220) || null,
                currentCompany: cleanText(source.linkedinProfile.currentCompany || "", 220) || null,
                followersCount:
                    source.linkedinProfile.followersCount !== undefined && source.linkedinProfile.followersCount !== null
                        ? source.linkedinProfile.followersCount
                        : null
            }
            : undefined,

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

function compactInvestigationItem(item = {}, fallbackUrl = "", type = "content") {
    if (typeof item === "string") {
        return {
            type,
            title: cleanText(item, 180) || null,
            text: cleanText(item, MAX_LINKEDIN_ITEM_TEXT) || null,
            url: normalizeUrl(fallbackUrl) || null
        };
    }

    const url = normalizeUrl(
        item?.url ||
        item?.sourceUrl ||
        fallbackUrl ||
        ""
    );

    const text = cleanText(
        item?.text ||
        item?.content ||
        item?.description ||
        "",
        MAX_LINKEDIN_ITEM_TEXT
    );

    return {
        type,
        title: cleanText(item?.title || "", 180) || null,
        text: text || null,
        url: url || null,
        publishedDate:
            item?.publishedDate ||
            item?.publishedAt ||
            item?.date ||
            item?.postedAt ||
            null,
        likes:
            Number.isFinite(Number(item?.likes))
                ? Number(item.likes)
                : null
    };
}

function buildInvestigationEvidenceMetadata({ selection = {}, sources = [] } = {}) {
    const sourceByUrl = new Map(
        (sources || [])
            .filter(Boolean)
            .map(source => [normalizeUrl(source?.sourceUrl || ""), source])
            .filter(([url]) => !!url)
    );

    const websiteContent = [];
    const seenWebsite = new Set();

    for (const candidate of selection?.contentSources || []) {
        const url = normalizeUrl(candidate?.url || "");
        if (!url || seenWebsite.has(url) || detectPlatform(url) !== "website") continue;
        seenWebsite.add(url);
        websiteContent.push({
            title: cleanText(candidate?.title || "", 180) || null,
            url,
            sourceType: candidate?.sourceType || "content"
        });
        if (websiteContent.length >= MAX_WEBSITE_INVESTIGATION_LINKS) break;
    }

    const linkedInSource = (sources || []).find(
        source => detectPlatform(source?.sourceUrl || "") === "linkedin"
    ) || null;

    const linkedInProfile = linkedInSource?.linkedinProfile || {
        profileUrl: linkedInSource?.sourceUrl || null,
        name: linkedInSource?.title || null,
        headline: linkedInSource?.description || null,
        about: null,
        location: null,
        currentCompany: null,
        followersCount: null
    };

    const linkedinPosts = (linkedInSource?.posts || [])
        .slice(0, MAX_LINKEDIN_INVESTIGATION_POSTS)
        .map(item => compactInvestigationItem(item, linkedInSource?.sourceUrl || "", "post"));

    const linkedinArticles = (linkedInSource?.articles || [])
        .slice(0, MAX_LINKEDIN_INVESTIGATION_ARTICLES)
        .map(item => compactInvestigationItem(item, linkedInSource?.sourceUrl || "", "article"));

    const linkedinProfileUrl = normalizeUrl(
        linkedInProfile?.profileUrl ||
        linkedInSource?.sourceUrl ||
        ""
    );

    const evidenceCoverage = {
        websitePagesInvestigated: websiteContent.length,
        linkedInProfileInvestigated: linkedinProfileUrl ? 1 : 0,
        linkedInArticlesInvestigated: linkedinArticles.length,
        linkedInPostsInvestigated: linkedinPosts.length,
        totalSourcesReviewed:
            websiteContent.length +
            (linkedinProfileUrl ? 1 : 0) +
            linkedinArticles.length
    };

    return {
        websiteInvestigation: {
            top10Investigated: websiteContent
        },
        linkedinInvestigation: {
            profile: linkedinProfileUrl
                ? {
                    profileUrl: linkedinProfileUrl,
                    name: linkedInProfile?.name || null,
                    headline: linkedInProfile?.headline || null,
                    about: linkedInProfile?.about || null,
                    location: linkedInProfile?.location || null,
                    currentCompany: linkedInProfile?.currentCompany || null,
                    followersCount: linkedInProfile?.followersCount ?? null
                }
                : null,
            top5Posts: linkedinPosts,
            top5Articles: linkedinArticles
        },
        evidenceCoverage
    };
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
        evidenceLedger: (pkg.evidenceLedger || []).slice(0, 30),
        websiteInvestigation: pkg.websiteInvestigation || null,
        linkedinInvestigation: pkg.linkedinInvestigation || null,
        evidenceCoverage: pkg.evidenceCoverage || null
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
        websiteInvestigation: pkg.websiteInvestigation || null,
        linkedinInvestigation: pkg.linkedinInvestigation || null,
        evidenceCoverage: pkg.evidenceCoverage || null,
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
 * SocialMediaContentFetcher
 * --------------------------
 * Fetches only explicitly discovered/selected social URLs.
 *
 * Current active route:
 * - LinkedIn -> Apify
 *
 * Future routes remain in code but are disabled by feature flags.
 */

async function SocialMediaContentFetcher({
  mainSource = {},
  requestedLinks = []
} = {}) {

  const socialUrls = uniqueStrings([
    ...(mainSource?.socialProfiles || []),
    ...(mainSource?.socialLinks || []),
    ...requestedLinks
  ]).filter(Boolean);

  const platformEnabled = (url = "") => {
    const platform = detectPlatform(url);

    if (platform === "linkedin") return ENABLE_LINKEDIN_APIFY;
    if (platform === "x") return ENABLE_X;
    if (platform === "reddit") return ENABLE_REDDIT;

    return ENABLE_OTHER_SOCIAL;
  };

  const selectedUrls = socialUrls
    .filter(platformEnabled)
    .slice(0, MAX_GEMINI_SOCIAL_LINKS);

  const fetchedSources = [];
  const compressedEvidence = [];

  for (const url of selectedUrls) {
    try {

      let source = null;

      if (detectPlatform(url) === "linkedin") {

        // LinkedIn is handled by Apify, never by the PCF/browse fetch path.
        const apifyResult = await collectSource(url);
        source = apifyResult?.source || null;

      } else {

        // Future platform route stays intact but is disabled by feature flags.
        const rawPackage =
          await loadPublicContentFetcher({
            profileLinks: [url]
          });

        const extractedPackage =
          extractPublicContent(rawPackage);

        const packageResult =
          buildPublicContentPackage(
            rawPackage,
            extractedPackage
          );

        source =
          packageResult?.sources?.[0] || null;
      }

      if (!source) continue;

      fetchedSources.push(source);

      const text =
        source.visibleText ||
        source.contentSnippet ||
        source.extractedText ||
        "";

      if (text.length > 100) {
        compressedEvidence.push({
          sourceUrl: url,
          title: source.title || null,
          snippet: cleanText(text, 700)
        });
      }

    } catch (error) {
      console.error(
        "SOCIAL_FETCH_FAILED",
        url,
        error?.message
      );
    }
  }

  return {
    socialSources: selectedUrls,
    fetchedSources,
    compressedEvidence,
    attemptedCount: selectedUrls.length,
    fetchedCount: fetchedSources.length
  };
}

/* ============================================================
   TEMPORARILY DISABLED: BROWSER / BRAND SEARCH SYSTEM

   Current Loop 7 evidence must come only from the selected
   Website + LinkedIn routes.

   The original functions are preserved verbatim for future use.
   ============================================================

function buildBrandIdentity({
    mainSource = {},
    socialSources = []
} = {}) {

    const website =
        mainSource?.sourceUrl ||
        mainSource?.canonicalUrl ||
        "";

    const hostname = (() => {
        try {
            return new URL(website)
                .hostname
                .replace(/^www\./, "");
        } catch {
            return "";
        }
    })();

    const brandName =
        mainSource?.title ||
        hostname.split(".")[0] ||
        "";

    return {
        brandName,
        website,
        hostname,
        socialSources
    };
}
function buildBrandQueries(identity) {

    const brand =
        identity.brandName?.trim();

    const host =
        identity.hostname?.trim();

    return uniqueStrings([
        `"${brand}"`,
        `"${brand}" review`,
        `"${brand}" interview`,
        `"${brand}" podcast`,
        `"${brand}" founder`,
        `"${brand}" reddit`,
        `"${brand}" site:linkedin.com`,
        `"${brand}" site:medium.com`,
        `"${brand}" site:substack.com`,
        `"${brand}" site:github.com`,
        `"${brand}" site:youtube.com`,
        `"${host}"`
    ]);
}
async function searchPublicEvidence(query = "") {
console.log(
   "BRAND_QUERY",
   query
);
    if (!query?.trim()) {
        return [];
    }

    try {

        const result =
            await loadPublicContentFetcher({
                profileLinks: [query]
            });

        const sources =
            Array.isArray(result?.sources)
                ? result.sources
                : [];

        return sources.map(source => ({

            sourceUrl:
                source?.sourceUrl ||
                source?.url ||
                "",

            title:
                source?.title ||
                "",

            snippet:
                source?.contentSnippet ||
                source?.description ||
                source?.visibleText?.slice(0, 500) ||
                "",

            platform:
                source?.platform ||
                detectPlatform(
                    source?.sourceUrl || ""
                ),

            sourceType:
                "brand-evidence"

        }));

    } catch (error) {

        console.log(
            "SEARCH_PUBLIC_EVIDENCE_ERROR",
            query,
            error?.message
        );

        return [];
    }
}
async function BrandEvidenceFetcher({
    mainSource = {},
    socialSources = []
} = {}) {

    const identity =
        buildBrandIdentity({
            mainSource,
            socialSources
        });

    const queries =
        buildBrandQueries(identity);

    const evidence = [];

    for (const query of queries) {

        try {

            const searchResult =
                await searchPublicEvidence(query);

            evidence.push(
                ...(searchResult || [])
            );

        } catch (error) {

            console.log(
                "BRAND_EVIDENCE_ERROR",
                query,
                error?.message
            );

        }
    }

    return {
        brandName:
            identity.brandName,

        queryCount:
            queries.length,

        sources:
            evidence
    };
}

============================================================ */
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
        // Current Loop 7 target: LinkedIn only.
        .filter(url => detectPlatform(url) === "linkedin")
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

function buildGeminiContentItems(source = {}, sourceUrl = "", sourceRole = "") {
    const items = [];

    const addItem = (type, title, content, url = sourceUrl) => {
        const text = cleanText(content || "", MAX_GEMINI_CONTENT_ITEM_CHARS);
        const normalizedUrl = normalizeUrl(url) || sourceUrl || null;
        if (!text && !title) return;
        items.push({
            type,
            title: cleanText(title || "", 180) || null,
            content: text || null,
            sourceUrl: normalizedUrl,
            sourceRole
        });
    };

    if (Array.isArray(source.posts)) {
        source.posts.slice(0, MAX_GEMINI_CONTENT_ITEMS).forEach((post, index) => {
            if (typeof post === "string") {
                addItem("post", `Post ${index + 1}`, post);
                return;
            }
            addItem(
                "post",
                post?.title || `Post ${index + 1}`,
                post?.text || post?.content || post?.description || post?.title || "",
                post?.url || post?.sourceUrl || sourceUrl
            );
        });
    }

    if (Array.isArray(source.articles)) {
        source.articles.slice(0, MAX_GEMINI_CONTENT_ITEMS).forEach((article, index) => {
            if (typeof article === "string") {
                addItem("article", `Article ${index + 1}`, article);
                return;
            }
            addItem(
                "article",
                article?.title || `Article ${index + 1}`,
                article?.text || article?.content || article?.description || article?.title || "",
                article?.url || article?.sourceUrl || sourceUrl
            );
        });
    }

    if (!items.length) {
        const fallback = source?.contentSnippet || source?.visibleText || "";
        if (fallback) addItem("source-text", source?.title || sourceRole || "Source content", fallback);
    }

    return items.slice(0, MAX_GEMINI_CONTENT_ITEMS);
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
if (sourceUrl.includes("linkedin.com")) {
    console.log(
      "LINKEDIN_CREATED_SOURCE",
      JSON.stringify(
        {
          sourceUrl,
          sourceRole,

          visibleTextLength:
            source?.visibleText?.length || 0,

          contentSnippetLength:
            source?.contentSnippet?.length || 0,

          contentLength:
            source?.content?.length || 0,

          extractedTextLength:
            source?.extractedText?.length || 0,

          rawContentLength:
            source?.rawContent?.length || 0,

          postsCount: Array.isArray(source?.posts)
            ? source.posts.length
            : 0
        },
        null,
        2
      )
    );
             }
       
       
if (sourceUrl.includes("linkedin.com")) {
  console.log(
    "LINKEDIN_SOURCE_AUDIT",
    JSON.stringify(
      {
        keys: Object.keys(source || {}),
        sourceDump: source,
        visibleText: source?.visibleText?.length || 0,
        contentSnippet: source?.contentSnippet?.length || 0,
        content: source?.content?.length || 0,
        extractedText: source?.extractedText?.length || 0,
        rawContent: source?.rawContent?.length || 0,
        posts: Array.isArray(source?.posts)
          ? source.posts.length
          : 0
      },
      null,
      2
    )
  );
}
      /* const hasRealContent =
(source?.visibleText?.length || 0) > 200 ||
(source?.contentSnippet?.length || 0) > 100 ||
(source?.publicEvidence?.length || 0) > 0 ||
(source?.evidence?.length || 0) > 0 ||
(source?.content?.length || 0) > 200 ||
(source?.rawContent?.length || 0) > 200 ||
(source?.extractedText?.length || 0) > 200 ||
(Array.isArray(source?.posts) && source.posts.length > 0);
if (
    sourceUrl.includes("linkedin.com") &&
    !hasRealContent
) {
    const socialEvidence =
        evidencePackage?.socialMediaContentFetcher
            ?.compressedEvidence || [];

    source.evidence = [
        ...(source.evidence || []),
        ...socialEvidence
            .slice(0, 5)
            .map(item => ({
                type: "search-evidence",
                sourceUrl: item.sourceUrl,
                value:
                    item.snippet ||
                    item.title ||
                    ""
            }))
    ];
           }*/
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
            articles: Array.isArray(source?.articles)
                ? source.articles.slice(0, MAX_GEMINI_CONTENT_ITEMS)
                : [],
            posts: Array.isArray(source?.posts)
                ? source.posts.slice(0, MAX_GEMINI_CONTENT_ITEMS)
                : [],
            contentSamples: buildGeminiContentItems(
                source,
                sourceUrl,
                sourceRole
            ),
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
        investigationMode: "website-linkedin-investigation",
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

async function fetchLinkedInFromApify(url = "") {
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl || detectPlatform(normalizedUrl) !== "linkedin") {
        return {
            success: false,
            reason: "A valid LinkedIn public URL is required.",
            source: null
        };
    }

    const apiToken =
        process.env.APIFY_API_TOKEN ||
        process.env.APIFY_TOKEN ||
        "";

    if (!apiToken) {
        console.error(
            "APIFY_LINKEDIN_DISABLED",
            "Missing APIFY_API_TOKEN"
        );

        return {
            success: false,
            reason: "Missing APIFY_API_TOKEN.",
            source: null
        };
    }

    try {
        const endpoint =
  "https://api.apify.com/v2/actors/" +
  encodeURIComponent(APIFY_ACTOR_ID) +
  "/run-sync-get-dataset-items" +
  `?timeout=${APIFY_TIMEOUT_SECONDS}` +
  `&maxItems=1` +
  `&maxTotalChargeUsd=0.05`;
       console.log(
  "APIFY_DEBUG",
  JSON.stringify({
    endpoint,
    actorId: APIFY_ACTOR_ID,
    timeout: APIFY_TIMEOUT_SECONDS
  }, null, 2)
);
console.log(
  "APIFY_TIMEOUT_SECONDS",
  APIFY_TIMEOUT_SECONDS
);

console.log(
  "VERCEL_REGION",
  process.env.VERCEL_REGION
);

console.log(
  "FUNCTION_TIMEOUT_TEST_START",
  Date.now()
);
        console.log(
            "APIFY_LINKEDIN_START",
            JSON.stringify({
                actorId: APIFY_ACTOR_ID,
                profileUrl: normalizedUrl
            })
        );

        const response = await fetch(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    profileUrls: [normalizedUrl],
                    enrichCompany: false
                })
            }
        );

        console.log(
            "APIFY_LINKEDIN_STATUS",
            response.status
        );

        const rawBody = await response.text();

        console.log(
            "APIFY_RAW_RESPONSE",
            rawBody.slice(0, 1500)
        );

        let data = null;

        if (!response.ok) {
            let errorPayload = null;
            try {
                errorPayload = JSON.parse(rawBody);
            } catch {}

            const errorType =
                errorPayload?.error?.type ||
                errorPayload?.errorType ||
                "unknown";
            const errorMessage =
                errorPayload?.error?.message ||
                errorPayload?.message ||
                rawBody.slice(0, 1200);

            console.error(
                "APIFY_ERROR_SUMMARY",
                JSON.stringify({
                    status: response.status,
                    type: errorType,
                    message: errorMessage
                }, null, 2)
            );

            // The sync endpoint can report a failed/aborted run after the
            // Actor has already pushed an item. Reuse that run's dataset
            // instead of starting a second paid Actor run.
            const runIdMatch = rawBody.match(/run\s*ID[:\s]+([A-Za-z0-9_-]+)/i);
            const runId = runIdMatch?.[1] || null;

            if (runId) {
                const datasetEndpoint =
                    "https://api.apify.com/v2/actor-runs/" +
                    encodeURIComponent(runId) +
                    "/dataset/items?format=json&limit=1";

                try {
                    const datasetResponse = await fetch(
                        datasetEndpoint,
                        {
                            method: "GET",
                            headers: {
                                "Authorization": `Bearer ${apiToken}`
                            }
                        }
                    );

                    const datasetBody = await datasetResponse.text();

                    console.log(
                        "APIFY_DATASET_FALLBACK",
                        JSON.stringify({
                            runId,
                            status: datasetResponse.status,
                            body: datasetBody.slice(0, 1500)
                        }, null, 2)
                    );

                    if (datasetResponse.ok) {
                        try {
                            data = JSON.parse(datasetBody);
                        } catch {}
                    }
                } catch (datasetError) {
                    console.error(
                        "APIFY_DATASET_FALLBACK_FAILED",
                        datasetError?.message
                    );
                }
            }

            if (!data) {
                return {
                    success: false,
                    reason: `Apify LinkedIn request failed (${response.status}): ${errorMessage}`,
                    source: null
                };
            }
        } else {
            try {
                data = JSON.parse(rawBody);
            } catch (parseError) {
                return {
                    success: false,
                    reason: `Apify returned invalid JSON: ${parseError?.message || "parse failed"}`,
                    source: null
                };
            }
        }

        const item =
            Array.isArray(data)
                ? data[0]
                : Array.isArray(data?.items)
                    ? data.items[0]
                    : data;

        if (!item || typeof item !== "object") {
            return {
                success: false,
                reason: "Apify returned no LinkedIn profile item.",
                source: null
            };
        }

        const rawProfile =
            item?.profile && typeof item.profile === "object"
                ? item.profile
                : item;

        const profileUrl =
            normalizeUrl(
                rawProfile?.profileUrl ||
                rawProfile?.url ||
                rawProfile?.publicProfileUrl ||
                normalizedUrl
            ) || normalizedUrl;

        const name =
            rawProfile?.name ||
            [rawProfile?.firstName, rawProfile?.lastName]
                .filter(Boolean)
                .join(" ") ||
            "";

        const headline =
            rawProfile?.headline ||
            rawProfile?.currentTitle ||
            "";

        const location =
            rawProfile?.location ||
            rawProfile?.geo?.full ||
            "";

        const summary =
            rawProfile?.summary ||
            rawProfile?.about ||
            rawProfile?.description ||
            "";

        const currentCompany =
            typeof rawProfile?.currentCompany === "string"
                ? rawProfile.currentCompany
                : rawProfile?.currentCompany?.name ||
                  rawProfile?.currentCompany?.companyName ||
                  "";

        const skills = Array.isArray(rawProfile?.skills)
            ? rawProfile.skills
            : [];

        const allTitles = Array.isArray(rawProfile?.allTitles)
            ? rawProfile.allTitles
            : [];

        const experience = Array.isArray(rawProfile?.experience)
            ? rawProfile.experience
            : Array.isArray(rawProfile?.workExperience)
                ? rawProfile.workExperience
                : [];

        const education = Array.isArray(rawProfile?.education)
            ? rawProfile.education
            : [];

        const posts =
            Array.isArray(rawProfile?.posts)
                ? rawProfile.posts
                : Array.isArray(rawProfile?.recentPosts)
                    ? rawProfile.recentPosts
                    : Array.isArray(item?.posts)
                        ? item.posts
                        : [];

        const articles =
            Array.isArray(rawProfile?.articles)
                ? rawProfile.articles
                : Array.isArray(rawProfile?.recentArticles)
                    ? rawProfile.recentArticles
                    : Array.isArray(item?.articles)
                        ? item.articles
                        : [];

        const followerValue =
            rawProfile?.followersCount ??
            rawProfile?.followers ??
            null;

        const profileLines = [
            name ? `Name: ${name}` : "",
            headline ? `Headline: ${headline}` : "",
            currentCompany ? `Current company: ${currentCompany}` : "",
            location ? `Location: ${location}` : "",
            summary ? `Summary: ${summary}` : "",
            allTitles.length
                ? `Titles: ${allTitles.filter(Boolean).slice(0, 12).join(", ")}`
                : "",
            skills.length
                ? `Skills: ${skills.filter(Boolean).slice(0, 20).join(", ")}`
                : "",
            experience.length
                ? `Experience records: ${experience.length}`
                : "",
            education.length
                ? `Education records: ${education.length}`
                : "",
            followerValue !== null && followerValue !== undefined
                ? `Followers: ${followerValue}`
                : ""
        ].filter(Boolean);

        const postLines = posts
            .slice(0, 10)
            .map((post, index) => {
                if (typeof post === "string") {
                    return `Post ${index + 1}: ${post}`;
                }

                const postText =
                    post?.text ||
                    post?.content ||
                    post?.description ||
                    post?.title ||
                    "";

                const postDate =
                    post?.publishedAt ||
                    post?.date ||
                    post?.postedAt ||
                    "";

                return [
                    `Post ${index + 1}: ${postText}`,
                    postDate ? `Date: ${postDate}` : ""
                ].filter(Boolean).join(" | ");
            })
            .filter(Boolean);

        const articleLines = articles
            .slice(0, 10)
            .map((article, index) => {
                if (typeof article === "string") {
                    return `Article ${index + 1}: ${article}`;
                }

                const articleText =
                    article?.title ||
                    article?.text ||
                    article?.content ||
                    article?.description ||
                    "";

                const articleUrl =
                    normalizeUrl(
                        article?.url ||
                        article?.sourceUrl ||
                        ""
                    );

                return [
                    `Article ${index + 1}: ${articleText}`,
                    articleUrl ? `URL: ${articleUrl}` : ""
                ].filter(Boolean).join(" | ");
            })
            .filter(Boolean);

        const visibleText = [
            ...profileLines,
            ...postLines,
            ...articleLines
        ].join("\n");

        const evidence = [];

        if (name) {
            evidence.push({
                type: "linkedin-name",
                sourceUrl: profileUrl,
                value: cleanText(name, 180)
            });
        }

        if (headline) {
            evidence.push({
                type: "linkedin-headline",
                sourceUrl: profileUrl,
                value: cleanText(headline, 260)
            });
        }

        if (currentCompany) {
            evidence.push({
                type: "linkedin-company",
                sourceUrl: profileUrl,
                value: cleanText(currentCompany, 220)
            });
        }

        for (const post of posts.slice(0, 10)) {
            const postText =
                typeof post === "string"
                    ? post
                    : post?.text ||
                      post?.content ||
                      post?.description ||
                      post?.title ||
                      "";

            const postUrl =
                normalizeUrl(
                    typeof post === "object"
                        ? post?.url || post?.sourceUrl || ""
                        : ""
                );

            if (postText) {
                evidence.push({
                    type: "linkedin-post",
                    sourceUrl: postUrl || profileUrl,
                    value: cleanText(postText, 700)
                });
            }
        }

        const source = {
            sourceUrl: profileUrl,
            canonicalUrl: profileUrl,
            sourcePlatform: "linkedin",
            platform: "linkedin",
            sourceHost: "www.linkedin.com",
            status: 200,
            fetchStatus: "success",
            title:
                name ||
                headline ||
                "LinkedIn Profile",
            description:
                cleanText(
                    headline || summary,
                    600
                ) || null,
            visibleText:
                cleanText(
                    visibleText,
                    MAX_GEMINI_SOURCE_CHARS
                ) || null,
            contentSnippet:
                cleanText(
                    visibleText,
                    MAX_TEXT_PER_SOURCE
                ) || null,
            contentLength: visibleText.length,
            socialLinks: [profileUrl],
            socialProfiles: [profileUrl],
            links: [profileUrl],
            posts: posts.slice(0, 10),
            articles: articles.slice(0, 10),
            linkedinProfile: {
                profileUrl,
                name: name || null,
                headline: headline || null,
                about: summary ? cleanText(summary, MAX_LINKEDIN_ABOUT_CHARS) : null,
                location: location || null,
                currentCompany: currentCompany || null,
                followersCount: followerValue !== null && followerValue !== undefined
                    ? followerValue
                    : null
            },
            contentCandidates: [],
            publicEvidence: evidence.slice(0, 50),
            evidence: evidence.slice(0, MAX_GEMINI_EVIDENCE_SNIPPETS)
        };

        SOURCE_CACHE.set(
            profileUrl,
            source
        );

        console.log(
            "APIFY_LINKEDIN_RESULT",
            JSON.stringify({
                sourceUrl: profileUrl,
                name,
                headline,
                posts: posts.length,
                articles: articles.length,
                visibleText: visibleText.length
            }, null, 2)
        );

        return {
            success: true,
            source: compactSource(
                source,
                profileUrl
            )
        };

    } catch (error) {

        console.error(
            "APIFY_LINKEDIN_FETCH_FAILED",
            error?.message
        );

        return {
            success: false,
            reason:
                error?.message ||
                "Apify LinkedIn fetch failed.",
            source: null
        };
    }
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

        if (
            detectPlatform(normalizedUrl) === "linkedin" &&
            ENABLE_LINKEDIN_APIFY
        ) {
            return await fetchLinkedInFromApify(normalizedUrl);
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
console.log(
  "SOURCE_AUDIT",
  JSON.stringify({
      url,
      visibleText:
          source?.visibleText?.length || 0,
      contentSnippet:
          source?.contentSnippet?.length || 0,
      posts:
          source?.posts?.length || 0,
      publicEvidence:
          source?.publicEvidence?.length || 0
  }, null, 2)
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

    // PRIMARY FETCH ROUTING
    // LinkedIn-first mode: when the requested URL is already a LinkedIn
    // profile, use the dedicated SocialMediaContentFetcher as the FIRST
    // and ONLY LinkedIn fetch path. This prevents the old sequence:
    // collectSource() -> Apify -> failure -> SocialMediaContentFetcher()
    // -> collectSource() -> Apify again.
    const primaryIsLinkedIn =
        detectPlatform(primaryRequestedUrl) === "linkedin";

    let mainCollected = null;
    let socialMediaContentFetcher = {
        socialSources: [],
        fetchedSources: [],
        compressedEvidence: [],
        attemptedCount: 0,
        fetchedCount: 0
    };

    if (primaryIsLinkedIn) {
        console.log(
            "PRIMARY_PROVIDER",
            "SocialMediaContentFetcher"
        );

        socialMediaContentFetcher =
            await SocialMediaContentFetcher({
                mainSource: {},
                requestedLinks: [primaryRequestedUrl, ...requestedLinks]
            });

        const primaryLinkedInUrl = normalizeUrl(primaryRequestedUrl);
        const fetchedLinkedInSource =
            (socialMediaContentFetcher?.fetchedSources || [])
                .find(source =>
                    samePublicUrl(
                        source?.sourceUrl || "",
                        primaryLinkedInUrl
                    )
                ) ||
            socialMediaContentFetcher?.fetchedSources?.[0] ||
            null;

        if (fetchedLinkedInSource) {
            mainCollected = {
                success: true,
                source: fetchedLinkedInSource
            };
        } else {
            mainCollected = {
                success: false,
                reason:
                    "LinkedIn primary provider returned no usable source.",
                source: null
            };
        }
    } else {
        console.log(
            "PRIMARY_PROVIDER",
            "collectSource"
        );

        // Non-LinkedIn primary URLs keep the existing PCF path.
        mainCollected = await collectSource(primaryRequestedUrl);
    }

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

    // For a non-LinkedIn primary source, discover/fetch LinkedIn after the
    // primary source is available. For a LinkedIn primary source, this was
    // already done above and MUST NOT run a second time.
    if (!primaryIsLinkedIn) {
        socialMediaContentFetcher = await SocialMediaContentFetcher({
            mainSource: mainCollected.source,
            requestedLinks: [primaryRequestedUrl, ...requestedLinks]
        });
    }

    // Social URLs have already had exactly one fetch attempt above.
    // Never launch a second paid Apify run for the same URL in PASS 2.
    // HARD SINGLE-ATTEMPT GUARD: every discovered social URL is allowed to
    // enter the social provider exactly once per CEB invocation. PASS 2 only
    // consumes the already-fetched source or records the prior failure.
    const handledSocialUrls = new Set(
        (socialMediaContentFetcher?.socialSources || [])
            .map(normalizeUrl)
            .filter(Boolean)
    );
    /* ============================================================
       TEMPORARILY DISABLED: BRAND / BROWSER SEARCH
       Browser-search results are not part of the current evidence universe.
       ============================================================

const brandEvidence =
 await BrandEvidenceFetcher({

    mainSource: mainCollected.source,

    socialSources:
      socialMediaContentFetcher?.fetchedSources || []

 });
    ============================================================ */
    selection.socialSources = uniqueStrings(
        [
            ...(selection.socialSources || []),
            ...(socialMediaContentFetcher?.socialSources || [])
        ].filter(Boolean),
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

    console.log(
        "PRIMARY_FETCH_MODE",
        primaryIsLinkedIn ? "linkedin-first" : "standard"
    );
console.log(
  "SELECTION_DEBUG",
  JSON.stringify({
    mainUrl: selection.mainUrl,
    contentSources: selection.contentSources,
    socialSources: selection.socialSources
  }, null, 2)
);
   console.log(
  "SOCIAL_FETCH_DISCOVERED_URLS",
  JSON.stringify(
    socialMediaContentFetcher?.socialSources || [],
    null,
    2
  )
);
    const sourceMap = new Map();
    sourceMap.set(
        normalizeUrl(mainCollected.source.sourceUrl || primaryRequestedUrl),
        mainCollected.source
    );
    /* BRAND_EVIDENCE source-map insertion disabled with browser search. */
    for (const socialSource of socialMediaContentFetcher?.fetchedSources || []) {
        const socialUrl = normalizeUrl(
            socialSource?.sourceUrl || ""
        );

        if (!socialUrl) continue;

        sourceMap.set(
            socialUrl,
            compactSource(
                socialSource,
                socialUrl
            )
        );
    }

    // PASS 2: fetch ONLY the remaining selected targets.
    for (const url of selectedUniqueUrls.slice(1)) {

    const normalizedUrl = normalizeUrl(url);

    // Social fetcher already attempted this source directly.
    if (sourceMap.has(normalizedUrl)) {
        result.sourcesProcessed++;
        const socialSource = sourceMap.get(normalizedUrl);
        if (socialSource?.fetchStatus === "success") {
            result.sourcesSucceeded++;
        } else {
            result.sourcesFailed++;
        }
        continue;
    }

    if (handledSocialUrls.has(normalizedUrl)) {
        // The social fetcher already attempted this URL and failed.
        // Record the failure without triggering a second paid Apify run.
        result.sourcesProcessed++;
        result.sourcesFailed++;
        result.errors.push({
            url,
            reason: "Social source fetch failed on its single allowed attempt."
        });
        continue;
    }

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
        investigationMode: "website-linkedin-investigation",
        sourceLinks: selectedTraceableLinks,
        discoveredProfiles,
        platforms: cross.platforms,
        confidence,
        sources,
        findings: cross.findings,
        repeatedTopics: cross.repeatedTopics,
        evidenceLedger,
        ...buildInvestigationEvidenceMetadata({
            selection,
            sources
        }),
        investigationSources: {
            mainProfile: selection.mainUrl,
            contentSources: selection.contentSources?.map(item => item.url) || [],
            socialSources: selection.socialSources || [],
            selectedCount: selectedUniqueUrls.length,
            activeSocialPlatform: "linkedin",
            disabledSocialPlatforms: [
                "facebook",
                "instagram",
                "youtube",
                "x",
                "reddit"
            ]
        }
    });

    const geminiInput = buildGeminiEvidencePackage(
        sources,
        {
            ...selection,
            selectedUrls: selectedUniqueUrls
        }
    );

    console.log(
        "GEMINI_SOURCE_PACKAGE_AUDIT",
        JSON.stringify(
            (geminiInput.sources || []).map(source => ({
                url: source.sourceUrl,
                role: source.sourceRole,
                visibleText: source.visibleText?.length || 0,
                posts: source.posts?.length || 0,
                articles: source.articles?.length || 0,
                contentSamples: source.contentSamples?.length || 0,
                publicEvidence: source.publicEvidence?.length || 0,
                evidence: source.evidence?.length || 0
            })),
            null,
            2
        )
    );

    // Pass the social fetch status alongside the fetched source evidence.
    geminiInput.socialMediaContentFetcher = {
        socialSources:
            socialMediaContentFetcher?.socialSources || [],
        fetchedCount:
            socialMediaContentFetcher?.fetchedCount || 0,
        attemptedCount:
            socialMediaContentFetcher?.attemptedCount || 0
    };
console.log(
    "SOCIAL_FETCH_DEBUG",
    JSON.stringify(
        (socialMediaContentFetcher?.fetchedSources || []).map(source => ({
            platform: source?.sourcePlatform || "unknown",
            url: source?.sourceUrl || null,
            status: source?.status ?? 0,
            fetchStatus: source?.fetchStatus || null,
            contentLength: source?.contentLength || 0,
            evidenceCount: Array.isArray(source?.evidence)
                ? source.evidence.length
                : 0
        })),
        null,
        2
    )
);
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
  JSON.stringify({
    investigationMode: geminiInput.investigationMode,
    sourceCount: geminiInput.sourceCount,
    selectedSourceUrls: geminiInput.selectedSourceUrls || [],
    contentSourceCount: geminiInput.contentSources?.length || 0,
    socialSourceCount: geminiInput.socialSources?.length || 0,
    sourcePayloadChars: JSON.stringify(geminiInput.sources || []).length,
    contentSampleCounts: (geminiInput.sources || []).map(source => ({
      url: source.sourceUrl,
      role: source.sourceRole,
      samples: source.contentSamples?.length || 0,
      posts: source.posts?.length || 0,
      articles: source.articles?.length || 0,
      visibleText: source.visibleText?.length || 0
    }))
  }, null, 2)
);

console.log(
  "GEMINI_OUTPUT_DEBUG",
  JSON.stringify({
    status: geminiIntelligence?.status || "ok",
    keys: Object.keys(geminiIntelligence || {}),
    sourceContentCount: Array.isArray(geminiIntelligence?.sourceContent)
      ? geminiIntelligence.sourceContent.length
      : 0,
    evidenceCount: Array.isArray(geminiIntelligence?.evidence)
      ? geminiIntelligence.evidence.length
      : 0,
    discoveredProfiles: Array.isArray(geminiIntelligence?.discoveredProfiles)
      ? geminiIntelligence.discoveredProfiles.length
      : 0
  }, null, 2)
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
        socialSourcesDiscovered:
            socialMediaContentFetcher?.socialSources || [],
        socialFetchedCount:
            socialMediaContentFetcher?.fetchedCount || 0
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
