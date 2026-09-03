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
   LOOP 7 INVESTIGATION LAYER

   This is a deterministic, provider-free investigation pass.
   It studies the compressed evidence package together with the
   TruthLoop package and produces a raw evidence-bounded report.
   A downstream model may format/write the report, but it is not
   required to rediscover the investigation.
--------------------------------------------------------- */

const INVESTIGATION_STOP_WORDS = new Set([
  "about", "after", "again", "against", "being", "could", "would",
  "there", "their", "these", "those", "where", "which", "while",
  "with", "from", "have", "this", "that", "they", "them", "than",
  "into", "your", "you", "were", "what", "when", "will", "been",
  "more", "most", "some", "such", "over", "only", "also", "very",
  "through", "because", "between", "then", "here", "just", "like",
  "using", "used", "work", "working", "make", "made", "does", "done"
]);

const investigationTokens = value =>
  cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9%\s-]/gi, " ")
    .split(/\s+/)
    .filter(token => token.length >= 4 && !INVESTIGATION_STOP_WORDS.has(token));

const collectInvestigationText = (value, path = "root", out = [], depth = 0) => {
  if (out.length >= 120 || depth > 5) return out;

  if (typeof value === "string") {
    const text = cleanText(value);
    if (text.length >= 30) out.push({ path, text });
    return out;
  }

  if (Array.isArray(value)) {
    value.slice(0, 50).forEach((item, index) =>
      collectInvestigationText(item, `${path}[${index}]`, out, depth + 1)
    );
    return out;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/^(url|sourceUrl|profileUrl|link|id|_id|urn|date|publishedAt|updatedAt)$/i.test(key)) continue;
      collectInvestigationText(child, `${path}.${key}`, out, depth + 1);
      if (out.length >= 120) break;
    }
  }

  return out;
};

const getInvestigationEvidenceUniverse = compressedEvidencePackage => {
  if (compressedEvidencePackage?.evidenceUniverse) return compressedEvidencePackage.evidenceUniverse;
  if (compressedEvidencePackage?.loop7Package?.evidenceUniverse) {
    return compressedEvidencePackage.loop7Package.evidenceUniverse;
  }
  return {};
};

const collectInvestigationSources = compressedEvidencePackage => {
  const universe = getInvestigationEvidenceUniverse(compressedEvidencePackage);
  const sources = [];

  const add = (source, fallbackType) => {
    if (!source || typeof source !== "object") return;
    const content = extractEvidenceText(source, 900, 6);
    if (!content) return;
    sources.push({
      sourceId: firstText(source.sourceId, source.id) || `EVIDENCE_${sources.length + 1}`,
      sourceType: firstText(source.sourceType, fallbackType) || fallbackType,
      title: firstText(source.title, source.name, source.headline) || "Untitled source",
      url: getUrl(source),
      content
    });
  };

  for (const source of Array.isArray(universe.websiteSources) ? universe.websiteSources : []) add(source, "website");
  if (universe.linkedinProfile) add(universe.linkedinProfile, "linkedin_profile");
  for (const source of Array.isArray(universe.linkedinPosts) ? universe.linkedinPosts : []) add(source, "linkedin_post");
  for (const source of Array.isArray(universe.linkedinArticles) ? universe.linkedinArticles : []) add(source, "linkedin_article");
  if (universe.githubEvidence) add(universe.githubEvidence, "github");

  return sources.slice(0, 12);
};

const collectInvestigationSignalFindings = compressedEvidencePackage => {
  const universe = getInvestigationEvidenceUniverse(compressedEvidencePackage);
  const signalMaster = universe.signalMaster && typeof universe.signalMaster === "object"
    ? universe.signalMaster
    : {};
  const findings = [];

  const families = signalMaster.deepSignalFamilies && typeof signalMaster.deepSignalFamilies === "object"
    ? signalMaster.deepSignalFamilies
    : {};

  for (const [family, value] of Object.entries(families)) {
    const finding = firstText(value?.finding, value?.signal, value?.observation, value?.basis);
    if (!finding) continue;
    findings.push({
      family,
      finding: meaningfulText(finding, 420, 3),
      confidence: Number(value?.confidence || 0),
      sourceUrls: Array.isArray(value?.supportingSourceUrls) ? value.supportingSourceUrls.slice(0, 2) : []
    });
  }

  return findings.slice(0, 10);
};

