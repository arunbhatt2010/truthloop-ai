/* ============================================================
   LOOP 7 EVIDENCE ROUTING UPDATE
   - Preserve multiple user-supplied public URLs.
   - Preserve discovered public profile URLs.
   - Pass the combined verified source list to CrossEvidenceBrain.
   - Keep source URLs visible in the returned Loop 7 package.
============================================================ */
import { loadFootprintSupport }
from "./FootprintSupport.js";

import {
    loadPublicContentFetcher,
    acquirePublicContent,
    validatePublicContent,
    cleanPublicContent,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";

import {
    loadCrossEvidenceBrain
} from "./CrossEvidenceBrain.js";

/* ============================================================
   DIGITAL FOOTPRINT BRAIN v2

   Mission:
   Convert a public profile URL into reusable
   investigation evidence.

   Supported:
   - LinkedIn
   - Facebook
   - Instagram
   - X
   - GitHub
   - YouTube
   - Website
   - Blog
============================================================ */

export async function loadDigitalFootprintBrain({

    profileLink = "",
    profileLinks = [],
    currentLoop = 7,
    truthLoopPackage = {}

} = {}) {

    console.log("===== DIGITAL FOOTPRINT BRAIN v2 =====");

    console.log(
        "PROFILE_LINK_RECEIVED",
        profileLink
    );

    console.log(
        "PROFILE_LINKS_RECEIVED",
        profileLinks
    );
    // --------------------------------------------------
    // STEP 1
    // LOOP SECURITY
    // --------------------------------------------------

    if (currentLoop !== 7) {

        return {
            success: false,
            stage: "Security",
            reason: "DigitalFootprintBrain is available only in Loop 7."
        };

    }

    // --------------------------------------------------
    // STEP 2
    // PROFILE VALIDATION
    // --------------------------------------------------

    // --------------------------------------------------
    // STEP 2A
    // NORMALIZE ALL PUBLIC SOURCES
    // --------------------------------------------------
    //
    // Loop 7 can receive one primary URL plus additional
    // public URLs in the same request. Keep every valid
    // source instead of forcing the flow back to one URL.
    // --------------------------------------------------

    const requestedProfileLinks =
        normalizeProfileLinks(
            profileLink,
            profileLinks
        );

    const primaryProfileLink =
        requestedProfileLinks[0] || "";

    console.log("DFB_PROFILE_LINK_DEBUG", {
        profileLink,
        profileLinks,
        requestedProfileLinks,
        primaryProfileLink
    });

    if (!requestedProfileLinks.length) {

        return {
            success: false,
            stage: "Profile Validation",
            reason: "Public profile URL required."
        };

    }
const footprintPackage =
await loadFootprintSupport({
    profileLinks: requestedProfileLinks,
    currentLoop
});

console.log(
    "FOOTPRINT_PACKAGE",
    footprintPackage
);
    // --------------------------------------------------
    // STEP 3
    // PLATFORM DETECTION
    // --------------------------------------------------

    const platform =
        detectPlatform(primaryProfileLink);

    // --------------------------------------------------
    // STEP 4
    // PUBLIC CONTENT FETCH
    // --------------------------------------------------
    //
    // The first URL remains the primary content package.
    // Additional user-provided URLs are preserved and sent
    // to CrossEvidenceBrain so it can fetch and compare
    // them as separate public evidence sources.
    // --------------------------------------------------

    const publicContentPackage =
        await fetchPublicEvidence(primaryProfileLink);

    if (!publicContentPackage.success) {
        return publicContentPackage;
    }

    // --------------------------------------------------
    // STEP 5
    // SIGNAL EXTRACTION
    // --------------------------------------------------

    const signals =
        extractSignals(publicContentPackage);

    const evidenceSignals =
        buildEvidenceSignals(
            publicContentPackage
        );

    // --------------------------------------------------
    // STEP 6
    // PUBLIC SOURCE DISCOVERY
    // --------------------------------------------------
    //
    // Preserve user-supplied URLs AND discovered public
    // profile URLs. This is the evidence source list that
    // CrossEvidenceBrain will actually investigate.
    // --------------------------------------------------

    const discoveredSocialLinks =
        discoverSocialLinks(
            publicContentPackage
        );

    const sourceLinks =
        normalizeProfileLinks(
            "",
            [
                ...requestedProfileLinks,
                ...discoveredSocialLinks
            ]
        );

    console.log(
        "DISCOVERED_SOCIAL_LINKS",
        discoveredSocialLinks
    );

    console.log(
        "EVIDENCE_SOURCE_LINKS",
        sourceLinks
    );

    const discoveredProfiles =
        await crawlDiscoveredProfiles(
            discoveredSocialLinks
        );

    // --------------------------------------------------
    // STEP 7
    // CROSS EVIDENCE
    // --------------------------------------------------

    let crossEvidence = null;

    try {

        crossEvidence =
await loadCrossEvidenceBrain({
    profileLinks:
        sourceLinks.slice(0,20),

    footprintPackage
});
    } catch (error) {

        console.log(
            "CrossEvidenceBrain skipped:",
            error.message
        );

        crossEvidence = {
            success: false,
            reason: error.message
        };

    }
    const evidenceConfidence =
    calculateEvidenceConfidence({

        publicContentPackage,

        signals,

        socialLinks:
            discoveredSocialLinks

    });
    
    const evidenceSummary =
    generateEvidenceSummary({

        platform,

        signals,

        evidenceSignals,

        discoveredProfiles,

        evidenceConfidence

    });
    const evidenceGaps =
    findEvidenceGaps({

        publicContentPackage,

        discoveredProfiles

    });
    const patternSignals =
    generatePatternSignals({

        signals,

        evidenceSignals

    });
    const crossPlatformSignals =
    buildCrossPlatformSignals({

        platform,

        discoveredProfiles

    });
    const loop7EvidencePackage =
    buildLoop7EvidencePackage({

        profileLink: primaryProfileLink,

        profileLinks: requestedProfileLinks,

        sourceLinks,

        platform,

        evidenceSummary,

        patternSignals,

        crossPlatformSignals,
        crossEvidence,

        evidenceConfidence,

        evidenceGaps

    });
    // --------------------------------------------------
    // STEP 8
    // FINAL PACKAGE
    // --------------------------------------------------

    return {
    success: true,
    packageType: "DigitalFootprintPackage",
    profileLink: primaryProfileLink,
    profileLinks: requestedProfileLinks,
    footprintPackage,
   sourceLinks,
    platform,
    loop7EvidencePackage,

   universalPackage:
        crossEvidence?.universalPackage || null,

    generatedAt: new Date().toISOString()
};
        }
    
function normalizePublicUrl(value = "") {

    if (typeof value !== "string") {
        return "";
    }

    let cleaned =
        value
            .trim()
            .replace(/[),.;]+$/g, "");

    if (/^\/\//.test(cleaned)) {
        cleaned = `https:${cleaned}`;
    }

    if (!/^https?:\/\//i.test(cleaned)) {
        return "";
    }

    try {

        const url = new URL(cleaned);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return "";
        }

        return url.toString();

    } catch {

        return "";

    }

}

