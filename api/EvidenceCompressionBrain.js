/* =========================================================
   EVIDENCE COMPRESSION BRAIN v22 — CLEAN INVESTIGATION REBUILD
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

const MAX_TOTAL_PACKAGE_CHARS = 10000;
const ECB_OUTPUT_LIMIT = 10000;
const ECB_TRANSPORT_LIMIT = 15000;
const MAX_INPUT_PACKAGE_CHARS = 10000000;
const TARGET_PACKAGE_CHARS = 10000;

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

const PACKAGE_VERSION = "22.0";

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
   The report target is 1000 - 1200 words. It also exposes estimated
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

const isTechnicalNoiseText = value => {
  const text = cleanText(value).toLowerCase();
  if (!text) return true;

  if (/^(https?|www|html|href|src|target|blank|urn|feed|update|li|http)$/i.test(text)) {
    return true;
  }

  if (/^https?:\/\//i.test(text)) return true;
  if (/<[^>]+>/.test(text)) return true;
  if (/^(?:[a-z0-9_-]+\.)+(?:com|org|net|in|io|ai|co)(?:\/.*)?$/i.test(text)) {
    return true;
  }

  return false;
};

const getFamilyFinding = family => {
  if (!family || !Array.isArray(family.members)) return "";

  const ranked = family.members
    .map(member => ({
      text: firstText(member?.finding, member?.basis),
      confidence: Number(member?.confidence) || 0
    }))
    .filter(item => item.text && !isTechnicalNoiseText(item.text))
    .sort((a, b) => b.confidence - a.confidence || b.text.length - a.text.length);

  return ranked[0]?.text || "";
};

const familySourceCount = family => {
  const urls = new Set();

  for (const member of Array.isArray(family?.members) ? family.members : []) {
    for (const url of Array.isArray(member?.sourceUrls) ? member.sourceUrls : []) {
      const normalized = normalizeUrl(url);
      if (normalized) urls.add(normalized);
    }
  }

  return urls.size;
};

const rankMeaningfulFamilies = families =>
  (Array.isArray(families) ? families : [])
    .map(family => {
      const finding = getFamilyFinding(family);
      const confidences = (family.members || [])
        .map(member => Number(member?.confidence))
        .filter(Number.isFinite);
      const confidence = confidences.length
        ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
        : 0;

      return {
        family,
        finding,
        sourceCount: familySourceCount(family),
        confidence
      };
    })
    .filter(item => item.finding && !isTechnicalNoiseText(item.finding))
    .sort((a, b) =>
      b.sourceCount - a.sourceCount ||
      b.confidence - a.confidence ||
      (b.family?.memberCount || 0) - (a.family?.memberCount || 0)
    );

const fitCompleteSentences = (value, maxChars) => {
  const text = cleanText(value);
  if (!text) return "";
  if (text.length <= maxChars) return text;

  const sentences = splitSentences(text);
  if (!sentences.length) return text.slice(0, maxChars).trim();

  const selected = [];
  let used = 0;

  for (const sentence of sentences) {
    const extra = sentence.length + (selected.length ? 1 : 0);
    if (used + extra > maxChars) break;
    selected.push(sentence);
    used += extra;
  }

  return selected.join(" ").trim() || sentences[0].slice(0, maxChars).trim();
};

const clampInvestigationSections = (sections, maxChars = ECB_OUTPUT_LIMIT) => {
  const out = sections.map(([title, body], index) => ({
    title,
    number: index + 1,
    content: cleanText(body)
  }));

  const headingChars = out.reduce(
    (sum, item) => sum + item.title.length + String(item.number).length + 4,
    0
  );
  const separatorChars = Math.max(0, (out.length - 1) * 2);
  const bodyBudget = Math.max(2600, maxChars - headingChars - separatorChars);
  const perSectionBudget = Math.max(300, Math.floor(bodyBudget / Math.max(1, out.length)));

  out.forEach(item => {
    item.content = fitCompleteSentences(item.content, perSectionBudget);
  });

  const render = items =>
    items.map(item => `${item.title}\n${item.number}. ${item.content}`).join("\n\n");

  let rendered = render(out);

  if (rendered.length > maxChars) {
    for (let i = out.length - 1; i >= 0 && rendered.length > maxChars; i -= 1) {
      const sentences = splitSentences(out[i].content);
      if (sentences.length <= 1) continue;

      while (sentences.length > 1 && rendered.length > maxChars) {
        sentences.pop();
        out[i].content = sentences.join(" ").trim();
        rendered = render(out);
      }
    }
  }

  return {
    sections: out,
    words: cleanText(rendered).split(/\s+/).filter(Boolean).length,
    chars: rendered.length,
    withinLimit: rendered.length <= maxChars
  };
};

const formatEvidenceList = (sources, limit = 6) =>
  sources.slice(0, limit).map(source =>
    `[${source.sourceId}] ${source.title}${source.date ? ` (${source.date})` : ""}: ${source.content || source.title}`
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

  const rankedFamilies = rankMeaningfulFamilies(families);
  const primary = rankedFamilies[0] || null;
  const secondary = rankedFamilies[1] || null;

  const primaryFamily = primary?.family?.family || "available evidence";
  const secondaryFamily = secondary?.family?.family || "surrounding evidence";
  const primaryFinding = primary?.finding || "No single evidence-backed signal dominates the retained record.";
  const secondaryFinding = secondary?.finding || "No secondary evidence-backed signal is strong enough to establish a separate mechanism.";

  const corroboratedFamilies = rankedFamilies
    .filter(item => item.sourceCount >= 2)
    .slice(0, 4);

  const confidenceScore = Math.min(
    95,
    Math.round(
      Math.min(35, sources.length * 2) +
      Math.min(30, rankedFamilies.slice(0, 5).reduce((sum, item) => sum + Math.round(item.confidence * 6), 0)) +
      Math.min(20, corroboratedFamilies.length * 5) +
      Math.min(10, truthLoopEntries.length > 0 ? 10 : 0)
    )
  );
  const confidenceLevel = confidenceScore >= 80 ? "high" : confidenceScore >= 60 ? "moderate" : "limited";

  const selectedSources = sources
    .filter(source => source.content || source.title)
    .slice(0, 8);

  const sourceCitations = selectedSources
    .slice(0, 6)
    .map(source => `[${source.sourceId}]`)
    .join(" ");

  const section1 = `The investigation combines ${sources.length} retained public sources with ${truthLoopEntries.length} TruthLoop entries and ${families.length} evidence signal families. The strongest evidence-backed direction is the ${primaryFamily} family: ${primaryFinding} This is supported by the retained public record rather than by frequency of technical terms. ${sourceCitations} The central finding should therefore be read as a public-behavior pattern, not as proof of a private motive, diagnosis, or intent.`;

  const behaviorEvidence = formatEvidenceList(selectedSources, 5);
  const section2 = `The behavioral finding is defined by repeated observable work, positioning, activity, or decisions rather than by personality labels. The strongest retained signal is ${primaryFinding} A second relevant signal is ${secondaryFinding} Representative source evidence is ${behaviorEvidence}. These observations support a pattern-level conclusion only where the sources show repetition, sequence, change, concrete action, or a meaningful gap. Public topics alone are not treated as behavioral proof.`;

  const mechanismEvidence = [
    primary?.finding ? `[${primaryFamily}] ${primary.finding}` : "",
    secondary?.finding ? `[${secondaryFamily}] ${secondary.finding}` : ""
  ].filter(Boolean).join(" ");
  const section3 = `The hidden mechanism is best expressed as a relationship between observable evidence layers, not as a causal claim about private psychology. The strongest supported relationship is between ${primaryFamily} and ${secondaryFamily}. ${mechanismEvidence} The evidence can support statements about what repeatedly appears together, what reinforces another observable pattern, or where behavior remains stable across sources. It cannot establish why the subject behaves that way unless a source directly supports that explanation.`;

  const section4 = `Public evidence is strongest when each claim remains traceable to a specific source and when multiple source types reinforce the same observation. The retained source set includes ${selectedSources.map(source => `[${source.sourceId}] ${source.sourceType}`).slice(0, 6).join(", ") || "the available public records"}. These sources provide the factual base for the investigation. Source metadata is retained for traceability, while technical URL fragments, markup, and document structure are not treated as behavioral findings.`;

  const contradictionText = contradictions.length
    ? contradictions.slice(0, 3).map(text => fitCompleteSentences(text, 220)).join(" ")
    : "No explicit contradiction was supplied by the evidence layer; thematic difference is not treated as contradiction.";

  const corroborationText = corroboratedFamilies.length
    ? corroboratedFamilies.map(item => `${item.family} (${item.sourceCount} source links)`).join(", ")
    : "No signal family currently has enough distinct source links to establish strong corroboration.";

  const section5 = `Cross evidence tests whether independent evidence streams corroborate, qualify, or conflict with one another. The strongest corroborated signal families are ${corroborationText}. Explicit contradiction data is ${contradictions.length ? "present" : "not present"}. ${contradictionText} Different wording or topic coverage is not automatically contradiction; a true contradiction requires incompatible claims or behaviors supported by evidence.`;

  const section6 = `Evidence confidence is ${confidenceScore}/100 (${confidenceLevel}). This score reflects source coverage, strength of retained signal families, cross-source corroboration, and available TruthLoop context; it is not confidence in an unseen psychological explanation. Confidence is strongest where multiple independent sources support the same observable direction and weaker where a mechanism would require assumptions beyond the evidence. The most defensible claim is therefore a cross-source behavioral pattern around ${primaryFamily}.`;

  const section7 = `The public record is most useful as a mirror of repeated behavior rather than a verdict about identity. The investigation supports the observable pattern that ${primaryFinding} in combination with ${secondaryFinding}. The consequential unresolved issue is whether that pattern consistently leads to concrete action, measurable outcomes, or completion. Where the evidence remains incomplete, the uncertainty should remain visible instead of being filled with a psychological explanation. ${sourceCitations}`;

  const nextAction = `One next action: test the strongest supported pattern — ${primaryFamily} — against one concrete outcome from the TruthLoop case. Compare one stated intention with one observable public behavior, record one alignment and one mismatch, and downgrade the finding if the evidence does not support the connection. The goal is to increase certainty rather than produce another interpretation. ${selectedSources[0] ? `[${selectedSources[0].sourceId}]` : ""}`;

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

  const bounded = clampInvestigationSections(rawSections, ECB_OUTPUT_LIMIT);
  const formattedSections = bounded.sections.map(item =>
    `${item.title}\n${item.number}. ${item.content}`
  );
  const boundedText = formattedSections.join("\n\n");
  const reportBudget = {
    maxChars: ECB_OUTPUT_LIMIT,
    targetChars: TARGET_PACKAGE_CHARS,
    actualChars: boundedText.length,
    actualWords: bounded.words,
    estimatedTokens: investigationTokenEstimate(boundedText),
    withinLimit: bounded.withinLimit
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
    signalObservationCount: families.reduce((sum, family) => sum + (family.memberCount || family.members?.length || 0), 0),
    truthLoopEntries: truthLoopEntries.length,
    explicitContradictionCount: contradictions.length,
    recurringThemeCount: 0,
    confidenceScore,
    confidence: confidenceLevel,
    reportBudget,
    investigationMode: "raw_evidence_before_compression",
    sourceRegistry: sources.map(source => ({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      title: source.title,
      date: source.date || null,
      url: source.url || null
    }))
  };
};

const generateInvestigationReport = buildInvestigationReport;

export {
  loadEvidenceCompressionBrain,
  buildInvestigationReport,
  generateInvestigationReport
};
