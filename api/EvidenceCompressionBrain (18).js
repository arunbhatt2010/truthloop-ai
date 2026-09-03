/* =========================================================
   EVIDENCE COMPRESSION BRAIN v20 — CLEAN REBUILD
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

const MAX_TOTAL_PACKAGE_CHARS = 5000;
const ECB_OUTPUT_LIMIT = 5000;
const ECB_TRANSPORT_LIMIT = 15000;
const MAX_INPUT_PACKAGE_CHARS = 10000000;
const TARGET_PACKAGE_CHARS = 4500;

/*
 * Loop 7 transport boundary:
 * - retain the strongest 5 Website sources
 * - retain the strongest 5 LinkedIn posts
 * - LinkedIn article content may inform CEB signals, but is not
 *   transported in the final ECB source registry
 * - retain GitHub + LinkedIn profile
 *
 * CEB may collect more. ECB is the final evidence-selection stage.
 */
const MAX_WEBSITE_SOURCES = 5;
const MAX_LINKEDIN_POSTS = 4;
const MIN_LINKEDIN_POSTS = 1;
const MAX_LINKEDIN_ARTICLES = 1;

const PACKAGE_VERSION = "21.0";

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
    item?.url ||
    item?.sourceUrl ||
    item?.canonicalUrl ||
    item?.profileUrl ||
    item?.postUrl ||
    item?.articleUrl ||
    item?.link ||
    ""
  ) || null;

const getDate = item =>
  item?.publishedDate ||
  item?.publishedAt ||
  item?.datePublished ||
  item?.postedAt ||
  item?.updatedAt ||
  item?.date ||
  null;

const getId = item =>
  item?.id ??
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
   SOURCE EXTRACTION
--------------------------------------------------------- */

const extractEvidenceText = (source, maxChars = 700, maxSentences = 5) =>
  meaningfulText(
    firstText(
      source?.visibleText,
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
    content: extractEvidenceText(source, 850, 5)
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
   LOOP 7 INVESTIGATION LAYER — RAW UNIVERSAL EVIDENCE

   The investigation stage intentionally runs BEFORE any compression.
   It receives the complete UniversalPublicEvidencePackage exactly as
   supplied by the upstream evidence pipeline, plus the complete
   TruthLoop package. It does not call an AI/model.

   Output is a complete eight-section Loop 7 investigation report.
   The report target is 1400–1600 words. It also exposes estimated
   token demand for the downstream writer/renderer.
--------------------------------------------------------- */

const INVESTIGATION_STOP_WORDS = new Set([
  "about", "after", "again", "against", "being", "could", "would",
  "there", "their", "these", "those", "where", "which", "while",
  "with", "from", "have", "this", "that", "they", "them", "than",
  "into", "your", "you", "were", "what", "when", "will", "been",
  "more", "most", "some", "such", "over", "only", "also", "very",
  "through", "because", "between", "then", "here", "just", "like",
  "using", "used", "make", "made", "does", "done", "that", "this",
  "than", "from", "into", "over", "under", "about", "with", "without"
]);

const investigationTokens = value =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9%\s-]/gi, " ")
    .split(/\s+/)
    .filter(token => token.length >= 4 && !INVESTIGATION_STOP_WORDS.has(token));

const collectRawInvestigationText = (value, path = "root", out = [], depth = 0) => {
  if (depth > 8) return out;

  if (typeof value === "string") {
    const text = cleanText(value);
    if (text.length >= 20) out.push({ path, text });
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectRawInvestigationText(item, `${path}[${index}]`, out, depth + 1)
    );
    return out;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/^(url|sourceUrl|profileUrl|link|id|_id|urn)$/i.test(key)) continue;
      collectRawInvestigationText(child, `${path}.${key}`, out, depth + 1);
    }
  }

  return out;
};

const resolveRawInvestigationPackage = publicEvidencePackage => {
  if (
    publicEvidencePackage?.universalPackage &&
    typeof publicEvidencePackage.universalPackage === "object"
  ) {
    return publicEvidencePackage.universalPackage;
  }
  return publicEvidencePackage && typeof publicEvidencePackage === "object"
    ? publicEvidencePackage
    : {};
};

