/* ============================================================
   FOOTPRINT SUPPORT v3 (FROZEN)
   Discovery Only

   TruthLoop Architecture

   FootprintSupport
      -> Discovery Package

   DFB
      -> Evidence Collection + Ranking

   CrossEvidence
      -> Pattern Validation

   chat.js
      -> Final Report

   No OAuth
   No Connected Apps
   No Private Data
============================================================ */

export async function loadFootprintSupport({
    profileLinks = [],
    currentLoop = 7
} = {}) {

    const normalizedLinks = Array.isArray(profileLinks)
        ? profileLinks
              .map(link => String(link || "").trim())
              .filter(Boolean)
        : [];

    if (!normalizedLinks.length) {
        return {
            success: false,
            stage: "Footprint Support",
            reason: "At least one profile link is required."
        };
    }

    const primaryLink = normalizedLinks[0];

    let hostname = "";

    try {
        hostname = new URL(primaryLink)
            .hostname
            .replace(/^www\./, "")
            .toLowerCase();
    } catch {
        return {
            success: false,
            stage: "Footprint Support",
            reason: "Invalid profile link."
        };
    }

    const platformRules = [
        ["linkedin.com", "linkedin"],
        ["github.com", "github"],
        ["x.com", "x"],
        ["twitter.com", "x"],
        ["facebook.com", "facebook"],
        ["instagram.com", "instagram"],
        ["youtube.com", "youtube"],
        ["reddit.com", "reddit"],
        ["medium.com", "medium"],
        ["substack.com", "substack"]
    ];

    let platform = "website";

    for (const [domain, name] of platformRules) {
        if (hostname.includes(domain)) {
            platform = name;
            break;
        }
    }

    const sourceCandidates = [...new Set(normalizedLinks)];

    return {
    success: true,
    stage: "Footprint Support",
    discoveryReady: true,

    currentLoop,

    profileLink: primaryLink,
    profileLinks: normalizedLinks,

    hostname,
    platform,

    sourceCandidates,

    discoveredProfiles:
        sourceCandidates.map(url => ({
            url,
            platform:
                detectPlatform(url)
        })),

    discoveredLinks:
        sourceCandidates,

    discoveryStats: {
        primarySource: primaryLink,
        totalInputLinks:
            normalizedLinks.length,
        totalCandidates:
            sourceCandidates.length,
        discoveredProfiles:
            sourceCandidates.length
    }
};
}
