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
   - No Gemini or other LLM calls.
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

const MAX_INVESTIGATION_SOURCES = 12;
const MAX_INVESTIGATION_CONTENT_LINKS = 10;
const MAX_INVESTIGATION_SOCIAL_LINKS = 1;

// Active public evidence routes.
// Keep future platform support in this file, but do not execute it yet.
const ENABLE_LINKEDIN_APIFY = true;
const ENABLE_X = false;
const ENABLE_REDDIT = false;
const ENABLE_OTHER_SOCIAL = false;

// Apify actor selected and already verified manually in Apify Console.
const APIFY_ACTOR_ID = "crawlerbros~linkedin-profile-scraper";
const APIFY_TIMEOUT_SECONDS = 120;
const MAX_LINKEDIN_POSTS = 10;
const MAX_LINKEDIN_ARTICLES = 5;
const MAX_LINKEDIN_TEXT_CHARS = 3500;
const SOURCE_CACHE = new Map();
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
    .slice(0, MAX_INVESTIGATION_SOCIAL_LINKS);

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
        .slice(0, MAX_INVESTIGATION_CONTENT_LINKS);

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
        MAX_INVESTIGATION_SOCIAL_LINKS
    )
        .filter(url => url !== mainUrl)
        // Current Loop 7 target: LinkedIn only.
        .filter(url => detectPlatform(url) === "linkedin")
        .slice(0, MAX_INVESTIGATION_SOCIAL_LINKS);

    const selectedUrls = uniqueStrings(
        [
            mainUrl,
            ...contentSources.map(item => item.url),
            ...socialSources
        ],
        MAX_INVESTIGATION_SOURCES
    );

    return {
        mainUrl,
        contentSources,
        socialSources,
        selectedUrls
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
                    MAX_LINKEDIN_TEXT_CHARS
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
            linkedinProfile: {
                name: name || null,
                headline: headline || null,
                location: location || null,
                profileUrl: profileUrl || null,
                about: summary || null,
                followers: followerValue ?? null
            },
            posts: posts.slice(0, MAX_LINKEDIN_POSTS),
            articles: articles.slice(0, MAX_LINKEDIN_ARTICLES),
            contentCandidates: [],
            publicEvidence: evidence.slice(0, 50),
            evidence: evidence.slice(0, MAX_EVIDENCE_PER_SOURCE)
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
        MAX_INVESTIGATION_SOCIAL_LINKS
    );

    // Guarantee the main source remains the first investigation source.
    const selectedUrls = [
        selection.mainUrl,
        ...(selection.contentSources || []).map(item => normalizeUrl(item?.url || "")),
        ...(selection.socialSources || []).map(normalizeUrl)
    ].filter(Boolean);

    const selectedUniqueUrls = uniqueStrings(
        selectedUrls,
        MAX_INVESTIGATION_SOURCES
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
        MAX_INVESTIGATION_SOCIAL_LINKS
    );

    const selectedTraceableLinks = uniqueStrings(
        selectedUniqueUrls,
        MAX_INVESTIGATION_SOURCES
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

    const linkedinSource = sources.find(source =>
        detectPlatform(source?.sourceUrl || "") === "linkedin"
    ) || null;

    const linkedinInvestigation = linkedinSource
        ? {
            profile: linkedinSource?.linkedinProfile || {
                name: linkedinSource?.title || null,
                headline: linkedinSource?.description || null,
                location: null,
                profileUrl: linkedinSource?.sourceUrl || null,
                about: null,
                followers: null
            },
            about: linkedinSource?.linkedinProfile?.about || null,
            followers: linkedinSource?.linkedinProfile?.followers ?? null,
            posts: Array.isArray(linkedinSource?.posts)
                ? linkedinSource.posts.slice(0, MAX_LINKEDIN_POSTS)
                : [],
            articles: Array.isArray(linkedinSource?.articles)
                ? linkedinSource.articles.slice(0, MAX_LINKEDIN_ARTICLES)
                : []
        }
        : {
            profile: null,
            about: null,
            followers: null,
            posts: [],
            articles: []
        };

    universalPackage.linkedinInvestigation = linkedinInvestigation;

    const websiteSourceCount = (sources || []).filter(source =>
        detectPlatform(source?.sourceUrl || "") === "website"
    ).length;

    universalPackage.evidenceCoverage = {
        websitePagesInvestigated: Math.min(websiteSourceCount, 10),
        linkedinProfilesInvestigated: linkedinSource ? 1 : 0,
        linkedinArticlesInvestigated: linkedinInvestigation.articles.length,
        linkedinPostsInvestigated: linkedinInvestigation.posts.length,
        totalSourcesReviewed:
            Math.min(websiteSourceCount, 10) +
            (linkedinSource ? 1 : 0) +
            linkedinInvestigation.articles.length +
            linkedinInvestigation.posts.length
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
        intelligenceStatus: "disabled",
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