function normalizeProfileLinks(
    primaryLink = "",
    additionalLinks = []
) {

    const candidates = [];

    if (typeof primaryLink === "string") {
        candidates.push(primaryLink);
    }

    if (Array.isArray(additionalLinks)) {
        candidates.push(...additionalLinks);
    }

    const normalized = [];

    for (const candidate of candidates) {

        const url =
            normalizePublicUrl(candidate);

        if (!url) {
            continue;
        }

        normalized.push(url);

    }

    return [
        ...new Set(normalized)
    ].slice(0, 20);

}

function detectPlatform(profileLink = "") {

    try {

        const hostname =
            new URL(profileLink)
                .hostname
                .replace(/^www\./, "")
                .toLowerCase();

        if (hostname.includes("linkedin.com")) return "linkedin";
        if (hostname.includes("facebook.com")) return "facebook";
        if (hostname.includes("instagram.com")) return "instagram";

        if (
            hostname.includes("x.com") ||
            hostname.includes("twitter.com")
        ) return "x";

        if (hostname.includes("github.com")) return "github";

        if (
            hostname.includes("youtube.com") ||
            hostname.includes("youtu.be")
        ) return "youtube";

        if (hostname.includes("medium.com")) return "medium";

        if (hostname.includes("substack.com")) return "substack";

        if (hostname.includes("reddit.com")) return "reddit";

        if (hostname.includes("indiehackers.com"))
            return "indiehackers";

        if (hostname.includes("producthunt.com"))
            return "producthunt";

        if (hostname.includes("crunchbase.com"))
            return "crunchbase";

        if (hostname.includes("behance.net"))
            return "behance";

        if (hostname.includes("dribbble.com"))
            return "dribbble";

        if (hostname.includes("threads.net"))
            return "threads";

        if (hostname.includes("tiktok.com"))
            return "tiktok";

        if (hostname.includes("pinterest.com"))
            return "pinterest";

        if (hostname.includes("quora.com"))
            return "quora";

        if (hostname.includes("dev.to"))
            return "devto";

        if (hostname.includes("hashnode.com"))
            return "hashnode";

        if (hostname.includes("gitlab.com"))
            return "gitlab";

        return "website";

    } catch (error) {

        return "unknown";

    }

}
async function fetchPublicEvidence(profileLink) {

    try {

        const fetchPackage =
            await loadPublicContentFetcher({

                profileLinks: [profileLink]

            });
       console.log(
 "FETCH_PACKAGE",
 JSON.stringify(fetchPackage,null,2)
);

        const rawPackage =
            await acquirePublicContent(
                fetchPackage
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
console.log(
   "RAW_PACKAGE",
   JSON.stringify(rawPackage,null,2)
);

console.log(
   "VALIDATED_PACKAGE",
   JSON.stringify(validatedPackage,null,2)
);

console.log(
   "CLEAN_PACKAGE",
   JSON.stringify(cleanPackage,null,2)
);

console.log(
   "EXTRACTED_PACKAGE",
   JSON.stringify(extractedPackage,null,2)
);
        /*
         * IMPORTANT:
         * buildPublicContentPackage() intentionally keeps the final
         * evidence package compact. That means the original HTML
         * <a href="..."> links may not survive into the compact package.
         *
         * Extract social/profile URLs BEFORE the raw package is discarded
         * so websites containing multiple public platform links can feed
         * those sources into CrossEvidenceBrain.
         */
        const discoveredSocialLinks =
            extractSocialLinksFromFetchedPackage(
                rawPackage,
                extractedPackage
            );

        const builtPackage =
            buildPublicContentPackage(
                rawPackage,
                extractedPackage
            );

        return {
            ...builtPackage,
            discoveredSocialLinks
        };

    } catch (error) {

        return {

            success: false,

            stage: "Public Content Fetch",

            reason: error.message

        };

    }

                              }
function extractSignals(
    publicContentPackage = {}
) {

    const text = [

        publicContentPackage?.title || "",
        publicContentPackage?.description || "",
        publicContentPackage?.visibleText || ""

    ]
        .join("\n")
        .toLowerCase();

    const signalGroups = {

        ai: [
            "ai",
            "artificial intelligence",
            "machine learning",
            "llm",
            "gpt"
        ],

        founder: [
            "founder",
            "startup",
            "entrepreneur",
            "business"
        ],

        systems: [
            "system",
            "systems",
            "framework",
            "process"
        ],

        education: [
            "teach",
            "teaching",
            "education",
            "learn",
            "learning"
        ],

        marketing: [
            "marketing",
            "growth",
            "audience",
            "content"
        ]

    };

    const signals = [];

    for (const [name, keywords] of Object.entries(signalGroups)) {

        let count = 0;

        for (const keyword of keywords) {

            const matches =
                text.match(
                    new RegExp(
                        keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                        "gi"
                    )
                );

            count += matches?.length || 0;

        }

        if (count > 0) {

            signals.push({

                signal: name,

                mentions: count,

                confidence:
                    count >= 10
                        ? "High"
                        : count >= 5
                        ? "Medium"
                        : "Low"

            });

        }

    }

    return {

        success: true,

        textLength: text.length,

        signalCount: signals.length,

        signals

    };

}
function discoverSocialLinks(
    publicContentPackage = {}
) {

    console.log(
        "SOCIAL_DISCOVERY_KEYS",
        Object.keys(publicContentPackage || {})
    );

    const candidateUrls = [];

    const collectUrls = (value) => {

        if (!value) {
            return;
        }

        if (typeof value === "string") {

            if (/^https?:\/\//i.test(value)) {
                candidateUrls.push(value);
            }

            return;
        }

        if (Array.isArray(value)) {

            for (const item of value) {
                collectUrls(item);
            }

            return;
        }

        if (typeof value === "object") {

            const directUrl =
                value.url ||
                value.link ||
                value.href ||
                value.sourceUrl ||
                value.profileUrl ||
                value.website;

            if (
                typeof directUrl === "string" &&
                /^https?:\/\//i.test(directUrl)
            ) {
                candidateUrls.push(directUrl);
            }

            for (const nestedValue of Object.values(value)) {
                collectUrls(nestedValue);
            }

        }

    };

    collectUrls(publicContentPackage);

    console.log(
        "SOCIAL_DISCOVERY_CANDIDATES",
        candidateUrls
    );

    const discovered = [];

    for (const rawUrl of candidateUrls) {

        const url =
            normalizePublicUrl(rawUrl);

        if (!url) {
            continue;
        }

        const platform =
            detectPlatform(url);

        if (
            [
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
            ].includes(platform)
        ) {

            if (
                isLikelyPublicProfileUrl(
                    url,
                    platform
                )
            ) {
                discovered.push(url);
            }

        }

    }

    const uniqueLinks = [
        ...new Set(discovered)
    ];

    console.log(
        "DISCOVERED_SOCIAL_LINKS",
        uniqueLinks
    );

    return uniqueLinks;

               }
/*
 * Extract public platform URLs from the original fetched package.
 *
 * Why this exists:
 * A compact PublicContentPackage can contain visible text and signals
 * without retaining every HTML href. Social discovery must therefore
 * happen while raw HTML is still available.
 */
function extractSocialLinksFromFetchedPackage(
    rawPackage = {},
    extractedPackage = {}
) {

    const candidateUrls = [];

    const sources =
        Array.isArray(rawPackage?.sources)
            ? rawPackage.sources
            : [];

    for (const source of sources) {

    if (typeof source?.rawContent === "string") {
        candidateUrls.push(
            ...extractUrlsFromHtml(
                source.rawContent
            )
        );
    }

    if (Array.isArray(source?.links)) {
        candidateUrls.push(
            ...source.links
        );
    }

    if (Array.isArray(source?.socialLinks)) {
        candidateUrls.push(
            ...source.socialLinks
        );
    }
    }

    if (Array.isArray(extractedPackage?.links)) {

        candidateUrls.push(
            ...extractedPackage.links
        );

    }

    if (Array.isArray(extractedPackage?.sourceLinks)) {

        candidateUrls.push(
            ...extractedPackage.sourceLinks
        );

    }
   if (Array.isArray(source?.socialLinks)) {

    candidateUrls.push(
        ...source.socialLinks
    );

   }
   console.log(
    "EXTRACT_CANDIDATES",
    candidateUrls
);

    const discovered = [];

    for (const rawUrl of candidateUrls) {

        const url =
            normalizePublicUrl(rawUrl);

        if (!url) {
            continue;
        }

        const platform =
            detectPlatform(url);

        if (
            [
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
            ].includes(platform)
            &&
            isLikelyPublicProfileUrl(
                url,
                platform
            )
        ) {

            discovered.push(url);

        }

    }

    return [
        ...new Set(discovered)
    ];

}

function extractUrlsFromHtml(
    html = ""
) {

    if (typeof html !== "string" || !html) {
        return [];
    }

    const urls = [];

    /*
     * 1. href/src attributes — handles both single and double quotes.
     */
    const attributeMatches =
        html.match(
            /(?:href|src)\s*=\s*["']([^"']+)["']/gi
        ) || [];

    for (const match of attributeMatches) {

        const valueMatch =
            match.match(
                /["']([^"']+)["']\s*$/
            );

        if (valueMatch?.[1]) {
            urls.push(
                decodeHtmlUrl(
                    valueMatch[1]
                )
            );
        }

    }

    /*
     * 2. Plain absolute URLs inside HTML/embedded scripts.
     */
    const absoluteMatches =
        html.match(
            /https?:\/\/[^\s"'<>\\]+/gi
        ) || [];

    urls.push(
        ...absoluteMatches.map(
            decodeHtmlUrl
        )
    );

    /*
     * 3. Protocol-relative URLs such as //www.linkedin.com/in/...
     */
    const protocolRelativeMatches =
        html.match(
            /(?:["'(=]\s*)\/\/www\.[^\s"'<>\)]+/gi
        ) || [];

    for (const match of protocolRelativeMatches) {

        const cleaned =
            match.replace(
                /^[^/]*?\/\//,
                "//"
            );

        urls.push(
            decodeHtmlUrl(
                `https:${cleaned}`
            )
        );

    }

    return urls;

}

function decodeHtmlUrl(
    value = ""
) {

    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/&amp;/gi, "&")
        .replace(/&#x2F;/gi, "/")
        .replace(/&#47;/g, "/")
        .trim();

}

function isLikelyPublicProfileUrl(
    url = "",
    platform = ""
) {

    try {

        const parsed =
            new URL(url);

        const hostname =
            parsed.hostname
                .replace(/^www\./, "")
                .toLowerCase();

        const path =
            parsed.pathname
                .toLowerCase();

        /*
         * Reject obvious share/tracking/navigation endpoints.
         */
        const blockedFragments = [
            "/share",
            "/sharer",
            "/intent",
            "/login",
            "/signup",
            "/oauth",
            "/dialog"
        ];

        if (
            blockedFragments.some(
                fragment =>
                    path.includes(fragment)
            )
        ) {

            return false;

        }

        if (platform === "linkedin") {

            return (
                path.includes("/in/") ||
                path.includes("/company/") ||
                path.includes("/school/")
            );

        }

        if (platform === "facebook") {

            return (
                path.startsWith("/profile.php") ||
                (
                    path.length > 1 &&
                    !path.includes("/plugins/") &&
                    !path.includes("/events/")
                )
            );

        }

        if (platform === "instagram") {

            return (
                path.length > 1 &&
                !path.includes("/p/") &&
                !path.includes("/reel/") &&
                !path.includes("/explore/")
            );

        }

        if (platform === "x") {

            return (
                path.length > 1 &&
                !path.includes("/status/")
            );

        }

        if (platform === "github") {

            return (
                path.length > 1 &&
                !path.includes("/login") &&
                !path.includes("/settings")
            );

        }

        if (platform === "youtube") {

            return (
                path.includes("/@") ||
                path.includes("/channel/") ||
                path.includes("/c/") ||
                path.includes("/user/")
            );

        }

        if (platform === "medium") {

            return (
                path.includes("/@")
            );

        }

        if (platform === "substack") {

            return (
                hostname.endsWith(".substack.com") ||
                path.length > 1
            );

        }

        return false;

    } catch {

        return false;

    }

}
    function buildEvidenceSignals(
    publicContentPackage = {}
) {

    const text = [

        publicContentPackage?.title || "",
        publicContentPackage?.description || "",
        publicContentPackage?.visibleText || ""

    ]
        .join(" ")
        .toLowerCase();

    const stopWords = new Set([
        "the","and","for","with",
        "this","that","from",
        "have","will","your",
        "into","about","their",
        "they","them","been"
    ]);

    const words = text
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(
            word =>
                word &&
                word.length > 3 &&
                !stopWords.has(word)
        );

    const frequency = {};

    for (const word of words) {

        frequency[word] =
            (frequency[word] || 0) + 1;

    }

    const repeatedTopics =
        Object.entries(frequency)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 20)
            .map(([topic, count]) => ({
                topic,
                mentions: count
            }));

    return {

        success: true,

        repeatedTopics,

        uniqueTopics:
            Object.keys(frequency).length

    };

            }
    function calculateEvidenceConfidence({

    publicContentPackage,
    signals,
    socialLinks

}) {

    let score = 0;

    const textLength =
        publicContentPackage
            ?.visibleText
            ?.length || 0;

    score +=
        Math.min(
            40,
            Math.floor(textLength / 500)
        );

    score +=
        Math.min(
            30,
            signals?.signalCount * 5
        );

    score +=
        Math.min(
            30,
            socialLinks?.length * 3
        );

    if (score >= 70) {
        return "High";
    }

    if (score >= 40) {
        return "Medium";
    }

    return "Low";

                   }
async function crawlDiscoveredProfiles(
    socialLinks = []
) {

    const profiles = [];
    const seen = new Set();

    for (const rawUrl of socialLinks.slice(0, 20)) {

        try {

            const url =
                normalizePublicUrl(rawUrl);

            if (!url) {
                continue;
            }

            if (seen.has(url)) {
                continue;
            }

            seen.add(url);

            const platform =
                detectPlatform(url);

            if (
                platform === "unknown"
            ) {
                continue;
            }

            let username = null;

            try {

                const parsed =
                    new URL(url);

                const pathParts =
                    parsed.pathname
                        .split("/")
                        .filter(Boolean);

                username =
                    pathParts[0] || null;

            } catch {}

            profiles.push({

                url,

                platform,

                username,

                hostname:
                    (() => {
                        try {
                            return new URL(url).hostname;
                        } catch {
                            return null;
                        }
                    })(),

                discoveredAt:
                    new Date().toISOString()

            });

        } catch {

            continue;

        }

    }

    return {

        success: true,

        profiles,

        count:
            profiles.length,

        platforms:
            [...new Set(
                profiles.map(
                    item => item.platform
                )
            )]

    };

}
function buildIdentitySignals({

    platform,

    signals,

    evidenceSignals,

    discoveredProfiles

}) {

    const profiles =
        discoveredProfiles?.profiles || [];

    const platforms =
        [...new Set(
            profiles.map(
                item => item.platform
            )
        )];

    return {

        primaryPlatform:
            platform,

        signalCount:
            signals?.signalCount || 0,

        repeatedTopicCount:
            evidenceSignals
                ?.repeatedTopics
                ?.length || 0,

        discoveredProfiles:
            profiles.length,

        discoveredPlatforms:
            platforms,

        crossPlatformPresence:
            platforms.length > 1,

        usernames:
            profiles
                .map(
                    item => item.username
                )
                .filter(Boolean),

        profileLinks:
            profiles
                .map(
                    item => item.url
                )
                .filter(Boolean)

    };

}
function generateEvidenceSummary({

    platform,
    signals,
    evidenceSignals,
    discoveredProfiles,
    evidenceConfidence

}) {

    const topTopics =
        evidenceSignals?.repeatedTopics
            ?.slice(0, 10)
            ?.map(item => item.topic) || [];

    const topSignals =
        signals?.signals
            ?.sort(
                (a, b) =>
                    b.mentions - a.mentions
            )
            ?.slice(0, 10) || [];

    return {

        primaryPlatform:
            platform,

        confidence:
            evidenceConfidence,

        topTopics,

        topSignals,

        discoveredProfiles:
            discoveredProfiles?.count || 0

    };

}
function findEvidenceGaps({

    publicContentPackage,
    discoveredProfiles

}) {

    const gaps = [];

    const textLength =
        publicContentPackage
            ?.visibleText
            ?.length || 0;

    if (textLength < 1000) {

        gaps.push(
            "Limited public content"
        );

    }

    if (
        !discoveredProfiles?.count
    ) {

        gaps.push(
            "No connected public profiles"
        );

    }

    return gaps;

        }
function generatePatternSignals({

    signals,
    evidenceSignals

}) {

    const repeatedTopics =
        evidenceSignals?.repeatedTopics || [];

    const repeatedThemes =
        signals?.signals || [];

    const repeatedLanguage =
        repeatedTopics
            .slice(0, 10)
            .map(item => item.topic);

    const repeatedFocusAreas =
        repeatedThemes
            .map(item => item.signal);

    return {

        repeatedTopics,

        repeatedThemes,

        repeatedLanguage,

        repeatedFocusAreas,

        confidence:
            repeatedTopics.length >= 10
                ? "High"
                : repeatedTopics.length >= 5
                ? "Medium"
                : "Low"

    };

        }
function buildCrossPlatformSignals({

    platform,
    discoveredProfiles

}) {

    const profiles =
        discoveredProfiles?.profiles || [];

    const platforms =
        profiles
            .map(item => item.platform)
            .filter(Boolean);

    const uniquePlatforms =
        [...new Set([
            platform,
            ...platforms
        ].filter(Boolean))];

    return {

        totalPlatforms:
            uniquePlatforms.length,

        platforms:
            uniquePlatforms,

        multiPlatformPresence:
            uniquePlatforms.length > 1,

        discoveredProfiles:
            profiles.length,

        profileLinks:
            profiles
                .map(item => item.url)
                .filter(Boolean),

        usernames:
            profiles
                .map(item => item.username)
                .filter(Boolean)

    };

       }
function buildLoop7EvidencePackage({

    profileLink,
    profileLinks,
    sourceLinks,
    platform,

    evidenceSummary,
    patternSignals,

    crossPlatformSignals,
    crossEvidence,

    evidenceConfidence,
    evidenceGaps

}) {

    return {

        packageType:
            "Loop7EvidencePackage",

        contractVersion:
            "L7EP-1.0",

        generatedAt:
            new Date().toISOString(),

        profileLink,

        profileLinks,

        sourceLinks,

        platform,

        evidenceSummary,

        patternSignals,

        crossPlatformSignals,
        crossEvidence,

        evidenceConfidence,

        evidenceGaps

    };

}

        


// ============================================================
// FINAL INVESTIGATION CONTRACT PATCH
// Universal Source Discovery
// Top 5 Evidence Selection
// Evidence Coverage Scoring
// Universal Package Export
// ============================================================

function classifySourceType(url = "") {
    const value = String(url).toLowerCase();
    if (value.includes("linkedin")) return "social";
    if (value.includes("facebook")) return "social";
    if (value.includes("instagram")) return "social";
    if (value.includes("x.com")) return "social";
    if (value.includes("github")) return "developer";
    if (value.includes("youtube")) return "video";
    if (value.includes("reddit")) return "community";
    if (value.includes("medium")) return "blog";
    if (value.includes("substack")) return "blog";
    return "website";
}

function calculateCoverageScore(source = {}) {
    let score = 0;
    if (source.title) score += 20;
    if (source.description) score += 15;
    if (source.visibleText || source.rawContent) score += 25;
    if (source.signals?.length) score += 20;
    if (source.crossReferences > 0) score += 20;
    return Math.min(score, 100);
}

function rankEvidenceSources(sources = []) {
    return sources
        .map(source => ({
            ...source,
            evidenceScore: calculateCoverageScore(source)
        }))
        .sort((a,b) => b.evidenceScore - a.evidenceScore);
}

function selectTopEvidenceSources(rankedSources = []) {
    return rankedSources.slice(0,5);
}