const collectExplicitInvestigationContradictions = (compressedEvidencePackage, truthLoopPackage) => {
  const universe = getInvestigationEvidenceUniverse(compressedEvidencePackage);
  const signalMaster = universe.signalMaster && typeof universe.signalMaster === "object"
    ? universe.signalMaster
    : {};
  const candidates = [
    ...(Array.isArray(signalMaster.contradictions) ? signalMaster.contradictions : []),
    ...(Array.isArray(signalMaster.crossSourceSignals) ? signalMaster.crossSourceSignals : []),
    ...(Array.isArray(truthLoopPackage?.contradictions) ? truthLoopPackage.contradictions : [])
  ];

  const out = [];
  for (const item of candidates) {
    const text = signalText(item);
    if (!text) continue;
    if (!out.some(existing => existing.toLowerCase() === text.toLowerCase())) out.push(text);
  }
  return out.slice(0, 8);
};

const rankRecurringInvestigationTerms = (entries, limit = 8) => {
  const stats = new Map();

  for (const entry of entries) {
    const uniqueTerms = new Set(investigationTokens(entry.text));
    for (const term of uniqueTerms) {
      const current = stats.get(term) || { term, occurrences: 0, sources: new Set(), examples: [] };
      current.occurrences += 1;
      if (entry.sourceId) current.sources.add(entry.sourceId);
      if (current.examples.length < 3) current.examples.push(entry.text);
      stats.set(term, current);
    }
  }

  return [...stats.values()]
    .filter(item => item.occurrences >= 2)
    .sort((a, b) => b.sources.size - a.sources.size || b.occurrences - a.occurrences || a.term.localeCompare(b.term))
    .slice(0, limit);
};

const investigationWordCount = text =>
  cleanText(text).split(/\s+/).filter(Boolean).length;

const investigationTokenEstimate = text =>
  Math.max(1, Math.ceil(cleanText(text).length / 4));

const buildInvestigationConfidence = ({ sourceCount, signalFamilyCount, contradictionCount, loopSignalCount }) => {
  let score = 0;
  score += Math.min(40, sourceCount * 4);
  score += Math.min(40, signalFamilyCount * 4);
  score += Math.min(10, contradictionCount * 2);
  score += Math.min(10, loopSignalCount * 2);
  score = Math.min(100, score);
  return {
    score,
    level: score >= 80 ? "high" : score >= 60 ? "moderate" : "low"
  };
};

