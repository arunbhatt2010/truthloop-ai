/* ============================================================
   CROSS EVIDENCE BRAIN v29 — PCF 30-PAGE WEBSITE OWNERSHIP + CEB WEBSITE APIFY DISABLED
   TruthLoop AI

   RESPONSIBILITY
   --------------
   1. Get website evidence from PublicContentFetcher.
   2. Fetch LinkedIn when a person-profile URL is available.
   3. Fetch X when its public profile URL is found. Reddit collection is disabled.
   4. Preserve all collected evidence in one Universal Public
      Evidence Package with canonical URLs and timestamps.
   5. Build deterministic cross-source intelligence using the
      retained PCF website, additive website-scraper, LinkedIn, PCF GitHub and X evidence.

   Universal Package is a POSTMASTER:
   - delivers evidence
   - does NOT filter
   - does NOT compress
   - does NOT rank
   - does NOT select
   - does NOT investigate
   - does NOT rewrite evidence

   Evidence Compression Brain (ECB) is downstream and is the
   ONLY compression stage.

   Loop 7 is downstream and is the investigation/report stage.
   ============================================================ */

import {
    loadPublicContentFetcher,
    extractPublicContent,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";

const APIFY_ACTOR_ID = "apisamurai~linkedin-scraper";
const APIFY_TIMEOUT_SECONDS = 60;
const APIFY_MAX_TOTAL_CHARGE_USD = "0.05";
const X_APIFY_ACTOR_ID = process.env.APIFY_X_ACTOR_ID || "simple.actor~x-profile-posts";
const UNUSED_SIGNAL_MODEL = "unused";

const ENABLE_LINKEDIN_APIFY = true;
const ENABLE_CEB_WEBSITE_SCRAPER = false; // Website collection is owned by PCF.

const ENABLE_X = true;
const ENABLE_OTHER_SOCIAL = false;

const SOURCE_CACHE = new Map();

/* ------------------------------------------------------------
   BASIC URL HELPERS
   ------------------------------------------------------------ */

function normalizeUrl(value = "") {
    if (typeof value !== "string" || !value.trim()) return "";

    let cleaned = value
        .trim()
        .replace(/[),.;]+$/g, "");

    if (/^\/\//.test(cleaned)) {
        cleaned = `https:${cleaned}`;
    }

    if (!/^https?:\/\//i.test(cleaned)) return "";

    try {
        const url = new URL(cleaned);

        if (!/^https?:$/.test(url.protocol)) return "";

        if (
            url.hostname === "in.linkedin.com" ||
            url.hostname === "www.linkedin.com"
        ) {
            url.hostname = "www.linkedin.com";
        }

        return url.toString();
    } catch {
        return "";
    }
}

function detectPlatform(value = "") {
    try {
        const hostname = new URL(value)
            .hostname
            .replace(/^www\./, "")
            .toLowerCase();

        if (hostname.includes("linkedin.com")) return "linkedin";
        if (hostname.includes("facebook.com")) return "facebook";
        if (hostname.includes("instagram.com")) return "instagram";
        if (hostname === "x.com" || hostname.includes("twitter.com")) return "x";
        if (hostname.includes("github.com")) return "github";
        if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";
        if (hostname.includes("medium.com")) return "medium";
        if (hostname.includes("substack.com")) return "substack";
        if (hostname.includes("reddit.com")) return "reddit";

        return "website";
    } catch {
        return "unknown";
    }
}

function uniqueUrls(values = []) {
    const seen = new Set();
    const result = [];

    for (const value of values) {
        const url = normalizeUrl(value);
        if (!url || seen.has(url)) continue;

        seen.add(url);
        result.push(url);
    }

    return result;
}

/* ------------------------------------------------------------
   LINK URL FALLBACK DISCOVERY — CEB ONLY
   Walk the already-supplied footprint package for LinkedIn URLs
   that may arrive under a different nested field name. This does
   not make a network request and does not alter other brain files.
   ------------------------------------------------------------ */
function collectLinkedInUrls(value, maxNodes = 8000, maxDepth = 12) {
    const found = [];
    const visited = new Set();
    let visitedNodes = 0;

    const visit = (node, depth) => {
        if (node == null || depth > maxDepth || visitedNodes >= maxNodes) return;
        visitedNodes += 1;

        if (typeof node === "string") {
            const matches = node.match(/https?:\/\/(?:[a-z0-9-]+\.)*linkedin\.com\/[^\s"'<>()[\]{}]+/gi) || [];
            for (const match of matches) {
                const cleaned = match.replace(/[),.;]+$/g, "");
                if (/linkedin\.com\//i.test(cleaned)) found.push(cleaned);
            }
            return;
        }

        if (typeof node !== "object") return;
        if (visited.has(node)) return;
        visited.add(node);

        if (Array.isArray(node)) {
            for (const item of node) visit(item, depth + 1);
            return;
        }

        for (const child of Object.values(node)) visit(child, depth + 1);
    };

    visit(value, 0);
    return uniqueUrls(found);
}

function isLinkedInProfileUrl(value = "") {
    try {
        const url = new URL(value);
        return /linkedin\.com$/i.test(url.hostname.replace(/^www\./i, "")) &&
            /^\/(?:in|pub)\//i.test(url.pathname);
    } catch {
        return false;
    }
}

function isLinkedInCompanyUrl(value = "") {
    try {
        const url = new URL(value);
        return /linkedin\.com$/i.test(url.hostname.replace(/^www\./i, "")) &&
            /^\/company\//i.test(url.pathname);
    } catch {
        return false;
    }
}

function isLinkedInActorTargetUrl(value = "") {
    return isLinkedInCompanyUrl(value) || isLinkedInProfileUrl(value);
}

function safeText(value = "") {
    if (typeof value !== "string") return "";
    return value
        .replace(/\u0000/g, "")
        .trim();
}

/* ------------------------------------------------------------
   UNIVERSAL PACKAGE CONTENT COMPRESSOR
   ------------------------------------------------------------
   Runs AFTER evidence collection + signal collection.

   Rules:
   - meaningful compression only
   - NEVER modify URLs / links
   - NEVER modify titles
   - NEVER modify dates
   - preserve object / array structure
   - metadata text is compressed meaningfully
   ------------------------------------------------------------ */

const UNIVERSAL_CONTENT_MAX_CHARS = 900;
const UNIVERSAL_ITEM_TEXT_MAX_CHARS = 420;
const UNIVERSAL_ABOUT_MAX_CHARS = 900;
const UNIVERSAL_METADATA_MAX_CHARS = 360;
const UNIVERSAL_SIGNAL_TEXT_MAX_CHARS = 320;

function isImmutableEvidenceKey(key = "") {
    const k = String(key || "").toLowerCase();

    return (
        k === "url" ||
        k.endsWith("url") ||
        k.includes("url") ||
        k === "link" ||
        k.endsWith("link") ||
        k.includes("link") ||
        k === "links" ||
        k === "sociallinks" ||
        k === "socialprofiles" ||
        k === "sourceurls" ||
        k === "sourcelinks" ||
        k === "title" ||
        k === "date" ||
        k === "publisheddate" ||
        k === "publishedat" ||
        k === "postedat" ||
        k === "createdat" ||
        k === "updatedat" ||
        k === "timestamp" ||
        k === "id" ||
        k === "sourceid"
    );
}

function splitMeaningfulSentences(value = "") {
    const text = safeText(value)
        .replace(/\s+/g, " ")
        .trim();

    if (!text) return [];

    const sentences =
        text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    return sentences
        .map(item => item.trim())
        .filter(Boolean);
}

function scoreMeaningfulSentence(sentence = "", key = "") {
    const text = String(sentence || "");
    const lower = text.toLowerCase();

    let score = 0;

    if (text.length >= 45) score += 2;
    if (/\b(i|we|our|my|company|product|build|built|work|worked|focus|help|serve|customer|client|founder|engineer|developer|ai|software|business|revenue|project|open source|repository|repo)\b/i.test(text)) {
        score += 3;
    }

    if (/\b(is|are|was|were|builds|built|creates|created|works|helps|serves|develops|ships|leads|focuses|specializes|supports)\b/i.test(text)) {
        score += 1;
    }

    if (/https?:\/\/|www\./i.test(text)) score -= 3;
    if (/^[\W_]+$/.test(text)) score -= 3;

    if (
        ["about", "bio", "summary", "description", "content",
         "text", "body", "articletext", "posttext", "visibletext"].includes(
            String(key || "").toLowerCase()
        )
    ) {
        score += 1;
    }

    return score;
}

function meaningfulCompressText(value = "", maxChars = UNIVERSAL_CONTENT_MAX_CHARS, key = "") {
    const text = safeText(value);
    if (!text) return "";

    if (text.length <= maxChars) return text;

    const sentences = splitMeaningfulSentences(text)
        .map(sentence => ({
            sentence,
            score: scoreMeaningfulSentence(sentence, key)
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.sentence.length - b.sentence.length;
        });

    const selected = [];
    let used = 0;

    for (const item of sentences) {
        if (used + item.sentence.length + (selected.length ? 1 : 0) > maxChars) continue;
        selected.push(item.sentence);
        used += item.sentence.length + (selected.length ? 1 : 0);
        if (used >= Math.floor(maxChars * 0.85)) break;
    }

    if (!selected.length) {
        return text.slice(0, maxChars).trim();
    }

    return selected.join(" ").trim();
}

function compressUniversalContent(value, maxChars = UNIVERSAL_CONTENT_MAX_CHARS, key = "") {
    if (typeof value === "string") {
        if (isImmutableEvidenceKey(key)) return value;

        const lowerKey = String(key || "").toLowerCase();

        if (
            lowerKey === "about" ||
            lowerKey === "bio" ||
            lowerKey === "summary"
        ) {
            return meaningfulCompressText(
                value,
                UNIVERSAL_ABOUT_MAX_CHARS,
                key
            );
        }

        if (
            lowerKey === "text" ||
            lowerKey === "content" ||
            lowerKey === "description" ||
            lowerKey === "snippet" ||
            lowerKey === "visibletext" ||
            lowerKey === "body" ||
            lowerKey === "articletext" ||
            lowerKey === "posttext"
        ) {
            return meaningfulCompressText(
                value,
                UNIVERSAL_ITEM_TEXT_MAX_CHARS,
                key
            );
        }

        return meaningfulCompressText(
            value,
            maxChars,
            key
        );
    }

    if (Array.isArray(value)) {
        return value.map(item =>
            compressUniversalContent(
                item,
                maxChars,
                key
            )
        );
    }

    if (value && typeof value === "object") {
        const result = {};

        for (const [childKey, childValue] of Object.entries(value)) {
            let childMax = maxChars;

            const lowerKey = childKey.toLowerCase();

            if (
                lowerKey === "about" ||
                lowerKey === "summary" ||
                lowerKey === "bio"
            ) {
                childMax = UNIVERSAL_ABOUT_MAX_CHARS;
            } else if (
                lowerKey === "text" ||
                lowerKey === "content" ||
                lowerKey === "description" ||
                lowerKey === "snippet" ||
                lowerKey === "visibletext" ||
                lowerKey === "body" ||
                lowerKey === "articletext" ||
                lowerKey === "posttext"
            ) {
                childMax = UNIVERSAL_ITEM_TEXT_MAX_CHARS;
            } else if (
                lowerKey === "company" ||
                lowerKey === "location" ||
                lowerKey === "country" ||
                lowerKey === "headline" ||
                lowerKey === "repository" ||
                lowerKey === "repoDescription"
            ) {
                childMax = UNIVERSAL_METADATA_MAX_CHARS;
            } else if (
                lowerKey === "signal" ||
                lowerKey === "basis" ||
                lowerKey === "reason" ||
                lowerKey === "rationale"
            ) {
                childMax = UNIVERSAL_SIGNAL_TEXT_MAX_CHARS;
            }

            result[childKey] =
                compressUniversalContent(
                    childValue,
                    childMax,
                    childKey
                );
        }

        return result;
    }

    return value;
}

function compressUniversalSource(source = {}) {
    return compressUniversalContent(
        source,
        UNIVERSAL_CONTENT_MAX_CHARS
    );
}

function compressUniversalSignals(signals = {}) {
    return compressUniversalContent(
        signals,
        UNIVERSAL_SIGNAL_TEXT_MAX_CHARS
    );
}

function selectLatestLinkedInItem(items = [], type = "post") {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];

    const getTime = item => {
        const raw =
            item?.datePublished ||
            item?.publishedAt ||
            item?.date ||
            item?.createdAt ||
            item?.timestamp ||
            "";

        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const filtered =
        type === "article"
            ? list.filter(item =>
                String(item?.postType || "").toLowerCase() === "article" ||
                !!safeText(item?.headline) ||
                !!safeText(item?.articleUrl)
            )
            : list.filter(item =>
                String(item?.postType || "").toLowerCase() !== "article"
            );

    return [...filtered].sort((a, b) => {
        const tb = getTime(b);
        const ta = getTime(a);

        if (tb !== ta) return tb - ta;

        const bText =
            safeText(b?.text).length +
            safeText(b?.content).length +
            safeText(b?.headline).length;

        const aText =
            safeText(a?.text).length +
            safeText(a?.content).length +
            safeText(a?.headline).length;

        return bText - aText;
    })[0] || null;
}


function selectLatestLinkedInItems(items = [], type = "post", limit = 10) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];

    const getTime = item => {
        const raw =
            item?.datePublished ||
            item?.publishedAt ||
            item?.date ||
            item?.createdAt ||
            item?.timestamp ||
            "";

        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const filtered =
        type === "article"
            ? list.filter(item =>
                String(item?.postType || "").toLowerCase() === "article" ||
                !!safeText(item?.headline) ||
                !!safeText(item?.articleUrl)
            )
            : list.filter(item =>
                String(item?.postType || "").toLowerCase() !== "article"
            );

    return [...filtered]
        .sort((a, b) => {
            const tb = getTime(b);
            const ta = getTime(a);

            if (tb !== ta) return tb - ta;

            const bText =
                safeText(b?.text).length +
                safeText(b?.content).length +
                safeText(b?.headline).length;

            const aText =
                safeText(a?.text).length +
                safeText(a?.content).length +
                safeText(a?.headline).length;

            return bText - aText;
        })
        .slice(0, Math.max(0, Number(limit) || 0));
}

/* ------------------------------------------------------------
   WEBSITE COLLECTION
   ------------------------------------------------------------ */

async function fetchWebsiteEvidence(primaryUrl) {

    const normalizedUrl = normalizeUrl(primaryUrl);

    if (!normalizedUrl) {
        return {
            success: false,
            reason: "Invalid primary public URL.",
            sources: []
        };
    }

    /*
     * IMPORTANT:
     * This is the only PCF call made by this CEB.
     * PCF owns website collection/discovery.
     * CEB does not re-filter those results.
     */
    const rawPackage = await loadPublicContentFetcher({
        profileLinks: [normalizedUrl]
    });

    const extractedPackage = extractPublicContent(rawPackage);

    const packageResult = buildPublicContentPackage(
        rawPackage,
        extractedPackage
    );

    const sources = Array.isArray(packageResult?.sources)
        ? packageResult.sources
        : [];

    return {
        success: true,
        sourceUrl: normalizedUrl,
        sources
    };
}

/* ------------------------------------------------------------
   APIFY WEBSITE CONTENT CRAWLER — ADDITIVE WEBSITE EVIDENCE
   Uses the saved Apify Task and tested Perak input settings.
   Adds explicit outbound evidence URLs as bounded crawl seeds.
   Existing PublicContentFetcher route remains unchanged.
   ------------------------------------------------------------ */
const WEBSITE_CRAWLER_TASK_ID =
    process.env.APIFY_WEBSITE_CRAWLER_TASK_ID ||
    "susurrant_topiary~website-content-crawler-task";

function buildWebsiteCrawlerInput(targetUrls) {
    const seeds = [...new Set((Array.isArray(targetUrls) ? targetUrls : [targetUrls])
        .map(normalizeUrl).filter(Boolean))].slice(0, 13);
    return {
        aggressivePrune: false,
        blockMedia: true,
        clickElementsCssSelector: "",
        clientSideMinChangePercentage: 15,
        crawlerType: "playwright:adaptive",
        debugLog: false,
        debugMode: false,
        expandIframes: false,
        ignoreCanonicalUrl: false,
        ignoreHttpsErrors: false,
        keepUrlFragments: false,
        proxyConfiguration: { useApifyProxy: true },
        readableTextCharThreshold: 100,
        removeCookieWarnings: true,
        removeElementsCssSelector: "nav, footer, script, style, noscript, svg, img[src^='data:'], [role='alert'], [role='banner'], [role='dialog'], [role='alertdialog'], [role='region'][aria-label*='skip' i], [aria-modal='true']",
        renderingTypeDetectionPercentage: 10,
        respectRobotsTxtFile: true,
        reuseStoredDetectionResults: false,
        saveFiles: false,
        saveHtml: false,
        saveHtmlAsFile: false,
        saveMarkdown: true,
        saveScreenshots: false,
        signHttpRequests: false,
        startUrls: seeds.map(url => ({ url })),
        storeSkippedUrls: false,
        summarize: false,
        useLlmsTxt: false,
        useSitemaps: true,
        includeUrlGlobs: [],
        excludeUrlGlobs: [],
        maxCrawlDepth: 2,
        maxCrawlPages: 24,
        onlyCrawlPagesModifiedSince: "",
        customHttpHeaders: {},
        initialConcurrency: 2,
        maxConcurrency: 4,
        requestTimeoutSecs: 60,
        minFileDownloadSpeedKBps: 128,
        maxRequestRetries: 1,
        maxSessionRotations: 2,
        dynamicContentWaitSecs: 2,
        waitForSelector: "",
        softWaitForSelector: "",
        maxScrollHeightPixels: 2000,
        pageFunction: "",
        keepElementsCssSelector: "",
        htmlTransformer: "readableText",
        maxResults: 24
    };
}

function classifyWebsitePage(url = "", title = "") {
    const value = `${url} ${title}`.toLowerCase();

    // Independent evidence categories are deliberately identified before
    // generic company-site categories. Classification is metadata only;
    // it does not imply that a source is authentic or independently verified.
    if (/nseindia|bseindia|mca\.gov|sebi\.gov|roc\b|stock-exchange|exchange-filings|regulatory|annual-report|annualreports|investor-presentation|financial-results|quarterly-results/.test(value)) return "stock_exchange_regulatory_and_financial";
    if (/glassdoor|ambitionbox|indeed|kununu|comparably|employee-review|employer-review|workplace-review/.test(value)) return "employee_and_former_employee_perspectives";
    if (/trustpilot|mouthshut|consumercomplaints|complaint|bbb\.org|g2\.com|capterra|clutch\.co|productreview|customer-review|client-review/.test(value)) return "customer_reviews_and_complaints";
    if (/case-study|case_study|customer-story|client-story|success-story|customer-success|client-results/.test(value)) return "independent_client_case_studies";
    if (/github\.com/.test(value)) return "github_and_technical_artifacts";
    if (/investor|financial|revenue|profit|balance-sheet|cash-flow|earnings|dividend|filing|prospectus|credit-rating/.test(value)) return "independent_financial_documents";
    if (/press|news|media|journal|publication|interview|third-party/.test(value)) return "independent_third_party_sources";

    if (/about|founder|leadership|team|management/.test(value)) return "company_and_leadership";
    if (/product|service|solution|feature|platform/.test(value)) return "products_and_services";
    if (/customer|client|testimonial/.test(value)) return "company_published_customer_material";
    if (/pricing|plan|price|billing/.test(value)) return "pricing_and_business_model";
    if (/partner|affiliate|integration/.test(value)) return "partnerships";
    if (/career|jobs|hiring/.test(value)) return "careers_and_hiring";
    if (/delivery|operation|workflow/.test(value)) return "operations";
    return "general_company_information";
}

// Extract only explicit, public outbound URLs already present in collected
// website evidence. These become additional crawler seeds; no URL is guessed.
function collectExternalEvidenceSeeds(sources = [], primaryUrl = "") {
    const primaryHost = (() => {
        try { return new URL(primaryUrl).hostname.replace(/^www\./i, "").toLowerCase(); }
        catch { return ""; }
    })();
    const candidates = [];
    const add = value => {
        if (typeof value !== "string") return;
        const matches = value.match(/https?:\/\/[^\s"'<>\\)\]}]+/gi) || [];
        for (const match of matches) candidates.push(match.replace(/[),.;]+$/g, ""));
        if (/^https?:\/\//i.test(value.trim())) candidates.push(value.trim());
    };
    const walk = (value, depth = 0) => {
        if (depth > 5 || value == null) return;
        if (typeof value === "string") { add(value); return; }
        if (Array.isArray(value)) { for (const item of value) walk(item, depth + 1); return; }
        if (typeof value === "object") {
            for (const [key, child] of Object.entries(value)) {
                if (/url|link|href|markdown|content|text|visibletext|description/i.test(key)) walk(child, depth + 1);
            }
        }
    };
    for (const source of Array.isArray(sources) ? sources : []) walk(source);

    const seen = new Set();
    const seeds = [];
    for (const raw of candidates) {
        const url = normalizeUrl(raw);
        if (!url || seen.has(url)) continue;
        let host = "";
        try { host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase(); } catch {}
        if (!host || host === primaryHost || host.endsWith(`.${primaryHost}`)) continue;
        // Keep likely evidence destinations; social networks are handled by
        // their dedicated collectors and are not duplicated here.
        if (/linkedin\.com|facebook\.com|instagram\.com|(^|\.)x\.com|twitter\.com|youtube\.com|reddit\.com|github\.com|gitlab\.com|bitbucket\.org/i.test(host)) continue;
        seen.add(url);
        seeds.push(url);
        if (seeds.length >= 12) break;
    }
    return seeds;
}

async function fetchWebsiteEvidenceFromApifyTask(targetUrl, additionalSeedUrls = []) {
    const normalizedUrl = normalizeUrl(targetUrl);
    const crawlerSeedUrls = [normalizedUrl, ...(Array.isArray(additionalSeedUrls) ? additionalSeedUrls : [])]
        .map(normalizeUrl).filter(Boolean).filter((url, index, all) => all.indexOf(url) === index).slice(0, 13);
    const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "";
    if (!normalizedUrl) return { success: false, reason: "Invalid website URL.", sources: [] };
    if (!token) return { success: false, reason: "Apify token environment variable is missing.", sources: [] };
    if (!WEBSITE_CRAWLER_TASK_ID) return { success: false, reason: "Website crawler task ID is missing.", sources: [] };

    const endpoint = `https://api.apify.com/v2/actor-tasks/${encodeURIComponent(WEBSITE_CRAWLER_TASK_ID)}/run-sync-get-dataset-items?timeout=180&maxItems=24&maxTotalChargeUsd=0.05`;
    const startedAt = Date.now();
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(buildWebsiteCrawlerInput(crawlerSeedUrls))
        });
        const raw = await response.text();
        if (!response.ok) {
            let errorPayload = null;
            try { errorPayload = raw.trim() ? JSON.parse(raw) : null; } catch {}
            const apiMessage = [
                errorPayload?.error?.message,
                errorPayload?.error?.type,
                errorPayload?.message,
                errorPayload?.statusMessage,
                errorPayload?.data?.statusMessage,
                errorPayload?.data?.errorMessage
            ].filter(value => typeof value === "string" && value.trim()).join(" | ");
            const runId = errorPayload?.data?.id || errorPayload?.id || errorPayload?.runId || response.headers?.get?.("x-apify-run-id") || null;
            console.error("CEB_WEBSITE_APIFY_HTTP_ERROR", JSON.stringify({
                status: response.status,
                statusText: response.statusText || null,
                taskId: WEBSITE_CRAWLER_TASK_ID,
                seedCount: crawlerSeedUrls.length,
                maxItems: 24,
                maxTotalChargeUsd: "0.05",
                runId,
                apiMessage: apiMessage || null,
                responseBody: raw.slice(0, 1600)
            }));
            return { success: false, reason: `Apify website task HTTP ${response.status}${apiMessage ? `: ${apiMessage}` : ""}`, sources: [], runId };
        }
        let rows;
        try { rows = raw.trim() ? JSON.parse(raw) : []; }
        catch { return { success: false, reason: "Apify website task returned invalid JSON.", sources: [] }; }
        if (!Array.isArray(rows)) rows = rows?.items || rows?.data || [];

        const rawSources = rows.filter(row => row && typeof row === "object").slice(0, 24).map((row, index) => {
            const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
            const crawl = row.crawl && typeof row.crawl === "object" ? row.crawl : {};
            const url = normalizeUrl(row.url || crawl.loadedUrl || metadata.canonicalUrl || normalizedUrl);
            const title = safeText(metadata.title || row.title || "").slice(0, 300);
            const markdown = safeText(row.markdown || row.text || row.content || row.readableText || "");
            const pageText = markdown.slice(0, 18000);
            return {
                sourceId: `WEBSITE_CRAWLER_${String(index + 1).padStart(2, "0")}`,
                sourceType: "website_scraper",
                platform: "website",
                url,
                sourceUrl: url,
                canonicalUrl: normalizeUrl(metadata.canonicalUrl || url) || url,
                title: title || null,
                pageCategory: classifyWebsitePage(url, title),
                sourceDomain: (() => { try { return new URL(url).hostname; } catch { return null; } })(),
                sourceIndependence: (() => { try { const h = new URL(url).hostname.replace(/^www\./i, "").toLowerCase(); const p = new URL(normalizedUrl).hostname.replace(/^www\./i, "").toLowerCase(); return h === p || h.endsWith(`.${p}`) ? "same_entity_domain_unverified" : "external_domain_requires_identity_verification"; } catch { return "unknown"; } })(),
                content: pageText,
                text: pageText,
                markdown: pageText,
                description: safeText(metadata.description || "").slice(0, 1200) || null,
                author: safeText(metadata.author || "").slice(0, 160) || null,
                language: safeText(metadata.languageCode || "").slice(0, 20) || null,
                publishedAt: metadata.datePublished || metadata.dateModified || null,
                httpStatusCode: crawl.httpStatusCode ?? null,
                loadedAt: crawl.loadedTime || null,
                crawlDepth: Number.isFinite(Number(crawl.depth)) ? Number(crawl.depth) : null,
                contentType: crawl.contentType || null,
                structuredData: Array.isArray(metadata.jsonLd) ? metadata.jsonLd.slice(0, 12) : [],
            };
        }).filter(source => source.url && (source.content || source.description || source.structuredData.length));

        // Seven topic-specific slots are selected from the same bounded crawl.
        // A page is marked "collected" only when its content contains a
        // topic-specific evidence signal. Contextual pages are retained as
        // "weak_match" so Loop 7 can use them cautiously without treating
        // page discovery as proof.
        const topicDefinitions = [
            {
                key: "independent_third_party_sources",
                label: "Independent Third-Party Sources",
                strong: /independent review|third-party report|external assessment|independent coverage|media interview|industry publication|analyst report|partner directory|certification registry/i,
                contextual: /news|media|press|publication|interview|review|directory|certification|partner/i
            },
            {
                key: "stock_exchange_regulatory_records",
                label: "Stock Exchange / Regulatory Records",
                strong: /exchange filing|annual report|quarterly results|financial results|shareholding pattern|corporate announcement|board meeting outcome|regulatory filing|sebi|nse|bse|mca|cin|director identification|auditor report/i,
                contextual: /investor|stock exchange|regulatory|filing|annual report|financial results|corporate governance|shareholder|dividend/i
            },
            {
                key: "independent_client_case_studies",
                label: "Independent Client Case Studies",
                strong: /published by the client|client-published|customer-published|independent case study|named customer|measurable outcome|before and after|implementation results|customer success story/i,
                contextual: /case study|case-study|customer story|client story|implementation|customer|client|results|outcomes/i
            },
            {
                key: "customer_reviews_complaints",
                label: "Customer Reviews / Complaints",
                strong: /verified purchase|verified review|customer complaint|consumer complaint|resolved complaint|unresolved complaint|customer rating|reviewed by customers|service complaint/i,
                contextual: /trustpilot|mouthshut|consumercomplaints|g2|capterra|clutch|bbb|customer review|complaint|rating/i
            },
            {
                key: "employee_former_employee_perspectives",
                label: "Employee / Former Employee Perspectives",
                strong: /current employee|former employee|employee review|workplace review|interview experience|management review|work culture|salary review|attrition/i,
                contextual: /glassdoor|ambitionbox|indeed|kununu|employee|former employee|workplace|career|salary|culture/i
            },
            {
                key: "independent_financial_documents",
                label: "Independent Financial Documents",
                strong: /audited financial statements|auditor opinion|balance sheet|profit and loss|cash flow statement|revenue breakdown|segment results|debt rating|credit rating|annual financial statements/i,
                contextual: /financial statement|auditor|annual report|revenue|profit|cash flow|balance sheet|credit rating|financial results|dividend/i
            }
        ];

        const scoreTopic = (source, definition) => {
            const url = String(source.url || "").toLowerCase();
            const title = String(source.title || "").toLowerCase();
            const body = String(source.content || "").toLowerCase();
            const structured = Array.isArray(source.structuredData)
                ? JSON.stringify(source.structuredData).toLowerCase()
                : "";
            const searchableBody = `${body} ${structured}`;
            const strongInBody = definition.strong.test(searchableBody);
            const strongInTitleOrUrl = definition.strong.test(`${title} ${url}`);
            const contextInBody = definition.contextual.test(searchableBody);
            const contextInTitleOrUrl = definition.contextual.test(`${title} ${url}`);

            // Strong evidence language in page content carries most weight.
            // A URL/title-only hit can never qualify as verified collection.
            let score = 0;
            if (strongInBody) score += 8;
            if (strongInTitleOrUrl) score += 3;
            if (contextInBody) score += 2;
            if (contextInTitleOrUrl) score += 1;

            const evidenceSignals = [];
            if (strongInBody) evidenceSignals.push("strong_content_signal");
            if (strongInTitleOrUrl) evidenceSignals.push("specific_page_title_or_url");
            if (contextInBody) evidenceSignals.push("contextual_content_signal");
            if (contextInTitleOrUrl) evidenceSignals.push("contextual_title_or_url");

            const status = strongInBody ? "collected" : (score >= 2 ? "weak_match" : "not_found");
            return { score, status, evidenceSignals };
        };

        const usedUrls = new Set();
        const targetedSources = [];
        const topicCollectionStatus = {};
        for (const definition of topicDefinitions) {
            const ranked = rawSources
                .filter(source => !usedUrls.has(source.url))
                .map(source => ({ source, ...scoreTopic(source, definition) }))
                .filter(item => item.status !== "not_found")
                .sort((a, b) => {
                    const statusWeight = (item) => item.status === "collected" ? 1000 : 0;
                    return (statusWeight(b) + b.score) - (statusWeight(a) + a.score);
                });
            const match = ranked[0];
            if (match) {
                usedUrls.add(match.source.url);
                targetedSources.push({
                    ...match.source,
                    collectionPurpose: "topic_targeted",
                    topicKey: definition.key,
                    topicLabel: definition.label,
                    topicRelevanceScore: match.score,
                    topicEvidenceStatus: match.status,
                    topicEvidenceSignals: match.evidenceSignals
                });
                topicCollectionStatus[definition.key] = {
                    status: match.status,
                    url: match.source.url,
                    title: match.source.title || null,
                    relevanceScore: match.score,
                    evidenceSignals: match.evidenceSignals,
                    reason: match.status === "collected"
                        ? "Topic-specific evidence signal found in page content."
                        : "Related page found, but direct topic-specific evidence was not established."
                };
            } else {
                topicCollectionStatus[definition.key] = {
                    status: "not_found",
                    relevanceScore: 0,
                    evidenceSignals: [],
                    reason: "No relevant page with topic-specific or contextual content was returned in the available website crawl."
                };
            }
        }

        const generalSources = rawSources
            .filter(source => !usedUrls.has(source.url))
            .slice(0, Math.max(0, 24 - targetedSources.length))
            .map(source => ({ ...source, collectionPurpose: "general_website" }));
        const sources = [...generalSources, ...targetedSources].map((source, index) => ({
            ...source,
            sourceId: `WEBSITE_CRAWLER_${String(index + 1).padStart(2, "0")}`
        }));

        console.log("CEB_WEBSITE_APIFY_RESULT", JSON.stringify({
            taskId: WEBSITE_CRAWLER_TASK_ID,
            pagesReturned: rawSources.length,
            maxAdditionalPages: 24,
            externalSeedCount: Math.max(0, crawlerSeedUrls.length - 1),
            generalPagesSelected: generalSources.length,
            topicPagesSelected: targetedSources.length,
            topicCollectionStatus,
            durationMs: Date.now() - startedAt
        }));
        return { success: sources.length > 0, sourceUrl: normalizedUrl, sources, topicCollectionStatus, durationMs: Date.now() - startedAt };
    } catch (error) {
        console.error("CEB_WEBSITE_APIFY_FAILED", error?.message || String(error));
        return { success: false, reason: error?.message || "Apify website crawl failed.", sources: [] };
    }
}

/* ------------------------------------------------------------
   LINKEDIN URL DISCOVERY
   No ranking. No scoring. First supplied/discovered URL is used.
   ------------------------------------------------------------ */

function findLinkedInUrl({
    requestedLinks = [],
    websiteSources = [],
    discoveredLinks = [],
    discoveredSocialLinks = []
} = {}) {

    const candidates = [
        ...requestedLinks,
        ...discoveredSocialLinks,
        ...discoveredLinks,
        ...collectLinkedInUrls(websiteSources)
    ];

    for (const source of websiteSources) {
        candidates.push(
            ...(Array.isArray(source?.socialLinks)
                ? source.socialLinks
                : []),
            ...(Array.isArray(source?.socialProfiles)
                ? source.socialProfiles
                : []),
            ...(Array.isArray(source?.links)
                ? source.links
                : [])
        );
    }

    const linkedinCandidates = uniqueUrls(candidates)
        .filter(url => detectPlatform(url) === "linkedin");

    // Company page is preferred for company investigations; person profiles remain supported.
    return linkedinCandidates.find(isLinkedInCompanyUrl) ||
        linkedinCandidates.find(isLinkedInProfileUrl) || "";
}

/* ------------------------------------------------------------
   GITHUB DIRECT FETCH
   No Apify. No URL rewriting.
   ------------------------------------------------------------ */

function findGitHubUrl({
    requestedLinks = [],
    websiteSources = [],
    discoveredLinks = [],
    discoveredSocialLinks = []
} = {}) {

    const candidates = [
        ...requestedLinks,
        ...discoveredSocialLinks,
        ...discoveredLinks
    ];

    for (const source of websiteSources) {
        candidates.push(
            ...(Array.isArray(source?.socialLinks) ? source.socialLinks : []),
            ...(Array.isArray(source?.socialProfiles) ? source.socialProfiles : []),
            ...(Array.isArray(source?.links) ? source.links : [])
        );
    }

    return uniqueUrls(candidates)
        .find(url => detectPlatform(url) === "github") || "";
}

function findPlatformProfileUrl(platform, { requestedLinks = [], websiteSources = [], discoveredLinks = [], discoveredSocialLinks = [] } = {}) {
    const candidates = [...requestedLinks, ...discoveredSocialLinks, ...discoveredLinks];
    for (const source of websiteSources) {
        candidates.push(
            ...(Array.isArray(source?.socialLinks) ? source.socialLinks : []),
            ...(Array.isArray(source?.socialProfiles) ? source.socialProfiles : []),
            ...(Array.isArray(source?.links) ? source.links : [])
        );
    }
    const urls = uniqueUrls(candidates).filter(url => detectPlatform(url) === platform);
    if (platform === "x") return urls.find(url => /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/[^/]+\/?(?:\?.*)?$/i.test(url)) || "";
    if (platform === "reddit") return urls.find(url => /reddit\.com\/(user|u)\/[^/]+/i.test(url)) || "";
    return urls[0] || "";
}

function profileHandleFromUrl(url, platform) {
    try {
        const parts = new URL(url).pathname.split("/").filter(Boolean);
        if (platform === "reddit") {
            const i = parts.findIndex(part => /^(user|u)$/i.test(part));
            return i >= 0 ? parts[i + 1] || "" : "";
        }
        return parts[0] || "";
    } catch { return ""; }
}

async function fetchSocialProfileAndPostsFromApify(platform, url = "") {
    if (platform === "reddit") {
        console.warn("CEB_REDDIT_COLLECTION_DISABLED", "No Reddit collector is configured; no Reddit Actor call was made.");
        return { success: false, reason: "Reddit collection is disabled in CEB.", source: null };
    }
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || detectPlatform(normalizedUrl) !== platform) {
        return { success: false, reason: `A valid public ${platform} profile URL is required.`, source: null };
    }

    const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "";
    if (!token) return { success: false, reason: "Missing APIFY_API_TOKEN.", source: null };

    const firstSocialText = (...values) => {
        for (const value of values) {
            if (typeof value === "string" && value.trim()) return value.trim();
            if (typeof value === "number" && Number.isFinite(value)) return String(value);
        }
        return "";
    };
    const actorId = X_APIFY_ACTOR_ID;
    const handle = profileHandleFromUrl(normalizedUrl, platform);
    if (!handle) return { success: false, reason: `Could not extract ${platform} profile handle.`, source: null };

    // Actor spend caps are run options (query parameters), not input fields.
    const maxCost = "0.01";
    const endpoint = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=${APIFY_TIMEOUT_SECONDS}&maxItems=10&maxTotalChargeUsd=${maxCost}`;

    // X Actor schema: one public profile URL and up to three recent posts.
    const input = {
        startUrls: [{ url: normalizedUrl }],
        handles: [],
        outputFormat: "profile",
        maxPosts: 3
    };

    const socialStartedAt = Date.now();
    console.log("APIFY_SOCIAL_CALL_START", JSON.stringify({
        platform, actorId, profileUrl: normalizedUrl, maxPosts: 3,
        comments: null,
        timeoutSeconds: APIFY_TIMEOUT_SECONDS,
        maxTotalChargeUsd: maxCost,
        inputKeys: Object.keys(input)
    }));

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(input)
        });
        const raw = await response.text();
        if (!response.ok) {
            const reason = `Apify ${platform} request failed (${response.status}): ${raw.slice(0, 500)}`;
            console.error("APIFY_SOCIAL_CALL_FAILED", JSON.stringify({ platform, status: response.status, reason }));
            return { success: false, reason, source: null };
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return { success: false, reason: `Invalid ${platform} Actor JSON.`, source: null };
        }

        // Apify's sync dataset endpoint normally returns an array. Accept common
        // wrappers too, so an Actor changing its envelope does not silently erase posts.
        const unwrapRows = value => {
            if (Array.isArray(value)) return value;
            if (!value || typeof value !== "object") return [];
            for (const key of ["items", "results", "records", "users", "accounts", "profiles", "data"] ) {
                if (Array.isArray(value[key])) return value[key];
            }
            if (value.data && typeof value.data === "object") {
                const nested = unwrapRows(value.data);
                if (nested.length) return nested;
            }
            return [value];
        };
        const rows = unwrapRows(data);
        if (!rows.length) {
            const reason = `${platform} Actor returned no records.`;
            console.warn("APIFY_SOCIAL_EMPTY_DATASET", JSON.stringify({ platform, actorId, responseChars: raw.length }));
            return { success: false, reason, source: null };
        }

        const unwrapItem = item => {
            if (!item || typeof item !== "object") return {};
            return item.post && typeof item.post === "object" ? item.post
                : item.tweet && typeof item.tweet === "object" ? item.tweet
                : item.submission && typeof item.submission === "object" ? item.submission
                : item;
        };
        const isComment = item => {
            const kind = String(item?.recordType || item?.type || item?.kind || "").toLowerCase();
            return kind === "comment" || kind === "reply" || String(item?.fullname || "").startsWith("t1_");
        };
        const looksLikePost = item => {
            const r = unwrapItem(item);
            if (!r || typeof r !== "object" || isComment(item) || isComment(r)) return false;
            const kind = String(r.recordType || r.type || r.kind || "").toLowerCase();
            if (["post", "tweet", "submission", "status"].includes(kind)) return true;
            const postUrl = firstSocialText(r.permalink, r.postUrl, r.post_url, r.tweetUrl, r.tweet_url, r.twitterUrl, r.statusUrl, r.status_url, r.url, r.link);
            const body = firstSocialText(r.text, r.fullText, r.full_text, r.content, r.selftext, r.body, r.title, r.headline);
            const date = firstSocialText(r.createdAtIso, r.createdAt, r.created_at, r.timestamp, r.publishedAt, r.date, r.created_utc);
            if (!postUrl || !body) return false;
            return /(?:x\.com|twitter\.com)\/[^/]+\/status(?:es)?\//i.test(postUrl) || !!date;
        };

        const postCandidates = [];
        const seenObjects = new Set();
        const postArrayKeys = ["recentPosts", "posts", "tweets", "latestPosts", "statuses", "submissions", "items", "results"];
        const walkForPosts = (node, depth = 0) => {
            if (!node || typeof node !== "object" || depth > 5 || seenObjects.has(node)) return;
            seenObjects.add(node);
            if (Array.isArray(node)) {
                for (const child of node) {
                    if (looksLikePost(child)) postCandidates.push(unwrapItem(child));
                    else walkForPosts(child, depth + 1);
                }
                return;
            }
            for (const key of postArrayKeys) {
                if (Array.isArray(node[key])) {
                    for (const child of node[key]) {
                        if (looksLikePost(child)) postCandidates.push(unwrapItem(child));
                        else if (child && typeof child === "object") walkForPosts(child, depth + 1);
                    }
                }
            }
            // Some Actors nest the account or post under one named property.
            for (const key of ["profile", "user", "account", "data", "result"]) {
                if (node[key] && typeof node[key] === "object") walkForPosts(node[key], depth + 1);
            }
        };
        walkForPosts(rows);
        for (const row of rows) if (looksLikePost(row)) postCandidates.push(unwrapItem(row));

        const dedupedPosts = [];
        const seenPostKeys = new Set();
        for (const item of postCandidates) {
            if (!item || typeof item !== "object" || isComment(item)) continue;
            const postUrl = normalizeUrl(firstSocialText(item.url, item.tweetUrl, item.tweet_url, item.twitterUrl, item.statusUrl, item.status_url, item.permalink, item.postUrl, item.link));
            const id = firstSocialText(item.id, item.id_str, item.tweetId, item.tweet_id, item.fullname, item.fullName, item.name, postUrl);
            if (!postUrl && !id) continue;
            const key = postUrl || id;
            if (seenPostKeys.has(key)) continue;
            seenPostKeys.add(key);
            const text = firstSocialText(item.text, item.fullText, item.full_text, item.selftext, item.body, item.content, item.title, item.headline, item.description);
            const date = firstSocialText(item.createdAtIso, item.createdAt, item.created_at, item.publishedAt, item.published_at, item.datePublished, item.postedAt, item.timestamp, item.created, item.created_utc, item.date) || null;
            dedupedPosts.push({
                id: id || null,
                title: firstSocialText(item.title, item.headline, text) || null,
                text,
                content: text,
                url: postUrl || null,
                sourceUrl: postUrl || null,
                date,
                likes: item.likeCount ?? item.likes ?? null,
                comments: item.replyCount ?? item.numComments ?? null,
                sourcePlatform: platform
            });
        }
        const parseTime = value => {
            if (value == null || value === "") return 0;
            if (typeof value === "number" || /^\d{10,13}$/.test(String(value))) {
                const n = Number(value);
                const millis = n < 1e12 ? n * 1000 : n;
                return Number.isFinite(millis) ? millis : 0;
            }
            const parsed = Date.parse(String(value));
            return Number.isFinite(parsed) ? parsed : 0;
        };
        const posts = dedupedPosts.sort((a, b) => parseTime(b.date) - parseTime(a.date)).slice(0, 3);

        const isPostRow = row => looksLikePost(row);
        const profileRow = rows.find(row => {
            if (!row || typeof row !== "object" || row.error || isPostRow(row)) return false;
            return !!(row.username || row.userName || row.handle || row.screenName || row.profileUrl || row.profileURL || row.profile || row.description || row.bio || row.tagline);
        }) || null;
        const nestedProfile = profileRow?.profile && typeof profileRow.profile === "object" ? profileRow.profile
            : profileRow?.user && typeof profileRow.user === "object" ? profileRow.user
            : profileRow?.account && typeof profileRow.account === "object" ? profileRow.account
            : profileRow || {};
        const actorError = rows.find(row => row && typeof row === "object" && row.error)?.error;
        if (actorError && !posts.length) {
            console.warn("APIFY_SOCIAL_ACTOR_ERROR", JSON.stringify({ platform, actorId, error: String(actorError).slice(0, 350), rowKeys: Object.keys(rows[0] || {}) }));
            return { success: false, reason: `${platform} Actor error: ${String(actorError).slice(0, 350)}`, source: null };
        }
        if (!profileRow && !posts.length) {
            console.warn("APIFY_SOCIAL_UNMAPPED_OUTPUT", JSON.stringify({ platform, actorId, rows: rows.length, firstRowKeys: Object.keys(rows[0] || {}) }));
            return { success: false, reason: `${platform} Actor returned records, but no recognizable profile or posts.`, source: null };
        }

        const profileUrl = normalizeUrl(firstSocialText(nestedProfile?.profileUrl, nestedProfile?.profileURL, nestedProfile?.url)) || normalizedUrl;
        const profile = {
            username: firstSocialText(nestedProfile?.username, nestedProfile?.userName, nestedProfile?.handle, nestedProfile?.screenName, handle),
            name: firstSocialText(nestedProfile?.name, nestedProfile?.displayName, nestedProfile?.fullName, nestedProfile?.username, nestedProfile?.handle, handle),
            headline: firstSocialText(nestedProfile?.headline, nestedProfile?.description, nestedProfile?.bio, nestedProfile?.tagline, nestedProfile?.about) || null,
            about: firstSocialText(nestedProfile?.about, nestedProfile?.bio, nestedProfile?.description, nestedProfile?.tagline, nestedProfile?.headline) || null,
            profileUrl,
            followers: nestedProfile?.followersCount ?? nestedProfile?.followers ?? null,
            following: nestedProfile?.followingCount ?? nestedProfile?.following ?? null
        };
        const source = {
            sourcePlatform: platform,
            platform,
            sourceHost: "x.com",
            sourceUrl: profileUrl,
            canonicalUrl: profileUrl,
            url: profileUrl,
            title: profile.name || profile.username,
            name: profile.name,
            description: profile.about,
            visibleText: [profile.name, profile.headline, profile.about, ...posts.map(post => post.text)].filter(Boolean).join("\n"),
            profile,
            posts,
            recentPosts: posts,
            sourceCount: posts.length + (profileRow ? 1 : 0),
            apifyActorId: actorId,
            apifyData: rows
        };

        console.log("APIFY_SOCIAL_CALL_DONE", JSON.stringify({
            platform,
            profileFound: !!profileRow,
            posts: posts.length,
            actorRows: rows.length,
            nestedPostCount: rows.reduce((sum, row) => sum + ([row?.recentPosts, row?.posts, row?.tweets, row?.latestPosts].find(Array.isArray)?.length || 0), 0),
            firstRowKeys: Object.keys(rows[0] || {}).slice(0, 30),
            durationMs: Date.now() - socialStartedAt
        }));
        return { success: true, source };
    } catch (error) {
        console.error("APIFY_SOCIAL_CALL_FAILED", JSON.stringify({ platform, actorId, error: error?.message || String(error) }));
        return { success: false, reason: error?.message || `${platform} Actor failed.`, source: null };
    }
}

function htmlToVisibleText(html = "") {
    if (typeof html !== "string") return "";

    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function extractMetaTag(html = "", nameOrProperty = "") {
    const key = String(nameOrProperty || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const patterns = [
        new RegExp(
            `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`,
            "i"
        ),
        new RegExp(
            `<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["'][^>]*>`,
            "i"
        )
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return safeText(match[1]);
    }

    return "";
}

