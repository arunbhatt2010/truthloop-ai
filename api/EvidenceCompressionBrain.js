/* =========================================================
   EVIDENCE COMPRESSION BRAIN — FINAL LOOP 7
   TruthLoop AI

   Fixed retention:
   - Website sources: max 5
   - LinkedIn posts: dynamically retained, max 9 and minimum 3 when additional source items are present
   - LinkedIn articles: max 1
   - GitHub: preserved when available
   - X: profile + latest post + latest reply when available
   - Reddit: profile + latest post + latest 2 comments when available
   - LinkedIn profile: text ~1/10
   - Signals: text ~1/10, bounded arrays

   Protected:
   - URLs / URL lists for retained evidence
   - IDs
   - dates
   - titles / headings

   Output:
   - preferred target <= 6,500 chars
   - absolute hard lock <= 10,000 chars
   - no external API/model calls
   ========================================================= */

const MAX_TOTAL_PACKAGE_CHARS = 10000;
const TARGET_PACKAGE_CHARS = 6500;

const MAX_WEBSITE_SOURCES = 5;
const MAX_LINKEDIN_POSTS = 9;
const MIN_LINKEDIN_POSTS = 3;
const MAX_LINKEDIN_ARTICLES = 1;

const CONTENT_RATIO = 0.10;
const PROFILE_RATIO = 0.10;
const SIGNAL_RATIO = 0.10;
const SIGNAL_ARRAY_RATIO = 0.10;

const CONTENT_MAX_CHARS = 500;
const PROFILE_MAX_CHARS = 800;
const SIGNAL_MAX_CHARS = 300;

