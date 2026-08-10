/*
═══════════════════════════════════════════════════════════════
PUBLIC CONTENT FETCHER
TruthLoop AI
Version : 1.0
Purpose : Universal Public Content Acquisition Layer
═══════════════════════════════════════════════════════════════

MISSION
--------
Collect publicly available content from the routed source
and normalize it for downstream AI analysis.

CORE PRINCIPLES
---------------
1. Universal
   Support any public platform through routing.

2. Public Evidence Only
   Never bypass authentication.
   Never scrape restricted content.

3. Fetch Only
   Never perform AI reasoning.
   Never detect patterns.
   Never generate conclusions.

4. Normalize
   Convert every source into one common content package.

5. Evidence First
   Return only observable public information.

6. Safe
   Ignore scripts, tracking, ads and executable code.

7. Traceable
   Preserve source metadata for verification.

8. Extensible
   New platforms should plug in without changing
   existing fetch logic.

9. Fail Gracefully
   Return structured errors instead of guessing.

10. TruthLoop Standard
    Evidence first.
    Conclusions later.
    Never invent information.

INPUT
-----
Routing Package

OUTPUT
------
Normalized Public Content Package

Fetcher never performs AI analysis.

═══════════════════════════════════════════════════════════════
*/
function detectPlatform(url = "") {

    const hostname =
        new URL(url).hostname.toLowerCase();

    if (hostname.includes("linkedin.com"))
        return "linkedin";

    if (hostname.includes("github.com"))
        return "github";

    if (hostname.includes("facebook.com"))
        return "facebook";

    if (hostname.includes("instagram.com"))
        return "instagram";

    if (hostname.includes("x.com"))
        return "x";

    if (hostname.includes("twitter.com"))
        return "x";

    if (hostname.includes("youtube.com"))
        return "youtube";

    if (hostname.includes("medium.com"))
        return "medium";

    if (hostname.includes("substack.com"))
        return "substack";

    return "website";
        }


