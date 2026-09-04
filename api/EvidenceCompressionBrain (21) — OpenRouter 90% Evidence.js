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

const MAX_TOTAL_PACKAGE_CHARS = 120000;
const ECB_OUTPUT_LIMIT = 120000;
const ECB_TRANSPORT_LIMIT = 120000;
const MAX_INPUT_PACKAGE_CHARS = 10000000;
const TARGET_PACKAGE_CHARS = 0.90;

/*
 * Loop 7 transport boundary:
 * - retain up to 10 Website sources
 * - retain up to 10 LinkedIn posts
 * - LinkedIn article content may inform CEB signals, but is not
 *   transported in the final ECB source registry
 * - retain GitHub + LinkedIn profile
 *
 * CEB may collect more. ECB is the final evidence-selection stage.
 */
const MAX_WEBSITE_SOURCES = 10;
const MAX_LINKEDIN_POSTS = 10;
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


const rawEvidenceText = source =>
  cleanText(
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
    content: extractEvidenceText(source, 6000, 12)
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
    content: extractEvidenceText(source, 6000, 12)
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
    url:
      getUrl(item) ||
      normalizeUrl(linkedinSource?.sourceUrl || "") ||
      null,
    date: getDate(item),
    title:
      firstText(item?.title, item?.headline).slice(0, 180) || null,
    content:
      extractEvidenceText(item, 6000, 12),
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
    url:
      getUrl(item) ||
      normalizeUrl(linkedinSource?.sourceUrl || "") ||
      null,
    date: getDate(item),
    title:
      firstText(item?.title, item?.headline).slice(0, 200) || null,
    content:
      extractEvidenceText(item, 6000, 12),
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
    extractEvidenceText(source, contentBudget, 12),
    contentBudget,
    12
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
    extractEvidenceText(post, contentBudget, 12),
    contentBudget,
    12
  )
}));

const articles = linkedinArticles.map(article => ({
  sourceId: article.sourceId,
  sourceType: article.sourceType,
  url: getUrl(article),
  date: getDate(article),
  title: firstText(article.title, article.headline).slice(0, 100) || null,
  content: meaningfulText(
    extractEvidenceText(article, contentBudget, 12),
    contentBudget,
    12
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
        extractEvidenceText(githubEvidence, contentBudget, 12),
        contentBudget,
        12
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

  /*
   * OpenRouter / DeepSeek-V3.1 has a much larger context window than the
   * historical Groq transport budget. Preserve roughly 90% of the actual
   * Universal Package evidence instead of forcing everything into 9.5k.
   */
  const evidenceItemCount =
    Math.max(
      1,
      websiteSources.length +
      linkedinPosts.length +
      linkedinArticles.length +
      (githubEvidence ? 1 : 0)
    );

  const dynamicTargetChars = Math.max(
    12000,
    Math.min(
      MAX_TOTAL_PACKAGE_CHARS,
      Math.floor(originalUniversalSize * 0.90)
    )
  );

  const metadataReserve = 5000 + (profile ? 2200 : 0);

  if (finalSize > dynamicTargetChars) {
    const perEvidenceBudget = Math.max(
      900,
      Math.floor(
        Math.max(10000, dynamicTargetChars - metadataReserve) /
        evidenceItemCount
      )
    );

    finalPackage = rebuildAtBudget(
      perEvidenceBudget,
      1500,
      0
    );
    finalSize = packageSize(finalPackage);
  }

  /*
   * Second pass only if the 90% target is still exceeded.
   * This remains evidence-first: fewer complete sentences, never tiny
   * character-fragment slicing.
   */
  if (finalSize > dynamicTargetChars) {
    const perEvidenceBudget = Math.max(
      700,
      Math.floor(
        Math.max(10000, dynamicTargetChars - metadataReserve) /
        evidenceItemCount
      ) * 0.75
    );

    finalPackage = rebuildAtBudget(
      Math.floor(perEvidenceBudget),
      1200,
      0
    );
    finalSize = packageSize(finalPackage);
  }

  /* Remove duplicate sourceLinks only when they are the cause of an overage. */
  if (finalSize > dynamicTargetChars) {
    const copy = JSON.parse(JSON.stringify(finalPackage));
    copy.sourceLinks = undefined;
    if (copy.evidenceUniverse) copy.evidenceUniverse.sourceLinks = [];
    finalPackage = copy;
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

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    finalPackage = rebuildAtBudget(1200, 700, 0);
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
        `Meaningful ECB package exceeds the active OpenRouter evidence transport budget after evidence-preserving reduction.`,
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

  void truthLoopPackage;

  return {
    success: true,
    loop7Package: finalPackage,
    compressionStats: {
      originalChars: originalUniversalSize,
      compressedChars: finalSize,
      targetChars: dynamicTargetChars,
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
  loadEvidenceCompressionBrain
};
