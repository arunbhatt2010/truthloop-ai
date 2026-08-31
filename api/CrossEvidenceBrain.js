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

const APIFY_ACTOR_ID = "sourabhbgp~linkedin-profile-scraper";
const APIFY_PROFILE_ACTOR_ID = "RETIRED";
const APIFY_TIMEOUT_SECONDS = 60;
const APIFY_MAX_TOTAL_CHARGE_USD = "0.05";
const UNUSED_SIGNAL_MODEL = "unused";

const ENABLE_LINKEDIN_APIFY = true;

const ENABLE_X = false;
const ENABLE_REDDIT = false;
const ENABLE_OTHER_SOCIAL = false;

const SOURCE_CACHE = new Map();

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
   Runs AFTER PCF + Apify + Signal collection and BEFORE export.

   Rules:
   - compress CONTENT only
   - never modify URLs / links
   - never rename/delete existing functions
   - never rank/select/filter sources or evidence
   - preserve object/array structure
   ------------------------------------------------------------ */

const UNIVERSAL_CONTENT_MAX_CHARS = 800;
const UNIVERSAL_ITEM_TEXT_MAX_CHARS = 300;
const UNIVERSAL_ABOUT_MAX_CHARS = 800;
const UNIVERSAL_SIGNAL_TEXT_MAX_CHARS = 300;

function isLinkOrStructuralKey(key = "") {
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
        k === "publisheddate" ||
        k === "publishedat" ||
        k === "postedat" ||
        k === "date" ||
        k === "start" ||
        k === "end"
    );
}

function compressUniversalContent(value, maxChars = UNIVERSAL_CONTENT_MAX_CHARS, key = "") {
    if (typeof value === "string") {
        if (isLinkOrStructuralKey(key)) return value;

        return value
            .replace(/\u0000/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxChars);
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
    websiteSources = []
} = {}) {

    const requestedLinkedIn =
        uniqueUrls(requestedLinks)
            .find(url => detectPlatform(url) === "linkedin");

    if (requestedLinkedIn) {
        return requestedLinkedIn;
    }

    for (const source of websiteSources) {

        const candidates = [
            ...(Array.isArray(source?.socialLinks)
                ? source.socialLinks
                : []),
            ...(Array.isArray(source?.socialProfiles)
                ? source.socialProfiles
                : [])
        ];

        const linkedinUrl = uniqueUrls(candidates)
            .find(url => detectPlatform(url) === "linkedin");

        if (linkedinUrl) {
            return linkedinUrl;
        }
    }

    return "";
}

