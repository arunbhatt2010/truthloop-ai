/* =========================================================
   EVIDENCE COMPRESSION BRAIN — COMPLETE REWRITE
   TruthLoop AI

   Mission
   -------
   Build a bounded Loop 7 evidence package.

   Fixed evidence rules
   --------------------
   - Website evidence: maximum 5 sources/items
   - LinkedIn posts: latest/available maximum 3
   - LinkedIn articles: maximum 1
   - LinkedIn profile: text compressed to approximately 1/10
   - URLs are always preserved for retained evidence
   - Published dates / IDs are preserved when supplied
   - Content is compressed; retained evidence is not rewritten into
     invented facts
   - No AI/API calls
   - Final Loop 7 package must be <= 10,000 JSON characters
   ========================================================= */

const MAX_TOTAL_PACKAGE_CHARS = 10000;
const MAX_WEBSITE_SOURCES = 5;
const MAX_LINKEDIN_POSTS = 3;
const MAX_LINKEDIN_ARTICLES = 1;
const PROFILE_TEXT_RATIO = 0.10;
const PACKAGE_VERSION = "7.0";

async function loadEvidenceCompressionBrain({
  truthLoopPackage = {},
  publicEvidencePackage = {}
} = {}) {

  console.log("ECB_START");

  if (!publicEvidencePackage?.success) {
    return {
      success: false,
      reason: "No public evidence"
    };
  }

  const universalPackage =
    publicEvidencePackage?.universalPackage &&
    typeof publicEvidencePackage.universalPackage === "object"
      ? publicEvidencePackage.universalPackage
      : publicEvidencePackage;

  const isObject = value =>
    value !== null && typeof value === "object";

  const cleanText = value => {
    if (typeof value !== "string") return "";
    return value
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isUrlKey = key => {
    const k = String(key || "").toLowerCase();
    return (
      k === "url" ||
      k === "uri" ||
      k === "href" ||
      k === "link" ||
      k.endsWith("url") ||
      k.endsWith("urls") ||
      k === "sourcelinks" ||
      k === "sourceurls" ||
      k === "sociallinks" ||
      k === "socialprofiles"
    );
  };

  const isMetadataKey = key => {
    const k = String(key || "").toLowerCase();
    return (
      isUrlKey(k) ||
      k === "id" ||
      k === "_id" ||
      k === "urn" ||
      k === "publisheddate" ||
      k === "publishedat" ||
      k === "datepublished" ||
      k === "date" ||
      k === "postedat" ||
      k === "createdat" ||
      k === "updatedat" ||
      k === "timestamp" ||
      k === "platform" ||
      k === "sourceplatform" ||
      k === "sourcehost" ||
      k === "evidencetype"
    );
  };

  function compactObject(
    value,
    maxTextChars,
    profileMode = false
  ) {
    if (typeof value === "string") {
      if (isMetadataKey("")) return value;
      const text = cleanText(value);

      if (!text) return "";

      const ratioChars = profileMode
        ? Math.max(1, Math.floor(text.length * PROFILE_TEXT_RATIO))
        : maxTextChars;

      return text.slice(0, ratioChars);
    }

    if (Array.isArray(value)) {
      return value.map(item =>
        compactObject(item, maxTextChars, profileMode)
      );
    }

    if (isObject(value)) {
      const result = {};

      for (const [key, child] of Object.entries(value)) {
        if (
          isUrlKey(key) ||
          key.toLowerCase().includes("sourceurls") ||
          key.toLowerCase().includes("sourcelinks")
        ) {
          result[key] = child;
          continue;
        }

        if (isMetadataKey(key)) {
          result[key] = child;
          continue;
        }

        result[key] =
          compactObject(
            child,
            maxTextChars,
            profileMode
          );
      }

      return result;
    }

    return value;
  }

  function getWebsiteSources() {
    return Array.isArray(universalPackage?.websiteEvidence?.sources)
      ? universalPackage.websiteEvidence.sources
      : [];
  }

  function getLinkedInEvidence() {
    return isObject(universalPackage?.linkedinEvidence)
      ? universalPackage.linkedinEvidence
      : {};
  }

  function getLinkedInSource() {
    const evidence = getLinkedInEvidence();

    return isObject(evidence?.source)
      ? evidence.source
      : null;
  }

  function getWebsiteSourceUrl(source = {}) {
    return (
      source?.sourceUrl ||
      source?.canonicalUrl ||
      source?.url ||
      null
    );
  }

  function getItemUrl(item = {}, fallback = null) {
    return (
      item?.url ||
      item?.postUrl ||
      item?.articleUrl ||
      item?.sourceUrl ||
      fallback ||
      null
    );
  }

  function compactWebsiteSource(source = {}) {
    const sourceUrl = getWebsiteSourceUrl(source);

    return {
      sourceUrl,
      canonicalUrl: source?.canonicalUrl || sourceUrl || null,
      sourcePlatform:
        source?.sourcePlatform ||
        source?.platform ||
        "website",
      title:
        cleanText(
          source?.title ||
          source?.headline ||
          ""
        ).slice(0, 220) || null,
      description:
        cleanText(
          source?.description ||
          source?.contentSnippet ||
          ""
        ).slice(0, 300) || null,
      visibleText:
        cleanText(
          source?.visibleText ||
          source?.contentSnippet ||
          source?.content ||
          ""
        ).slice(0, 700) || null,
      contentLength:
        Number(source?.contentLength) ||
        cleanText(source?.visibleText || "").length ||
        0,
      links: Array.isArray(source?.links)
        ? source.links
        : [],
      socialLinks: Array.isArray(source?.socialLinks)
        ? source.socialLinks
        : [],
      socialProfiles: Array.isArray(source?.socialProfiles)
        ? source.socialProfiles
        : []
    };
  }

  function compactLinkedInPost(item = {}, fallbackUrl = null) {
    return {
      id: item?.id ?? item?._id ?? item?.urn ?? null,
      url: getItemUrl(item, fallbackUrl),
      postUrl: item?.postUrl || getItemUrl(item, fallbackUrl),
      publishedDate:
        item?.publishedDate ||
        item?.publishedAt ||
        item?.datePublished ||
        item?.date ||
        item?.postedAt ||
        null,
      text:
        cleanText(
          item?.text ||
          item?.content ||
          item?.description ||
          item?.headline ||
          ""
        ).slice(0, 900) || null,
      title:
        cleanText(
          item?.title ||
          item?.headline ||
          ""
        ).slice(0, 220) || null,
      likes:
        item?.likes !== undefined && item?.likes !== null
          ? item.likes
          : null,
      comments:
        item?.comments !== undefined && item?.comments !== null
          ? item.comments
          : null
    };
  }

  function compactLinkedInArticle(item = {}, fallbackUrl = null) {
    return {
      id: item?.id ?? item?._id ?? item?.urn ?? null,
      url: getItemUrl(item, fallbackUrl),
      articleUrl:
        item?.articleUrl ||
        getItemUrl(item, fallbackUrl),
      publishedDate:
        item?.publishedDate ||
        item?.publishedAt ||
        item?.datePublished ||
        item?.date ||
        item?.postedAt ||
        null,
      title:
        cleanText(
          item?.title ||
          item?.headline ||
          ""
        ).slice(0, 300) || null,
      text:
        cleanText(
          item?.text ||
          item?.content ||
          item?.description ||
          ""
        ).slice(0, 1200) || null,
      likes:
        item?.likes !== undefined && item?.likes !== null
          ? item.likes
          : null,
      comments:
        item?.comments !== undefined && item?.comments !== null
          ? item.comments
          : null
    };
  }

  /*
   * FIXED RETENTION BOUNDARIES
   * --------------------------
   * These are intentional evidence-count limits for Loop 7.
   * Content inside retained evidence is still compressed.
   */
  const websiteSources =
    getWebsiteSources()
      .slice(0, MAX_WEBSITE_SOURCES)
      .map(compactWebsiteSource);

  const linkedinEvidence = getLinkedInEvidence();
  const linkedinSource = getLinkedInSource();

  const rawProfile =
    linkedinEvidence?.profile ||
    linkedinSource?.linkedinProfile ||
    null;

  const profile =
    rawProfile && typeof rawProfile === "object"
      ? {
          profileUrl:
            rawProfile?.profileUrl ||
            linkedinSource?.sourceUrl ||
            linkedinEvidence?.sourceUrl ||
            null,
          name:
            cleanText(rawProfile?.name || "")
              .slice(0, 120) || null,
          headline:
            cleanText(rawProfile?.headline || "")
              .slice(0, 500) || null,
          about:
            (() => {
              const about = cleanText(
                rawProfile?.about ||
                rawProfile?.summary ||
                ""
              );
              return about
                ? about.slice(
                    0,
                    Math.max(
                      1,
                      Math.floor(
                        about.length * PROFILE_TEXT_RATIO
                      )
                    )
                  )
                : null;
            })(),
          location:
            cleanText(rawProfile?.location || "")
              .slice(0, 120) || null,
          currentCompany:
            cleanText(
              rawProfile?.currentCompany || ""
            ).slice(0, 160) || null,
          followersCount:
            rawProfile?.followersCount ??
            linkedinEvidence?.followersCount ??
            null
        }
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

  const linkedinPosts =
    postsInput
      .slice(0, MAX_LINKEDIN_POSTS)
      .map(item =>
        compactLinkedInPost(
          item,
          linkedinSource?.sourceUrl ||
          linkedinEvidence?.sourceUrl ||
          null
        )
      );

  const linkedinArticles =
    articlesInput
      .slice(0, MAX_LINKEDIN_ARTICLES)
      .map(item =>
        compactLinkedInArticle(
          item,
          linkedinSource?.sourceUrl ||
          linkedinEvidence?.sourceUrl ||
          null
        )
      );

  const sourceUrls = [
    ...websiteSources.map(source => source.sourceUrl),
    ...linkedinPosts.map(post => post.url),
    ...linkedinArticles.map(article => article.url),
    profile?.profileUrl,
    linkedinSource?.sourceUrl ||
      linkedinEvidence?.sourceUrl ||
      null
  ].filter(Boolean);

  const uniqueSourceUrls = [
    ...new Set(sourceUrls)
  ];

  const loop7Package = {
    packageType: "Loop7EvidencePackage",
    version: PACKAGE_VERSION,

    profileLink:
      universalPackage?.primarySource ||
      universalPackage?.profileLink ||
      profile?.profileUrl ||
      null,

    evidenceUniverse: {
      sourceLinks: uniqueSourceUrls,

      sources: websiteSources,

      websiteInvestigation: {
        top5Investigated: websiteSources.map(
          source => ({
            url: source.sourceUrl,
            evidenceType: "retained-website-source"
          })
        )
      },

      websiteContent: {
        top5Articles: [],
        top5Posts: []
      },

      linkedinInvestigation: {
        profile,
        top3Posts: linkedinPosts,
        top1Article: linkedinArticles
      }
    },

    evidenceCoverage: {
      websitePagesInvestigated:
        websiteSources.length,
      websiteItemsRetained:
        websiteSources.length,
      linkedInProfilesInvestigated:
        profile ? 1 : 0,
      linkedInPostsRetained:
        linkedinPosts.length,
      linkedInArticlesRetained:
        linkedinArticles.length,
      totalSourcesReviewed:
        websiteSources.length +
        (profile ? 1 : 0)
    },

    /*
     * Preserve only upstream signal data when present.
     * No external AI call is made here.
     */
    signalMaster:
      isObject(universalPackage?.geminiSignals)
        ? compactObject(
            universalPackage.geminiSignals,
            500
          )
        : {},

    websiteEvidence: {
      sourceCount:
        websiteSources.length,
      sources: websiteSources
    },

    socialEvidence: profile
      ? [{
          platform: "linkedin",
          sourceCount: 1,
          url:
            profile.profileUrl ||
            linkedinSource?.sourceUrl ||
            null,
          profile,
          posts: linkedinPosts,
          articles: linkedinArticles
        }]
      : [],

    sourceLinks: uniqueSourceUrls,

    discoveredProfiles:
      profile?.profileUrl
        ? [profile.profileUrl]
        : Array.isArray(
            universalPackage?.discoveredProfiles
          )
          ? universalPackage.discoveredProfiles
          : [],

    platforms:
      Array.isArray(universalPackage?.platforms)
        ? universalPackage.platforms.slice(0, 20)
        : [],

    findings:
      Array.isArray(universalPackage?.findings)
        ? universalPackage.findings.slice(0, 20)
        : []
  };

  /*
   * FINAL CONTENT COMPRESSION
   * -------------------------
   * The retained evidence set is fixed above.
   * This pass only shortens strings so the whole package
   * stays within the 10,000-character transport budget.
   */
  const compressionPasses = [
    1.00,
    0.75,
    0.55,
    0.40,
    0.30,
    0.22,
    0.16,
    0.12,
    0.08,
    0.05
  ];

  let finalPackage = loop7Package;
  let finalSize =
    JSON.stringify(finalPackage).length;
  let usedRatio = 1;

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {

    for (const ratio of compressionPasses) {

      const candidate =
        compressTreeForBudget(
          loop7Package,
          ratio
        );

      const candidateSize =
        JSON.stringify(candidate).length;

      if (candidateSize <= MAX_TOTAL_PACKAGE_CHARS) {
        finalPackage = candidate;
        finalSize = candidateSize;
        usedRatio = ratio;
        break;
      }
    }

    if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
      const fallback =
        compressTreeForBudget(
          loop7Package,
          0.01
        );

      finalPackage = fallback;
      finalSize =
        JSON.stringify(finalPackage).length;
      usedRatio = 0.01;
    }
  }

  /*
   * Keep URLs, dates and IDs intact after compression.
   * If serialization is still over budget, fail closed.
   */
  finalSize =
    JSON.stringify(finalPackage).length;

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    console.error(
      "ECB_HARD_LOCK_EXCEEDED",
      JSON.stringify({
        finalSize,
        maxAllowed: MAX_TOTAL_PACKAGE_CHARS,
        retainedWebsiteSources:
          websiteSources.length,
        retainedLinkedInPosts:
          linkedinPosts.length,
        retainedLinkedInArticles:
          linkedinArticles.length
      })
    );

    return {
      success: false,
      reason:
        `Evidence package still exceeds ${MAX_TOTAL_PACKAGE_CHARS} characters after fixed evidence retention and content compression.`,
      loop7Package: null,
      compressionStats: {
        originalChars:
          JSON.stringify(universalPackage).length,
        compressedChars: finalSize,
        maxAllowedChars:
          MAX_TOTAL_PACKAGE_CHARS,
        filteringPerformed: true,
        linksModified: false
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
      originalChars:
        JSON.stringify(universalPackage).length,
      finalChars:
        finalSize,
      maxAllowedChars:
        MAX_TOTAL_PACKAGE_CHARS,
      websiteSources:
        websiteSources.length,
      linkedinPosts:
        linkedinPosts.length,
      linkedinArticles:
        linkedinArticles.length,
      profile:
        !!profile,
      profileTextRatio:
        PROFILE_TEXT_RATIO,
      contentCompressionRatio:
        usedRatio,
      filteringPerformed:
        true,
      linksModified:
        false
    })
  );

  void truthLoopPackage;

  return {
    success: true,
    loop7Package: finalPackage,
    compressionStats: {
      originalChars:
        JSON.stringify(universalPackage).length,
      compressedChars:
        finalSize,
      maxAllowedChars:
        MAX_TOTAL_PACKAGE_CHARS,
      websiteSources:
        websiteSources.length,
      linkedInPosts:
        linkedinPosts.length,
      linkedInArticles:
        linkedinArticles.length,
      linkedinProfiles:
        profile ? 1 : 0,
      profileTextRatio:
        PROFILE_TEXT_RATIO,
      contentCompressionRatio:
        usedRatio,
      filteringPerformed: true,
      linksModified: false
    }
  };
}

