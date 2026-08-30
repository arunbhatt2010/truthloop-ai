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
   4. Make exactly ONE Gemini call to extract SIGNALS only from
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

const APIFY_ACTOR_ID = "calm_builder~linkedin-profile-scraper";
const APIFY_TIMEOUT_SECONDS = 120;
const APIFY_MAX_TOTAL_CHARGE_USD = "0.006";
const GEMINI_MODEL = "gemini-3.6-flash";

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
        `&maxItems=1` +
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
                    profiles: [normalizedUrl]
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
            item?.profile &&
            typeof item.profile === "object"
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
            [
                rawProfile?.firstName,
                rawProfile?.lastName
            ]
                .filter(Boolean)
                .join(" ");

        const headline =
            rawProfile?.headline ||
            rawProfile?.currentTitle ||
            "";

        const location =
            rawProfile?.location ||
            rawProfile?.geo?.full ||
            "";

        const about =
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

        const followersCount =
            rawProfile?.followersCount ??
            rawProfile?.followers ??
            null;

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

        /*
         * Preserve the complete Apify item.
         * Do not rank or select inside CEB.
         */
        const source = {
            sourceUrl: profileUrl,
            canonicalUrl: profileUrl,
            sourcePlatform: "linkedin",
            platform: "linkedin",
            sourceHost: "www.linkedin.com",
            status: 200,
            fetchStatus: "success",

            title: name || headline || "LinkedIn Profile",
            description:
                safeText(headline || about),

            visibleText:
                [
                    name ? `Name: ${name}` : "",
                    headline ? `Headline: ${headline}` : "",
                    about ? `About: ${about}` : "",
                    currentCompany
                        ? `Current company: ${currentCompany}`
                        : "",
                    location ? `Location: ${location}` : "",
                    followersCount !== null
                        ? `Followers: ${followersCount}`
                        : ""
                ]
                    .filter(Boolean)
                    .join("\n"),

            contentLength:
                [
                    name,
                    headline,
                    about,
                    currentCompany,
                    location,
                    followersCount !== null
                        ? String(followersCount)
                        : ""
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
             * IMPORTANT:
             * Full arrays received from Apify are preserved.
             * No top-N filtering here.
             */
            posts,
            articles,

            /*
             * Raw structured Actor response is retained for the
             * Universal Package. No filtering or ranking is applied.
             */
            apifyData: item
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
                    Array.isArray(rawProfile?.experience) ||
                    Array.isArray(rawProfile?.workExperience)
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
   GEMINI SIGNAL MASTER
   ONE CALL. SIGNALS ONLY.
   ------------------------------------------------------------ */

async function buildGeminiSignals({
    websiteEvidence = [],
    linkedinEvidence = null
} = {}) {

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            status: "disabled",
            reason: "Missing GEMINI_API_KEY",
            signals: {
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
        };
    }

    const prompt = `
You are TruthLoop's Signal Master.

You receive ALREADY COLLECTED public evidence.

Your ONLY job is to extract evidence-grounded intelligence SIGNALS.

You do NOT own the evidence.

You do NOT filter evidence.

You do NOT select evidence.

You do NOT rank evidence.

You do NOT compress evidence.

You do NOT rewrite evidence.

You do NOT decide which post or article should survive.

You do NOT remove sources.

You do NOT create a Universal Evidence Package.

You do NOT return article bodies, post bodies, sourceContent,
or copied public evidence.

The Universal Public Evidence Package already preserves the
complete upstream evidence outside your output.

Extract ONLY:

- identity signals
- positioning signals
- niche signals
- expertise signals
- audience signals
- business signals
- creator signals
- recurring topic signals
- public behavioral/activity signals
- supported contradictions
- cross-source signals

Rules:

1. Use ONLY the supplied website and LinkedIn evidence.
2. Never invent facts, people, companies, audiences, expertise,
   behavior, activity, metrics, URLs or outcomes.
3. Do not diagnose psychology or mental health.
4. Do not give advice.
5. Every substantive signal should identify supporting source URLs.
6. Prefer signals supported by repeated evidence.
7. Do not decide that one article/post is more important than another.
8. Do not remove or summarize the underlying evidence.
9. If evidence is insufficient, return [] or {}.
10. Keep the output compact.
11. Return ONLY valid JSON.
12. Never output markdown fences.
13. Never output explanatory prose outside the JSON object.

Return exactly:

{
  "identity": {},
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
  "crossSourceSignals": [],
  "signalConfidence": 0
}

For substantive signal entries, prefer:

{
  "signal": "...",
  "supportingSourceUrls": ["..."],
  "basis": "brief evidence-grounded reason"
}

WEBSITE EVIDENCE:
${JSON.stringify(websiteEvidence)}

LINKEDIN EVIDENCE:
${JSON.stringify(linkedinEvidence)}
`;

    console.log(
        "GEMINI_SIGNAL_CALL_START",
        JSON.stringify({
            websiteSourceCount: websiteEvidence.length,
            hasLinkedInEvidence: !!linkedinEvidence,
            linkedinPostCount:
                Array.isArray(linkedinEvidence?.posts)
                    ? linkedinEvidence.posts.length
                    : 0,
            linkedinArticleCount:
                Array.isArray(linkedinEvidence?.articles)
                    ? linkedinEvidence.articles.length
                    : 0
        })
    );

    try {

        const response =
            await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                GEMINI_MODEL +
                ":generateContent?key=" +
                apiKey,
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
                            responseMimeType:
                                "application/json",
                            maxOutputTokens: 5000
                        }
                    })
                }
            );

        console.log(
            "GEMINI_SIGNAL_HTTP_STATUS",
            response.status
        );

        if (!response.ok) {

            const errorBody =
                await response.text();

            console.error(
                "GEMINI_SIGNAL_BODY_ERROR",
                errorBody.slice(0, 1500)
            );

            return {
                status: "failed",
                reason: errorBody,
                signals: null
            };
        }

        const data =
            await response.json();

        const content =
            data?.candidates?.[0]
                ?.content?.parts?.[0]?.text ||
            "";

        if (!content.trim()) {

            console.error(
                "GEMINI_SIGNAL_EMPTY_RESPONSE"
            );

            return {
                status: "failed",
                reason: "Empty Gemini signal response",
                signals: null
            };
        }

        let parsed;

        try {

            parsed = JSON.parse(
                content
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim()
            );

        } catch (parseError) {

            /*
             * Important:
             * A Gemini formatting failure must NEVER destroy the
             * Universal Evidence Package.
             *
             * We return empty signal arrays and preserve all
             * collected evidence in the package.
             */
            console.error(
                "GEMINI_SIGNAL_JSON_ERROR",
                parseError?.message
            );

            return {
                status: "failed",
                reason:
                    parseError?.message ||
                    "Gemini returned invalid JSON.",
                signals: {
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
            };
        }

        const signals = {
            identity:
                parsed?.identity || {},

            positioning:
                Array.isArray(parsed?.positioning)
                    ? parsed.positioning
                    : [],

            niches:
                Array.isArray(parsed?.niches)
                    ? parsed.niches
                    : [],

            expertiseSignals:
                Array.isArray(parsed?.expertiseSignals)
                    ? parsed.expertiseSignals
                    : [],

            audienceSignals:
                Array.isArray(parsed?.audienceSignals)
                    ? parsed.audienceSignals
                    : [],

            businessSignals:
                Array.isArray(parsed?.businessSignals)
                    ? parsed.businessSignals
                    : [],

            creatorSignals:
                Array.isArray(parsed?.creatorSignals)
                    ? parsed.creatorSignals
                    : [],

            topics:
                Array.isArray(parsed?.topics)
                    ? parsed.topics
                    : [],

            recurringTopics:
                Array.isArray(parsed?.recurringTopics)
                    ? parsed.recurringTopics
                    : [],

            behavioralSignals:
                Array.isArray(parsed?.behavioralSignals)
                    ? parsed.behavioralSignals
                    : [],

            contradictions:
                Array.isArray(parsed?.contradictions)
                    ? parsed.contradictions
                    : [],

            crossSourceSignals:
                Array.isArray(parsed?.crossSourceSignals)
                    ? parsed.crossSourceSignals
                    : [],

            signalConfidence:
                Number.isFinite(
                    Number(parsed?.signalConfidence)
                )
                    ? Math.max(
                        0,
                        Math.min(
                            100,
                            Number(parsed.signalConfidence)
                        )
                    )
                    : 0
        };

        console.log(
            "GEMINI_SIGNAL_RESULT",
            JSON.stringify({
                status: "ok",
                positioning:
                    signals.positioning.length,
                expertiseSignals:
                    signals.expertiseSignals.length,
                audienceSignals:
                    signals.audienceSignals.length,
                businessSignals:
                    signals.businessSignals.length,
                creatorSignals:
                    signals.creatorSignals.length,
                topics:
                    signals.topics.length,
                recurringTopics:
                    signals.recurringTopics.length,
                behavioralSignals:
                    signals.behavioralSignals.length,
                contradictions:
                    signals.contradictions.length,
                crossSourceSignals:
                    signals.crossSourceSignals.length,
                signalConfidence:
                    signals.signalConfidence
            })
        );

        return {
            status: "ok",
            signals
        };

    } catch (error) {

        console.error(
            "GEMINI_SIGNAL_CALL_FAILED",
            error?.message
        );

        return {
            status: "failed",
            reason:
                error?.message ||
                "Gemini signal call failed.",
            signals: null
        };
    }
}

