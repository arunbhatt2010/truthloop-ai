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

} = {})

    console.log("===== DIGITAL FOOTPRINT BRAIN v2 =====");

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

    if (
        typeof profileLink !== "string" ||
        !profileLink.trim()
    ) {

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

    const platform = detectPlatform(profileLink);

    // --------------------------------------------------
    // STEP 4
    // PUBLIC CONTENT FETCH
    // --------------------------------------------------

    const publicContentPackage =
        await fetchPublicEvidence(profileLink);

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
    // SOCIAL LINK DISCOVERY
    // --------------------------------------------------

    const socialLinks =
        discoverSocialLinks(publicContentPackage);
    const discoveredProfiles =
    await crawlDiscoveredProfiles(
        socialLinks
    );

    // --------------------------------------------------
    // STEP 7
    // CROSS EVIDENCE
    // --------------------------------------------------

    let crossEvidence = null;

try {

    crossEvidence =
        await loadCrossEvidenceBrain({

            platform,

            signals,

            socialLinks,

            publicContentPackage,

            truthLoopPackage

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

        socialLinks

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

        profileLink,

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

    packageType:
        "DigitalFootprintPackage",

    profileLink,

    platform,

    loop7EvidencePackage,

    generatedAt:
        new Date().toISOString()

};
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

    return [

        ...new Set(urls)

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

        platform,

        evidenceSummary,

        patternSignals,

        crossPlatformSignals,
        crossEvidence,

        evidenceConfidence,

        evidenceGaps

    };

        }