export async function loadPublicContentFetcher({
    profileLinks = []
}) {

    const result = {

        success: false,

        valid: false,

        platforms: [],

        validLinks: [],

        invalidLinks: [],

        totalLinks: 0,

        reason: null

    };

    try {

        result.totalLinks = profileLinks.length;

        for (const link of profileLinks) {

            try {

                const parsed =
                    new URL(String(link).trim());
               const detectedPlatform =
    detectPlatform(parsed.href);

result.platforms.push(detectedPlatform);

result.validLinks.push({
    url: parsed.href,
    hostname: parsed.hostname,
    platform: detectedPlatform
});
                const protocol =
                    parsed.protocol.toLowerCase();

                if (
                    protocol !== "http:" &&
                    protocol !== "https:"
                ) {
                    result.invalidLinks.push(link);
                    continue;
                }

                const hostname =
                    parsed.hostname.toLowerCase();

                let platform = "website";

                if (hostname.includes("linkedin")) {
                    platform = "linkedin";
                }

                else if (hostname.includes("github")) {
                    platform = "github";
                }

                else if (hostname.includes("facebook")) {
                    platform = "facebook";
                }

                else if (hostname.includes("instagram")) {
                    platform = "instagram";
                }

                else if (
                    hostname.includes("x.com") ||
                    hostname.includes("twitter")
                ) {
                    platform = "x";
                }

                else if (
                    hostname.includes("youtube")
                ) {
                    platform = "youtube";
                }

                result.platforms.push(platform);

                result.validLinks.push({

                    url: parsed.href,

                    hostname,

                    platform

                });

            } catch {

                result.invalidLinks.push(link);
            }

        }

        result.valid =
            result.validLinks.length > 0;

        result.success =
            result.validLinks.length > 0;

        if (!result.success) {
            result.reason =
                "No valid public profile links found.";
        }

        return result;

    } catch {

        result.reason =
            "Public profile processing failed.";

        return result;

    }

}
export async function acquirePublicContent(urlPackage) {

    const result = {

        success: false,

        sources: [],

evidenceCount: 0,

        status: null,

        contentType: null,

        contentLength: 0,

        rawContent: null,

        fetchedAt: null,

        reason: null

    };

    try {

        if (!urlPackage.success) {

            result.reason = "Invalid URL package.";

            return result;

        }

        for (const source of urlPackage.validLinks) {

    try {

        const response =
            await fetch(source.url, {

                method: "GET",

                redirect: "follow",

                headers: {
                    "User-Agent":
                    "TruthLoop Public Content Fetcher"
                }

            });

        if (!response.ok) {
            continue;
        }

        const html =
            await response.text();

        result.sources.push({

            url: source.url,

            platform: source.platform,

            hostname: source.hostname,

            status: response.status,

            contentType:
                response.headers.get(
                    "content-type"
                ),

            rawContent: html

        });

    } catch {

        continue;

    }

        }
        result.evidenceCount =
    result.sources.length;

result.success =
    result.sources.length > 0;
       result.platforms =
    [...new Set(
        result.sources.map(
            source => source.platform
        )
    )];

result.fetchedAt =
    new Date().toISOString();

if (!result.success) {

    result.reason =
        "No public evidence collected.";

}

return result;

} catch (error) {

    result.reason = error.message;

    return result;

}

}
/*
==============================================================
BLOCK 3
PART 1
CONTENT VALIDATION
==============================================================

MISSION
-------
Validate the acquired public content before normalization.

RESPONSIBILITIES
----------------
1. Validate acquisition result.
2. Validate response status.
3. Validate content type.
4. Validate content size.
5. Validate raw content.
6. Return validated content package.

RULES
-----
• Never clean content.
• Never extract content.
• Never modify content.
• Never execute HTML.
• Never execute JavaScript.
• Never call AI.
• Never guess missing data.
• Fail safely.

INPUT
-----
Raw Public Content Package

OUTPUT
------
Validated Public Content Package

{
    success,
    valid,
    reason,
    rawContent
}

==============================================================
*/
export function validatePublicContent(rawPackage) {

    const result = {

        success: false,

        valid: false,

        sources: [],

        rawContent: null,

        contentType: null,

        url: null,

        reason: null

    };

    if (!rawPackage?.success) {

        result.reason =
            "Public content acquisition failed.";

        return result;

    }

    if (
        !Array.isArray(rawPackage.sources) ||
        rawPackage.sources.length === 0
    ) {

        result.reason =
            "No public evidence sources found.";

        return result;

    }

    result.sources =
        rawPackage.sources.filter(source =>
            source.status === 200 &&
            source.rawContent &&
            source.contentType?.includes("text/html")
        );

    if (result.sources.length === 0) {

        result.reason =
            "No valid public evidence found.";

        return result;

    }

    // Primary source for downstream pipeline
    const primarySource = result.sources[0];

    result.rawContent =
        primarySource?.rawContent || null;

    result.contentType =
        primarySource?.contentType || null;

    result.url =
        primarySource?.url || null;

    result.success = true;

    result.valid = true;
console.log(
    "VALIDATED_PACKAGE_DEBUG",
    JSON.stringify({
        success: result.success,
        valid: result.valid,
        sourceCount: result.sources.length,
        rawContentLength:
            result.rawContent?.length || 0
    }, null, 2)
);
    return result;
}
/*
==============================================================
BLOCK 3
PART 2
CONTENT CLEANING
==============================================================

MISSION
-------
Remove non-readable and non-essential content while
preserving original public evidence.

RESPONSIBILITIES
----------------
1. Remove executable content.
2. Remove presentation content.
3. Remove tracking elements.
4. Normalize whitespace.
5. Preserve readable HTML.

RULES
-----
• Never execute HTML.
• Never execute JavaScript.
• Never modify readable content.
• Never summarize.
• Never call AI.
• Preserve evidence integrity.

INPUT
-----
Validated Public Content Package

OUTPUT
------
Clean Public Content Package
==============================================================
*/

export function cleanPublicContent(validatedPackage) {

    const result = {

        success: false,

        cleanContent: null,

        reason: null

    };

    if (!validatedPackage?.success) {

        result.reason = "Content validation failed.";

        return result;

    }

    let html = validatedPackage.rawContent || "";

    if (!html) {

        result.reason = "No raw content found.";

        return result;

    }

    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");

    html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

    html = html.replace(/<svg[\s\S]*?<\/svg>/gi, "");

    html = html.replace(/<canvas[\s\S]*?<\/canvas>/gi, "");

    html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

    html = html.replace(/\s+/g, " ").trim();

    result.success = true;

    result.cleanContent = html;

    return result;

                        }
/*
==============================================================
BLOCK 3
PART 3
CONTENT EXTRACTION
==============================================================

MISSION
-------
Extract structured public evidence from cleaned HTML.

RESPONSIBILITIES
----------------
1. Extract title.
2. Extract meta description.
3. Extract canonical URL.
4. Extract language.
5. Extract headings.
6. Extract links.
7. Extract image metadata.
8. Extract visible text.

RULES
-----
• Never modify content.
• Never summarize.
• Never infer missing information.
• Never execute HTML.
• Never call AI.
• Preserve extracted evidence.

INPUT
-----
Clean Public Content Package

OUTPUT
------
Structured Public Content Package
==============================================================
*/

