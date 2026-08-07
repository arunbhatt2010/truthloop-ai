/* ============================================================
   CROSS EVIDENCE BRAIN
   TruthLoop AI

   Mission

   Collect evidence from one or more public sources
   and build one merged Public Evidence Package.

   This brain never performs investigation.

   It only:

   • Collects
   • Normalizes
   • Deduplicates
   • Scores
   • Packages

   Output

   One Universal Public Evidence Package

============================================================ */

import {
    loadPublicContentFetcher,
    acquirePublicContent,
    validatePublicContent,
    cleanPublicContent,
    extractPublicContent,
    normalizePublicEvidence,
    mergePublicEvidence,
    discoverPublicSignals,
    buildPublicContentPackage
} from "./PublicContentFetcher.js";

export async function loadCrossEvidenceBrain({

    profileLinks = []

} = {}) {

    const result = {

        success: false,

        sourcesProcessed: 0,

        sourcesSucceeded: 0,

        sourcesFailed: 0,

        evidencePackages: [],

        mergedEvidence: null,

        confidenceScore: 0,

        errors: []

    };

    try {

        if (
            !Array.isArray(profileLinks) ||
            !profileLinks.length
        ) {

            result.errors.push(
                "At least one profile link is required."
            );

            return result;
        }

        for (const url of profileLinks) {

            const sourceResult =
                await collectSourceEvidence(url);

            result.sourcesProcessed++;

            if (sourceResult.success) {

                result.sourcesSucceeded++;

                result.evidencePackages.push(
                    sourceResult.package
                );

            } else {

                result.sourcesFailed++;

                result.errors.push({
                    url,
                    reason: sourceResult.reason
                });

            }

        }

        result.mergedEvidence =
            mergeEvidencePackages(
                result.evidencePackages
            );

        result.confidenceScore =
            calculateEvidenceScore(
                result.mergedEvidence
            );

        result.success = true;

        return result;

    } catch (error) {

        result.errors.push(error.message);

        return result;
    }
}
async function collectSourceEvidence(url) {

    try {

        const urlPackage =
            await loadPublicContentFetcher({
                url
            });

        const rawPackage =
            await acquirePublicContent(
                urlPackage
            );

        const validatedPackage =
            validatePublicContent(
                rawPackage
            );

        const cleanPackage =
            cleanPublicContent(
                validatedPackage
            );

        const extractedPackage =
            extractPublicContent(
                cleanPackage
            );

        const normalizedPackage =
            normalizePublicEvidence(
                extractedPackage
            );

        const mergedPackage =
            mergePublicEvidence(
                normalizedPackage
            );

        const signalPackage =
            discoverPublicSignals(
                mergedPackage
            );

        const finalPackage =
            buildPublicContentPackage(
                rawPackage,
                signalPackage
            );

        return {

            success: finalPackage.success,

            package: finalPackage,

            reason: finalPackage.reason || null

        };

    } catch (error) {

        return {

            success: false,

            reason: error.message

        };

    }
}
function mergeEvidencePackages(packages) {

    const merged = {

        profiles: [],

        posts: [],

        comments: [],

        articles: [],

        links: [],

        publicSignals: [],

        traceability: []

    };

    for (const pkg of packages) {

        if (!pkg?.success) continue;

        merged.publicSignals.push(
            ...(pkg.publicSignals || [])
        );

        merged.traceability.push(
            ...(pkg.traceability || [])
        );

    }

    return merged;
      }
