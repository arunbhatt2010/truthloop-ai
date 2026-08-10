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
       const identityPackage =
    await IdentityExtractionBrain({
        profileLinks
    });

const discoveryPackage =
    await FootprintDiscoveryBrain(
        identityPackage
    );

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

function calculateEvidenceScore(
    mergedEvidence = {}
){

    let score = 0;

    const profiles =
        mergedEvidence.profiles?.length || 0;

    const posts =
        mergedEvidence.posts?.length || 0;

    const articles =
        mergedEvidence.articles?.length || 0;

    const comments =
        mergedEvidence.comments?.length || 0;

    const links =
        mergedEvidence.links?.length || 0;

    const publicSignals =
        mergedEvidence.publicSignals?.length || 0;

    const traceability =
        mergedEvidence.traceability?.length || 0;

    score += Math.min(profiles * 10, 20);

    score += Math.min(posts * 5, 20);

    score += Math.min(articles * 5, 20);

    score += Math.min(comments * 2, 10);

    score += Math.min(links * 1, 10);

    score += Math.min(publicSignals * 5, 10);

    score += Math.min(traceability * 5, 10);

    return Math.max(
        0,
        Math.min(score, 100)
    );
                      }

async function collectSourceEvidence(url) {

    try {
       const identityPackage =
  await IdentityExtractionBrain({
    sourceUrl: url
  });

console.log(
  "IDENTITY_PACKAGE",
  identityPackage
);
const footprintPackage =
  await FootprintDiscoveryBrain({
    identityPackage
  });

console.log(
  "FOOTPRINT_PACKAGE",
  footprintPackage
);
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

        const finalPackage =
            buildPublicContentPackage(
                rawPackage,
                extractedPackage
            );

        console.log(
            "CROSS_EVIDENCE_FINAL_PACKAGE",
            {
                success:
                    finalPackage?.success,

                title:
                    finalPackage?.title,

                visibleTextLength:
                    finalPackage?.visibleText?.length || 0,

                links:
                    finalPackage?.links?.length || 0,

                headings:
                    finalPackage?.headings?.length || 0
            }
        );

        return {

            success:
                finalPackage.success,

            package:
                finalPackage,

            reason:
                finalPackage.reason || null

        };

    } catch (error) {

        console.error(
            "COLLECT_SOURCE_EVIDENCE_ERROR",
            error
        );

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
// ====================================
// Identity Extraction Brain
// ====================================

async function IdentityExtractionBrain({
    profileLinks = []
}) {

    const result = {
        success: false,
        identities: []
    };

    for (const url of profileLinks) {

        result.identities.push({
            type: "profile",
            value: url
        });

    }

    result.success =
        result.identities.length > 0;

    console.log(
        "IDENTITY_PACKAGE",
        result
    );

    return result;

}

// ====================================
// Footprint Discovery Brain
// ====================================

async function FootprintDiscoveryBrain(
    identityPackage
) {

    const result = {
        success: false,
        discoveredProfiles: []
    };

    for (
        const identity of
        identityPackage.identities
    ) {

        if (
            identity.type === "profile"
        ) {

            result.discoveredProfiles.push(
                identity.value
            );

        }

    }

    result.success =
        result.discoveredProfiles.length > 0;

    console.log(
        "DISCOVERY_PACKAGE",
        result
    );

    return result;

}

// ====================================
// Evidence Normalizer
// ====================================

async function EvidenceNormalizer(
    evidencePackage
) {

    return evidencePackage;

}

// ====================================
// Cross Evidence Analyzer
// ====================================

async function CrossEvidenceAnalyzer(
    evidencePackage
) {

    return {
        findings: []
    };

}

// ====================================
// Evidence Confidence Engine
// ====================================

async function EvidenceConfidenceEngine(
    evidencePackage
) {

    return {
        confidence: 0
    };

       }
