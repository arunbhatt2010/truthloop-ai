/* =========================================================
   EVIDENCE COMPRESSION BRAIN — COMPLETE REWRITE
   TruthLoop AI

   Mission:
   Compress content only.

   Guarantees:
   - no evidence filtering
   - no evidence ranking
   - no evidence selection
   - no source deletion
   - no evidence-item deletion
   - no array slicing
   - no AI/API calls
   - URLs and link values remain untouched
   - package is hard-capped at 10,000 JSON characters
   ========================================================= */

const MAX_TOTAL_PACKAGE_CHARS = 10000;
const PACKAGE_VERSION = "6.0";

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

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function clone(value) {
    if (Array.isArray(value)) {
      return value.map(clone);
    }

    if (isObject(value)) {
      const result = {};
      for (const [key, child] of Object.entries(value)) {
        result[key] = clone(child);
      }
      return result;
    }

    return value;
  }

  function normalizeContent(value) {
    if (typeof value !== "string") {
      return value;
    }

    return value
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isUrlLike(value) {
    if (typeof value !== "string") {
      return false;
    }

    const trimmed = value.trim();

    return (
      /^https?:\/\//i.test(trimmed) ||
      /^ftp:\/\//i.test(trimmed) ||
      /^www\./i.test(trimmed)
    );
  }

  function isProtectedKey(key = "") {
    const k = String(key || "").toLowerCase();

    return (
      k === "url" ||
      k === "uri" ||
      k === "href" ||
      k === "link" ||
      k === "links" ||
      k === "sourceurl" ||
      k === "sourceurls" ||
      k === "sourcelinks" ||
      k === "profileurl" ||
      k === "canonicalurl" ||
      k === "articleurl" ||
      k === "posturl" ||
      k === "imageurl" ||
      k === "videourl" ||
      k === "feedurl" ||
      k === "sociallinks" ||
      k === "socialprofiles" ||
      k === "discoveredprofiles" ||
      k === "publisheddate" ||
      k === "publishedat" ||
      k === "datepublished" ||
      k === "date" ||
      k === "postedat" ||
      k === "createdat" ||
      k === "updatedat" ||
      k === "timestamp" ||
      k === "id" ||
      k === "_id" ||
      k === "urn" ||
      k.endsWith("url") ||
      k.endsWith("urls")
    );
  }

  /*
   * Content-only compressor.
   * Every object key and every array element survives.
   * Protected URL/link/date/identifier values survive verbatim.
   */
  function compressTree(value, factor, key = "") {

    if (typeof value === "string") {
      if (
        isProtectedKey(key) ||
        isUrlLike(value)
      ) {
        return value;
      }

      const content =
        normalizeContent(value);

      return content.slice(
        0,
        Math.max(
          0,
          Math.floor(
            content.length * factor
          )
        )
      );
    }

    if (Array.isArray(value)) {
      return value.map(item =>
        compressTree(item, factor, key)
      );
    }

    if (isObject(value)) {
      const result = {};

      for (const [childKey, childValue] of Object.entries(value)) {
        result[childKey] =
          compressTree(
            childValue,
            factor,
            childKey
          );
      }

      return result;
    }

    return value;
  }

  /*
   * Carry forward the upstream package once.
   * No duplicate evidence branches are manufactured here.
   * This is what prevents package inflation.
   */
  const loop7Package = clone(universalPackage);

  loop7Package.packageType =
    "Loop7EvidencePackage";

  loop7Package.version =
    PACKAGE_VERSION;

  if (
    !loop7Package.profileLink &&
    loop7Package.primarySource
  ) {
    loop7Package.profileLink =
      loop7Package.primarySource;
  }

  const originalPackageSize =
    JSON.stringify(loop7Package).length;

  /*
   * First calculate the absolute non-compressible skeleton.
   * All compressible text becomes empty.
   */
  const skeletonPackage =
    compressTree(
      loop7Package,
      0
    );

  const skeletonSize =
    JSON.stringify(skeletonPackage).length;

  console.log(
    "ECB_INPUT_SIZE",
    originalPackageSize
  );

  console.log(
    "ECB_SKELETON_SIZE",
    skeletonSize
  );

  /*
   * If the URLs / IDs / structure alone exceed 10,000 chars,
   * no content-only algorithm can honestly solve it.
   */
  if (skeletonSize > MAX_TOTAL_PACKAGE_CHARS) {
    console.error(
      "ECB_HARD_LOCK_IMPOSSIBLE",
      JSON.stringify({
        originalChars: originalPackageSize,
        skeletonChars: skeletonSize,
        maxAllowed: MAX_TOTAL_PACKAGE_CHARS,
        filteringPerformed: false,
        linksModified: false
      })
    );

    return {
      success: false,
      reason:
        `Content-only compression cannot fit the protected package skeleton: ${skeletonSize} > ${MAX_TOTAL_PACKAGE_CHARS} characters.`,
      loop7Package: null,
      compressionStats: {
        originalChars: originalPackageSize,
        skeletonChars: skeletonSize,
        compressedChars: null,
        maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
        filteringPerformed: false,
        linksModified: false
      }
    };
  }

  let finalPackage = clone(loop7Package);
  let finalSize = originalPackageSize;
  let finalFactor = 1;

  if (originalPackageSize > MAX_TOTAL_PACKAGE_CHARS) {

    /*
     * Binary search finds the largest amount of content that
     * still fits. There is no arbitrary 15-character floor.
     */
    let low = 0;
    let high = 1;

    for (let i = 0; i < 24; i++) {
      const factor =
        (low + high) / 2;

      const candidate =
        compressTree(
          loop7Package,
          factor
        );

      const candidateSize =
        JSON.stringify(candidate).length;

      if (
        candidateSize <=
        MAX_TOTAL_PACKAGE_CHARS
      ) {
        low = factor;
      } else {
        high = factor;
      }
    }

    finalFactor = low;

    finalPackage =
      compressTree(
        loop7Package,
        finalFactor
      );

    finalSize =
      JSON.stringify(finalPackage).length;

    /*
     * Final safety convergence for JSON escaping/rounding.
     */
    for (let i = 0; i < 24 && finalSize > MAX_TOTAL_PACKAGE_CHARS; i++) {
      finalFactor *= 0.98;

      finalPackage =
        compressTree(
          loop7Package,
          finalFactor
        );

      finalSize =
        JSON.stringify(finalPackage).length;
    }
  }

  /*
   * Absolute final verification.
   */
  finalSize =
    JSON.stringify(finalPackage).length;

  if (finalSize > MAX_TOTAL_PACKAGE_CHARS) {
    console.error(
      "ECB_HARD_LOCK_EXCEEDED",
      JSON.stringify({
        originalChars: originalPackageSize,
        skeletonChars: skeletonSize,
        compressedChars: finalSize,
        maxAllowed: MAX_TOTAL_PACKAGE_CHARS,
        filteringPerformed: false,
        linksModified: false
      })
    );

    return {
      success: false,
      reason:
        `Content-only compression failed to fit the hard limit: ${finalSize} > ${MAX_TOTAL_PACKAGE_CHARS} characters.`,
      loop7Package: null,
      compressionStats: {
        originalChars: originalPackageSize,
        skeletonChars: skeletonSize,
        compressedChars: finalSize,
        maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
        filteringPerformed: false,
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
      originalChars: originalPackageSize,
      skeletonChars: skeletonSize,
      finalChars: finalSize,
      maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
      compressionFactor: finalFactor,
      filteringPerformed: false,
      linksModified: false
    })
  );

  void truthLoopPackage;

  return {
    success: true,
    loop7Package: finalPackage,
    compressionStats: {
      originalChars: originalPackageSize,
      skeletonChars: skeletonSize,
      compressedChars: finalSize,
      maxAllowedChars: MAX_TOTAL_PACKAGE_CHARS,
      compressionFactor: finalFactor,
      filteringPerformed: false,
      linksModified: false
    }
  };
}

export {
  loadEvidenceCompressionBrain
};
