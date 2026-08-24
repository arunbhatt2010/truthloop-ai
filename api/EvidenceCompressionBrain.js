/* =========================================================
   EVIDENCE COMPRESSION BRAIN v3
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
    maxChars = 600
  ) {

    return String(text)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
  }

  const websiteSource =
    sources.find(source =>
      detectPlatform(
        source?.sourceUrl ||
        source?.url ||
        ""
      ) === "website"
    ) || sources[0] || {};

  const websiteEvidence = {
    url:
      websiteSource?.sourceUrl ||
      websiteSource?.url ||
      null,

    title:
      websiteSource?.title || "",

    content:
      compressText(
        websiteSource?.visibleText ||
        websiteSource?.contentSnippet ||
        websiteSource?.description ||
        "",
        1200
      )
  };

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

    const source = sources.find(item =>
      detectPlatform(
        item?.sourceUrl ||
        item?.url ||
        ""
      ) === platform
    );

    if (!source) continue;

    socialEvidence.push({

      platform,

      url:
        source?.sourceUrl ||
        source?.url ||
        null,

      title:
        source?.title || "",

      content:
        compressText(
          source?.visibleText ||
          source?.contentSnippet ||
          source?.description ||
          "",
          600
        )
    });

    if (socialEvidence.length >= 5) {
      break;
    }
  }

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
      website:
        !!websiteEvidence?.url,

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
