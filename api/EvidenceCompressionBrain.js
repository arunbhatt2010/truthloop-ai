/* =========================================================
   EVIDENCE COMPRESSION BRAIN v4
   Preserve evidence. Compress noise.
========================================================= */

async function loadEvidenceCompressionBrain({
  truthLoopPackage,
  publicEvidencePackage
}) {

  console.log("ECB_START");

  if (!publicEvidencePackage?.success) {
    return {
      success: false,
      reason: "No public evidence"
    };
  }

  const universalPackage =
    publicEvidencePackage?.universalPackage || {};

  const sources =
    universalPackage?.sources ||
    publicEvidencePackage?.sources ||
    [];

  const intelligence =
    universalPackage?.intelligence || {};

  function detectPlatform(url = "") {

    const u = String(url).toLowerCase();

    if (u.includes("linkedin")) return "linkedin";
    if (u.includes("github")) return "github";
    if (u.includes("youtube")) return "youtube";
    if (u.includes("instagram")) return "instagram";
    if (u.includes("facebook")) return "facebook";
    if (u.includes("x.com")) return "x";

    return "website";
  }

  function compressText(
    text = "",
    maxChars = 4000
  ) {

    return String(text)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
  }

  /* ========================================
     WEBSITE EVIDENCE
  ======================================== */

  const websiteSources =
    sources.filter(source =>
      detectPlatform(
        source?.sourceUrl ||
        source?.url ||
        ""
      ) === "website"
    );

  const websiteEvidence = {

    sourceCount:
      websiteSources.length,

    url:
      websiteSources?.[0]?.sourceUrl ||
      websiteSources?.[0]?.url ||
      null,

    title:
      websiteSources?.[0]?.title ||
      "",

    content:
      compressText(
        websiteSources
          .map(source =>
            source?.visibleText ||
            source?.contentSnippet ||
            source?.description ||
            ""
          )
          .filter(Boolean)
          .join("\n\n"),
        8000
      )
  };

  /* ========================================
     SOCIAL EVIDENCE
  ======================================== */

  const socialPriority = [
    "linkedin",
    "youtube",
    "github",
    "x",
    "instagram",
    "facebook"
  ];

  const socialEvidence = [];

  for (const platform of socialPriority) {

    const platformSources =
      sources.filter(item =>
        detectPlatform(
          item?.sourceUrl ||
          item?.url ||
          ""
        ) === platform
      );

    if (!platformSources.length) {
      continue;
    }

    socialEvidence.push({

      platform,

      sourceCount:
        platformSources.length,

      url:
        platformSources?.[0]?.sourceUrl ||
        platformSources?.[0]?.url ||
        null,

      title:
        platformSources?.[0]?.title ||
        "",

      content:
        compressText(
          platformSources
            .map(item =>
              item?.visibleText ||
              item?.contentSnippet ||
              item?.description ||
              ""
            )
            .filter(Boolean)
            .join("\n\n"),
          3000
        )
    });
  }

  /* ========================================
     LOOP 7 PACKAGE
  ======================================== */

  const loop7Package = {

    packageType:
      "Loop7EvidencePackage",

    profileLink:
      websiteEvidence.url,

    websiteEvidence,

    socialEvidence,

    intelligence: {

      identity:
        intelligence?.identity || {},

      positioning:
        intelligence?.positioning || {},

      recurringTopics:
        intelligence?.recurringTopics || [],

      businessSignals:
        intelligence?.businessSignals || [],

      creatorSignals:
        intelligence?.creatorSignals || [],

      behavioralSignals:
        intelligence?.behavioralSignals || [],

      contradictions:
        intelligence?.contradictions || [],

      evidence:
        intelligence?.evidence || []
    }
  };

  const packageSize =
    JSON.stringify(
      loop7Package
    ).length;

  console.log(
    "ECB_FINAL_PACKAGE",
    {
      totalSources:
        sources.length,

      websiteSources:
        websiteSources.length,

      socialProfiles:
        socialEvidence.length,

      packageSize
    }
  );

  return {

    success: true,

    loop7Package,

    compressionStats: {

      originalSources:
        sources.length,

      websiteSources:
        websiteSources.length,

      socialProfiles:
        socialEvidence.length,

      compressedChars:
        packageSize
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