/* ------------------------------------------------------------
   APIFY — EXACTLY ONE ACTOR EXECUTION PER LINKEDIN URL
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
         * Unified profile scraper output.
         * One external actor execution returns profile + about +
         * follower metric + experience/education + recent posts.
         * Keep the existing LinkedIn source contract unchanged.
         */
        const firstItem = items[0] || {};

        const profileUrl =
            normalizeUrl(
                firstItem?.linkedinUrl ||
                firstItem?.profileUrl ||
                firstItem?.publicIdentifier ||
                firstItem?.linkedin_id ||
                normalizedUrl
            ) || normalizedUrl;

        const name =
            firstItem?.full_name ||
            firstItem?.name ||
            firstItem?.display_name ||
            null;

        const headline =
            firstItem?.profile_headline ||
            firstItem?.headline ||
            firstItem?.job_title ||
            null;

        const location =
            firstItem?.location ||
            [
                firstItem?.location_city,
                firstItem?.location_state,
                firstItem?.location_country
            ]
                .filter(Boolean)
                .join(", ") ||
            null;

        const about =
            firstItem?.description ||
            firstItem?.about ||
            firstItem?.summary ||
            null;

        const currentCompany =
            firstItem?.currentCompany ||
            firstItem?.current_company_name ||
            firstItem?.current_company ||
            null;

        const followersCount =
            firstItem?.followerCount ??
            firstItem?.followersCount ??
            firstItem?.followers ??
            null;

        const experience =
            Array.isArray(firstItem?.experience)
                ? firstItem.experience
                : Array.isArray(firstItem?.experiences)
                    ? firstItem.experiences
                    : [];

        const education =
            Array.isArray(firstItem?.education)
                ? firstItem.education
                : Array.isArray(firstItem?.educations)
                    ? firstItem.educations
                    : [];

        const skills =
            Array.isArray(firstItem?.skills)
                ? firstItem.skills
                : [];

        const recentPosts =
            Array.isArray(firstItem?.recentPosts)
                ? firstItem.recentPosts
                : Array.isArray(firstItem?.recent_posts)
                    ? firstItem.recent_posts
                    : [];

        const posts =
            recentPosts
                .filter(item =>
                    !(
                        item?.postType === "article" ||
                        item?.type === "article" ||
                        item?.isArticle === true
                    )
                )
                .map(item => ({
                    ...item,
                    text:
                        item?.text ||
                        item?.content ||
                        item?.description ||
                        "",
                    url:
                        item?.url ||
                        item?.postUrl ||
                        item?.link ||
                        null,
                    datePublished:
                        item?.publishedAt ||
                        item?.datePublished ||
                        item?.published_at ||
                        null,
                    reactions:
                        item?.reactions ??
                        item?.likes ??
                        null
                }))
                .filter(item =>
                    safeText(item?.text) ||
                    safeText(item?.url)
                );

        const articles =
            recentPosts
                .filter(item =>
                    item?.postType === "article" ||
                    item?.type === "article" ||
                    item?.isArticle === true
                )
                .map(item => ({
                    ...item,
                    headline:
                        item?.headline ||
                        item?.title ||
                        null,
                    text:
                        item?.text ||
                        item?.content ||
                        item?.description ||
                        "",
                    url:
                        item?.url ||
                        item?.postUrl ||
                        item?.link ||
                        null,
                    datePublished:
                        item?.publishedAt ||
                        item?.datePublished ||
                        item?.published_at ||
                        null
                }));

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
                "LinkedIn Profile",

            description:
                safeText(
                    about ||
                    headline ||
                    name ||
                    ""
                ),

            visibleText:
                [
                    name ? `Name: ${name}` : "",
                    headline ? `Headline: ${headline}` : "",
                    about ? `About: ${about}` : "",
                    location ? `Location: ${location}` : "",
                    currentCompany
                        ? `Current Company: ${currentCompany}`
                        : "",
                    followersCount !== null && followersCount !== undefined
                        ? `Followers: ${followersCount}`
                        : "",
                    ...posts.map(item => safeText(item?.text)),
                    ...articles.map(item =>
                        safeText(
                            item?.headline ||
                            item?.text
                        )
                    )
                ]
                    .filter(Boolean)
                    .join("\n"),

            contentLength:
                [
                    name,
                    headline,
                    about,
                    location,
                    currentCompany,
                    followersCount,
                    ...posts.map(item => safeText(item?.text)),
                    ...articles.map(item =>
                        safeText(
                            item?.headline ||
                            item?.text
                        )
                    )
                ]
                    .filter(Boolean)
                    .join("\n")
                    .length,

            socialLinks: [profileUrl],
            socialProfiles: [profileUrl],

            linkedinProfile: {
                profileUrl,
                name,
                headline,
                about,
                location,
                currentCompany,
                followersCount,
                experience,
                education,
                skills,
                profileBadge:
                    firstItem?.profileBadge ||
                    null,
                websites:
                    Array.isArray(firstItem?.websites)
                        ? firstItem.websites
                        : []
            },

            posts,
            articles,
            apifyData: items
        };

        console.log(
            "APIFY_UNIFIED_RESULT",
            JSON.stringify({
                actorId: APIFY_ACTOR_ID,
                profileUrl,
                aboutChars: safeText(about).length,
                followersCount: followersCount ?? null,
                experienceCount: experience.length,
                educationCount: education.length,
                postItems: posts.length,
                articleItems: articles.length,
                profileBadge:
                    firstItem?.profileBadge || null
            })
        );

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

    /*
     * PROFILE ACTOR RETIRED.
     * The unified LinkedIn actor already returns profile/about/
     * followers/experience/education in the same run used for posts.
     * Preserve this function name for downstream compatibility,
     * but never make a second external Apify execution.
     */
    const cached =
        SOURCE_CACHE.get(normalizedUrl);

    if (
        cached?.linkedinProfile &&
        typeof cached.linkedinProfile === "object"
    ) {
        console.log(
            "APIFY_PROFILE_REUSE_UNIFIED",
            JSON.stringify({
                profileUrl:
                    cached.linkedinProfile.profileUrl || normalizedUrl,
                followersCount:
                    cached.linkedinProfile.followersCount ?? null,
                aboutChars:
                    safeText(
                        cached.linkedinProfile.about
                    ).length
            })
        );

        return {
            success: true,
            profile: cached.linkedinProfile,
            reusedUnifiedRun: true
        };
    }

    return {
        success: false,
        reason:
            "Unified LinkedIn profile data was not available from the current run.",
        profile: null
    };
}