const collectRawInvestigationSources = universalPackage => {
  const sources = [];
  const add = (source, fallbackType) => {
    if (!source || typeof source !== "object") return;
    const content = extractEvidenceText(source, 1800, 12);
    const metadata = {
      sourceId: firstText(source.sourceId, source.id) || `EVIDENCE_${sources.length + 1}`,
      sourceType: firstText(source.sourceType, fallbackType) || fallbackType,
      title: firstText(source.title, source.name, source.headline) || "Untitled source",
      url: getUrl(source),
      date: getDate(source),
      content: content || ""
    };
    if (metadata.content || metadata.title !== "Untitled source") sources.push(metadata);
  };

  for (const source of Array.isArray(universalPackage?.websiteEvidence?.sources)
    ? universalPackage.websiteEvidence.sources
    : Array.isArray(universalPackage?.websiteSources)
      ? universalPackage.websiteSources
      : []) add(source, "website");

  const linkedinEvidence = universalPackage?.linkedinEvidence && typeof universalPackage.linkedinEvidence === "object"
    ? universalPackage.linkedinEvidence
    : {};
  const linkedinSource = linkedinEvidence?.source && typeof linkedinEvidence.source === "object"
    ? linkedinEvidence.source
    : {};

  add(
    linkedinEvidence?.profile || linkedinSource?.linkedinProfile,
    "linkedin_profile"
  );

  for (const source of Array.isArray(linkedinEvidence?.posts)
    ? linkedinEvidence.posts
    : Array.isArray(linkedinSource?.posts)
      ? linkedinSource.posts
      : Array.isArray(universalPackage?.linkedinPosts)
        ? universalPackage.linkedinPosts
        : []) add(source, "linkedin_post");

  for (const source of Array.isArray(linkedinEvidence?.articles)
    ? linkedinEvidence.articles
    : Array.isArray(linkedinSource?.articles)
      ? linkedinSource.articles
      : Array.isArray(universalPackage?.linkedinArticles)
        ? universalPackage.linkedinArticles
        : []) add(source, "linkedin_article");

  add(
    universalPackage?.githubEvidence || universalPackage?.github,
    "github"
  );

  if (!sources.length) {
    const generic = collectRawInvestigationText(universalPackage)
      .slice(0, 40)
      .map((entry, index) => ({
        sourceId: `RAW_${String(index + 1).padStart(2, "0")}`,
        sourceType: "unclassified",
        title: entry.path,
        url: null,
        date: null,
        content: entry.text
      }));
    sources.push(...generic);
  }

  return sources;
};

const collectRawSignalFamilies = universalPackage => {
  const signalMaster =
    universalPackage?.signalSignals && typeof universalPackage.signalSignals === "object"
      ? universalPackage.signalSignals
      : universalPackage?.geminiSignals && typeof universalPackage.geminiSignals === "object"
        ? universalPackage.geminiSignals
        : universalPackage?.signalMaster && typeof universalPackage.signalMaster === "object"
          ? universalPackage.signalMaster
          : {};

  const families = [];
  const deepFamilies =
    signalMaster?.deepSignalFamilies && typeof signalMaster.deepSignalFamilies === "object"
      ? signalMaster.deepSignalFamilies
      : {};

  for (const [family, membersValue] of Object.entries(deepFamilies)) {
    if (!Array.isArray(membersValue) || !membersValue.length) continue;
    const members = membersValue.map((item, index) => {
      const finding = firstText(
        item?.finding,
        item?.signal,
        item?.observation,
        item?.evidence,
        item?.basis
      );
      const basis = firstText(item?.basis, item?.rationale, item?.reason);
      const sourceUrls = Array.isArray(item?.supportingSourceUrls)
        ? item.supportingSourceUrls.filter(Boolean)
        : [];
      return {
        index,
        finding: cleanText(finding),
        basis: cleanText(basis),
        confidence: Number(item?.confidence),
        sourceUrls
      };
    }).filter(item => item.finding || item.basis);

    if (members.length) {
      families.push({
        family,
        memberCount: members.length,
        members
      });
    }
  }

  for (const [key, value] of Object.entries(signalMaster)) {
    if (key === "deepSignalFamilies" || key === "deepSignalCount" || key === "deepSignalFamilyCount" || key === "signalConfidence") continue;
    const raw = collectRawInvestigationText(value, `signalMaster.${key}`);
    if (!raw.length) continue;
    families.push({
      family: key,
      memberCount: raw.length,
      members: raw.map((entry, index) => ({
        index,
        finding: entry.text,
        basis: "",
        confidence: null,
        sourceUrls: []
      }))
    });
  }

  return families;
};