/*
 * Compress strings for the final transport budget.
 * Protected metadata/URL/id/date values are retained.
 */
function compressTreeForBudget(value, ratio, key = "") {

  const protectedKey = (() => {
    const k = String(key || "").toLowerCase();

    return (
      k === "url" ||
      k.endsWith("url") ||
      k === "uri" ||
      k === "href" ||
      k === "link" ||
      k.endsWith("link") ||
      k === "sourceurls" ||
      k === "sourcelinks" ||
      k === "profileurl" ||
      k === "posturl" ||
      k === "articleurl" ||
      k === "publisheddate" ||
      k === "publishedat" ||
      k === "datepublished" ||
      k === "date" ||
      k === "postedat" ||
      k === "createdat" ||
      k === "updatedat" ||
      k === "id" ||
      k === "_id" ||
      k === "urn"
    );
  })();

  if (typeof value === "string") {
    if (protectedKey) {
      return value;
    }

    const normalized =
      value
        .replace(/\u0000/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!normalized) return "";

    return normalized.slice(
      0,
      Math.max(
        1,
        Math.floor(
          normalized.length * ratio
        )
      )
    );
  }

  if (Array.isArray(value)) {
    return value.map(item =>
      compressTreeForBudget(
        item,
        ratio,
        key
      )
    );
  }

  if (value && typeof value === "object") {
    const result = {};

    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] =
        compressTreeForBudget(
          childValue,
          ratio,
          childKey
        );
    }

    return result;
  }

  return value;
}

export {
  loadEvidenceCompressionBrain
};
