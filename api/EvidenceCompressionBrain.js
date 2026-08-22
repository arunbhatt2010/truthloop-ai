/* =========================================================
   EVIDENCE COMPRESSION BRAIN v2
   Produces Universal Evidence Package only.
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

  const sources =
  publicEvidencePackage?.universalPackage?.sources ||
  publicEvidencePackage?.sources ||
  [];

  console.log("ECB_INPUT_STATS", {
    sourceCount: sources.length
  });

  const profileMap = new Map();

  const identitySignals = new Set();
  const expertiseSignals = new Set();
  const businessSignals = new Set();
  const behaviorSignals = new Set();

  let rawChars = 0;

  function detectPlatform(url = "") {
    const u = url.toLowerCase();

    if (u.includes("linkedin.com")) return "linkedin";
    if (u.includes("github.com")) return "github";
    if (u.includes("x.com") || u.includes("twitter.com")) return "x";
    if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
    if (u.includes("facebook.com")) return "facebook";
    if (u.includes("instagram.com")) return "instagram";
    if (u.includes("reddit.com")) return "reddit";
    if (u.includes("medium.com")) return "medium";
    if (u.includes("substack.com")) return "substack";

    return "website";
  }

  for (const source of sources) {

    const visibleText = source?.visibleText || "";
    rawChars += visibleText.length;

    const sourceUrl = source?.sourceUrl || source?.url || "";

    if (sourceUrl) {
      profileMap.set(sourceUrl, {
        platform: detectPlatform(sourceUrl),
        url: sourceUrl,
        confidence: 1.0
      });
    }

    for (const link of (source?.socialProfiles || [])) {
  profileMap.set(link, {
    platform: detectPlatform(link),
    url: link,
    confidence: 0.9
  });
       }

    const text = visibleText.toLowerCase();

    if (/founder|creator|developer|consultant|coach|educator|researcher/.test(text)) {
      identitySignals.add("Detected Professional Identity");
    }

    if (/ai|software|saas|product|marketing|psychology|leadership/.test(text)) {
      expertiseSignals.add("Detected Expertise Domain");
    }

    if (/business|customer|client|conversion|growth|revenue/.test(text)) {
      businessSignals.add("Business Growth");
    }

    if (/system|pattern|decision|clarity|execution|action/.test(text)) {
      behaviorSignals.add("Systems Thinking");
    }
  }

  const discoveredProfiles = [...profileMap.values()];

  const universalEvidencePackage = {
    success: true,
    stage: "Evidence Compression Brain v2",

    identitySignals: [...identitySignals],
    expertiseSignals: [...expertiseSignals],
    businessSignals: [...businessSignals],
    behaviorSignals: [...behaviorSignals],

    discoveredProfiles,

    confidenceScore: Number(
      Math.min(
        0.99,
        0.40 + (discoveredProfiles.length * 0.05)
      ).toFixed(2)
    )
  };

  const loop7Package = {
    evidenceSources: discoveredProfiles.slice(0, 5),
    confidenceScore: universalEvidencePackage.confidenceScore,
    identitySignals: universalEvidencePackage.identitySignals,
    expertiseSignals: universalEvidencePackage.expertiseSignals,
    businessSignals: universalEvidencePackage.businessSignals,
    behaviorSignals: universalEvidencePackage.behaviorSignals
  };

  console.log("ECB_EXTRACTION_COMPLETE");

  console.log("ECB_COMPRESSION_STATS", {
    rawChars,
    finalPackageChars: JSON.stringify(loop7Package).length
  });

  console.log("ECB_PACKAGE_READY");

  return {
    success: true,
    universalEvidencePackage,
    loop7Package,
    compressionStats: {
      rawChars,
      compressedChars: JSON.stringify(loop7Package).length,
      tokenReductionTarget: "80-90%"
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
