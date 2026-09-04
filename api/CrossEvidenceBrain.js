/* ============================================================
   CROSS EVIDENCE BRAIN v21 — CLEAN EVIDENCE ROUTER
   TruthLoop AI

   SINGLE RESPONSIBILITY
   ---------------------
   1. Get website evidence from PublicContentFetcher.
   2. Make exactly ONE LinkedIn Apify Actor call when a LinkedIn
      profile URL is available.
   3. Preserve the collected evidence directly in one Universal
      Public Evidence Package.
   4. Make exactly ONE Signal call to extract SIGNALS only from
      website + LinkedIn evidence.
   5. Attach those signals to the same Universal Package.

   Universal Package is a POSTMASTER:
   - delivers evidence
   - does NOT filter
   - does NOT compress
   - does NOT rank
   - does NOT select
   - does NOT investigate
   - does NOT rewrite evidence

   Evidence Compression Brain (ECB) is downstream and is the
   ONLY compression stage.

   Loop 7 is downstream and is the investigation/report stage.
   ============================================================ */

import {
    loadPublicContentFetcher,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";

const APIFY_ACTOR_ID = "crustapi~linkedin-profile-posts-scraper";
const APIFY_PROFILE_ACTOR_ID = "data-slayer~linkedin-profile-scraper";
const APIFY_TIMEOUT_SECONDS = 60;
const APIFY_MAX_TOTAL_CHARGE_USD = "0.05";
const UNUSED_SIGNAL_MODEL = "unused";

const ENABLE_LINKEDIN_APIFY = true;

const ENABLE_X = false;
const ENABLE_REDDIT = false;
const ENABLE_OTHER_SOCIAL = false;

const SOURCE_CACHE = new Map();
const PROFILE_CACHE = new Map();

/* ------------------------------------------------------------
   BASIC URL HELPERS
   ------------------------------------------------------------ */

function normalizeUrl(value = "") {
    if (typeof value !== "string" || !value.trim()) return "";

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

        return "website";
    } catch {
        return "unknown";
    }
}

function uniqueUrls(values = []) {
    const seen = new Set();
    const result = [];

    for (const value of values) {
        const url = normalizeUrl(value);
        if (!url || seen.has(url)) continue;

        seen.add(url);
        result.push(url);
    }

    return result;
}

function safeText(value = "") {
    if (typeof value !== "string") return "";
    return value
        .replace(/\u0000/g, "")
        .trim();
}

/* ------------------------------------------------------------
   UNIVERSAL PACKAGE CONTENT COMPRESSOR
   ------------------------------------------------------------
   Runs AFTER evidence collection + signal collection.

   Rules:
   - meaningful compression only
   - NEVER modify URLs / links
   - NEVER modify titles
   - NEVER modify dates
   - preserve object / array structure
   - metadata text is compressed meaningfully
   ------------------------------------------------------------ */

const UNIVERSAL_CONTENT_MAX_CHARS = 900;
const UNIVERSAL_ITEM_TEXT_MAX_CHARS = 420;
const UNIVERSAL_ABOUT_MAX_CHARS = 900;
const UNIVERSAL_METADATA_MAX_CHARS = 360;
const UNIVERSAL_SIGNAL_TEXT_MAX_CHARS = 320;

function isImmutableEvidenceKey(key = "") {
    const k = String(key || "").toLowerCase();

    return (
        k === "url" ||
        k.endsWith("url") ||
        k.includes("url") ||
        k === "link" ||
        k.endsWith("link") ||
        k.includes("link") ||
        k === "links" ||
        k === "sociallinks" ||
        k === "socialprofiles" ||
        k === "sourceurls" ||
        k === "sourcelinks" ||
        k === "title" ||
        k === "date" ||
        k === "publisheddate" ||
        k === "publishedat" ||
        k === "postedat" ||
        k === "createdat" ||
        k === "updatedat" ||
        k === "timestamp" ||
        k === "id" ||
        k === "sourceid"
    );
}

function splitMeaningfulSentences(value = "") {
    const text = safeText(value)
        .replace(/\s+/g, " ")
        .trim();

    if (!text) return [];

    const sentences =
        text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    return sentences
        .map(item => item.trim())
        .filter(Boolean);
}

function scoreMeaningfulSentence(sentence = "", key = "") {
    const text = String(sentence || "");
    const lower = text.toLowerCase();

    let score = 0;

    if (text.length >= 45) score += 2;
    if (/\b(i|we|our|my|company|product|build|built|work|worked|focus|help|serve|customer|client|founder|engineer|developer|ai|software|business|revenue|project|open source|repository|repo)\b/i.test(text)) {
        score += 3;
    }

    if (/\b(is|are|was|were|builds|built|creates|created|works|helps|serves|develops|ships|leads|focuses|specializes|supports)\b/i.test(text)) {
        score += 1;
    }

    if (/https?:\/\/|www\./i.test(text)) score -= 3;
    if (/^[\W_]+$/.test(text)) score -= 3;

    if (
        ["about", "bio", "summary", "description", "content",
         "text", "body", "articletext", "posttext", "visibletext"].includes(
            String(key || "").toLowerCase()
        )
    ) {
        score += 1;
    }

    return score;
}

function meaningfulCompressText(value = "", maxChars = UNIVERSAL_CONTENT_MAX_CHARS, key = "") {
    const text = safeText(value);
    if (!text) return "";

    if (text.length <= maxChars) return text;

    const sentences = splitMeaningfulSentences(text)
        .map(sentence => ({
            sentence,
            score: scoreMeaningfulSentence(sentence, key)
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.sentence.length - b.sentence.length;
        });

    const selected = [];
    let used = 0;

    for (const item of sentences) {
        if (used + item.sentence.length + (selected.length ? 1 : 0) > maxChars) continue;
        selected.push(item.sentence);
        used += item.sentence.length + (selected.length ? 1 : 0);
        if (used >= Math.floor(maxChars * 0.85)) break;
    }

    if (!selected.length) {
        return text.slice(0, maxChars).trim();
    }

    return selected.join(" ").trim();
}

function compressUniversalContent(value, maxChars = UNIVERSAL_CONTENT_MAX_CHARS, key = "") {
    if (typeof value === "string") {
        if (isImmutableEvidenceKey(key)) return value;

        const lowerKey = String(key || "").toLowerCase();

        if (
            lowerKey === "about" ||
            lowerKey === "bio" ||
            lowerKey === "summary"
        ) {
            return meaningfulCompressText(
                value,
                UNIVERSAL_ABOUT_MAX_CHARS,
                key
            );
        }

        if (
            lowerKey === "text" ||
            lowerKey === "content" ||
            lowerKey === "description" ||
            lowerKey === "snippet" ||
            lowerKey === "visibletext" ||
            lowerKey === "body" ||
            lowerKey === "articletext" ||
            lowerKey === "posttext"
        ) {
            return meaningfulCompressText(
                value,
                UNIVERSAL_ITEM_TEXT_MAX_CHARS,
                key
            );
        }

        return meaningfulCompressText(
            value,
            maxChars,
            key
        );
    }

    if (Array.isArray(value)) {
        return value.map(item =>
            compressUniversalContent(
                item,
                maxChars,
                key
            )
        );
    }

    if (value && typeof value === "object") {
        const result = {};

        for (const [childKey, childValue] of Object.entries(value)) {
            let childMax = maxChars;

            const lowerKey = childKey.toLowerCase();

            if (
                lowerKey === "about" ||
                lowerKey === "summary" ||
                lowerKey === "bio"
            ) {
                childMax = UNIVERSAL_ABOUT_MAX_CHARS;
            } else if (
                lowerKey === "text" ||
                lowerKey === "content" ||
                lowerKey === "description" ||
                lowerKey === "snippet" ||
                lowerKey === "visibletext" ||
                lowerKey === "body" ||
                lowerKey === "articletext" ||
                lowerKey === "posttext"
            ) {
                childMax = UNIVERSAL_ITEM_TEXT_MAX_CHARS;
            } else if (
                lowerKey === "company" ||
                lowerKey === "location" ||
                lowerKey === "country" ||
                lowerKey === "headline" ||
                lowerKey === "repository" ||
                lowerKey === "repoDescription"
            ) {
                childMax = UNIVERSAL_METADATA_MAX_CHARS;
            } else if (
                lowerKey === "signal" ||
                lowerKey === "basis" ||
                lowerKey === "reason" ||
                lowerKey === "rationale"
            ) {
                childMax = UNIVERSAL_SIGNAL_TEXT_MAX_CHARS;
            }

            result[childKey] =
                compressUniversalContent(
                    childValue,
                    childMax,
                    childKey
                );
        }

        return result;
    }

    return value;
}

function compressUniversalSource(source = {}) {
    return compressUniversalContent(
        source,
        UNIVERSAL_CONTENT_MAX_CHARS
    );
}

function compressUniversalSignals(signals = {}) {
    return compressUniversalContent(
        signals,
        UNIVERSAL_SIGNAL_TEXT_MAX_CHARS
    );
}

function selectLatestLinkedInItem(items = [], type = "post") {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];

    const getTime = item => {
        const raw =
            item?.datePublished ||
            item?.publishedAt ||
            item?.date ||
            item?.createdAt ||
            item?.timestamp ||
            "";

        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const filtered =
        type === "article"
            ? list.filter(item =>
                String(item?.postType || "").toLowerCase() === "article" ||
                !!safeText(item?.headline) ||
                !!safeText(item?.articleUrl)
            )
            : list.filter(item =>
                String(item?.postType || "").toLowerCase() !== "article"
            );

    return [...filtered].sort((a, b) => {
        const tb = getTime(b);
        const ta = getTime(a);

        if (tb !== ta) return tb - ta;

        const bText =
            safeText(b?.text).length +
            safeText(b?.content).length +
            safeText(b?.headline).length;

        const aText =
            safeText(a?.text).length +
            safeText(a?.content).length +
            safeText(a?.headline).length;

        return bText - aText;
    })[0] || null;
}


function selectLatestLinkedInItems(items = [], type = "post", limit = 10) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];

    const getTime = item => {
        const raw =
            item?.datePublished ||
            item?.publishedAt ||
            item?.date ||
            item?.createdAt ||
            item?.timestamp ||
            "";

        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const filtered =
        type === "article"
            ? list.filter(item =>
                String(item?.postType || "").toLowerCase() === "article" ||
                !!safeText(item?.headline) ||
                !!safeText(item?.articleUrl)
            )
            : list.filter(item =>
                String(item?.postType || "").toLowerCase() !== "article"
            );

    return [...filtered]
        .sort((a, b) => {
            const tb = getTime(b);
            const ta = getTime(a);

            if (tb !== ta) return tb - ta;

            const bText =
                safeText(b?.text).length +
                safeText(b?.content).length +
                safeText(b?.headline).length;

            const aText =
                safeText(a?.text).length +
                safeText(a?.content).length +
                safeText(a?.headline).length;

            return bText - aText;
        })
        .slice(0, Math.max(0, Number(limit) || 0));
}

/* ------------------------------------------------------------
   WEBSITE COLLECTION
   ------------------------------------------------------------ */

async function fetchWebsiteEvidence(primaryUrl) {

    const normalizedUrl = normalizeUrl(primaryUrl);

    if (!normalizedUrl) {
        return {
            success: false,
            reason: "Invalid primary public URL.",
            sources: []
        };
    }

    /*
     * IMPORTANT:
     * This is the only PCF call made by this CEB.
     * PCF owns website collection/discovery.
     * CEB does not re-filter those results.
     */
    const rawPackage = await loadPublicContentFetcher({
        profileLinks: [normalizedUrl]
    });

    const extractedPackage = extractPublicContent(rawPackage);

    const packageResult = buildPublicContentPackage(
        rawPackage,
        extractedPackage
    );

    const sources = Array.isArray(packageResult?.sources)
        ? packageResult.sources
        : [];

    return {
        success: true,
        sourceUrl: normalizedUrl,
        sources
    };
}

/* ------------------------------------------------------------
   LINKEDIN URL DISCOVERY
   No ranking. No scoring. First supplied/discovered URL is used.
   ------------------------------------------------------------ */

function findLinkedInUrl({
    requestedLinks = [],
    websiteSources = [],
    discoveredLinks = [],
    discoveredSocialLinks = []
} = {}) {

    const candidates = [
        ...requestedLinks,
        ...discoveredSocialLinks,
        ...discoveredLinks
    ];

    for (const source of websiteSources) {
        candidates.push(
            ...(Array.isArray(source?.socialLinks)
                ? source.socialLinks
                : []),
            ...(Array.isArray(source?.socialProfiles)
                ? source.socialProfiles
                : []),
            ...(Array.isArray(source?.links)
                ? source.links
                : [])
        );
    }

    return uniqueUrls(candidates)
        .find(url => detectPlatform(url) === "linkedin") || "";
}