/* ------------------------------------------------------------
   UNIVERSAL PACKAGE
   POSTMASTER ONLY
   ------------------------------------------------------------ */

function buildUniversalPackage({
    primaryUrl = "",
    websiteSources = [],
    linkedinSource = null,
    geminiResult = null
} = {}) {

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

    /*
     * NO filtering.
     * NO ranking.
     * NO compression.
     * Arrays are transferred as received from upstream providers.
     */
    return {
        success: true,

        packageType:
            "UniversalPublicEvidencePackage",

        version: "21.0",

        postmaster: {
            role: "evidence-delivery-only",
            filtering: false,
            compression: false,
            ranking: false,
            investigation: false
        },

        primarySource:
            normalizeUrl(primaryUrl) || null,

        websiteEvidence: {
            sources: websiteSources,
            sourceUrls: websiteSourceUrls
        },

        linkedinEvidence: linkedinSource
            ? {
                source: linkedinSource,
                profile:
                    linkedInProfile,
                about:
                    linkedInProfile?.about ||
                    null,
                followersCount:
                    linkedInProfile?.followersCount ??
                    null,
                posts:
                    linkedinPosts,
                articles:
                    linkedinArticles,
                sourceUrl:
                    normalizeUrl(
                        linkedinSource?.sourceUrl ||
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
         * Gemini is attached as intelligence only.
         * Raw evidence remains outside Gemini's output and above.
         */
        geminiSignals:
            geminiResult?.signals || {
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

    /*
     * SINGLE APIFY EXECUTION
     *
     * This is the ONLY place in CEB where
     * fetchLinkedInFromApify() may ever be called.
     */
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
           }
    

    /*
     * Gemini gets the SAME collected evidence.
     *
     * No filtering/ranking occurs before this call.
     */
    const geminiResult =
        await buildGeminiSignals({
            websiteEvidence:
                websiteSources,
            linkedinEvidence:
                linkedinSource
        });

    /*
     * Universal Package = POSTMASTER.
     * It simply carries the evidence + Gemini signals.
     */
    const universalPackage =
        buildUniversalPackage({
            primaryUrl,
            websiteSources,
            linkedinSource,
            geminiResult
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

            geminiStatus:
                geminiResult?.status || "unknown",

            geminiSignals:
                Object.keys(
                    universalPackage.geminiSignals || {}
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
            geminiStatus:
                geminiResult?.status || "unknown"
        })
    );

    return result;
}

export function getCrossEvidencePlatform(url) {
    return detectPlatform(
        normalizeUrl(url)
    );
}