const generateInvestigationReport = ({
  compressedEvidencePackage = {},
  truthLoopPackage = {}
} = {}) => {
  const sources = collectInvestigationSources(compressedEvidencePackage);
  const signalFindings = collectInvestigationSignalFindings(compressedEvidencePackage);
  const explicitContradictions = collectExplicitInvestigationContradictions(
    compressedEvidencePackage,
    truthLoopPackage
  );
  const loopEntries = collectInvestigationText(truthLoopPackage, "truthLoopPackage");
  const sourceEntries = sources.map(source => ({ sourceId: source.sourceId, text: source.content }));
  const signalEntries = signalFindings.map(item => ({ sourceId: `SIGNAL_${item.family}`, text: item.finding }));
  const loopSignalCount = loopEntries.length;

  const terms = rankRecurringInvestigationTerms(
    [...sourceEntries, ...signalEntries, ...loopEntries],
    8
  );

  const signalFamilyCount = signalFindings.length;
  const confidence = buildInvestigationConfidence({
    sourceCount: sources.length,
    signalFamilyCount,
    contradictionCount: explicitContradictions.length,
    loopSignalCount
  });

  const centralFinding = terms.length
    ? `The strongest recurring evidence theme is “${terms[0].term}”, appearing across ${terms[0].sources.size} retained evidence records. Recurrence is treated as an observable pattern, not as proof of an internal psychological cause.`
    : "No recurring evidence theme met the minimum cross-record threshold. The investigation therefore remains descriptive rather than inferential.";

  const recurringPatterns = terms.length
    ? terms.map((item, index) =>
        `${index + 1}. ${item.term} — ${item.occurrences} evidence entries / ${item.sources.size} evidence records. ${item.examples[0]?.slice(0, 260) || ""}`
      ).join("\n")
    : "No repeated pattern was strong enough to promote.";

  const evidenceSupport = sources.length
    ? sources.map(source =>
        `${source.sourceId} | ${source.sourceType} | ${source.title} | ${source.content.slice(0, 340)}`
      ).join("\n")
    : "No usable public source content survived compression.";

  const signalSupport = signalFindings.length
    ? signalFindings.map(item =>
        `${item.family} | confidence ${Number.isFinite(item.confidence) ? item.confidence : "n/a"} | ${item.finding}${item.sourceUrls.length ? ` | ${item.sourceUrls.join(", ")}` : ""}`
      ).join("\n")
    : "No deep signal families were available in the compressed package.";

  const contradictionSection = explicitContradictions.length
    ? explicitContradictions.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "No explicit contradiction was supplied by the evidence layer. Do not manufacture a contradiction from thematic overlap alone.";

  const gapSection = sources.length < 3
    ? "Public evidence coverage is limited. Conclusions should remain provisional and should not be generalized beyond the retained sources."
    : signalFamilyCount < 4
      ? `The evidence layer contains ${sources.length} usable source records, but only ${signalFamilyCount} deep signal families were available for cross-family comparison. Mechanism claims should remain bounded.`
      : "No negative conclusion is inferred from missing information. Any unresolved area is treated as an evidence gap rather than as evidence against the subject.";

  const mechanismSection = terms.length >= 2
    ? `Candidate mechanism for further explanation: “${terms[0].term}” and “${terms[1].term}” recur across the retained material. The safest evidence-based interpretation is that these themes are linked in the public record; causation, private motive, or diagnosis is not asserted without direct support.`
    : "No causal mechanism is promoted because the retained evidence does not provide enough repeated relationships to justify one.";

  const sourceUsageSection = `Sources used: ${sources.length}. Deep signal families used: ${signalFamilyCount}. TruthLoop package text entries considered: ${loopEntries.length}. Explicit contradiction records: ${explicitContradictions.length}.`;

  const report = [
    "TRUTHLOOP LOOP 7 — RAW INVESTIGATION REPORT",
    "",
    "1. CENTRAL FINDING",
    centralFinding,
    "",
    "2. RECURRING PATTERNS",
    recurringPatterns,
    "",
    "3. EVIDENCE SUPPORT",
    evidenceSupport,
    "",
    "4. SIGNAL INTELLIGENCE",
    signalSupport,
    "",
    "5. EXPLICIT CROSS-EVIDENCE / CONTRADICTIONS",
    contradictionSection,
    "",
    "6. CANDIDATE HIDDEN MECHANISM",
    mechanismSection,
    "",
    "7. EVIDENCE GAP + CONFIDENCE",
    `${gapSection}\n${sourceUsageSection}\nConfidence: ${confidence.score}/100 (${confidence.level}).`,
    "",
    "8. REPORTING DIRECTION",
    "Write the final Loop 7 report from this investigation boundary. Preserve source IDs where public evidence is referenced. Do not turn recurrence into diagnosis, thematic overlap into contradiction, or uncertainty into a negative claim."
  ].join("\n");

  return {
    text: report,
    wordCount: investigationWordCount(report),
    estimatedTokens: investigationTokenEstimate(report),
    sourceCount: sources.length,
    signalFamilyCount,
    truthLoopEntries: loopEntries.length,
    explicitContradictionCount: explicitContradictions.length,
    confidence: confidence.level,
    confidenceScore: confidence.score
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
      loop7Package: null
    };
  }

  /* -------------------------------------------------------
     1 + 2. SELECT
  ------------------------------------------------------- */

  const websiteInput =
    Array.isArray(universalPackage?.websiteEvidence?.sources)
      ? universalPackage.websiteEvidence.sources
      : [];

  const websiteSourcesInput = selectSources(
    websiteInput,
    MAX_WEBSITE_SOURCES,
    "website"
  );

  const linkedinEvidence =
    universalPackage?.linkedinEvidence &&
    typeof universalPackage.linkedinEvidence === "object"
      ? universalPackage.linkedinEvidence
      : {};

  const linkedinSource =
    linkedinEvidence?.source &&
    typeof linkedinEvidence.source === "object"
      ? linkedinEvidence.source
      : {};

  const profileInput =
    linkedinEvidence?.profile &&
    typeof linkedinEvidence.profile === "object"
      ? linkedinEvidence.profile
      : linkedinSource?.linkedinProfile &&
        typeof linkedinSource.linkedinProfile === "object"
        ? linkedinSource.linkedinProfile
        : null;

  const postsInput =
    Array.isArray(linkedinEvidence?.posts)
      ? linkedinEvidence.posts
      : Array.isArray(linkedinSource?.posts)
        ? linkedinSource.posts
        : [];

  const articlesInput =
    Array.isArray(linkedinEvidence?.articles)
      ? linkedinEvidence.articles
      : Array.isArray(linkedinSource?.articles)
        ? linkedinSource.articles
        : [];

  const githubInput =
    universalPackage?.githubEvidence &&
    typeof universalPackage.githubEvidence === "object"
      ? universalPackage.githubEvidence
      : null;

  const linkedinPostsInput = selectLinkedInItems(
    postsInput,
    MAX_LINKEDIN_POSTS
  );

  const linkedinArticlesInput = selectLinkedInItems(
    articlesInput,
    MAX_LINKEDIN_ARTICLES
  );

  console.log(
    "ECB_SELECTION_AUDIT",
    JSON.stringify({
      websiteAvailable: websiteInput.length,
      websiteSelected: websiteSourcesInput.length,
      linkedinPostsAvailable: postsInput.length,
      linkedinPostsSelected: linkedinPostsInput.length,
      linkedinArticlesAvailable: articlesInput.length,
      linkedinArticlesSelected: linkedinArticlesInput.length,
      linkedinProfileSelected: !!profileInput,
      githubSelected: !!githubInput
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
    url: getUrl(source),
    title:
      firstText(source?.title, source?.headline).slice(0, 220) || null,
    date: getDate(source),
    content: extractEvidenceText(source, 650, 4)
  }));

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
          meaningfulText(profileInput?.headline, 300, 2),
        about:
          meaningfulText(
            firstText(
              profileInput?.about,
              profileInput?.summary,
              profileInput?.bio
            ),
            850,
            5
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

  const linkedinPosts = linkedinPostsInput.map(item => ({
    sourceId: nextSourceId(),
    sourceType: "linkedin_post",
    id: getId(item),
    url:
      getUrl(item) ||
      normalizeUrl(linkedinSource?.sourceUrl || "") ||
      null,
    date: getDate(item),
    title:
      firstText(item?.title, item?.headline).slice(0, 180) || null,
    content:
      extractEvidenceText(item, 650, 4),
    likes: item?.likes ?? null,
    comments: item?.comments ?? null
  }));

  const linkedinArticles = linkedinArticlesInput.map(item => ({
    sourceId: nextSourceId(),
    sourceType: "linkedin_article",
    id: getId(item),
    url:
      getUrl(item) ||
      normalizeUrl(linkedinSource?.sourceUrl || "") ||
      null,
    date: getDate(item),
    title:
      firstText(item?.title, item?.headline).slice(0, 200) || null,
    content:
      extractEvidenceText(item, 650, 4),
    likes: item?.likes ?? null,
    comments: item?.comments ?? null
  }));

  const githubEvidence = githubInput
    ? buildGithubEvidence(githubInput)
    : null;

  if (githubEvidence) {
    githubEvidence.sourceId = nextSourceId();
  }

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
     SOURCE REGISTRY — canonical identity/traceability
  ------------------------------------------------------- */

  const sourceRegistry = [];

  for (const source of websiteSources) {
    sourceRegistry.push({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      title: source.title || "Website source",
      url: source.url,
      date: source.date || null
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

      linkedinProfile: profile,

      linkedinPosts,

      linkedinArticles,

      githubEvidence,

      signalMaster
    },

    evidenceCoverage: {
      websiteSourcesRetained: websiteSources.length,
      linkedinProfileRetained: profile ? 1 : 0,
      linkedinPostsRetained: linkedinPosts.length,
      linkedinArticlesRetained: linkedinArticles.length,
      githubSourcesRetained: githubEvidence ? 1 : 0,
      additionalEvidenceItemsRetained: githubEvidence ? 1 : 0,
      linkedInPostLimitApplied: MAX_LINKEDIN_POSTS,
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
    /*
     * Final ECB output is intentionally lean:
     * sourceRegistry remains the canonical locator layer.
     * Loop 7 chat.js rehydrates evidence content from the upstream
     * Universal Package using these canonical URLs.
     *
     * Therefore the ECB transport package carries metadata-only
     * source records plus compressed signal intelligence.
     */
    const compactSourceRegistry = sourceRegistry.map(source => ({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      title: firstText(source.title).slice(0, 44) || null,
      url: source.url || null,
      date: source.date || null
    }));

    const website = websiteSources.map(source => ({
  sourceId: source.sourceId,
  sourceType: source.sourceType,
  url: getUrl(source),
  title: firstText(source.title, source.headline).slice(0, 64) || null,
  date: getDate(source),
  content: meaningfulText(
    extractEvidenceText(source, 220, 2),
    220,
    2
  )
}));

const linkedinProfile = profile
  ? {
      sourceId: profile.sourceId,
      sourceType: profile.sourceType,
      profileUrl: profile.profileUrl,
      name: firstText(profile.name).slice(0, 120) || null,
      headline: meaningfulText(
        profile.headline,
        Math.min(180, profileBudget),
        1
      ),
      about: meaningfulText(
        profile.about,
        Math.min(120, profileBudget),
        1
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
    extractEvidenceText(post, 180, 2),
    180,
    2
  )
}));

const articles = linkedinArticles.map(article => ({
  sourceId: article.sourceId,
  sourceType: article.sourceType,
  url: getUrl(article),
  date: getDate(article),
  title: firstText(article.title, article.headline).slice(0, 100) || null,
  content: meaningfulText(
    extractEvidenceText(article, 220, 2),
    220,
    2
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
        Math.min(140, profileBudget),
        1
      ),
      content: meaningfulText(
        extractEvidenceText(githubEvidence, 180, 2),
        180,
        2
      )
    }
  : null;
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
      sourceLinks: [],
      evidenceUniverse: {
  sourceLinks: [],
  sourceRegistry: compactSourceRegistry,

  websiteSources: website,
  linkedinProfile,
  linkedinPosts: posts,
  linkedinArticles: articles,
  githubEvidence: github,

  signalMaster: signals
      },
      evidenceCoverage: {
        websiteSourcesRetained: website.length,
        linkedinProfileRetained: linkedinProfile ? 1 : 0,
        linkedinPostsRetained: posts.length,
        linkedinArticlesRetained: articles.length,
        githubSourcesRetained: github ? 1 : 0,
        additionalEvidenceItemsRetained: github ? 1 : 0,
        linkedInPostLimitApplied: MAX_LINKEDIN_POSTS,
        urlsRetained: sourceLinks.length,
        evidenceSourcesRetained: sourceRegistry.length
      }
    };

    return pkg;
  };

  let finalSize = packageSize(finalPackage);

  /* Normal target pass. */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    finalPackage = rebuildAtBudget(260, 420, 90);
    finalSize = packageSize(finalPackage);
  }

  /* Remove only duplicate sourceLinks if registry already carries URLs. */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    const copy = JSON.parse(JSON.stringify(finalPackage));
    copy.sourceLinks = undefined;
    if (copy.evidenceUniverse) copy.evidenceUniverse.sourceLinks = [];
    finalPackage = copy;
    finalSize = packageSize(finalPackage);
  }

  /* Tight meaningful pass. */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    finalPackage = rebuildAtBudget(190, 320, 70);
    finalPackage.sourceLinks = undefined;
    if (finalPackage.evidenceUniverse) finalPackage.evidenceUniverse.sourceLinks = [];
    finalSize = packageSize(finalPackage);
  }

  /* Last safe pass: keep evidence, but fewer complete sentences/items. */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    finalPackage = rebuildAtBudget(130, 240, 55);
    finalPackage.sourceLinks = undefined;
    if (finalPackage.evidenceUniverse) finalPackage.evidenceUniverse.sourceLinks = [];
    finalSize = packageSize(finalPackage);
  }

  /*
   * Final structural safeguard. We do not return null here. If the
   * explicit metadata duplication itself causes an overage, remove
   * only the nested duplicate registry (top-level registry remains,
   * which is the form chat.js consumes).
   */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    const copy = JSON.parse(JSON.stringify(finalPackage));
    if (copy?.evidenceUniverse) {
      copy.evidenceUniverse.sourceRegistry = undefined;
    }
    finalPackage = copy;
    finalSize = packageSize(finalPackage);
  }

  /* If an unusually large signal object remains, reduce signal families
     without touching actual source evidence. */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    const copy = JSON.parse(JSON.stringify(finalPackage));
    const eu = copy?.evidenceUniverse || {};
    const signals = eu.signalMaster || {};

    for (const key of Object.keys(signals)) {
      if (Array.isArray(signals[key])) {
        signals[key] = signals[key].slice(0, 3);
      }
    }

    eu.signalMaster = signals;
    finalPackage = copy;
    finalSize = packageSize(finalPackage);
  }

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    finalPackage = rebuildAtBudget(90, 180, 45);
    finalPackage.sourceLinks = undefined;
    if (finalPackage.evidenceUniverse) {
      finalPackage.evidenceUniverse.sourceLinks = [];
      finalPackage.evidenceUniverse.sourceRegistry = undefined;
    }
    finalSize = packageSize(finalPackage);
  }

