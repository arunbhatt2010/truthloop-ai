/* ============================================================
   LOOP 7 EVIDENCE ROUTING UPDATE
   - Preserve multiple user-supplied public URLs.
   - Preserve discovered public profile URLs.
   - Pass the combined verified source list to CrossEvidenceBrain.
   - Keep source URLs visible in the returned Loop 7 package.
============================================================ */

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

    const evidenceSourceLinks =
        normalizeProfileLinks(
            "",
            [
                ...requestedProfileLinks,
                ...discoveredSocialLinks
            ]
        );

    console.log(
        "EVIDENCE_SOURCE_LINKS",
        evidenceSourceLinks
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
                    evidenceSourceLinks.slice(0, 20)

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

        evidenceSourceLinks,

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
    evidenceSourceLinks,
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

    const cleaned =
        value
            .trim()
            .replace(/[),.;]+$/g, "");

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

        if (hostname.includes("linkedin.com")) {
            return "linkedin";
        }

        if (hostname.includes("facebook.com")) {
            return "facebook";
        }

        if (hostname.includes("instagram.com")) {
            return "instagram";
        }

        if (
            hostname.includes("x.com") ||
            hostname.includes("twitter.com")
        ) {
            return "x";
        }

        if (hostname.includes("github.com")) {
            return "github";
        }

        if (hostname.includes("youtube.com")) {
            return "youtube";
        }

        if (hostname.includes("medium.com")) {
            return "medium";
        }

        if (hostname.includes("substack.com")) {
            return "substack";
        }

        return "website";

    } catch {

        return "unknown";

    }

        }
async function fetchPublicEvidence(profileLink) {

    try {

        const fetchPackage =
            await loadPublicContentFetcher({

                profileLinks: [profileLink]

            });

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

        return buildPublicContentPackage(
            rawPackage,
            extractedPackage
        );

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

    const text = JSON.stringify(
        publicContentPackage || {}
    );

    const urls =
        text.match(
            /https?:\/\/[^\s"'<>]+/gi
        ) || [];

    const discovered = [];

    for (const rawUrl of urls) {

        const url =
            normalizePublicUrl(rawUrl);

        if (!url) {
            continue;
        }

        const platform =
            detectPlatform(url);

        // Only identifiable public profile/platform URLs
        // become discovered evidence sources. Internal
        // website assets, tracking URLs, and share links
        // must not flood CrossEvidenceBrain.
        if (
            [
                "linkedin",
                "facebook",
                "instagram",
                "x",
                "github",
                "youtube",
                "medium",
                "substack"
            ].includes(platform)
        ) {

            discovered.push(url);

        }

    }

    return [
        ...new Set(discovered)
    ];

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

    for (const url of socialLinks.slice(0, 10)) {

        try {

            const platform =
                detectPlatform(url);

            if (
                platform === "unknown"
            ) {
                continue;
            }

            profiles.push({

                url,

                platform

            });

        } catch {

            continue;

        }

    }

    return {

        success: true,

        profiles,

        count: profiles.length

    };

}
function buildIdentitySignals({

    platform,

    signals,

    evidenceSignals,

    discoveredProfiles

}) {

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
            discoveredProfiles
                ?.count || 0

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

    const platforms =
        discoveredProfiles?.profiles
            ?.map(item => item.platform) || [];

    const uniquePlatforms =
        [...new Set([
            platform,
            ...platforms
        ])];

    return {

        totalPlatforms:
            uniquePlatforms.length,

        platforms:
            uniquePlatforms,

        multiPlatformPresence:
            uniquePlatforms.length > 1

    };

        }
function buildLoop7EvidencePackage({

    profileLink,
    profileLinks,
    evidenceSourceLinks,
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

        evidenceSourceLinks,

        platform,

        evidenceSummary,

        patternSignals,

        crossPlatformSignals,
        crossEvidence,

        evidenceConfidence,

        evidenceGaps

    };

        }