/* ------------------------------------------------------------
   GITHUB COLLECTION IS PCF-OWNED
   CEB only passes through GitHub evidence already supplied by PCF.
   No second fetch or scraper is dispatched here.
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   APIFY — API SAMURAI UNIVERSAL LINKEDIN COLLECTOR
   Supports public company pages (/company/) and person profiles (/in/).
   Normalizes profile/company About, posts and articles into one source.
   ------------------------------------------------------------ */

async function fetchLinkedInFromApify(url = "") {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl || detectPlatform(normalizedUrl) !== "linkedin" || !isLinkedInActorTargetUrl(normalizedUrl)) {
        return { success: false, reason: "A valid public LinkedIn company (/company/) or person (/in/) URL is required.", source: null };
    }

    const cached = SOURCE_CACHE.get(normalizedUrl);
    if (cached) return { success: true, source: cached, cached: true };

    const apiToken = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "";
    if (!apiToken) {
        console.error("APIFY_LINKEDIN_DISABLED", "Missing APIFY_API_TOKEN");
        return { success: false, reason: "Missing APIFY_API_TOKEN.", source: null };
    }

    const isCompanyTarget = isLinkedInCompanyUrl(normalizedUrl);
    const actorInput = {
        profileUrls: isCompanyTarget ? [] : [normalizedUrl],
        companyUrls: isCompanyTarget ? [normalizedUrl] : [],
        postUrls: [],
        includePosts: true,
        maxPostsPerProfile: 20
    };

    const endpoint =
        "https://api.apify.com/v2/acts/" +
        encodeURIComponent(APIFY_ACTOR_ID) +
        "/run-sync-get-dataset-items" +
        `?timeout=${APIFY_TIMEOUT_SECONDS}` +
        "&maxItems=100" +
        `&maxTotalChargeUsd=${APIFY_MAX_TOTAL_CHARGE_USD}`;

    console.log("APIFY_LINKEDIN_CALL_START", JSON.stringify({
        actorId: APIFY_ACTOR_ID,
        targetType: isCompanyTarget ? "company" : "person",
        linkedinUrl: normalizedUrl,
        inputKeys: Object.keys(actorInput),
        maxPostsPerProfile: actorInput.maxPostsPerProfile,
        maxItems: 100,
        timeoutSeconds: APIFY_TIMEOUT_SECONDS,
        maxTotalChargeUsd: APIFY_MAX_TOTAL_CHARGE_USD,
        ts: Date.now()
    }));

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(actorInput)
        });
        const rawBody = await response.text();
        console.log("APIFY_LINKEDIN_CALL_STATUS", response.status);

        if (!response.ok) {
            let errorPayload = null;
            try { errorPayload = JSON.parse(rawBody); } catch {}
            const errorMessage = errorPayload?.error?.message || errorPayload?.message || rawBody.slice(0, 800) || "Unknown Apify error.";
            console.error("APIFY_LINKEDIN_CALL_ERROR", JSON.stringify({ status: response.status, actorId: APIFY_ACTOR_ID, message: errorMessage }));
            return { success: false, reason: `API Samurai LinkedIn request failed (${response.status}): ${errorMessage}`, source: null };
        }

        let payload;
        try { payload = JSON.parse(rawBody); }
        catch (parseError) {
            return { success: false, reason: `API Samurai returned invalid JSON: ${parseError?.message || "parse failed"}`, source: null };
        }

        const rows = Array.isArray(payload)
            ? payload.filter(row => row && typeof row === "object")
            : Array.isArray(payload?.items)
                ? payload.items.filter(row => row && typeof row === "object")
                : payload && typeof payload === "object" ? [payload] : [];

        const firstText = (...values) => {
            for (const value of values) {
                if (typeof value === "string" && value.trim()) return value.trim();
                if (typeof value === "number" && Number.isFinite(value)) return String(value);
            }
            return "";
        };
        const typeOf = row => firstText(row?.type, row?.rowType, row?.contentType, row?.postType).toLowerCase();
        const dateOf = row => row?.postedAt || row?.publishedAt || row?.datePublished || row?.publishedDate || row?.date || row?.createdAt || row?.timestamp || null;
        const urlOf = row => row?.url || row?.postUrl || row?.articleUrl || row?.activityUrl || row?.originalUrl || row?.linkedinUrl || row?.sourceUrl || row?.link || null;
        const textOf = row => firstText(row?.text, row?.content, row?.articleText, row?.postText, row?.description, row?.body, row?.summary);
        const titleOf = row => firstText(row?.title, row?.headline, row?.articleTitle, row?.documentTitle);
        const isArticleRow = row => {
            const type = typeOf(row);
            const candidateUrl = String(urlOf(row) || "");
            return type.includes("article") || !!row?.articleUrl || /\/pulse\//i.test(candidateUrl);
        };

        const targetRow = rows.find(row => {
            const type = typeOf(row);
            return isCompanyTarget
                ? type === "company" || !!row?.companyType || !!row?.employeeCount || !!row?.universalName
                : type === "profile" || type === "person" || !!row?.fullName || !!row?.firstName;
        }) || rows[0] || {};

        const nestedPosts = [
            ...(Array.isArray(targetRow?.recentPosts) ? targetRow.recentPosts : []),
            ...(Array.isArray(targetRow?.posts) ? targetRow.posts : []),
            ...(Array.isArray(targetRow?.latestPosts) ? targetRow.latestPosts : [])
        ];
        const nestedArticles = [
            ...(Array.isArray(targetRow?.articles) ? targetRow.articles : []),
            ...(Array.isArray(targetRow?.recentArticles) ? targetRow.recentArticles : [])
        ];
        const explicitActivityRows = rows.filter(row => {
            const type = typeOf(row);
            return type === "post" || type.includes("article") || !!row?.postUrl || !!row?.articleUrl;
        });
        const activityRows = [...nestedPosts, ...nestedArticles, ...explicitActivityRows]
            .filter(row => row && typeof row === "object");

        const seen = new Set();
        const uniqueRows = activityRows.filter(row => {
            const itemUrl = String(urlOf(row) || "").trim();
            const itemText = textOf(row);
            const title = titleOf(row);
            if (!itemUrl || (!itemText && !title)) return false;
            const key = itemUrl.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        const normalizeActivity = (row, kind) => {
            const itemUrl = normalizeUrl(String(urlOf(row) || "")) || String(urlOf(row) || "");
            const text = textOf(row);
            const title = titleOf(row);
            const publishedAt = dateOf(row);
            return {
                ...row,
                postType: kind,
                title: title || null,
                ...(kind === "article" ? { headline: title || null, articleUrl: itemUrl } : {}),
                text: text || title || "",
                content: text || title || "",
                date: publishedAt || null,
                datePublished: publishedAt || null,
                publishedAt: publishedAt || null,
                postedAt: publishedAt || null,
                url: itemUrl,
                sourceUrl: itemUrl,
                postUrl: kind === "post" ? itemUrl : (row?.postUrl || null),
                sourceName: firstText(row?.sourceName, row?.authorName, row?.author?.name, targetRow?.name, targetRow?.fullName) || null
            };
        };

        const allPosts = uniqueRows.filter(row => !isArticleRow(row)).map(row => normalizeActivity(row, "post"));
        const allArticles = uniqueRows.filter(isArticleRow).map(row => normalizeActivity(row, "article"));
        const posts = selectLatestLinkedInItems(allPosts, "post", 20);
        const articles = selectLatestLinkedInItems(allArticles, "article", 20);

        const targetUrl = normalizeUrl(String(urlOf(targetRow) || targetRow?.profileUrl || targetRow?.companyUrl || normalizedUrl)) || normalizedUrl;
        const about = firstText(targetRow?.about, targetRow?.description, targetRow?.overview, targetRow?.summary, targetRow?.bio, targetRow?.slogan, targetRow?.tagline);
        const profileName = firstText(targetRow?.name, targetRow?.fullName, targetRow?.companyName, targetRow?.firstName);
        const profile = {
            ...targetRow,
            entityType: isCompanyTarget ? "company" : "person",
            profileUrl: targetUrl,
            linkedinUrl: targetUrl,
            companyUrl: isCompanyTarget ? targetUrl : (targetRow?.companyUrl || null),
            name: profileName || null,
            fullName: firstText(targetRow?.fullName, profileName) || null,
            headline: firstText(targetRow?.headline, targetRow?.tagline, targetRow?.slogan) || null,
            about: about || null,
            description: about || null,
            currentCompany: firstText(targetRow?.currentCompany, targetRow?.company) || null,
            location: firstText(targetRow?.location, targetRow?.headquarters) || null,
            followersCount: targetRow?.followersCount ?? targetRow?.followers ?? null,
            connectionsCount: targetRow?.connectionsCount ?? targetRow?.connections ?? null,
            website: firstText(targetRow?.website, targetRow?.websiteUrl) || null,
            industry: firstText(targetRow?.industry) || null,
            companySize: firstText(targetRow?.size, targetRow?.companySize, targetRow?.employeeRange) || null,
            employeeCount: targetRow?.employeeCount ?? null,
            headquarters: firstText(targetRow?.headquarters, targetRow?.location) || null,
            founded: targetRow?.founded ?? null,
            specialties: Array.isArray(targetRow?.specialties) ? targetRow.specialties : [],
            companyType: firstText(targetRow?.companyType) || null,
            tagline: firstText(targetRow?.tagline, targetRow?.slogan) || null,
            slug: firstText(targetRow?.slug, targetRow?.universalName) || null
        };

        const visibleText = [
            profile.name ? `Name: ${profile.name}` : "",
            profile.headline ? `Headline: ${profile.headline}` : "",
            profile.about ? `About: ${profile.about}` : "",
            profile.industry ? `Industry: ${profile.industry}` : "",
            profile.companySize ? `Company size: ${profile.companySize}` : "",
            profile.employeeCount != null ? `Employees: ${profile.employeeCount}` : "",
            profile.headquarters ? `Headquarters: ${profile.headquarters}` : "",
            ...posts.map(row => textOf(row)),
            ...articles.map(row => [titleOf(row), textOf(row)].filter(Boolean).join("\n"))
        ].filter(Boolean).join("\n");

        const source = {
            sourceUrl: targetUrl,
            canonicalUrl: targetUrl,
            sourcePlatform: "linkedin",
            platform: "linkedin",
            sourceHost: "www.linkedin.com",
            status: 200,
            fetchStatus: "success",
            title: profile.name || profile.headline || "LinkedIn Public Page",
            description: about || profile.headline || "",
            visibleText,
            contentLength: visibleText.length,
            socialLinks: [targetUrl],
            socialProfiles: [targetUrl],
            linkedinProfile: profile,
            profile,
            posts,
            articles,
            apifyData: rows
        };
        SOURCE_CACHE.set(normalizedUrl, source);
        SOURCE_CACHE.set(targetUrl, source);

        console.log("APIFY_LINKEDIN_RESULT_COUNTS", JSON.stringify({
            actorId: APIFY_ACTOR_ID,
            targetType: profile.entityType,
            targetUrl,
            rawRows: rows.length,
            validUniqueItems: uniqueRows.length,
            postsAvailable: allPosts.length,
            articlesAvailable: allArticles.length,
            postsSelectedForAnalysis: posts.length,
            articlesSelectedForAnalysis: articles.length,
            profileAboutChars: String(profile.about || "").length,
            companyEmployeeCount: profile.employeeCount,
            elapsedTargetSeconds: APIFY_TIMEOUT_SECONDS
        }));
        return { success: true, source };
    } catch (error) {
        console.error("APIFY_LINKEDIN_CALL_FAILED", error?.message || "Unknown error");
        return { success: false, reason: error?.message || "API Samurai LinkedIn fetch failed.", source: null };
    }
}