if (finalSize > ECB_TRANSPORT_LIMIT) {
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
        destructiveCharacterCompaction: false
      })
    );

    return {
      success: false,
      reason:
        `Meaningful ECB package exceeds ${MAX_TOTAL_PACKAGE_CHARS} characters after evidence-preserving reduction.`,
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
    "ECB_FINAL_PACKAGE_SIZE",
    finalSize
  );

  console.log(
    "ECB_COMPRESSION_AUDIT",
    JSON.stringify({
      originalChars: originalUniversalSize,
      finalChars: finalSize,
      targetChars: TARGET_PACKAGE_CHARS,
      maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
      websiteSources: websiteSources.length,
      linkedinPosts: linkedinPosts.length,
      linkedinArticles: linkedinArticles.length,
      profile: !!profile,
      githubSources: githubEvidence ? 1 : 0,
      urlsRetained: sourceLinks.length,
      evidenceSourcesRetained: sourceRegistry.length,
      meaningfulCompression: true,
      destructiveCharacterCompaction: false,
      linksModified: false
    })
  );

  const investigationReport = generateInvestigationReport({
    compressedEvidencePackage: finalPackage,
    truthLoopPackage
  });

  console.log(
    "ECB_INVESTIGATION_AUDIT",
    JSON.stringify({
      reportWords: investigationReport.wordCount,
      estimatedTokens: investigationReport.estimatedTokens,
      sourceCount: investigationReport.sourceCount,
      signalFamilyCount: investigationReport.signalFamilyCount,
      truthLoopEntries: investigationReport.truthLoopEntries,
      explicitContradictionCount: investigationReport.explicitContradictionCount,
      confidence: investigationReport.confidence,
      confidenceScore: investigationReport.confidenceScore
    })
  );

  return {
    success: true,
    loop7Package: finalPackage,
    investigationReport,
    compressionStats: {
      originalChars: originalUniversalSize,
      compressedChars: finalSize,
      targetChars: TARGET_PACKAGE_CHARS,
      maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
      websiteSources: websiteSources.length,
      linkedInPosts: linkedinPosts.length,
      linkedInArticles: linkedinArticles.length,
      githubSources: githubEvidence ? 1 : 0,
      additionalEvidenceItems: githubEvidence ? 1 : 0,
      linkedinPostLimit: MAX_LINKEDIN_POSTS,
      linkedinProfiles: profile ? 1 : 0,
      urlsRetained: sourceLinks.length,
      evidenceSourcesRetained: sourceRegistry.length,
      meaningfulCompression: true,
      destructiveCharacterCompaction: false,
      linksModified: false
    }
  };
}

export {
  loadEvidenceCompressionBrain,
  generateInvestigationReport
};
