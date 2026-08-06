/*═══════════════════════════════════════════════════════════════
PUBLIC CONTENT FETCHER
TruthLoop AI

Version : 2.0
Standard : TruthLoop Public Evidence Standard (TES)

MISSION

Discover, collect and normalize every verified public signal
that is accessible from the supplied Evidence Source.

The investigation target is always the evidence,
never the platform.

This module never performs investigation.

It only builds one reusable Public Evidence Package.

DEFAULT COLLECTION WINDOW

Most recent 90 days.

If verified evidence is insufficient:

• 6 Months
• 12 Months
• Lifetime (only when necessary)

Always prioritize recent evidence.

Stop collecting when sufficient verified evidence
has been obtained.

PUBLIC SIGNALS MAY INCLUDE

• Public Profile
• Public Bio
• Headline
• About
• Public Posts
• Public Comments
• Public Articles
• Public Projects
• Public Websites
• Public Documents
• Public Videos
• Public Podcasts
• Public Interviews
• Public Communities
• Public Business Pages
• Public Media Mentions
• Public Links
• Public Timeline
• Public Activity History
• Any other verified public signal

NEVER COLLECT

• Private Messages
• Login-only Content
• Restricted Pages
• Hidden APIs
• Deleted Content
• Fabricated Evidence
• Assumed Psychology

CORE PRINCIPLES

Evidence First

Collect verified public signals.

Preserve traceability.

Ignore duplicate signals.

Ignore advertisements.

Ignore navigation.

Ignore decorative content.

Ignore tracking.

Ignore content without investigative value.

Never perform AI reasoning.

Never detect patterns.

Never generate conclusions.

OUTPUT

One reusable Public Evidence Package.
═══════════════════════════════════════════════════════════════*/
export async function loadPublicContentFetcher({
    url = ""
}) {

    const result = {
    success: false,

    // Source
    originalUrl: url,
    normalizedUrl: null,
    protocol: null,
    hostname: null,
    platform: "unknown",

    // TES
    sourceType: "PublicEvidence",
    collectionWindow: "90 Days",
    evidenceStandard: "TES-1.0",

    // Status
    valid: false,
    reason: null
};

    try {

        url = String(url).trim();

        if (!url) {
            result.reason = "Public URL is required.";
            return result;
        }

        const parsed = new URL(url);
const protocol = parsed.protocol.toLowerCase();

if (protocol !== "http:" && protocol !== "https:") {
    result.reason = "Only HTTP and HTTPS URLs are supported.";
    return result;
       }
       result.protocol = protocol.replace(":", "");
        result.normalizedUrl = parsed.href;
        
        result.hostname = parsed.hostname.toLowerCase();

        result.valid = true;
        result.success = true;

        return result;

    } catch {

        result.reason = "Invalid public URL.";

        return result;

    }

}
export async function acquirePublicContent(urlPackage) {

    const result = {

    success: false,

    source: "unknown",

    url: urlPackage.normalizedUrl,

    // TES
    sourceType: urlPackage.sourceType || "PublicEvidence",
    evidenceStandard: urlPackage.evidenceStandard || "TES-1.0",
    collectionWindow: urlPackage.collectionWindow || "90 Days",

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

        const response = await fetch(urlPackage.normalizedUrl, {

            method: "GET",

            redirect: "follow",

            headers: {

                "User-Agent": "TruthLoop Public Content Fetcher"

            }

        });

        result.status = response.status;

        result.contentType =
            response.headers.get("content-type");

        result.contentLength =
            Number(response.headers.get("content-length")) || 0;

        if (!response.ok) {

            result.reason =
                `HTTP ${response.status}`;

            return result;

        }

        result.rawContent =
            await response.text();

        result.fetchedAt =
            new Date().toISOString();

        result.success = true;

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

    // TES
    sourceType: rawPackage?.sourceType || "PublicEvidence",
    evidenceStandard: rawPackage?.evidenceStandard || "TES-1.0",
    collectionWindow: rawPackage?.collectionWindow || "90 Days",

    rawContent: null,

    reason: null

};
    if (!rawPackage?.success) {

        result.reason = "Public content acquisition failed.";

        return result;

    }

    if (rawPackage.status !== 200) {

        result.reason = "Invalid HTTP response.";

        return result;

    }

    if (!rawPackage.rawContent) {

        result.reason = "No public content found.";

        return result;

    }

    if (
        !rawPackage.contentType ||
        !rawPackage.contentType.includes("text/html")
    ) {

        result.reason = "Unsupported content type.";

        return result;

    }

    result.success = true;

    result.valid = true;
result.sourceType = rawPackage.sourceType;
result.evidenceStandard = rawPackage.evidenceStandard;
result.collectionWindow = rawPackage.collectionWindow;
    result.rawContent = rawPackage.rawContent;

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

        reason: null,
        // TES
sourceType: validatedPackage?.sourceType || "PublicEvidence",
evidenceStandard: validatedPackage?.evidenceStandard || "TES-1.0",
collectionWindow: validatedPackage?.collectionWindow || "90 Days",

    };

    if (!validatedPackage?.success) {

        result.reason = "Content validation failed.";

        return result;

    }

    let html = validatedPackage.rawContent;

    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");

    html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

    html = html.replace(/<svg[\s\S]*?<\/svg>/gi, "");

    html = html.replace(/<canvas[\s\S]*?<\/canvas>/gi, "");

    html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");

    html = html.replace(/\s+/g, " ").trim();

    result.success = true;
