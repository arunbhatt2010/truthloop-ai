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

    const contentDiscovery = {
        articles: [],
        posts: [],
        videos: [],
        profiles: [],
        repositories: [],
        traceability: []
    };

    for (const url of sourceCandidates) {

        const lower = String(url).toLowerCase();

        if (
            lower.includes("/blog/") ||
            lower.includes("/article/") ||
            lower.includes("/articles/") ||
            lower.includes("/post/")
        ) {
            contentDiscovery.articles.push(url);
        }

        else if (
            lower.includes("/posts/") ||
            lower.includes("/activity/") ||
            lower.includes("/status/")
        ) {
            contentDiscovery.posts.push(url);
        }

        else if (
            lower.includes("youtube.com/watch") ||
            lower.includes("/video/") ||
            lower.includes("/videos/")
        ) {
            contentDiscovery.videos.push(url);
        }

        else if (
            lower.includes("linkedin.com/") ||
            lower.includes("x.com/") ||
            lower.includes("twitter.com/") ||
            lower.includes("facebook.com/") ||
            lower.includes("instagram.com/")
        ) {
            contentDiscovery.profiles.push(url);
        }

        else if (
            lower.includes("github.com/")
        ) {
            contentDiscovery.repositories.push(url);
        }

        contentDiscovery.traceability.push({
            sourceUrl: primaryLink,
            discoveredUrl: url
        });
    }

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

        contentDiscovery,

        discoveredProfiles:
            sourceCandidates.map(url => ({
                url,
                platform: "unknown"
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

async function discoverContentUrls({
    sourceUrl,
    html,
    visibleText,
    links = []
}) {

    const discovered = {
        articles: [],
        posts: [],
        videos: [],
        profiles: [],
        repositories: [],
        traceability: []
    };

    for (const url of links) {

        const lower = url.toLowerCase();

        // Article / Blog
        if (
            lower.includes("/blog/") ||
            lower.includes("/article/") ||
            lower.includes("/articles/") ||
            lower.includes("/post/")
        ) {
            discovered.articles.push(url);
        }

        // Social Posts
        else if (
            lower.includes("/posts/") ||
            lower.includes("/status/") ||
            lower.includes("/activity/") ||
            lower.includes("/updates/")
        ) {
            discovered.posts.push(url);
        }

        // Videos
        else if (
            lower.includes("youtube.com/watch") ||
            lower.includes("/video/") ||
            lower.includes("/videos/")
        ) {
            discovered.videos.push(url);
        }

        // Profiles
        else if (
            lower.includes("linkedin.com/in/") ||
            lower.includes("x.com/") ||
            lower.includes("twitter.com/") ||
            lower.includes("instagram.com/") ||
            lower.includes("facebook.com/")
        ) {
            discovered.profiles.push(url);
        }

        // Repositories
        else if (
            lower.includes("github.com/")
        ) {
            discovered.repositories.push(url);
        }

        discovered.traceability.push({
            sourceUrl,
            discoveredUrl: url
        });
    }

    return {
        success: true,
        ...discovered
    };
       }
