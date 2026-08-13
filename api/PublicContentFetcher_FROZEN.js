/*
============================================================
PUBLIC CONTENT FETCHER v3 (FROZEN)
TruthLoop Investigation Pipeline

Responsibility:
Fetch -> Clean -> Extract -> Export

No OAuth
No Connected Apps
No Pattern Detection
No Ranking
No Report Generation
============================================================
*/

function detectPlatform(url = "") {
    try {
        const hostname = new URL(url).hostname.toLowerCase();

        if (hostname.includes("linkedin.com")) return "linkedin";
        if (hostname.includes("github.com")) return "github";
        if (hostname.includes("facebook.com")) return "facebook";
        if (hostname.includes("instagram.com")) return "instagram";
        if (hostname.includes("x.com") || hostname.includes("twitter.com")) return "x";
        if (hostname.includes("youtube.com")) return "youtube";
        if (hostname.includes("medium.com")) return "medium";
        if (hostname.includes("substack.com")) return "substack";

        return "website";
    } catch {
        return "unknown";
    }
}

function extractText(html = "") {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractSocialLinks(html = "") {
    const matches = html.match(/https?:\/\/[^\s"'<>]+/gi) || [];

    return [...new Set(
        matches.filter(link =>
            /(linkedin|github|facebook|instagram|x\.com|twitter|youtube|medium|substack)/i.test(link)
        )
    )];
}

export async function loadPublicContentFetcher({
    profileLinks = []
} = {}) {

    const sources = [];

    for (const url of profileLinks) {

        try {

            const response = await fetch(url);

            const html = await response.text();

            const title =
                html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || null;

            const description =
                html.match(
                    /<meta[^>]+name=["']description["'][^>]+content=["']([^"]+)["']/i
                )?.[1] || null;

            const visibleText = extractText(html);

            const socialLinks = extractSocialLinks(html);

            sources.push({
                sourceUrl: url,
                platform: detectPlatform(url),
                status: response.status,
                title,
                description,
                visibleText,
                socialLinks,
                contentLength: visibleText.length,
                fetchTimestamp: new Date().toISOString()
            });

        } catch (error) {

            sources.push({
                sourceUrl: url,
                platform: detectPlatform(url),
                status: 0,
                error: error.message
            });

        }
    }

    return {
        success: true,
        stage: "Public Content Fetcher",
        sourceCount: sources.length,
        sources
    };
}
