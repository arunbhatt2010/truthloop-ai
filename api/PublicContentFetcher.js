/* ============================================================
   PUBLIC CONTENT FETCHER v6 — INVESTIGATION PAGE COVERAGE + FULL CONTENT HANDOFF
   TruthLoop Universal Public Evidence Pipeline

   Responsibility:
   Fetch -> Discover -> Crawl -> Clean -> Extract -> Export

   Design rules:
   - No OAuth
   - No Connected Apps
   - No LLM calls
   - No Pattern Detection
   - No Ranking of people/entities
   - No Report Generation
   - Preserve source-backed public evidence
   - Discover public content, public profile links and sitemaps
   - Fetch discovered public sources, not only the initial URL
   - Prefer visible public content over metadata-only evidence
   - Keep output compatible with CrossEvidenceBrain
   ============================================================ */

const DEFAULT_TIMEOUT_MS = 12000;

const MAX_VISIBLE_TEXT = 50000;
const MAX_LINKS = 250;
const MAX_SOCIAL_LINKS = 60;
const MAX_HEADINGS = 60;
const MAX_POSTS = 10;
const MAX_ARTICLES = 40;
const MAX_EVIDENCE = 250;

const MAX_SOURCES = 50;
// Allow retries after unavailable pages so one or two fetch failures do not
// consume the complete 50-page website evidence allowance.
const MAX_FETCH_ATTEMPTS = 75;
const MAX_SITEMAP_URLS = 200;
const MAX_SITEMAPS = 10;
const MAX_CONTENT_LINKS = 100;
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

const LEGAL_PATH_PATTERNS = [
    /(?:^|\/)privacy(?:-policy)?(?:\.|\/|$)/i,
    /(?:^|\/)cookie(?:-policy)?(?:\.|\/|$)/i,
    /(?:^|\/)terms(?:-and-conditions)?(?:\.|\/|$)/i,
    /(?:^|\/)disclaimer(?:\.|\/|$)/i,
    /(?:^|\/)contact(?:-us)?(?:\.|\/|$)/i
];