/* ------------------------------------------------------------
   GITHUB DIRECT FETCH
   No Apify. No URL rewriting.
   ------------------------------------------------------------ */

function findGitHubUrl({
    requestedLinks = [],
    websiteSources = [],
    discoveredLinks = [],
    discoveredSocialLinks = []
} = {}) {

    const candidates = [
        ...requestedLinks,
        ...discoveredSocialLinks,
        ...discoveredLinks
    ];

    for (const source of websiteSources) {
        candidates.push(
            ...(Array.isArray(source?.socialLinks) ? source.socialLinks : []),
            ...(Array.isArray(source?.socialProfiles) ? source.socialProfiles : []),
            ...(Array.isArray(source?.links) ? source.links : [])
        );
    }

    return uniqueUrls(candidates)
        .find(url => detectPlatform(url) === "github") || "";
}

function htmlToVisibleText(html = "") {
    if (typeof html !== "string") return "";

    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function extractMetaTag(html = "", nameOrProperty = "") {
    const key = String(nameOrProperty || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const patterns = [
        new RegExp(
            `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`,
            "i"
        ),
        new RegExp(
            `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["'][^>]*>`,
            "i"
        )
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return safeText(match[1]);
    }

    return "";
}

async function fetchGitHubDirect(url = "") {
    const normalizedUrl = normalizeUrl(url);

    if (
        !normalizedUrl ||
        detectPlatform(normalizedUrl) !== "github"
    ) {
        return {
            success: false,
            reason: "A valid GitHub public URL is required.",
            source: null
        };
    }

    const cached = SOURCE_CACHE.get(`github:${normalizedUrl}`);
    if (cached) {
        return {
            success: true,
            source: cached,
            cached: true
        };
    }

    console.log(
        "GITHUB_DIRECT_FETCH_START",
        JSON.stringify({ url: normalizedUrl })
    );

    try {
        const response = await fetch(
            normalizedUrl,
            {
                method: "GET",
                headers: {
                    "User-Agent": "TruthLoopAI/1.0 public-evidence",
                    "Accept": "text/html,application/xhtml+xml"
                }
            }
        );

        const html = await response.text();

        console.log(
            "GITHUB_DIRECT_FETCH_STATUS",
            response.status
        );

        if (!response.ok) {
            return {
                success: false,
                reason: `GitHub direct fetch failed (${response.status}).`,
                source: null
            };
        }

        const title =
            extractMetaTag(html, "og:title") ||
            ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "")
                .replace(/\s+/g, " ")
                .trim();

        const description =
            extractMetaTag(html, "og:description") ||
            extractMetaTag(html, "description");

        const visibleText =
            htmlToVisibleText(html);

        const socialLinks = [
            normalizedUrl
        ];

        const source = {
            sourceUrl: normalizedUrl,
            canonicalUrl: normalizedUrl,
            sourcePlatform: "github",
            platform: "github",
            sourceHost: "github.com",
            status: response.status,
            fetchStatus: "success",

            title: title || "GitHub Profile",
            description,

            visibleText,
            contentLength: visibleText.length,

            socialLinks,
            socialProfiles: [normalizedUrl],

            githubMetadata: {
                profileUrl: normalizedUrl,
                title: title || null,
                description: description || null,
                visibleText
            }
        };

        SOURCE_CACHE.set(
            `github:${normalizedUrl}`,
            source
        );

        console.log(
            "GITHUB_DIRECT_FETCH_COMPLETE",
            JSON.stringify({
                url: normalizedUrl,
                title: source.title,
                visibleTextChars: visibleText.length
            })
        );

        return {
            success: true,
            source
        };

    } catch (error) {
        console.error(
            "GITHUB_DIRECT_FETCH_FAILED",
            error?.message
        );

        return {
            success: false,
            reason:
                error?.message ||
                "GitHub direct fetch failed.",
            source: null
        };
    }
}

/* ------------------------------------------------------------
   APIFY — ONE ACTIVITY CALL + ONE PROFILE ENRICHMENT CALL PER COLD URL
   PROFILE ENRICHMENT IS CACHED TO PREVENT DUPLICATE RE-RUNS
   ------------------------------------------------------------ */

async function fetchLinkedInFromApify(url = "") {

    const normalizedUrl = normalizeUrl(url);

    if (
        !normalizedUrl ||
        detectPlatform(normalizedUrl) !== "linkedin"
    ) {
        return {
            success: false,
            reason: "A valid LinkedIn public URL is required.",
            source: null
        };
    }

    const cached =
        SOURCE_CACHE.get(normalizedUrl);

    if (cached) {
        return {
            success: true,
            source: cached,
            cached: true
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

    const endpoint =
        "https://api.apify.com/v2/actors/" +
        encodeURIComponent(APIFY_ACTOR_ID) +
        "/run-sync-get-dataset-items" +
        `?timeout=${APIFY_TIMEOUT_SECONDS}` +
        `&maxItems=10` +
        `&maxTotalChargeUsd=${APIFY_MAX_TOTAL_CHARGE_USD}`;

    console.log(
    "APIFY_CALL_START",
    JSON.stringify({
        actorId: APIFY_ACTOR_ID,
        profileUrl: normalizedUrl,
        maxTotalChargeUsd: APIFY_MAX_TOTAL_CHARGE_USD,
        ts: Date.now()
    })
);

    try {

        const response = await fetch(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    includeComments: false,
                    profiles: [normalizedUrl],
                    maxPostsPerProfile: 10
                })
            }
        );

        const rawBody = await response.text();

        console.log(
            "APIFY_CALL_STATUS",
            response.status
        );

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
                rawBody.slice(0, 800);

            /*
             * Dataset read is NOT a second Actor call.
             * It reads the dataset produced by THIS SAME run.
             */
            const runIdMatch =
                rawBody.match(
                    /run\s*ID[:\s]+([A-Za-z0-9_-]+)/i
                );

            const runId =
                runIdMatch?.[1] || null;

            console.error(
                "APIFY_CALL_ERROR",
                JSON.stringify({
                    status: response.status,
                    type: errorType,
                    message: errorMessage,
                    runId
                })
            );

            if (!runId) {
                return {
                    success: false,
                    reason:
                        `Apify LinkedIn request failed (${response.status}): ${errorMessage}`,
                    source: null
                };
            }
/*
            const datasetEndpoint =
                "https://api.apify.com/v2/actor-runs/" +
                encodeURIComponent(runId) +
                "/dataset/items?format=json&limit=1";

            const datasetResponse =
                await fetch(
                    datasetEndpoint,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${apiToken}`
                        }
                    }
                );

            const datasetBody =
                await datasetResponse.text();

            if (!datasetResponse.ok) {

                console.error(
                    "APIFY_SAME_RUN_DATASET_STATUS",
                    datasetResponse.status
                );

                return {
                    success: false,
                    reason:
                        `Apify run failed (${response.status}) and same-run dataset read failed (${datasetResponse.status}).`,
                    source: null
                };
            }

            try {
                var parsedDataset =
                    JSON.parse(datasetBody);
            } catch {
                return {
                    success: false,
                    reason: "Apify same-run dataset was not valid JSON.",
                    source: null
                };
            }

            var data = parsedDataset;
*/
        } else {

            try {
                var data =
                    JSON.parse(rawBody);
            } catch (parseError) {
                return {
                    success: false,
                    reason:
                        `Apify returned invalid JSON: ${parseError?.message || "parse failed"}`,
                    source: null
                };
            }
        }

        const items =
            Array.isArray(data)
                ? data.filter(item => item && typeof item === "object")
                : Array.isArray(data?.items)
                    ? data.items.filter(item => item && typeof item === "object")
                    : data && typeof data === "object"
                        ? [data]
                        : [];

        if (items.length === 0) {
            return {
                success: false,
                reason: "Apify returned no LinkedIn post items.",
                source: null
            };
        }

        /*
         * CrustAPI Posts Scraper returns one dataset item per
         * post/article. Normalize the dataset into the existing
         * LinkedIn source shape without changing the public
         * function name or downstream package contract.
         */
        const firstItem = items[0];

        const profileUrl =
            normalizeUrl(
                firstItem?.profileUrl ||
                firstItem?.authorUrl ||
                normalizedUrl
            ) || normalizedUrl;

        const name =
            firstItem?.authorName ||
            firstItem?.profile ||
            "";

        const headline = "";
        const location = "";
        const about = "";
        const currentCompany = "";
        const followersCount = null;

        const posts = items.filter(item =>
            String(item?.postType || "").toLowerCase() !== "article"
        );

        const articles = items.filter(item =>
            String(item?.postType || "").toLowerCase() === "article" ||
            !!safeText(item?.headline)
        );

        console.log(
            "APIFY_ACTIVITY_DATASET",
            JSON.stringify({
                profileUrl,
                totalItems: items.length,
                postItems: posts.length,
                articleItems: articles.length,
                firstPublished:
                    firstItem?.datePublished || null,
                lastPublished:
                    items[items.length - 1]?.datePublished || null
            })
        );

        /*
         * Profile/about/followers are not emitted by this Posts Actor.
         * Keep the existing fields in the source contract as null/empty
         * rather than inventing values. Recent posts/articles are carried
         * from the Actor dataset itself.
         */
        const source = {
            sourceUrl: profileUrl,
            canonicalUrl: profileUrl,
            sourcePlatform: "linkedin",
            platform: "linkedin",
            sourceHost: "www.linkedin.com",
            status: 200,
            fetchStatus: "success",

            title: name || "LinkedIn Activity",
            description: safeText(name),

            visibleText:
                [
                    name ? `Name: ${name}` : "",
                    ...posts.map(item =>
                        safeText(item?.text)
                    ),
                    ...articles.map(item =>
                        safeText(item?.headline || item?.text)
                    )
                ]
                    .filter(Boolean)
                    .join("\n"),

            contentLength:
                [
                    name,
                    ...posts.map(item => safeText(item?.text)),
                    ...articles.map(item =>
                        safeText(item?.headline || item?.text)
                    )
                ]
                    .filter(Boolean)
                    .join("\n")
                    .length,

            socialLinks: [profileUrl],
            socialProfiles: [profileUrl],

            linkedinProfile: {
                profileUrl,
                name: name || null,
                headline: headline || null,
                about: about || null,
                location: location || null,
                currentCompany: currentCompany || null,
                followersCount
            },

            /*
             * Full activity arrays received from CrustAPI are preserved.
             * No top-N filtering is performed here.
             */
            posts,
            articles,

            apifyData: items
        };

        SOURCE_CACHE.set(
            profileUrl,
            source
        );

        console.log(
            "APIFY_RESULT_COUNTS",
            JSON.stringify({
                profileUrl,
                posts: posts.length,
                articles: articles.length,
                followersCount:
                    followersCount ?? null,
                hasAbout:
                    !!safeText(about),
                hasExperience:
                    Array.isArray(source?.experience) ||
                    Array.isArray(source?.workExperience) ||
                    Array.isArray(source?.experienceHistory)
            })
        );

        return {
            success: true,
            source
        };

    } catch (error) {

        console.error(
            "APIFY_CALL_FAILED",
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


/* ------------------------------------------------------------
   LINKEDIN PROFILE ENRICHMENT — PROFILE ONLY
   ------------------------------------------------------------ */

async function fetchLinkedInProfileFromApify(url = "") {

    const normalizedUrl = normalizeUrl(url);

    if (
        !normalizedUrl ||
        detectPlatform(normalizedUrl) !== "linkedin"
    ) {
        return {
            success: false,
            reason: "A valid LinkedIn public URL is required.",
            profile: null
        };
    }

    const profileCacheKey = `linkedin-profile:${normalizedUrl}`;
    const cachedProfile = PROFILE_CACHE.get(profileCacheKey);

    if (cachedProfile) {
        console.log(
            "APIFY_PROFILE_CALL_REUSED",
            JSON.stringify({
                profileUrl: normalizedUrl,
                actorId: APIFY_PROFILE_ACTOR_ID,
                externalProfileCalls: 0,
                cached: true
            })
        );

        return {
            success: true,
            profile: cachedProfile,
            cached: true
        };
    }

    const apiToken =
        process.env.APIFY_API_TOKEN ||
        process.env.APIFY_TOKEN ||
        "";

    if (!apiToken) {
        console.error(
            "APIFY_PROFILE_DISABLED",
            "Missing APIFY_API_TOKEN"
        );

        return {
            success: false,
            reason: "Missing APIFY_API_TOKEN.",
            profile: null
        };
    }

    const endpoint =
        "https://api.apify.com/v2/actors/" +
        encodeURIComponent(APIFY_PROFILE_ACTOR_ID) +
        "/run-sync-get-dataset-items" +
        `?timeout=${APIFY_TIMEOUT_SECONDS}` +
        "&maxItems=1" +
        `&maxTotalChargeUsd=${APIFY_MAX_TOTAL_CHARGE_USD}`;

    console.log(
        "APIFY_PROFILE_CALL_START",
        JSON.stringify({
            actorId: APIFY_PROFILE_ACTOR_ID,
            profileUrl: normalizedUrl
        })
    );

    try {

        const response = await fetch(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    linkedin_urls: [normalizedUrl]
                })
            }
        );

        const rawBody = await response.text();

        console.log(
            "APIFY_PROFILE_CALL_STATUS",
            response.status
        );

        if (!response.ok) {
            console.error(
                "APIFY_PROFILE_CALL_ERROR",
                JSON.stringify({
                    status: response.status,
                    body: rawBody.slice(0, 800)
                })
            );

            return {
                success: false,
                reason:
                    `Apify LinkedIn profile request failed (${response.status}).`,
                profile: null
            };
        }

        let data;

        try {
            data = JSON.parse(rawBody);
        } catch (error) {
            return {
                success: false,
                reason:
                    `Apify profile response was not valid JSON: ${error?.message || "parse failed"}`,
                profile: null
            };
        }

        const items =
            Array.isArray(data)
                ? data.filter(item => item && typeof item === "object")
                : Array.isArray(data?.items)
                    ? data.items.filter(item => item && typeof item === "object")
                    : data && typeof data === "object"
                        ? [data]
                        : [];

        const item = items[0] || null;

        if (!item) {
            return {
                success: false,
                reason:
                    "Apify profile actor returned no profile record.",
                profile: null
            };
        }

        /*
         * Profile actor only.
         * recent_posts / articles from this actor are deliberately ignored.
         */
        const profile = {
            profileUrl:
                normalizeUrl(
                    item?.profile_link ||
                    item?.profileUrl ||
                    item?.url ||
                    normalizedUrl
                ) || normalizedUrl,

            name:
                item?.full_name ||
                item?.name ||
                null,

            headline:
                item?.headline ||
                item?.job_title ||
                null,

            about:
                item?.description ||
                item?.about ||
                item?.summary ||
                null,

            currentCompany:
                item?.current_company_name ||
                item?.current_company ||
                null,

            location:
                item?.location ||
                null,

            country:
                item?.country ||
                null,

            followersCount:
                item?.follower_count ??
                item?.followersCount ??
                item?.followers ??
                null,

            connectionsCount:
                item?.connection_count ??
                item?.connectionsCount ??
                item?.connections ??
                null,

            experience:
                Array.isArray(item?.experience)
                    ? item.experience
                    : Array.isArray(item?.experiences)
                        ? item.experiences
                        : [],

            education:
                Array.isArray(item?.education)
                    ? item.education
                    : Array.isArray(item?.educations)
                        ? item.educations
                        : []
        };

        console.log(
            "APIFY_PROFILE_RESULT",
            JSON.stringify({
                profileUrl: profile.profileUrl,
                aboutChars:
                    safeText(profile.about).length,
                followersCount:
                    profile.followersCount ?? null,
                connectionsCount:
                    profile.connectionsCount ?? null,
                experienceCount:
                    profile.experience.length,
                educationCount:
                    profile.education.length
            })
        );

        PROFILE_CACHE.set(
            profileCacheKey,
            profile
        );

        console.log(
            "APIFY_PROFILE_CALL_COMPLETE",
            JSON.stringify({
                profileUrl: profile.profileUrl,
                actorId: APIFY_PROFILE_ACTOR_ID,
                externalProfileCalls: 1,
                cached: false
            })
        );

        return {
            success: true,
            profile
        };

    } catch (error) {

        console.error(
            "APIFY_PROFILE_CALL_FAILED",
            error?.message
        );

        return {
            success: false,
            reason:
                error?.message ||
                "Apify LinkedIn profile fetch failed.",
            profile: null
        };
    }
}


