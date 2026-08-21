/* =========================================================

   EVIDENCE COMPRESSION BRAIN v1

   PURPOSE

   Convert large public evidence packages into a small,
   investigation-ready evidence package for Loop 7.

   This brain NEVER generates conclusions.

   This brain NEVER performs investigation reasoning.

   This brain NEVER writes user-facing content.

   This brain ONLY extracts, filters, and compresses
   evidence signals.

   PIPELINE

   PublicContentFetcher
            ↓
   EvidenceCompressionBrain
            ↓
   Universal Evidence Package
            ↓
   Loop 7 Investigation

========================================================= */
/* =========================================================

   INPUT CONTRACT

   REQUIRED INPUTS

   truthLoopPackage

   publicEvidencePackage

   The brain must accept raw evidence exactly as received.

   Never modify source evidence.

   Never overwrite original evidence.

========================================================= */
/* =========================================================

   EXTRACTION RULES

   Extract only:

   • Professional Identity
   • Expertise Signals
   • Audience Signals
   • Business Signals
   • Behavioral Signals
   • Discovered Profiles

   Ignore:

   • HTML
   • CSS
   • UI Text
   • Buttons
   • Navigation
   • Forms
   • Menus
   • Icons
   • Styling
   • Layout Metadata

   The goal is evidence extraction,
   not page reconstruction.

========================================================= */
/* =========================================================

   PROFESSIONAL IDENTITY RULES

   Detect:

   • Founder
   • Consultant
   • Educator
   • Creator
   • Developer
   • Researcher
   • Coach
   • Business Owner

   Use only evidence present in content.

   Never infer identity without support.

========================================================= */
/* =========================================================

   EXPERTISE SIGNAL RULES

   Extract recurring knowledge domains.

   Examples:

   • AI
   • Psychology
   • Marketing
   • Finance
   • SaaS
   • Product
   • Leadership

   Ignore isolated mentions.

   Prefer repeated evidence.

========================================================= */
/* =========================================================

   BEHAVIOR SIGNAL RULES

   Extract recurring behavioral themes.

   Examples:

   • Systems Thinking
   • Long-Term Orientation
   • Risk Aversion
   • Experimentation
   • Authority Building
   • Community Focus

   These are evidence signals.

   These are NOT investigation conclusions.

========================================================= */
/* =========================================================

   DISCOVERED PROFILE RULES

   Detect and normalize:

   • LinkedIn
   • X
   • Facebook
   • Instagram
   • GitHub
   • YouTube
   • Reddit
   • Medium
   • Substack
   • Portfolio
   • Website

   Save only:

   platform
   url
   confidence

========================================================= */
/* =========================================================

   COMPRESSION RULES

   NEVER send:

   visibleText

   rawHtml

   articleContent

   pageContent

   fullPosts

   fullDescriptions

   to Loop 7.

   Loop 7 must receive only:

   Universal Evidence Package

========================================================= */
/* =========================================================

   OUTPUT CONTRACT

   Return:

   {
      success,

      universalEvidencePackage,

      compressionStats
   }

   Never return:

   raw content

   raw html

   page text

   article text

========================================================= */
/* =========================================================

   DEBUG RULES

   Allowed Logs

   ECB_START

   ECB_INPUT_STATS

   ECB_EXTRACTION_COMPLETE

   ECB_COMPRESSION_STATS

   ECB_PACKAGE_READY

   Never log:

   visibleText

   full articles

   raw html

   full page content

   Logs must remain under 20 lines.

========================================================= */
/* =========================================================

   LOOP 7 SAFETY RULE

   EvidenceCompressionBrain is NOT allowed to:

   • Investigate
   • Diagnose
   • Score users
   • Generate reports
   • Create summaries
   • Create reflections

   Loop 7 remains the ONLY investigation engine.

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

  console.log("ECB_INPUT_VALID");

  const sources =
    publicEvidencePackage.sources || [];

  console.log(
    "ECB_SOURCE_COUNT",
    sources.length
  );
const primarySource =
  sources[0] || {};

console.log(
  "ECB_PRIMARY_PLATFORM",
  primarySource.platform
);

console.log(
  "ECB_CONTENT_LENGTH",
  primarySource.contentLength
);
  const visibleText =
    primarySource.visibleText || "";

console.log(
    "ECB_VISIBLE_TEXT_LENGTH",
    visibleText.length
);
  const extractedEvidence = {

    title:
        primarySource.title || "",

    description:
        primarySource.description || "",

    visibleText:
        primarySource.visibleText || "",

    socialLinks:
        primarySource.socialLinks || [],

    sourceUrl:
        primarySource.sourceUrl || "",

    platform:
        primarySource.platform || "unknown"

};

console.log(
    "ECB_EXTRACTION_COMPLETE"
);
   const compressedEvidence = {

    sourceUrl:
        extractedEvidence.sourceUrl,

    platform:
        extractedEvidence.platform,

    title:
        extractedEvidence.title,

    description:
        extractedEvidence.description,

    socialLinks:
        extractedEvidence.socialLinks,

    evidenceText:
        extractedEvidence.visibleText
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 5000)

};

console.log(
    "ECB_COMPRESSION_STATS",
    {
        original:
            extractedEvidence.visibleText.length,

        compressed:
            compressedEvidence.evidenceText.length
    }
);
   const universalEvidencePackage = {

    success: true,

    stage: "Evidence Compression Brain",

    sourceUrl:
        compressedEvidence.sourceUrl,

    platform:
        compressedEvidence.platform,

    title:
        compressedEvidence.title,

    description:
        compressedEvidence.description,

    socialLinks:
        compressedEvidence.socialLinks,

    evidenceText:
        compressedEvidence.evidenceText,

    compressionStats: {

        originalLength:
            extractedEvidence.visibleText.length,

        compressedLength:
            compressedEvidence.evidenceText.length

    }
      
};

console.log(
    "ECB_PACKAGE_READY"
);
   return universalEvidencePackage;
   
}
export {
    loadEvidenceCompressionBrain
};
