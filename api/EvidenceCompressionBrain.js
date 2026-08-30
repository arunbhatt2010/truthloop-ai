/* =========================================================
   EVIDENCE COMPRESSION BRAIN v5
   TruthLoop AI

   Mission
   -------
   Compress evidence without filtering it.

   ECB is NOT:
   - an investigator
   - an evidence selector
   - a relevance scorer
   - a source ranker
   - a deduplicating evidence judge
   - a Gemini/Groq replacement

   ECB ONLY:
   - normalizes safe fields
   - compresses text to bounded sizes
   - preserves source URLs
   - preserves website articles/posts
   - preserves LinkedIn profile/about/followers/posts/articles
   - preserves upstream intelligence signals without inventing any
   - returns a stable Loop 7 package

   Upstream:
   - CrossEvidenceBrain / UniversalPublicEvidencePackage

   Downstream:
   - Loop 7 / final investigation
   ========================================================= */

const MAX_SOURCES = 20;
const MAX_SOURCE_TEXT_CHARS = 3500;
const MAX_WEBSITE_ITEMS = 10;
const MAX_LINKEDIN_POSTS = 10;
const MAX_LINKEDIN_ARTICLES = 10;
const MAX_ITEM_TEXT_CHARS = 900;
const MAX_ABOUT_CHARS = 1800;
const MAX_TOTAL_PACKAGE_CHARS = 14000;

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
    publicEvidencePackage?.universalPackage ||
    publicEvidencePackage ||
    {};

  const sources = Array.isArray(universalPackage?.websiteEvidence?.sources)
    ? universalPackage.websiteEvidence.sources
    : Array.isArray(universalPackage?.sources)
      ? universalPackage.sources
      : Array.isArray(publicEvidencePackage?.websiteEvidence?.sources)
        ? publicEvidencePackage.websiteEvidence.sources
        : Array.isArray(publicEvidencePackage?.sources)
          ? publicEvidencePackage.sources
          : [];

  const linkedinEvidence =
    universalPackage?.linkedinEvidence ||
    publicEvidencePackage?.linkedinEvidence ||
    null;

  const intelligence =
    universalPackage?.geminiSignals &&
    typeof universalPackage.geminiSignals === "object"
      ? universalPackage.geminiSignals
      : universalPackage?.intelligence &&
        typeof universalPackage.intelligence === "object"
        ? universalPackage.intelligence
        : publicEvidencePackage?.geminiSignals &&
          typeof publicEvidencePackage.geminiSignals === "object"
          ? publicEvidencePackage.geminiSignals
          : {};

  function cleanText(value = "", maxChars = MAX_SOURCE_TEXT_CHARS) {
    if (typeof value !== "string") return "";
    return value
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
  }

  function normalizeUrl(value = "") {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const u = new URL(value.trim());
      if (!/^https?:$/.test(u.protocol)) return "";
      return u.toString();
    } catch {
      return "";
    }
  }

  function detectPlatform(value = "") {
    const url = String(value || "").toLowerCase();
    if (url.includes("linkedin.com")) return "linkedin";
    if (url.includes("github.com")) return "github";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("instagram.com")) return "instagram";
    if (url.includes("facebook.com")) return "facebook";
    if (url.includes("x.com") || url.includes("twitter.com")) return "x";
    return "website";
  }

  function compactItem(item = {}, fallbackUrl = "") {
    if (typeof item === "string") {
      return {
        title: cleanText("", 180) || null,
        text: cleanText(item, MAX_ITEM_TEXT_CHARS) || null,
        url: normalizeUrl(fallbackUrl) || null
      };
    }

    return {
      title: cleanText(item?.title || "", 180) || null,
      text: cleanText(
        item?.text ||
        item?.content ||
        item?.description ||
        "",
        MAX_ITEM_TEXT_CHARS
      ) || null,
      url: normalizeUrl(
        item?.url ||
        item?.sourceUrl ||
        fallbackUrl ||
        ""
      ) || null,
      publishedDate:
        item?.publishedDate ||
        item?.publishedAt ||
        item?.date ||
        item?.postedAt ||
        null,
      likes:
        item?.likes !== undefined && item?.likes !== null
          ? item.likes
          : null
    };
  }

  /*
   * IMPORTANT:
   * This is preservation, not filtering.
   * We keep the first N items already supplied upstream.
   * ECB does not score, rank, or decide which item is important.
   */
  function preserveItems(items = [], limit = 10, fallbackUrl = "") {
    if (!Array.isArray(items)) return [];
    return items
      .slice(0, limit)
      .map(item => compactItem(item, fallbackUrl))
      .filter(item => item.url || item.text || item.title);
  }

  const websiteSources = sources.filter(source =>
    detectPlatform(
      source?.sourceUrl ||
      source?.url ||
      ""
    ) === "website"
  );

  const linkedinSources =
    linkedinEvidence?.source
      ? [linkedinEvidence.source]
      : sources.filter(source =>
          detectPlatform(
            source?.sourceUrl ||
            source?.canonicalUrl ||
            source?.url ||
            ""
          ) === "linkedin"
        );

  const websiteArticles = [];
  const websitePosts = [];

  for (const source of websiteSources) {
    const sourceUrl =
      normalizeUrl(source?.sourceUrl || source?.url || "") || null;

    websiteArticles.push(
      ...preserveItems(
        Array.isArray(source?.articles) ? source.articles : [],
        MAX_WEBSITE_ITEMS,
        sourceUrl || ""
      )
    );

    websitePosts.push(
      ...preserveItems(
        Array.isArray(source?.posts) ? source.posts : [],
        MAX_WEBSITE_ITEMS,
        sourceUrl || ""
      )
    );
  }

  const linkedinSource =
    linkedinEvidence?.source ||
    linkedinSources[0] ||
    null;

  const linkedinSourceUrl =
    normalizeUrl(
      linkedinEvidence?.sourceUrl ||
      linkedinSource?.sourceUrl ||
      linkedinSource?.url ||
      ""
    ) || null;

  const rawLinkedinProfile =
    linkedinEvidence?.profile &&
    typeof linkedinEvidence.profile === "object"
      ? linkedinEvidence.profile
      : linkedinSource?.linkedinProfile &&
        typeof linkedinSource.linkedinProfile === "object"
        ? linkedinSource.linkedinProfile
        : {};

  const linkedinProfile = (linkedinSource || linkedinEvidence)
    ? {
        profileUrl:
          normalizeUrl(
            rawLinkedinProfile?.profileUrl ||
            linkedinSourceUrl ||
            ""
          ) || null,
        name:
          rawLinkedinProfile?.name ||
          linkedinSource?.title ||
          null,
        headline:
          rawLinkedinProfile?.headline ||
          linkedinSource?.description ||
          null,
        about:
          cleanText(
            linkedinEvidence?.about ||
            rawLinkedinProfile?.about ||
            rawLinkedinProfile?.summary ||
            "",
            MAX_ABOUT_CHARS
          ) || null,
        location:
          rawLinkedinProfile?.location || null,
        currentCompany:
          rawLinkedinProfile?.currentCompany || null,
        followersCount:
          linkedinEvidence?.followersCount ??
          rawLinkedinProfile?.followersCount ??
          null
      }
    : null;

  const linkedinPosts = preserveItems(
    linkedinEvidence?.posts ||
    linkedinSource?.posts ||
    [],
    MAX_LINKEDIN_POSTS,
    linkedinSourceUrl || ""
  );

  const linkedinArticles = preserveItems(
    linkedinEvidence?.articles ||
    linkedinSource?.articles ||
    [],
    MAX_LINKEDIN_ARTICLES,
    linkedinSourceUrl || ""
  );

  const websiteLinks = [];
  for (const source of websiteSources) {
    const links = [
      ...(Array.isArray(source?.contentCandidates) ? source.contentCandidates : []),
      ...(Array.isArray(source?.articles) ? source.articles : []),
      ...(Array.isArray(source?.posts) ? source.posts : [])
    ];

    for (const item of links) {
      const url = normalizeUrl(
        item?.url ||
        item?.sourceUrl ||
        ""
      );
      if (url) websiteLinks.push(url);
    }

    const sourceUrl = normalizeUrl(source?.sourceUrl || source?.url || "");
    if (sourceUrl) websiteLinks.push(sourceUrl);
  }

  const unique = values =>
    [...new Set(values.filter(Boolean))];

  const preservedWebsiteUrls =
    unique(websiteLinks).slice(0, MAX_WEBSITE_ITEMS);

  const preservedLinkedInUrls =
    unique([
      linkedinProfile?.profileUrl,
      ...linkedinPosts.map(item => item.url),
      ...linkedinArticles.map(item => item.url)
    ]);

  const rawSourcePackages = sources
    .slice(0, MAX_SOURCES)
    .map(source => {
      const sourceUrl =
        normalizeUrl(source?.sourceUrl || source?.url || "");

      return {
        sourceUrl: sourceUrl || null,
        sourcePlatform:
          source?.sourcePlatform ||
          source?.platform ||
          detectPlatform(sourceUrl),
        sourceHost: source?.sourceHost || null,
        title: cleanText(source?.title || "", 180) || null,
        description: cleanText(source?.description || "", 300) || null,
        visibleText:
          cleanText(
            source?.visibleText ||
            source?.contentSnippet ||
            "",
            MAX_SOURCE_TEXT_CHARS
          ) || null,
        contentLength:
          Number(source?.contentLength) ||
          String(source?.visibleText || "").length ||
          0,
        socialLinks: Array.isArray(source?.socialLinks)
          ? source.socialLinks.map(normalizeUrl).filter(Boolean)
          : [],
        socialProfiles: Array.isArray(source?.socialProfiles)
          ? source.socialProfiles.map(normalizeUrl).filter(Boolean)
          : [],
        links: Array.isArray(source?.links)
          ? source.links.map(normalizeUrl).filter(Boolean)
          : [],
        articles: preserveItems(
          source?.articles || [],
          MAX_LINKEDIN_ARTICLES,
          sourceUrl
        ),
        posts: preserveItems(
          source?.posts || [],
          MAX_LINKEDIN_POSTS,
          sourceUrl
        ),
        linkedinProfile:
          source?.linkedinProfile &&
          typeof source.linkedinProfile === "object"
            ? {
                profileUrl:
                  normalizeUrl(
                    source.linkedinProfile?.profileUrl ||
                    sourceUrl ||
                    ""
                  ) || null,
                name:
                  source.linkedinProfile?.name || null,
                headline:
                  source.linkedinProfile?.headline || null,
                about:
                  cleanText(
                    source.linkedinProfile?.about || "",
                    MAX_ABOUT_CHARS
                  ) || null,
                location:
                  source.linkedinProfile?.location || null,
                currentCompany:
                  source.linkedinProfile?.currentCompany || null,
                followersCount:
                  source.linkedinProfile?.followersCount ??
                  null
              }
            : null,
        publicEvidence: Array.isArray(source?.publicEvidence)
          ? source.publicEvidence.slice(0, 50)
          : [],
        evidence: Array.isArray(source?.evidence)
          ? source.evidence.slice(0, 20)
          : []
      };
    });

  /*
   * ECB does not create new intelligence.
   * It only carries forward already-generated upstream intelligence.
   * Gemini, if present upstream, remains signal intelligence only.
   */
  const signalMaster = {
    identity: intelligence?.identity || {},
    positioning: intelligence?.positioning || [],
    niches: intelligence?.niches || [],
    expertiseSignals: intelligence?.expertiseSignals || [],
    audienceSignals: intelligence?.audienceSignals || [],
    businessSignals: intelligence?.businessSignals || [],
    creatorSignals: intelligence?.creatorSignals || [],
    topics: intelligence?.topics || [],
    recurringTopics:
      intelligence?.recurringTopics ||
      intelligence?.topics ||
      [],
    behavioralSignals: intelligence?.behavioralSignals || [],
    contradictions: intelligence?.contradictions || [],
    findings: intelligence?.findings || [],
    crossSourceSignals:
      intelligence?.investigation?.crossSourceSignals || []
  };

  const loop7Package = {
    packageType: "Loop7EvidencePackage",
    version: "5.0",

    profileLink:
      universalPackage?.primarySource ||
      universalPackage?.investigationSources?.mainProfile ||
      universalPackage?.sourceLinks?.[0] ||
      rawSourcePackages?.[0]?.sourceUrl ||
      null,

    /*
     * PRESERVED EVIDENCE
     * No relevance filtering happens here.
     */
    evidenceUniverse: {
      sourceLinks: unique([
        ...(Array.isArray(universalPackage?.sourceLinks)
          ? universalPackage.sourceLinks.map(normalizeUrl)
          : []),
        ...rawSourcePackages.map(source => source.sourceUrl),
        ...preservedWebsiteUrls,
        ...preservedLinkedInUrls
      ]).slice(0, MAX_SOURCES),

      sources: rawSourcePackages,

      websiteInvestigation: {
        top10Investigated: preservedWebsiteUrls.map(url => ({
          url,
          evidenceType: "selected-upstream-public-source"
        }))
      },

      websiteContent: {
        top10Articles: websiteArticles.slice(0, MAX_WEBSITE_ITEMS),
        top10Posts: websitePosts.slice(0, MAX_WEBSITE_ITEMS)
      },

      linkedinInvestigation: {
        profile: linkedinProfile,
        top10Posts: linkedinPosts.slice(0, MAX_LINKEDIN_POSTS),
        top10Articles: linkedinArticles.slice(0, MAX_LINKEDIN_ARTICLES)
      }
    },

    evidenceCoverage: {
      websitePagesInvestigated: websiteSources.length,
      websiteArticlesPreserved:
        websiteArticles.length,
      websitePostsPreserved:
        websitePosts.length,
      linkedInProfilesInvestigated:
        linkedinProfile ? 1 : 0,
      linkedInPostsPreserved:
        linkedinPosts.length,
      linkedInArticlesPreserved:
        linkedinArticles.length,
      totalSourcesReviewed:
        rawSourcePackages.length
    },

    /*
     * Signal Master output only.
     * These fields contain upstream intelligence;
     * ECB does not generate, rank, or filter them.
     */
    signalMaster,

    /* Backward-compatible aliases for Loop 7 consumers. */
    websiteEvidence: {
      sourceCount: websiteSources.length,
      sources: websiteSources
        .slice(0, MAX_WEBSITE_ITEMS)
        .map(source => ({
          sourceUrl:
            normalizeUrl(source?.sourceUrl || source?.url || "") || null,
          title: cleanText(source?.title || "", 180) || null,
          content:
            cleanText(
              source?.visibleText ||
              source?.contentSnippet ||
              "",
              MAX_SOURCE_TEXT_CHARS
            ) || null
        }))
    },

    socialEvidence: linkedinSource
      ? [{
          platform: "linkedin",
          sourceCount: 1,
          url: linkedinSourceUrl,
          profile: linkedinProfile,
          posts: linkedinPosts,
          articles: linkedinArticles
        }]
      : [],

    sourceLinks: unique([
      universalPackage?.primarySource || "",
      ...(Array.isArray(universalPackage?.sourceLinks)
        ? universalPackage.sourceLinks
        : []),
      ...(Array.isArray(universalPackage?.websiteEvidence?.sourceUrls)
        ? universalPackage.websiteEvidence.sourceUrls
        : []),
      ...(linkedinEvidence?.sourceUrl
        ? [linkedinEvidence.sourceUrl]
        : [])
    ].map(normalizeUrl)).slice(0, MAX_SOURCES),

    discoveredProfiles:
      unique([
        ...(Array.isArray(universalPackage?.discoveredProfiles)
          ? universalPackage.discoveredProfiles
          : []),
        ...(linkedinProfile?.profileUrl
          ? [linkedinProfile.profileUrl]
          : [])
      ]),

    platforms:
      Array.isArray(universalPackage?.platforms)
        ? universalPackage.platforms.slice(0, 20)
        : [],

    findings:
      Array.isArray(universalPackage?.findings)
        ? universalPackage.findings.slice(0, 20)
        : []
  };

  let packageSize = JSON.stringify(loop7Package).length;

  /*
   * Deterministic compression only.
   * No source/item is scored or filtered for relevance.
   */
  if (packageSize > MAX_TOTAL_PACKAGE_CHARS) {
    loop7Package.evidenceUniverse.sources =
      loop7Package.evidenceUniverse.sources.map(source => ({
        ...source,
        visibleText:
          cleanText(
            source.visibleText || "",
            1800
          ),
        publicEvidence:
          Array.isArray(source.publicEvidence)
            ? source.publicEvidence.slice(0, 30)
            : [],
        evidence:
          Array.isArray(source.evidence)
            ? source.evidence.slice(0, 12)
            : []
      }));

    packageSize = JSON.stringify(loop7Package).length;
  }

  console.log(
    "ECB_COMPRESSION_AUDIT",
    {
      inputSources: sources.length,
      websiteSources: websiteSources.length,
      linkedinSources: linkedinSources.length,
      websiteArticleCount: websiteArticles.length,
      websitePostCount: websitePosts.length,
      linkedinPostCount: linkedinPosts.length,
      linkedinArticleCount: linkedinArticles.length,
      linkedinProfile: !!linkedinProfile,
      signalMasterKeys: Object.keys(signalMaster),
      packageSize
    }
  );

  void truthLoopPackage;

  return {
    success: true,
    loop7Package,
    compressionStats: {
      originalSources: sources.length,
      preservedSources: loop7Package.evidenceUniverse.sources.length,
      websiteSources: websiteSources.length,
      linkedinProfiles: linkedinProfile ? 1 : 0,
      websiteArticlesPreserved: websiteArticles.length,
      websitePostsPreserved: websitePosts.length,
      linkedinPostsPreserved: linkedinPosts.length,
      linkedinArticlesPreserved: linkedinArticles.length,
      compressedChars: packageSize,
      filteringPerformed: false
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