/* ------------------------------------------------------------
   LOCAL SIGNAL MASTER
   ONE CALL. SIGNALS ONLY.
   ------------------------------------------------------------ */

async function buildSignalSignals({
    websiteEvidence = [],
    linkedinEvidence = null
} = {}) {

    /*
     * Signal replacement — deterministic local Signal Master.
     * Function name is intentionally preserved for downstream compatibility.
     *
     * IMPORTANT:
     * - NO external AI call.
     * - NO API key required.
     * - Evidence is read-only.
     * - No evidence filtering/ranking/removal.
     * - Only compact, evidence-grounded signals are generated.
     */

    const emptySignals = () => ({
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
    });

    const clean = value =>
        safeText(value)
            .replace(/\s+/g, " ")
            .trim();

    const normalizeTokenText = value =>
        clean(value)
            .toLowerCase()
            .replace(/https?:\/\/\S+/g, " ");

    const unique = values =>
        [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];

    const websiteItems = Array.isArray(websiteEvidence)
        ? websiteEvidence
        : [];

    const linkedin = linkedinEvidence || null;

    const websiteTextParts = [];
    const websiteUrls = [];

    for (const source of websiteItems) {
        const sourceUrl =
            normalizeUrl(
                source?.sourceUrl ||
                source?.canonicalUrl ||
                source?.url ||
                ""
            );

        if (sourceUrl) websiteUrls.push(sourceUrl);

        websiteTextParts.push(
            source?.title,
            source?.description,
            source?.visibleText,
            source?.contentSnippet
        );

        if (Array.isArray(source?.articles)) {
            for (const item of source.articles) {
                websiteTextParts.push(
                    item?.title,
                    item?.headline,
                    item?.text,
                    item?.content,
                    item?.description
                );
            }
        }

        if (Array.isArray(source?.posts)) {
            for (const item of source.posts) {
                websiteTextParts.push(
                    item?.title,
                    item?.headline,
                    item?.text,
                    item?.content,
                    item?.description
                );
            }
        }
    }

    const linkedinUrls = uniqueUrls([
        linkedin?.sourceUrl,
        linkedin?.linkedinProfile?.profileUrl,
        ...(Array.isArray(linkedin?.posts)
            ? linkedin.posts.map(item =>
                item?.url ||
                item?.postUrl
            )
            : []),
        ...(Array.isArray(linkedin?.articles)
            ? linkedin.articles.map(item =>
                item?.url ||
                item?.postUrl
            )
            : [])
    ]);

    const linkedinTextParts = [
        linkedin?.title,
        linkedin?.description,
        linkedin?.visibleText,
        linkedin?.linkedinProfile?.name,
        linkedin?.linkedinProfile?.headline,
        linkedin?.linkedinProfile?.about,
        linkedin?.linkedinProfile?.location,
        linkedin?.linkedinProfile?.currentCompany
    ];

    const linkedinPosts =
        Array.isArray(linkedin?.posts)
            ? linkedin.posts
            : [];

    const linkedinArticles =
        Array.isArray(linkedin?.articles)
            ? linkedin.articles
            : [];

    for (const item of linkedinPosts) {
        linkedinTextParts.push(
            item?.title,
            item?.headline,
            item?.text,
            item?.content,
            item?.description
        );
    }

    for (const item of linkedinArticles) {
        linkedinTextParts.push(
            item?.title,
            item?.headline,
            item?.text,
            item?.content,
            item?.description
        );
    }

    const websiteText =
        normalizeTokenText(
            websiteTextParts.filter(Boolean).join(" ")
        );

    const linkedinText =
        normalizeTokenText(
            linkedinTextParts.filter(Boolean).join(" ")
        );

    const combinedText =
        `${websiteText} ${linkedinText}`.trim();

    const profile =
        linkedin?.linkedinProfile &&
        typeof linkedin.linkedinProfile === "object"
            ? linkedin.linkedinProfile
            : {};

    const supportUrls = uniqueUrls([
        ...websiteUrls,
        ...linkedinUrls
    ]);

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
        "AI / Technology": [
            "ai",
            "artificial intelligence",
            "llm",
            "model",
            "agent",
            "software",
            "technology"
        ],
        "Behavior / Psychology": [
            "behavior",
            "behavioral",
            "psychology",
            "procrastination",
            "avoidance",
            "validation",
            "stuck",
            "overthinking",
            "habit"
        ],
        "Sales / Clients": [
            "sales",
            "client",
            "clients",
            "customers",
            "customer",
            "revenue",
            "lead",
            "leads"
        ],
        "Marketing / Content": [
            "marketing",
            "content",
            "posting",
            "posts",
            "audience",
            "brand",
            "branding",
            "linkedin"
        ],
        "Business / Startup": [
            "business",
            "startup",
            "founder",
            "founders",
            "company",
            "product",
            "app",
            "service"
        ],
        "Productivity / Execution": [
            "productivity",
            "execution",
            "focus",
            "planning",
            "action",
            "decision",
            "decisions",
            "work"
        ],
        "Coaching / Advice": [
            "coach",
            "coaching",
            "advice",
            "advise",
            "skills",
            "learn",
            "guide",
            "how to"
        ]
    };

    const topicScores = Object.entries(topicMap)
        .map(([topic, terms]) => ({
            topic,
            score: countMatches(combinedText, terms),
            websiteScore:
                countMatches(websiteText, terms),
            linkedinScore:
                countMatches(linkedinText, terms)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    const topTopics =
        topicScores
            .slice(0, 6);

    const repeatedTopics =
        topicScores
            .filter(item =>
                item.score >= 2 ||
                (
                    item.websiteScore > 0 &&
                    item.linkedinScore > 0
                )
            )
            .slice(0, 5);

    const addSignal = (
        bucket,
        text,
        urls = supportUrls,
        basis = ""
    ) => {
        bucket.push({
            signal: clean(text).slice(0, 300),
            supportingSourceUrls: uniqueUrls(urls).slice(0, 5),
            basis: clean(basis).slice(0, 300)
        });
    };

    const positioning = [];
    const niches = [];
    const expertiseSignals = [];
    const audienceSignals = [];
    const businessSignals = [];
    const creatorSignals = [];
    const behavioralSignals = [];
    const contradictions = [];
    const crossSourceSignals = [];

    for (const item of topTopics.slice(0, 3)) {
        addSignal(
            positioning,
            `Public content is strongly associated with ${item.topic}.`,
            item.linkedinScore > 0
                ? [...websiteUrls, ...linkedinUrls]
                : websiteUrls,
            `Observed ${item.score} keyword-family matches across supplied public evidence.`
        );
    }

    for (const item of topTopics.slice(0, 4)) {
        niches.push(item.topic);
    }

    const expertiseTopics =
        topTopics
            .filter(item => item.score >= 2)
            .slice(0, 4);

    for (const item of expertiseTopics) {
        addSignal(
            expertiseSignals,
            `Repeated expertise signal around ${item.topic}.`,
            item.linkedinScore > 0
                ? linkedinUrls
                : websiteUrls,
            `Repeated public-content terms support this topic.`
        );
    }

    const audienceMap = {
        "People seeking behavioral clarity": [
            "procrastination",
            "avoidance",
            "overthinking",
            "validation",
            "stuck",
            "behavior"
        ],
        "Founders / business operators": [
            "founder",
            "startup",
            "business",
            "revenue",
            "company"
        ],
        "Creators / professionals using LinkedIn": [
            "posting",
            "linkedin",
            "content",
            "audience",
            "clients"
        ]
    };

    for (const [audience, terms] of Object.entries(audienceMap)) {
        const score = countMatches(combinedText, terms);

        if (score >= 2) {
            addSignal(
                audienceSignals,
                `Public content appears to address ${audience.toLowerCase()}.`,
                supportUrls,
                `Audience terms occur ${score} times in the supplied evidence.`
            );
        }
    }

    const businessTerms = [
        "app",
        "pricing",
        "refund",
        "service",
        "product",
        "payment",
        "subscribe",
        "commercial"
    ];

    const businessScore =
        countMatches(combinedText, businessTerms);

    if (businessScore > 0) {
        addSignal(
            businessSignals,
            "Public evidence contains direct product/service or commercial signals.",
            websiteUrls.length ? websiteUrls : supportUrls,
            `Observed ${businessScore} product/service/commercial term matches.`
        );
    }

    const postCount = linkedinPosts.length;
    const articleCount = linkedinArticles.length;

    if (postCount > 0) {
        addSignal(
            creatorSignals,
            `LinkedIn activity evidence contains ${postCount} post item(s).`,
            linkedinUrls,
            "Count derived directly from collected LinkedIn evidence."
        );
    }

    if (articleCount > 0) {
        addSignal(
            creatorSignals,
            `LinkedIn activity evidence contains ${articleCount} article item(s).`,
            linkedinUrls,
            "Count derived directly from collected LinkedIn evidence."
        );
    }

    if (postCount > 0) {
        const postLengths = linkedinPosts
            .map(item =>
                clean(
                    item?.text ||
                    item?.content ||
                    item?.description ||
                    ""
                ).length
            )
            .filter(length => length > 0);

        const averagePostLength =
            postLengths.length
                ? Math.round(
                    postLengths.reduce(
                        (sum, length) => sum + length,
                        0
                    ) / postLengths.length
                )
                : 0;

        addSignal(
            behavioralSignals,
            `LinkedIn posting evidence contains ${postCount} collected post item(s) with an average visible text length of ${averagePostLength} characters.`,
            linkedinUrls,
            "Derived from the collected activity items only."
        );
    }

    const questionCount =
        (combinedText.match(/\?/g) || []).length;

    const contentWordCount =
        combinedText
            .split(/\s+/)
            .filter(Boolean)
            .length;

    if (contentWordCount > 0) {
        const questionRatio =
            questionCount / Math.max(1, contentWordCount);

        if (questionRatio >= 0.005) {
            addSignal(
                behavioralSignals,
                "Public writing frequently uses question framing.",
                supportUrls,
                `Observed ${questionCount} question marks across the supplied text.`
            );
        }
    }

    const noAdvice =
        /\b(no advice|no coaching|not coaching|not advice)\b/i
            .test(combinedText);

    const advisory =
        /\b(advice|coaching|skills|how to|guide|learn)\b/i
            .test(linkedinText);

    if (noAdvice && advisory) {
        addSignal(
            contradictions,
            "Website positioning contains an explicit no-advice/no-coaching signal while LinkedIn evidence contains advisory language.",
            [...websiteUrls, ...linkedinUrls],
            "Both signals are directly observable in separate supplied sources."
        );
    }

    for (const item of repeatedTopics.slice(0, 4)) {
        if (
            item.websiteScore > 0 &&
            item.linkedinScore > 0
        ) {
            addSignal(
                crossSourceSignals,
                `${item.topic} appears across both website and LinkedIn evidence.`,
                [...websiteUrls, ...linkedinUrls],
                "The same topic family is observed in both source groups."
            );
        }
    }

    const identity = {};

    if (profile?.name) identity.name = clean(profile.name);
    if (profile?.headline) identity.headline = clean(profile.headline);
    if (profile?.currentCompany) {
        identity.currentCompany =
            clean(profile.currentCompany);
    }
    if (profile?.location) {
        identity.location =
            clean(profile.location);
    }

    if (profile?.followersCount !== null &&
        profile?.followersCount !== undefined) {
        identity.followersCount =
            profile.followersCount;
    }

    const evidenceUnits =
        websiteItems.length +
        postCount +
        articleCount +
        (Object.keys(identity).length ? 1 : 0);

    const sourceBreadth =
        (websiteItems.length > 0 ? 1 : 0) +
        (linkedin ? 1 : 0);

    const signalConfidence =
        Math.max(
            0,
            Math.min(
                95,
                Math.round(
                    (
                        sourceBreadth * 20 +
                        Math.min(evidenceUnits, 10) * 4 +
                        Math.min(topTopics.length, 5) * 3
                    )
                )
            )
        );

    return {
        status: "ok",
        reason: "Local deterministic signal extraction",
        signals: {
            identity,
            positioning,
            niches,
            expertiseSignals,
            audienceSignals,
            businessSignals,
            creatorSignals,
            topics:
                topTopics.map(item => item.topic),
            recurringTopics:
                repeatedTopics.map(item => item.topic),
            behavioralSignals,
            contradictions,
            crossSourceSignals,
            signalConfidence
        }
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

    const compressedLinkedinSource =
        linkedinSource
            ? compressUniversalSource(linkedinSource)
            : null;

    const compressedSignals =
        compressUniversalSignals(
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
                signalConfidence: 0
            }
        );

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


    const linkedInProfile =
        linkedinSource?.linkedinProfile ||
        null;

    const linkedinPosts =
        Array.isArray(linkedinSource?.posts)
            ? linkedinSource.posts
            : [];

    const linkedinArticles =
        Array.isArray(linkedinSource?.articles)
            ? linkedinSource.articles
            : [];

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
            signalSignals:
                Object.keys(compressedSignals || {}).length
        })
    );

    /*
     * NO filtering.
     * NO ranking.
     * CONTENT compression only.
     * URLs / links remain untouched.
     */
    return {
        success: true,

        packageType:
            "UniversalPublicEvidencePackage",

        version: "21.0",

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
                posts: [],
                articles: [],
                sourceUrl: null
            },

        /*
         * Signal is attached as intelligence only.
         * Raw evidence remains outside Signal's output and above.
         */
        signalSignals:
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
        evidenceCoverage: {
            websitePagesInvestigated:
                websiteSources.length,

            linkedinProfilesInvestigated:
                linkedinSource ? 1 : 0,

            linkedinPostsAvailable:
                linkedinPosts.length,

            linkedinArticlesAvailable:
                linkedinArticles.length,

            totalSourcesReviewed:
                websiteSources.length +
                (linkedinSource ? 1 : 0)
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
    void footprintPackage;

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
        linkedinUrl =
            findLinkedInUrl({
                requestedLinks,
                websiteSources
            });
    }

    /* ------------------------------------------------------------
     LINKEDIN APIFY COLLECTION
     ------------------------------------------------------------
     Unified actor -> profile/about/followers/experience/education/
                      follower metric + recent posts/articles.

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

        console.log(
            "APIFY_LINKEDIN_ACTOR_AUDIT",
            JSON.stringify({
                actorId: APIFY_ACTOR_ID,
                profileActorStatus: "retired",
                externalCallsForLinkedIn: 1,
                unifiedRunUsed: true
            })
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
                linkedinSource
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

            signalStatus:
                signalResult?.status || "unknown",

            signalSignals:
                Object.keys(
                    universalPackage.signalSignals || {}
                ).length
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

            version: "21.0",

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
                linkedinSource?.posts?.length || 0,
            linkedinArticles:
                linkedinSource?.articles?.length || 0,
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