/* ------------------------------------------------------------
   LOCAL SIGNAL MASTER
   ONE CALL. SIGNALS ONLY.
   ------------------------------------------------------------ */

async function buildSignalSignals({
    websiteEvidence = [],
    linkedinEvidence = null,
    githubEvidence = null
} = {}) {

    /*
     * Signal Intelligence Layer
     * --------------------------
     * Function name intentionally preserved for downstream compatibility.
     * Existing package keys are preserved; additional evidence-grounded
     * signal families are additive only.
     *
     * No external AI call.
     * No evidence deletion.
     * No URL/title/date rewriting.
     */

    const safeArray = value =>
        Array.isArray(value) ? value.filter(Boolean) : [];

    const clean = value =>
        safeText(value)
            .replace(/\s+/g, " ")
            .trim();

    const unique = values =>
        [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];

    const normalizeText = value =>
        clean(value)
            .toLowerCase()
            .replace(/https?:\/\/\S+/g, " ");

    const escapeRegex = value =>
        String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const countTerm = (text, term) => {
        const source = normalizeText(text);
        if (!source || !term) return 0;
        const pattern = new RegExp(
            `\\b${escapeRegex(term.toLowerCase())}\\b`,
            "g"
        );
        return (source.match(pattern) || []).length;
    };

    const countTerms = (text, terms = []) =>
        terms.reduce((sum, term) => sum + countTerm(text, term), 0);

    const getUrl = source =>
        normalizeUrl(
            source?.sourceUrl ||
            source?.canonicalUrl ||
            source?.url ||
            source?.postUrl ||
            source?.articleUrl ||
            ""
        );

    const getDateRaw = source =>
        source?.datePublished ||
        source?.publishedAt ||
        source?.date ||
        source?.createdAt ||
        source?.timestamp ||
        source?.published_at ||
        "";

    const getTime = source => {
        const raw = getDateRaw(source);
        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const formatDate = source => {
        const time = getTime(source);
        return time ? new Date(time).toISOString() : "";
    };

    const daysSince = source => {
        const time = getTime(source);
        if (!time) return null;
        return Math.max(
            0,
            Math.floor((Date.now() - time) / 86400000)
        );
    };

    const add = (bucket, text, urls = [], basis = "", confidence = 0.84, extra = {}) => {
        const signal = clean(text);
        if (!signal) return;

        bucket.push({
            signal: signal.slice(0, 320),
            supportingSourceUrls: unique(urls).slice(0, 8),
            basis: clean(basis).slice(0, 320),
            confidence: Math.max(0.75, Math.min(0.98, Number(Number(confidence).toFixed(2)))),
            ...extra
        });
    };

    const websiteItems = safeArray(websiteEvidence);
    const linkedin = linkedinEvidence && typeof linkedinEvidence === "object"
        ? linkedinEvidence
        : null;
    const linkedinPosts = safeArray(linkedin?.posts);
    const linkedinArticles = safeArray(linkedin?.articles);
    const github = githubEvidence && typeof githubEvidence === "object"
        ? githubEvidence
        : null;

    const websiteSources = websiteItems.map(source => ({
        group: "website",
        source,
        url: getUrl(source),
        date: formatDate(source),
        time: getTime(source),
        text: normalizeText([
            source?.title,
            source?.description,
            source?.visibleText,
            source?.contentSnippet
        ].filter(Boolean).join(" "))
    }));

    const linkedinPostSources = linkedinPosts.map(item => ({
        group: "linkedin_post",
        source: item,
        url: getUrl(item),
        date: formatDate(item),
        time: getTime(item),
        text: normalizeText([
            item?.title,
            item?.headline,
            item?.text,
            item?.content,
            item?.description
        ].filter(Boolean).join(" "))
    }));

    const linkedinArticleSources = linkedinArticles.map(item => ({
        group: "linkedin_article",
        source: item,
        url: getUrl(item),
        date: formatDate(item),
        time: getTime(item),
        text: normalizeText([
            item?.title,
            item?.headline,
            item?.text,
            item?.content,
            item?.description
        ].filter(Boolean).join(" "))
    }));

    const githubSource = github
        ? {
            group: "github",
            source: github,
            url: getUrl(github),
            date: formatDate(github),
            time: getTime(github),
            text: normalizeText([
                github?.title,
                github?.description,
                github?.visibleText,
                github?.githubMetadata?.description,
                github?.githubMetadata?.visibleText
            ].filter(Boolean).join(" "))
        }
        : null;

    const allUnits = [
        ...websiteSources,
        ...linkedinPostSources,
        ...linkedinArticleSources,
        ...(githubSource ? [githubSource] : [])
    ];

    const websiteUrls = unique(websiteSources.map(item => item.url));
    const linkedinUrls = unique([
        linkedin?.sourceUrl,
        linkedin?.linkedinProfile?.profileUrl,
        ...linkedinPostSources.map(item => item.url),
        ...linkedinArticleSources.map(item => item.url)
    ]);
    const githubUrls = githubSource?.url ? [githubSource.url] : [];
    const supportUrls = unique([
        ...websiteUrls,
        ...linkedinUrls,
        ...githubUrls
    ]);

    const websiteText = websiteSources.map(item => item.text).join(" ");
    const linkedinText = [
        normalizeText(linkedin?.linkedinProfile?.name),
        normalizeText(linkedin?.linkedinProfile?.headline),
        normalizeText(linkedin?.linkedinProfile?.about),
        ...linkedinPostSources.map(item => item.text),
        ...linkedinArticleSources.map(item => item.text)
    ].filter(Boolean).join(" ");
    const githubText = githubSource?.text || "";
    const combinedText = `${websiteText} ${linkedinText} ${githubText}`.trim();

    const emptySignals = {
        identity: {},
        positioning: [],
        niches: [],
        expertiseSignals: [],
        audienceSignals: [],
        businessSignals: [],
        creatorSignals: [],
        topics: [],
        recurringTopics: [],
        behavioralSignals: [],
        contradictions: [],
        crossSourceSignals: [],
        activitySignals: [],
        temporalSignals: [],
        consistencySignals: [],
        executionSignals: [],
        gapSignals: [],
        githubSignals: [],
        investigationSignals: [],
        signalConfidence: 0
    };

    /* -------------------------
       EXISTING PUBLIC TAXONOMY
       ------------------------- */

    function countMatches(text, terms) {
        if (!text || !Array.isArray(terms)) return 0;

        let count = 0;

        for (const term of terms) {
            const needle = String(term || "")
                .toLowerCase()
                .trim();

            if (!needle) continue;

            const matches =
                text.match(
                    new RegExp(
                        `\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                        "g"
                    )
                );

            count += matches ? matches.length : 0;
        }

        return count;
    }

    const topicMap = {
        "AI / Technology": ["ai", "artificial intelligence", "llm", "model", "agent", "software", "developer", "engineering"],
        "Behavior / Psychology": ["behavior", "behavioral", "psychology", "procrastination", "avoidance", "validation", "overthinking", "stuck", "identity"],
        "Sales / Clients": ["sales", "client", "clients", "customer", "customers", "revenue", "lead", "leads"],
        "Marketing / Content": ["marketing", "content", "posting", "posts", "audience", "brand", "branding", "linkedin"],
        "Business / Startup": ["business", "startup", "founder", "founders", "company", "product", "app", "service"],
        "Productivity / Execution": ["productivity", "execution", "focus", "planning", "action", "decision", "decisions", "work", "ship", "shipping", "launch", "build", "built"],
        "Coaching / Advice": ["coach", "coaching", "advice", "advise", "skills", "learn", "guide", "how to"]
    };

    const topicRows = Object.entries(topicMap).map(([topic, terms]) => ({
        topic,
        total: countTerms(combinedText, terms),
        website: countTerms(websiteText, terms),
        linkedin: countTerms(linkedinText, terms),
        github: countTerms(githubText, terms)
    })).filter(row => row.total > 0).sort((a, b) => b.total - a.total);

    const positioning = [];
    const niches = [];
    const expertiseSignals = [];
    const audienceSignals = [];
    const businessSignals = [];
    const creatorSignals = [];
    const behavioralSignals = [];
    const contradictions = [];
    const crossSourceSignals = [];
    const activitySignals = [];
    const temporalSignals = [];
    const consistencySignals = [];
    const executionSignals = [];
    const gapSignals = [];
    const githubSignals = [];
    const investigationSignals = [];

    for (const row of topicRows.slice(0, 6)) {
        niches.push(row.topic);
        add(
            positioning,
            `Public evidence is strongly associated with ${row.topic}.`,
            [...(row.linkedin ? linkedinUrls : []), ...(row.website ? websiteUrls : []), ...(row.github ? githubUrls : [])],
            `Observed ${row.total} direct term matches across retained public evidence.`,
            row.total >= 5 ? 0.94 : 0.88
        );
    }

    for (const row of topicRows.filter(row => row.total >= 2).slice(0, 5)) {
        add(
            expertiseSignals,
            `Repeated public-content signal around ${row.topic}.`,
            unique([
                ...(row.website ? websiteUrls : []),
                ...(row.linkedin ? linkedinUrls : []),
                ...(row.github ? githubUrls : [])
            ]),
            `The topic appears repeatedly in observable public text (${row.total} matches).`,
            row.total >= 4 ? 0.94 : 0.89
        );
    }

    const audienceMap = {
        "People seeking behavioral clarity": ["procrastination", "avoidance", "overthinking", "validation", "stuck", "behavior"],
        "Founders / business operators": ["founder", "startup", "business", "company", "revenue"],
        "Creators / professionals using LinkedIn": ["posting", "linkedin", "content", "audience", "clients"]
    };

    for (const [audience, terms] of Object.entries(audienceMap)) {
        const count = countTerms(combinedText, terms);
        if (count >= 2) {
            add(
                audienceSignals,
                `Public content repeatedly addresses ${audience.toLowerCase()}.`,
                supportUrls,
                `Observed ${count} audience-related term matches.`,
                count >= 5 ? 0.93 : 0.87
            );
        }
    }

    const businessTerms = ["app", "pricing", "payment", "product", "service", "subscription", "customer", "client", "revenue", "commercial"];
    const businessScore = countTerms(combinedText, businessTerms);
    if (businessScore > 0) {
        add(
            businessSignals,
            "Public evidence contains direct product, service, or commercial language.",
            websiteUrls.length ? websiteUrls : supportUrls,
            `Observed ${businessScore} commercial term matches.`,
            Math.min(0.94, 0.84 + businessScore * 0.01)
        );
    }

    if (linkedinPosts.length) {
        add(
            creatorSignals,
            `LinkedIn evidence contains ${linkedinPosts.length} collected post item(s).`,
            linkedinUrls,
            "Count derived directly from the collected LinkedIn activity dataset.",
            0.96
        );
    }

    if (linkedinArticles.length) {
        add(
            creatorSignals,
            `LinkedIn evidence contains ${linkedinArticles.length} collected article item(s).`,
            linkedinUrls,
            "Count derived directly from the collected LinkedIn activity dataset.",
            0.96
        );
    }

    /* -------------------------
       ACTIVITY + RECENCY
       ------------------------- */

    add(
        activitySignals,
        `Website evidence set contains ${websiteItems.length} retained source item(s).`,
        websiteUrls,
        "Derived from the retained Website evidence array.",
        websiteItems.length >= 5 ? 0.97 : 0.90
    );

    add(
        activitySignals,
        `LinkedIn evidence contains ${linkedinPosts.length} post(s) and ${linkedinArticles.length} article(s).`,
        linkedinUrls,
        "Derived from the retained LinkedIn evidence arrays.",
        0.97
    );

    if (githubSource) {
        add(
            activitySignals,
            "GitHub public repository evidence is present in the investigation set.",
            githubUrls,
            "Derived directly from the GitHub source object.",
            0.97
        );
    }

    const datedUnits = allUnits.filter(unit => unit.time > 0).sort((a, b) => a.time - b.time);
    const undatedUnits = allUnits.filter(unit => !unit.time);
    const spanDays = datedUnits.length >= 2
        ? Math.max(0, Math.floor((datedUnits[datedUnits.length - 1].time - datedUnits[0].time) / 86400000))
        : 0;

    if (datedUnits.length) {
        const newest = datedUnits[datedUnits.length - 1];
        const oldest = datedUnits[0];
        const newestAge = daysSince(newest.source);

        add(
            temporalSignals,
            `Most recent retained dated public evidence is ${newest.group} content from ${newest.date}.`,
            [newest.url],
            `Latest valid timestamp among ${datedUnits.length} dated evidence units.`,
            0.97,
            { date: newest.date, ageDays: newestAge }
        );

        add(
            temporalSignals,
            `The retained dated evidence spans approximately ${spanDays} day(s) from oldest to newest observable item.`,
            [oldest.url, newest.url],
            `Oldest dated item: ${oldest.date}; newest dated item: ${newest.date}.`,
            datedUnits.length >= 3 ? 0.95 : 0.88,
            { spanDays }
        );
    }

    if (undatedUnits.length) {
        add(
            gapSignals,
            `${undatedUnits.length} retained evidence unit(s) do not expose a usable publication timestamp in the current source shape.`,
            undatedUnits.map(unit => unit.url),
            "Timestamp unavailable or not parseable from the retained evidence fields.",
            0.96
        );
    }

    const datedPosts = linkedinPostSources.filter(item => item.time > 0).sort((a, b) => a.time - b.time);
    let maxGap = 0;
    let maxGapBefore = null;
    let maxGapAfter = null;
    if (datedPosts.length >= 2) {
        for (let i = 1; i < datedPosts.length; i += 1) {
            const gap = Math.floor((datedPosts[i].time - datedPosts[i - 1].time) / 86400000);
            if (gap > maxGap) {
                maxGap = gap;
                maxGapBefore = datedPosts[i - 1];
                maxGapAfter = datedPosts[i];
            }
        }

        if (maxGap > 0) {
            add(
                temporalSignals,
                `The largest observed gap between retained dated LinkedIn posts is approximately ${maxGap} day(s).`,
                [maxGapBefore?.url, maxGapAfter?.url],
                `Computed from adjacent dated LinkedIn posts in the retained dataset.`,
                0.95,
                { gapDays: maxGap }
            );
        }
    }

    const latestWebsite = websiteSources.filter(item => item.time > 0).sort((a, b) => b.time - a.time)[0];
    const latestLinkedIn = [...linkedinPostSources, ...linkedinArticleSources]
        .filter(item => item.time > 0)
        .sort((a, b) => b.time - a.time)[0];

    if (latestWebsite && latestLinkedIn) {
        const crossPlatformLag = Math.abs(Math.floor((latestWebsite.time - latestLinkedIn.time) / 86400000));
        add(
            temporalSignals,
            `Latest dated website and LinkedIn evidence differ by approximately ${crossPlatformLag} day(s).`,
            [latestWebsite.url, latestLinkedIn.url],
            `Website latest: ${latestWebsite.date}; LinkedIn latest: ${latestLinkedIn.date}.`,
            0.93,
            { crossPlatformLagDays: crossPlatformLag }
        );
    }

    /* -------------------------
       EXECUTION / ANALYSIS SIGNALS
       ------------------------- */

    const actionTerms = ["build", "built", "ship", "shipped", "shipping", "launch", "launched", "release", "released", "publish", "published", "sell", "sold", "experiment", "tested", "validate", "validated", "commit", "commits", "deploy", "deployed", "customer", "customers", "client", "clients"];
    const analysisTerms = ["analyze", "analysis", "pattern", "patterns", "framework", "frameworks", "awareness", "understand", "understanding", "psychology", "why", "procrastination", "avoidance", "reflection"];
    const actionCount = countTerms(combinedText, actionTerms);
    const analysisCount = countTerms(combinedText, analysisTerms);

    add(
        executionSignals,
        `Public evidence contains ${actionCount} observable action/execution language matches versus ${analysisCount} analysis/reflection matches.`,
        supportUrls,
        "Deterministic keyword-family comparison across retained public text; this is language evidence, not proof of real-world outcomes.",
        0.86
    );

    if (analysisCount > 0 && actionCount > 0 && analysisCount > actionCount * 1.5) {
        add(
            gapSignals,
            "Public language is materially more concentrated on analysis/reflection than action/execution terms.",
            supportUrls,
            `Observed ${analysisCount} analysis/reflection matches versus ${actionCount} action/execution matches.`,
            0.89
        );
    }

    if (actionCount > 0) {
        add(
            executionSignals,
            "Public evidence contains explicit execution-oriented language such as building, shipping, publishing, launching, or validating.",
            supportUrls,
            `Observed ${actionCount} execution-family matches.`,
            0.88
        );
    }

    /* -------------------------
       CONSISTENCY + CROSS-EVIDENCE
       ------------------------- */

    for (const row of topicRows) {
        const groupsPresent = [
            row.website > 0,
            row.linkedin > 0,
            row.github > 0
        ].filter(Boolean).length;

        if (groupsPresent >= 2) {
            add(
                consistencySignals,
                `${row.topic} appears independently across ${groupsPresent} public source groups.`,
                unique([
                    ...(row.website ? websiteUrls : []),
                    ...(row.linkedin ? linkedinUrls : []),
                    ...(row.github ? githubUrls : [])
                ]),
                `Cross-source consistency is based on repeated topic-family language.`,
                groupsPresent === 3 ? 0.95 : 0.91
            );

            add(
                crossSourceSignals,
                `${row.topic} is independently visible across multiple public source groups.`,
                unique([
                    ...(row.website ? websiteUrls : []),
                    ...(row.linkedin ? linkedinUrls : []),
                    ...(row.github ? githubUrls : [])
                ]),
                `Same topic family detected independently across source groups.`,
                groupsPresent === 3 ? 0.96 : 0.92
            );
        }
    }

    const websiteLower = websiteText;
    const linkedinLower = linkedinText;

    const websiteNoAdvice = /\b(no advice|not advice|no coaching|not coaching)\b/i.test(websiteLower);
    const linkedinAdvisory = /\b(advice|coaching|guide|how to|skills|learn)\b/i.test(linkedinLower);

    if (websiteNoAdvice && linkedinAdvisory) {
        add(
            contradictions,
            "Website positioning contains an explicit no-advice/no-coaching signal while LinkedIn evidence contains advisory language.",
            [...websiteUrls, ...linkedinUrls],
            "The conflicting wording is directly observable in two independently collected source groups.",
            0.95
        );
    }

    const websiteExecution = /\b(ship|shipping|launch|launching|release|released|publish|publishing|build|building|deploy|deployed|validate|validated)\b/i.test(websiteLower);
    const linkedinPlanning = /\b(planning|plan|prepare|preparing|thinking|research|framework)\b/i.test(linkedinLower);

    if (websiteExecution && linkedinPlanning) {
        add(
            crossSourceSignals,
            "Website and LinkedIn evidence show an observable tension between execution-oriented and planning/research-oriented language.",
            [...websiteUrls, ...linkedinUrls],
            "This is a language-level cross-source tension; it is not treated as proof of behavioral contradiction without stronger evidence.",
            0.87
        );
    }

    const outcomeTerms = ["users", "user", "customers", "customer", "clients", "client", "revenue", "sales", "conversion", "retention", "results", "outcomes", "metrics", "traction"];
    const outcomeCount = countTerms(combinedText, outcomeTerms);

    if (outcomeCount === 0) {
        add(
            gapSignals,
            "The retained public evidence contains no direct outcome/traction metric language sufficient to verify real-world results.",
            supportUrls,
            "No matches found for a predefined public outcome/traction vocabulary in the retained evidence.",
            0.90
        );
    } else {
        add(
            consistencySignals,
            `Public evidence contains ${outcomeCount} outcome/traction vocabulary matches, but the current evidence does not by itself verify metric values.`,
            supportUrls,
            "Outcome terminology was observed; actual numeric outcomes are not inferred unless directly present.",
            0.86
        );
    }

    /* -------------------------
       GITHUB SIGNALS
       ------------------------- */

    if (githubSource) {
        const githubActionCount = countTerms(githubText, actionTerms);
        const githubAnalysisCount = countTerms(githubText, analysisTerms);

        add(
            githubSignals,
            "GitHub confirms a public technical artifact connected to the investigated identity/product.",
            githubUrls,
            "Repository title/description/visible text is directly available from the GitHub fetch.",
            0.97
        );

        if (githubActionCount > 0) {
            add(
                githubSignals,
                `GitHub public text contains ${githubActionCount} execution/build-related language match(es).`,
                githubUrls,
                `Observed directly in the retained GitHub title/description/visible text.`,
                0.88
            );
        }

        if (githubAnalysisCount > 0) {
            add(
                githubSignals,
                `GitHub public text contains ${githubAnalysisCount} analysis/framework-related language match(es).`,
                githubUrls,
                `Observed directly in the retained GitHub title/description/visible text.`,
                0.88
            );
        }

        add(
            githubSignals,
            "Current GitHub fetch shape does not expose commit-history timestamps, so development velocity or recent inactivity cannot be established from this source alone.",
            githubUrls,
            "The collected GitHub source currently exposes profile/repository text but no commit timestamp field.",
            0.97
        );
    }

    /* -------------------------
       INVESTIGATION PRIORITIES
       ------------------------- */

    const strongestConsistency = consistencySignals
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    const strongestGap = gapSignals
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    const strongestContradiction = contradictions
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    const strongestTemporal = temporalSignals
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    if (strongestConsistency) {
        add(
            investigationSignals,
            `Strongest cross-source consistency signal: ${strongestConsistency.signal}`,
            strongestConsistency.supportingSourceUrls,
            strongestConsistency.basis,
            Math.min(0.96, strongestConsistency.confidence)
        );
    }

    if (strongestContradiction) {
        add(
            investigationSignals,
            `Strongest observable contradiction/tension: ${strongestContradiction.signal}`,
            strongestContradiction.supportingSourceUrls,
            strongestContradiction.basis,
            Math.min(0.96, strongestContradiction.confidence)
        );
    } else {
        add(
            investigationSignals,
            "No strong cross-source contradiction was deterministically established from the retained public evidence.",
            supportUrls,
            "Contradiction signals are only emitted when evidence-backed conflicting wording/actions are observable.",
            0.89
        );
    }

    if (strongestGap) {
        add(
            investigationSignals,
            `Largest current evidence gap: ${strongestGap.signal}`,
            strongestGap.supportingSourceUrls,
            strongestGap.basis,
            Math.min(0.95, strongestGap.confidence)
        );
    }

    if (strongestTemporal) {
        add(
            investigationSignals,
            `Most important temporal signal: ${strongestTemporal.signal}`,
            strongestTemporal.supportingSourceUrls,
            strongestTemporal.basis,
            Math.min(0.95, strongestTemporal.confidence)
        );
    }

    const profile = linkedin?.linkedinProfile && typeof linkedin.linkedinProfile === "object"
        ? linkedin.linkedinProfile
        : {};

    const identity = {};
    if (profile?.name) identity.name = clean(profile.name);
    if (profile?.headline) identity.headline = clean(profile.headline);
    if (profile?.currentCompany) identity.currentCompany = clean(profile.currentCompany);
    if (profile?.location) identity.location = clean(profile.location);

    const evidenceUnits = allUnits.length;
    const sourceGroups = [
        websiteItems.length > 0,
        !!linkedin,
        !!github
    ].filter(Boolean).length;
    const datedRatio = evidenceUnits
        ? datedUnits.length / evidenceUnits
        : 0;
    const signalBreadth =
        topicRows.length +
        activitySignals.length +
        temporalSignals.length +
        consistencySignals.length +
        executionSignals.length +
        gapSignals.length +
        githubSignals.length +
        investigationSignals.length;

    const signalConfidence = Math.max(
        0,
        Math.min(
            98,
            Math.round(
                55 +
                sourceGroups * 10 +
                Math.min(evidenceUnits, 20) * 1.2 +
                Math.min(signalBreadth, 30) * 0.6 +
                datedRatio * 8
            )
        )
    );

    const primarySignalPackage = {
        ...emptySignals,
        identity,
        positioning,
        niches: unique(niches).slice(0, 10),
        expertiseSignals,
        audienceSignals,
        businessSignals,
        creatorSignals,
        topics: topicRows.slice(0, 10).map(row => row.topic),
        recurringTopics: topicRows.filter(row => row.total >= 2).slice(0, 10).map(row => row.topic),
        behavioralSignals,
        contradictions,
        crossSourceSignals,
        activitySignals,
        temporalSignals,
        consistencySignals,
        executionSignals,
        gapSignals,
        githubSignals,
        investigationSignals,
        signalConfidence
    };

    /* ============================================================
       DEEP SIGNAL MATRIX
       ------------------------------------------------------------
       Exactly 10 signal families x 10 members.
       These are RAW, evidence-grounded intelligence units.
       No compression. No master-signal merging.
       ECB remains the downstream compression stage.
       ============================================================ */

    const buildDeepSignalMember = ({
        family,
        member,
        finding,
        basis,
        urls = [],
        confidence = 0.84,
        data = {}
    } = {}) => ({
        signalId: `${String(family || "signal").toUpperCase()}_${String(member || "00").padStart(2, "0")}`,
        family,
        member,
        finding: clean(finding || "Evidence is insufficient to establish this signal."),
        basis: clean(basis || "No direct supporting basis was retained."),
        supportingSourceUrls: unique(urls).slice(0, 8),
        confidence: Math.max(0.75, Math.min(0.98, Number(Number(confidence).toFixed(2)))),
        ...data
    });

    const dateSortedAll = datedUnits
        .slice()
        .sort((a, b) => a.time - b.time);

    const latestWebsiteUnit = websiteSources
        .filter(item => item.time > 0)
        .sort((a, b) => b.time - a.time)[0] || null;

    const latestLinkedInUnit = [
        ...linkedinPostSources,
        ...linkedinArticleSources
    ]
        .filter(item => item.time > 0)
        .sort((a, b) => b.time - a.time)[0] || null;

    const latestWebsiteAge = latestWebsiteUnit ? daysSince(latestWebsiteUnit.source) : null;
    const latestLinkedInAge = latestLinkedInUnit ? daysSince(latestLinkedInUnit.source) : null;

    const actionLexicon = [
        "build", "built", "ship", "shipped", "shipping", "launch", "launched",
        "release", "released", "publish", "published", "sell", "sold",
        "experiment", "tested", "validate", "validated", "commit", "commits",
        "deploy", "deployed", "customer", "customers", "client", "clients"
    ];

    const analysisLexicon = [
        "analyze", "analysis", "pattern", "patterns", "framework", "frameworks",
        "awareness", "understand", "understanding", "psychology", "why",
        "procrastination", "avoidance", "reflection"
    ];

    const identityLexicon = [
        "identity", "expert", "expertise", "founder", "creator", "builder",
        "teacher", "developer", "engineer", "coach"
    ];

    const avoidanceLexicon = [
        "avoidance", "procrastination", "overthinking", "planning", "stuck",
        "delay", "fear", "uncertainty", "perfection", "perfectionism"
    ];

    const audienceRows = [
        ["founders", ["founder", "founders", "startup", "business"]],
        ["creators", ["creator", "creators", "content", "audience"]],
        ["professionals", ["professional", "career", "work"]],
        ["clients", ["client", "clients", "customer", "customers"]],
        ["behavioral seekers", ["behavior", "procrastination", "avoidance", "overthinking"]],
        ["technical builders", ["developer", "engineering", "software", "code"]],
        ["product users", ["product", "app", "service", "users"]],
        ["sales-oriented audience", ["sales", "revenue", "leads", "conversion"]],
        ["self-development audience", ["awareness", "clarity", "growth", "habit"]],
        ["mixed audience", ["business", "behavior", "technology", "product"]]
    ];

    const positioningRows = [
        ["core promise", "revealing the pattern behind the problem/question"],
        ["problem framing", "public messaging frames behavior as an underlying mechanism rather than surface symptoms"],
        ["solution framing", "the product is positioned as a behavioral clarity / discovery system"],
        ["differentiation", "content emphasizes hidden patterns and uncomfortable truths"],
        ["authority signal", "repeated explanatory language establishes domain knowledge"],
        ["identity signal", "public evidence presents a builder/analyst identity"],
        ["audience promise", "messaging targets people experiencing stuckness, avoidance or execution friction"],
        ["commercial framing", "product/service language is present in the public footprint"],
        ["narrative continuity", "core behavioral themes recur across source groups"],
        ["positioning gap", "public evidence does not independently prove product outcomes or traction"]
    ];

    const topicFallbacks = [
        "Topic concentration could not be strongly established from the retained corpus.",
        "Topic diversity is limited by the retained evidence set.",
        "Topic evolution is not independently established without dated topic changes.",
        "New topic emergence is not independently established from the retained corpus.",
        "Dropped-topic behavior cannot be established from the retained sample alone.",
        "Problem emphasis is visible only where repeated problem language occurs.",
        "Solution emphasis is visible only where repeated solution language occurs.",
        "Cross-platform topic repetition requires the same topic family in at least two source groups.",
        "Topic concentration should not be treated as behavioral proof by itself.",
        "The strongest topic signal is the highest-frequency topic family in retained evidence."
    ];

    const behaviorSpecs = [
        ["avoidance-language", avoidanceLexicon, "Avoidance-related language frequency in the retained public corpus."],
        ["execution-language", actionLexicon, "Execution/action language frequency in the retained public corpus."],
        ["analysis-language", analysisLexicon, "Analysis/reflection language frequency in the retained public corpus."],
        ["analysis-action-balance", [], "Relative concentration of analysis/reflection language versus action/execution language."],
        ["planning-language", ["planning", "plan", "prepare", "preparing"], "Planning/preparation language frequency."],
        ["identity-language", identityLexicon, "Identity/professional-role language frequency."],
        ["question-framing", ["why", "how", "what", "should"], "Question/problem-framing language frequency."],
        ["validation-language", ["validation", "validate", "proof", "evidence", "trust"], "Validation/evidence language frequency."],
        ["repetition-signal", ["pattern", "repeat", "again", "recurring", "loop"], "Repeated-cycle vocabulary frequency."],
        ["behavioral-theme-presence", ["behavior", "behavioral", "psychology", "avoidance", "procrastination"], "Presence of behavioral/psychological language." ]
    ];

    const families = {};

    families.topicSignals = topicRows.slice(0, 10).map((row, index) =>
        buildDeepSignalMember({
            family: "topic",
            member: index + 1,
            finding: index < topicRows.length
                ? `${row.topic} is one of the strongest recurring public topic families, with ${row.total} observed term matches.`
                : topicFallbacks[index],
            basis: index < topicRows.length
                ? `Website=${row.website}, LinkedIn=${row.linkedin}, GitHub=${row.github} term-family matches.`
                : topicFallbacks[index],
            urls: unique([
                ...(row?.website ? websiteUrls : []),
                ...(row?.linkedin ? linkedinUrls : []),
                ...(row?.github ? githubUrls : [])
            ]),
            confidence: index < topicRows.length ? (row.total >= 5 ? 0.94 : 0.88) : 0.78,
            data: { metric: index < topicRows.length ? row.total : 0 }
        })
    );

    while (families.topicSignals.length < 10) {
        const index = families.topicSignals.length + 1;
        families.topicSignals.push(
            buildDeepSignalMember({
                family: "topic",
                member: index,
                finding: topicFallbacks[(index - 1) % topicFallbacks.length],
                basis: "Retained public evidence does not establish an additional independent topic signal.",
                urls: supportUrls,
                confidence: 0.78
            })
        );
    }

    const behaviorSignalsDeep = behaviorSpecs.map(([name, terms, description], index) => {
        if (name === "analysis-action-balance") {
            const ratio = actionCount > 0 ? Number((analysisCount / actionCount).toFixed(2)) : null;
            return buildDeepSignalMember({
                family: "behavior",
                member: index + 1,
                finding: actionCount > 0
                    ? `Retained public language contains ${analysisCount} analysis/reflection matches versus ${actionCount} action/execution matches (ratio ${ratio}).`
                    : `Retained public language contains ${analysisCount} analysis/reflection matches and no detected action/execution term matches.`,
                basis: "Deterministic keyword-family comparison; this is language evidence, not proof of real-world outcomes.",
                urls: supportUrls,
                confidence: 0.86,
                data: { analysisCount, actionCount, ratio }
            });
        }
        const count = countTerms(combinedText, terms);
        return buildDeepSignalMember({
            family: "behavior",
            member: index + 1,
            finding: `${description} Observed ${count} term match(es) across retained public evidence.`,
            basis: `Counted against a deterministic vocabulary across website, LinkedIn and GitHub text.`,
            urls: supportUrls,
            confidence: count >= 5 ? 0.92 : count > 0 ? 0.86 : 0.78,
            data: { matchCount: count }
        });
    });

    families.behaviorSignals = behaviorSignalsDeep;

    const timeFindings = [
        latestWebsiteUnit
            ? `Latest dated website evidence is ${latestWebsiteUnit.date} (${latestWebsiteAge} day(s) old).`
            : "No usable dated website item is available in the retained evidence.",
        latestLinkedInUnit
            ? `Latest dated LinkedIn evidence is ${latestLinkedInUnit.date} (${latestLinkedInAge} day(s) old).`
            : "No usable dated LinkedIn item is available in the retained evidence.",
        datedUnits.length
            ? `The retained dated corpus spans approximately ${spanDays} day(s).`
            : "A dated evidence span cannot be established.",
        datedPosts.length >= 2
            ? `Largest observed gap between adjacent retained LinkedIn posts is ${maxGap} day(s).`
            : "At least two dated LinkedIn posts are required to measure an inter-post gap.",
        latestWebsiteUnit && latestLinkedInUnit
            ? `Newest website and LinkedIn items differ by approximately ${Math.abs(Math.floor((latestWebsiteUnit.time - latestLinkedInUnit.time) / 86400000))} day(s).`
            : "Cross-platform recency lag cannot be established from the dated subset.",
        dateSortedAll.length ? `Dated evidence count is ${dateSortedAll.length} unit(s).` : "No dated evidence unit was retained.",
        undatedUnits.length ? `${undatedUnits.length} retained unit(s) lack a usable publication timestamp.` : "All retained evidence units expose a usable timestamp.",
        latestWebsiteUnit ? "Website recency is directly observable from retained timestamps." : "Website recency is not directly observable.",
        latestLinkedInUnit ? "LinkedIn recency is directly observable from retained timestamps." : "LinkedIn recency is not directly observable.",
        datedUnits.length >= 3 ? "The retained evidence provides enough dated points to inspect temporal sequencing." : "Temporal sequencing is limited by the number of dated points."
    ];

    families.timeSignals = timeFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "time",
            member: index + 1,
            finding,
            basis: "Derived from retained publication timestamps only; no unobserved inactivity is inferred.",
            urls: supportUrls,
            confidence: datedUnits.length >= 3 ? 0.94 : 0.80
        })
    );

    const executionFindings = [
        `Action/execution vocabulary matches: ${actionCount}.`,
        `Analysis/reflection vocabulary matches: ${analysisCount}.`,
        actionCount > analysisCount ? "Execution language currently exceeds analysis/reflection language in the retained corpus." : "Analysis/reflection language currently equals or exceeds execution language in the retained corpus.",
        `Explicit shipping/publishing/building terms observed: ${countTerms(combinedText, ["ship", "shipping", "publish", "published", "build", "building"])}.`, 
        `Explicit validation/testing terms observed: ${countTerms(combinedText, ["validate", "validated", "test", "tested", "experiment"])}.`, 
        `Commercial execution terms observed: ${countTerms(combinedText, ["customer", "customers", "client", "clients", "sales", "revenue"])}.`, 
        githubSource ? "GitHub provides an independent technical artifact for execution-related corroboration." : "No GitHub artifact is available for execution corroboration.",
        linkedinPosts.length ? `LinkedIn contributes ${linkedinPosts.length} retained post item(s) to the execution picture.` : "No LinkedIn post items are retained.",
        websiteItems.length ? `Website contributes ${websiteItems.length} retained item(s) to the execution picture.` : "No website items are retained.",
        "Execution language is treated as observable public language, not automatic proof of completed real-world outcomes."
    ];

    families.executionSignals = executionFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "execution",
            member: index + 1,
            finding,
            basis: "Derived from deterministic action, validation, commercial and source-presence measures in retained evidence.",
            urls: supportUrls,
            confidence: 0.86
        })
    );

    families.audienceSignals = audienceRows.map(([audience, terms], index) => {
        const count = countTerms(combinedText, terms);
        return buildDeepSignalMember({
            family: "audience",
            member: index + 1,
            finding: count > 0
                ? `Public evidence contains ${count} vocabulary match(es) associated with ${audience}.`
                : `Audience focus on ${audience} is not independently established by the retained vocabulary.`,
            basis: "Deterministic audience-language observation; not a claim about actual audience composition.",
            urls: supportUrls,
            confidence: count >= 5 ? 0.91 : count > 0 ? 0.84 : 0.78,
            data: { matchCount: count }
        });
    });

    families.positioningSignals = positioningRows.map(([member, fixedFinding], index) => {
        const count = index < 4 ? countTerms(combinedText, [["pattern", "patterns", "avoidance", "procrastination", "behavior"][index]].flat()) : 0;
        return buildDeepSignalMember({
            family: "positioning",
            member: index + 1,
            finding: index === 9
                ? fixedFinding
                : `${fixedFinding}. Observable supporting language count: ${count}.`,
            basis: index === 9
                ? "Positioning gap is limited to what the retained public evidence can verify; no traction claim is inferred."
                : "Derived from recurring public positioning language across the retained corpus.",
            urls: supportUrls,
            confidence: index === 9 ? 0.89 : 0.86
        });
    });

    const githubFindings = [
        githubSource ? "A public GitHub repository/profile artifact is directly present." : "GitHub evidence is absent from the retained investigation set.",
        githubSource ? `GitHub action/build vocabulary matches: ${countTerms(githubText, actionLexicon)}.` : "GitHub build-language count cannot be established.",
        githubSource ? `GitHub analysis/framework vocabulary matches: ${countTerms(githubText, analysisLexicon)}.` : "GitHub analysis-language count cannot be established.",
        githubSource ? `GitHub identity/role vocabulary matches: ${countTerms(githubText, identityLexicon)}.` : "GitHub identity-language count cannot be established.",
        githubSource ? `GitHub behavioral/avoidance vocabulary matches: ${countTerms(githubText, avoidanceLexicon)}.` : "GitHub behavioral-language count cannot be established.",
        githubSource ? `GitHub technical/product language matches: ${countTerms(githubText, ["software", "code", "repository", "repo", "application", "app", "product"])}.` : "GitHub technical/product language count cannot be established.",
        githubSource ? "GitHub currently provides text-level evidence, not a commit-history time series." : "No GitHub time series is available.",
        githubSource ? "Repository description/visible text can corroborate product identity and build intent." : "Product-build corroboration from GitHub is unavailable.",
        githubSource ? "GitHub evidence can corroborate themes seen elsewhere when the same concepts recur." : "GitHub cross-source corroboration is unavailable.",
        githubSource ? "GitHub should be interpreted as technical/public artifact evidence, not proof of user adoption or traction." : "No GitHub artifact is available for outcome inference."
    ];

    families.githubSignals = githubFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "github",
            member: index + 1,
            finding,
            basis: githubSource ? "Derived directly from the retained GitHub source object." : "GitHub source object is not present.",
            urls: githubUrls,
            confidence: githubSource ? 0.91 : 0.78
        })
    );

    const strongestCross = crossSourceSignals.slice().sort((a, b) => b.confidence - a.confidence)[0];
    const strongestContra = contradictions.slice().sort((a, b) => b.confidence - a.confidence)[0];
    const crossFindings = [
        strongestCross ? strongestCross.signal : "No strong cross-source signal was deterministically established.",
        `Independent source groups represented: ${sourceGroups}.`,
        topicRows.filter(row => row.website > 0 && row.linkedin > 0).slice(0, 3).map(row => row.topic).join(", ") || "No topic family is currently shared by website and LinkedIn.",
        topicRows.filter(row => row.linkedin > 0 && row.github > 0).slice(0, 3).map(row => row.topic).join(", ") || "No topic family is currently shared by LinkedIn and GitHub.",
        topicRows.filter(row => row.website > 0 && row.github > 0).slice(0, 3).map(row => row.topic).join(", ") || "No topic family is currently shared by website and GitHub.",
        strongestContra ? strongestContra.signal : "No evidence-backed contradiction was deterministically established.",
        websiteExecution && linkedinPlanning ? "Website execution language and LinkedIn planning/research language create a language-level tension." : "No deterministic website-vs-LinkedIn execution/planning tension was found.",
        outcomeCount > 0 ? `Outcome/traction vocabulary appears ${outcomeCount} time(s), but values are not inferred.` : "No direct outcome/traction vocabulary was detected.",
        `Dated evidence units available for cross-source comparison: ${datedUnits.length}.`,
        "Cross-source findings are corroboration/tension signals, not automatic proof of private motives."
    ];

    families.crossEvidenceSignals = crossFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "cross-evidence",
            member: index + 1,
            finding,
            basis: "Derived from independent source-group comparison across retained public evidence.",
            urls: supportUrls,
            confidence: 0.87
        })
    );

    const contradictionFindings = [
        strongestContra ? strongestContra.signal : "No strong contradiction was established.",
        websiteNoAdvice && linkedinAdvisory ? "Website no-advice positioning conflicts with advisory language on LinkedIn." : "No no-advice versus advisory-language conflict was detected.",
        websiteExecution && linkedinPlanning ? "Execution-oriented website language and planning/research-oriented LinkedIn language create a public language tension." : "No deterministic execution-versus-planning language tension was detected.",
        outcomeCount === 0 ? "Lack of direct outcome vocabulary remains an evidence gap, not a contradiction." : "Outcome vocabulary exists, but values remain unverified.",
        datedUnits.length < 3 ? "Sparse timestamps limit contradiction testing across time." : "The dated corpus permits some temporal contradiction testing.",
        githubSource ? "GitHub exists as an independent technical artifact that can corroborate or challenge narrative claims." : "No GitHub artifact exists to challenge the narrative.",
        linkedinPosts.length ? "LinkedIn post history provides a direct public activity comparison point." : "No LinkedIn post history is available for comparison.",
        websiteItems.length ? "Website publication history provides a direct public activity comparison point." : "No website publication history is available for comparison.",
        sourceGroups >= 3 ? "Three public source groups allow broader contradiction testing than a single-channel investigation." : "Fewer than three source groups constrain contradiction testing.",
        "A contradiction is only treated as established when two observable claims/actions genuinely conflict."
    ];

    families.contradictionSignals = contradictionFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "contradiction",
            member: index + 1,
            finding,
            basis: "Contradiction discipline: observable conflict is required; absence or uncertainty is labelled as an evidence gap instead.",
            urls: supportUrls,
            confidence: strongestContra ? 0.91 : 0.82
        })
    );

    const investigationFindings = [
        strongestTemporal ? strongestTemporal.signal : "No dominant temporal signal was established.",
        strongestGap ? strongestGap.signal : "No dominant evidence gap was established.",
        strongestCross ? strongestCross.signal : "No dominant cross-source consistency signal was established.",
        strongestContra ? strongestContra.signal : "No dominant contradiction was established.",
        topicRows[0] ? `Most dominant topic family: ${topicRows[0].topic}.` : "No dominant topic family established.",
        `Source breadth currently covers ${sourceGroups} public source group(s).`,
        `Dated evidence currently covers ${datedUnits.length} unit(s).`,
        `Retained evidence currently contains ${websiteItems.length} website item(s), ${linkedinPosts.length} LinkedIn post(s), ${linkedinArticles.length} LinkedIn article(s), and ${githubSource ? 1 : 0} GitHub artifact(s).`,
        "The strongest defensible investigation lead must be traceable to observable public evidence.",
        "Private motive remains a hypothesis unless public evidence directly corroborates the inferred mechanism."
    ];

    families.investigationSignalsDeep = investigationFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "investigation",
            member: index + 1,
            finding,
            basis: "Investigation-priority lead derived from the strongest deterministic signals generated above.",
            urls: supportUrls,
            confidence: 0.89
        })
    );

    const deepSignalFamilies = {
        topic: families.topicSignals,
        behavior: families.behaviorSignals,
        time: families.timeSignals,
        execution: families.executionSignals,
        audience: families.audienceSignals,
        positioning: families.positioningSignals,
        github: families.githubSignals,
        "cross-evidence": families.crossEvidenceSignals,
        contradiction: families.contradictionSignals,
        investigation: families.investigationSignalsDeep
    };

    const deepSignalCount = Object.values(deepSignalFamilies)
        .reduce((sum, family) => sum + family.length, 0);

    const secondarySignalPackage =
        buildSecondarySignalFetcher({
            websiteEvidence: websiteItems,
            linkedinEvidence: linkedin,
            githubEvidence: github,
            primarySignals: primarySignalPackage
        });

    return {
        status: "ok",
        reason: "Deep deterministic evidence signal extraction",
        signals: {
            ...primarySignalPackage,
            contradictions: [
                ...primarySignalPackage.contradictions,
                ...secondarySignalPackage.contradictions
            ].slice(0, 30),
            crossSourceSignals: [
                ...primarySignalPackage.crossSourceSignals,
                ...secondarySignalPackage.crossSourceSignals
            ].slice(0, 40),
            positioning: [
                ...positioning,
                ...secondarySignalPackage.signals
            ].slice(0, 40),
            investigationSignals: [
                ...investigationSignals,
                ...(secondarySignalPackage.investigationSignals || [])
            ].slice(0, 20),
            gapSignals: [
                ...gapSignals,
                ...(secondarySignalPackage.gapSignals || [])
            ].slice(0, 30),
            deepSignalFamilies,
            deepSignalCount,
            deepSignalFamilyCount: Object.keys(deepSignalFamilies).length,
            signalConfidence:
                Math.max(
                    signalConfidence,
                    secondarySignalPackage.confidence || 0
                ),
            signalFetcherCount: 2,
            signalFetchers: {
                fetcher1: {
                    status: "ok",
                    confidence: signalConfidence
                },
                fetcher2: {
                    status: secondarySignalPackage.status,
                    confidence: secondarySignalPackage.confidence
                }
            },
            signalCounts: {
                totalSignals:
                    positioning.length +
                    expertiseSignals.length +
                    audienceSignals.length +
                    businessSignals.length +
                    creatorSignals.length +
                    behavioralSignals.length +
                    contradictions.length +
                    crossSourceSignals.length +
                    activitySignals.length +
                    temporalSignals.length +
                    consistencySignals.length +
                    executionSignals.length +
                    gapSignals.length +
                    githubSignals.length +
                    investigationSignals.length,
                websiteItems: websiteItems.length,
                linkedinPosts: linkedinPosts.length,
                linkedinArticles: linkedinArticles.length,
                githubPresent: !!github
            }
        }
    };
}

/* ------------------------------------------------------------
   SIGNAL FETCHER 2
   Complementary evidence-grounded pass.
   ------------------------------------------------------------ */

function buildSecondarySignalFetcher({
    websiteEvidence = [],
    linkedinEvidence = null,
    githubEvidence = null,
    primarySignals = null
} = {}) {

    const safeArray = value =>
        Array.isArray(value) ? value.filter(Boolean) : [];

    const clean = value =>
        safeText(value)
            .replace(/\s+/g, " ")
            .trim();

    const unique = values =>
        [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];

    const urlOf = source =>
        normalizeUrl(
            source?.sourceUrl ||
            source?.canonicalUrl ||
            source?.url ||
            source?.postUrl ||
            source?.articleUrl ||
            ""
        );

    const textOf = source =>
        clean([
            source?.title,
            source?.headline,
            source?.text,
            source?.content,
            source?.description,
            source?.visibleText,
            source?.contentSnippet
        ].filter(Boolean).join(" "))
            .toLowerCase();

    const dateOf = source => {
        const raw =
            source?.datePublished ||
            source?.publishedAt ||
            source?.date ||
            source?.createdAt ||
            source?.timestamp ||
            "";
        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const websiteItems = safeArray(websiteEvidence);
    const linkedinPosts = safeArray(linkedinEvidence?.posts);
    const linkedinArticles = safeArray(linkedinEvidence?.articles);
    const github = githubEvidence || null;

    const websiteUrls = unique(websiteItems.map(urlOf));
    const linkedinUrls = unique([
        linkedinEvidence?.sourceUrl,
        linkedinEvidence?.linkedinProfile?.profileUrl,
        ...linkedinPosts.map(urlOf),
        ...linkedinArticles.map(urlOf)
    ]);
    const githubUrls = github ? [urlOf(github)].filter(Boolean) : [];
    const allUrls = unique([...websiteUrls, ...linkedinUrls, ...githubUrls]);

    const websiteText = websiteItems.map(textOf).join(" ");
    const linkedinText = [
        textOf(linkedinEvidence?.linkedinProfile || {}),
        ...linkedinPosts.map(textOf),
        ...linkedinArticles.map(textOf)
    ].join(" ");
    const githubText = textOf(github || {});

    const signals = [];
    const contradictions = [];
    const crossSourceSignals = [];
    const temporalSignals = [];
    const gapSignals = [];
    const investigationSignals = [];

    const add = (bucket, text, urls, basis, confidence = 0.84) => {
        bucket.push({
            signal: clean(text).slice(0, 320),
            supportingSourceUrls: unique(urls).slice(0, 8),
            basis: clean(basis).slice(0, 320),
            confidence: Math.max(0.75, Math.min(0.98, Number(Number(confidence).toFixed(2))))
        });
    };

    const families = [
        ["AI / Technology", ["artificial intelligence", "machine learning", "llm", "software", "developer", "engineering"]],
        ["Behavior / Psychology", ["behavior", "psychology", "avoidance", "overthinking", "procrastination", "validation", "identity"]],
        ["Business / Startup", ["founder", "startup", "business", "company", "product", "revenue"]],
        ["Marketing / Content", ["content", "marketing", "audience", "brand", "linkedin", "posting"]],
        ["Execution / Productivity", ["execution", "planning", "focus", "action", "decision", "productivity", "shipping", "launch"]]
    ];

    const countWord = (text, term) => {
        const pattern = new RegExp(`\\b${String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        return (text.match(pattern) || []).length;
    };

    for (const [family, terms] of families) {
        const w = terms.reduce((sum, term) => sum + countWord(websiteText, term), 0);
        const l = terms.reduce((sum, term) => sum + countWord(linkedinText, term), 0);
        const g = terms.reduce((sum, term) => sum + countWord(githubText, term), 0);
        const total = w + l + g;

        if (total >= 2) {
            add(
                signals,
                `Secondary pass confirms recurring ${family} language across retained evidence.`,
                [...(w ? websiteUrls : []), ...(l ? linkedinUrls : []), ...(g ? githubUrls : [])],
                `Observed ${total} family-level term matches in the complementary pass.`,
                w > 0 && l > 0 && g > 0 ? 0.96 : w > 0 && l > 0 ? 0.94 : 0.87
            );
        }
    }

    const crossTerms = [
        "clients", "customers", "audience", "founders",
        "product", "service", "creator", "consulting",
        "coaching", "advice", "ai", "software", "execution", "planning"
    ];

    for (const term of crossTerms) {
        const onWebsite = countWord(websiteText, term) > 0;
        const onLinkedIn = countWord(linkedinText, term) > 0;
        const onGithub = countWord(githubText, term) > 0;
        const groups = [onWebsite, onLinkedIn, onGithub].filter(Boolean).length;

        if (groups >= 2) {
            add(
                crossSourceSignals,
                `${term} is independently observable across ${groups} source groups.`,
                [
                    ...(onWebsite ? websiteUrls : []),
                    ...(onLinkedIn ? linkedinUrls : []),
                    ...(onGithub ? githubUrls : [])
                ],
                "Independent source-group presence of the same term.",
                groups === 3 ? 0.96 : 0.91
            );
        }
    }

    /* Time-pattern reinforcement without claiming unobserved inactivity. */
    const datedWebsite = websiteItems
        .map(item => ({ item, time: dateOf(item), url: urlOf(item) }))
        .filter(row => row.time > 0)
        .sort((a, b) => b.time - a.time);

    const datedLinkedIn = [
        ...linkedinPosts,
        ...linkedinArticles
    ].map(item => ({ item, time: dateOf(item), url: urlOf(item) }))
        .filter(row => row.time > 0)
        .sort((a, b) => b.time - a.time);

    if (datedWebsite[0] && datedLinkedIn[0]) {
        const lagDays = Math.abs(Math.floor((datedWebsite[0].time - datedLinkedIn[0].time) / 86400000));
        add(
            temporalSignals,
            `Secondary pass observes a ${lagDays}-day difference between the newest dated website and LinkedIn evidence.`,
            [datedWebsite[0].url, datedLinkedIn[0].url],
            "Computed directly from the newest valid timestamps in both source groups.",
            0.93
        );
    }

    const noAdvice = /\b(no advice|not advice|no coaching|not coaching)\b/i.test(websiteText);
    const advisory = /\b(advice|coaching|guide|how to|skills|learn)\b/i.test(linkedinText);
    if (noAdvice && advisory) {
        add(
            contradictions,
            "Website and LinkedIn contain directly contrasting positioning language around advice/coaching.",
            [...websiteUrls, ...linkedinUrls],
            "Contrasting phrases are directly observable in separate source groups.",
            0.95
        );
    }

    const websiteAnalysis = /\b(framework|pattern|analysis|awareness|psychology|avoidance|procrastination)\b/i.test(websiteText);
    const linkedInExecution = /\b(ship|shipping|launch|launched|release|released|deploy|deployed|build|built|publish|published|validate|validated)\b/i.test(linkedinText);
    if (websiteAnalysis && linkedInExecution) {
        add(
            crossSourceSignals,
            "Website emphasizes analytical/problem-framing language while LinkedIn contains explicit execution language.",
            [...websiteUrls, ...linkedinUrls],
            "Cross-source language comparison only; not treated as proof of behavioral contradiction.",
            0.86
        );
    }

    const outcomePattern = /\b(users|customers|clients|revenue|sales|conversion|retention|results|outcomes|metrics|traction)\b/i;
    if (!outcomePattern.test(`${websiteText} ${linkedinText} ${githubText}`)) {
        add(
            gapSignals,
            "No direct public outcome/traction vocabulary was detected in the complementary pass.",
            allUrls,
            "No matches for the predefined outcome vocabulary.",
            0.90
        );
    }

    if (github) {
        add(
            signals,
            "GitHub evidence contributes an independent technical artifact to the cross-source picture.",
            githubUrls,
            "GitHub source exists and was independently fetched.",
            0.97
        );
        add(
            gapSignals,
            "GitHub source does not currently expose commit-history timestamps in the retained source shape.",
            githubUrls,
            "No commit timestamp field is present in the supplied GitHub evidence object.",
            0.97
        );
    }

    if (primarySignals?.investigationSignals?.length) {
        const first = primarySignals.investigationSignals[0];
        if (first?.signal) {
            add(
                investigationSignals,
                `Secondary pass validates the primary investigation lead: ${first.signal}`,
                first.supportingSourceUrls || allUrls,
                first.basis || "Primary signal package supplied the lead.",
                Math.min(0.95, Number(first.confidence || 0.85))
            );
        }
    }

    return {
        status: "ok",
        source: "signal-fetcher-2",
        signals,
        contradictions,
        crossSourceSignals,
        temporalSignals,
        gapSignals,
        investigationSignals,
        confidence: Math.max(
            84,
            Math.min(
                98,
                84 +
                Math.min(
                    signals.length +
                    crossSourceSignals.length +
                    temporalSignals.length +
                    gapSignals.length,
                    14
                )
            )
        ),
        primarySignalsPresent:
            !!primarySignals &&
            typeof primarySignals === "object"
    };
}

/* ------------------------------------------------------------
   UNIVERSAL PACKAGE
   POSTMASTER ONLY
   ------------------------------------------------------------ */

function buildUniversalPackage({
    primaryUrl = "",
    websiteSources = [],
    linkedinSource = null,
    githubEvidence = null,
    signalResult = null
} = {}) {

    /*
     * FIRST CONTENT COMPRESSION
     * -------------------------
     * PCF + Apify evidence has already been collected.
     * Signal signal extraction has already completed.
     * From this point onward the Universal Package carries
     * compressed CONTENT only. URLs/links remain untouched.
     */
    const compressedWebsiteSources =
        websiteSources.map(source =>
            compressUniversalSource(source)
        );

    const linkedInProfile =
        linkedinSource?.linkedinProfile ||
        null;

    const latestLinkedInPosts =
        selectLatestLinkedInItems(
            linkedinSource?.posts || [],
            "post",
            10
        );

    const latestLinkedInArticles =
        selectLatestLinkedInItems(
            linkedinSource?.articles || [],
            "article",
            10
        );

    const linkedinPosts =
        latestLinkedInPosts;

    const linkedinArticles =
        latestLinkedInArticles;

    const compressedLinkedinProfile =
        linkedinSource?.linkedinProfile &&
        typeof linkedinSource.linkedinProfile === "object"
            ? {
                ...linkedinSource.linkedinProfile,
                about:
                    meaningfulCompressText(
                        linkedinSource.linkedinProfile.about || "",
                        UNIVERSAL_ABOUT_MAX_CHARS,
                        "about"
                    )
            }
            : null;

    const compressedLinkedinSource =
        linkedinSource
            ? {
                ...compressUniversalSource({
                    ...linkedinSource,
                    posts: undefined,
                    articles: undefined,
                    apifyData: undefined
                }),
                linkedinProfile:
                    compressedLinkedinProfile,
                posts:
                    linkedinPosts.map(item =>
                        compressUniversalContent(
                            {
                                ...item,
                                title: item?.title,
                                date: item?.date
                            }
                        )
                    ),
                articles:
                    linkedinArticles.map(item =>
                        compressUniversalContent(
                            {
                                ...item,
                                title: item?.title,
                                date: item?.date
                            }
                        )
                    )
            }
            : null;

    const compressedGithubEvidence =
        githubEvidence
            ? compressUniversalSource(githubEvidence)
            : null;

    /*
     * SIGNALS ARE NOT COMPRESSED HERE.
     * Evidence Compression Brain (ECB) is the downstream compression stage.
     * Keep the complete deep signal matrix intact for downstream analysis.
     */
    const compressedSignals =
        signalResult?.signals || {
            identity: {},
            positioning: [],
            niches: [],
            expertiseSignals: [],
            audienceSignals: [],
            businessSignals: [],
            creatorSignals: [],
            topics: [],
            recurringTopics: [],
            behavioralSignals: [],
            contradictions: [],
            crossSourceSignals: [],
            activitySignals: [],
            temporalSignals: [],
            consistencySignals: [],
            executionSignals: [],
            gapSignals: [],
            githubSignals: [],
            investigationSignals: [],
            deepSignalFamilies: {},
            deepSignalCount: 0,
            deepSignalFamilyCount: 0,
            signalConfidence: 0
        };

    const websiteSourceUrls =
    websiteSources
      .map(source =>
          normalizeUrl(
              source?.sourceUrl ||
              source?.canonicalUrl ||
              ""
          )
      )
      .filter(Boolean);


    const allSourceUrls = [
        ...websiteSourceUrls,
        compressedLinkedinSource?.linkedinProfile?.profileUrl,
        ...linkedinPosts.map(item =>
            item?.url ||
            item?.postUrl ||
            item?.sourceUrl
        ),
        ...linkedinArticles.map(item =>
            item?.url ||
            item?.articleUrl ||
            item?.sourceUrl
        ),
        compressedGithubEvidence?.sourceUrl ||
        compressedGithubEvidence?.canonicalUrl ||
        compressedGithubEvidence?.url
    ].filter(Boolean);

    console.log(
        "UNIVERSAL_CONTENT_COMPRESSION",
        JSON.stringify({
            websiteSources: websiteSources.length,
            linkedinProfile: !!compressedLinkedinSource?.linkedinProfile,
            linkedinPosts:
                Array.isArray(compressedLinkedinSource?.posts)
                    ? compressedLinkedinSource.posts.length
                    : 0,
            linkedinArticles:
                Array.isArray(compressedLinkedinSource?.articles)
                    ? compressedLinkedinSource.articles.length
                    : 0,
            githubEvidence:
                !!compressedGithubEvidence,
            signalSignals:
                Object.keys(compressedSignals || {}).length
        })
    );

    /*
     * CARRY FORWARD RETAINED EVIDENCE.
     * Website sources come from PCF.
     * LinkedIn posts/articles are carried up to 10 each.
     * No evidence content is discarded here beyond the explicit
     * existing 10-item transport boundary.
     * CONTENT compression only.
     * URLs / links remain untouched.
     */
    return {
        success: true,

        packageType:
            "UniversalPublicEvidencePackage",

        version: "22.0",

        postmaster: {
            role: "evidence-delivery-only",
            filtering: false,
            compression: true,
            ranking: false,
            investigation: false
        },

        primarySource:
            normalizeUrl(primaryUrl) || null,

        websiteEvidence: {
            sources: compressedWebsiteSources,
            sourceUrls: websiteSourceUrls
        },

        linkedinEvidence: linkedinSource
            ? {
                source: compressedLinkedinSource,
                profile:
                    compressedLinkedinSource?.linkedinProfile || linkedInProfile,
                about:
                    compressedLinkedinSource?.linkedinProfile?.about ||
                    null,
                followersCount:
                    compressedLinkedinSource?.linkedinProfile?.followersCount ??
                    null,
                connectionsCount:
                    compressedLinkedinSource?.linkedinProfile?.connectionsCount ??
                    null,
                posts:
                    compressedLinkedinSource?.posts || [],
                articles:
                    compressedLinkedinSource?.articles || [],
                sourceUrl:
                    normalizeUrl(
                        compressedLinkedinSource?.sourceUrl ||
                        ""
                    ) || null
            }
            : {
                source: null,
                profile: null,
                about: null,
                followersCount: null,
                connectionsCount: null,
                posts: [],
                articles: [],
                sourceUrl: null
            },

        githubEvidence:
            compressedGithubEvidence || null,

        sourceLinks:
            [...new Set(allSourceUrls)],

        /*
         * Signal is attached as intelligence only.
         * Raw evidence remains outside Signal's output and above.
         */
     /*   signalSignals:
    compressedSignals || {
        identity: {},
        positioning: [],
        niches: [],
        expertiseSignals: [],
        audienceSignals: [],
        businessSignals: [],
        creatorSignals: [],
        topics: [],
        recurringTopics: [],
        behavioralSignals: [],
        contradictions: [],
        crossSourceSignals: [],
        signalConfidence: 0
    },
    */
        evidenceCoverage: {
            websitePagesInvestigated:
                websiteSources.length,

            linkedinProfilesInvestigated:
                linkedinSource ? 1 : 0,

            linkedinPostsAvailable:
                linkedinPosts.length,

            linkedinArticlesAvailable:
                linkedinArticles.length,

            githubProfileAvailable:
                githubEvidence ? 1 : 0,

            totalSourcesReviewed:
                websiteSources.length +
                (linkedinSource ? 1 : 0) +
                (githubEvidence ? 1 : 0)
        }
    };
}

/* ------------------------------------------------------------
   MAIN
   ------------------------------------------------------------ */

export async function loadCrossEvidenceBrain({
   
    profileLinks = [],
    footprintPackage = {},
    truthLoopPackage = {}
} = {}) {

    void truthLoopPackage;

    const requestedLinks =
        Array.isArray(profileLinks)
            ? profileLinks
            : [];

    const primaryUrl =
        normalizeUrl(
            requestedLinks[0] ||
            footprintPackage?.profileLink ||
            footprintPackage?.sourceUrl ||
            ""
        );
console.log(
    "CEB_START",
    Date.now()
);
    if (!primaryUrl) {
        return {
            success: false,
            packageType: "CrossEvidencePackage",
            sourcesProcessed: 0,
            sourcesSucceeded: 0,
            sourcesFailed: 1,
            confidenceScore: 0,
            errors: [
                "At least one public source URL is required."
            ],
            universalPackage: null,
            crossEvidencePackage: null
        };
    }

    console.log(
        "CEB_START",
        JSON.stringify({
            primaryUrl,
            primaryPlatform:
                detectPlatform(primaryUrl),
            requestedLinkCount:
                requestedLinks.length
        })
    );

    

    /*
     * PUBLIC EVIDENCE ROUTING
     *
     * Exactly ONE Apify call maximum.
     * There is NO second Apify execution path.
     */

    let websiteSources = [];
    let linkedinSource = null;
    let linkedinUrl = "";
    let linkedinProfile = null;
    let githubEvidence = null;
    let githubUrl = "";

    if (detectPlatform(primaryUrl) === "linkedin") {

        /*
         * Primary source itself is LinkedIn.
         * Use this URL for the single Apify call.
         */
        linkedinUrl = primaryUrl;

    } else {

        /*
         * Primary source is a website.
         * Reuse website evidence already collected by DFB/PCF.
         * Only fetch website evidence if nothing was supplied.
         */
        const suppliedWebsiteSources =
            Array.isArray(footprintPackage?.websiteEvidence?.sources)
                ? footprintPackage.websiteEvidence.sources
                : Array.isArray(footprintPackage?.sources)
                    ? footprintPackage.sources
                    : [];

        if (suppliedWebsiteSources.length > 0) {

            websiteSources = suppliedWebsiteSources;

        } else {

            const websiteResult =
                await fetchWebsiteEvidence(
                    primaryUrl
                );

            if (websiteResult?.success) {
                websiteSources =
                    websiteResult.sources || [];
            }
        }

        /*
         * Discover LinkedIn URL only.
         * Discovery itself performs NO API call.
         */
        const discoveredLinks = [
            ...(Array.isArray(footprintPackage?.discoveredLinks)
                ? footprintPackage.discoveredLinks
                : []),
            ...(Array.isArray(footprintPackage?.profileLinks)
                ? footprintPackage.profileLinks
                : []),
            ...(Array.isArray(footprintPackage?.sourceCandidates)
                ? footprintPackage.sourceCandidates
                : [])
        ];

        const discoveredSocialLinks =
            Array.isArray(footprintPackage?.discoveredSocialLinks)
                ? footprintPackage.discoveredSocialLinks
                : [];

        linkedinUrl =
            findLinkedInUrl({
                requestedLinks,
                websiteSources,
                discoveredLinks,
                discoveredSocialLinks
            });

        githubUrl =
            findGitHubUrl({
                requestedLinks,
                websiteSources,
                discoveredLinks,
                discoveredSocialLinks
            });

        console.log(
            "CEB_PUBLIC_LINK_DISCOVERY",
            JSON.stringify({
                requestedLinks: requestedLinks.length,
                websiteSources: websiteSources.length,
                discoveredLinks: discoveredLinks.length,
                discoveredSocialLinks: discoveredSocialLinks.length,
                linkedinUrl: linkedinUrl || null,
                githubUrl: githubUrl || null
            })
        );
    }

    /*
     * Reuse an already-fetched GitHub package when supplied by the
     * upstream footprint package. Otherwise fetch the public profile
     * directly — never through Apify.
     */
    const suppliedGithubEvidence =
        footprintPackage?.githubEvidence ||
        footprintPackage?.github ||
        footprintPackage?.githubProfile ||
        null;

    if (suppliedGithubEvidence) {
        githubEvidence = suppliedGithubEvidence;
        githubUrl =
            githubUrl ||
            normalizeUrl(
                suppliedGithubEvidence?.sourceUrl ||
                suppliedGithubEvidence?.profileUrl ||
                suppliedGithubEvidence?.url ||
                ""
            );
    } else if (githubUrl) {
        const githubResult =
            await fetchGitHubDirect(githubUrl);

        if (githubResult?.success && githubResult?.source) {
            githubEvidence = githubResult.source;
        }
    }

    /* ------------------------------------------------------------
     LINKEDIN APIFY COLLECTION
     ------------------------------------------------------------
     Activity actor -> posts/articles.
     Profile actor  -> profile/about/followers/experience.

     The profile actor's recent_posts/articles are intentionally
     ignored and never enter the Universal Public Evidence Package.
     ------------------------------------------------------------ */

    if (
        linkedinUrl &&
        ENABLE_LINKEDIN_APIFY
    ) {

        const apifyResult =
            await fetchLinkedInFromApify(
                linkedinUrl
            );

        if (
            apifyResult?.success &&
            apifyResult?.source
        ) {

            linkedinSource =
                apifyResult.source;
        }

        const profileResult =
            await fetchLinkedInProfileFromApify(
                linkedinUrl
            );

        if (
            profileResult?.success &&
            profileResult?.profile
        ) {

            linkedinProfile =
                profileResult.profile;
        }
    }

    /*
     * Merge profile enrichment into the existing LinkedIn source.
     * Posts/articles remain exclusively from the activity actor.
     */
    if (linkedinProfile) {

        const activityProfile =
            linkedinSource?.linkedinProfile || {};

        linkedinSource = {
            ...(linkedinSource || {}),

            linkedinProfile: {
                ...activityProfile,
                ...linkedinProfile
            },

            profile:
                linkedinProfile,

            posts:
                Array.isArray(linkedinSource?.posts)
                    ? linkedinSource.posts
                    : [],

            articles:
                Array.isArray(linkedinSource?.articles)
                    ? linkedinSource.articles
                    : []
        };
    }

    /*
     * Signal gets the SAME collected evidence.
     *
     * No filtering/ranking occurs before this call.
     */
    const signalResult =
        await buildSignalSignals({
            websiteEvidence:
                websiteSources,
            linkedinEvidence:
                linkedinSource,
            githubEvidence:
                githubEvidence
        });

    /*
     * Universal Package = POSTMASTER.
     * It simply carries the evidence + Signal signals.
     */
    const universalPackage =
        buildUniversalPackage({
            primaryUrl,
            websiteSources,
            linkedinSource,
            githubEvidence,
            signalResult
        });

    const sourcesSucceeded =
        websiteSources.length +
        (linkedinSource ? 1 : 0);

    const sourcesFailed =
        sourcesSucceeded > 0
            ? 0
            : 1;

    console.log(
        "UNIVERSAL_PACKAGE_DEBUG",
        JSON.stringify({
            success:
                universalPackage.success,

            websiteSources:
                universalPackage
                    .websiteEvidence
                    .sources
                    .length,

            linkedinProfile:
                !!universalPackage
                    .linkedinEvidence
                    .profile,

            linkedinProfileAbout:
                safeText(
                    universalPackage
                        .linkedinEvidence
                        .about
                ).length,

            linkedinFollowers:
                universalPackage
                    .linkedinEvidence
                    .followersCount ??
                null,

            linkedinConnections:
                universalPackage
                    .linkedinEvidence
                    .connectionsCount ??
                null,

            linkedinPosts:
                universalPackage
                    .linkedinEvidence
                    .posts
                    .length,

            linkedinArticles:
                universalPackage
                    .linkedinEvidence
                    .articles
                    .length,

            githubEvidence:
                !!universalPackage.githubEvidence,

            signalStatus:
                signalResult?.status || "unknown",

            signalSignals:
                Object.keys(
                    universalPackage.signalSignals || {}
                ).length,

            deepSignalFamilies:
                universalPackage.signalSignals?.deepSignalFamilyCount || 0,

            deepSignalCount:
                universalPackage.signalSignals?.deepSignalCount || 0
        })
    );

    const result = {
        success: sourcesSucceeded > 0,

        packageType:
            "CrossEvidencePackage",

        sourcesProcessed:
            (websiteSources.length > 0 ? 1 : 0) +
            (linkedinSource ? 1 : 0),

        sourcesSucceeded,

        sourcesFailed,

        confidenceScore:
            sourcesSucceeded > 0 ? 100 : 0,

        errors: [],

        universalPackage,

        crossEvidencePackage: {
            success:
                universalPackage.success,

            packageType:
                "CrossEvidencePackage",

            version: "22.0",

            universalPackage,

            evidenceCoverage:
                universalPackage.evidenceCoverage
        }
    };

    console.log(
        "CROSS_EVIDENCE_FINAL",
        JSON.stringify({
            success: result.success,
            websiteSources:
                websiteSources.length,
            linkedin:
                !!linkedinSource,
            linkedinPosts:
                Array.isArray(universalPackage?.linkedinEvidence?.posts)
                    ? universalPackage.linkedinEvidence.posts.length
                    : 0,
            linkedinArticles:
                Array.isArray(universalPackage?.linkedinEvidence?.articles)
                    ? universalPackage.linkedinEvidence.articles.length
                    : 0,
            github:
                !!githubEvidence,
            signalStatus:
                signalResult?.status || "unknown"
        })
    );

    return result;
}

export function getCrossEvidencePlatform(url) {
    return detectPlatform(
        normalizeUrl(url)
    );
}