const collectRawExplicitContradictions = (universalPackage, truthLoopPackage) => {
  const signalMaster =
    universalPackage?.signalSignals && typeof universalPackage.signalSignals === "object"
      ? universalPackage.signalSignals
      : universalPackage?.geminiSignals && typeof universalPackage.geminiSignals === "object"
        ? universalPackage.geminiSignals
        : universalPackage?.signalMaster && typeof universalPackage.signalMaster === "object"
          ? universalPackage.signalMaster
          : {};

  const candidates = [
    ...(Array.isArray(signalMaster.contradictions) ? signalMaster.contradictions : []),
    ...(Array.isArray(signalMaster.crossSourceSignals) ? signalMaster.crossSourceSignals : []),
    ...(Array.isArray(truthLoopPackage?.contradictions) ? truthLoopPackage.contradictions : [])
  ];

  const output = [];
  for (const item of candidates) {
    const text = signalText(item) || cleanText(item);
    if (!text) continue;
    if (!output.some(existing => existing.toLowerCase() === text.toLowerCase())) {
      output.push(text);
    }
  }
  return output;
};

const rankRawRecurringTerms = (entries, limit = 12) => {
  const stats = new Map();

  for (const entry of entries) {
    const uniqueTerms = new Set(investigationTokens(entry.text));
    for (const term of uniqueTerms) {
      const current = stats.get(term) || {
        term,
        occurrences: 0,
        sources: new Set(),
        examples: []
      };
      current.occurrences += 1;
      if (entry.sourceId) current.sources.add(entry.sourceId);
      if (current.examples.length < 5) current.examples.push(entry.text);
      stats.set(term, current);
    }
  }

  return [...stats.values()]
    .filter(item => item.occurrences >= 2)
    .sort((a, b) =>
      b.sources.size - a.sources.size ||
      b.occurrences - a.occurrences ||
      a.term.localeCompare(b.term)
    )
    .slice(0, limit);
};

const investigationWordCount = text =>
  cleanText(text).split(/\s+/).filter(Boolean).length;

const investigationTokenEstimate = text =>
  Math.max(1, Math.ceil(cleanText(text).length / 4));

const clampInvestigationSections = (sections, min = 1400, max = 1600) => {
  const normalize = value => String(value || "").trim().replace(/\s+/g, " ");
  const out = sections.map(([title, body], index) => ({
    title,
    number: index + 1,
    content: normalize(body)
  }));

  const wordCount = items =>
    items.reduce((sum, item) => sum + investigationWordCount(item.title) + investigationWordCount(item.content), 0);

  let total = wordCount(out);
  if (total > max) {
    for (let i = out.length - 1; i >= 0 && total > max; i -= 1) {
      const words = out[i].content.split(/\s+/).filter(Boolean);
      const removable = Math.min(words.length - 90, total - max);
      if (removable > 0) {
        out[i].content = words.slice(0, words.length - removable).join(" ");
        total = wordCount(out);
      }
    }
  }

  return { sections: out, words: total, withinTarget: total >= min && total <= max };
};

const formatEvidenceList = (sources, limit = 6) =>
  sources.slice(0, limit).map(source =>
    `${source.sourceId}: ${source.content || source.title}`
  ).join(" ");

const formatSignalList = (families, limit = 8) =>
  families.slice(0, limit).map(family => {
    const strongest = family.members
      .filter(member => member.finding)
      .slice()
      .sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0))[0];
    return `${family.family}: ${strongest?.finding || family.family}`;
  }).join(" ");

