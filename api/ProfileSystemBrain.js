/* ============================================================
   PROFILE SYSTEM BRAIN
   TruthLoop Platform
   Version : 1.0

   Purpose

   Build a complete Public Identity Profile.

   This module never performs GTM reasoning.

   It never recommends.

   It never generates opportunities.

   It only discovers, validates,
   organizes and compresses evidence.

============================================================ */

export async function loadProfileSystemBrain({

    truthLoopPackage,

    socialMediaLinks

}) {

    /* --------------------------------------------
       Stage 1
       Platform Discovery
    -------------------------------------------- */

    const platformRegistry =
        await PlatformDiscoveryEngine(
            socialMediaLinks
        );

    /* --------------------------------------------
       Stage 2
       Evidence Collection
    -------------------------------------------- */

    const rawEvidence =
        await EvidenceCollectionEngine(
            platformRegistry
        );

    /* --------------------------------------------
       Stage 3
       Identity
    -------------------------------------------- */

    const identity =
        await IdentityEngine(
            rawEvidence
        );

    /* --------------------------------------------
       Stage 4
       Activity
    -------------------------------------------- */

    const activity =
        await ActivityEngine(
            rawEvidence
        );

    /* --------------------------------------------
       Stage 5
       Content
    -------------------------------------------- */

    const content =
        await ContentEngine(
            rawEvidence
        );

    /* --------------------------------------------
       Stage 6
       Audience
    -------------------------------------------- */

    const audience =
        await AudienceEngine(
            rawEvidence
        );

    /* --------------------------------------------
       Stage 7
       Authority
    -------------------------------------------- */

    const authority =
        await AuthorityEngine(
            rawEvidence
        );

    /* --------------------------------------------
       Stage 8
       Trust
    -------------------------------------------- */

    const trust =
        await TrustEngine(
            rawEvidence
        );

    /* --------------------------------------------
       Stage 9
       Position
    -------------------------------------------- */

    const position =
        await PositionEngine({

            truthLoopPackage,

            rawEvidence,

            identity,

            activity,

            content,

            audience,

            authority,

            trust

        });

    /* --------------------------------------------
       Stage 10
       Profile Card
    -------------------------------------------- */

    return await ProfileCardBuilder({

        platformRegistry,

        rawEvidence,

        identity,

        activity,

        content,

        audience,

        authority,

        trust,

        position

    });

}
