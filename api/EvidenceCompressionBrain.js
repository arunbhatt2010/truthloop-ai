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

  const sources =
    publicEvidencePackage?.universalPackage?.sources ||
    publicEvidencePackage?.sources ||
    [];
   console.log("ECB_INPUT", {
  success: publicEvidencePackage?.success,
  sourceCount: sources.length,
  firstSourceKeys: Object.keys(sources?.[0] || {})
});

  let rawChars = 0;

  const evidenceSources = [];
  const identitySignals = new Set();
  const expertiseSignals = new Set();
  const businessSignals = new Set();
  const behaviorSignals = new Set();

  function detectPlatform(url = "") {

    const u = url.toLowerCase();

    if (u.includes("linkedin")) return "linkedin";
    if (u.includes("github")) return "github";
    if (u.includes("youtube")) return "youtube";
    if (u.includes("instagram")) return "instagram";
    if (u.includes("facebook")) return "facebook";
    if (u.includes("x.com")) return "x";

    return "website";
  }

  function compressText(text = "", maxChars = 1200) {

    return text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxChars);
  }

  for (const source of sources) {

const visibleText =
  source?.visibleText ||
  source?.contentSnippet ||
  "";
    const title = source?.title || "";
    const description = source?.description || "";
    const sourceUrl =
  source?.sourceUrl ||
  source?.canonicalUrl ||
  source?.url ||
  "";

    rawChars += visibleText.length;

    const compressedContent = compressText(
      `${title}\n${description}\n${visibleText}`,
      1200
    );

    evidenceSources.push({
      platform: detectPlatform(sourceUrl),
      url: sourceUrl,
      title,
      description,
      content: compressedContent,
      socialLinks: [
  ...(source?.socialProfiles || []),
  ...(source?.socialLinks || [])
]
    });

    const text = (
      title +
      " " +
      description +
      " " +
      visibleText
    ).toLowerCase();

    if (/founder|creator|developer|consultant|coach|educator|researcher/.test(text)) {
      identitySignals.add("Professional Identity");
    }

    if (/ai|software|saas|product|marketing|psychology|leadership/.test(text)) {
      expertiseSignals.add("Expertise Domain");
    }

    if (/business|customer|client|growth|revenue/.test(text)) {
      businessSignals.add("Business Growth");
    }

    if (/pattern|system|decision|clarity|execution|action|behavior/.test(text)) {
      behaviorSignals.add("Behavior Systems");
    }
  }

  const loop7Package = {
    sourceCount: evidenceSources.length,

    confidenceScore: Number(
      Math.min(
        0.95,
        0.40 + (evidenceSources.length * 0.05)
      ).toFixed(2)
    ),

    identitySignals: [...identitySignals],
    expertiseSignals: [...expertiseSignals],
    businessSignals: [...businessSignals],
    behaviorSignals: [...behaviorSignals],

    evidenceSources
  };

  console.log("ECB_COMPRESSION_STATS", {
    rawChars,
    finalPackageChars:
      JSON.stringify(loop7Package).length
  });

  return {
    success: true,
    loop7Package,
    compressionStats: {
      rawChars,
      compressedChars:
        JSON.stringify(loop7Package).length
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
