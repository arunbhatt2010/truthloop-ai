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
    currentLoop = 7,
    truthLoopPackage = {}

} = {}) {

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

    // --------------------------------------------------
    // STEP 6
    // SOCIAL LINK DISCOVERY
    // --------------------------------------------------

    const socialLinks =
        discoverSocialLinks(publicContentPackage);

    // --------------------------------------------------
    // STEP 7
    // CROSS EVIDENCE
    // --------------------------------------------------

    const crossEvidence =
        await loadCrossEvidenceBrain({

            platform,

            signals,

            socialLinks,

            publicContentPackage,

            truthLoopPackage

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

        publicContentPackage,

        socialLinks,

        signals,

        crossEvidence,

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

        publicContentPackage?.title,
        publicContentPackage?.description,
        publicContentPackage?.visibleText

    ]
        .filter(Boolean)
        .join("\n");

    return {

        success: true,

        textLength: text.length,

        evidenceText: text

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