const PACKAGE_VERSION = "15.0";

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

  const compressText = (
    value,
    ratio,
    maxChars
  ) => {
    const text = cleanText(value);
    if (!text) return null;

    return text.slice(
      0,
      Math.min(
        maxChars,
        Math.max(
          1,
          Math.floor(text.length * ratio)
        )
      )
    );
  };

  const getUrl = item =>
    item?.url ||
    item?.sourceUrl ||
    item?.canonicalUrl ||
    item?.postUrl ||
    item?.articleUrl ||
    null;

  const getDate = item =>
    item?.publishedDate ||
    item?.publishedAt ||
    item?.datePublished ||
    item?.postedAt ||
    item?.date ||
    null;

  const getId = item =>
    item?.id ??
    item?._id ??
    item?.urn ??
    null;

  // Generic 1/10 content compressor for cross-platform source objects.
  // Keep traceability metadata intact while compressing text leaves.
  const isProtectedUniversalKey = key => {
    const k = String(key || "").toLowerCase();
    return (
      k.includes("url") ||
      k.includes("link") ||
      k === "id" ||
      k === "_id" ||
      k === "urn" ||
      k.includes("date") ||
      k.includes("published") ||
      k.includes("posted") ||
      k === "timestamp" ||
      k.includes("title") ||
      k.includes("heading")
    );
  };

  const compressUniversalSource = (value, key = "") => {
    if (value == null) return value;

    if (typeof value === "string") {
      if (isProtectedUniversalKey(key)) return cleanText(value);
      return compressText(value, CONTENT_RATIO, CONTENT_MAX_CHARS);
    }

    if (Array.isArray(value)) {
      return value.map(item => compressUniversalSource(item, key));
    }

    if (typeof value === "object") {
      const result = {};
      for (const [childKey, childValue] of Object.entries(value)) {
        result[childKey] = compressUniversalSource(childValue, childKey);
      }
      return result;
    }

    return value;
  };

  const websiteInput =
    Array.isArray(universalPackage?.websiteEvidence?.sources)
      ? universalPackage.websiteEvidence.sources
      : [];

  const websiteSources =
    websiteInput
      .slice(0, MAX_WEBSITE_SOURCES)
      .map((source, index) => ({
        sourceId: `SOURCE_${String(index + 1).padStart(2, "0")}`,
        sourceType: "website",
        url:
          getUrl(source),

        title:
          firstText(
            source?.title,
            source?.headline
          ).slice(0, 240) || null,

        date:
          getDate(source),

        content:
          compressText(
            firstText(
              source?.visibleText,
              source?.contentSnippet,
              source?.content,
              source?.body,
              source?.description
            ),
            CONTENT_RATIO,
            CONTENT_MAX_CHARS
          )
      }));

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

  const profile =
    profileInput
      ? {
          profileUrl:
            profileInput?.profileUrl ||
            linkedinSource?.sourceUrl ||
            linkedinEvidence?.sourceUrl ||
            null,

          name:
            firstText(profileInput?.name)
              .slice(0, 160) || null,

          headline:
            compressText(
              profileInput?.headline,
              PROFILE_RATIO,
              PROFILE_MAX_CHARS
            ),

          about:
            compressText(
              firstText(
                profileInput?.about,
                profileInput?.summary,
                profileInput?.bio
              ),
              PROFILE_RATIO,
              PROFILE_MAX_CHARS
            ),

          location:
            firstText(profileInput?.location)
              .slice(0, 160) || null,

          currentCompany:
            firstText(
              typeof profileInput?.currentCompany === "string"
                ? profileInput.currentCompany
                : profileInput?.currentCompany?.name ||
                  profileInput?.currentCompany?.companyName
            ).slice(0, 180) || null,

          followersCount:
            profileInput?.followersCount ??
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

  const githubEvidence =
    universalPackage?.githubEvidence &&
    typeof universalPackage.githubEvidence === "object"
      ? universalPackage.githubEvidence
      : null;

  const xEvidence =
    universalPackage?.xEvidence &&
    typeof universalPackage.xEvidence === "object"
      ? universalPackage.xEvidence
      : null;

  const redditEvidence =
    universalPackage?.redditEvidence &&
    typeof universalPackage.redditEvidence === "object"
      ? universalPackage.redditEvidence
      : null;

  const githubItemCount = githubEvidence ? 1 : 0;
  const xItemCount =
    (xEvidence?.profile ? 1 : 0) +
    (xEvidence?.latestPost ? 1 : 0) +
    (xEvidence?.latestComment ? 1 : 0);
  const redditItemCount =
    (redditEvidence?.profile ? 1 : 0) +
    (redditEvidence?.latestPost ? 1 : 0) +
    (Array.isArray(redditEvidence?.latestComments)
      ? redditEvidence.latestComments.length
      : 0);

  const additionalEvidenceItemCount =
    githubItemCount + xItemCount + redditItemCount;

  const dynamicLinkedInPostLimit =
    Math.max(
      MIN_LINKEDIN_POSTS,
      MAX_LINKEDIN_POSTS - additionalEvidenceItemCount
    );

  const linkedinPosts =
    postsInput
      .slice(0, MAX_LINKEDIN_POSTS)
      .map((item, index) => ({
        sourceId: `SOURCE_${String(websiteSources.length + (profile ? 1 : 0) + index + 1).padStart(2, "0")}`,
        sourceType: "linkedin_post",
        id:
          getId(item),

        url:
          item?.postUrl ||
          item?.url ||
          item?.sourceUrl ||
          linkedinSource?.sourceUrl ||
          null,

        date:
          getDate(item),

        title:
          firstText(
            item?.title,
            item?.headline
          ).slice(0, 220) || null,

        content:
          compressText(
            firstText(
              item?.text,
              item?.content,
              item?.description,
              item?.headline
            ),
            CONTENT_RATIO,
            CONTENT_MAX_CHARS
          ),

        likes:
          item?.likes ?? null,

        comments:
          item?.comments ?? null
      }));

  const linkedinArticles =
    articlesInput
      .slice(0, MAX_LINKEDIN_ARTICLES)
      .map((item, index) => ({
        sourceId: `SOURCE_${String(websiteSources.length + (profile ? 1 : 0) + linkedinPosts.length + index + 1).padStart(2, "0")}`,
        sourceType: "linkedin_article",
        id:
          getId(item),

        url:
          item?.articleUrl ||
          item?.url ||
          item?.sourceUrl ||
          linkedinSource?.sourceUrl ||
          null,

        date:
          getDate(item),

        title:
          firstText(
            item?.title,
            item?.headline
          ).slice(0, 280) || null,

        content:
          compressText(
            firstText(
              item?.text,
              item?.content,
              item?.description
            ),
            CONTENT_RATIO,
            CONTENT_MAX_CHARS
          ),

        likes:
          item?.likes ?? null,

        comments:
          item?.comments ?? null
      }));

  const githubSource =
    githubEvidence
      ? compressUniversalSource(githubEvidence)
      : null;

  const xSource =
    xEvidence
      ? compressUniversalSource(xEvidence)
      : null;

  const redditSource =
    redditEvidence
      ? compressUniversalSource(redditEvidence)
      : null;

  /*
   * Keep URLs only for retained evidence.
   * They are never shortened or rewritten.
   */
  const sourceLinks = [
    ...new Set([
      ...websiteSources.map(item => item.url),
      profile?.profileUrl,
      ...linkedinPosts.map(item => item.url),
      ...linkedinArticles.map(item => item.url),
      githubSource?.url,
      githubSource?.sourceUrl,
      githubSource?.canonicalUrl,
      xSource?.sourceUrl,
      xSource?.canonicalUrl,
      xSource?.profile?.profileUrl,
      xSource?.latestPost?.url,
      xSource?.latestComment?.url,
      redditSource?.sourceUrl,
      redditSource?.canonicalUrl,
      redditSource?.profile?.profileUrl,
      redditSource?.latestPost?.url,
      ...(Array.isArray(redditSource?.latestComments)
        ? redditSource.latestComments.map(item => item?.url)
        : [])
    ].filter(Boolean))
  ];

  /*
   * Compress upstream signal content to ~1/10.
   * Signal arrays are bounded to ~10% of input items, max 3 per family.
   */
  const rawSignals =
    universalPackage?.geminiSignals &&
    typeof universalPackage.geminiSignals === "object"
      ? universalPackage.geminiSignals
      : universalPackage?.signalMaster &&
        typeof universalPackage.signalMaster === "object"
        ? universalPackage.signalMaster
        : {};

  const isProtectedSignalKey = key => {
    const k = String(key || "").toLowerCase();

    return (
      k.includes("url") ||
      k.includes("link") ||
      k === "id" ||
      k === "_id" ||
      k === "urn" ||
      k.includes("date") ||
      k.includes("published") ||
      k.includes("posted") ||
      k === "timestamp"
    );
  };

  const compressSignals = (value, key = "") => {

    if (typeof value === "string") {
      return compressText(
        value,
        SIGNAL_RATIO,
        SIGNAL_MAX_CHARS
      );
    }

    if (Array.isArray(value)) {

      if (!value.length) return [];

      const keep = Math.max(
        1,
        Math.min(
          3,
          Math.ceil(
            value.length *
            SIGNAL_ARRAY_RATIO
          )
        )
      );

      return value
        .slice(0, keep)
        .map(item =>
          compressSignals(
            item,
            key
          )
        );
    }

    if (value && typeof value === "object") {

      const result = {};

      for (const [childKey, childValue] of Object.entries(value)) {

        if (
          isProtectedSignalKey(childKey)
        ) {
          result[childKey] = childValue;
          continue;
        }

        result[childKey] =
          compressSignals(
            childValue,
            childKey
          );
      }

      return result;
    }

    return value;
  };

  const signalMaster =
    compressSignals(rawSignals);

  /*
   * Full source registry for traceability.
   * Every retained evidence item gets a stable SOURCE_XX identifier.
   * Registry metadata is NOT content-compressed away.
   */
  let sourceIndex = 1;
  const nextSourceId = () =>
    `SOURCE_${String(sourceIndex++).padStart(2, "0")}`;

  const sourceRegistry = [];

  for (const source of websiteSources) {
    source.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: source.sourceId,
      sourceType: source.sourceType || "website",
      title: source.title || null,
      url: source.url || null,
      date: source.date || null
    });
  }

  if (profile) {
    profile.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: profile.sourceId,
      sourceType: "linkedin_profile",
      title: profile.name || "LinkedIn Profile",
      url: profile.profileUrl || null,
      date: null
    });
  }

  for (const post of linkedinPosts) {
    post.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: post.sourceId,
      sourceType: "linkedin_post",
      title: post.title || post.content || "LinkedIn Post",
      url: post.url || null,
      date: post.date || null
    });
  }

  for (const article of linkedinArticles) {
    article.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: article.sourceId,
      sourceType: "linkedin_article",
      title: article.title || article.content || "LinkedIn Article",
      url: article.url || null,
      date: article.date || null
    });
  }

  if (githubSource) {
    githubSource.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: githubSource.sourceId,
      sourceType: "github",
      title: githubSource.title || githubSource.name || "GitHub",
      url: githubSource.url || githubSource.sourceUrl || githubSource.canonicalUrl || null,
      date: githubSource.date || githubSource.updatedAt || null
    });
  }

  if (xSource?.profile) {
    xSource.profile.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: xSource.profile.sourceId,
      sourceType: "x_profile",
      title: xSource.profile.displayName || xSource.profile.name || xSource.profile.username || "X Profile",
      url: xSource.profile.profileUrl || xSource.sourceUrl || null,
      date: null
    });
  }

  if (xSource?.latestPost) {
    xSource.latestPost.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: xSource.latestPost.sourceId,
      sourceType: "x_post",
      title: xSource.latestPost.title || xSource.latestPost.text || "X Post",
      url: xSource.latestPost.url || null,
      date: xSource.latestPost.date || null
    });
  }

  if (xSource?.latestComment) {
    xSource.latestComment.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: xSource.latestComment.sourceId,
      sourceType: "x_reply",
      title: xSource.latestComment.title || xSource.latestComment.text || "X Reply",
      url: xSource.latestComment.url || null,
      date: xSource.latestComment.date || null
    });
  }

  if (redditSource?.profile) {
    redditSource.profile.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: redditSource.profile.sourceId,
      sourceType: "reddit_profile",
      title: redditSource.profile.displayName || redditSource.profile.username || "Reddit Profile",
      url: redditSource.profile.profileUrl || redditSource.sourceUrl || null,
      date: redditSource.profile.createdAt || null
    });
  }

  if (redditSource?.latestPost) {
    redditSource.latestPost.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: redditSource.latestPost.sourceId,
      sourceType: "reddit_post",
      title: redditSource.latestPost.title || redditSource.latestPost.text || "Reddit Post",
      url: redditSource.latestPost.url || null,
      date: redditSource.latestPost.date || null
    });
  }

  for (const comment of Array.isArray(redditSource?.latestComments)
    ? redditSource.latestComments
    : []) {
    comment.sourceId = nextSourceId();
    sourceRegistry.push({
      sourceId: comment.sourceId,
      sourceType: "reddit_comment",
      title: comment.title || comment.text || "Reddit Comment",
      url: comment.url || null,
      date: comment.date || null
    });
  }


  /*
   * Single compact representation.
   * Content is compressed; source identity/traceability is preserved.
   */
  const buildLoop7Package = () => ({
    packageType:
      "Loop7EvidencePackage",

    version:
      PACKAGE_VERSION,

    profileLink:
      universalPackage?.primarySource ||
      universalPackage?.profileLink ||
      profile?.profileUrl ||
      linkedinSource?.sourceUrl ||
      null,

    evidenceUniverse: {

      sourceLinks,

      sourceRegistry,

      websiteSources:
        websiteSources.map(source => ({
          sourceId: source.sourceId,
          sourceType: source.sourceType,
          url: source.url,
          title: source.title,
          date: source.date,
          content: source.content
        })),

      linkedinProfile:
        profile
          ? {
              sourceId:
                profile.sourceId,

              sourceType:
                profile.sourceType,

              profileUrl:
                profile.profileUrl,

              name:
                profile.name,

              headline:
                profile.headline,

              about:
                profile.about,

              location:
                profile.location,

              currentCompany:
                profile.currentCompany,

              followersCount:
                profile.followersCount
            }
          : null,

      linkedinPosts:
        linkedinPosts.map(post => ({
          sourceId: post.sourceId,
          sourceType: post.sourceType,
          id: post.id,
          url: post.url,
          date: post.date,
          title: post.title,
          content: post.content,
          likes: post.likes,
          comments: post.comments
        })),

      linkedinArticles:
        linkedinArticles.map(article => ({
          sourceId: article.sourceId,
          sourceType: article.sourceType,
          id: article.id,
          url: article.url,
          date: article.date,
          title: article.title,
          content: article.content,
          likes: article.likes,
          comments: article.comments
        })),

      githubEvidence: githubSource,

      xEvidence: xSource,

      redditEvidence: redditSource,

      signalMaster
    },

    evidenceCoverage: {
      websiteSourcesRetained:
        websiteSources.length,

      linkedinProfileRetained:
        profile ? 1 : 0,

      linkedinPostsRetained:
        linkedinPosts.length,

      linkedinArticlesRetained:
        linkedinArticles.length,

      githubSourcesRetained:
        githubSource ? 1 : 0,

      xProfileRetained:
        xSource?.profile ? 1 : 0,

      xPostRetained:
        xSource?.latestPost ? 1 : 0,

      xReplyRetained:
        xSource?.latestComment ? 1 : 0,

      redditProfileRetained:
        redditSource?.profile ? 1 : 0,

      redditPostRetained:
        redditSource?.latestPost ? 1 : 0,

      redditCommentsRetained:
        Array.isArray(redditSource?.latestComments)
          ? redditSource.latestComments.length
          : 0,

      additionalEvidenceItemsRetained:
        additionalEvidenceItemCount,

      linkedInPostLimitApplied:
        dynamicLinkedInPostLimit,

      urlsRetained:
        sourceLinks.length,

      evidenceSourcesRetained:
        sourceRegistry.length
    }
  });

  const finalPackage =
    buildLoop7Package();

  const finalSize =
    JSON.stringify(finalPackage).length;

  /*
   * The fixed 1/10 rule plus per-field safeguards should normally
   * keep the package below the preferred target.
   *
   * We do not silently delete URLs to solve an overflow.
   */
  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {

    console.error(
      "ECB_HARD_LOCK_EXCEEDED",
      JSON.stringify({
        finalSize,
        maxAllowed:
          MAX_TOTAL_PACKAGE_CHARS,
        target:
          TARGET_PACKAGE_CHARS,
        websiteSources:
          websiteSources.length,
        linkedinPosts:
          linkedinPosts.length,
        linkedinArticles:
          linkedinArticles.length,
        githubSources:
          githubSource ? 1 : 0,
        xItems:
          xItemCount,
        redditItems:
          redditItemCount,
        additionalEvidenceItems:
          additionalEvidenceItemCount,
        linkedinPostLimit:
          dynamicLinkedInPostLimit,
        urlsRetained:
          sourceLinks.length
      })
    );

    return {
      success: false,
      reason:
        "Protected retained evidence URLs/metadata exceed the 10,000-character hard lock.",
      loop7Package: null,
      compressionStats: {
        originalChars:
          JSON.stringify(universalPackage).length,
        compressedChars:
          finalSize,
        targetChars:
          TARGET_PACKAGE_CHARS,
        maxAllowedChars:
          MAX_TOTAL_PACKAGE_CHARS,
        websiteSources:
          websiteSources.length,
        linkedinPosts:
          linkedinPosts.length,
        linkedinArticles:
          linkedinArticles.length,
        urlsRetained:
          sourceLinks.length,
        contentRatio:
          CONTENT_RATIO,
        profileRatio:
          PROFILE_RATIO,
        signalRatio:
          SIGNAL_RATIO,
        linksModified:
          false
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

      targetChars:
        TARGET_PACKAGE_CHARS,

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

      urlsRetained:
        sourceLinks.length,

      contentRatio:
        CONTENT_RATIO,

      profileRatio:
        PROFILE_RATIO,

      signalRatio:
        SIGNAL_RATIO,

      linksModified:
        false
    })
  );

  void truthLoopPackage;

  return {
    success: true,

    loop7Package:
      finalPackage,

    compressionStats: {
      originalChars:
        JSON.stringify(universalPackage).length,

      compressedChars:
        finalSize,

      targetChars:
        TARGET_PACKAGE_CHARS,

      maxAllowedChars:
        MAX_TOTAL_PACKAGE_CHARS,

      websiteSources:
        websiteSources.length,

      linkedInPosts:
        linkedinPosts.length,

      linkedInArticles:
        linkedinArticles.length,

      githubSources:
        githubSource ? 1 : 0,

      xItems:
        xItemCount,

      redditItems:
        redditItemCount,

      additionalEvidenceItems:
        additionalEvidenceItemCount,

      linkedinPostLimit:
        dynamicLinkedInPostLimit,

      linkedinProfiles:
        profile ? 1 : 0,

      urlsRetained:
        sourceLinks.length,

      contentRatio:
        CONTENT_RATIO,

      profileRatio:
        PROFILE_RATIO,

      signalRatio:
        SIGNAL_RATIO,

      linksModified:
        false
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
