/* ============================================================
   PUBLIC CONTENT FETCHER v4
   TruthLoop Investigation Pipeline

   Responsibility:
   Fetch -> Clean -> Extract -> Export

   Design rules:
   - No OAuth
   - No Connected Apps
   - No LLM calls
   - No Pattern Detection
   - No Ranking
   - No Report Generation
   - Preserve source-backed evidence
   - Discover public content and public profile links
   - Keep output compatible with CrossEvidenceBrain
   ============================================================ */

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_VISIBLE_TEXT = 12000;
const MAX_LINKS = 80;
const MAX_SOCIAL_LINKS = 40;
const MAX_HEADINGS = 40;
const MAX_POSTS = 30;
const MAX_ARTICLES = 30;
const MAX_EVIDENCE = 80;

const PLATFORM_PATTERNS = [
    ["linkedin", /linkedin\.com/i],
    ["github", /github\.com/i],
    ["facebook", /facebook\.com/i],
    ["instagram", /instagram\.com/i],
    ["x", /(^|\.)x\.com/i],
    ["x", /twitter\.com/i],
    ["youtube", /(youtube\.com|youtu\.be)/i],
    ["medium", /medium\.com/i],
    ["substack", /substack\.com/i],
    ["reddit", /reddit\.com/i],
    ["indiehackers", /indiehackers\.com/i],
    ["producthunt", /producthunt\.com/i],
    ["crunchbase", /crunchbase\.com/i],
    ["behance", /behance\.net/i],
    ["dribbble", /dribbble\.com/i],
    ["threads", /threads\.net/i],
    ["tiktok", /tiktok\.com/i],
    ["pinterest", /pinterest\.com/i],
    ["quora", /quora\.com/i],
    ["devto", /(^|\.)dev\.to/i],
    ["hashnode", /hashnode\.com/i],
    ["gitlab", /gitlab\.com/i]
];

function detectPlatform(url = "") {
    try {
        const value = String(url);
        for (const [platform, pattern] of PLATFORM_PATTERNS) {
            if (pattern.test(value)) return platform;
        }
        return "website";
    } catch {
        return "unknown";
    }
}