export function extractPublicContent(cleanPackage) {

    const result = {

        success: false,

        title: null,

        description: null,

        canonicalUrl: null,

        language: null,

        headings: [],

        links: [],

        images: [],

        visibleText: null,
       posts: [],

comments: [],

articles: [],

communities: [],

timeline: [],

activity: [],

        reason: null

    };

    if (!cleanPackage?.success) {

        result.reason = "Content cleaning failed.";

        return result;

    }

    const html = cleanPackage.cleanContent;

    result.title =
        html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || null;

    result.description =
        html.match(
            /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
        )?.[1]?.trim() || null;

    result.canonicalUrl =
        html.match(
            /<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i
        )?.[1]?.trim() || null;

    result.language =
        html.match(/<html[^>]*lang=["'](.*?)["']/i)?.[1]?.trim() || null;

    result.headings =
        [...html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi)]
        .map(match => match[1].replace(/<[^>]+>/g, "").trim())
        .filter(Boolean);

    result.links =
        [...html.matchAll(/<a[^>]*href=["'](.*?)["']/gi)]
        .map(match => match[1])
        .filter(Boolean);

    result.images =
        [...html.matchAll(/<img[^>]*src=["'](.*?)["']/gi)]
        .map(match => ({
            src: match[1]
        }));

    result.visibleText =
        html.replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
   result.posts = extractPosts(html);

result.comments = extractComments(html);

result.articles = extractArticles(html);

result.communities = extractCommunities(html);

result.timeline = extractTimeline(html);

result.activity = extractActivity(html);

    result.success = true;

    return result;

}

function extractPosts(html) {

    const matches =
        [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)]
        .map(match =>
            match[1]
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(text => text.length > 50);

    return matches.slice(0, 50);
}

function extractComments(html) {
    return [];
}

function extractArticles(html) {

    const matches =
        [...html.matchAll(/<article[\s\S]*?<\/article>/gi)]
        .map(match =>
            match[0]
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(text => text.length > 100);

    return matches.slice(0, 20);
}

function extractCommunities(html) {
    return [];
}

function extractTimeline(html) {
    return [];
}

function extractActivity(html) {
    return [];
}
/*
==============================================================
BLOCK 3
PART 4
PACKAGE BUILDER
==============================================================

MISSION
-------
Build the final normalized public content package for
DigitalFootprintBrain.

RESPONSIBILITIES
----------------
1. Validate extracted content.
2. Build standardized package.
3. Preserve acquisition metadata.
4. Add normalization timestamp.
5. Return final normalized package.

RULES
-----
• Never modify extracted evidence.
• Never summarize.
• Never infer missing information.
• Never call AI.
• Never execute HTML.
• Preserve evidence integrity.

INPUT
-----
Raw Public Content Package
Structured Public Content Package

OUTPUT
------
Normalized Public Content Package
==============================================================
*/

export function buildPublicContentPackage(
    rawPackage,
    extractedPackage
) {

    const result = {

        success: false,

        source: "public",

        url: rawPackage?.url || null,

        status: rawPackage?.status || null,

        contentType: rawPackage?.contentType || null,

        contentLength: rawPackage?.contentLength || 0,

        fetchedAt: rawPackage?.fetchedAt || null,
       

        title: null,

        description: null,

        canonicalUrl: null,

        language: null,

        headings: [],

        links: [],

        images: [],

        visibleText: null,

        normalizedAt: null,
posts: [],

comments: [],

articles: [],

communities: [],

timeline: [],

activity: [],
       evidenceCount: 0,
        reason: null

    };

    if (!rawPackage?.success) {

        result.reason = "Invalid raw content package.";

        return result;

    }

    if (!extractedPackage?.success) {

        result.reason = "Content extraction failed.";

        return result;

    }

    result.title = extractedPackage.title;

    result.description = extractedPackage.description;

    result.canonicalUrl = extractedPackage.canonicalUrl;

    result.language = extractedPackage.language;

    result.headings = extractedPackage.headings;

    result.links = extractedPackage.links;

    result.images = extractedPackage.images;

    result.visibleText = extractedPackage.visibleText;
result.posts = extractedPackage.posts || [];

result.comments = extractedPackage.comments || [];

result.articles = extractedPackage.articles || [];

result.communities = extractedPackage.communities || [];

result.timeline = extractedPackage.timeline || [];

result.activity = extractedPackage.activity || [];
   result.evidenceCount =
    result.posts.length +
    result.comments.length +
    result.articles.length +
    result.communities.length +
    result.timeline.length +
    result.activity.length;
    result.normalizedAt =
        new Date().toISOString();

    result.success = true;

    return result;

           }

export function buildUnifiedEvidencePackage(
    fetchedPackage
) {

    const result = {

        success: false,

        sources: [],

        platforms: [],

        evidenceCount: 0,

        visibleText: "",

        posts: [],

        comments: [],

        articles: [],

        communities: [],

        timeline: [],

        activity: [],

        reason: null

    };

    if (!fetchedPackage?.success) {

        result.reason =
            "Evidence collection failed.";

        return result;

    }

    result.sources =
        fetchedPackage.sources || [];

    result.platforms =
        fetchedPackage.platforms || [];

    result.evidenceCount =
        fetchedPackage.evidenceCount || 0;

    result.success = true;

    return result;

       }
