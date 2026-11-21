/* =========================================================
   EVIDENCE COMPRESSION BRAIN v28.0 — CHECKLIST PAGE SELECTION + NEED-BASED COMPRESSION
   TruthLoop AI

   CONTRACT — downstream names intentionally preserved:
   - exported function: loadEvidenceCompressionBrain
   - output packageType: Loop7EvidencePackage
   - output field: loop7Package
   - output evidenceUniverse / sourceRegistry / sourceLinks
   - output compressionStats

   Pipeline:
   UniversalPublicEvidencePackage
          -> VALIDATE
          -> SELECT
          -> PRESERVE
          -> MEANINGFUL REDUCTION
          -> BUILD LOOP7 PACKAGE
          -> BUDGET CHECK
          -> usable package

   This brain does NOT call an AI/model and does NOT perform source
   discovery. PCF and CEB are responsible for upstream filtration.
   ========================================================= */

// Expanded for large public websites and multi-platform evidence packages.
// These are character limits, not provider token/context guarantees.
const MAX_TOTAL_PACKAGE_CHARS = 1600000;
const ECB_OUTPUT_LIMIT = 1600000;
const ECB_TRANSPORT_LIMIT = 1600000;
const MAX_PCF_WEBSITE_CONTENT_CHARS = 1350000;
const MAX_ADDITIONAL_PLATFORM_CONTENT_CHARS = 100000;
const MAX_INPUT_PACKAGE_CHARS = 10000000;

/*
 * Loop 7 transport boundary:
 * Select up to 50 checklist-relevant PCF website pages. Keep all page
 * content unchanged when it fits the combined budget; otherwise allocate
 * the combined budget by relevance and preserve every selected source URL.
 */
const MAX_WEBSITE_SOURCES = 50;
const MAX_WEBSITE_SCRAPER_SOURCES = Number.POSITIVE_INFINITY; // Legacy stream retained for compatibility; CEB website crawler is disabled.
const MAX_LINKEDIN_POSTS = 10;
const MIN_LINKEDIN_POSTS = 1;
const MAX_LINKEDIN_ARTICLES = 0;
const MAX_X_POSTS = Number.POSITIVE_INFINITY;
const MAX_REDDIT_POSTS = 0;

const PACKAGE_VERSION = "28.0";

// Suppress all evidence streams originating from CEB's Apify scrapers
// through 27 Nov 2026. PCF website and direct GitHub evidence remain enabled.
const APIFY_SCRAPER_EVIDENCE_PAUSED = true;
const APIFY_SCRAPERS_PAUSED_THROUGH = "2026-11-27";

/* ---------------------------------------------------------
   BASIC HELPERS
--------------------------------------------------------- */

const cleanText = value =>
  typeof value === "string"
    ? value
        .replace(/\u0000/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";

const firstText = (...values) => {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
};

const normalizeUrl = value => {
  const raw = cleanText(value);
  if (!/^https?:\/\//i.test(raw)) return "";
  try {
    return new URL(raw).toString();
  } catch {
    return raw;
  }
};

const getUrl = item =>
  normalizeUrl(
    item?.permalink ||
    item?.permalinkUrl ||
    item?.tweetUrl ||
    item?.tweet_url ||
    item?.twitterUrl ||
    item?.statusUrl ||
    item?.status_url ||
    item?.url ||
    item?.sourceUrl ||
    item?.canonicalUrl ||
    item?.profileUrl ||
    item?.profileURL ||
    item?.postUrl ||
    item?.post_url ||
    item?.articleUrl ||
    item?.link ||
    ""
  ) || null;

const getDate = item =>
  item?.createdAtIso ||
  item?.createdAt ||
  item?.created_at ||
  item?.created_utc ||
  item?.timestamp ||
  item?.publishedDate ||
  item?.publishedAt ||
  item?.published_at ||
  item?.datePublished ||
  item?.postedAt ||
  item?.updatedAt ||
  item?.date ||
  null;

const getId = item =>
  item?.id ??
  item?.id_str ??
  item?.tweetId ??
  item?.tweet_id ??
  item?.fullname ??
  item?.fullName ??
  item?._id ??
  item?.urn ??
  null;

const isDateLike = value =>
  value instanceof Date ||
  /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(value || ""));

/* ---------------------------------------------------------
   MEANINGFUL SENTENCE REDUCTION

   Complete sentences are preferred. No blind character-ratio
   compression and no destructive 80/50/30/20/10/5/2 passes.
--------------------------------------------------------- */

const splitSentences = value =>
  cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean);

const scoreSentence = (sentence, index, total) => {
  let score = 0;

  if (/\b(i|we|my|our|me|us)\b/i.test(sentence)) score += 5;

  if (/\b(built|build|created|launched|worked|helped|served|developed|designed|tested|experimented|shipped|founded|learned|measured|implemented|published|sold|generated)\b/i.test(sentence)) {
    score += 4;
  }

  if (/\b(result|revenue|customer|client|user|product|company|founder|project|research|experience|achievement|milestone|lesson|problem|solution|focus|decision|process|system|strategy|failure|success|growth|traction|experiment|market|audience|business|technology|engineering)\b/i.test(sentence)) {
    score += 3;
  }

  if (/\b\d+(?:[.,]\d+)?(?:%|k|m|b)?\b/i.test(sentence)) score += 3;

  if (/:/.test(sentence)) score += 1;
  if (index === 0 || index === total - 1) score += 1;

  return score;
};

const meaningfulText = (value, maxChars = 700, maxSentences = 5) => {
  const text = cleanText(value);
  if (!text) return null;
  if (text.length <= maxChars) return text;

  const sentences = splitSentences(text);

  if (!sentences.length) {
    return text.slice(0, maxChars).trim();
  }

  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence, index, sentences.length)
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = [];
  let used = 0;

  for (const item of ranked) {
    if (selected.length >= maxSentences) break;

    const extra = item.sentence.length + (selected.length ? 1 : 0);
    if (used + extra > maxChars) continue;

    selected.push(item);
    used += extra;
  }

  if (!selected.length) return text.slice(0, maxChars).trim();

  return selected
    .sort((a, b) => a.index - b.index)
    .map(item => item.sentence)
    .join(" ")
    .slice(0, maxChars)
    .trim();
};

/* ---------------------------------------------------------
   INVESTIGATION-CHECKLIST WEBSITE PAGE SELECTION
   PCF and CEB retain the complete fetched page text. ECB first selects
   relevant pages using the 8-section public investigation checklist.
   Content is compressed later only when the combined website payload
   exceeds MAX_PCF_WEBSITE_CONTENT_CHARS.
--------------------------------------------------------- */
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