function normalizeUrl(value = "") {
    if (typeof value !== "string") return "";

    const cleaned = value
        .trim()
        .replace(/[<>"'\]\[),.;]+$/g, "")
        .replace(/^\s*[([{]+/, "");

    if (!cleaned) return "";
    if (/^\/\//.test(cleaned)) return `https:${cleaned}`;
    if (!/^https?:\/\//i.test(cleaned)) return "";

    try {
        const url = new URL(cleaned);
        return /^https?:$/.test(url.protocol) ? url.toString() : "";
    } catch {
        return "";
    }
}

function decodeHtml(value = "") {
    if (typeof value !== "string") return "";
    return value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

function cleanText(value = "", max = MAX_VISIBLE_TEXT) {
    if (typeof value !== "string") return "";
    return decodeHtml(value)
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\u0000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

function stripTags(value = "") {
    if (typeof value !== "string") return "";
    return decodeHtml(value)
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function unique(values = [], limit = 50) {
    const seen = new Set();
    const output = [];

    for (const value of values) {
        const normalized = normalizeUrl(value);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        output.push(normalized);
        if (output.length >= limit) break;
    }

    return output;
}

function extractMeta(html = {}, name = "") {
    const source = String(html);
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const patterns = [
        new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i")
    ];

    for (const pattern of patterns) {
        const match = source.match(pattern);
        if (match?.[1]) return decodeHtml(match[1]).trim();
    }

    return "";
}

function extractTitle(html = "") {
    return stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").slice(0, 300);
}

function extractCanonical(html = "") {
    const match = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i);
    return normalizeUrl(match?.[1] || "") || null;
}

function extractAuthor(html = "") {
    return (
        extractMeta(html, "author") ||
        extractMeta(html, "article:author") ||
        extractMeta(html, "profile:first_name") ||
        ""
    ).slice(0, 200);
}

function extractDate(html = "") {
    return (
        extractMeta(html, "article:published_time") ||
        extractMeta(html, "datePublished") ||
        extractMeta(html, "publish-date") ||
        extractMeta(html, "date") ||
        ""
    ).slice(0, 100);
}

function extractHeadings(html = "") {
    const output = [];
    const regex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
    let match;
    while ((match = regex.exec(html)) && output.length < MAX_HEADINGS) {
        const value = stripTags(match[1]);
        if (value) output.push(value.slice(0, 240));
    }
    return output;
}

function extractText(html = "") {
    return cleanText(html, MAX_VISIBLE_TEXT);
}

function extractHrefLinks(html = "") {
    const output = [];
    const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let match;
    const rawLinks =
      html.match(/href\s*=\s*["'][^"']+["']/gi) || [];

    console.log(
      "RAW_HREF_MATCHES",
      rawLinks.length
    );
    while ((match = regex.exec(html)) && output.length < MAX_LINKS * 2) {
        const raw = match[1].trim();
        if (!raw || raw.startsWith("#") || /^javascript:/i.test(raw)) continue;

        try {
            const url = new URL(raw, "https://example.invalid/");
            if (url.hostname === "example.invalid") continue;
            output.push(url.toString());
        } catch {
            // Ignore malformed links.
        }
    }

    return unique(output, MAX_LINKS);
}

function extractSocialLinks(html = "") {
    const hrefLinks = extractHrefLinks(html);
    const rawMatches = html.match(/https?:\/\/[^\s"'<>]+/gi) || [];

    return unique(
        [...hrefLinks, ...rawMatches].filter(link =>
            PLATFORM_PATTERNS.some(([, pattern]) => pattern.test(link))
        ),
        MAX_SOCIAL_LINKS
    );
}

function parseJsonLd(html = "") {
    const items = [];
    const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = regex.exec(html)) && items.length < 20) {
        try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed)) items.push(...parsed);
            else items.push(parsed);
        } catch {
            // Invalid JSON-LD is ignored.
        }
    }

    return items.slice(0, 50);
}

function flattenJsonLd(value, out = []) {
    if (!value || out.length >= 100) return out;

    if (Array.isArray(value)) {
        for (const item of value) flattenJsonLd(item, out);
        return out;
    }

    if (typeof value !== "object") return out;

    if (value.mainEntity && typeof value.mainEntity === "object") {
        flattenJsonLd(value.mainEntity, out);
    }

    if (value.itemListElement && Array.isArray(value.itemListElement)) {
        flattenJsonLd(value.itemListElement, out);
    }

    if (value.item && typeof value.item === "object") {
        flattenJsonLd(value.item, out);
    }

    out.push(value);
    return out;
}

function extractStructuredContent(html = "") {
    const jsonLd = flattenJsonLd(parseJsonLd(html));
    const posts = [];
    const articles = [];

    for (const item of jsonLd) {
        const type = Array.isArray(item["@type"]) ? item["@type"].join(",") : String(item["@type"] || "");
        const headline = cleanText(item.headline || item.name || "", 300);
        const description = cleanText(item.description || item.text || "", 600);
        const url = normalizeUrl(item.url || item.mainEntityOfPage || "");
        const author = typeof item.author === "string"
            ? item.author
            : cleanText(item.author?.name || "", 200);
        const datePublished = cleanText(item.datePublished || item.uploadDate || "", 80);

        if (!headline && !description && !url) continue;

        const record = {
            title: headline || null,
            description: description || null,
            url: url || null,
            author: author || null,
            publishedAt: datePublished || null,
            sourceType: type || null
        };

        if (/article|newsarticle|blogposting/i.test(type)) {
            articles.push(record);
        } else if (/socialmediaposting|blogposting|discussionforum/i.test(type)) {
            posts.push(record);
        }
    }

    return {
        posts: posts.slice(0, MAX_POSTS),
        articles: articles.slice(0, MAX_ARTICLES)
    };
}

function extractArticleBlocks(html = "") {
    const articles = [];
    const regex = /<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;

    while ((match = regex.exec(html)) && articles.length < MAX_ARTICLES) {
        const block = match[2];
        const text = cleanText(block, 900);
        if (text.length < 80) continue;

        const heading = stripTags(block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] || "");
        const link = normalizeUrl(block.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || "");

        articles.push({
            title: heading || null,
            description: text,
            url: link || null,
            author: null,
            publishedAt: null,
            sourceType: "html-article"
        });
    }

    return articles;
}

function extractPlatformEvidence(html, url, platform) {
    const structured = extractStructuredContent(html);
    const heuristicArticles = extractArticleBlocks(html);

    const articles = [...structured.articles];
    for (const item of heuristicArticles) {
        const fingerprint = JSON.stringify(item);
        if (!articles.some(existing => JSON.stringify(existing) === fingerprint)) {
            articles.push(item);
        }
    }

    const evidence = [];

    const title = extractTitle(html);
    const description = extractMeta(html, "description") || extractMeta(html, "og:description");
    const ogTitle = extractMeta(html, "og:title");
    const ogType = extractMeta(html, "og:type");
    const author = extractAuthor(html);
    const publishedAt = extractDate(html);

    const addEvidence = (type, value) => {
        const clean = cleanText(value, 700);
        if (!clean) return;
        evidence.push({
            type,
            sourceUrl: url,
            value: clean
        });
    };

    addEvidence("page-title", title || ogTitle);
    addEvidence("description", description);
    addEvidence("author", author);
    addEvidence("published-at", publishedAt);
    addEvidence("platform", platform);

    for (const article of articles.slice(0, 10)) {
        addEvidence("article", article.title || article.description || "");
    }

    for (const post of structured.posts.slice(0, 10)) {
        addEvidence("post", post.title || post.description || "");
    }

    return {
        canonicalUrl: extractCanonical(html),
        author: author || null,
        publishedAt: publishedAt || null,
        ogTitle: ogTitle || null,
        ogType: ogType || null,
        posts: structured.posts.slice(0, MAX_POSTS),
        articles: articles.slice(0, MAX_ARTICLES),
        evidence: evidence.slice(0, MAX_EVIDENCE)
    };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
}

function buildSource({ url, response, html }) {
    const platform = detectPlatform(url);
    const title = extractTitle(html) || extractMeta(html, "og:title") || null;
    const description = extractMeta(html, "description") || extractMeta(html, "og:description") || null;
    const visibleText = extractText(html);
    const socialLinks = extractSocialLinks(html);
    const links = extractHrefLinks(html);
   console.log(
  "HTML_LENGTH",
  html?.length
);

console.log(
  "HTML_SAMPLE",
  html?.slice(0,1000)
);
console.log("ALL_LINKS_FOUND", links);
    const headings = extractHeadings(html);
    const structured = extractPlatformEvidence(html, url, platform);

    return {
        sourceUrl: url,
        canonicalUrl: structured.canonicalUrl,
        platform,
        sourcePlatform: platform,
        status: response?.status ?? null,
        statusText: response?.statusText || null,
        title,
        description,
        visibleText,
        socialLinks,
        links,
        headings,
        posts: structured.posts,
        articles: structured.articles,
        author: structured.author,
        publishedAt: structured.publishedAt,
        ogTitle: structured.ogTitle,
        ogType: structured.ogType,
        publicEvidence: structured.evidence,
        contentLength: visibleText.length,
        fetchTimestamp: new Date().toISOString()
    };
}

export async function acquirePublicContent({
    profileLinks = []
} = {}) {
   
    
    const requested = Array.isArray(profileLinks) ? profileLinks : [];
   const MAX_SOURCES = 15;
const queue = [...requested];
const visited = new Set();
const sources = [];
    while (
  queue.length > 0 &&
  sources.length < MAX_SOURCES
) {
console.log("QUEUE_SIZE", queue.length);
  console.log("VISITED_COUNT", visited.size);
  console.log("SOURCE_COUNT", sources.length);
  const rawUrl = queue.shift();

  if (visited.has(rawUrl)) continue;

  visited.add(rawUrl);

  const url = normalizeUrl(rawUrl);

  if (!url) continue;
        
        try {
            const response = await fetchWithTimeout(url, {
                method: "GET",
                redirect: "follow",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9"
                }
            });

            const html = await response.text();
const source = buildSource({
  url: response.url || url,
  response,
  html
});

sources.push(source);
           for (const link of source.links || []) {

  const normalized = normalizeUrl(link);

  if (!normalized) continue;

  if (visited.has(normalized)) continue;
console.log(
    "DISCOVERED_LINK",
    normalized
  );
  const platform = detectPlatform(normalized);

  if (
      platform === "linkedin" ||
      platform === "instagram" ||
      platform === "youtube" ||
      platform === "facebook" ||
      platform === "website"
  ) {
     console.log(
  "DISCOVERED_PLATFORM",
  platform,
  normalized
);
      queue.push(normalized);
     console.log(
  "ADDED_TO_QUEUE",
  normalized
);
  }
           }
            sources.push(
                buildSource({
                    url: response.url || url,
                    response,
                    html
                })
            );
        } catch (error) {
            sources.push({
                sourceUrl: url,
                platform: detectPlatform(url),
                sourcePlatform: detectPlatform(url),
                status: 0,
                title: null,
                description: null,
                visibleText: "",
                socialLinks: [],
                links: [],
                headings: [],
                posts: [],
                articles: [],
                publicEvidence: [],
                contentLength: 0,
                error: error?.name === "AbortError"
                    ? "Public source fetch timed out."
                    : (error?.message || "Public source fetch failed."),
                fetchTimestamp: new Date().toISOString()
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

export async function loadPublicContentFetcher(options = {}) {
    return acquirePublicContent(options);
}

export function validatePublicContent(content = {}) {
    if (!content || typeof content !== "object") {
        return {
            success: false,
            sources: []
        };
    }

    return {
        ...content,
        success: content.success !== false,
        sources: Array.isArray(content.sources) ? content.sources : []
    };
}

export function cleanPublicContent(content = {}) {
    if (!content || typeof content !== "object") {
        return {
            success: false,
            sources: []
        };
    }

    const sources = Array.isArray(content.sources) ? content.sources : [];

    return {
        ...content,
        sources: sources.map(source => ({
            ...source,
            title: cleanText(source?.title || "", 300) || null,
            description: cleanText(source?.description || "", 600) || null,
            visibleText: cleanText(source?.visibleText || "", MAX_VISIBLE_TEXT),
            socialLinks: unique(source?.socialLinks || [], MAX_SOCIAL_LINKS),
            links: unique(source?.links || [], MAX_LINKS),
            headings: Array.isArray(source?.headings)
                ? source.headings.map(item => cleanText(item, 240)).filter(Boolean).slice(0, MAX_HEADINGS)
                : [],
            posts: Array.isArray(source?.posts) ? source.posts.slice(0, MAX_POSTS) : [],
            articles: Array.isArray(source?.articles) ? source.articles.slice(0, MAX_ARTICLES) : [],
            publicEvidence: Array.isArray(source?.publicEvidence)
                ? source.publicEvidence.slice(0, MAX_EVIDENCE)
                : []
        }))
    };
}

export function extractPublicContent(content = {}) {
    const source = content?.sources?.[0] || {};

    return {
        title: source.title || "",
        description: source.description || "",
        visibleText: source.visibleText || "",
        socialLinks: Array.isArray(source.socialLinks) ? source.socialLinks : [],
        links: Array.isArray(source.links) ? source.links : [],
        headings: Array.isArray(source.headings) ? source.headings : [],
        posts: Array.isArray(source.posts) ? source.posts : [],
        articles: Array.isArray(source.articles) ? source.articles : [],
        publicEvidence: Array.isArray(source.publicEvidence) ? source.publicEvidence : [],
        canonicalUrl: source.canonicalUrl || null,
        author: source.author || null,
        publishedAt: source.publishedAt || null,
        contentLength: source.contentLength || 0
    };
}

export function buildPublicContentPackage(
    rawPackage = {},
    extractedPackage = {}
) {
    const source = rawPackage?.sources?.[0] || {};

    const merged = {
        success: true,
        sourceUrl: source.sourceUrl || null,
        canonicalUrl: extractedPackage?.canonicalUrl || source.canonicalUrl || null,
        platform: source.platform || source.sourcePlatform || "unknown",
        sourcePlatform: source.sourcePlatform || source.platform || "unknown",
        title: extractedPackage?.title || source.title || "",
        description: extractedPackage?.description || source.description || "",
        visibleText: extractedPackage?.visibleText || source.visibleText || "",
        socialLinks: extractedPackage?.socialLinks || source.socialLinks || [],
        links: extractedPackage?.links || source.links || [],
        headings: extractedPackage?.headings || source.headings || [],
        posts: extractedPackage?.posts || source.posts || [],
        articles: extractedPackage?.articles || source.articles || [],
        publicEvidence: extractedPackage?.publicEvidence || source.publicEvidence || [],
        author: extractedPackage?.author || source.author || null,
        publishedAt: extractedPackage?.publishedAt || source.publishedAt || null,
        contentLength:
            extractedPackage?.contentLength ||
            source.contentLength ||
            extractedPackage?.visibleText?.length ||
            source.visibleText?.length ||
            0,
        sources: Array.isArray(rawPackage?.sources)
            ? rawPackage.sources
            : [source]
    };

    return merged;
}