/* ------------------------------------------------------------
   LOCAL SIGNAL MASTER
   ONE CALL. SIGNALS ONLY.
   ------------------------------------------------------------ */

async function buildSignalSignals({
    websiteEvidence = [],
    linkedinEvidence = null,
    githubEvidence = null,
    xEvidence = null,
    redditEvidence = null
} = {}) {

    /*
     * Signal Intelligence Layer
     * --------------------------
     * Function name intentionally preserved for downstream compatibility.
     * Existing package keys are preserved; additional evidence-grounded
     * signal families are additive only.
     *
     * No external AI call.
     * No evidence deletion.
     * No URL/title/date rewriting.
     */

    const safeArray = value =>
        Array.isArray(value) ? value.filter(Boolean) : [];

    const clean = value =>
        safeText(value)
            .replace(/\s+/g, " ")
            .trim();

    const unique = values =>
        [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];

    const SIGNAL_STOP_WORDS = new Set([
        "https", "http", "html", "www", "linkedin", "github",
        "com", "org", "page", "pages", "website", "source",
        "public", "article", "articles", "post", "posts", "activity",
        "feed", "update", "urn", "li"
    ]);

    const normalizeText = value =>
        clean(value)
            .toLowerCase()
            .replace(/https?:\/\/\S+/g, " ")
            .replace(/\b(?:https?|www)\b/g, " ")
            .split(/\s+/)
            .filter(token => {
                const bare = token.replace(/[^a-z0-9_-]/gi, "");
                return bare && !SIGNAL_STOP_WORDS.has(bare);
            })
            .join(" ");

    const escapeRegex = value =>
        String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const countTerm = (text, term) => {
        const source = normalizeText(text);
        if (!source || !term) return 0;
        const pattern = new RegExp(
            `\\b${escapeRegex(term.toLowerCase())}\\b`,
            "g"
        );
        return (source.match(pattern) || []).length;
    };

    const countTerms = (text, terms = []) =>
        terms.reduce((sum, term) => sum + countTerm(text, term), 0);

    const getUrl = source =>
        normalizeUrl(
            source?.permalink || source?.tweetUrl || source?.tweet_url ||
            source?.twitterUrl || source?.statusUrl || source?.sourceUrl ||
            source?.canonicalUrl || source?.url || source?.postUrl ||
            source?.articleUrl || source?.profileUrl || ""
        );

    const getDateRaw = source =>
        source?.createdAtIso || source?.datePublished || source?.publishedAt ||
        source?.published_at || source?.date || source?.createdAt ||
        source?.created_at || source?.created_utc || source?.timestamp || "";

    const getTime = source => {
        const raw = getDateRaw(source);
        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const formatDate = source => {
        const time = getTime(source);
        return time ? new Date(time).toISOString() : "";
    };

    const daysSince = source => {
        const time = getTime(source);
        if (!time) return null;
        return Math.max(
            0,
            Math.floor((Date.now() - time) / 86400000)
        );
    };

    const add = (bucket, text, urls = [], basis = "", confidence = 0.84, extra = {}) => {
        const signal = clean(text);
        if (!signal) return;

        bucket.push({
            signal: signal.slice(0, 320),
            supportingSourceUrls: unique(urls).slice(0, 8),
            basis: clean(basis).slice(0, 320),
            confidence: Math.max(0.75, Math.min(0.98, Number(Number(confidence).toFixed(2)))),
            ...extra
        });
    };

    const websiteItems = safeArray(websiteEvidence);
    const linkedin = linkedinEvidence && typeof linkedinEvidence === "object"
        ? linkedinEvidence
        : null;
    const linkedinPosts = safeArray(linkedin?.posts);
    const linkedinArticles = safeArray(linkedin?.articles);
    const github = githubEvidence && typeof githubEvidence === "object"
        ? githubEvidence
        : null;
    const x = xEvidence && typeof xEvidence === "object" ? xEvidence : null;
    const reddit = redditEvidence && typeof redditEvidence === "object" ? redditEvidence : null;
    const xProfileData = x?.profile && typeof x.profile === "object" ? x.profile : x;
    const redditProfileData = reddit?.profile && typeof reddit.profile === "object" ? reddit.profile : reddit;
    const xPosts = safeArray(x?.posts || x?.recentPosts);
    const redditPosts = safeArray(reddit?.posts || reddit?.recentPosts);

    const websiteSources = websiteItems.map(source => ({
        group: "website",
        source,
        url: getUrl(source),
        date: formatDate(source),
        time: getTime(source),
        text: normalizeText([
            source?.title,
            source?.description,
            source?.visibleText,
            source?.contentSnippet
        ].filter(Boolean).join(" "))
    }));

    const linkedinPostSources = linkedinPosts.map(item => ({
        group: "linkedin_post",
        source: item,
        url: getUrl(item),
        date: formatDate(item),
        time: getTime(item),
        text: normalizeText([
            item?.title,
            item?.headline,
            item?.text,
            item?.content,
            item?.description
        ].filter(Boolean).join(" "))
    }));

    const linkedinArticleSources = linkedinArticles.map(item => ({
        group: "linkedin_article",
        source: item,
        url: getUrl(item),
        date: formatDate(item),
        time: getTime(item),
        text: normalizeText([
            item?.title,
            item?.headline,
            item?.text,
            item?.content,
            item?.description
        ].filter(Boolean).join(" "))
    }));

    const githubSource = github
        ? {
            group: "github",
            source: github,
            url: getUrl(github),
            date: formatDate(github),
            time: getTime(github),
            text: normalizeText([
                github?.title,
                github?.description,
                github?.visibleText,
                github?.githubMetadata?.description,
                github?.githubMetadata?.visibleText
            ].filter(Boolean).join(" "))
        }
        : null;

    const xProfileSource = x ? {
        group: "x_profile", source: xProfileData,
        url: getUrl(xProfileData) || getUrl(x),
        date: formatDate(xProfileData), time: getTime(xProfileData),
        text: normalizeText([
            xProfileData?.name, xProfileData?.handle, xProfileData?.username,
            xProfileData?.headline, xProfileData?.bio, xProfileData?.about,
            xProfileData?.description
        ].filter(Boolean).join(" "))
    } : null;
    const xPostSources = xPosts.map(item => ({
        group: "x_post", source: item, url: getUrl(item), date: formatDate(item), time: getTime(item),
        text: normalizeText([item?.title, item?.text, item?.fullText, item?.full_text, item?.content, item?.description].filter(Boolean).join(" "))
    }));
    const redditProfileSource = reddit ? {
        group: "reddit_profile", source: redditProfileData,
        url: getUrl(redditProfileData) || getUrl(reddit),
        date: formatDate(redditProfileData), time: getTime(redditProfileData),
        text: normalizeText([
            redditProfileData?.name, redditProfileData?.username,
            redditProfileData?.headline, redditProfileData?.bio,
            redditProfileData?.about, redditProfileData?.description
        ].filter(Boolean).join(" "))
    } : null;
    const redditPostSources = redditPosts.map(item => ({
        group: "reddit_post", source: item, url: getUrl(item), date: formatDate(item), time: getTime(item),
        text: normalizeText([item?.title, item?.text, item?.selftext, item?.body, item?.content, item?.description].filter(Boolean).join(" "))
    }));

    const allUnits = [
        ...websiteSources,
        ...linkedinPostSources,
        ...linkedinArticleSources,
        ...(githubSource ? [githubSource] : []),
        ...(xProfileSource ? [xProfileSource] : []), ...xPostSources,
        ...(redditProfileSource ? [redditProfileSource] : []), ...redditPostSources
    ];

    const websiteUrls = unique(websiteSources.map(item => item.url));
    const linkedinUrls = unique([
        linkedin?.sourceUrl,
        linkedin?.linkedinProfile?.profileUrl,
        ...linkedinPostSources.map(item => item.url),
        ...linkedinArticleSources.map(item => item.url)
    ]);
    const githubUrls = githubSource?.url ? [githubSource.url] : [];
    const xUrls = unique([xProfileSource?.url, ...xPostSources.map(item => item.url)]);
    const redditUrls = unique([redditProfileSource?.url, ...redditPostSources.map(item => item.url)]);
    const supportUrls = unique([
        ...websiteUrls, ...linkedinUrls, ...githubUrls, ...xUrls, ...redditUrls
    ]);

    const websiteText = websiteSources.map(item => item.text).join(" ");
    const linkedinText = [
        normalizeText(linkedin?.linkedinProfile?.name),
        normalizeText(linkedin?.linkedinProfile?.headline),
        normalizeText(linkedin?.linkedinProfile?.about),
        ...linkedinPostSources.map(item => item.text),
        ...linkedinArticleSources.map(item => item.text)
    ].filter(Boolean).join(" ");
    const githubText = githubSource?.text || "";
    const xText = [xProfileSource?.text, ...xPostSources.map(item => item.text)].filter(Boolean).join(" ");
    const redditText = [redditProfileSource?.text, ...redditPostSources.map(item => item.text)].filter(Boolean).join(" ");
    const combinedText = `${websiteText} ${linkedinText} ${githubText} ${xText} ${redditText}`.trim();

    const emptySignals = {
        identity: {},
        positioning: [],
        niches: [],
        expertiseSignals: [],
        audienceSignals: [],
        businessSignals: [],
        creatorSignals: [],
        topics: [],
        recurringTopics: [],
        behavioralSignals: [],
        contradictions: [],
        crossSourceSignals: [],
        activitySignals: [],
        temporalSignals: [],
        consistencySignals: [],
        executionSignals: [],
        gapSignals: [],
        githubSignals: [],
        investigationSignals: [],
        signalConfidence: 0
    };

    /* -------------------------
       EXISTING PUBLIC TAXONOMY
       ------------------------- */

    function countMatches(text, terms) {
        if (!text || !Array.isArray(terms)) return 0;

        let count = 0;

        for (const term of terms) {
            const needle = String(term || "")
                .toLowerCase()
                .trim();

            if (!needle) continue;

            const matches =
                text.match(
                    new RegExp(
                        `\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                        "g"
                    )
                );

            count += matches ? matches.length : 0;
        }

        return count;
    }

    const topicMap = {
        "AI / Technology": ["ai", "artificial intelligence", "llm", "model", "agent", "software", "developer", "engineering"],
        "Behavior / Psychology": ["behavior", "behavioral", "psychology", "procrastination", "avoidance", "validation", "overthinking", "stuck", "identity"],
        "Sales / Clients": ["sales", "client", "clients", "customer", "customers", "revenue", "lead", "leads"],
        "Marketing / Content": ["marketing", "content", "posting", "posts", "audience", "brand", "branding", "linkedin"],
        "Business / Startup": ["business", "startup", "founder", "founders", "company", "product", "app", "service"],
        "Productivity / Execution": ["productivity", "execution", "focus", "planning", "action", "decision", "decisions", "work", "ship", "shipping", "launch", "build", "built"],
        "Coaching / Advice": ["coach", "coaching", "advice", "advise", "skills", "learn", "guide", "how to"]
    };

    const topicRows = Object.entries(topicMap).map(([topic, terms]) => ({
        topic,
        total: countTerms(combinedText, terms),
        website: countTerms(websiteText, terms),
        linkedin: countTerms(linkedinText, terms),
        github: countTerms(githubText, terms),
        x: countTerms(xText, terms),
        reddit: countTerms(redditText, terms)
    })).filter(row => row.total > 0).sort((a, b) => b.total - a.total);

    const positioning = [];
    const niches = [];
    const expertiseSignals = [];
    const audienceSignals = [];
    const businessSignals = [];
    const creatorSignals = [];
    const behavioralSignals = [];
    const contradictions = [];
    const crossSourceSignals = [];
    const activitySignals = [];
    const temporalSignals = [];
    const consistencySignals = [];
    const executionSignals = [];
    const gapSignals = [];
    const githubSignals = [];
    const investigationSignals = [];

    for (const row of topicRows.slice(0, 6)) {
        niches.push(row.topic);
        add(
            positioning,
            `Public evidence is strongly associated with ${row.topic}.`,
            [...(row.linkedin ? linkedinUrls : []), ...(row.website ? websiteUrls : []), ...(row.github ? githubUrls : [])],
            `Observed ${row.total} direct term matches across retained public evidence.`,
            row.total >= 5 ? 0.94 : 0.88
        );
    }

    for (const row of topicRows.filter(row => row.total >= 2).slice(0, 5)) {
        add(
            expertiseSignals,
            `Repeated public-content signal around ${row.topic}.`,
            unique([
                ...(row.website ? websiteUrls : []),
                ...(row.linkedin ? linkedinUrls : []),
                ...(row.github ? githubUrls : [])
            ]),
            `The topic appears repeatedly in observable public text (${row.total} matches).`,
            row.total >= 4 ? 0.94 : 0.89
        );
    }

    const audienceMap = {
        "People seeking behavioral clarity": ["procrastination", "avoidance", "overthinking", "validation", "stuck", "behavior"],
        "Founders / business operators": ["founder", "startup", "business", "company", "revenue"],
        "Creators / professionals using LinkedIn": ["posting", "linkedin", "content", "audience", "clients"]
    };

    for (const [audience, terms] of Object.entries(audienceMap)) {
        const count = countTerms(combinedText, terms);
        if (count >= 2) {
            add(
                audienceSignals,
                `Public content repeatedly addresses ${audience.toLowerCase()}.`,
                supportUrls,
                `Observed ${count} audience-related term matches.`,
                count >= 5 ? 0.93 : 0.87
            );
        }
    }

    const businessTerms = ["app", "pricing", "payment", "product", "service", "subscription", "customer", "client", "revenue", "commercial"];
    const businessScore = countTerms(combinedText, businessTerms);
    if (businessScore > 0) {
        add(
            businessSignals,
            "Public evidence contains direct product, service, or commercial language.",
            websiteUrls.length ? websiteUrls : supportUrls,
            `Observed ${businessScore} commercial term matches.`,
            Math.min(0.94, 0.84 + businessScore * 0.01)
        );
    }

    if (linkedinPosts.length) {
        add(
            creatorSignals,
            `LinkedIn evidence contains ${linkedinPosts.length} collected post item(s).`,
            linkedinUrls,
            "Count derived directly from the collected LinkedIn activity dataset.",
            0.96
        );
    }

    if (linkedinArticles.length) {
        add(
            creatorSignals,
            `LinkedIn evidence contains ${linkedinArticles.length} collected article item(s).`,
            linkedinUrls,
            "Count derived directly from the collected LinkedIn activity dataset.",
            0.96
        );
    }

    /* -------------------------
       ACTIVITY + RECENCY
       ------------------------- */

    add(
        activitySignals,
        `Website evidence set contains ${websiteItems.length} retained source item(s).`,
        websiteUrls,
        "Derived from the retained Website evidence array.",
        websiteItems.length >= 5 ? 0.97 : 0.90
    );

    add(
        activitySignals,
        `LinkedIn evidence contains ${linkedinPosts.length} post(s) and ${linkedinArticles.length} article(s).`,
        linkedinUrls,
        "Derived from the retained LinkedIn evidence arrays.",
        0.97
    );

    if (githubSource) {
        add(
            activitySignals,
            "GitHub public repository evidence is present in the investigation set.",
            githubUrls,
            "Derived directly from the GitHub source object.",
            0.97
        );
    }
    if (x) add(activitySignals, `X evidence contains ${xPostSources.length} retained post(s).`, xUrls, "Derived from normalized public X profile and post records.", xPostSources.length ? 0.95 : 0.86);
    if (reddit) add(activitySignals, `Reddit evidence contains ${redditPostSources.length} retained post(s).`, redditUrls, "Derived from normalized public Reddit profile and post records.", redditPostSources.length ? 0.95 : 0.86);

    const datedUnits = allUnits.filter(unit => unit.time > 0).sort((a, b) => a.time - b.time);
    const undatedUnits = allUnits.filter(unit => !unit.time);
    const spanDays = datedUnits.length >= 2
        ? Math.max(0, Math.floor((datedUnits[datedUnits.length - 1].time - datedUnits[0].time) / 86400000))
        : 0;

    if (datedUnits.length) {
        const newest = datedUnits[datedUnits.length - 1];
        const oldest = datedUnits[0];
        const newestAge = daysSince(newest.source);

        add(
            temporalSignals,
            `Most recent retained dated public evidence is ${newest.group} content from ${newest.date}.`,
            [newest.url],
            `Latest valid timestamp among ${datedUnits.length} dated evidence units.`,
            0.97,
            { date: newest.date, ageDays: newestAge }
        );

        add(
            temporalSignals,
            `The retained dated evidence spans approximately ${spanDays} day(s) from oldest to newest observable item.`,
            [oldest.url, newest.url],
            `Oldest dated item: ${oldest.date}; newest dated item: ${newest.date}.`,
            datedUnits.length >= 3 ? 0.95 : 0.88,
            { spanDays }
        );
    }

    if (undatedUnits.length) {
        add(
            gapSignals,
            `${undatedUnits.length} retained evidence unit(s) do not expose a usable publication timestamp in the current source shape.`,
            undatedUnits.map(unit => unit.url),
            "Timestamp unavailable or not parseable from the retained evidence fields.",
            0.96
        );
    }

    const datedPosts = linkedinPostSources.filter(item => item.time > 0).sort((a, b) => a.time - b.time);
    let maxGap = 0;
    let maxGapBefore = null;
    let maxGapAfter = null;
    if (datedPosts.length >= 2) {
        for (let i = 1; i < datedPosts.length; i += 1) {
            const gap = Math.floor((datedPosts[i].time - datedPosts[i - 1].time) / 86400000);
            if (gap > maxGap) {
                maxGap = gap;
                maxGapBefore = datedPosts[i - 1];
                maxGapAfter = datedPosts[i];
            }
        }

        if (maxGap > 0) {
            add(
                temporalSignals,
                `The largest observed gap between retained dated LinkedIn posts is approximately ${maxGap} day(s).`,
                [maxGapBefore?.url, maxGapAfter?.url],
                `Computed from adjacent dated LinkedIn posts in the retained dataset.`,
                0.95,
                { gapDays: maxGap }
            );
        }
    }

    const latestWebsite = websiteSources.filter(item => item.time > 0).sort((a, b) => b.time - a.time)[0];
    const latestLinkedIn = [...linkedinPostSources, ...linkedinArticleSources]
        .filter(item => item.time > 0)
        .sort((a, b) => b.time - a.time)[0];

    if (latestWebsite && latestLinkedIn) {
        const crossPlatformLag = Math.abs(Math.floor((latestWebsite.time - latestLinkedIn.time) / 86400000));
        add(
            temporalSignals,
            `Latest dated website and LinkedIn evidence differ by approximately ${crossPlatformLag} day(s).`,
            [latestWebsite.url, latestLinkedIn.url],
            `Website latest: ${latestWebsite.date}; LinkedIn latest: ${latestLinkedIn.date}.`,
            0.93,
            { crossPlatformLagDays: crossPlatformLag }
        );
    }

    /* -------------------------
       EXECUTION / ANALYSIS SIGNALS
       ------------------------- */

    const actionTerms = ["build", "built", "ship", "shipped", "shipping", "launch", "launched", "release", "released", "publish", "published", "sell", "sold", "experiment", "tested", "validate", "validated", "commit", "commits", "deploy", "deployed", "customer", "customers", "client", "clients"];
    const analysisTerms = ["analyze", "analysis", "pattern", "patterns", "framework", "frameworks", "awareness", "understand", "understanding", "psychology", "why", "procrastination", "avoidance", "reflection"];
    const actionCount = countTerms(combinedText, actionTerms);
    const analysisCount = countTerms(combinedText, analysisTerms);

    add(
        executionSignals,
        `Public evidence contains ${actionCount} observable action/execution language matches versus ${analysisCount} analysis/reflection matches.`,
        supportUrls,
        "Deterministic keyword-family comparison across retained public text; this is language evidence, not proof of real-world outcomes.",
        0.86
    );

    if (analysisCount > 0 && actionCount > 0 && analysisCount > actionCount * 1.5) {
        add(
            gapSignals,
            "Public language is materially more concentrated on analysis/reflection than action/execution terms.",
            supportUrls,
            `Observed ${analysisCount} analysis/reflection matches versus ${actionCount} action/execution matches.`,
            0.89
        );
    }

    if (actionCount > 0) {
        add(
            executionSignals,
            "Public evidence contains explicit execution-oriented language such as building, shipping, publishing, launching, or validating.",
            supportUrls,
            `Observed ${actionCount} execution-family matches.`,
            0.88
        );
    }

    /* -------------------------
       CONSISTENCY + CROSS-EVIDENCE
       ------------------------- */

    for (const row of topicRows) {
        const groupsPresent = [
            row.website > 0, row.linkedin > 0, row.github > 0,
            row.x > 0, row.reddit > 0
        ].filter(Boolean).length;

        if (groupsPresent >= 2) {
            add(
                consistencySignals,
                `${row.topic} appears independently across ${groupsPresent} public source groups.`,
                unique([
                    ...(row.website ? websiteUrls : []),
                    ...(row.linkedin ? linkedinUrls : []),
                    ...(row.github ? githubUrls : []),
                    ...(row.x ? xUrls : []),
                    ...(row.reddit ? redditUrls : [])
                ]),
                `Cross-source consistency is based on repeated topic-family language.`,
                groupsPresent === 3 ? 0.95 : 0.91
            );

            add(
                crossSourceSignals,
                `${row.topic} is independently visible across multiple public source groups.`,
                unique([
                    ...(row.website ? websiteUrls : []),
                    ...(row.linkedin ? linkedinUrls : []),
                    ...(row.github ? githubUrls : []),
                    ...(row.x ? xUrls : []),
                    ...(row.reddit ? redditUrls : [])
                ]),
                `Same topic family detected independently across source groups.`,
                groupsPresent === 3 ? 0.96 : 0.92
            );
        }
    }

    const websiteLower = websiteText;
    const linkedinLower = linkedinText;
    const socialText = `${xText} ${redditText}`.trim();

    const websiteNoAdvice = /\b(no advice|not advice|no coaching|not coaching)\b/i.test(websiteLower);
    const linkedinAdvisory = /\b(advice|coaching|guide|how to|skills|learn)\b/i.test(linkedinLower);
    const socialAdvisory = /\b(advice|coaching|guide|how to|skills|learn)\b/i.test(socialText);

    if (websiteNoAdvice && (linkedinAdvisory || socialAdvisory)) {
        add(
            contradictions,
            "Website positioning contains an explicit no-advice/no-coaching signal while LinkedIn evidence contains advisory language.",
            unique([
                ...websiteUrls,
                ...(linkedinAdvisory ? linkedinUrls : []),
                ...(socialAdvisory ? [...xUrls, ...redditUrls] : [])
            ]),
            "The conflicting wording is directly observable in two independently collected source groups.",
            0.95
        );
    }

    const websiteExecution = /\b(ship|shipping|launch|launching|release|released|publish|publishing|build|building|deploy|deployed|validate|validated)\b/i.test(websiteLower);
    const linkedinPlanning = /\b(planning|plan|prepare|preparing|thinking|research|framework)\b/i.test(linkedinLower);

    if (websiteExecution && linkedinPlanning) {
        add(
            crossSourceSignals,
            "Website and LinkedIn evidence show an observable tension between execution-oriented and planning/research-oriented language.",
            [...websiteUrls, ...linkedinUrls],
            "This is a language-level cross-source tension; it is not treated as proof of behavioral contradiction without stronger evidence.",
            0.87
        );
    }

    const outcomeTerms = ["users", "user", "customers", "customer", "clients", "client", "revenue", "sales", "conversion", "retention", "results", "outcomes", "metrics", "traction"];
    const outcomeCount = countTerms(combinedText, outcomeTerms);

    if (outcomeCount === 0) {
        add(
            gapSignals,
            "The retained public evidence contains no direct outcome/traction metric language sufficient to verify real-world results.",
            supportUrls,
            "No matches found for a predefined public outcome/traction vocabulary in the retained evidence.",
            0.90
        );
    } else {
        add(
            consistencySignals,
            `Public evidence contains ${outcomeCount} outcome/traction vocabulary matches, but the current evidence does not by itself verify metric values.`,
            supportUrls,
            "Outcome terminology was observed; actual numeric outcomes are not inferred unless directly present.",
            0.86
        );
    }

    /* -------------------------
       GITHUB SIGNALS
       ------------------------- */

    if (githubSource) {
        const githubActionCount = countTerms(githubText, actionTerms);
        const githubAnalysisCount = countTerms(githubText, analysisTerms);

        add(
            githubSignals,
            "GitHub confirms a public technical artifact connected to the investigated identity/product.",
            githubUrls,
            "Repository title/description/visible text is directly available from the GitHub fetch.",
            0.97
        );

        if (githubActionCount > 0) {
            add(
                githubSignals,
                `GitHub public text contains ${githubActionCount} execution/build-related language match(es).`,
                githubUrls,
                `Observed directly in the retained GitHub title/description/visible text.`,
                0.88
            );
        }

        if (githubAnalysisCount > 0) {
            add(
                githubSignals,
                `GitHub public text contains ${githubAnalysisCount} analysis/framework-related language match(es).`,
                githubUrls,
                `Observed directly in the retained GitHub title/description/visible text.`,
                0.88
            );
        }

        add(
            githubSignals,
            "Current GitHub fetch shape does not expose commit-history timestamps, so development velocity or recent inactivity cannot be established from this source alone.",
            githubUrls,
            "The collected GitHub source currently exposes profile/repository text but no commit timestamp field.",
            0.97
        );
    }

    /* -------------------------
       INVESTIGATION PRIORITIES
       ------------------------- */

    const strongestConsistency = consistencySignals
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    const strongestGap = gapSignals
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    const strongestContradiction = contradictions
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    const strongestTemporal = temporalSignals
        .slice()
        .sort((a, b) => b.confidence - a.confidence)[0];

    if (strongestConsistency) {
        add(
            investigationSignals,
            `Strongest cross-source consistency signal: ${strongestConsistency.signal}`,
            strongestConsistency.supportingSourceUrls,
            strongestConsistency.basis,
            Math.min(0.96, strongestConsistency.confidence)
        );
    }

    if (strongestContradiction) {
        add(
            investigationSignals,
            `Strongest observable contradiction/tension: ${strongestContradiction.signal}`,
            strongestContradiction.supportingSourceUrls,
            strongestContradiction.basis,
            Math.min(0.96, strongestContradiction.confidence)
        );
    } else {
        add(
            investigationSignals,
            "No strong cross-source contradiction was deterministically established from the retained public evidence.",
            supportUrls,
            "Contradiction signals are only emitted when evidence-backed conflicting wording/actions are observable.",
            0.89
        );
    }

    if (strongestGap) {
        add(
            investigationSignals,
            `Largest current evidence gap: ${strongestGap.signal}`,
            strongestGap.supportingSourceUrls,
            strongestGap.basis,
            Math.min(0.95, strongestGap.confidence)
        );
    }

    if (strongestTemporal) {
        add(
            investigationSignals,
            `Most important temporal signal: ${strongestTemporal.signal}`,
            strongestTemporal.supportingSourceUrls,
            strongestTemporal.basis,
            Math.min(0.95, strongestTemporal.confidence)
        );
    }

    const profile = linkedin?.linkedinProfile && typeof linkedin.linkedinProfile === "object"
        ? linkedin.linkedinProfile
        : {};

    const identity = {};
    if (profile?.name) identity.name = clean(profile.name);
    if (profile?.headline) identity.headline = clean(profile.headline);
    if (profile?.currentCompany) identity.currentCompany = clean(profile.currentCompany);
    if (profile?.location) identity.location = clean(profile.location);

    const evidenceUnits = allUnits.length;
    const sourceGroups = [
        websiteItems.length > 0, !!linkedin, !!github,
        !!x && allUnits.some(unit => unit.group === "x_post" || unit.group === "x_profile"),
        !!reddit && allUnits.some(unit => unit.group === "reddit_post" || unit.group === "reddit_profile")
    ].filter(Boolean).length;
    const datedRatio = evidenceUnits
        ? datedUnits.length / evidenceUnits
        : 0;
    const signalBreadth =
        topicRows.length +
        activitySignals.length +
        temporalSignals.length +
        consistencySignals.length +
        executionSignals.length +
        gapSignals.length +
        githubSignals.length +
        investigationSignals.length;

    const signalConfidence = Math.max(
        0,
        Math.min(
            98,
            Math.round(
                55 +
                sourceGroups * 10 +
                Math.min(evidenceUnits, 20) * 1.2 +
                Math.min(signalBreadth, 30) * 0.6 +
                datedRatio * 8
            )
        )
    );

    const primarySignalPackage = {
        ...emptySignals,
        identity,
        positioning,
        niches: unique(niches).slice(0, 10),
        expertiseSignals,
        audienceSignals,
        businessSignals,
        creatorSignals,
        topics: topicRows.slice(0, 10).map(row => row.topic),
        recurringTopics: topicRows.filter(row => row.total >= 2).slice(0, 10).map(row => row.topic),
        behavioralSignals,
        contradictions,
        crossSourceSignals,
        activitySignals,
        temporalSignals,
        consistencySignals,
        executionSignals,
        gapSignals,
        githubSignals,
        investigationSignals,
        signalConfidence
    };

    /* ============================================================
       DEEP SIGNAL MATRIX
       ------------------------------------------------------------
       Exactly 10 signal families x 10 members.
       These are RAW, evidence-grounded intelligence units.
       No compression. No master-signal merging.
       ECB remains the downstream compression stage.
       ============================================================ */

    const buildDeepSignalMember = ({
        family,
        member,
        finding,
        basis,
        urls = [],
        confidence = 0.84,
        data = {}
    } = {}) => ({
        signalId: `${String(family || "signal").toUpperCase()}_${String(member || "00").padStart(2, "0")}`,
        family,
        member,
        finding: clean(finding || "Evidence is insufficient to establish this signal."),
        basis: clean(basis || "No direct supporting basis was retained."),
        supportingSourceUrls: unique(urls).slice(0, 8),
        confidence: Math.max(0.75, Math.min(0.98, Number(Number(confidence).toFixed(2)))),
        ...data
    });

    const dateSortedAll = datedUnits
        .slice()
        .sort((a, b) => a.time - b.time);

    const latestWebsiteUnit = websiteSources
        .filter(item => item.time > 0)
        .sort((a, b) => b.time - a.time)[0] || null;

    const latestLinkedInUnit = [
        ...linkedinPostSources,
        ...linkedinArticleSources
    ]
        .filter(item => item.time > 0)
        .sort((a, b) => b.time - a.time)[0] || null;

    const latestWebsiteAge = latestWebsiteUnit ? daysSince(latestWebsiteUnit.source) : null;
    const latestLinkedInAge = latestLinkedInUnit ? daysSince(latestLinkedInUnit.source) : null;

    const actionLexicon = [
        "build", "built", "ship", "shipped", "shipping", "launch", "launched",
        "release", "released", "publish", "published", "sell", "sold",
        "experiment", "tested", "validate", "validated", "commit", "commits",
        "deploy", "deployed", "customer", "customers", "client", "clients"
    ];

    const analysisLexicon = [
        "analyze", "analysis", "pattern", "patterns", "framework", "frameworks",
        "awareness", "understand", "understanding", "psychology", "why",
        "procrastination", "avoidance", "reflection"
    ];

    const identityLexicon = [
        "identity", "expert", "expertise", "founder", "creator", "builder",
        "teacher", "developer", "engineer", "coach"
    ];

    const avoidanceLexicon = [
        "avoidance", "procrastination", "overthinking", "planning", "stuck",
        "delay", "fear", "uncertainty", "perfection", "perfectionism"
    ];

    const audienceRows = [
        ["founders", ["founder", "founders", "startup", "business"]],
        ["creators", ["creator", "creators", "content", "audience"]],
        ["professionals", ["professional", "career", "work"]],
        ["clients", ["client", "clients", "customer", "customers"]],
        ["behavioral seekers", ["behavior", "procrastination", "avoidance", "overthinking"]],
        ["technical builders", ["developer", "engineering", "software", "code"]],
        ["product users", ["product", "app", "service", "users"]],
        ["sales-oriented audience", ["sales", "revenue", "leads", "conversion"]],
        ["self-development audience", ["awareness", "clarity", "growth", "habit"]],
        ["mixed audience", ["business", "behavior", "technology", "product"]]
    ];

    const positioningRows = [
        ["core promise", "revealing the pattern behind the problem/question"],
        ["problem framing", "public messaging frames behavior as an underlying mechanism rather than surface symptoms"],
        ["solution framing", "the product is positioned as a behavioral clarity / discovery system"],
        ["differentiation", "content emphasizes hidden patterns and uncomfortable truths"],
        ["authority signal", "repeated explanatory language establishes domain knowledge"],
        ["identity signal", "public evidence presents a builder/analyst identity"],
        ["audience promise", "messaging targets people experiencing stuckness, avoidance or execution friction"],
        ["commercial framing", "product/service language is present in the public footprint"],
        ["narrative continuity", "core behavioral themes recur across source groups"],
        ["positioning gap", "public evidence does not independently prove product outcomes or traction"]
    ];

    const topicFallbacks = [
        "Topic concentration could not be strongly established from the retained corpus.",
        "Topic diversity is limited by the retained evidence set.",
        "Topic evolution is not independently established without dated topic changes.",
        "New topic emergence is not independently established from the retained corpus.",
        "Dropped-topic behavior cannot be established from the retained sample alone.",
        "Problem emphasis is visible only where repeated problem language occurs.",
        "Solution emphasis is visible only where repeated solution language occurs.",
        "Cross-platform topic repetition requires the same topic family in at least two source groups.",
        "Topic concentration should not be treated as behavioral proof by itself.",
        "The strongest topic signal is the highest-frequency topic family in retained evidence."
    ];

    const behaviorSpecs = [
        ["avoidance-language", avoidanceLexicon, "Avoidance-related language frequency in the retained public corpus."],
        ["execution-language", actionLexicon, "Execution/action language frequency in the retained public corpus."],
        ["analysis-language", analysisLexicon, "Analysis/reflection language frequency in the retained public corpus."],
        ["analysis-action-balance", [], "Relative concentration of analysis/reflection language versus action/execution language."],
        ["planning-language", ["planning", "plan", "prepare", "preparing"], "Planning/preparation language frequency."],
        ["identity-language", identityLexicon, "Identity/professional-role language frequency."],
        ["question-framing", ["why", "how", "what", "should"], "Question/problem-framing language frequency."],
        ["validation-language", ["validation", "validate", "proof", "evidence", "trust"], "Validation/evidence language frequency."],
        ["repetition-signal", ["pattern", "repeat", "again", "recurring", "loop"], "Repeated-cycle vocabulary frequency."],
        ["behavioral-theme-presence", ["behavior", "behavioral", "psychology", "avoidance", "procrastination"], "Presence of behavioral/psychological language." ]
    ];

    const families = {};

    families.topicSignals = topicRows.slice(0, 10).map((row, index) =>
        buildDeepSignalMember({
            family: "topic",
            member: index + 1,
            finding: index < topicRows.length
                ? `${row.topic} is one of the strongest recurring public topic families, with ${row.total} observed term matches.`
                : topicFallbacks[index],
            basis: index < topicRows.length
                ? `Website=${row.website}, LinkedIn=${row.linkedin}, GitHub=${row.github} term-family matches.`
                : topicFallbacks[index],
            urls: unique([
                ...(row?.website ? websiteUrls : []),
                ...(row?.linkedin ? linkedinUrls : []),
                ...(row?.github ? githubUrls : [])
            ]),
            confidence: index < topicRows.length ? (row.total >= 5 ? 0.94 : 0.88) : 0.78,
            data: { metric: index < topicRows.length ? row.total : 0 }
        })
    );

    while (families.topicSignals.length < 10) {
        const index = families.topicSignals.length + 1;
        families.topicSignals.push(
            buildDeepSignalMember({
                family: "topic",
                member: index,
                finding: topicFallbacks[(index - 1) % topicFallbacks.length],
                basis: "Retained public evidence does not establish an additional independent topic signal.",
                urls: supportUrls,
                confidence: 0.78
            })
        );
    }

    const behaviorSignalsDeep = behaviorSpecs.map(([name, terms, description], index) => {
        if (name === "analysis-action-balance") {
            const ratio = actionCount > 0 ? Number((analysisCount / actionCount).toFixed(2)) : null;
            return buildDeepSignalMember({
                family: "behavior",
                member: index + 1,
                finding: actionCount > 0
                    ? `Retained public language contains ${analysisCount} analysis/reflection matches versus ${actionCount} action/execution matches (ratio ${ratio}).`
                    : `Retained public language contains ${analysisCount} analysis/reflection matches and no detected action/execution term matches.`,
                basis: "Deterministic keyword-family comparison; this is language evidence, not proof of real-world outcomes.",
                urls: supportUrls,
                confidence: 0.86,
                data: { analysisCount, actionCount, ratio }
            });
        }
        const count = countTerms(combinedText, terms);
        return buildDeepSignalMember({
            family: "behavior",
            member: index + 1,
            finding: `${description} Observed ${count} term match(es) across retained public evidence.`,
            basis: `Counted against a deterministic vocabulary across website, LinkedIn and GitHub text.`,
            urls: supportUrls,
            confidence: count >= 5 ? 0.92 : count > 0 ? 0.86 : 0.78,
            data: { matchCount: count }
        });
    });

    families.behaviorSignals = behaviorSignalsDeep;

    const timeFindings = [
        latestWebsiteUnit
            ? `Latest dated website evidence is ${latestWebsiteUnit.date} (${latestWebsiteAge} day(s) old).`
            : "No usable dated website item is available in the retained evidence.",
        latestLinkedInUnit
            ? `Latest dated LinkedIn evidence is ${latestLinkedInUnit.date} (${latestLinkedInAge} day(s) old).`
            : "No usable dated LinkedIn item is available in the retained evidence.",
        datedUnits.length
            ? `The retained dated corpus spans approximately ${spanDays} day(s).`
            : "A dated evidence span cannot be established.",
        datedPosts.length >= 2
            ? `Largest observed gap between adjacent retained LinkedIn posts is ${maxGap} day(s).`
            : "At least two dated LinkedIn posts are required to measure an inter-post gap.",
        latestWebsiteUnit && latestLinkedInUnit
            ? `Newest website and LinkedIn items differ by approximately ${Math.abs(Math.floor((latestWebsiteUnit.time - latestLinkedInUnit.time) / 86400000))} day(s).`
            : "Cross-platform recency lag cannot be established from the dated subset.",
        dateSortedAll.length ? `Dated evidence count is ${dateSortedAll.length} unit(s).` : "No dated evidence unit was retained.",
        undatedUnits.length ? `${undatedUnits.length} retained unit(s) lack a usable publication timestamp.` : "All retained evidence units expose a usable timestamp.",
        latestWebsiteUnit ? "Website recency is directly observable from retained timestamps." : "Website recency is not directly observable.",
        latestLinkedInUnit ? "LinkedIn recency is directly observable from retained timestamps." : "LinkedIn recency is not directly observable.",
        datedUnits.length >= 3 ? "The retained evidence provides enough dated points to inspect temporal sequencing." : "Temporal sequencing is limited by the number of dated points."
    ];

    families.timeSignals = timeFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "time",
            member: index + 1,
            finding,
            basis: "Derived from retained publication timestamps only; no unobserved inactivity is inferred.",
            urls: supportUrls,
            confidence: datedUnits.length >= 3 ? 0.94 : 0.80
        })
    );

    const executionFindings = [
        `Action/execution vocabulary matches: ${actionCount}.`,
        `Analysis/reflection vocabulary matches: ${analysisCount}.`,
        actionCount > analysisCount ? "Execution language currently exceeds analysis/reflection language in the retained corpus." : "Analysis/reflection language currently equals or exceeds execution language in the retained corpus.",
        `Explicit shipping/publishing/building terms observed: ${countTerms(combinedText, ["ship", "shipping", "publish", "published", "build", "building"])}.`, 
        `Explicit validation/testing terms observed: ${countTerms(combinedText, ["validate", "validated", "test", "tested", "experiment"])}.`, 
        `Commercial execution terms observed: ${countTerms(combinedText, ["customer", "customers", "client", "clients", "sales", "revenue"])}.`, 
        githubSource ? "GitHub provides an independent technical artifact for execution-related corroboration." : "No GitHub artifact is available for execution corroboration.",
        linkedinPosts.length ? `LinkedIn contributes ${linkedinPosts.length} retained post item(s) to the execution picture.` : "No LinkedIn post items are retained.",
        websiteItems.length ? `Website contributes ${websiteItems.length} retained item(s) to the execution picture.` : "No website items are retained.",
        "Execution language is treated as observable public language, not automatic proof of completed real-world outcomes."
    ];

    families.executionSignals = executionFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "execution",
            member: index + 1,
            finding,
            basis: "Derived from deterministic action, validation, commercial and source-presence measures in retained evidence.",
            urls: supportUrls,
            confidence: 0.86
        })
    );

    families.audienceSignals = audienceRows.map(([audience, terms], index) => {
        const count = countTerms(combinedText, terms);
        return buildDeepSignalMember({
            family: "audience",
            member: index + 1,
            finding: count > 0
                ? `Public evidence contains ${count} vocabulary match(es) associated with ${audience}.`
                : `Audience focus on ${audience} is not independently established by the retained vocabulary.`,
            basis: "Deterministic audience-language observation; not a claim about actual audience composition.",
            urls: supportUrls,
            confidence: count >= 5 ? 0.91 : count > 0 ? 0.84 : 0.78,
            data: { matchCount: count }
        });
    });

    families.positioningSignals = positioningRows.map(([member, fixedFinding], index) => {
        const count = index < 4 ? countTerms(combinedText, [["pattern", "patterns", "avoidance", "procrastination", "behavior"][index]].flat()) : 0;
        return buildDeepSignalMember({
            family: "positioning",
            member: index + 1,
            finding: index === 9
                ? fixedFinding
                : `${fixedFinding}. Observable supporting language count: ${count}.`,
            basis: index === 9
                ? "Positioning gap is limited to what the retained public evidence can verify; no traction claim is inferred."
                : "Derived from recurring public positioning language across the retained corpus.",
            urls: supportUrls,
            confidence: index === 9 ? 0.89 : 0.86
        });
    });

    const githubFindings = [
        githubSource ? "A public GitHub repository/profile artifact is directly present." : "GitHub evidence is absent from the retained investigation set.",
        githubSource ? `GitHub action/build vocabulary matches: ${countTerms(githubText, actionLexicon)}.` : "GitHub build-language count cannot be established.",
        githubSource ? `GitHub analysis/framework vocabulary matches: ${countTerms(githubText, analysisLexicon)}.` : "GitHub analysis-language count cannot be established.",
        githubSource ? `GitHub identity/role vocabulary matches: ${countTerms(githubText, identityLexicon)}.` : "GitHub identity-language count cannot be established.",
        githubSource ? `GitHub behavioral/avoidance vocabulary matches: ${countTerms(githubText, avoidanceLexicon)}.` : "GitHub behavioral-language count cannot be established.",
        githubSource ? `GitHub technical/product language matches: ${countTerms(githubText, ["software", "code", "repository", "repo", "application", "app", "product"])}.` : "GitHub technical/product language count cannot be established.",
        githubSource ? "GitHub currently provides text-level evidence, not a commit-history time series." : "No GitHub time series is available.",
        githubSource ? "Repository description/visible text can corroborate product identity and build intent." : "Product-build corroboration from GitHub is unavailable.",
        githubSource ? "GitHub evidence can corroborate themes seen elsewhere when the same concepts recur." : "GitHub cross-source corroboration is unavailable.",
        githubSource ? "GitHub should be interpreted as technical/public artifact evidence, not proof of user adoption or traction." : "No GitHub artifact is available for outcome inference."
    ];

    families.githubSignals = githubFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "github",
            member: index + 1,
            finding,
            basis: githubSource ? "Derived directly from the retained GitHub source object." : "GitHub source object is not present.",
            urls: githubUrls,
            confidence: githubSource ? 0.91 : 0.78
        })
    );

    const strongestCross = crossSourceSignals.slice().sort((a, b) => b.confidence - a.confidence)[0];
    const strongestContra = contradictions.slice().sort((a, b) => b.confidence - a.confidence)[0];
    const sharedTopicFamilies = topicRows.filter(row => [row.website, row.linkedin, row.github, row.x, row.reddit].filter(value => value > 0).length >= 2);
    const crossFindings = [
        strongestCross ? strongestCross.signal : "No strong cross-source signal was deterministically established.",
        `Independent source groups represented: ${sourceGroups}.`,
        sharedTopicFamilies.slice(0, 5).map(row => `${row.topic} (${[row.website > 0 ? "Website" : "", row.linkedin > 0 ? "LinkedIn" : "", row.github > 0 ? "GitHub" : "", row.x > 0 ? "X" : "", row.reddit > 0 ? "Reddit" : ""].filter(Boolean).join(" + ")})`).join("; ") || "No topic family is currently shared across two retained public source groups.",
        topicRows.filter(row => row.website > 0 && row.linkedin > 0).slice(0, 3).map(row => row.topic).join(", ") || "No topic family is currently shared by website and LinkedIn.",
        topicRows.filter(row => row.linkedin > 0 && row.github > 0).slice(0, 3).map(row => row.topic).join(", ") || "No topic family is currently shared by LinkedIn and GitHub.",
        topicRows.filter(row => row.website > 0 && row.github > 0).slice(0, 3).map(row => row.topic).join(", ") || "No topic family is currently shared by website and GitHub.",
        strongestContra ? strongestContra.signal : "No evidence-backed contradiction was deterministically established.",
        websiteExecution && linkedinPlanning ? "Website execution language and LinkedIn planning/research language create a language-level tension." : "No deterministic website-vs-LinkedIn execution/planning tension was found.",
        outcomeCount > 0 ? `Outcome/traction vocabulary appears ${outcomeCount} time(s), but values are not inferred.` : "No direct outcome/traction vocabulary was detected.",
        `Dated evidence units available for cross-source comparison: ${datedUnits.length}.`,
        "Cross-source findings are corroboration/tension signals, not automatic proof of private motives."
    ];

    families.crossEvidenceSignals = crossFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "cross-evidence",
            member: index + 1,
            finding,
            basis: "Derived from independent source-group comparison across retained public evidence.",
            urls: supportUrls,
            confidence: 0.87
        })
    );

    const contradictionFindings = [
        strongestContra ? strongestContra.signal : "No strong contradiction was established.",
        websiteNoAdvice && linkedinAdvisory ? "Website no-advice positioning conflicts with advisory language on LinkedIn." : "No no-advice versus advisory-language conflict was detected.",
        websiteExecution && linkedinPlanning ? "Execution-oriented website language and planning/research-oriented LinkedIn language create a public language tension." : "No deterministic execution-versus-planning language tension was detected.",
        outcomeCount === 0 ? "Lack of direct outcome vocabulary remains an evidence gap, not a contradiction." : "Outcome vocabulary exists, but values remain unverified.",
        datedUnits.length < 3 ? "Sparse timestamps limit contradiction testing across time." : "The dated corpus permits some temporal contradiction testing.",
        githubSource ? "GitHub exists as an independent technical artifact that can corroborate or challenge narrative claims." : "No GitHub artifact exists to challenge the narrative.",
        linkedinPosts.length ? "LinkedIn post history provides a direct public activity comparison point." : "No LinkedIn post history is available for comparison.",
        websiteItems.length ? "Website publication history provides a direct public activity comparison point." : "No website publication history is available for comparison.",
        sourceGroups >= 3 ? "Three public source groups allow broader contradiction testing than a single-channel investigation." : "Fewer than three source groups constrain contradiction testing.",
        "A contradiction is only treated as established when two observable claims/actions genuinely conflict."
    ];

    families.contradictionSignals = contradictionFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "contradiction",
            member: index + 1,
            finding,
            basis: "Contradiction discipline: observable conflict is required; absence or uncertainty is labelled as an evidence gap instead.",
            urls: supportUrls,
            confidence: strongestContra ? 0.91 : 0.82
        })
    );

    const investigationFindings = [
        strongestTemporal ? strongestTemporal.signal : "No dominant temporal signal was established.",
        strongestGap ? strongestGap.signal : "No dominant evidence gap was established.",
        strongestCross ? strongestCross.signal : "No dominant cross-source consistency signal was established.",
        strongestContra ? strongestContra.signal : "No dominant contradiction was established.",
        topicRows[0] ? `Most dominant topic family: ${topicRows[0].topic}.` : "No dominant topic family established.",
        `Source breadth currently covers ${sourceGroups} public source group(s).`,
        `Dated evidence currently covers ${datedUnits.length} unit(s).`,
        `Retained evidence currently contains ${websiteItems.length} website item(s), ${linkedinPosts.length} LinkedIn post(s), ${linkedinArticles.length} LinkedIn article(s), ${githubSource ? 1 : 0} GitHub artifact(s), ${xPostSources.length} X post(s), and ${redditPostSources.length} Reddit post(s).`,
        "The strongest defensible investigation lead must be traceable to observable public evidence.",
        "Private motive remains a hypothesis unless public evidence directly corroborates the inferred mechanism."
    ];

    families.investigationSignalsDeep = investigationFindings.map((finding, index) =>
        buildDeepSignalMember({
            family: "investigation",
            member: index + 1,
            finding,
            basis: "Investigation-priority lead derived from the strongest deterministic signals generated above.",
            urls: supportUrls,
            confidence: 0.89
        })
    );

    const deepSignalFamilies = {
        topic: families.topicSignals,
        behavior: families.behaviorSignals,
        time: families.timeSignals,
        execution: families.executionSignals,
        audience: families.audienceSignals,
        positioning: families.positioningSignals,
        github: families.githubSignals,
        "cross-evidence": families.crossEvidenceSignals,
        contradiction: families.contradictionSignals,
        investigation: families.investigationSignalsDeep
    };

    const deepSignalCount = Object.values(deepSignalFamilies)
        .reduce((sum, family) => sum + family.length, 0);

    /* ---------------------------------------------------------
       SOURCE RELIABILITY + CONTRADICTION INTELLIGENCE
       Deterministic source-level metadata only.
    --------------------------------------------------------- */
    const sourceReliability = allUnits.map(unit => {
        const textLength = String(unit.text || "").length;
        const dated = !!unit.time;
        const hasUrl = !!unit.url;
        const typeWeight =
            unit.group === "github" ? 0.92 :
            unit.group === "linkedin_post" ? 0.86 :
            unit.group === "linkedin_article" ? 0.86 :
            unit.group === "website" ? 0.84 :
            0.82;

        let score = typeWeight;
        if (hasUrl) score += 0.02;
        if (dated) score += 0.02;
        if (textLength >= 500) score += 0.02;

        return {
            url: unit.url || null,
            sourceType: unit.group,
            reliability: Number(Math.min(0.98, score).toFixed(2)),
            basis: "Deterministic source-quality score from source type, URL traceability, date availability, and retained text volume; not a truth guarantee."
        };
    });

    const strongestContradictionForExport = contradictions
        .slice()
        .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))[0] || null;

    const crossEvidenceIntelligence = {
        contradiction: strongestContradictionForExport
            ? {
                finding: strongestContradictionForExport.signal,
                basis: strongestContradictionForExport.basis,
                supportingSourceUrls: strongestContradictionForExport.supportingSourceUrls || [],
                confidence: strongestContradictionForExport.confidence
            }
            : {
                finding: "No evidence-backed contradiction was deterministically established from the retained public evidence.",
                basis: "Contradictions are only exported when observable source claims or behaviors genuinely conflict.",
                supportingSourceUrls: [],
                confidence: 0.78
            },
        contradictionCount: contradictions.length,
        sourceReliability
    };

    const secondarySignalPackage =
        buildSecondarySignalFetcher({
            websiteEvidence: websiteItems,
            linkedinEvidence: linkedin,
            githubEvidence: github,
            xEvidence: x,
            redditEvidence: reddit,
            primarySignals: primarySignalPackage
        });

    return {
        status: "ok",
        reason: "Deep deterministic evidence signal extraction",
        signals: {
            ...primarySignalPackage,
            contradictions: [
                ...primarySignalPackage.contradictions,
                ...secondarySignalPackage.contradictions
            ].slice(0, 30),
            crossSourceSignals: [
                ...primarySignalPackage.crossSourceSignals,
                ...secondarySignalPackage.crossSourceSignals
            ].slice(0, 40),
            positioning: [
                ...positioning,
                ...secondarySignalPackage.signals
            ].slice(0, 40),
            investigationSignals: [
                ...investigationSignals,
                ...(secondarySignalPackage.investigationSignals || [])
            ].slice(0, 20),
            gapSignals: [
                ...gapSignals,
                ...(secondarySignalPackage.gapSignals || [])
            ].slice(0, 30),
            deepSignalFamilies,
            deepSignalCount,
            deepSignalFamilyCount: Object.keys(deepSignalFamilies).length,
            signalConfidence:
                Math.max(
                    signalConfidence,
                    secondarySignalPackage.confidence || 0
                ),
            crossEvidenceIntelligence,
            signalFetcherCount: 2,
            signalFetchers: {
                fetcher1: {
                    status: "ok",
                    confidence: signalConfidence
                },
                fetcher2: {
                    status: secondarySignalPackage.status,
                    confidence: secondarySignalPackage.confidence
                }
            },
            signalCounts: {
                totalSignals:
                    positioning.length +
                    expertiseSignals.length +
                    audienceSignals.length +
                    businessSignals.length +
                    creatorSignals.length +
                    behavioralSignals.length +
                    contradictions.length +
                    crossSourceSignals.length +
                    activitySignals.length +
                    temporalSignals.length +
                    consistencySignals.length +
                    executionSignals.length +
                    gapSignals.length +
                    githubSignals.length +
                    investigationSignals.length,
                websiteItems: websiteItems.length,
                linkedinPosts: linkedinPosts.length,
                linkedinArticles: linkedinArticles.length,
                githubPresent: !!github
            }
        }
    };
}

/* ------------------------------------------------------------
   SIGNAL FETCHER 2
   Complementary evidence-grounded pass.
   ------------------------------------------------------------ */

function buildSecondarySignalFetcher({
    websiteEvidence = [],
    linkedinEvidence = null,
    githubEvidence = null,
    xEvidence = null,
    redditEvidence = null,
    primarySignals = null
} = {}) {

    const safeArray = value =>
        Array.isArray(value) ? value.filter(Boolean) : [];

    const clean = value =>
        safeText(value)
            .replace(/\s+/g, " ")
            .trim();

    const unique = values =>
        [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];

    const urlOf = source =>
        normalizeUrl(
            source?.permalink || source?.tweetUrl || source?.tweet_url ||
            source?.twitterUrl || source?.profileUrl || source?.sourceUrl ||
            source?.canonicalUrl || source?.url || source?.postUrl || source?.articleUrl || ""
        );

    const textOf = source =>
        clean([
            source?.title,
            source?.headline,
            source?.text,
            source?.content,
            source?.description,
            source?.visibleText,
            source?.contentSnippet
        ].filter(Boolean).join(" "))
            .toLowerCase();

    const dateOf = source => {
        const raw =
            source?.createdAtIso || source?.datePublished || source?.publishedAt ||
            source?.published_at || source?.date || source?.createdAt ||
            source?.created_at || source?.created_utc || source?.timestamp || "";
        const time = Date.parse(String(raw));
        return Number.isFinite(time) ? time : 0;
    };

    const websiteItems = safeArray(websiteEvidence);
    const linkedinPosts = safeArray(linkedinEvidence?.posts);
    const linkedinArticles = safeArray(linkedinEvidence?.articles);
    const github = githubEvidence || null;
    const x = xEvidence || null;
    const reddit = redditEvidence || null;
    const xProfile = x?.profile && typeof x.profile === "object" ? x.profile : x;
    const redditProfile = reddit?.profile && typeof reddit.profile === "object" ? reddit.profile : reddit;
    const xPosts = safeArray(x?.posts || x?.recentPosts);
    const redditPosts = safeArray(reddit?.posts || reddit?.recentPosts);

    const websiteUrls = unique(websiteItems.map(urlOf));
    const linkedinUrls = unique([
        linkedinEvidence?.sourceUrl,
        linkedinEvidence?.linkedinProfile?.profileUrl,
        ...linkedinPosts.map(urlOf),
        ...linkedinArticles.map(urlOf)
    ]);
    const githubUrls = github ? [urlOf(github)].filter(Boolean) : [];
    const xUrls = unique([urlOf(xProfile || {}), ...xPosts.map(urlOf)]);
    const redditUrls = unique([urlOf(redditProfile || {}), ...redditPosts.map(urlOf)]);
    const allUrls = unique([...websiteUrls, ...linkedinUrls, ...githubUrls, ...xUrls, ...redditUrls]);

    const websiteText = websiteItems.map(textOf).join(" ");
    const linkedinText = [
        textOf(linkedinEvidence?.linkedinProfile || {}),
        ...linkedinPosts.map(textOf),
        ...linkedinArticles.map(textOf)
    ].join(" ");
    const githubText = textOf(github || {});
    const xText = [textOf(xProfile || {}), ...xPosts.map(textOf)].join(" ");
    const redditText = [textOf(redditProfile || {}), ...redditPosts.map(textOf)].join(" ");

    const signals = [];
    const contradictions = [];
    const crossSourceSignals = [];
    const temporalSignals = [];
    const gapSignals = [];
    const investigationSignals = [];

    const add = (bucket, text, urls, basis, confidence = 0.84) => {
        bucket.push({
            signal: clean(text).slice(0, 320),
            supportingSourceUrls: unique(urls).slice(0, 8),
            basis: clean(basis).slice(0, 320),
            confidence: Math.max(0.75, Math.min(0.98, Number(Number(confidence).toFixed(2))))
        });
    };

    const families = [
        ["AI / Technology", ["artificial intelligence", "machine learning", "llm", "software", "developer", "engineering"]],
        ["Behavior / Psychology", ["behavior", "psychology", "avoidance", "overthinking", "procrastination", "validation", "identity"]],
        ["Business / Startup", ["founder", "startup", "business", "company", "product", "revenue"]],
        ["Marketing / Content", ["content", "marketing", "audience", "brand", "linkedin", "posting"]],
        ["Execution / Productivity", ["execution", "planning", "focus", "action", "decision", "productivity", "shipping", "launch"]]
    ];

    const countWord = (text, term) => {
        const pattern = new RegExp(`\\b${String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        return (text.match(pattern) || []).length;
    };

    for (const [family, terms] of families) {
        const w = terms.reduce((sum, term) => sum + countWord(websiteText, term), 0);
        const l = terms.reduce((sum, term) => sum + countWord(linkedinText, term), 0);
        const g = terms.reduce((sum, term) => sum + countWord(githubText, term), 0);
        const xCount = terms.reduce((sum, term) => sum + countWord(xText, term), 0);
        const rCount = terms.reduce((sum, term) => sum + countWord(redditText, term), 0);
        const total = w + l + g + xCount + rCount;

        if (total >= 2) {
            add(
                signals,
                `Secondary pass confirms recurring ${family} language across retained evidence.`,
                [...(w ? websiteUrls : []), ...(l ? linkedinUrls : []), ...(g ? githubUrls : []), ...(xCount ? xUrls : []), ...(rCount ? redditUrls : [])],
                `Observed ${total} family-level term matches in the complementary pass.`,
                w > 0 && l > 0 && g > 0 ? 0.96 : w > 0 && l > 0 ? 0.94 : 0.87
            );
        }
    }

    const crossTerms = [
        "clients", "customers", "audience", "founders",
        "product", "service", "creator", "consulting",
        "coaching", "advice", "ai", "software", "execution", "planning"
    ];

    for (const term of crossTerms) {
        const onWebsite = countWord(websiteText, term) > 0;
        const onLinkedIn = countWord(linkedinText, term) > 0;
        const onGithub = countWord(githubText, term) > 0;
        const onX = countWord(xText, term) > 0;
        const onReddit = countWord(redditText, term) > 0;
        const groups = [onWebsite, onLinkedIn, onGithub, onX, onReddit].filter(Boolean).length;

        if (groups >= 2) {
            add(
                crossSourceSignals,
                `${term} is independently observable across ${groups} source groups.`,
                [
                    ...(onWebsite ? websiteUrls : []),
                    ...(onLinkedIn ? linkedinUrls : []),
                    ...(onGithub ? githubUrls : []),
                    ...(onX ? xUrls : []),
                    ...(onReddit ? redditUrls : [])
                ],
                "Independent source-group presence of the same term.",
                groups === 3 ? 0.96 : 0.91
            );
        }
    }

    /* Time-pattern reinforcement without claiming unobserved inactivity. */
    const datedWebsite = websiteItems
        .map(item => ({ item, time: dateOf(item), url: urlOf(item) }))
        .filter(row => row.time > 0)
        .sort((a, b) => b.time - a.time);

    const datedLinkedIn = [
        ...linkedinPosts,
        ...linkedinArticles
    ].map(item => ({ item, time: dateOf(item), url: urlOf(item) }))
        .filter(row => row.time > 0)
        .sort((a, b) => b.time - a.time);

    if (datedWebsite[0] && datedLinkedIn[0]) {
        const lagDays = Math.abs(Math.floor((datedWebsite[0].time - datedLinkedIn[0].time) / 86400000));
        add(
            temporalSignals,
            `Secondary pass observes a ${lagDays}-day difference between the newest dated website and LinkedIn evidence.`,
            [datedWebsite[0].url, datedLinkedIn[0].url],
            "Computed directly from the newest valid timestamps in both source groups.",
            0.93
        );
    }

    const noAdvice = /\b(no advice|not advice|no coaching|not coaching)\b/i.test(websiteText);
    const advisory = /\b(advice|coaching|guide|how to|skills|learn)\b/i.test(linkedinText);
    if (noAdvice && advisory) {
        add(
            contradictions,
            "Website and LinkedIn contain directly contrasting positioning language around advice/coaching.",
            [...websiteUrls, ...linkedinUrls],
            "Contrasting phrases are directly observable in separate source groups.",
            0.95
        );
    }

    const websiteAnalysis = /\b(framework|pattern|analysis|awareness|psychology|avoidance|procrastination)\b/i.test(websiteText);
    const linkedInExecution = /\b(ship|shipping|launch|launched|release|released|deploy|deployed|build|built|publish|published|validate|validated)\b/i.test(linkedinText);
    if (websiteAnalysis && linkedInExecution) {
        add(
            crossSourceSignals,
            "Website emphasizes analytical/problem-framing language while LinkedIn contains explicit execution language.",
            [...websiteUrls, ...linkedinUrls],
            "Cross-source language comparison only; not treated as proof of behavioral contradiction.",
            0.86
        );
    }

    const outcomePattern = /\b(users|customers|clients|revenue|sales|conversion|retention|results|outcomes|metrics|traction)\b/i;
    if (!outcomePattern.test(`${websiteText} ${linkedinText} ${githubText} ${xText} ${redditText}`)) {
        add(
            gapSignals,
            "No direct public outcome/traction vocabulary was detected in the complementary pass.",
            allUrls,
            "No matches for the predefined outcome vocabulary.",
            0.90
        );
    }

    if (github) {
        add(
            signals,
            "GitHub evidence contributes an independent technical artifact to the cross-source picture.",
            githubUrls,
            "GitHub source exists and was independently fetched.",
            0.97
        );
        add(
            gapSignals,
            "GitHub source does not currently expose commit-history timestamps in the retained source shape.",
            githubUrls,
            "No commit timestamp field is present in the supplied GitHub evidence object.",
            0.97
        );
    }

    if (primarySignals?.investigationSignals?.length) {
        const first = primarySignals.investigationSignals[0];
        if (first?.signal) {
            add(
                investigationSignals,
                `Secondary pass validates the primary investigation lead: ${first.signal}`,
                first.supportingSourceUrls || allUrls,
                first.basis || "Primary signal package supplied the lead.",
                Math.min(0.95, Number(first.confidence || 0.85))
            );
        }
    }

    return {
        status: "ok",
        source: "signal-fetcher-2",
        signals,
        contradictions,
        crossSourceSignals,
        temporalSignals,
        gapSignals,
        investigationSignals,
        confidence: Math.max(
            84,
            Math.min(
                98,
                84 +
                Math.min(
                    signals.length +
                    crossSourceSignals.length +
                    temporalSignals.length +
                    gapSignals.length,
                    14
                )
            )
        ),
        primarySignalsPresent:
            !!primarySignals &&
            typeof primarySignals === "object"
    };
}

/* ------------------------------------------------------------
   UNIVERSAL PACKAGE
   POSTMASTER ONLY
   ------------------------------------------------------------ */

function buildUniversalPackage({
    primaryUrl = "",
    websiteSources = [],
    websiteScraperSources = [],
    websiteTopicCollectionStatus = {},
    linkedinSource = null,
    githubEvidence = null,
    xEvidence = null,
    redditEvidence = null,
    signalResult = null,
    crossEvidenceIntelligence = null
} = {}) {

    /*
     * PCF WEBSITE EVIDENCE PASSTHROUGH
     * --------------------------------
     * PCF owns discovery, fetching and page extraction. CEB must not
     * truncate or compress those 30 page records. ECB is the sole
     * downstream content-compression stage.
     */
    const compressedWebsiteSources =
        websiteSources.map(source => ({ ...source }));

    const linkedInProfile =
        linkedinSource?.linkedinProfile ||
        null;

    const latestLinkedInPosts =
        selectLatestLinkedInItems(
            linkedinSource?.posts || [],
            "post",
            9
        );

    const latestLinkedInArticles =
        selectLatestLinkedInItems(
            linkedinSource?.articles || [],
            "article",
            1
        );

    const linkedinPosts =
        latestLinkedInPosts;

    const linkedinArticles =
        latestLinkedInArticles;

    const compressedLinkedinProfile =
        linkedinSource?.linkedinProfile &&
        typeof linkedinSource.linkedinProfile === "object"
            ? {
                ...linkedinSource.linkedinProfile,
                about:
                    meaningfulCompressText(
                        linkedinSource.linkedinProfile.about || "",
                        UNIVERSAL_ABOUT_MAX_CHARS,
                        "about"
                    )
            }
            : null;

    const compressedLinkedinSource =
        linkedinSource
            ? {
                ...compressUniversalSource({
                    ...linkedinSource,
                    posts: undefined,
                    articles: undefined,
                    apifyData: undefined
                }),
                linkedinProfile:
                    compressedLinkedinProfile,
                posts:
                    linkedinPosts.map(item =>
                        compressUniversalContent(
                            {
                                ...item,
                                title: item?.title,
                                date: item?.date
                            }
                        )
                    ),
                articles:
                    linkedinArticles.map(item =>
                        compressUniversalContent(
                            {
                                ...item,
                                title: item?.title,
                                date: item?.date
                            }
                        )
                    )
            }
            : null;

    const compressedGithubEvidence =
        githubEvidence
            ? compressUniversalSource(githubEvidence)
            : null;

    const compressSocialEvidence = (source, platform) => source ? ({
        ...compressUniversalSource({ ...source, posts: undefined, recentPosts: undefined, apifyData: undefined }),
        sourcePlatform: platform,
        profile: source.profile || null,
        posts: (Array.isArray(source.posts) ? source.posts : Array.isArray(source.recentPosts) ? source.recentPosts : []).slice(0, 3).map(item => compressUniversalContent({ ...item, title: item?.title || item?.text, date: item?.date || item?.createdAt }))
    }) : null;
    const compressedXEvidence = compressSocialEvidence(xEvidence, "x");
    const compressedRedditEvidence = compressSocialEvidence(redditEvidence, "reddit");

    /*
     * SIGNALS ARE NOT COMPRESSED HERE.
     * Evidence Compression Brain (ECB) is the downstream compression stage.
     * Keep the complete deep signal matrix intact for downstream analysis.
     */
    const compressedSignals =
        signalResult?.signals || {
            identity: {},
            positioning: [],
            niches: [],
            expertiseSignals: [],
            audienceSignals: [],
            businessSignals: [],
            creatorSignals: [],
            topics: [],
            recurringTopics: [],
            behavioralSignals: [],
            contradictions: [],
            crossSourceSignals: [],
            activitySignals: [],
            temporalSignals: [],
            consistencySignals: [],
            executionSignals: [],
            gapSignals: [],
            githubSignals: [],
            investigationSignals: [],
            deepSignalFamilies: {},
            deepSignalCount: 0,
            deepSignalFamilyCount: 0,
            signalConfidence: 0
        };

    const websiteSourceUrls =
    websiteSources
      .map(source =>
          normalizeUrl(
              source?.sourceUrl ||
              source?.canonicalUrl ||
              ""
          )
      )
      .filter(Boolean);


    const allSourceUrls = [
        ...websiteSourceUrls,
        compressedLinkedinSource?.linkedinProfile?.profileUrl,
        ...linkedinPosts.map(item =>
            item?.url ||
            item?.postUrl ||
            item?.sourceUrl
        ),
        ...linkedinArticles.map(item =>
            item?.url ||
            item?.articleUrl ||
            item?.sourceUrl
        ),
        compressedGithubEvidence?.sourceUrl ||
        compressedGithubEvidence?.canonicalUrl ||
        compressedGithubEvidence?.url,
        compressedXEvidence?.sourceUrl,
        ...(compressedXEvidence?.posts || []).map(item => item?.url || item?.sourceUrl),
        compressedRedditEvidence?.sourceUrl,
        ...(compressedRedditEvidence?.posts || []).map(item => item?.url || item?.sourceUrl)
    ].filter(Boolean);

    console.log(
        "UNIVERSAL_CONTENT_COMPRESSION",
        JSON.stringify({
            websiteSources: websiteSources.length,
            linkedinProfile: !!compressedLinkedinSource?.linkedinProfile,
            linkedinPosts:
                Array.isArray(compressedLinkedinSource?.posts)
                    ? compressedLinkedinSource.posts.length
                    : 0,
            linkedinArticles:
                Array.isArray(compressedLinkedinSource?.articles)
                    ? compressedLinkedinSource.articles.length
                    : 0,
            githubEvidence:
                !!compressedGithubEvidence,
            xProfile: !!compressedXEvidence,
            xPosts: compressedXEvidence?.posts?.length || 0,
            redditProfile: !!compressedRedditEvidence,
            redditPosts: compressedRedditEvidence?.posts?.length || 0,
            signalSignals:
                Object.keys(compressedSignals || {}).length
        })
    );

    /*
     * CARRY FORWARD RETAINED EVIDENCE.
     * Website sources come from PCF.
     * LinkedIn posts/articles are carried up to 10 each.
     * No evidence content is discarded here beyond the explicit
     * existing 10-item transport boundary.
     * CONTENT compression only.
     * URLs / links remain untouched.
     */
    return {
        success: true,

        packageType:
            "UniversalPublicEvidencePackage",

        version: "23.0",

        postmaster: {
            role: "evidence-delivery-only",
            filtering: false,
            compression: true,
            ranking: false,
            investigation: false
        },

        primarySource:
            normalizeUrl(primaryUrl) || null,

        websiteEvidence: {
            sources: compressedWebsiteSources,
            sourceUrls: websiteSourceUrls
        },

        websiteScraperEvidence: {
            source: "apify-website-content-crawler-task",
            sources: websiteScraperSources,
            sourceUrls: websiteScraperSources.map(item => item.url).filter(Boolean),
            pagesCollected: websiteScraperSources.length,
            topicCollectionStatus: websiteTopicCollectionStatus
        },

        linkedinEvidence: linkedinSource
            ? {
                source: compressedLinkedinSource,
                profile:
                    compressedLinkedinSource?.linkedinProfile || linkedInProfile,
                about:
                    compressedLinkedinSource?.linkedinProfile?.about ||
                    null,
                followersCount:
                    compressedLinkedinSource?.linkedinProfile?.followersCount ??
                    null,
                connectionsCount:
                    compressedLinkedinSource?.linkedinProfile?.connectionsCount ??
                    null,
                posts:
                    compressedLinkedinSource?.posts || [],
                articles:
                    compressedLinkedinSource?.articles || [],
                sourceUrl:
                    normalizeUrl(
                        compressedLinkedinSource?.sourceUrl ||
                        ""
                    ) || null
            }
            : {
                source: null,
                profile: null,
                about: null,
                followersCount: null,
                connectionsCount: null,
                posts: [],
                articles: [],
                sourceUrl: null
            },

        githubEvidence:
            compressedGithubEvidence || null,

        xEvidence: compressedXEvidence,
        redditEvidence: compressedRedditEvidence,

        sourceLinks:
            [...new Set(allSourceUrls)],

        /*
         * Signal is attached as intelligence only.
         * Raw evidence remains outside Signal's output and above.
         */
     /*   signalSignals:
    compressedSignals || {
        identity: {},
        positioning: [],
        niches: [],
        expertiseSignals: [],
        audienceSignals: [],
        businessSignals: [],
        creatorSignals: [],
        topics: [],
        recurringTopics: [],
        behavioralSignals: [],
        contradictions: [],
        crossSourceSignals: [],
        signalConfidence: 0
    },
    */
        crossEvidenceIntelligence:
            crossEvidenceIntelligence || {
                contradiction: {
                    finding: "No evidence-backed contradiction was deterministically established from the retained public evidence.",
                    basis: "No direct cross-source contradiction was established.",
                    supportingSourceUrls: [],
                    confidence: 0.78
                },
                contradictionCount: 0,
                sourceReliability: []
            },
        evidenceCoverage: {
            websitePagesInvestigated:
                websiteSources.length,
            websiteScraperPagesInvestigated:
                websiteScraperSources.length,

            linkedinProfilesInvestigated:
                linkedinSource ? 1 : 0,

            linkedinPostsAvailable:
                linkedinPosts.length,

            linkedinArticlesAvailable:
                linkedinArticles.length,

            githubProfileAvailable:
                githubEvidence ? 1 : 0,
            xProfileAvailable: xEvidence ? 1 : 0,
            xPostsAvailable: xEvidence?.posts?.length || 0,
            redditProfileAvailable: redditEvidence ? 1 : 0,
            redditPostsAvailable: redditEvidence?.posts?.length || 0,

            totalSourcesReviewed:
                websiteSources.length + websiteScraperSources.length + (linkedinSource ? 1 : 0) + (githubEvidence ? 1 : 0) +
                (xEvidence ? 1 + (xEvidence.posts?.length || 0) : 0) +
                (redditEvidence ? 1 + (redditEvidence.posts?.length || 0) : 0)
        }
    };
}

/* ------------------------------------------------------------
   MAIN
   ------------------------------------------------------------ */

export async function loadCrossEvidenceBrain({
   
    profileLinks = [],
    footprintPackage = {},
    truthLoopPackage = {}
} = {}) {

    void truthLoopPackage;

    const requestedLinks =
        Array.isArray(profileLinks)
            ? profileLinks
            : [];

    const primaryUrl =
        normalizeUrl(
            requestedLinks[0] ||
            footprintPackage?.profileLink ||
            footprintPackage?.sourceUrl ||
            ""
        );
console.log(
    "CEB_START",
    Date.now()
);
    if (!primaryUrl) {
        return {
            success: false,
            packageType: "CrossEvidencePackage",
            sourcesProcessed: 0,
            sourcesSucceeded: 0,
            sourcesFailed: 1,
            confidenceScore: 0,
            errors: [
                "At least one public source URL is required."
            ],
            universalPackage: null,
            crossEvidencePackage: null
        };
    }

    console.log(
        "CEB_START",
        JSON.stringify({
            primaryUrl,
            primaryPlatform:
                detectPlatform(primaryUrl),
            requestedLinkCount:
                requestedLinks.length
        })
    );

    

    /*
     * PUBLIC EVIDENCE ROUTING
     * LinkedIn, X and Reddit each have at most one bounded Actor call.
     * X and Reddit calls run in parallel; website/GitHub paths remain
     * separate and the existing LinkedIn route is preserved.
     */

    let websiteSources = [];
    let websiteScraperSources = [];
    let websiteTopicCollectionStatus = {};
    let linkedinSource = null;
    let linkedinUrl = "";
    let githubEvidence = null;
    let githubUrl = "";
    let xEvidence = null;
    let xUrl = "";
    let redditEvidence = null;
    let redditUrl = "";

    const primaryPlatform = detectPlatform(primaryUrl);

    if (primaryPlatform === "linkedin") {

        /*
         * Primary source itself is LinkedIn.
         * Use this URL for the single Apify call.
         */
        linkedinUrl = primaryUrl;

    } else if (primaryPlatform === "x" || primaryPlatform === "reddit" || primaryPlatform === "github") {
        // X has a configured collector. Reddit is disabled. GitHub is PCF-owned;
        // do not route a GitHub primary URL through CEB's website crawler.
        if (primaryPlatform === "x") xUrl = primaryUrl;
        if (primaryPlatform === "github") githubUrl = primaryUrl;

    } else {

        /*
         * Primary source is a website.
         * Reuse website evidence already collected by DFB/PCF.
         * Only fetch website evidence if nothing was supplied.
         */
        const suppliedWebsiteSources =
            Array.isArray(footprintPackage?.websiteEvidence?.sources)
                ? footprintPackage.websiteEvidence.sources
                : Array.isArray(footprintPackage?.sources)
                    ? footprintPackage.sources
                    : [];

        if (suppliedWebsiteSources.length > 0) {

            websiteSources = suppliedWebsiteSources;

        } else {

            const websiteResult =
                await fetchWebsiteEvidence(
                    primaryUrl
                );

            if (websiteResult?.success) {
                websiteSources =
                    websiteResult.sources || [];
            }
        }

        /*
         * ADDITIVE WEBSITE INTELLIGENCE COLLECTION.
         * PCF remains untouched. Apify Task adds non-article website pages.
         */
        if (ENABLE_CEB_WEBSITE_SCRAPER) {
            const externalEvidenceSeeds = collectExternalEvidenceSeeds(websiteSources, primaryUrl);
            console.log("CEB_EXTERNAL_EVIDENCE_SEEDS", JSON.stringify({ count: externalEvidenceSeeds.length, hosts: externalEvidenceSeeds.map(url => { try { return new URL(url).hostname; } catch { return ""; } }) }));
            const websiteScraperResult = await fetchWebsiteEvidenceFromApifyTask(primaryUrl, externalEvidenceSeeds);
            if (websiteScraperResult?.success) {
                const existingWebsiteUrls = new Set(websiteSources
                    .map(source => normalizeUrl(source?.url || source?.sourceUrl || source?.permalink || ""))
                    .filter(Boolean));
                websiteScraperSources = (websiteScraperResult.sources || [])
                    .filter(source => {
                        const url = normalizeUrl(source?.url || source?.sourceUrl || "");
                        if (!url || existingWebsiteUrls.has(url)) return false;
                        existingWebsiteUrls.add(url);
                        return true;
                    });
                websiteTopicCollectionStatus = websiteScraperResult.topicCollectionStatus || {};
            } else {
                console.warn("CEB_WEBSITE_APIFY_SKIPPED_OR_FAILED", websiteScraperResult?.reason || "No additional website pages returned.");
            }
        } else {
            console.log("CEB_WEBSITE_APIFY_DISABLED", "PCF owns website collection; no independent Apify website crawl will run.");
        }

        /*
         * Discover LinkedIn URL only.
         * Discovery itself performs NO API call.
         */
        const nestedLinkedInUrls = collectLinkedInUrls(footprintPackage);
        const sourceLinkedInUrls = collectLinkedInUrls(websiteSources);

        const discoveredLinks = [
            ...(Array.isArray(footprintPackage?.discoveredLinks)
                ? footprintPackage.discoveredLinks
                : []),
            ...(Array.isArray(footprintPackage?.profileLinks)
                ? footprintPackage.profileLinks
                : []),
            ...(Array.isArray(footprintPackage?.sourceCandidates)
                ? footprintPackage.sourceCandidates
                : []),
            ...nestedLinkedInUrls,
            ...sourceLinkedInUrls
        ];

        const discoveredSocialLinks =
            Array.isArray(footprintPackage?.discoveredSocialLinks)
                ? footprintPackage.discoveredSocialLinks
                : [];

        linkedinUrl =
            findLinkedInUrl({
                requestedLinks,
                websiteSources,
                discoveredLinks,
                discoveredSocialLinks
            });

        githubUrl =
            findGitHubUrl({
                requestedLinks,
                websiteSources,
                discoveredLinks,
                discoveredSocialLinks
            });
        xUrl = findPlatformProfileUrl("x", { requestedLinks, websiteSources, discoveredLinks, discoveredSocialLinks });

        console.log(
            "CEB_PUBLIC_LINK_DISCOVERY",
            JSON.stringify({
                requestedLinks: requestedLinks.length,
                websiteSources: websiteSources.length,
                discoveredLinks: discoveredLinks.length,
                discoveredSocialLinks: discoveredSocialLinks.length,
                nestedLinkedInUrls: nestedLinkedInUrls.length,
                sourceLinkedInUrls: sourceLinkedInUrls.length,
                linkedinUrl: linkedinUrl || null,
                linkedinTargetUrlSelected: !!linkedinUrl,
                linkedinTargetType: linkedinUrl ? (isLinkedInCompanyUrl(linkedinUrl) ? "company" : "person") : null,
                apifyCallWillRun: !!(linkedinUrl && ENABLE_LINKEDIN_APIFY),
                githubUrl: githubUrl || null,
                xUrl: xUrl || null,
                redditCollection: "disabled"
            })
        );
    }

    /*
     * GitHub is PCF-owned. CEB may pass through only the GitHub evidence
     * already collected by PCF; it never performs a second GitHub fetch.
     */
    const suppliedGithubEvidence =
        footprintPackage?.githubEvidence ||
        footprintPackage?.github ||
        footprintPackage?.githubProfile ||
        null;

    if (suppliedGithubEvidence && typeof suppliedGithubEvidence === "object") {
        githubEvidence = suppliedGithubEvidence;
        githubUrl =
            githubUrl ||
            normalizeUrl(
                suppliedGithubEvidence?.sourceUrl ||
                suppliedGithubEvidence?.profileUrl ||
                suppliedGithubEvidence?.url ||
                ""
            );
        console.log("CEB_GITHUB_PCF_PASSTHROUGH", JSON.stringify({ available: true, url: githubUrl || null }));
    } else {
        githubEvidence = null;
        if (githubUrl) {
            console.warn("CEB_GITHUB_PCF_SOURCE_UNAVAILABLE", JSON.stringify({ discoveredUrl: githubUrl, action: "no_duplicate_fetch_dispatched" }));
        } else {
            console.log("CEB_GITHUB_PCF_PASSTHROUGH", JSON.stringify({ available: false, url: null }));
        }
    }

    /* ------------------------------------------------------------
       LINKEDIN APIFY COLLECTION
       One API Samurai Actor call supports either a company page or a person profile.
       It normalizes profile/About, posts and articles for the Universal Package.
       ------------------------------------------------------------ */

    if (
        linkedinUrl &&
        ENABLE_LINKEDIN_APIFY
    ) {
        console.log(
            "CEB_LINKEDIN_APIFY_DISPATCH",
            JSON.stringify({
                actorId: APIFY_ACTOR_ID,
                linkedinUrl,
                enabled: ENABLE_LINKEDIN_APIFY
            })
        );

        const apifyResult = await fetchLinkedInFromApify(linkedinUrl);

        if (apifyResult?.success && apifyResult?.source) {
            linkedinSource = apifyResult.source;
        } else if (apifyResult?.reason) {
            console.error(
                "CEB_LINKEDIN_APIFY_SOURCE_UNAVAILABLE",
                apifyResult.reason
            );
        }
    } else if (!linkedinUrl) {
        console.warn(
            "CEB_LINKEDIN_APIFY_SKIPPED_NO_PROFILE_URL",
            "No LinkedIn public company (/company/) or person (/in/) URL was found in the supplied links or nested footprint package."
        );
    }

    // X is the only social Actor collector configured in CEB. Reddit is disabled.
    const socialTasks = [];
    if (ENABLE_X && xUrl) {
        socialTasks.push(fetchSocialProfileAndPostsFromApify("x", xUrl)
            .then(result => ({ platform: "x", result })));
    }
    const socialResults = await Promise.all(socialTasks);
    for (const { platform, result } of socialResults) {
        if (result?.success && result?.source) {
            if (platform === "x") xEvidence = result.source;
            if (platform === "reddit") redditEvidence = result.source;
        } else {
            console.warn(`CEB_${platform.toUpperCase()}_APIFY_UNAVAILABLE`, result?.reason || "No social evidence returned.");
        }
    }

    /*
     * Signal gets the SAME collected evidence.
     *
     * No filtering/ranking occurs before this call.
     */
    const signalResult =
        await buildSignalSignals({
            websiteEvidence:
                [...websiteSources, ...websiteScraperSources],
            linkedinEvidence:
                linkedinSource,
            githubEvidence:
                githubEvidence,
            xEvidence,
            redditEvidence
        });

    /*
     * Universal Package = POSTMASTER.
     * It simply carries the evidence + Signal signals.
     */
    const universalPackage =
        buildUniversalPackage({
            primaryUrl,
            websiteSources,
            websiteScraperSources,
            websiteTopicCollectionStatus,
            linkedinSource,
            githubEvidence,
            xEvidence,
            redditEvidence,
            signalResult,
            crossEvidenceIntelligence: signalResult?.crossEvidenceIntelligence || null
        });

    const sourcesSucceeded =
        websiteSources.length +
        websiteScraperSources.length +
        (linkedinSource ? 1 : 0) +
        (githubEvidence ? 1 : 0) +
        (xEvidence ? 1 + (xEvidence.posts?.length || 0) : 0) +
        (redditEvidence ? 1 + (redditEvidence.posts?.length || 0) : 0);

    const sourcesFailed = sourcesSucceeded > 0 ? 0 : 1;

    console.log(
        "UNIVERSAL_PACKAGE_DEBUG",
        JSON.stringify({
            success:
                universalPackage.success,

            websiteSources:
                universalPackage
                    .websiteEvidence
                    .sources
                    .length,
            websiteScraperSources:
                universalPackage.websiteScraperEvidence?.sources?.length || 0,

            linkedinProfile:
                !!universalPackage
                    .linkedinEvidence
                    .profile,

            linkedinProfileAbout:
                safeText(
                    universalPackage
                        .linkedinEvidence
                        .about
                ).length,

            linkedinFollowers:
                universalPackage
                    .linkedinEvidence
                    .followersCount ??
                null,

            linkedinConnections:
                universalPackage
                    .linkedinEvidence
                    .connectionsCount ??
                null,

            linkedinPosts:
                universalPackage
                    .linkedinEvidence
                    .posts
                    .length,

            linkedinArticles:
                universalPackage
                    .linkedinEvidence
                    .articles
                    .length,

            linkedinCollectionStatus: linkedinSource
                ? "collected"
                : (linkedinUrl ? "actor_failed_or_empty" : "skipped_no_profile_url"),
            linkedinUrlDiscovered: !!linkedinUrl,

            githubEvidence:
                !!universalPackage.githubEvidence,
            xProfile: !!universalPackage.xEvidence,
            xPosts: universalPackage.xEvidence?.posts?.length || 0,
            redditProfile: false,
            redditPosts: 0,
            redditCollection: "disabled_no_actor_dispatch",

            signalStatus:
                signalResult?.status || "unknown",

            signalSignals:
                Object.keys(
                    universalPackage.signalSignals || {}
                ).length,

            deepSignalFamilies:
                universalPackage.signalSignals?.deepSignalFamilyCount || 0,

            deepSignalCount:
                universalPackage.signalSignals?.deepSignalCount || 0
        })
    );

    const result = {
        success: sourcesSucceeded > 0,

        packageType:
            "CrossEvidencePackage",

        sourcesProcessed:
            (websiteSources.length > 0 ? 1 : 0) +
            (websiteScraperSources.length > 0 ? 1 : 0) +
            (linkedinSource ? 1 : 0) +
            (githubEvidence ? 1 : 0) +
            (xEvidence ? 1 + (xEvidence.posts?.length || 0) : 0) +
            (redditEvidence ? 1 + (redditEvidence.posts?.length || 0) : 0),

        sourcesSucceeded,

        sourcesFailed,

        confidenceScore:
            sourcesSucceeded > 0 ? 100 : 0,

        errors: [],

        universalPackage,

        crossEvidencePackage: {
            success:
                universalPackage.success,

            packageType:
                "CrossEvidencePackage",

            version: "23.0",

            universalPackage,

            evidenceCoverage:
                universalPackage.evidenceCoverage
        }
    };

    console.log(
        "CROSS_EVIDENCE_FINAL",
        JSON.stringify({
            success: result.success,
            websiteSources:
                websiteSources.length,
            linkedin:
                !!linkedinSource,
            linkedinPosts:
                Array.isArray(universalPackage?.linkedinEvidence?.posts)
                    ? universalPackage.linkedinEvidence.posts.length
                    : 0,
            linkedinArticles:
                Array.isArray(universalPackage?.linkedinEvidence?.articles)
                    ? universalPackage.linkedinEvidence.articles.length
                    : 0,
            github:
                !!githubEvidence,
            x: !!xEvidence, xPosts: xEvidence?.posts?.length || 0,
            reddit: false, redditPosts: 0, redditCollection: "disabled",
            signalStatus:
                signalResult?.status || "unknown"
        })
    );

    return result;
}

export function getCrossEvidencePlatform(url) {
    return detectPlatform(
        normalizeUrl(url)
    );
}