const CONTENT_PATH_PATTERNS = [
    /(?:^|\/)(?:article|articles|blog|blogs|post|posts|news|insight|insights|guide|guides|resource|resources|learn|tutorial|tutorials|case-study|case-studies|story|stories|writing|essay|essays|journal|research|academy|library|knowledge|perspective|perspectives|newsletter)(?:\/|\.|$)/i,
    /\/\d{4}\/\d{1,2}\/\d{1,2}\//i,
    /\/(?:20\d{2})(?:\/|$)/i
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

function normalizeUrl(value = "", baseUrl = "") {
    if (typeof value !== "string") return "";

    const cleaned = value
        .trim()
        .replace(/[<>'\]\[),.;]+$/g, "")
        .replace(/^\s*[([{]+/, "");

    if (!cleaned) return "";
    if (/^javascript:/i.test(cleaned)) return "";
    if (/^mailto:/i.test(cleaned)) return "";
    if (/^tel:/i.test(cleaned)) return "";

    if (/^\/\//.test(cleaned)) {
        try {
            return new URL(`https:${cleaned}`).toString();
        } catch {
            return "";
        }
    }

    try {
        const absolute = /^https?:\/\//i.test(cleaned)
            ? cleaned
            : baseUrl
                ? new URL(cleaned, baseUrl).toString()
                : "";

        if (!absolute) return "";

        const url = new URL(absolute);
        if (!/^https?:$/.test(url.protocol)) return "";

        url.hash = "";
        return url.toString();
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
        .replace(/&gt;/gi, ">")
        .replace(/&#8217;|&#x2019;/gi, "'")
        .replace(/&#8216;|&#x2018;/gi, "'")
        .replace(/&#8220;|&#x201C;/gi, '"')
        .replace(/&#8221;|&#x201D;/gi, '"')
        .replace(/&#8211;|&#x2013;/gi, "-")
        .replace(/&#8212;|&#x2014;/gi, "-")
        .replace(/&#8230;|&#x2026;/gi, "...");
}

function cleanText(value = "", max = MAX_VISIBLE_TEXT) {
    if (typeof value !== "string") return "";

    return decodeHtml(value)
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<template[\s\S]*?<\/template>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\u0000/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

function stripTags(value = "") {
    return cleanText(value, MAX_VISIBLE_TEXT);
}

function unique(values = [], limit = 50, baseUrl = "") {
    const seen = new Set();
    const output = [];

    for (const value of values) {
        const normalized = normalizeUrl(value, baseUrl);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        output.push(normalized);
        if (output.length >= limit) break;
    }

    return output;
}

function extractMeta(html = "", name = "") {
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
    return stripTags(
        html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""
    ).slice(0, 300);
}

function extractCanonical(html = "", baseUrl = "") {
    const match = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i)
        || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i);

    return normalizeUrl(match?.[1] || "", baseUrl) || null;
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

function extractHrefLinks(html = "", baseUrl = "") {
    const output = [];
    const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = regex.exec(html)) && output.length < MAX_LINKS * 2) {
        const raw = match[1].trim();
        if (!raw || raw.startsWith("#")) continue;

        const url = normalizeUrl(raw, baseUrl);
        if (!url) continue;

        output.push(url);
    }

    return unique(output, MAX_LINKS);
}

function extractSocialLinks(html = "", baseUrl = "") {
    const hrefLinks = extractHrefLinks(html, baseUrl);
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

    while ((match = regex.exec(html)) && items.length < 40) {
        try {
            const parsed = JSON.parse(match[1].trim());
            if (Array.isArray(parsed)) items.push(...parsed);
            else items.push(parsed);
        } catch {
            // Invalid JSON-LD is ignored.
        }
    }

    return items.slice(0, 100);
}

function flattenJsonLd(value, out = []) {
    if (!value || out.length >= 150) return out;

    if (Array.isArray(value)) {
        for (const item of value) flattenJsonLd(item, out);
        return out;
    }

    if (typeof value !== "object") return out;

    if (value.mainEntity && typeof value.mainEntity === "object") {
        flattenJsonLd(value.mainEntity, out);
    }

    if (Array.isArray(value.itemListElement)) {
        flattenJsonLd(value.itemListElement, out);
    }

    if (value.item && typeof value.item === "object") {
        flattenJsonLd(value.item, out);
    }

    out.push(value);
    return out;
}

function extractJsonLdSocialLinks(html = "", sourceUrl = "") {
    const jsonLd = flattenJsonLd(parseJsonLd(html));
    const links = [];

    for (const item of jsonLd) {

        if (Array.isArray(item.sameAs)) {
            links.push(...item.sameAs);
        }

        if (typeof item.sameAs === "string") {
            links.push(item.sameAs);
        }

        if (item.author?.sameAs) {
            if (Array.isArray(item.author.sameAs)) {
                links.push(...item.author.sameAs);
            } else {
                links.push(item.author.sameAs);
            }
        }

        if (item.publisher?.sameAs) {
            if (Array.isArray(item.publisher.sameAs)) {
                links.push(...item.publisher.sameAs);
            } else {
                links.push(item.publisher.sameAs);
            }
        }

        if (item.url) {
            links.push(item.url);
        }
    }

    return unique(
        links.filter(link =>
            PLATFORM_PATTERNS.some(([, pattern]) =>
                pattern.test(String(link))
            )
        ),
        MAX_SOCIAL_LINKS
    );
}

function extractStructuredContent(html = "", baseUrl = "") {
    const jsonLd = flattenJsonLd(parseJsonLd(html));
    const posts = [];
    const articles = [];

    for (const item of jsonLd) {
        const rawType = item?.["@type"];
        const type = Array.isArray(rawType)
            ? rawType.join(",")
            : String(rawType || "");

        const headline = cleanText(item?.headline || item?.name || "", 300);
        const description = cleanText(item?.description || item?.text || "", MAX_VISIBLE_TEXT);
        const url = normalizeUrl(
            typeof item?.mainEntityOfPage === "object"
                ? item?.mainEntityOfPage?.["@id"] || item?.mainEntityOfPage?.url || ""
                : item?.url || item?.mainEntityOfPage || "",
            baseUrl
        );
        const author = typeof item?.author === "string"
            ? item.author
            : cleanText(item?.author?.name || "", 200);
        const datePublished = cleanText(
            item?.datePublished || item?.uploadDate || "",
            80
        );

        if (!headline && !description && !url) continue;

        const record = {
            title: headline || null,
            description: description || null,
            url: url || null,
            author: author || null,
            publishedAt: datePublished || null,
            sourceType: type || null
        };

        if (/article|newsarticle|blogposting|techarticle|report/i.test(type)) {
            articles.push(record);
        } else if (/socialmediaposting|discussionforum/i.test(type)) {
            posts.push(record);
        }
    }

    return {
        posts: posts.slice(0, MAX_POSTS),
        articles: articles.slice(0, MAX_ARTICLES)
    };
}
function extractArticleBlocks(html = "", baseUrl = "") {
    const articles = [];
    const seen = new Set();

    const patterns = [
        /<(article)\b[^>]*>([\s\S]*?)<\/article>/gi,
        /<(main)\b[^>]*>([\s\S]*?)<\/main>/gi,
        /<(section)\b[^>]*(?:article|post|entry|blog|content|story|insight)[^>]*>([\s\S]*?)<\/section>/gi,
        /<div\b[^>]*(?:class|id)=["'][^"']*(?:article|post|entry|blog|content|story|insight|excerpt)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
    ];

    for (const regex of patterns) {
        let match;

        while ((match = regex.exec(html)) && articles.length < MAX_ARTICLES * 2) {
            const block = match[2] ?? match[1] ?? "";
            const text = cleanText(block, MAX_VISIBLE_TEXT);
            if (text.length < 180) continue;

            const heading = stripTags(
                block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] || ""
            );

            const link = normalizeUrl(
                block.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || "",
                baseUrl
            );

            const fingerprint = `${heading}|${text.slice(0, 500)}|${link}`;
            if (seen.has(fingerprint)) continue;
            seen.add(fingerprint);

            articles.push({
                title: heading || null,
                description: text,
                url: link || null,
                author: null,
                publishedAt: null,
                sourceType: "html-heuristic"
            });
        }
    }

    return articles.slice(0, MAX_ARTICLES);
}

function extractContentCandidates(html = "", baseUrl = "") {
    const candidates = [];
    const seen = new Set();

    const pushCandidate = (title, description, url, sourceType) => {
        const cleanTitle = cleanText(title, 300);
        const cleanDescription = cleanText(description, MAX_VISIBLE_TEXT);
        const normalizedUrl = normalizeUrl(url || "", baseUrl);
        if (!cleanTitle && !cleanDescription) return;

        const fingerprint = `${cleanTitle}|${cleanDescription.slice(0, 300)}|${normalizedUrl}`;
        if (seen.has(fingerprint)) return;
        seen.add(fingerprint);

        candidates.push({
            title: cleanTitle || null,
            description: cleanDescription || null,
            url: normalizedUrl || null,
            sourceType: sourceType || "html-content"
        });
    };

    const linkRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;

    while ((linkMatch = linkRegex.exec(html)) && candidates.length < MAX_CONTENT_LINKS) {
        const href = normalizeUrl(linkMatch[1], baseUrl);
        if (!href || !looksLikeContentUrl(href)) continue;

        const anchorText = stripTags(linkMatch[2]);
        if (anchorText.length < 8) continue;

        pushCandidate(
            anchorText,
            anchorText,
            href,
            "content-link"
        );
    }

    const headings = extractHeadings(html);
    for (const heading of headings) {
        if (!looksLikeContentTitle(heading)) continue;
        pushCandidate(heading, heading, "", "content-heading");
    }

    return candidates.slice(0, MAX_CONTENT_LINKS);
}

function looksLikeContentTitle(value = "") {
    const text = String(value).trim();
    if (text.length < 10 || text.length > 220) return false;

    return /\?|\bwhy\b|\bhow\b|\bwhat\b|\bguide\b|\btips?\b|\bways?\b|\bprinciples?\b|\bmistakes?\b|\bbeginner|\blearn|\busing\b|\bintelligence\b|\bpsychology\b|\bsystems?\b/i.test(text);
}

function looksLikeContentUrl(url = "") {
    try {
        const parsed = new URL(url);
        const path = `${parsed.pathname}${parsed.search}`;
        if (LEGAL_PATH_PATTERNS.some(pattern => pattern.test(parsed.pathname))) return false;
        return CONTENT_PATH_PATTERNS.some(pattern => pattern.test(path));
    } catch {
        return false;
    }
}

function isLegalUrl(url = "") {
    try {
        return LEGAL_PATH_PATTERNS.some(pattern => pattern.test(new URL(url).pathname));
    } catch {
        return false;
    }
}

function isSameHost(a = "", b = "") {
    try {
        return new URL(a).hostname.replace(/^www\./i, "") === new URL(b).hostname.replace(/^www\./i, "");
    } catch {
        return false;
    }
}

function scoreUrl(url = "", rootUrl = "") {
    if (!url) return -1000;

    const platform = detectPlatform(url);
    let score = 0;

    if (platform !== "website") score += 100;
    if (isSameHost(url, rootUrl)) score += 40;
    if (looksLikeContentUrl(url)) score += 120;
    if (isLegalUrl(url)) score -= 200;

    try {
        const path = new URL(url).pathname.toLowerCase();
        if (/\/author(?:\/|-)/i.test(path)) score += 90;
        if (/\/about(?:-us)?(?:\/|\.)/i.test(path)) score += 50;
        if (/\/(?:blog|articles?|posts?|insights?|resources?|guides?)(?:\/|\.|$)/i.test(path)) score += 110;
        if (/\.(?:pdf|zip|rar|7z|mp4|mp3|webp|png|jpg|jpeg|gif|svg|ico|css|js)$/i.test(path)) score -= 200;
    } catch {
        // Ignore malformed URLs.
    }

    return score;
}

function sortQueue(queue = [], rootUrl = "") {
    return queue
        .filter(Boolean)
        .sort((a, b) => scoreUrl(b, rootUrl) - scoreUrl(a, rootUrl));
}

function extractSitemapLocs(text = "", baseUrl = "") {
    const matches = text.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi) || [];

    return unique(
        matches.map(value =>
            value
                .replace(/^\s*<loc>\s*/i, "")
                .replace(/\s*<\/loc>\s*$/i, "")
                .trim()
        ),
        MAX_SITEMAP_URLS,
        baseUrl
    );
}

async function discoverSitemapUrls(rootUrl = "") {
    let origin = "";

    try {
        origin = new URL(rootUrl).origin;
    } catch {
        return [];
    }

    const discoveredSitemaps = new Set();

    const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/wp-sitemap.xml`,

    `${origin}/post-sitemap.xml`,
    `${origin}/page-sitemap.xml`,
    `${origin}/author-sitemap.xml`,
    `${origin}/category-sitemap.xml`,
    `${origin}/news-sitemap.xml`,
    `${origin}/blog-sitemap.xml`
];

    try {
        const robotsResponse = await fetchWithTimeout(`${origin}/robots.txt`);
        if (robotsResponse.ok) {
            const robotsText = await robotsResponse.text();
            const robotMatches = robotsText.match(/^\s*Sitemap:\s*(\S+)/gim) || [];
            for (const line of robotMatches) {
                const match = line.match(/^\s*Sitemap:\s*(\S+)/i);
                const sitemap = normalizeUrl(match?.[1] || "", origin);
                if (sitemap) candidates.push(sitemap);
            }
        }
    } catch {
        // robots.txt is optional.
    }

    for (const sitemapUrl of unique(candidates, MAX_SITEMAPS, origin)) {
        if (discoveredSitemaps.has(sitemapUrl)) continue;
        discoveredSitemaps.add(sitemapUrl);

        try {
            const response = await fetchWithTimeout(sitemapUrl);
            if (!response.ok) continue;

            const xml = await response.text();
            const locs = extractSitemapLocs(xml, sitemapUrl);

            for (const loc of locs) {
                if (/sitemap(?:[_-]index)?\.xml/i.test(loc) || /\/sitemap/i.test(loc)) {
                    if (discoveredSitemaps.size < MAX_SITEMAPS) {
                        discoveredSitemaps.add(loc);
                    }
                }
            }
        } catch {
            // Ignore unavailable sitemap candidates.
        }
    }

    const finalSitemapUrls = [...discoveredSitemaps].slice(0, MAX_SITEMAPS);
    const contentUrls = [];

    for (const sitemapUrl of finalSitemapUrls) {
        try {
            const response = await fetchWithTimeout(sitemapUrl);
            if (!response.ok) continue;
            const xml = await response.text();
            const locs = extractSitemapLocs(xml, sitemapUrl);
            contentUrls.push(...locs);
        } catch {
            // Ignore individual sitemap failures.
        }
    }

    return unique(contentUrls, MAX_SITEMAP_URLS, rootUrl)
        .filter(url => !isLegalUrl(url))
        .filter(url => !/\.(?:xml|txt|css|js|png|jpg|jpeg|gif|webp|svg|ico|mp4|mp3|zip|rar)$/i.test(url));
}



const MAX_WEBSITE_POST_CANDIDATES = 200;
// The root page is retained separately; up to 49 additional relevant pages are selected.

const WEBSITE_PAGE_CATEGORY_RULES = [
    { category: "financial_disclosures", weight: 150, pattern: /\b(investor relations?|investors?|annual reports?|financial results?|quarterly results?|financial statements?|revenue|profit and loss|balance sheets?|cash flow|earnings|shareholders?|stock information|funding disclosures?|credit ratings?|prospectus|filings?)\b/i },
    { category: "customer_validation", weight: 145, pattern: /\b(case studies|customer stories|client stories|our customers|customers|clients|testimonials?|reviews?|success stories|customer success|deployments?|customer results)\b/i },
    { category: "leadership_and_governance", weight: 135, pattern: /\b(about us|our story|company overview|leadership|founders?|management team|board of directors|board members|executive team|governance|ownership)\b/i },
    { category: "products_and_services", weight: 125, pattern: /\b(products?|services?|solutions?|platform|features?|use cases?|industries served|how it works|product overview)\b/i },
    { category: "business_model_and_pricing", weight: 118, pattern: /\b(pricing|plans|subscriptions?|billing|business model|licensing|fees|rates|packages)\b/i },
    { category: "partnerships_and_ecosystem", weight: 112, pattern: /\b(partners?|partnerships?|alliances?|integrations?|ecosystem|resellers?|distributors?)\b/i },
    { category: "technology_and_ip", weight: 108, pattern: /\b(technology|engineering|developer|api reference|documentation|architecture|research and development|r\s*&\s*d|patents?|intellectual property|open source|changelog|release notes)\b/i },
    { category: "operations_and_delivery", weight: 104, pattern: /\b(operations?|delivery|implementation|workflows?|processes?|manufacturing|facilities|supply chain|logistics|service levels?|sla)\b/i },
    { category: "risk_security_compliance", weight: 102, pattern: /\b(security|trust center|compliance|certifications?|privacy|risk management|business continuity|disaster recovery|incident response|code of conduct|regulatory disclosures?)\b/i },
    { category: "news_and_execution_history", weight: 96, pattern: /\b(news|press releases?|announcements?|milestones?|launches?|events?|acquisitions?|media coverage|company updates|blog|insights)\b/i },
    { category: "careers_and_hiring", weight: 84, pattern: /\b(careers?|jobs|hiring|open positions|life at|our people|employee stories|graduate programs)\b/i },
    { category: "market_and_positioning", weight: 78, pattern: /\b(market|industry insights|competitive|why choose us|differentiators?|analyst reports?|market research)\b/i },
    { category: "contact_and_support", weight: 35, pattern: /\b(contact us|support|help center|faqs?|locations?|customer service)\b/i }
];

function classifyWebsitePage(source = {}) {
    const url = String(source?.sourceUrl || source?.canonicalUrl || "");
    const title = String(source?.title || source?.ogTitle || "");
    const headings = Array.isArray(source?.headings) ? source.headings.join(" ") : "";
    const description = String(source?.description || "");
    const visibleText = String(source?.visibleText || "").slice(0, 7000);
    const searchable = `${url} ${title} ${headings} ${description} ${visibleText}`.toLowerCase();
    const categories = WEBSITE_PAGE_CATEGORY_RULES
        .filter(rule => rule.pattern.test(searchable))
        .map(rule => rule.category);
    const pageCategory = categories[0] || "general_company_information";
    const rule = WEBSITE_PAGE_CATEGORY_RULES.find(item => item.category === pageCategory);
    const investigationSections = {
        financial_disclosures: ["02", "05", "06", "07", "08"],
        customer_validation: ["03", "04", "05", "07", "08"],
        leadership_and_governance: ["01", "02", "05", "06", "07", "08"],
        products_and_services: ["01", "02", "03", "04", "08"],
        business_model_and_pricing: ["02", "04", "05", "07", "08"],
        partnerships_and_ecosystem: ["03", "05", "06", "07", "08"],
        technology_and_ip: ["02", "03", "04", "05", "07"],
        operations_and_delivery: ["03", "04", "06", "07", "08"],
        risk_security_compliance: ["02", "04", "05", "06", "07", "08"],
        news_and_execution_history: ["02", "03", "06", "07", "08"],
        careers_and_hiring: ["01", "03", "04", "06", "07"],
        market_and_positioning: ["01", "02", "04", "05", "08"],
        contact_and_support: ["01", "05", "07"],
        general_company_information: ["01", "02", "03", "04", "08"]
    };
    return {
        pageCategory,
        pageCategories: categories.length ? [...new Set(categories)] : [pageCategory],
        investigationSections: investigationSections[pageCategory] || investigationSections.general_company_information,
        collectionPurpose: "public_company_due_diligence",
        categoryPriority: rule?.weight || 20
    };
}

function isWebsitePostSource(source = {}, rootUrl = "") {
    const url = source?.sourceUrl || source?.canonicalUrl || "";
    const normalized = normalizeUrl(url);
    const rootNormalized = normalizeUrl(rootUrl);
    if (!normalized || normalized === rootNormalized) return false;
    if (isLegalUrl(normalized)) return false;

    try {
        const path = new URL(normalized).pathname.toLowerCase();
        if (path === "/app" || path === "/app/" || path === "/" || path === "") return false;
    } catch {}

    const visibleLength = Number(source?.visibleText?.length || 0);
    const articleCount = Array.isArray(source?.articles) ? source.articles.length : 0;
    const postCount = Array.isArray(source?.posts) ? source.posts.length : 0;
    const evidenceCount = Array.isArray(source?.publicEvidence) ? source.publicEvidence.length : 0;

    return (
        looksLikeContentUrl(normalized) ||
        String(source?.ogType || "").toLowerCase() === "article" ||
        articleCount > 0 ||
        postCount > 0 ||
        visibleLength >= 500 ||
        evidenceCount >= 4
    );
}

function scoreWebsitePostSource(source = {}, rootUrl = "") {
    const url = source?.sourceUrl || source?.canonicalUrl || "";
    const visibleText = String(source?.visibleText || "");
    const evidenceText = `${source?.title || ""} ${source?.description || ""} ${visibleText}`;
    const classification = classifyWebsitePage(source);
    let score = classification.categoryPriority;

    if (isSameHost(url, rootUrl)) score += 20;
    if (looksLikeContentUrl(url)) score += 8; // Useful discovery hint, not a blanket blog preference.
    if (visibleText.length >= 2500) score += 35;
    else if (visibleText.length >= 1200) score += 25;
    else if (visibleText.length >= 700) score += 15;
    else if (visibleText.length >= 500) score += 8;

    if (/\b(202[0-9]|19[89][0-9])\b/.test(evidenceText)) score += 8;
    if (/\b(\d+(?:[.,]\d+)?\s?(?:%|million|billion|crore|lakh|thousand|users?|customers?|clients?|employees?|projects?))\b/i.test(evidenceText)) score += 12;
    if (/\b(delivered|deployed|launched|implemented|renewed|retained|audited|certified|filed|acquired|partnered|shipped)\b/i.test(evidenceText)) score += 10;
    if (Array.isArray(source?.headings)) score += Math.min(8, source.headings.length);
    if (isLegalUrl(url)) score -= 500;

    return score;
}

function filterWebsiteEvidenceSources(sources = [], rootUrl = "") {
    // Failed, blocked, login, and platform-error responses are not evidence.
    // A failed secondary page is omitted without failing an otherwise usable
    // primary website investigation.
    const usableSources = (Array.isArray(sources) ? sources : [])
        .filter(source => !source?.fetchFailure);
    const deduped = dedupeSources(usableSources);
    const rootNormalized = normalizeUrl(rootUrl);

    const classifySource = source => ({
        ...source,
        ...classifyWebsitePage(source),
        investigationRelevanceScore: scoreWebsitePostSource(source, rootUrl)
    });

    const rootSourceRaw = deduped.find(source => {
        const requestedUrl = normalizeUrl(source?.requestedUrl || "");
        const sourceUrl = normalizeUrl(source?.sourceUrl || source?.canonicalUrl || "");
        const status = Number(source?.status || 0);
        const isSubmittedRoot = requestedUrl === rootNormalized || sourceUrl === rootNormalized;
        return isSubmittedRoot && status >= 200 && status < 300;
    }) || null;
    const rootSource = rootSourceRaw ? classifySource(rootSourceRaw) : null;

    // Every eligible same-host public page may be considered, not only blog/article URLs.
    // Page categories create investigation coverage; they are discovery metadata, not proof.
    const websitePostCandidates = deduped
        .filter(source =>
            (source?.sourcePlatform || source?.platform || detectPlatform(source?.sourceUrl || "")) === "website"
        )
        .filter(source => isWebsitePostSource(source, rootUrl))
        .map(source => ({
            source: classifySource(source),
            index: 0,
            score: scoreWebsitePostSource(source, rootUrl)
        }))
        .sort((a, b) => b.score - a.score);

    const limit = Math.max(0, MAX_SOURCES - (rootSource ? 1 : 0));
    const selected = [];
    const selectedUrls = new Set();
    const categoryWinners = new Map();

    for (const candidate of websitePostCandidates) {
        const category = candidate.source.pageCategory || "general_company_information";
        const current = categoryWinners.get(category);
        if (!current || candidate.score > current.score) categoryWinners.set(category, candidate);
    }

    const categoryOrder = [...categoryWinners.values()].sort((a, b) => b.score - a.score);
    for (const candidate of categoryOrder) {
        const url = normalizeUrl(candidate.source?.sourceUrl || candidate.source?.canonicalUrl || "");
        if (!url || selectedUrls.has(url) || selected.length >= limit) continue;
        selected.push(candidate.source);
        selectedUrls.add(url);
    }

    for (const candidate of websitePostCandidates) {
        const url = normalizeUrl(candidate.source?.sourceUrl || candidate.source?.canonicalUrl || "");
        if (!url || selectedUrls.has(url) || selected.length >= limit) continue;
        selected.push(candidate.source);
        selectedUrls.add(url);
    }

    // The root page is retained separately; category-aware ranking chooses the other pages.
    const selectedWebsiteSources = [
        ...(rootSource ? [rootSource] : []),
        ...selected
    ];

    // Preserve explicit non-website source objects exactly as received.
    const nonWebsiteSources = deduped.filter(source => {
        const platform = source?.sourcePlatform || source?.platform || detectPlatform(source?.sourceUrl || "");
        return platform !== "website";
    });

    const finalSelected = dedupeSources([...selectedWebsiteSources, ...nonWebsiteSources]);
    const categoryCounts = finalSelected
        .filter(source => (source?.sourcePlatform || source?.platform || detectPlatform(source?.sourceUrl || "")) === "website")
        .reduce((counts, source) => {
            const category = source.pageCategory || "general_company_information";
            counts[category] = (counts[category] || 0) + 1;
            return counts;
        }, {});

    return {
        sources: finalSelected,
        originalSourceCount: deduped.length,
        websitePostCandidateCount: websitePostCandidates.length,
        websitePostSelectedCount: selected.length,
        filteredSourceCount: finalSelected.length,
        filteredOutSourceCount: Math.max(0, deduped.length - finalSelected.length),
        filteredSourceUrls: finalSelected.map(source => source?.sourceUrl).filter(Boolean),
        websitePageCategoryCounts: categoryCounts,
        discoveredSocialLinks: unique(
            deduped.flatMap(source => Array.isArray(source?.socialLinks) ? source.socialLinks : []),
            MAX_SOCIAL_LINKS,
            rootUrl
        )
    };
}

function dedupeSources(sources = []) {
    const map = new Map();

    for (const source of sources) {
        const key = normalizeUrl(source?.canonicalUrl || source?.sourceUrl || "") || source?.sourceUrl || "";
        if (!key) continue;

        const existing = map.get(key);
        if (!existing) {
            map.set(key, source);
            continue;
        }

        const existingLength = Number(existing?.contentLength || existing?.visibleText?.length || 0);
        const currentLength = Number(source?.contentLength || source?.visibleText?.length || 0);

        if (currentLength > existingLength) {
            map.set(key, source);
        }
    }

    return [...map.values()];
}

function buildSource({ url, response, html }) {
    const sourceUrl = response?.url || url;
    const platform = detectPlatform(sourceUrl);
    const title = extractTitle(html) || extractMeta(html, "og:title") || null;
    const description = extractMeta(html, "description") || extractMeta(html, "og:description") || null;
    const visibleText = extractText(html);
    const socialLinks = unique(
[
    ...extractSocialLinks(html, sourceUrl),
    ...extractJsonLdSocialLinks(html, sourceUrl)
],
MAX_SOCIAL_LINKS
);
    const links = extractHrefLinks(html, sourceUrl);
    const headings = extractHeadings(html);
    const structured = extractPlatformEvidence(html, sourceUrl, platform);
    const contentCandidates = extractContentCandidates(html, sourceUrl);

    const articles = [...structured.articles];
    if (
        articles.length === 0 &&
        looksLikeContentUrl(sourceUrl) &&
        visibleText.length >= 500
    ) {
        articles.push({
            title: title || null,
            description: visibleText.slice(0, 2200),
            url: sourceUrl,
            author: structured.author || null,
            publishedAt: structured.publishedAt || null,
            sourceType: "fetched-content-page"
        });
    }

    const pageEvidence = [];

    if (title) {
        pageEvidence.push({
            type: "page-title",
            sourceUrl,
            value: cleanText(title, 500)
        });
    }

    if (description) {
        pageEvidence.push({
            type: "description",
            sourceUrl,
            value: cleanText(description, 800)
        });
    }

    if (headings.length) {
        pageEvidence.push({
            type: "headings",
            sourceUrl,
            value: headings.slice(0, 20)
        });
    }

    if (visibleText.length >= 180) {
        pageEvidence.push({
            type: "page-content",
            sourceUrl,
            value: visibleText.slice(0, 6000)
        });
    }

    for (const candidate of contentCandidates.slice(0, 20)) {
        pageEvidence.push({
            type: candidate.sourceType,
            sourceUrl: candidate.url || sourceUrl,
            value: candidate.description || candidate.title || ""
        });
    }
    return {
        requestedUrl: normalizeUrl(url) || url,
        sourceUrl,
        finalUrl: sourceUrl,
        redirected: !!response?.redirected || normalizeUrl(sourceUrl) !== normalizeUrl(url),
        canonicalUrl: structured.canonicalUrl || extractCanonical(html, sourceUrl),
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
        articles: articles.slice(0, MAX_ARTICLES),
        author: structured.author,
        publishedAt: structured.publishedAt,
        ogTitle: structured.ogTitle,
        ogType: structured.ogType,
        publicEvidence: pageEvidence.slice(0, MAX_EVIDENCE),
        contentCandidates: contentCandidates.slice(0, MAX_CONTENT_LINKS),
        contentLength: visibleText.length,
        fetchTimestamp: new Date().toISOString()
    };
}

function buildCollectionFailure({
    requestedUrl = "",
    finalUrl = "",
    platform = "website",
    status = 0,
    reasonCode = "PRIMARY_SOURCE_UNAVAILABLE",
    technicalDetail = "The primary public source could not be collected."
} = {}) {
    return {
        code: "PRIMARY_SOURCE_COLLECTION_FAILED",
        stage: "public_content_fetch",
        reasonCode,
        requestedUrl: normalizeUrl(requestedUrl) || requestedUrl || null,
        finalUrl: normalizeUrl(finalUrl) || finalUrl || null,
        platform: platform || "website",
        httpStatus: Number(status) || null,
        technicalDetail: String(technicalDetail || "Primary public source unavailable.").slice(0, 700),
        retryable: [408, 425, 429, 500, 502, 503, 504].includes(Number(status)) || reasonCode === "FETCH_TIMEOUT"
    };
}

function detectPageCollectionFailure({ requestedUrl = "", response = null, source = null, fetchError = null } = {}) {
    const finalUrl = normalizeUrl(response?.url || source?.finalUrl || source?.sourceUrl || requestedUrl) || requestedUrl;
    const platform = source?.platform || source?.sourcePlatform || "website";
    const status = Number(response?.status ?? source?.status ?? 0);

    if (fetchError) {
        const aborted = fetchError?.name === "AbortError";
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status: 0,
            reasonCode: aborted ? "FETCH_TIMEOUT" : "FETCH_REQUEST_FAILED",
            technicalDetail: aborted
                ? "The request timed out before the primary page content could be retrieved."
                : (fetchError?.message || "The primary page request failed.")
        });
    }

    if (status >= 400) {
        const reasonCode = status === 401 || status === 403
            ? "ACCESS_RESTRICTED"
            : status === 404
                ? "PRIMARY_URL_NOT_FOUND"
                : status === 429
                    ? "RATE_LIMITED"
                    : status >= 500
                        ? "PLATFORM_SERVER_ERROR"
                        : "HTTP_ERROR";
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status,
            reasonCode,
            technicalDetail: `The primary URL returned HTTP ${status}${response?.statusText ? ` ${response.statusText}` : ""}.`
        });
    }

    let finalPath = "";
    try { finalPath = new URL(finalUrl).pathname.toLowerCase(); } catch {}
    if (/\/(?:login|log-in|signin|sign-in|checkpoint|auth)(?:\/|$)/i.test(finalPath)) {
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status,
            reasonCode: "LOGIN_REDIRECT",
            technicalDetail: `The requested URL resolved to an authentication page (${finalUrl}). Public page content was not returned.`
        });
    }

    const title = String(source?.title || "").trim();
    const visibleText = String(source?.visibleText || "").replace(/\s+/g, " ").trim();
    const description = String(source?.description || "").trim();
    const pageText = `${title} ${description} ${visibleText}`.toLowerCase();
    const explicitErrorPatterns = [
        /sorry[, ]+something went wrong/i,
        /we(?:'|’)re working on getting this fixed/i,
        /access denied/i,
        /request blocked/i,
        /temporarily unavailable/i,
        /service unavailable/i,
        /verify (?:that )?you are human/i,
        /checking your browser/i,
        /unusual traffic/i,
        /this page isn(?:'|’)t available/i,
        /content isn(?:'|’)t available/i,
        /please log in to continue/i,
        /you must log in to view/i
    ];
    const matchedError = explicitErrorPatterns.find(pattern => pattern.test(pageText));
    const errorTitle = /^(error|access denied|request blocked|page unavailable|service unavailable|robot check|captcha)$/i.test(title);
    const strongAccessChallengePatterns = [
        /robot check/i,
        /to discuss automated access to amazon/i,
        /automated access to amazon/i,
        /enter the characters you see below/i,
        /type the characters you see in this image/i,
        /we just need to make sure you(?:'|’)re not a robot/i,
        /verify (?:that )?you(?:'|’)re not a robot/i,
        /complete the security check/i,
        /human verification required/i,
        /your request has been blocked/i,
        /attention required[!|: ]+cloudflare/i,
        /checking your browser before accessing/i,
        /enable javascript and cookies to continue/i
    ];
    const matchedAccessChallenge = strongAccessChallengePatterns.find(pattern => pattern.test(pageText));

    if (matchedAccessChallenge) {
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status,
            reasonCode: "ACCESS_RESTRICTED",
            technicalDetail: `The response appears to be an automated-access, CAPTCHA, or security-challenge page rather than the requested public content: ${visibleText.slice(0, 320) || title}`
        });
    }

    if (matchedError && (visibleText.length < 2400 || errorTitle || /facebook\.com|linkedin\.com|x\.com|twitter\.com/i.test(finalUrl))) {
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status,
            reasonCode: "PLATFORM_ERROR_PAGE",
            technicalDetail: `The response contained a platform-generated error or access-interruption page: ${visibleText.slice(0, 260) || title || "No page content"}`
        });
    }

    if (errorTitle && visibleText.length < 900 && description.length < 120) {
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status,
            reasonCode: "GENERIC_ERROR_PAGE",
            technicalDetail: `The primary page title was "${title}" and the returned page contained too little substantive content to investigate.`
        });
    }

    const meaningfulContentChars = visibleText.length + description.length +
        (Array.isArray(source?.headings) ? source.headings.join(" ").length : 0) +
        (Array.isArray(source?.posts) ? source.posts.reduce((sum, item) => sum + String(item?.text || item?.description || item?.title || "").length, 0) : 0) +
        (Array.isArray(source?.articles) ? source.articles.reduce((sum, item) => sum + String(item?.text || item?.description || item?.title || "").length, 0) : 0);

    if (meaningfulContentChars < 35) {
        return buildCollectionFailure({
            requestedUrl,
            finalUrl,
            platform,
            status,
            reasonCode: "NO_USABLE_PUBLIC_CONTENT",
            technicalDetail: "The request returned a page, but no substantive public text, description, headings, or useful links could be extracted."
        });
    }

    return null;
}

function extractPlatformEvidence(html = "", url = "", platform = "") {
    const structured = extractStructuredContent(html, url);
    const heuristicArticles = extractArticleBlocks(html, url);

    const articles = [...structured.articles];
    const articleFingerprints = new Set(
        articles.map(item => JSON.stringify(item))
    );

    for (const item of heuristicArticles) {
        const fingerprint = JSON.stringify(item);
        if (articleFingerprints.has(fingerprint)) continue;
        articleFingerprints.add(fingerprint);
        articles.push(item);
        if (articles.length >= MAX_ARTICLES) break;
    }

    const evidence = [];
    const title = extractTitle(html);
    const description = extractMeta(html, "description") || extractMeta(html, "og:description");
    const ogTitle = extractMeta(html, "og:title");
    const ogType = extractMeta(html, "og:type");
    const author = extractAuthor(html);
    const publishedAt = extractDate(html);
    const visibleText = extractText(html);

    const addEvidence = (type, value, sourceUrl = url) => {
        const clean = Array.isArray(value)
            ? value.map(item => cleanText(item, 240)).filter(Boolean)
            : cleanText(value, 2000);

        if (!clean || (Array.isArray(clean) && clean.length === 0)) return;

        evidence.push({
            type,
            sourceUrl,
            value: clean
        });
    };

    addEvidence("page-title", title || ogTitle);
    addEvidence("description", description);
    addEvidence("author", author);
    addEvidence("published-at", publishedAt);
    addEvidence("platform", platform);

    if (visibleText.length >= 180) {
        addEvidence("page-content", visibleText.slice(0, 6000));
    }

    addEvidence(
        "headings",
        extractHeadings(html).slice(0, 20)
    );

    for (const article of articles.slice(0, 20)) {
        addEvidence(
            "article",
            article.description || article.title || "",
            article.url || url
        );
    }

    for (const post of structured.posts.slice(0, 20)) {
        addEvidence(
            "post",
            post.description || post.title || "",
            post.url || url
        );
    }

    return {
        canonicalUrl: extractCanonical(html, url),
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

function shouldQueueUrl(url, rootUrl) {
    if (!url) return false;

    const platform = detectPlatform(url);

    // Cross-platform discovery belongs to CrossEvidenceBrain.
    // PCF fetches the requested public profile itself, but it must not
    // recursively crawl social-platform assets/help/legal/CDN URLs.
    if (platform !== "website") return false;
    if (!isSameHost(url, rootUrl)) return false;
    if (isLegalUrl(url)) return false;
    if (/\.(?:css|js|mjs|map|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot|mp4|mp3|wav|zip|rar|7z|pdf)$/i.test(url)) return false;

    return true;
}

function enqueueUrls(queue, urls, visited, rootUrl) {
    const existing = new Set(queue);

    for (const url of urls) {
        const normalized = normalizeUrl(url, rootUrl);
        if (!normalized) continue;
        if (visited.has(normalized)) continue;
        if (existing.has(normalized)) continue;
        if (!shouldQueueUrl(normalized, rootUrl)) continue;

        queue.push(normalized);
        existing.add(normalized);
    }

    sortQueue(queue, rootUrl);
}

export async function acquirePublicContent({
    profileLinks = []
} = {}) {
    const requested = Array.isArray(profileLinks)
        ? profileLinks.map(value => normalizeUrl(value)).filter(Boolean)
        : [];
    const rootUrl = requested[0] || "";
    const queue = [...requested];
    const visited = new Set();
    const sources = [];
    const discoveredSitemaps = new Set();
    let sitemapSeeded = false;

    // First discover sitemap content for the supplied website.
    if (rootUrl && detectPlatform(rootUrl) === "website") {
        const sitemapUrls = await discoverSitemapUrls(rootUrl);
        for (const sitemapUrl of sitemapUrls) discoveredSitemaps.add(sitemapUrl);
        enqueueUrls(queue, sitemapUrls, visited, rootUrl);
        sitemapSeeded = true;
    }

    // Always keep the explicit user-provided URLs at the front.
    sortQueue(queue, rootUrl);
    for (const requestedUrl of requested.reverse()) {
        const index = queue.indexOf(requestedUrl);
        if (index > -1) queue.splice(index, 1);
        queue.unshift(requestedUrl);
    }

    while (queue.length > 0 && sources.length < MAX_FETCH_ATTEMPTS) {
        const rawUrl = queue.shift();
        const url = normalizeUrl(rawUrl, rootUrl);

        if (!url || visited.has(url)) continue;
        visited.add(url);

        try {
            const response = await fetchWithTimeout(url, {
                method: "GET",
                redirect: "follow",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9"
                }
            });

            const html = await response.text();
            const source = buildSource({
                url,
                response,
                html
            });
            source.fetchFailure = detectPageCollectionFailure({
                requestedUrl: url,
                response,
                source
            });

            sources.push(source);

            // Never use links embedded in an error/login/challenge page as
            // crawl seeds. If the submitted primary URL fails, stop collection
            // immediately; failed secondary pages are skipped independently.
            if (source.fetchFailure) {
                if (normalizeUrl(url) === normalizeUrl(rootUrl)) break;
                continue;
            }

            // Discover more public links from a usable fetched source.
            enqueueUrls(
    queue,
    [
        ...(source.links || []),

        ...(source.socialLinks || []),

        ...(source.contentCandidates || [])
            .map(item => item?.url)
            .filter(Boolean),

        ...(source.articles || [])
            .map(item => item?.url)
            .filter(Boolean),

        ...(source.posts || [])
            .map(item => item?.url)
            .filter(Boolean)
    ],
    visited,
    rootUrl
);
            // Sitemap discovery is seeded once for the root website.
            // Do not refetch the same sitemap set for every internal page.
            if (
                !sitemapSeeded &&
                source.platform === "website" &&
                isSameHost(source.sourceUrl, rootUrl)
            ) {
                const sitemapUrls = await discoverSitemapUrls(source.sourceUrl);
                for (const sitemapUrl of sitemapUrls) discoveredSitemaps.add(sitemapUrl);
                enqueueUrls(queue, sitemapUrls, visited, rootUrl);
                sitemapSeeded = true;
            }
        } catch (error) {
            const failedSource = {
                requestedUrl: url,
                sourceUrl: url,
                finalUrl: url,
                redirected: false,
                canonicalUrl: null,
                platform: detectPlatform(url),
                sourcePlatform: detectPlatform(url),
                status: 0,
                statusText: null,
                title: null,
                description: null,
                visibleText: "",
                socialLinks: [],
                links: [],
                headings: [],
                posts: [],
                articles: [],
                publicEvidence: [],
                contentCandidates: [],
                contentLength: 0,
                error: error?.name === "AbortError"
                    ? "Public source fetch timed out."
                    : (error?.message || "Public source fetch failed."),
                fetchTimestamp: new Date().toISOString()
            };
            failedSource.fetchFailure = detectPageCollectionFailure({
                requestedUrl: url,
                source: failedSource,
                fetchError: error
            });
            sources.push(failedSource);
        }
    }

    const finalSources = dedupeSources(sources).slice(0, MAX_FETCH_ATTEMPTS);
    const primarySource = sources.find(source =>
        normalizeUrl(source?.requestedUrl || source?.sourceUrl || "") === rootUrl
    ) || null;

    if (!primarySource) {
        const failure = buildCollectionFailure({
            requestedUrl: rootUrl,
            finalUrl: rootUrl,
            platform: detectPlatform(rootUrl),
            reasonCode: "PRIMARY_SOURCE_NOT_FETCHED",
            technicalDetail: "The submitted primary URL did not produce a fetch result."
        });
        console.warn("PCF_PRIMARY_INVESTIGATION_FAILED", JSON.stringify(failure));
        return {
            success: false,
            investigationFailure: true,
            failure,
            stage: "Public Content Fetcher",
            sourceCount: 0,
            originalSourceCount: sources.length,
            filteredSourceCount: 0,
            sources: []
        };
    }

    if (primarySource.fetchFailure) {
        console.warn("PCF_PRIMARY_INVESTIGATION_FAILED", JSON.stringify(primarySource.fetchFailure));
        return {
            success: false,
            investigationFailure: true,
            failure: primarySource.fetchFailure,
            stage: "Public Content Fetcher",
            sourceCount: 0,
            originalSourceCount: sources.length,
            filteredSourceCount: 0,
            sources: []
        };
    }

    const filteredEvidence = filterWebsiteEvidenceSources(
        finalSources,
        rootUrl
    );

    console.log(
        "PCF_WEBSITE_POST_FILTRATION",
        JSON.stringify({
            originalSourceCount: filteredEvidence.originalSourceCount,
            websitePostCandidateCount: filteredEvidence.websitePostCandidateCount,
            websitePostSelectedCount: filteredEvidence.websitePostSelectedCount,
            targetWebsitePageCount: MAX_SOURCES,
            websitePageCategoryCounts: filteredEvidence.websitePageCategoryCounts,
            maxFetchAttempts: MAX_FETCH_ATTEMPTS,
            filteredSourceCount: filteredEvidence.filteredSourceCount,
            filteredOutSourceCount: filteredEvidence.filteredOutSourceCount,
            filteredSourceUrls: filteredEvidence.filteredSourceUrls
        }, null, 2)
    );

    return {
        success: true,
        investigationFailure: false,
        primarySourceCollected: true,
        primarySourceUrl: rootUrl,
        stage: "Public Content Fetcher",
        sourceCount: filteredEvidence.filteredSourceCount,
        originalSourceCount: filteredEvidence.originalSourceCount,
        filteredSourceCount: filteredEvidence.filteredSourceCount,
        websitePostCandidateCount: filteredEvidence.websitePostCandidateCount,
        websitePostSelectedCount: filteredEvidence.websitePostSelectedCount,
        targetWebsitePageCount: MAX_SOURCES,
        websitePageCategoryCounts: filteredEvidence.websitePageCategoryCounts,
        maxFetchAttempts: MAX_FETCH_ATTEMPTS,
        filteredOutSourceCount: filteredEvidence.filteredOutSourceCount,
        discoveredSitemaps: [...discoveredSitemaps].slice(0, MAX_SITEMAPS),
        // Social links remain untouched on their original source objects.
        discoveredSocialLinks: filteredEvidence.discoveredSocialLinks,
        sources: filteredEvidence.sources
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
        sourceCount: Array.isArray(content.sources) ? content.sources.length : 0,
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

    const sources = Array.isArray(content.sources)
        ? content.sources
        : [];

    return {
        ...content,
        sourceCount: sources.length,

        sources: sources.map(source => {

         /*   console.log(
                "CLEAN_BEFORE",
                JSON.stringify({
                    sourceUrl: source?.sourceUrl,
                    socialLinks: source?.socialLinks?.length || 0,
                    visibleText: source?.visibleText?.length || 0,
                    articles: source?.articles?.length || 0
                })
            );*/

            const cleanedSource = {
                ...source,

                title:
                    cleanText(
                        source?.title || "",
                        300
                    ) || null,

                description:
                    cleanText(
                        source?.description || "",
                        800
                    ) || null,

                visibleText:
                    cleanText(
                        source?.visibleText || "",
                        MAX_VISIBLE_TEXT
                    ),

                socialLinks: unique(
                    source?.socialLinks || [],
                    MAX_SOCIAL_LINKS,
                    source?.sourceUrl || ""
                ),

                links: unique(
                    source?.links || [],
                    MAX_LINKS,
                    source?.sourceUrl || ""
                ),

                headings: Array.isArray(
                    source?.headings
                )
                    ? source.headings
                        .map(item =>
                            cleanText(item, 240)
                        )
                        .filter(Boolean)
                        .slice(0, MAX_HEADINGS)
                    : [],

                posts: Array.isArray(
                    source?.posts
                )
                    ? source.posts.slice(
                        0,
                        MAX_POSTS
                    )
                    : [],

                articles: Array.isArray(
                    source?.articles
                )
                    ? source.articles.slice(
                        0,
                        MAX_ARTICLES
                    )
                    : [],

                contentCandidates: Array.isArray(
                    source?.contentCandidates
                )
                    ? source.contentCandidates.slice(
                        0,
                        MAX_CONTENT_LINKS
                    )
                    : [],

                publicEvidence: Array.isArray(
                    source?.publicEvidence
                )
                    ? source.publicEvidence.slice(
                        0,
                        MAX_EVIDENCE
                    )
                    : []
            };

       /*     console.log(
                "CLEAN_AFTER",
                JSON.stringify({
                    sourceUrl:
                        cleanedSource?.sourceUrl,
                    socialLinks:
                        cleanedSource?.socialLinks
                            ?.length || 0,
                    visibleText:
                        cleanedSource?.visibleText
                            ?.length || 0,
                    articles:
                        cleanedSource?.articles
                            ?.length || 0
                })
            );*/

            return cleanedSource;

        })
    };
}
export function extractPublicContent(content = {}) {
    const sources = Array.isArray(content?.sources) ? content.sources : [];
  console.log(
  "EXTRACT_START"
);
/*   console.log(
  "SOURCE_FIELD_SIZES",
  JSON.stringify(
    sources.map(source => ({
      url: source?.sourceUrl,

      visibleText:
        source?.visibleText?.length || 0,

      links:
        JSON.stringify(
          source?.links || []
        ).length,

      socialLinks:
        JSON.stringify(
          source?.socialLinks || []
        ).length,

      headings:
        JSON.stringify(
          source?.headings || []
        ).length,

      posts:
        JSON.stringify(
          source?.posts || []
        ).length,

      articles:
        JSON.stringify(
          source?.articles || []
        ).length,

      contentCandidates:
        JSON.stringify(
          source?.contentCandidates || []
        ).length,

      publicEvidence:
        JSON.stringify(
          source?.publicEvidence || []
        ).length
    })),
    null,
    2
  )
);
   console.log(
  "AFTER_SOURCE_FIELD_SIZES"
);
   console.log(
  "EXTRACT_SOURCES_CHARS",
  JSON.stringify(sources).length
);
    const source = sources[0] || {};
console.log(
  "EXTRACT_VISIBLE_TEXT",
  source?.visibleText?.length || 0
);
   console.log(
  "EXTRACT_END"
); */
    return {
    title: sources
        .map(s => s?.title || "")
        .join("\n"),

    description: sources
        .map(s => s?.description || "")
        .join("\n"),

    visibleText: sources
        .map(s => s?.visibleText || "")
        .join("\n\n"),

    socialLinks: sources.flatMap(
        s => Array.isArray(s?.socialLinks)
            ? s.socialLinks
            : []
    ),

    links: sources.flatMap(
        s => Array.isArray(s?.links)
            ? s.links
            : []
    ),

    headings: sources.flatMap(
        s => Array.isArray(s?.headings)
            ? s.headings
            : []
    ),

    posts: sources.flatMap(
        s => Array.isArray(s?.posts)
            ? s.posts
            : []
    ),

    articles: sources.flatMap(
        s => Array.isArray(s?.articles)
            ? s.articles
            : []
    ),

    publicEvidence: sources.flatMap(
        s => Array.isArray(s?.publicEvidence)
            ? s.publicEvidence
            : []
    ),

    canonicalUrl:
        sources[0]?.canonicalUrl || null,

    author:
        sources[0]?.author || null,

    publishedAt:
        sources[0]?.publishedAt || null,

    contentLength:
        sources.reduce(
            (sum, s) =>
                sum + (s?.contentLength || 0),
            0
        ),

    sourceCount: sources.length,

    sources
};
}

function buildContentInventoryPackage(sources = []) {
    const list = Array.isArray(sources) ? sources : [];
    return {
        sourceCount: list.length,
        originalSourceCount: list.length,
        contentCharacters: list.reduce((sum, source) => sum + String(source?.visibleText || "").length, 0),
        pages: list.map(source => ({
            url: source?.sourceUrl || source?.canonicalUrl || null,
            title: source?.title || null,
            pageCategory: source?.pageCategory || null,
            pageCategories: Array.isArray(source?.pageCategories) ? source.pageCategories : [],
            contentCharacters: String(source?.visibleText || "").length
        }))
    };
}

export function buildPublicContentPackage(
    rawPackage = {},
    extractedPackage = {}
) {
   
    const sources = Array.isArray(rawPackage?.sources)
        ? rawPackage.sources
        : [];
const contentInventoryPackage = buildContentInventoryPackage(sources);
    const source = sources[0] || {};

    return {
        success: true,
       contentCompressionPackage: null,
       contentInventoryPackage,
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
        sourceCount: sources.length,
        sources
    };
}
