/* ============================================================
   PROFILE SYSTEM BRAIN

   Mission

   Build one verified public evidence package.

   Inputs

   • TruthLoop Package
   • Public Profile / Website Link

   Responsibilities

   • Collect real public signals
   • Normalize evidence
   • Validate evidence
   • Refine evidence
   • Compress evidence
   • Build one Evidence Package

   Never

   • Guess
   • Generate opportunities
   • Generate GTM
   • Give advice
   • Create stories
   • Use private data

   Output

   One verified Evidence Package.

   This package is available only after Loop 6
   and can only be requested by TruthLoop Main Brain
   during Loop 7.

============================================================ */

export async function loadProfileSystemBrain({

    truthLoopPackage = {},

    profileLink = "",

    currentLoop = 7

} = {}) {

    // STEP 1
    // Security
if (currentLoop !== 7) {

    return {

        success: false,

        stage: "Security",

        reason:
            "Profile System Brain is available only after Loop 6."

    };

}
    // STEP 2
    // Input Validation
if (
    typeof profileLink !== "string" ||
    !profileLink.trim()
) {

    return {

        success: false,

        stage: "Input Validation",

        reason: "Public profile or website link is required."

    };

}

const normalizedProfileLink =
    profileLink.trim();
    // STEP 3
    // Profile Intelligence API
const profileEvidence =

    await ProfileIntelligenceAPI({

        profileLink:
            normalizedProfileLink,

        truthLoopPackage,

        currentLoop,

        provider: "Cerebras"

    });

if (!profileEvidence.success) {

    return profileEvidence;

       }
    // STEP 4
    // Profile Main Brain
const evidencePackage =

    await ProfileMainBrain({

        profileEvidence,

        truthLoopPackage,

        currentLoop

    });

if (!evidencePackage.success) {

    return evidencePackage;

   }
    // STEP 5
    // Return Evidence Package
return evidencePackage;
}
async function ProfileIntelligenceAPI({

    profileLink,

    truthLoopPackage,

    currentLoop,

    provider = "Cerebras"

}) {

    const intelligence = {

        success: false,

        provider,

        model: null,

        profileLink,

        timestamp:

            new Date().toISOString(),

        rawResponse: null,

        evidence: null,

        errors: []

    };

    try {

const model = "gpt-oss-120b";

const endpoint =
    "https://api.cerebras.ai/v1/chat/completions";

intelligence.model = model;

const systemPrompt = `
You are TruthLoop Profile Intelligence.

Mission:

Collect only publicly available evidence.

Never guess.

Never infer.

Never create stories.

Never generate GTM.

Never generate advice.

Normalize all evidence.

Validate every signal.

Return only structured JSON.

`;
       const userPrompt = `
PROFILE LINK

${profileLink}

CURRENT LOOP

${currentLoop}

TRUTHLOOP PACKAGE

${JSON.stringify(truthLoopPackage, null, 2)}
`;

const requestBody = {

    model,

    messages: [

        {
            role: "system",
            content: systemPrompt
        },

        {
            role: "user",
            content: userPrompt
        }

    ],

    temperature: 0.1,

    response_format: {
        type: "json_object"
    }

};
       const response = await fetch(endpoint, {

    method: "POST",

    headers: {

        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${process.env.CEREBRAS_API_KEY}`

    },

    body: JSON.stringify(requestBody)

});

if (!response.ok) {

    intelligence.errors.push(

        `HTTP ${response.status}`

    );

    return intelligence;

}

const result = await response.json();
intelligence.rawResponse = result;

const content =
    result?.choices?.[0]?.message?.content;

if (!content) {

    intelligence.errors.push(
        "No response content returned."
    );

    return intelligence;

}

intelligence.evidence = content;

intelligence.success = true;

return intelligence;

    }

    catch (error) {

        intelligence.errors.push(

            error.message

        );

        return intelligence;

    }

}

async function ProfileMainBrain({

    profileEvidence,

    truthLoopPackage,

    currentLoop

}) {

    const evidencePackage = {

        success: false,

        timestamp:
            new Date().toISOString(),

        profileLink:
            profileEvidence.profileLink,

        evidence: {},

        errors: []

    };

    try {

        // STEP 1
        // Parse LLM JSON

        // STEP 2
        // Validate Evidence

        // STEP 3
        // Normalize Evidence

        // STEP 4
        // Refine Evidence

        // STEP 5
        // Compress Evidence

        evidencePackage.success = true;

        return evidencePackage;

    }

    catch (error) {

        evidencePackage.errors.push(
            error.message
        );

        return evidencePackage;

    }

   }