result.sourceType = validatedPackage.sourceType;
result.evidenceStandard = validatedPackage.evidenceStandard;
result.collectionWindow = validatedPackage.collectionWindow;
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

// TES Evidence Signals
evidenceCoverage: {},

publicSignals: [],

missingSignals: [],

traceability: [],



        reason: null,
        // TES
sourceType: cleanPackage?.sourceType || "PublicEvidence",
evidenceStandard: cleanPackage?.evidenceStandard || "TES-1.0",
collectionWindow: cleanPackage?.collectionWindow || "90 Days",

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
// TES Evidence Metrics

result.visibleTextLength = result.visibleText.length;

result.hasReadableContent =
    result.visibleTextLength > 200;

result.extractionQuality =
    result.visibleTextLength > 5000
        ? "high"
        : result.visibleTextLength > 1000
        ? "medium"
        : "low";
    result.success = true;
result.sourceType = cleanPackage.sourceType;
result.evidenceStandard = cleanPackage.evidenceStandard;
result.collectionWindow = cleanPackage.collectionWindow;
result.evidenceCoverage = {
    title: !!result.title,
    description: !!result.description,
    headings: result.headings.length,
    links: result.links.length,
    images: result.images.length,
    visibleText: result.visibleTextLength
};

    return result;

}

export function normalizePublicEvidence(extractedPackage) {

    const result = {

        success: false,

        sourceType:
            extractedPackage?.sourceType || "PublicEvidence",

        evidenceStandard:
            extractedPackage?.evidenceStandard || "TES-1.0",

        collectionWindow:
            extractedPackage?.collectionWindow || "90 Days",

        profile: null,

        posts: [],

        comments: [],

        articles: [],

        projects: [],

        documents: [],

        communities: [],

        business: [],

        media: [],

        timeline: [],

        links: [],

        traceability: [],

        reason: null

    };

    if (!extractedPackage?.success) {

        result.reason =
            "Public content extraction failed.";

        return result;

    }
// Normalize Profile

result.profile = {

    title: extractedPackage.title,

    description: extractedPackage.description,

    language: extractedPackage.language,

    canonicalUrl: extractedPackage.canonicalUrl

};

// Normalize Links

result.links = extractedPackage.links.map(link => ({

    url: link,

    type: "link",

    verified: true

}));
    // Normalize Content

result.content = {

    headings: extractedPackage.headings.map(text => ({

        type: "heading",

        text,

        verified: true

    })),

    visibleText: extractedPackage.visibleText,

    visibleTextLength: extractedPackage.visibleTextLength,

    hasReadableContent: extractedPackage.hasReadableContent,

    extractionQuality: extractedPackage.extractionQuality

};
    // Normalize Timeline

result.timeline.push({

    type: "contentSnapshot",

    timestamp: null,

    source: extractedPackage.canonicalUrl,

    evidence: {

        title: extractedPackage.title,

        description: extractedPackage.description,

        headings: extractedPackage.headings.length,

        links: extractedPackage.links.length,

        visibleTextLength: extractedPackage.visibleTextLength

    },

    verified: true

});
    // Normalize Posts

result.posts = [];

if (extractedPackage.posts?.length) {

    result.posts = extractedPackage.posts.map(post => ({

        type: "post",

        id: post.id || null,

        title: post.title || null,

        content: post.content || null,

        url: post.url || null,

        publishedAt: post.publishedAt || null,

        author: post.author || null,

        verified: true

    }));

        }
    
    result.success = true;

    return result;

}