const buildInvestigationReport = ({
  universalPackage = {},
  truthLoopPackage = {}
} = {}) => {
  const sources = collectRawInvestigationSources(universalPackage);
  const families = collectRawSignalFamilies(universalPackage);
  const contradictions = collectRawExplicitContradictions(universalPackage, truthLoopPackage);
  const truthLoopEntries = collectRawInvestigationText(truthLoopPackage, "truthLoopPackage");

  const sourceEntries = sources.map(source => ({ sourceId: source.sourceId, text: source.content || source.title }));
  const signalEntries = families.flatMap(family =>
    family.members.map((member, index) => ({
      sourceId: `SIGNAL_${family.family}_${index + 1}`,
      text: member.finding || member.basis
    })).filter(entry => entry.text)
  );
  const loopEntries = truthLoopEntries.map((entry, index) => ({
    sourceId: `LOOP_${String(index + 1).padStart(2, "0")}`,
    text: entry.text
  }));

  const allEntries = [...sourceEntries, ...signalEntries, ...loopEntries];
  const recurringTerms = rankRawRecurringTerms(allEntries, 14);
  const topThemes = recurringTerms.length
    ? recurringTerms.slice(0, 6).map(item => `${item.term} (${item.sources.size} records, ${item.occurrences} mentions)`).join(", ")
    : "No recurring lexical theme cleared the cross-record threshold";

  const strongestFamily = families
    .slice()
    .sort((a, b) => {
      const ac = Math.max(...a.members.map(member => Number(member.confidence) || 0), 0);
      const bc = Math.max(...b.members.map(member => Number(member.confidence) || 0), 0);
      return bc - ac || b.memberCount - a.memberCount;
    })[0];

  const evidenceCoverage = sources.length;
  const familyCoverage = families.length;
  const corroboratedThemes = recurringTerms.filter(item => item.sources.size >= 3).slice(0, 5);
  const confidenceScore = Math.min(
    100,
    Math.round(
      Math.min(45, evidenceCoverage * 3.5) +
      Math.min(30, corroboratedThemes.length * 6) +
      Math.min(15, familyCoverage * 1.5) +
      Math.min(10, truthLoopEntries.length > 0 ? 10 : 0)
    )
  );
  const confidenceLevel = confidenceScore >= 80 ? "high" : confidenceScore >= 60 ? "moderate" : "limited";

  const primaryTheme = recurringTerms[0]?.term || "the available evidence set";
  const secondaryTheme = recurringTerms[1]?.term || "the surrounding activity";
  const explicitContradictionText = contradictions.length
    ? contradictions.slice(0, 5).join(" ")
    : "No explicit contradiction was supplied by the evidence layer; thematic difference is not treated as contradiction.";

  const section1 = `The investigation reviews the complete public-evidence package together with the TruthLoop conversation package. Across ${evidenceCoverage} evidence records, ${familyCoverage} signal families, ${truthLoopEntries.length} TruthLoop text entries, and ${signalEntries.length} individual signal observations, the most persistent public themes are ${topThemes}. The strongest recurring theme is ${primaryTheme}, but recurrence alone is not treated as a diagnosis or a private motive. The investigation instead asks whether the same observable direction appears across independent surfaces and whether the conversation context gives that pattern operational meaning. The evidence is strongest where the same subject, activity, positioning, or behavior appears in more than one source type. The current record therefore supports a pattern-level finding around ${primaryTheme} with supporting context around ${secondaryTheme}. The important boundary is that public evidence can show repeated behavior, emphasis, sequencing, or positioning; it cannot by itself prove an internal psychological cause. The report should therefore distinguish what is directly observable from what is a cautious interpretation. The central finding is that the public record contains a recurring, cross-record pattern that is meaningful enough to investigate further, while the exact underlying cause remains bounded by the evidence available.`;

  const behaviorEvidence = formatEvidenceList(sources, 7);
  const section2 = `The behavioral picture is best understood as a set of repeated observable choices rather than as a personality judgment. The retained sources show how the subject presents work, what problems receive repeated attention, which themes persist over time, and where activity is concentrated. The recurring terms ${topThemes} help identify repeated emphasis, but the stronger signal comes from the overlap between source content and signal families. ${strongestFamily ? `The strongest available signal family is ${strongestFamily.family}, whose evidence includes ${strongestFamily.members.slice(0, 3).map(member => member.finding || member.basis).filter(Boolean).join("; ")}.` : "No single signal family clearly dominates the evidence."} Representative public evidence includes ${behaviorEvidence}. This supports describing a consistent behavioral pattern in the public record. It does not justify statements about hidden fear, dopamine, self-sabotage, or other private mechanisms unless the supplied evidence explicitly supports them. A stronger investigation therefore focuses on sequence and reinforcement: what the subject repeatedly says or builds, how those signals appear across platforms, and which parts remain stable even when the surrounding context changes. The useful conclusion is a public-behavior pattern, not a clinical interpretation.`;

  const mechanismLinks = recurringTerms.slice(0, 4).map(item => item.term).join(" → ") || `${primaryTheme} → ${secondaryTheme}`;
  const section3 = `The hidden-mechanism analysis begins with observable relationships in the evidence rather than assumptions about private psychology. The most defensible chain currently visible is ${mechanismLinks}. In practical terms, this means the record repeatedly connects the subject's public positioning, activity, or output with a second recurring theme. Where multiple sources reinforce the same sequence, that relationship becomes a reasonable candidate mechanism for explaining what the public pattern is doing. The mechanism should remain phrased as an evidence-based relationship: one observable pattern appears to reinforce, enable, frame, or accompany another. It should not be promoted into causation unless a direct source supports that causal claim. The key distinction is between “this repeatedly appears together” and “this is why the person behaves this way.” The investigation supports the first statement more strongly than the second. The most useful mechanism candidate is therefore the relationship between ${primaryTheme} and ${secondaryTheme}, supported by cross-source recurrence and the signal layer. Further certainty would require stronger longitudinal evidence, an explicit statement from the subject, or an additional source that directly demonstrates cause rather than correlation.`;

  const section4 = `Public evidence is strongest when it can be traced to a specific source and when multiple source types point in the same direction. The current evidence inventory contains ${evidenceCoverage} usable records spanning the available website, LinkedIn, article, profile, GitHub, and other public surfaces represented in the package. The most useful sources for the current finding are ${sources.slice(0, 8).map(source => `${source.sourceId} (${source.sourceType})`).join(", ") || "the available public records"}. Their content shows repeated emphasis on ${primaryTheme} and related themes such as ${secondaryTheme}. The investigation treats source metadata, dates, titles, post text, profile information, repository descriptions, and signal observations as separate evidence layers that should reinforce one another rather than be merged blindly. Where a claim can be tied to a source ID, that traceability should be retained in the final report. The public-evidence section is therefore not a list of links; it is the factual base from which the higher-level finding is derived. Evidence that merely describes a topic is weaker than evidence that demonstrates repeated behavior, change over time, concrete action, or measurable outcome. The report should prioritize the latter whenever it exists.`;

  const section5 = `Cross evidence asks whether independent surfaces corroborate, qualify, or genuinely conflict with one another. In the current package, ${corroboratedThemes.length} themes recur across at least three distinct evidence records. The strongest repeated themes are ${corroboratedThemes.map(item => `${item.term} across ${item.sources.size} records`).join(", ") || "not yet established at that threshold"}. Explicit contradiction data is ${contradictions.length ? "present" : "not present"}. ${explicitContradictionText} This distinction matters because different wording, different topics, or different audiences do not automatically create contradiction. A genuine contradiction requires two claims or behaviors that cannot comfortably coexist under the same interpretation. Where the sources instead reinforce one another, that reinforcement should increase confidence. Where they differ without direct conflict, the difference should be treated as context. Where one surface is silent, that silence should remain an evidence gap, not evidence against the subject. The cross-evidence finding is therefore strongest around corroboration and weakest wherever contradiction would need to be inferred rather than observed. This gives the final report a more disciplined relationship between evidence and conclusion.`;

  const section6 = `Evidence confidence is based on coverage, cross-source corroboration, signal-family support, and the amount of conversational context available in the TruthLoop package. The current evidence score is ${confidenceScore}/100, classified as ${confidenceLevel}. That score should be read as confidence in the strength of the evidence pattern, not confidence in an unseen psychological explanation. Confidence rises when multiple independent sources repeat the same observable pattern, when signal families point in a compatible direction, and when the Loop 1–6 conversation provides context that aligns with the public record. Confidence falls when claims depend on a single source, when evidence is ambiguous, when chronology is missing, or when a mechanism requires assumptions not present in the data. The current package provides ${evidenceCoverage} source records, ${familyCoverage} signal families, ${truthLoopEntries.length} TruthLoop entries, and ${contradictions.length} explicit contradiction records. The strongest claim that can safely be made is therefore a cross-record behavioral pattern around ${primaryTheme}. Any stronger claim should be stated as a hypothesis and clearly separated from observed evidence.`;

  const section7 = `The public record is most useful when it becomes a mirror rather than a verdict. The investigation does not need to declare a fixed identity, diagnose the subject, or force every piece of evidence into one explanation. Its value is in making the recurring structure visible: ${primaryTheme} is repeatedly present, it connects with ${secondaryTheme}, and the relationship appears across multiple evidence records. The important question is what the subject does with that pattern. Does it consistently lead to concrete action, measurable outcomes, or completion? Does it remain at the level of positioning and discussion? Does another source show an exception that materially changes the interpretation? Those questions are more useful than a dramatic psychological label because they can be tested against additional evidence. The current investigation therefore points toward a pattern that deserves attention while preserving uncertainty where the evidence is incomplete. The reflection is not that the subject is “avoiding,” “afraid,” or “defensive” as a fact. The reflection is that the public behavior contains a repeatable structure whose consequences can be examined directly. That distinction keeps the report credible and useful.`;

  const nextAction = `One next action: choose the single highest-confidence pattern identified here — ${primaryTheme} — and test it against one concrete outcome from the TruthLoop conversation. Compare what the user says they intend to do with what the public evidence shows they repeatedly do. Record one specific alignment, one specific mismatch, and one unresolved question. Do not expand the test into a general personality judgment. The purpose is to validate whether the strongest public pattern actually maps onto the user's present decision or execution problem. If the match is strong, use that relationship as the basis for the next TruthLoop step. If the match is weak, downgrade the public finding rather than forcing it. This preserves the core rule of evidence-led investigation: the action should increase certainty, not merely produce another interpretation.`;

  const rawSections = [
    ["📋 Investigation Summary", section1],
    ["🧩 Behavioral Findings", section2],
    ["⚙ Hidden Mechanism", section3],
    ["🌐 Public Evidence", section4],
    ["🔍 Cross Evidence", section5],
    ["📊 Evidence Confidence", section6],
    ["💡 Final Reflection", section7],
    ["🎯 One Next Action", nextAction]
  ];

  const bounded = clampInvestigationSections(rawSections, 1400, 1600);
  const formattedSections = bounded.sections.map(item =>
    `${item.title}\n${item.number}. ${item.content}`
  );
  const boundedText = formattedSections.join("\n\n");
  const reportBudget = {
    minWords: 1400,
    maxWords: 1600,
    actualWords: bounded.words,
    estimatedTokens: investigationTokenEstimate(boundedText),
    withinWordTarget: bounded.withinTarget
  };

  return {
    report: boundedText,
    sections: Object.fromEntries(bounded.sections.map(item => [
      `section${item.number}`,
      { title: item.title, content: item.content }
    ])),
    wordCount: bounded.words,
    estimatedTokens: reportBudget.estimatedTokens,
    sourceCount: sources.length,
    signalFamilyCount: families.length,
    signalObservationCount: signalEntries.length,
    truthLoopEntries: truthLoopEntries.length,
    explicitContradictionCount: contradictions.length,
    recurringThemeCount: recurringTerms.length,
    confidenceScore,
    confidence: confidenceLevel,
    reportBudget,
    investigationMode: "raw_evidence_before_compression"
  };
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
      loop7Package: null,
      investigationReport: null
    };
  }

  /* -------------------------------------------------------
     RAW INVESTIGATION — no compression before investigation.
     The complete upstream package is passed unchanged into the
     investigation layer together with the complete TruthLoop package.
  ------------------------------------------------------- */

  const investigationReport = buildInvestigationReport({
    universalPackage,
    truthLoopPackage
  });

  console.log(
    "ECB_INVESTIGATION_AUDIT",
    JSON.stringify({
      mode: investigationReport.investigationMode,
      reportWords: investigationReport.wordCount,
      estimatedTokens: investigationReport.estimatedTokens,
      sourceCount: investigationReport.sourceCount,
      signalFamilyCount: investigationReport.signalFamilyCount,
      signalObservationCount: investigationReport.signalObservationCount,
      truthLoopEntries: investigationReport.truthLoopEntries,
      explicitContradictionCount: investigationReport.explicitContradictionCount,
      confidence: investigationReport.confidence,
      confidenceScore: investigationReport.confidenceScore,
      withinWordTarget: investigationReport.reportBudget.withinWordTarget,
      inputChars: originalUniversalSize
    })
  );

  return {
    success: true,
    loop7Package: universalPackage,
    investigationReport,
    compressionStats: {
      originalChars: originalUniversalSize,
      compressedChars: originalUniversalSize,
      targetChars: originalUniversalSize,
      maxAllowedChars: MAX_INPUT_PACKAGE_CHARS,
      compressionDisabled: true,
      investigationBeforeCompression: true
    }
  };

}

const generateInvestigationReport = buildInvestigationReport;

export {
  loadEvidenceCompressionBrain,
  buildInvestigationReport,
  generateInvestigationReport
};