const SECTION_BY_PAGE_CATEGORY = {
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

const classifyChecklistPage = source => {
  const content = rawEvidenceText(source);
  const title = firstText(source?.title, source?.headline);
  const url = getUrl(source) || "";
  const searchable = `${source?.pageCategory || ""} ${Array.isArray(source?.pageCategories) ? source.pageCategories.join(" ") : ""} ${title} ${url} ${content.slice(0, 9000)}`;
  const matchedRules = WEBSITE_PAGE_CATEGORY_RULES.filter(rule => rule.pattern.test(searchable));
  const detected = matchedRules.map(rule => rule.category);
  const pageCategory = firstText(source?.pageCategory, detected[0], "general_company_information");
  const validCategory = SECTION_BY_PAGE_CATEGORY[pageCategory] ? pageCategory : (detected[0] || "general_company_information");
  const pageCategories = [...new Set([
    ...(Array.isArray(source?.pageCategories) ? source.pageCategories : []),
    ...detected,
    validCategory
  ])].filter(category => !!SECTION_BY_PAGE_CATEGORY[category]);
  return {
    pageCategory: validCategory,
    pageCategories: pageCategories.length ? pageCategories : ["general_company_information"],
    investigationSections: Array.isArray(source?.investigationSections) && source.investigationSections.length
      ? source.investigationSections
      : (SECTION_BY_PAGE_CATEGORY[validCategory] || SECTION_BY_PAGE_CATEGORY.general_company_information)
  };
};

const scoreChecklistPage = source => {
  const classified = classifyChecklistPage(source);
  const content = rawEvidenceText(source);
  const title = firstText(source?.title, source?.headline);
  const categoryWeight = WEBSITE_PAGE_CATEGORY_RULES.find(rule => rule.category === classified.pageCategory)?.weight || 20;
  let score = categoryWeight + sourceScore(source, "website");
  if (title.length > 8) score += 5;
  if (content.length >= 2500) score += 20;
  else if (content.length >= 1000) score += 12;
  else if (content.length < 350) score -= 12;
  if (/\b(202[0-9]|19[89][0-9])\b/.test(content)) score += 7;
  if (/\b(\d+(?:[.,]\d+)?\s?(?:%|million|billion|crore|lakh|thousand|users?|customers?|clients?|employees?|projects?))\b/i.test(content)) score += 12;
  if (/\b(delivered|deployed|launched|implemented|renewed|retained|audited|certified|filed|acquired|partnered|shipped)\b/i.test(content)) score += 10;
  return { ...classified, score, contentChars: content.length };
};

const selectChecklistWebsitePages = (items, limit = MAX_WEBSITE_SOURCES) => {
  const deduped = new Map();
  for (const source of Array.isArray(items) ? items : []) {
    if (!source || typeof source !== "object") continue;
    const url = getUrl(source);
    const key = url || `${firstText(source?.title)}:${rawEvidenceText(source).slice(0, 100)}`;
    const existing = deduped.get(key);
    if (!existing || rawEvidenceText(source).length > rawEvidenceText(existing).length) deduped.set(key, source);
  }

  const ranked = [...deduped.values()].map((source, index) => {
    const assessment = scoreChecklistPage(source);
    return {
      source,
      index,
      ...assessment,
      url: getUrl(source),
      score: assessment.score
    };
  }).sort((a, b) => b.score - a.score || b.contentChars - a.contentChars || a.index - b.index);

  const selected = [];
  const selectedKeys = new Set();
  const categoryWinners = new Map();
  for (const item of ranked) {
    const category = item.pageCategory || "general_company_information";
    if (!categoryWinners.has(category)) categoryWinners.set(category, item);
  }

  // Reserve the strongest available page for each discovered investigation category first.
  const categoryOrder = [...categoryWinners.values()].sort((a, b) => b.score - a.score);
  for (const item of categoryOrder) {
    const key = item.url || `${item.source?.title}:${item.index}`;
    if (selected.length >= limit || selectedKeys.has(key)) continue;
    selected.push(item);
    selectedKeys.add(key);
  }
  for (const item of ranked) {
    const key = item.url || `${item.source?.title}:${item.index}`;
    if (selected.length >= limit || selectedKeys.has(key)) continue;
    selected.push(item);
    selectedKeys.add(key);
  }

  const sources = selected.map(item => ({
    ...item.source,
    pageCategory: item.pageCategory,
    pageCategories: item.pageCategories,
    investigationSections: item.investigationSections,
    selectionScore: item.score,
    selectionReason: `Selected for public investigation checklist coverage: ${item.pageCategory}; relevant sections ${item.investigationSections.join(", ")}.`
  }));
  const categoryCounts = sources.reduce((counts, source) => {
    const category = source.pageCategory || "general_company_information";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  return {
    sources,
    available: deduped.size,
    selected: sources.length,
    omitted: Math.max(0, deduped.size - sources.length),
    categoryCounts,
    originalContentChars: sources.reduce((sum, source) => sum + rawEvidenceText(source).length, 0)
  };
};

const compressWebsitePageToBudget = (content, maxChars) => {
  const original = String(content || "");
  if (!original || original.length <= maxChars) return original;
  const sentenceAllowance = Math.min(5000, Math.max(100, Math.ceil(Math.max(250, maxChars) / 60)));
  const selected = meaningfulText(original, Math.max(250, maxChars), sentenceAllowance);
  if (selected && selected.length <= maxChars) return selected;
  return original.slice(0, Math.max(250, maxChars)).trimEnd();
};

// Allocate the combined website-content budget without needlessly cutting
// short pages. Every selected page first receives a baseline allowance; the
// remaining budget is distributed by checklist relevance and remaining size.
const allocateWebsitePageBudgets = (sources = [], totalBudget = MAX_PCF_WEBSITE_CONTENT_CHARS) => {
  const items = (Array.isArray(sources) ? sources : []).map((source, index) => ({
    source,
    index,
    id: source?.sourceId || getUrl(source) || `website-page-${index}`,
    length: String(source?.content || "").length,
    weight: Math.max(1, Number(source?.selectionScore) || 1)
  })).filter(item => item.length > 0);
  const originalChars = items.reduce((sum, item) => sum + item.length, 0);
  const budgets = new Map();
  if (originalChars <= totalBudget) {
    for (const item of items) budgets.set(item.id, item.length);
    return { budgets, originalChars, allocatedChars: originalChars, compressionRequired: false };
  }

  const baselinePerPage = 2500;
  let remainingBudget = Math.max(0, totalBudget);
  const active = [];
  for (const item of items) {
    const baseline = Math.min(item.length, baselinePerPage);
    budgets.set(item.id, baseline);
    remainingBudget -= baseline;
    if (item.length > baseline) active.push({ ...item, remaining: item.length - baseline });
  }
  remainingBudget = Math.max(0, remainingBudget);

  // Weighted water-filling: pages with stronger checklist relevance receive
  // more of the remaining characters, while shorter pages can stay complete.
  let pool = active;
  while (remainingBudget > 0 && pool.length) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let spent = 0;
    const nextPool = [];
    for (const item of pool) {
      const share = Math.floor(remainingBudget * item.weight / totalWeight);
      const grant = Math.min(item.remaining, share);
      if (grant > 0) {
        budgets.set(item.id, (budgets.get(item.id) || 0) + grant);
        item.remaining -= grant;
        spent += grant;
      }
      if (item.remaining > 0) nextPool.push(item);
    }
    remainingBudget -= spent;
    if (remainingBudget > 0 && nextPool.length) {
      // Distribute integer-division remainder one character at a time.
      nextPool.sort((a, b) => b.weight - a.weight || a.index - b.index);
      for (const item of nextPool) {
        if (remainingBudget <= 0) break;
        if (item.remaining <= 0) continue;
        budgets.set(item.id, (budgets.get(item.id) || 0) + 1);
        item.remaining -= 1;
        remainingBudget -= 1;
        spent += 1;
      }
    }
    if (spent <= 0) break;
    pool = nextPool.filter(item => item.remaining > 0);
  }

  const allocatedChars = [...budgets.values()].reduce((sum, value) => sum + value, 0);
  return { budgets, originalChars, allocatedChars, compressionRequired: true };
};

/* ---------------------------------------------------------
   SOURCE EXTRACTION
--------------------------------------------------------- */

const extractEvidenceText = (source, maxChars = 700, maxSentences = 5) =>
  meaningfulText(
    firstText(
      source?.visibleText,
      source?.fullText,
      source?.full_text,
      source?.selftext,
      source?.body,
      source?.postText,
      source?.publicEvidence?.content,
      source?.publicEvidence?.evidence,
      source?.publicEvidence?.observation,
      source?.content,
      source?.body,
      source?.contentSnippet,
      source?.description,
      source?.summary,
      source?.text,
      source?.headline
    ),
    maxChars,
    maxSentences
  );


const rawEvidenceText = source =>
  cleanText(
    firstText(
      source?.visibleText,
      source?.fullText,
      source?.full_text,
      source?.selftext,
      source?.body,
      source?.postText,
      source?.publicEvidence?.content,
      source?.publicEvidence?.evidence,
      source?.publicEvidence?.observation,
      source?.content,
      source?.body,
      source?.contentSnippet,
      source?.description,
      source?.summary,
      source?.text,
      source?.headline
    )
  );

const sourceScore = (source, kind = "website") => {
  const text = firstText(
    source?.visibleText,
    source?.content,
    source?.body,
    source?.description,
    source?.text,
    source?.about,
    source?.summary
  );

  let score = Math.min(text.length / 500, 10);

  if (source?.publicEvidence) score += 4;
  if (Array.isArray(source?.posts) && source.posts.length) score += 2;
  if (Array.isArray(source?.articles) && source.articles.length) score += 2;

  const url = getUrl(source) || "";
  if (kind === "website") {
    if (/\b(about|product|solution|problem|research|blog|article|founder|company)\b/i.test(url)) score += 3;
    if (/\b(privacy|terms|cookie|login|signup|contact)\b/i.test(url)) score -= 5;
  }

  if (getDate(source)) score += 1;
  return score;
};

const selectSources = (items, limit, kind) =>
  (Array.isArray(items) ? items : [])
    .filter(item => item && typeof item === "object")
    .map((item, index) => ({ item, index, score: sourceScore(item, kind) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(entry => entry.item);

const selectLinkedInItems = (items, limit) =>
  (Array.isArray(items) ? items : [])
    .filter(item => item && typeof item === "object")
    .map((item, index) => ({
      item,
      index,
      date: String(getDate(item) || ""),
      score: sourceScore(item, "linkedin")
    }))
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      b.score - a.score ||
      a.index - b.index
    )
    .slice(0, limit)
    .map(entry => entry.item);

/* ---------------------------------------------------------
   SIGNAL REDUCTION

   Signals are already evidence-grounded by CEB. Preserve the
   strongest signal text rather than recursively carrying the
   entire upstream signal object.
--------------------------------------------------------- */

const SIGNAL_KEYS = [
  "identity",
  "positioning",
  "niches",
  "expertiseSignals",
  "audienceSignals",
  "businessSignals",
  "creatorSignals",
  "contentPatternSignals",
  "proofSignals",
  "topics",
  "recurringTopics",
  "behavioralSignals",
  "contradictions",
  "crossSourceSignals",
  "deepSignalFamilies",
  "deepSignalCount",
  "deepSignalFamilyCount",
  "signalConfidence"
];

const signalText = item => {
  if (typeof item === "string") return cleanText(item);
  if (!item || typeof item !== "object") return "";

  return firstText(
    item?.signal,
    item?.observation,
    item?.evidence,
    item?.basis,
    item?.reason,
    item?.rationale,
    item?.description,
    item?.text,
    item?.summary,
    item?.value,
    item?.label
  );
};

const reduceSignalFamily = (value, limit = 1) => {
  if (!Array.isArray(value)) return value;

  const out = [];
  const seen = new Set();

  for (const item of value) {
    const text = meaningfulText(signalText(item), 300, 2);
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    if (typeof item === "string") {
      out.push(text);
    } else {
      out.push({
        signal: text
      });
    }

    if (out.length >= limit) break;
  }

  return out;
};


/* ---------------------------------------------------------
   DEEP SIGNAL FAMILY REDUCTION
   CEB supplies 10 families x 10 meaningful members.
   ECB compresses those members into one traceable,
   meaningful family-level signal per family.
   --------------------------------------------------------- */

const reduceDeepSignalFamilies = (deepFamilies = {}) => {
  if (!deepFamilies || typeof deepFamilies !== "object") return {};

  const output = {};

  for (const [family, membersValue] of Object.entries(deepFamilies)) {
    if (!Array.isArray(membersValue) || !membersValue.length) continue;

    const members = membersValue
      .filter(item => item && typeof item === "object")
      .slice(0, 10);

    if (!members.length) continue;

    const findings = members
      .map(item =>
        firstText(
          item?.finding,
          item?.signal,
          item?.observation,
          item?.evidence,
          item?.basis
        )
      )
      .filter(Boolean);

    const basis = members
      .map(item => firstText(item?.basis, item?.rationale, item?.reason))
      .filter(Boolean);

    const sourceUrls = [
      ...new Set(
        members.flatMap(item =>
          Array.isArray(item?.supportingSourceUrls)
            ? item.supportingSourceUrls
            : []
        )
      )
    ].filter(Boolean);

    const confidenceValues = members
      .map(item => Number(item?.confidence))
      .filter(Number.isFinite);

    const averageConfidence =
      confidenceValues.length
        ? confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length
        : 0.84;

    const strongest =
      members
        .slice()
        .sort(
          (a, b) =>
            Number(b?.confidence || 0) - Number(a?.confidence || 0)
        )[0] || members[0];

    output[family] = {
      family,
      memberCount: members.length,
      finding: meaningfulText(
        findings.join(" "),
        65,
        1
      ),
      basis: meaningfulText(
        basis.join(" "),
        20,
        1
      ),
      supportingSourceUrls: sourceUrls.slice(0, 1),
      confidence: Number(
        Math.min(0.98, Math.max(0.75, averageConfidence)).toFixed(2)
      )
    };
  }

  return output;
};

const reduceSignals = rawSignals => {
  const source =
    rawSignals && typeof rawSignals === "object"
      ? rawSignals
      : {};

  const output = {};

  for (const key of SIGNAL_KEYS) {
    if (!(key in source)) continue;

    if (key === "identity") {
      const identity = source.identity;
      if (identity && typeof identity === "object") {
        output.identity = {};
        for (const [name, value] of Object.entries(identity)) {
          const text = meaningfulText(value, 220, 2);
          if (text) output.identity[name] = text;
        }
      } else if (identity) {
        output.identity = meaningfulText(identity, 300, 2);
      }
      continue;
    }

    if (key === "signalConfidence") {
      output.signalConfidence = source.signalConfidence;
      continue;
    }

    if (key === "deepSignalFamilies") {
      output.deepSignalFamilies =
        reduceDeepSignalFamilies(source.deepSignalFamilies);
      continue;
    }

    if (key === "deepSignalCount" || key === "deepSignalFamilyCount") {
      output[key] = source[key];
      continue;
    }

    if (Array.isArray(source[key])) {
      const reduced = reduceSignalFamily(source[key], 5);
      if (reduced.length) output[key] = reduced;
    } else if (source[key] && typeof source[key] === "object") {
      const text = signalText(source[key]);
      if (text) output[key] = [{ signal: meaningfulText(text, 300, 2) }];
    }
  }

  return output;
};

/* ---------------------------------------------------------
   GITHUB REDUCTION

   Preserve one GitHub source, but do not carry the full PCF object
   (links/headings/social metadata can be extremely large).
--------------------------------------------------------- */

const buildGithubEvidence = source => {
  if (!source || typeof source !== "object") return null;

  const result = {
    sourceId: null,
    sourceType: "github",
    name: firstText(source?.name, source?.title).slice(0, 180) || null,
    title: firstText(source?.title, source?.name).slice(0, 220) || null,
    url: getUrl(source),
    date: getDate(source),
    description: meaningfulText(
      firstText(source?.description, source?.summary),
      500,
      3
    ),
    content: extractEvidenceText(source, 6000, 60)
  };

  if (source?.owner) {
    result.owner = firstText(
      typeof source.owner === "string"
        ? source.owner
        : source.owner?.login || source.owner?.name
    ).slice(0, 120) || null;
  }

  if (source?.language) {
    result.language = firstText(source.language).slice(0, 80) || null;
  }

  if (source?.stars != null) result.stars = source.stars;
  if (source?.forks != null) result.forks = source.forks;

  return result;
};

/* ---------------------------------------------------------
   PACKAGE VALIDATION
--------------------------------------------------------- */

const resolveUniversalPackage = publicEvidencePackage => {
  if (
    publicEvidencePackage?.universalPackage &&
    typeof publicEvidencePackage.universalPackage === "object"
  ) {
    return publicEvidencePackage.universalPackage;
  }

  return publicEvidencePackage && typeof publicEvidencePackage === "object"
    ? publicEvidencePackage
    : null;
};

const validateUniversalPackage = universalPackage => {
  if (!universalPackage || typeof universalPackage !== "object") {
    return {
      valid: false,
      reason: "Universal public evidence package is missing."
    };
  }

  const hasEvidenceContainer =
    !!universalPackage.websiteEvidence ||
    !!universalPackage.linkedinEvidence ||
    !!universalPackage.githubEvidence ||
    !!universalPackage.xEvidence ||
    !!universalPackage.redditEvidence ||
    !!universalPackage.signalSignals ||
    !!universalPackage.geminiSignals ||
    !!universalPackage.signalMaster;

  if (!hasEvidenceContainer) {
    return {
      valid: false,
      reason: "Universal public evidence package contains no recognized evidence containers."
    };
  }

  return { valid: true };
};

/* ---------------------------------------------------------
   MAIN — NAME PRESERVED EXACTLY
--------------------------------------------------------- */

async function loadEvidenceCompressionBrain({
  truthLoopPackage = {},
  publicEvidencePackage = {}
} = {}) {
  console.log("ECB_START");

  const universalPackage =
    resolveUniversalPackage(publicEvidencePackage);

  const originalUniversalSize = universalPackage
    ? JSON.stringify(universalPackage).length
    : 0;

  console.log(
    "ECB_INPUT_SIZE_AUDIT",
    JSON.stringify({
      originalChars: originalUniversalSize,
      inputBudget: MAX_INPUT_PACKAGE_CHARS
    })
  );

  if (!publicEvidencePackage?.success) {
    console.error("ECB_VALIDATE_FAILED", "Public evidence package is not successful.");
    return {
      success: false,
      reason: "No public evidence",
      loop7Package: null
    };
  }

  if (originalUniversalSize > MAX_INPUT_PACKAGE_CHARS) {
    console.error(
      "ECB_INPUT_BUDGET_EXCEEDED",
      JSON.stringify({
        originalChars: originalUniversalSize,
        maxAllowed: MAX_INPUT_PACKAGE_CHARS
      })
    );

    return {
      success: false,
      reason: "Universal public evidence package exceeds the 10,000,000-character input budget.",
      loop7Package: null
    };
  }

  const validation = validateUniversalPackage(universalPackage);
  if (!validation.valid) {
    console.error("ECB_VALIDATE_FAILED", validation.reason);
    return {
      success: false,
      reason: validation.reason,
      loop7Package: null
    };
  }

  /* -------------------------------------------------------
     1 + 2. SELECT
  ------------------------------------------------------- */

  // PCF website pages and additive CEB website-scraper pages are
  // separate evidence streams. Keep both streams distinct in the
  // final package and source registry.
  const websiteInput = Array.isArray(universalPackage?.websiteEvidence?.sources)
    ? universalPackage.websiteEvidence.sources
    : [];
  const rawWebsiteScraperInput = Array.isArray(universalPackage?.websiteScraperEvidence?.sources)
    ? universalPackage.websiteScraperEvidence.sources
    : [];
  const websiteScraperInput = APIFY_SCRAPER_EVIDENCE_PAUSED ? [] : rawWebsiteScraperInput;
  const websiteTopicCollectionStatus = !APIFY_SCRAPER_EVIDENCE_PAUSED && universalPackage?.websiteScraperEvidence?.topicCollectionStatus && typeof universalPackage.websiteScraperEvidence.topicCollectionStatus === "object"
    ? universalPackage.websiteScraperEvidence.topicCollectionStatus
    : {};

  const websitePageSelection = selectChecklistWebsitePages(
    websiteInput,
    MAX_WEBSITE_SOURCES
  );
  const websiteSourcesInput = websitePageSelection.sources;
  const websiteScraperSourcesInput = selectSources(
    websiteScraperInput,
    MAX_WEBSITE_SCRAPER_SOURCES,
    "website"
  );

  const rawLinkedinEvidence =
    universalPackage?.linkedinEvidence &&
    typeof universalPackage.linkedinEvidence === "object"
      ? universalPackage.linkedinEvidence
      : {};
  const linkedinEvidence = APIFY_SCRAPER_EVIDENCE_PAUSED ? {} : rawLinkedinEvidence;

  const linkedinSource =
    linkedinEvidence?.source &&
    typeof linkedinEvidence.source === "object"
      ? linkedinEvidence.source
      : {};

  // LinkedIn profile details are intentionally not part of this evidence contract.
  const profileInput = null;

  const postsInput =
    Array.isArray(linkedinEvidence?.posts)
      ? linkedinEvidence.posts
      : Array.isArray(linkedinSource?.posts)
        ? linkedinSource.posts
        : [];

  // LinkedIn articles are excluded; the requested evidence is the latest posts only.
  const articlesInput = [];

  const githubInput =
    universalPackage?.githubEvidence &&
    typeof universalPackage.githubEvidence === "object"
      ? universalPackage.githubEvidence
      : null;

  const rawXInput = universalPackage?.xEvidence && typeof universalPackage.xEvidence === "object" ? universalPackage.xEvidence : null;
  const xInput = APIFY_SCRAPER_EVIDENCE_PAUSED ? null : rawXInput;
  // Reddit is not part of the active CEB/ECB source contract.
  const redditInput = null;
  const xPostsInput = (Array.isArray(xInput?.posts) ? xInput.posts : Array.isArray(xInput?.recentPosts) ? xInput.recentPosts : []);
  const redditPostsInput = [];

  const linkedinPostsInput = selectLinkedInItems(
    postsInput,
    MAX_LINKEDIN_POSTS
  );

  const linkedinArticlesInput = selectLinkedInItems(
    articlesInput,
    MAX_LINKEDIN_ARTICLES
  );

  console.log("ECB_SOURCE_STREAM_INPUT_AUDIT", JSON.stringify({
    apifyScraperPause: {
      paused: APIFY_SCRAPER_EVIDENCE_PAUSED,
      pausedThrough: APIFY_SCRAPERS_PAUSED_THROUGH,
      rawWebsiteScraperSourcesReceived: rawWebsiteScraperInput.length,
      rawLinkedinPostsReceived: Array.isArray(rawLinkedinEvidence?.posts) ? rawLinkedinEvidence.posts.length : Array.isArray(rawLinkedinEvidence?.source?.posts) ? rawLinkedinEvidence.source.posts.length : 0,
      rawXProfileReceived: !!rawXInput,
      rawXPostsReceived: Array.isArray(rawXInput?.posts) ? rawXInput.posts.length : Array.isArray(rawXInput?.recentPosts) ? rawXInput.recentPosts.length : 0
    },
    pcfWebsite: { available: websiteInput.length, selected: websiteSourcesInput.length },
    cebWebsiteScraper: { available: websiteScraperInput.length, selected: websiteScraperSourcesInput.length, maxAllowed: MAX_WEBSITE_SCRAPER_SOURCES },
    githubPCF: { available: !!universalPackage?.githubEvidence, selected: !!universalPackage?.githubEvidence },
    linkedin: { profileAvailable: !!profileInput, postsAvailable: postsInput.length, articlesAvailable: articlesInput.length },
    x: { profileAvailable: !!xInput, postsAvailable: xPostsInput.length },
    reddit: { enabled: false, accepted: false }
  }));

  console.log(
    "ECB_SELECTION_AUDIT",
    JSON.stringify({
      websiteAvailable: websiteInput.length,
      websiteSelected: websiteSourcesInput.length,
      websiteScraperAvailable: websiteScraperInput.length,
      websiteScraperSelected: websiteScraperSourcesInput.length,
      websiteScraperMaxAllowed: MAX_WEBSITE_SCRAPER_SOURCES,
      linkedinPostsAvailable: postsInput.length,
      linkedinPostsSelected: linkedinPostsInput.length,
      linkedinArticlesAvailable: 0,
      linkedinArticlesSelected: 0,
      linkedinProfileSelected: false,
      githubSelected: !!githubInput,
      xProfileSelected: !!xInput, xPostsSelected: xPostsInput.length,
      redditProfileSelected: false, redditPostsSelected: 0, redditCollection: "disabled"
    })
  );

  /* -------------------------------------------------------
     3. PRESERVE
  ------------------------------------------------------- */

  let sourceIndex = 1;
  const nextSourceId = () =>
    `SOURCE_${String(sourceIndex++).padStart(2, "0")}`;

  const websiteSources = websiteSourcesInput.map(source => ({
    sourceId: nextSourceId(),
    sourceType: "website",
    evidenceStream: "pcf_website",
    url: getUrl(source),
    title: firstText(source?.title, source?.headline).slice(0, 220) || null,
    date: getDate(source),
    content: rawEvidenceText(source),
    pageCategory: source?.pageCategory || source?.category || null,
    pageCategories: Array.isArray(source?.pageCategories) ? source.pageCategories : [],
    investigationSections: Array.isArray(source?.investigationSections) ? source.investigationSections : [],
    selectionScore: Number.isFinite(Number(source?.selectionScore)) ? Number(source.selectionScore) : null,
    selectionReason: source?.selectionReason || null,
    collectionPurpose: source?.collectionPurpose || null,
    topicKey: source?.topicKey || null,
    topicLabel: source?.topicLabel || null,
    topicRelevanceScore: Number.isFinite(Number(source?.topicRelevanceScore)) ? Number(source.topicRelevanceScore) : null,
    topicEvidenceStatus: source?.topicEvidenceStatus || null,
    topicEvidenceSignals: Array.isArray(source?.topicEvidenceSignals) ? source.topicEvidenceSignals.slice(0, 8) : [],
    sourceDomain: source?.sourceDomain || (() => { try { return new URL(getUrl(source)).hostname; } catch { return null; } })(),
    sourceIndependence: source?.sourceIndependence || null,
    metadata: source?.metadata ?? null,
    structuredData: source?.structuredData ?? source?.jsonLd ?? null
  }));

  const pcfWebsiteSelection = {
    sources: websiteSources,
    originalChars: websiteSources.reduce((sum, source) => sum + String(source.content || "").length, 0),
    selectedChars: websiteSources.reduce((sum, source) => sum + String(source.content || "").length, 0),
    omittedChars: 0,
    sourcesCapped: 0,
    capApplied: false
  };
  console.log("ECB_PCF_WEBSITE_CHECKLIST_SELECTION_AUDIT", JSON.stringify({
    selectionRule: "Select public website pages by investigation-checklist relevance and category coverage before content compression",
    maxWebsiteSources: MAX_WEBSITE_SOURCES,
    availableSources: websitePageSelection.available,
    selectedSources: websitePageSelection.selected,
    omittedSources: websitePageSelection.omitted,
    categoryCounts: websitePageSelection.categoryCounts,
    originalContentChars: pcfWebsiteSelection.originalChars,
    contentCompressionAtSelectionStage: false,
    sourcesWithContent: websiteSources.filter(source => String(source.content || "").length > 0).length
  }));

  const websiteScraperSources = websiteScraperSourcesInput.map(source => ({
    sourceId: nextSourceId(),
    sourceType: "website_scraper",
    evidenceStream: "ceb_website_scraper",
    url: getUrl(source),
    title: firstText(source?.title, source?.headline, source?.name).slice(0, 220) || null,
    date: getDate(source),
    pageCategory: source?.pageCategory || source?.category || null,
    collectionPurpose: source?.collectionPurpose || "general_website",
    topicKey: source?.topicKey || null,
    topicLabel: source?.topicLabel || null,
    topicRelevanceScore: Number.isFinite(Number(source?.topicRelevanceScore)) ? Number(source.topicRelevanceScore) : null,
    topicEvidenceStatus: source?.topicEvidenceStatus || null,
    topicEvidenceSignals: Array.isArray(source?.topicEvidenceSignals) ? source.topicEvidenceSignals.slice(0, 8) : [],
    sourceDomain: source?.sourceDomain || null,
    sourceIndependence: source?.sourceIndependence || null,
    content: extractEvidenceText(source, 6000, 60),
    metadata: source?.metadata ?? null,
    structuredData: source?.structuredData ?? source?.jsonLd ?? null
  }));

  console.log("ECB_WEBSITE_SCRAPER_AUDIT", JSON.stringify({
    available: websiteScraperInput.length,
    retained: websiteScraperSources.length,
    topicCollectionStatus: websiteTopicCollectionStatus,
    pages: websiteScraperSources.map(({sourceId, title, url, pageCategory, collectionPurpose, topicKey, topicRelevanceScore, topicEvidenceStatus, content}) => ({
      sourceId, title, url, pageCategory, collectionPurpose, topicKey, topicRelevanceScore, topicEvidenceStatus, contentChars: String(content || "").length
    }))
  }));

  console.log(
    "ECB_WEBSITE_SOURCE_AUDIT",
    websiteSources.map((source, index) => {
      const original = websiteSourcesInput[index];
      return {
        sourceId: source.sourceId,
        title: source.title,
        originalChars: rawEvidenceText(original).length,
        preservedChars: String(source.content || "").length,
        preservedPreview: String(source.content || "").slice(0, 300)
      };
    })
  );

  const profile = profileInput
    ? {
        sourceId: nextSourceId(),
        sourceType: "linkedin_profile",
        profileUrl:
          getUrl(profileInput) ||
          normalizeUrl(
            linkedinSource?.sourceUrl ||
            linkedinEvidence?.sourceUrl ||
            ""
          ) || null,
        name:
          firstText(profileInput?.name).slice(0, 150) || null,
        headline:
          meaningfulText(profileInput?.headline, 600, 4),
        about:
          meaningfulText(
            firstText(
              profileInput?.about,
              profileInput?.summary,
              profileInput?.bio
            ),
            2500,
            10
          ),
        location:
          firstText(profileInput?.location).slice(0, 120) || null,
        currentCompany:
          firstText(
            typeof profileInput?.currentCompany === "string"
              ? profileInput.currentCompany
              : profileInput?.currentCompany?.name ||
                profileInput?.currentCompany?.companyName
          ).slice(0, 150) || null,
        followersCount:
          profileInput?.followersCount ??
          linkedinEvidence?.followersCount ??
          null,
        connectionsCount:
          profileInput?.connectionsCount ??
          linkedinEvidence?.connectionsCount ??
          null
      }
    : null;

  console.log(
    "ECB_LINKEDIN_PROFILE_AUDIT",
    JSON.stringify(
      profile
        ? {
            sourceId: profile.sourceId,
            name: profile.name,
            headlineChars: String(profile.headline || "").length,
            aboutChars: String(profile.about || "").length,
            headline: profile.headline || null,
            aboutPreview: String(profile.about || "").slice(0, 300),
            profileUrl: profile.profileUrl || null
          }
        : null,
      null,
      2
    )
  );

  const linkedinPosts = linkedinPostsInput.map(item => ({
    sourceId: nextSourceId(),
    sourceType: "linkedin_post",
    id: getId(item),
    url: getUrl(item) || null,
    date: getDate(item),
    title:
      firstText(item?.title, item?.headline).slice(0, 180) || null,
    content:
      extractEvidenceText(item, 6000, 60),
    likes: item?.likes ?? null,
    comments: item?.comments ?? null
  }));

  console.log(
    "ECB_LINKEDIN_POST_SOURCE_AUDIT",
    linkedinPosts.map((post, index) => {
      const original = linkedinPostsInput[index];
      return {
        sourceId: post.sourceId,
        title: post.title,
        originalChars: rawEvidenceText(original).length,
        preservedChars: String(post.content || "").length,
        preservedPreview: String(post.content || "").slice(0, 300)
      };
    })
  );

  const linkedinArticles = linkedinArticlesInput.map(item => ({
    sourceId: nextSourceId(),
    sourceType: "linkedin_article",
    id: getId(item),
    url: getUrl(item) || null,
    date: getDate(item),
    title:
      firstText(item?.title, item?.headline).slice(0, 200) || null,
    content:
      extractEvidenceText(item, 6000, 60),
    likes: item?.likes ?? null,
    comments: item?.comments ?? null
  }));

  console.log(
    "ECB_LINKEDIN_ARTICLE_SOURCE_AUDIT",
    linkedinArticles.map((article, index) => {
      const original = linkedinArticlesInput[index];
      return {
        sourceId: article.sourceId,
        title: article.title,
        originalChars: rawEvidenceText(original).length,
        preservedChars: String(article.content || "").length,
        preservedPreview: String(article.content || "").slice(0, 300)
      };
    })
  );

  const githubEvidence = githubInput
    ? buildGithubEvidence(githubInput)
    : null;

  if (githubEvidence) {
    githubEvidence.sourceId = nextSourceId();
  }

  const buildSocialProfile = (input, platform) => input ? ({
    sourceId: nextSourceId(),
    sourceType: `${platform}_profile`,
    platform,
    name: firstText(input?.profile?.name, input?.name, input?.profile?.username, input?.username).slice(0, 150) || null,
    headline: meaningfulText(firstText(input?.profile?.headline, input?.profile?.description, input?.description), 500, 3),
    about: meaningfulText(firstText(input?.profile?.about, input?.profile?.bio, input?.description), 1800, 8),
    profileUrl: getUrl(input?.profile || input) || getUrl(input) || null,
    url: getUrl(input?.profile || input) || getUrl(input) || null
  }) : null;
  const xProfile = buildSocialProfile(xInput, "x");
  const redditProfile = buildSocialProfile(redditInput, "reddit");
  const buildSocialPosts = (items, platform) => items.map(item => ({
    sourceId: nextSourceId(),
    sourceType: `${platform}_post`,
    id: getId(item),
    url: getUrl(item),
    date: getDate(item) || item?.createdAt || item?.created_at || null,
    title: firstText(item?.title, item?.headline, item?.text).slice(0, 180) || null,
    content: extractEvidenceText(item, 5000, 50),
    platform
  })).filter(item => item.url || item.content);
  const xPosts = buildSocialPosts(xPostsInput, "x");
  const redditPosts = buildSocialPosts(redditPostsInput, "reddit");

  console.log(
    "ECB_GITHUB_SOURCE_AUDIT",
    JSON.stringify(
      githubEvidence
        ? {
            sourceId: githubEvidence.sourceId,
            title: githubEvidence.title,
            originalChars: rawEvidenceText(githubInput).length,
            preservedChars: String(githubEvidence.content || "").length,
            descriptionChars: String(githubEvidence.description || "").length,
            preservedPreview: String(githubEvidence.content || "").slice(0, 300),
            descriptionPreview: String(githubEvidence.description || "").slice(0, 300),
            url: githubEvidence.url || null
          }
        : null,
      null,
      2
    )
  );

  const rawSignals =
    universalPackage?.signalSignals &&
    typeof universalPackage.signalSignals === "object"
      ? universalPackage.signalSignals
      : universalPackage?.geminiSignals &&
        typeof universalPackage.geminiSignals === "object"
        ? universalPackage.geminiSignals
        : universalPackage?.signalMaster &&
          typeof universalPackage.signalMaster === "object"
          ? universalPackage.signalMaster
          : {};

  const signalMaster = reduceSignals(rawSignals);

  /* -------------------------------------------------------
     BEHAVIORAL CLUSTERING
     Compact, evidence-first leads derived directly from the
     retained public evidence. Legacy pre-generated signals remain
     detached from the Loop 7 source payload.
  ------------------------------------------------------- */
  const behavioralClusterRules = [
    { name: "Planning instead of shipping", terms: ["planning", "prepare", "preparing", "research", "framework", "thinking"] },
    { name: "Validation seeking", terms: ["likes", "followers", "views", "attention", "approval", "recognition", "validation"] },
    { name: "Overthinking before action", terms: ["overthinking", "overthink", "hesitation", "uncertain", "indecision", "analysis"] },
    { name: "Identity protection", terms: ["identity", "rejection", "criticism", "failure", "exposure", "self-image"] },
    { name: "Perfectionism", terms: ["perfect", "perfectionism", "refine", "refining", "polish", "optimize", "optimizing", "restart", "restarting"] },
    { name: "Avoidance loops", terms: ["avoid", "avoidance", "procrastination", "procrastinate", "delay", "postpone", "stuck", "self-sabotage"] }
  ];

  const retainedEvidenceUnits = [
    ...websiteSources,
    ...websiteScraperSources,
    ...linkedinPosts,
    ...linkedinArticles,
    ...(githubEvidence ? [githubEvidence] : []),
    ...(xProfile ? [xProfile] : []), ...xPosts,
    ...(redditProfile ? [redditProfile] : []), ...redditPosts
  ];

  const behavioralClusters = behavioralClusterRules
    .map(rule => {
      const matches = [];
      for (const source of retainedEvidenceUnits) {
        const text = rawEvidenceText(source).toLowerCase();
        const matchedTerms = rule.terms.filter(term => {
          const escaped = String(term).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
          return new RegExp(`\\b${escaped}\\b`, "i").test(text);
        });
        if (matchedTerms.length) {
          matches.push({
            sourceId: source.sourceId || null,
            url: getUrl(source),
            matchedTerms: matchedTerms.slice(0, 4)
          });
        }
      }

      const matchCount = matches.reduce((sum, item) => sum + item.matchedTerms.length, 0);
      if (!matchCount) return null;

      const sourceCount = matches.length;
      const coverage = sourceCount / Math.max(1, retainedEvidenceUnits.length);
      const confidence = Math.min(0.96, 0.68 + Math.min(0.18, coverage * 0.30) + Math.min(0.10, matchCount / 70));

      return {
        cluster: rule.name,
        matchCount,
        sourceCount,
        confidence: Number(confidence.toFixed(2)),
        evidence: matches.slice(0, 8)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchCount - a.matchCount);

  const datedEvidenceCount = retainedEvidenceUnits.filter(source =>
    !!getDate(source)
  ).length;

  const primaryWebsiteHost = (() => {
    try {
      return new URL(universalPackage?.primarySource || "").hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return "";
    }
  })();
  const sourceDomainOf = source => {
    try {
      return new URL(getUrl(source) || "").hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return "";
    }
  };
  const distinctSourceDomains = new Set(retainedEvidenceUnits.map(sourceDomainOf).filter(Boolean));
  const distinctNonPrimaryDomains = new Set(
    [...distinctSourceDomains].filter(domain => primaryWebsiteHost && domain !== primaryWebsiteHost && !domain.endsWith(`.${primaryWebsiteHost}`))
  );
  const reviewedWebsiteCategories = new Set(websiteSources.flatMap(source =>
    Array.isArray(source.pageCategories) && source.pageCategories.length
      ? source.pageCategories
      : [source.pageCategory || "general_company_information"]
  ));
  const datedEvidenceRatio = retainedEvidenceUnits.length
    ? datedEvidenceCount / retainedEvidenceUnits.length
    : 0;

  // This is a coverage diagnostic only, not the final Loop 7 report score.
  // Same-domain pages add topical coverage, not independent corroboration.
  const observedEvidenceScore = Math.min(100, Math.round(
    Math.min(25, reviewedWebsiteCategories.size * 2.5) +
    Math.min(25, distinctNonPrimaryDomains.size * 6) +
    Math.min(20, datedEvidenceRatio * 20) +
    Math.min(15, Math.min(5, retainedEvidenceUnits.length) * 3) +
    Math.min(15, Math.min(5, behavioralClusters.length) * 3)
  ));

  const interpretationConfidence = Number(
    Math.min(0.92, Math.max(0.45,
      behavioralClusters.length
        ? behavioralClusters.reduce((sum, item) => sum + item.confidence, 0) / behavioralClusters.length
        : 0.45
    )).toFixed(2)
  );

  const evidenceConfidence = {
    score: observedEvidenceScore,
    label: observedEvidenceScore >= 80 ? "high" : observedEvidenceScore >= 55 ? "medium" : "low",
    observedFactsConfidence: Number((observedEvidenceScore / 100).toFixed(2)),
    behavioralInterpretationConfidence: interpretationConfidence,
    basis: [
      "website investigation-category coverage",
      "distinct non-primary source domains (not automatic proof of independence)",
      "dated evidence proportion",
      "retained evidence-stream breadth",
      "signal-family coverage"
    ],
    diagnosticOnly: true,
    distinctSourceDomains: distinctSourceDomains.size,
    distinctNonPrimaryDomains: distinctNonPrimaryDomains.size,
    reviewedWebsiteCategories: [...reviewedWebsiteCategories],
    datedEvidenceCount,
    totalRetainedEvidenceUnits: retainedEvidenceUnits.length,
    datedEvidenceRatio: Number(datedEvidenceRatio.toFixed(3)),
    independenceMustBeAssessedFromSourceOwnership: true
  };

  console.log(
    "ECB_SIGNAL_REDUCTION_AUDIT",
    JSON.stringify(
      {
        rawSignalKeys: Object.keys(rawSignals || {}),
        reducedSignalKeys: Object.keys(signalMaster || {}),
        rawSignalsChars: JSON.stringify(rawSignals || {}).length,
        reducedSignalsChars: JSON.stringify(signalMaster || {}).length,
        rawDeepSignalFamilyCount:
          rawSignals?.deepSignalFamilies && typeof rawSignals.deepSignalFamilies === "object"
            ? Object.keys(rawSignals.deepSignalFamilies).length
            : 0,
        reducedDeepSignalFamilyCount:
          signalMaster?.deepSignalFamilies && typeof signalMaster.deepSignalFamilies === "object"
            ? Object.keys(signalMaster.deepSignalFamilies).length
            : 0,
        deepSignalCount: rawSignals?.deepSignalCount ?? null,
        deepSignalFamilyCount: rawSignals?.deepSignalFamilyCount ?? null
      },
      null,
      2
    )
  );

  /* -------------------------------------------------------
     SOURCE REGISTRY — canonical identity/traceability
  ------------------------------------------------------- */

  const sourceRegistry = [];

  for (const source of [...websiteSources, ...websiteScraperSources]) {
    sourceRegistry.push({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      evidenceStream: source.evidenceStream || (source.sourceType === "website_scraper" ? "ceb_website_scraper" : "pcf_website"),
      title: source.title || "Website source",
      url: source.url,
      date: source.date || null,
      pageCategory: source.pageCategory || null,
      pageCategories: Array.isArray(source.pageCategories) ? source.pageCategories : [],
      investigationSections: Array.isArray(source.investigationSections) ? source.investigationSections : [],
      selectionScore: source.selectionScore ?? null,
      selectionReason: source.selectionReason || null,
      collectionPurpose: source.collectionPurpose || null,
      topicKey: source.topicKey || null,
      topicLabel: source.topicLabel || null,
      topicRelevanceScore: source.topicRelevanceScore ?? null,
      topicEvidenceStatus: source.topicEvidenceStatus || null,
      topicEvidenceSignals: Array.isArray(source.topicEvidenceSignals) ? source.topicEvidenceSignals.slice(0, 8) : [],
      sourceDomain: source.sourceDomain || null,
      sourceIndependence: source.sourceIndependence || null
    });
  }

  if (profile) {
    sourceRegistry.push({
      sourceId: profile.sourceId,
      sourceType: profile.sourceType,
      title: profile.name || "LinkedIn Profile",
      url: profile.profileUrl,
      date: null
    });
  }

  for (const post of linkedinPosts) {
    sourceRegistry.push({
      sourceId: post.sourceId,
      sourceType: post.sourceType,
      title: post.title || "LinkedIn Post",
      url: post.url,
      date: post.date || null
    });
  }

  for (const article of linkedinArticles) {
    sourceRegistry.push({
      sourceId: article.sourceId,
      sourceType: article.sourceType,
      title: article.title || "LinkedIn Article",
      url: article.url,
      date: article.date || null
    });
  }

  if (githubEvidence) {
    sourceRegistry.push({
      sourceId: githubEvidence.sourceId,
      sourceType: "github",
      title: githubEvidence.title || githubEvidence.name || "GitHub",
      url: githubEvidence.url,
      date: githubEvidence.date || null
    });
  }

  for (const socialProfile of [xProfile, redditProfile].filter(Boolean)) {
    sourceRegistry.push({ sourceId: socialProfile.sourceId, sourceType: socialProfile.sourceType, title: socialProfile.name || `${socialProfile.platform} profile`, url: socialProfile.profileUrl, date: null });
  }
  for (const socialPost of [...xPosts, ...redditPosts]) {
    sourceRegistry.push({ sourceId: socialPost.sourceId, sourceType: socialPost.sourceType, title: socialPost.title || `${socialPost.platform} post`, url: socialPost.url, date: socialPost.date || null });
  }

  const sourceLinks = [
    ...new Set(
      sourceRegistry
        .map(source => source.url)
        .filter(Boolean)
    )
  ];

  /* -------------------------------------------------------
     4 + 5. BUILD LOOP7 PACKAGE

     Keep both the historical nested sourceRegistry and a top-level
     sourceRegistry because chat.js reads loop7Package.sourceRegistry.
     This is additive compatibility; no existing field is renamed.
  ------------------------------------------------------- */

  const buildLoop7Package = () => ({
    packageType: "Loop7EvidencePackage",
    version: PACKAGE_VERSION,

    profileLink:
      normalizeUrl(
        universalPackage?.primarySource ||
        universalPackage?.profileLink ||
        profile?.profileUrl ||
        linkedinSource?.sourceUrl ||
        ""
      ) || null,

    sourceRegistry,

    evidenceUniverse: {
      sourceLinks,
      sourceRegistry,

      websiteSources,
      websiteScraperSources,
      websiteTopicCollectionStatus,

      linkedinProfile: profile,

      linkedinPosts,

      linkedinArticles,

      githubEvidence,
      xProfile,
      xPosts,
      redditProfile,
      redditPosts,

      signalMaster,
      behavioralClusters,
      evidenceConfidence,
      crossEvidenceIntelligence:
        universalPackage?.crossEvidenceIntelligence || null
    },

    behavioralClusters,
    evidenceConfidence,
    crossEvidenceIntelligence:
      universalPackage?.crossEvidenceIntelligence || null,

    evidenceCoverage: {
      websiteSourcesRetained: websiteSources.length,
      pcfWebsiteSourcesRetained: websiteSources.length,
      pcfWebsitePagesAvailable: websitePageSelection.available,
      pcfWebsitePagesOmitted: websitePageSelection.omitted,
      pcfWebsitePageCategoryCounts: websitePageSelection.categoryCounts,
      websiteScraperSourcesRetained: websiteScraperSources.length,
      cebWebsiteScraperSourcesRetained: websiteScraperSources.length,
      linkedinProfileRetained: profile ? 1 : 0,
      linkedinPostsRetained: linkedinPosts.length,
      linkedinArticlesRetained: linkedinArticles.length,
      githubSourcesRetained: githubEvidence ? 1 : 0,
      xProfileRetained: xProfile ? 1 : 0,
      xPostsRetained: xPosts.length,
      redditProfileRetained: redditProfile ? 1 : 0,
      redditPostsRetained: redditPosts.length,
      additionalEvidenceItemsRetained: (githubEvidence ? 1 : 0) + (xProfile ? 1 : 0) + xPosts.length + (redditProfile ? 1 : 0) + redditPosts.length,
      linkedInPostLimitApplied: MAX_LINKEDIN_POSTS,
      xPostLimitApplied: MAX_X_POSTS,
      redditPostLimitApplied: MAX_REDDIT_POSTS,
      urlsRetained: sourceLinks.length,
      evidenceSourcesRetained: sourceRegistry.length
    }
  });

  let finalPackage = buildLoop7Package();

  /* -------------------------------------------------------
     6. BUDGET CHECK

     The package is constructed with explicit section budgets instead
     of compressing a huge object recursively. If a package is still
     over budget, reduce complete evidence sentences in stages.
     Never replace evidence with arbitrary tiny fragments and never
     return null merely because the first reduction pass missed budget.
  ------------------------------------------------------- */

  const packageSize = pkg => JSON.stringify(pkg).length;

  const rebuildAtBudget = (contentBudget, profileBudget, signalBudget) => {
    const budgetFor = key => {
      if (contentBudget && typeof contentBudget === "object") {
        const value = Number(contentBudget[key]);
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1200;
      }
      const value = Number(contentBudget);
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1200;
    };
    /*
     * Final ECB output stays evidence-first:
     * sourceRegistry remains the canonical locator layer.
     * Loop 7 chat.js rehydrates evidence content from the upstream
     * Universal Package using these canonical URLs.
     *
     * Therefore the ECB transport package carries source-backed evidence,
     * canonical metadata, and (when available) optional signal intelligence.
     */
    const compactSourceRegistry = sourceRegistry.map(source => ({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      evidenceStream: source.evidenceStream || (source.sourceType === "website_scraper" ? "ceb_website_scraper" : "pcf_website"),
      title: firstText(source.title).slice(0, 44) || null,
      url: source.url || null,
      date: source.date || null,
      pageCategory: source.pageCategory || null,
      pageCategories: Array.isArray(source.pageCategories) ? source.pageCategories : [],
      investigationSections: Array.isArray(source.investigationSections) ? source.investigationSections : [],
      selectionScore: source.selectionScore ?? null,
      selectionReason: source.selectionReason || null,
      collectionPurpose: source.collectionPurpose || null,
      topicKey: source.topicKey || null,
      topicLabel: source.topicLabel || null,
      topicRelevanceScore: source.topicRelevanceScore ?? null,
      topicEvidenceStatus: source.topicEvidenceStatus || null,
      topicEvidenceSignals: Array.isArray(source.topicEvidenceSignals) ? source.topicEvidenceSignals.slice(0, 8) : [],
      sourceDomain: source.sourceDomain || null,
      sourceIndependence: source.sourceIndependence || null
    }));

    const website = websiteSources.map((source, index) => {
      const originalContent = String(source.content || "");
      const pageKey = source.sourceId || getUrl(source) || `website-page-${index}`;
      const pageBudget = websitePageBudgets.budgets.get(pageKey) ?? originalContent.length;
      const selectedContent = pageBudget >= originalContent.length
        ? originalContent
        : compressWebsitePageToBudget(originalContent, pageBudget);
      return {
        sourceId: source.sourceId,
        sourceType: source.sourceType,
        url: getUrl(source),
        title: firstText(source.title, source.headline).slice(0, 220) || null,
        date: getDate(source),
        content: selectedContent,
        originalContentChars: originalContent.length,
        selectedContentChars: selectedContent.length,
        contentCompressionApplied: selectedContent.length < originalContent.length,
        evidenceStream: source.evidenceStream || "pcf_website",
        pageCategory: source.pageCategory || null,
        pageCategories: Array.isArray(source.pageCategories) ? source.pageCategories : [],
        investigationSections: Array.isArray(source.investigationSections) ? source.investigationSections : [],
        selectionScore: source.selectionScore ?? null,
        selectionReason: source.selectionReason || null,
        collectionPurpose: source.collectionPurpose || null,
        topicKey: source.topicKey || null,
        topicLabel: source.topicLabel || null,
        topicRelevanceScore: source.topicRelevanceScore ?? null,
        topicEvidenceStatus: source.topicEvidenceStatus || null,
        topicEvidenceSignals: Array.isArray(source.topicEvidenceSignals) ? source.topicEvidenceSignals.slice(0, 8) : [],
        sourceDomain: source.sourceDomain || null,
        sourceIndependence: source.sourceIndependence || null,
        metadata: source.metadata ?? null,
        structuredData: source.structuredData ?? null
      };
    });

const websiteScraper = websiteScraperSources.map(source => ({
  sourceId: source.sourceId,
  sourceType: source.sourceType,
  evidenceStream: source.evidenceStream || "ceb_website_scraper",
  url: getUrl(source),
  title: firstText(source.title, source.headline).slice(0, 220) || null,
  date: getDate(source),
  pageCategory: source.pageCategory || null,
  collectionPurpose: source.collectionPurpose || "general_website",
  topicKey: source.topicKey || null,
  topicLabel: source.topicLabel || null,
  topicRelevanceScore: Number.isFinite(Number(source.topicRelevanceScore)) ? Number(source.topicRelevanceScore) : null,
  topicEvidenceStatus: source.topicEvidenceStatus || null,
  topicEvidenceSignals: Array.isArray(source.topicEvidenceSignals) ? source.topicEvidenceSignals.slice(0, 8) : [],
  sourceDomain: source.sourceDomain || null,
  sourceIndependence: source.sourceIndependence || null,
  content: meaningfulText(
    extractEvidenceText(source, budgetFor("cebWebsiteScraper"), 60),
    budgetFor("cebWebsiteScraper"),
    60
  ),
  metadata: source.metadata ?? null,
  structuredData: source.structuredData ?? null
}));

const linkedinProfile = profile
  ? {
      sourceId: profile.sourceId,
      sourceType: profile.sourceType,
      profileUrl: profile.profileUrl,
      name: firstText(profile.name).slice(0, 120) || null,
      headline: meaningfulText(
        profile.headline,
        Math.min(500, profileBudget),
        4
      ),
      about: meaningfulText(
        profile.about,
        Math.min(1500, profileBudget),
        8
      ),
      location: firstText(profile.location).slice(0, 80) || null,
      currentCompany: firstText(profile.currentCompany).slice(0, 100) || null
    }
  : null;

const posts = linkedinPosts.map(post => ({
  sourceId: post.sourceId,
  sourceType: post.sourceType,
  url: getUrl(post),
  date: getDate(post),
  title: firstText(post.title, post.headline).slice(0, 100) || null,
  content: meaningfulText(
    extractEvidenceText(post, budgetFor("linkedinPosts"), 60),
    budgetFor("linkedinPosts"),
    60
  )
}));

const articles = linkedinArticles.map(article => ({
  sourceId: article.sourceId,
  sourceType: article.sourceType,
  url: getUrl(article),
  date: getDate(article),
  title: firstText(article.title, article.headline).slice(0, 100) || null,
  content: meaningfulText(
    extractEvidenceText(article, budgetFor("linkedinArticles"), 60),
    budgetFor("linkedinArticles"),
    60
  )
}));

const github = githubEvidence
  ? {
      sourceId: githubEvidence.sourceId,
      sourceType: githubEvidence.sourceType,
      name: firstText(githubEvidence.name, githubEvidence.title).slice(0, 120) || null,
      title: firstText(githubEvidence.title, githubEvidence.name).slice(0, 160) || null,
      url: getUrl(githubEvidence),
      date: getDate(githubEvidence),
      description: meaningfulText(
        firstText(githubEvidence.description, githubEvidence.content),
        Math.min(1000, profileBudget),
        6
      ),
      content: meaningfulText(
        extractEvidenceText(githubEvidence, budgetFor("github"), 60),
        budgetFor("github"),
        60
      )
    }
  : null;

const buildSocialProfileCompact = (source, platform) => source ? ({
  sourceId: source.sourceId,
  sourceType: source.sourceType || `${platform}_profile`,
  platform,
  name: firstText(source.name, source.username).slice(0, 150) || null,
  headline: meaningfulText(source.headline, Math.min(500, profileBudget), 4),
  about: meaningfulText(source.about, Math.min(900, profileBudget), 6),
  profileUrl: getUrl(source.profile || source) || getUrl(source),
  url: getUrl(source.profile || source) || getUrl(source)
}) : null;

const xProfileCompact = buildSocialProfileCompact(xProfile, "x");
const redditProfileCompact = buildSocialProfileCompact(redditProfile, "reddit");

const buildSocialPostCompact = (posts, platform, limit) =>
  (Array.isArray(posts) ? posts : []).slice(0, limit).map(post => ({
    sourceId: post.sourceId,
    sourceType: post.sourceType || `${platform}_post`,
    platform,
    id: getId(post),
    url: getUrl(post),
    date: getDate(post),
    title: firstText(post.title, post.headline, post.text).slice(0, 180) || null,
    content: meaningfulText(
      extractEvidenceText(post, budgetFor(platform === "x" ? "xPosts" : "redditPosts"), 50),
      budgetFor(platform === "x" ? "xPosts" : "redditPosts"),
      50
    )
  })).filter(post => post.url || post.content);

const xPostsCompact = buildSocialPostCompact(xPosts, "x", MAX_X_POSTS);
const redditPostsCompact = buildSocialPostCompact(redditPosts, "reddit", MAX_REDDIT_POSTS);

    const signals = {};
    const preserveCompactArrayKeys = new Set([
      "behavioralSignals",
      "contradictions",
      "crossSourceSignals"
    ]);

    for (const [key, value] of Object.entries(signalMaster || {})) {
      if (key === "deepSignalFamilies") {
        signals.deepSignalFamilies = value;
        continue;
      }

      if (key === "identity" && value && typeof value === "object") {
        signals.identity = {};
        for (const [name, identityValue] of Object.entries(value)) {
          const text = meaningfulText(identityValue, signalBudget, 1);
          if (text) signals.identity[name] = text;
        }
        continue;
      }

      if (key === "deepSignalCount" || key === "deepSignalFamilyCount" || key === "signalConfidence") {
        signals[key] = value;
        continue;
      }

      if (Array.isArray(value)) {
        if (!preserveCompactArrayKeys.has(key)) {
          signals[key] = [];
          continue;
        }

        signals[key] = value
          .map(item => {
            const text = signalText(item);
            return text
              ? { signal: meaningfulText(text, signalBudget, 1) }
              : null;
          })
          .filter(Boolean)
          .slice(0, 1);
        continue;
      }

      signals[key] = value;
    }

    const compactSourceLinks = [...new Set(compactSourceRegistry.map(source => source.url).filter(Boolean))];

    const pkg = {
      packageType: "Loop7EvidencePackage",
      version: PACKAGE_VERSION,
      profileLink:
        normalizeUrl(
          universalPackage?.primarySource ||
          universalPackage?.profileLink ||
          profile?.profileUrl ||
          linkedinSource?.sourceUrl ||
          ""
        ) || null,
      sourceRegistry: compactSourceRegistry,
      sourceLinks: compactSourceLinks,
      evidenceUniverse: {
  sourceLinks: compactSourceLinks,
  sourceRegistry: compactSourceRegistry,

  websiteSources: website,
  websiteScraperSources: websiteScraper,
  websiteTopicCollectionStatus,
  linkedinProfile,
  linkedinPosts: posts,
  linkedinArticles: articles,
  githubEvidence: github,
  xProfile: xProfileCompact,
  xPosts: xPostsCompact,
  redditProfile: redditProfileCompact,
  redditPosts: redditPostsCompact,

  signalMaster: signals,
  behavioralClusters,
  evidenceConfidence,
  crossEvidenceIntelligence:
    universalPackage?.crossEvidenceIntelligence || null
      },
      behavioralClusters,
      evidenceConfidence,
      crossEvidenceIntelligence:
        universalPackage?.crossEvidenceIntelligence || null,
      evidenceCoverage: {
        websiteSourcesRetained: website.length,
        pcfWebsiteSourcesRetained: website.length,
        pcfWebsitePagesAvailable: websitePageSelection.available,
        pcfWebsitePagesOmitted: websitePageSelection.omitted,
        pcfWebsitePageCategoryCounts: websitePageSelection.categoryCounts,
        websiteScraperSourcesRetained: websiteScraper.length,
        cebWebsiteScraperSourcesRetained: websiteScraper.length,
        linkedinProfileRetained: linkedinProfile ? 1 : 0,
        linkedinPostsRetained: posts.length,
        linkedinArticlesRetained: articles.length,
        githubSourcesRetained: github ? 1 : 0,
        xProfileRetained: xProfileCompact ? 1 : 0, xPostsRetained: xPostsCompact.length,
        redditProfileRetained: redditProfileCompact ? 1 : 0, redditPostsRetained: redditPostsCompact.length,
        additionalEvidenceItemsRetained: (github ? 1 : 0) + (xProfileCompact ? 1 : 0) + xPostsCompact.length + (redditProfileCompact ? 1 : 0) + redditPostsCompact.length,
        linkedInPostLimitApplied: MAX_LINKEDIN_POSTS,
        xPostLimitApplied: MAX_X_POSTS,
        redditPostLimitApplied: MAX_REDDIT_POSTS,
        urlsRetained: compactSourceLinks.length,
        evidenceSourcesRetained: sourceRegistry.length
      }
    };

    return pkg;
  };

  let finalSize = packageSize(finalPackage);
  const preCompressionPackageSize = finalSize;

  /*
   * v28 budget contract:
   * - Keep all selected PCF page text unchanged when the combined website
   *   content is <= 300,000 characters.
   * - If that combined website content exceeds the budget, compress selected
   *   page text proportionally using complete evidence sentences.
   * - Non-PCF evidence streams share their existing additional 100,000-char cap.
   * - The complete serialized Loop 7 package must remain <= 1,600,000 chars.
   */
  const evidenceFamilies = {
    cebWebsiteScraper: websiteScraperSources,
    linkedinPosts,
    linkedinArticles,
    github: githubEvidence ? [githubEvidence] : [],
    xPosts
  };
  const familyTextChars = Object.fromEntries(Object.entries(evidenceFamilies).map(([key, items]) => [
    key,
    items.reduce((sum, item) => sum + rawEvidenceText(item).length, 0)
  ]));
  const profileAndGithubDescriptionChars =
    String(profile?.headline || "").length + String(profile?.about || "").length +
    String(xProfile?.headline || "").length + String(xProfile?.about || "").length +
    String(githubEvidence?.description || "").length;
  const totalAdditionalEvidenceTextChars =
    Object.values(familyTextChars).reduce((sum, count) => sum + count, 0) + profileAndGithubDescriptionChars;

  const makeAdditionalFamilyBudgets = scale => Object.fromEntries(Object.entries(evidenceFamilies).map(([key, items]) => {
    const totalChars = familyTextChars[key] || 0;
    if (!items.length || !totalChars) return [key, 1];
    const familyBudget = Math.floor(totalChars * scale);
    return [key, Math.max(1, Math.floor(familyBudget / items.length))];
  }));

  const dynamicTargetChars = MAX_TOTAL_PACKAGE_CHARS;
  const websitePageBudgets = allocateWebsitePageBudgets(websiteSources, MAX_PCF_WEBSITE_CONTENT_CHARS);
  const pcfWebsiteOriginalChars = websitePageBudgets.originalChars;
  const websiteContentScale = pcfWebsiteOriginalChars > 0
    ? websitePageBudgets.allocatedChars / pcfWebsiteOriginalChars
    : 1;
  const additionalBudgetScale = totalAdditionalEvidenceTextChars > 0
    ? Math.min(1, MAX_ADDITIONAL_PLATFORM_CONTENT_CHARS / totalAdditionalEvidenceTextChars)
    : 1;
  const needsAdditionalBudgeting = totalAdditionalEvidenceTextChars > MAX_ADDITIONAL_PLATFORM_CONTENT_CHARS;

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS || needsAdditionalBudgeting || websiteContentScale < 0.999) {
    let scale = additionalBudgetScale;
    finalPackage = rebuildAtBudget(makeAdditionalFamilyBudgets(scale), Math.max(1, Math.floor(2200 * scale)), 0);
    finalSize = packageSize(finalPackage);

    // If package metadata/registries push the serialized package over 1.6M,
    // reduce only the non-PCF evidence families. The selected PCF page budgets
    // remain fixed so source content is not repeatedly re-compressed.
    for (let attempt = 0; finalSize > MAX_TOTAL_PACKAGE_CHARS && attempt < 8; attempt += 1) {
      scale *= 0.72;
      finalPackage = rebuildAtBudget(makeAdditionalFamilyBudgets(scale), Math.max(1, Math.floor(1500 * scale)), 0);
      finalSize = packageSize(finalPackage);
    }
  }

  /* Remove duplicate sourceLinks only when they are the cause of an overage. */
  if (finalSize > dynamicTargetChars) {
    const copy = JSON.parse(JSON.stringify(finalPackage));
    copy.sourceLinks = undefined;
    if (copy.evidenceUniverse) copy.evidenceUniverse.sourceLinks = [];
    finalPackage = copy;
    finalSize = packageSize(finalPackage);
  }

  /* Remove only the nested duplicate registry; keep the canonical top-level registry. */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    const copy = JSON.parse(JSON.stringify(finalPackage));
    if (copy?.evidenceUniverse) copy.evidenceUniverse.sourceRegistry = undefined;
    finalPackage = copy;
    finalSize = packageSize(finalPackage);
  }

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    // Last evidence-preserving reduction: selected PCF website content remains intact.
    finalPackage = rebuildAtBudget(makeAdditionalFamilyBudgets(0.0001), 1, 0);
    finalPackage.sourceLinks = undefined;
    if (finalPackage.evidenceUniverse) {
      finalPackage.evidenceUniverse.sourceLinks = [];
      finalPackage.evidenceUniverse.sourceRegistry = undefined;
    }
    finalSize = packageSize(finalPackage);
  }

  const finalEvidenceUniverse = finalPackage?.evidenceUniverse || {};
  const finalPcfWebsiteSelectedChars =
    (Array.isArray(finalEvidenceUniverse.websiteSources) ? finalEvidenceUniverse.websiteSources : [])
      .reduce((sum, item) => sum + String(item.content || "").length, 0);
  const additionalPlatformContentChars =
    (Array.isArray(finalEvidenceUniverse.websiteScraperSources) ? finalEvidenceUniverse.websiteScraperSources : []).reduce((sum, item) => sum + String(item.content || "").length, 0) +
    (Array.isArray(finalEvidenceUniverse.linkedinPosts) ? finalEvidenceUniverse.linkedinPosts : []).reduce((sum, item) => sum + String(item.content || "").length, 0) +
    (Array.isArray(finalEvidenceUniverse.linkedinArticles) ? finalEvidenceUniverse.linkedinArticles : []).reduce((sum, item) => sum + String(item.content || "").length, 0) +
    String(finalEvidenceUniverse.githubEvidence?.description || "").length +
    String(finalEvidenceUniverse.githubEvidence?.content || "").length +
    (Array.isArray(finalEvidenceUniverse.xPosts) ? finalEvidenceUniverse.xPosts : []).reduce((sum, item) => sum + String(item.content || "").length, 0) +
    String(finalEvidenceUniverse.linkedinProfile?.headline || "").length +
    String(finalEvidenceUniverse.linkedinProfile?.about || "").length +
    String(finalEvidenceUniverse.xProfile?.headline || "").length +
    String(finalEvidenceUniverse.xProfile?.about || "").length;

if (finalSize > ECB_TRANSPORT_LIMIT || additionalPlatformContentChars > MAX_ADDITIONAL_PLATFORM_CONTENT_CHARS) {
    /*
     * Fail closed only as a genuinely impossible structural case,
     * after all meaningful evidence-preserving reductions. This is
     * intentionally NOT the old destructive compression behavior.
     */
    console.error(
      "ECB_MEANINGFUL_BUDGET_EXCEEDED",
      JSON.stringify({
        finalSize,
        maxAllowed: ECB_TRANSPORT_LIMIT,
        additionalPlatformContentChars,
        maxAdditionalPlatformContentChars: MAX_ADDITIONAL_PLATFORM_CONTENT_CHARS,
        destructiveCharacterCompaction: false
      })
    );

    return {
      success: false,
      reason:
        `ECB package exceeds the 1.6M total-package or 100K additional-platform evidence budget after evidence-preserving reduction.`,
      loop7Package: null,
      compressionStats: {
        originalChars: originalUniversalSize,
        attemptedChars: finalSize,
        maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
        destructiveCompression: false
      }
    };
  }

  console.log(
    "ECB_FINAL_EXPORT_AUDIT",
    JSON.stringify(
      {
        finalSize,
        sourceRegistryCount: finalPackage?.sourceRegistry?.length || 0,
        sourceStreamCounts: {
          pcfWebsite: finalPackage?.evidenceUniverse?.websiteSources?.length || 0,
          cebWebsiteScraper: finalPackage?.evidenceUniverse?.websiteScraperSources?.length || 0,
          githubPCF: finalPackage?.evidenceUniverse?.githubEvidence ? 1 : 0,
          linkedinProfile: finalPackage?.evidenceUniverse?.linkedinProfile ? 1 : 0,
          linkedinPosts: finalPackage?.evidenceUniverse?.linkedinPosts?.length || 0,
          linkedinArticles: finalPackage?.evidenceUniverse?.linkedinArticles?.length || 0,
          xProfile: finalPackage?.evidenceUniverse?.xProfile ? 1 : 0,
          xPosts: finalPackage?.evidenceUniverse?.xPosts?.length || 0,
          reddit: 0
        },
        websiteScraperSources: Array.isArray(finalPackage?.evidenceUniverse?.websiteScraperSources)
          ? finalPackage.evidenceUniverse.websiteScraperSources.map(source => ({
              sourceId: source.sourceId,
              title: source.title,
              pageCategory: source.pageCategory || null,
              chars: String(source.content || "").length,
              url: source.url || null
            }))
          : [],
        websiteSources: Array.isArray(finalPackage?.evidenceUniverse?.websiteSources)
          ? finalPackage.evidenceUniverse.websiteSources.map(source => ({
              sourceId: source.sourceId,
              title: source.title,
              chars: String(source.content || "").length,
              content: String(source.content || "").slice(0, 300),
              url: source.url || null
            }))
          : [],
        linkedinProfile: finalPackage?.evidenceUniverse?.linkedinProfile
          ? {
              sourceId: finalPackage.evidenceUniverse.linkedinProfile.sourceId,
              headlineChars: String(finalPackage.evidenceUniverse.linkedinProfile.headline || "").length,
              aboutChars: String(finalPackage.evidenceUniverse.linkedinProfile.about || "").length,
              aboutPreview: String(finalPackage.evidenceUniverse.linkedinProfile.about || "").slice(0, 300)
            }
          : null,
        linkedinPosts: Array.isArray(finalPackage?.evidenceUniverse?.linkedinPosts)
          ? finalPackage.evidenceUniverse.linkedinPosts.map(post => ({
              sourceId: post.sourceId,
              title: post.title,
              chars: String(post.content || "").length,
              content: String(post.content || "").slice(0, 300),
              url: post.url || null
            }))
          : [],
        linkedinArticles: Array.isArray(finalPackage?.evidenceUniverse?.linkedinArticles)
          ? finalPackage.evidenceUniverse.linkedinArticles.map(article => ({
              sourceId: article.sourceId,
              title: article.title,
              chars: String(article.content || "").length,
              content: String(article.content || "").slice(0, 300),
              url: article.url || null
            }))
          : [],
        xProfile: finalPackage?.evidenceUniverse?.xProfile || null,
        xPosts: finalPackage?.evidenceUniverse?.xPosts?.length || 0,
        redditProfile: finalPackage?.evidenceUniverse?.redditProfile || null,
        redditPosts: finalPackage?.evidenceUniverse?.redditPosts?.length || 0,
        githubEvidence: finalPackage?.evidenceUniverse?.githubEvidence
          ? {
              sourceId: finalPackage.evidenceUniverse.githubEvidence.sourceId,
              title: finalPackage.evidenceUniverse.githubEvidence.title,
              descriptionChars: String(finalPackage.evidenceUniverse.githubEvidence.description || "").length,
              contentChars: String(finalPackage.evidenceUniverse.githubEvidence.content || "").length,
              descriptionPreview: String(finalPackage.evidenceUniverse.githubEvidence.description || "").slice(0, 300),
              contentPreview: String(finalPackage.evidenceUniverse.githubEvidence.content || "").slice(0, 300),
              url: finalPackage.evidenceUniverse.githubEvidence.url || null
            }
          : null,
        signalMaster: finalPackage?.evidenceUniverse?.signalMaster || null
      },
      null,
      2
    )
  );

  console.log(
    "ECB_FINAL_PACKAGE_SIZE",
    finalSize
  );

  console.log(
    "ECB_COMPRESSION_AUDIT",
    JSON.stringify({
      originalChars: originalUniversalSize,
      finalChars: finalSize,
      targetChars: dynamicTargetChars,
      compressionTriggered: preCompressionPackageSize > MAX_TOTAL_PACKAGE_CHARS || needsAdditionalBudgeting || websitePageBudgets.compressionRequired,
      hardCapExceededAfterCompression: finalSize > MAX_TOTAL_PACKAGE_CHARS,
      maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
      websiteSources: websiteSources.length,
      pcfWebsiteSources: websiteSources.length,
      websiteScraperSources: websiteScraperSources.length,
      cebWebsiteScraperSources: websiteScraperSources.length,
      sourceContentCharsByStream: {
        pcfWebsite: websiteSources.reduce((sum, source) => sum + String(source.content || "").length, 0),
        cebWebsiteScraper: websiteScraperSources.reduce((sum, source) => sum + String(source.content || "").length, 0),
        githubPCF: String(githubEvidence?.content || "").length,
        linkedinPosts: linkedinPosts.reduce((sum, source) => sum + String(source.content || "").length, 0),
        linkedinArticles: linkedinArticles.reduce((sum, source) => sum + String(source.content || "").length, 0),
        xPosts: xPosts.reduce((sum, source) => sum + String(source.content || "").length, 0)
      },
      linkedinPosts: linkedinPosts.length,
      linkedinArticles: linkedinArticles.length,
      profile: !!profile,
      githubSources: githubEvidence ? 1 : 0,
      xProfile: xProfile ? 1 : 0,
      xPosts: xPosts.length,
      redditProfile: redditProfile ? 1 : 0,
      redditPosts: redditPosts.length,
      urlsRetained: sourceRegistry.length,
      evidenceSourcesRetained: sourceRegistry.length,
      meaningfulCompression: finalSize < preCompressionPackageSize,
      hardCapOnlyCompression: true,
      websitePageCompressionApplied: websitePageBudgets.compressionRequired,
      destructiveCharacterCompaction: false,
      linksModified: false
    })
  );

  void truthLoopPackage;

  return {
    success: true,
    loop7Package: finalPackage,
    compressionStats: {
      originalChars: originalUniversalSize,
      compressedChars: finalSize,
      targetChars: dynamicTargetChars,
      maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
      maxPcfWebsiteContentChars: MAX_PCF_WEBSITE_CONTENT_CHARS,
      maxPcfWebsiteCharsPerSource: null,
      pcfWebsiteSourcesCapped: (Array.isArray(finalEvidenceUniverse.websiteSources) ? finalEvidenceUniverse.websiteSources : []).filter(item => item.contentCompressionApplied).length,
      maxAdditionalPlatformContentChars: MAX_ADDITIONAL_PLATFORM_CONTENT_CHARS,
      additionalPlatformContentChars,
      maxTotalPackageChars: MAX_TOTAL_PACKAGE_CHARS,
      pcfWebsiteOriginalChars,
      pcfWebsiteSelectedChars: finalPcfWebsiteSelectedChars,
      pcfWebsiteOmittedChars: Math.max(0, pcfWebsiteOriginalChars - finalPcfWebsiteSelectedChars),
      pcfWebsiteCapApplied: finalPcfWebsiteSelectedChars < pcfWebsiteOriginalChars,
      pcfWebsiteContentBudget: MAX_PCF_WEBSITE_CONTENT_CHARS,
      pcfWebsiteAllocatedChars: websitePageBudgets.allocatedChars,
      pcfWebsiteCompressionRequired: websitePageBudgets.compressionRequired,
      websitePageSelection: websitePageSelection.categoryCounts,
      compressionTriggered: preCompressionPackageSize > MAX_TOTAL_PACKAGE_CHARS || needsAdditionalBudgeting || websitePageBudgets.compressionRequired,
      hardCapExceededAfterCompression: finalSize > MAX_TOTAL_PACKAGE_CHARS,
      websiteSources: websiteSources.length,
      websiteScraperSources: websiteScraperSources.length,
      linkedInPosts: linkedinPosts.length,
      linkedInArticles: linkedinArticles.length,
      githubSources: githubEvidence ? 1 : 0,
      xProfile: xProfile ? 1 : 0,
      xPosts: xPosts.length,
      redditProfile: redditProfile ? 1 : 0,
      redditPosts: redditPosts.length,
      additionalEvidenceItems: (githubEvidence ? 1 : 0) + (xProfile ? 1 : 0) + xPosts.length + (redditProfile ? 1 : 0) + redditPosts.length,
      linkedinPostLimit: MAX_LINKEDIN_POSTS,
      xPostLimit: MAX_X_POSTS,
      redditPostLimit: MAX_REDDIT_POSTS,
      linkedinProfiles: profile ? 1 : 0,
      urlsRetained: sourceRegistry.length,
      evidenceSourcesRetained: sourceRegistry.length,
      meaningfulCompression: finalSize < preCompressionPackageSize,
      hardCapOnlyCompression: true,
      websitePageCompressionApplied: websitePageBudgets.compressionRequired,
      destructiveCharacterCompaction: false,
      linksModified: false
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