export function discoverPublicSignals(extractedPackage) {

    const result = {

        success: false,

        sourceType: extractedPackage?.sourceType || "PublicEvidence",

        evidenceStandard: extractedPackage?.evidenceStandard || "TES-1.0",

        collectionWindow: extractedPackage?.collectionWindow || "90 Days",

        publicSignals: [],

        missingSignals: [],

        evidenceCoverage:
            extractedPackage?.evidenceCoverage || {},

        traceability:
            extractedPackage?.traceability || [],

        reason: null

    };

    if (!extractedPackage?.success) {

        result.reason =
            "Public content extraction failed.";

        return result;

    }
    // TES Initial Public Signals

if (extractedPackage.title) {
    result.publicSignals.push({
        type: "title",
        value: extractedPackage.title,
        verified: true
    });
} else {
    result.missingSignals.push("title");
}

if (extractedPackage.description) {
    result.publicSignals.push({
        type: "description",
        value: extractedPackage.description,
        verified: true
    });
} else {
    result.missingSignals.push("description");
}

if (extractedPackage.headings?.length) {
    result.publicSignals.push({
        type: "headings",
        count: extractedPackage.headings.length,
        verified: true
    });
} else {
    result.missingSignals.push("headings");
}

if (extractedPackage.links?.length) {
    result.publicSignals.push({
        type: "links",
        count: extractedPackage.links.length,
        verified: true
    });
} else {
    result.missingSignals.push("links");
}

if (extractedPackage.images?.length) {
    result.publicSignals.push({
        type: "images",
        count: extractedPackage.images.length,
        verified: true
    });
} else {
    result.missingSignals.push("images");
}

if (extractedPackage.hasReadableContent) {
    result.publicSignals.push({
        type: "visibleText",
        length: extractedPackage.visibleTextLength,
        quality: extractedPackage.extractionQuality,
        verified: true
    });
} else {
    result.missingSignals.push("visibleText");
    }

// Identity Signals

if (extractedPackage.title) {
    result.publicSignals.push({
        category: "identity",
        type: "title",
        value: extractedPackage.title,
        verified: true
    });
}

if (extractedPackage.description) {
    result.publicSignals.push({
        category: "identity",
        type: "description",
        value: extractedPackage.description,
        verified: true
    });
}

if (extractedPackage.language) {
    result.publicSignals.push({
        category: "identity",
        type: "language",
        value: extractedPackage.language,
        verified: true
    });
}

// Content Signals

if (extractedPackage.headings?.length) {
    result.publicSignals.push({
        category: "content",
        type: "headings",
        count: extractedPackage.headings.length,
        verified: true
    });
}

if (extractedPackage.hasReadableContent) {
    result.publicSignals.push({
        category: "content",
        type: "visibleText",
        length: extractedPackage.visibleTextLength,
        quality: extractedPackage.extractionQuality,
        verified: true
    });
    }


    // Structure Signals

if (extractedPackage.links?.length) {
    result.publicSignals.push({
        category: "structure",
        type: "links",
        count: extractedPackage.links.length,
        verified: true
    });
}

if (extractedPackage.images?.length) {
    result.publicSignals.push({
        category: "structure",
        type: "images",
        count: extractedPackage.images.length,
        verified: true
    });
}

result.success = true;

return result;

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

        reason: null,
        // TES
sourceType: extractedPackage?.sourceType || "PublicEvidence",
evidenceStandard: extractedPackage?.evidenceStandard || "TES-1.0",
collectionWindow: extractedPackage?.collectionWindow || "90 Days",

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
    // TES Evidence

result.evidenceCoverage =
    extractedPackage.evidenceCoverage || {};

result.publicSignals =
    extractedPackage.publicSignals || [];

result.missingSignals =
    extractedPackage.missingSignals || [];

result.traceability =
    extractedPackage.traceability || [];

result.visibleTextLength =
    extractedPackage.visibleTextLength || 0;

result.hasReadableContent =
    extractedPackage.hasReadableContent || false;

result.extractionQuality =
    extractedPackage.extractionQuality || "low";

    result.normalizedAt =
        new Date().toISOString();

    result.success = true;
result.sourceType = extractedPackage.sourceType;
result.evidenceStandard = extractedPackage.evidenceStandard;
result.collectionWindow = extractedPackage.collectionWindow;
    return result;

           }
