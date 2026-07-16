/*
========================================================

TRUTHLOOP LAW

TruthLoop discovers the person.

GTM discovers the opportunity.

Never perform TruthLoop diagnosis here.

========================================================
*/
/**
 * ============================================================
 * GTM Opportunity Engine
 * Version : 1.0
 * TruthLoop AI
 * ------------------------------------------------------------
 * Purpose:
 * Activated only after TruthLoop Loop 7.
 * Receives TruthLoop Package + User Assets.
 * Coordinates GTM Brains.
 * ============================================================
 */

export default async function handler(req, res) {

  /* ============================================================
     1. REQUEST VALIDATION
  ============================================================ */

  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method Not Allowed"
    });
  }

  const body = req.body || {};

  /* ============================================================
     2. ACTIVATION GATE
  ============================================================ */

  const {

  category,

  conversation,

  socialMediaLinks = []

} = body;

  if (!conversation || conversation.length === 0) {

  return res.status(400).json({

    reply:
      "Conversation Required"

  });

  }
/* ============================================================
   SOCIAL POSITION BRAIN
   Brain #1
   Purpose:
   Collect and organize public positioning signals.
   No AI reasoning.
   No GTM report generation.
============================================================ */

async function loadSocialPositionBrain(gtmPackage = {}) {

  const socialReport = {

    identity: "Unknown",

    currentPosition: "Unknown",

    authoritySignals: [],

    trustSignals: [],

    audienceSignals: [],

    contentSignals: [],

    confidence: 0,

    analyzedPlatforms: [],

    rawSignals: []

  };

  try {

    const {

    socialMediaLinks = [],

    assets = {}

} = gtmPackage;

const platforms = socialMediaLinks
    .filter(url => typeof url === "string" && url.trim())
    .map(url => {

        let platform = "website";

        try {

            const host = new URL(url)
                .hostname
                .replace(/^www\./i, "");

            platform = host
                .split(".")[0]
                .toLowerCase();

        } catch {

            platform = "unknown";

        }

        return {

            name: platform,

            url: url.trim()

        };

    });
console.log("platforms:", platforms);
console.log("socialMediaLinks:", socialMediaLinks);

if (!platforms.length) {
    console.log("EARLY RETURN - platforms empty");
    return socialReport;
    }

    /* ============================================================
       PLATFORM VALIDATION
    ============================================================ */

    const validPlatforms = [];

    for (const platform of platforms) {

      if (!platform) {
        continue;
      }

      if (
        typeof platform !== "object"
      ) {
        continue;
      }

      const {

        name = "",

        url = ""

      } = platform;

      if (
        !name.trim() ||
        !url.trim()
      ) {
        continue;
      }

      validPlatforms.push({

        name: name.trim(),

        url: url.trim()

      });

    }

    if (!validPlatforms.length) {

      return socialReport;

    }

    socialReport.analyzedPlatforms =
      validPlatforms.map(

        platform => platform.name

      );

    /* ============================================================
       RAW SIGNAL COLLECTION
    ============================================================ */

    const rawSignals = [];

    for (const platform of validPlatforms) {

      rawSignals.push({

        platform: platform.name,

        url: platform.url,

        collected: false,

        data: null,

        status: "Pending"

      });

    }

    socialReport.rawSignals =
      rawSignals;

/* ============================================================
       SIGNAL NORMALIZATION
    ============================================================ */

    const normalizedSignals = [];

    for (const signal of rawSignals) {

      normalizedSignals.push({

        platform:
          signal.platform,

        url:
          signal.url,

        status:
          signal.status,

        collected:
          signal.collected,

        text: "",

        title: "",

        author: "",

        engagement: {

          likes: 0,

          comments: 0,

          shares: 0,

          views: 0

        },

        confidence: 0

      });

    }

    /* ============================================================
       REMOVE DUPLICATES
    ============================================================ */

    const uniqueSignals = [];

    const visited = new Set();

    for (const signal of normalizedSignals) {

      const key =

        `${signal.platform}|${signal.url}`;

      if (visited.has(key)) {

        continue;

      }

      visited.add(key);

      uniqueSignals.push(signal);

    }

    socialReport.rawSignals =
      uniqueSignals;

    /* ============================================================
       READY FOR POSITION DETECTION
    ============================================================ */

    socialReport.confidence = 5;

    /* ============================================================
       POSITION SIGNAL EXTRACTION
    ============================================================ */

    const positionSignals = {

      identity: [],

      authority: [],

      trust: [],

      audience: [],

      content: []

    };

    for (const signal of uniqueSignals) {

      if (signal.platform) {

        positionSignals.identity.push({

          platform: signal.platform,

          value: signal.platform

        });

      }

      if (signal.engagement) {

        positionSignals.authority.push({

          platform: signal.platform,

          engagement: signal.engagement

        });

      }

      if (signal.author) {

        positionSignals.trust.push({

          author: signal.author

        });

      }

      if (signal.text) {

        positionSignals.content.push({

          platform: signal.platform,

          text: signal.text

        });

      }

      positionSignals.audience.push({

        platform: signal.platform,

        url: signal.url

      });

    }

    socialReport.identity =
      positionSignals.identity;

    socialReport.authoritySignals =
      positionSignals.authority;

    socialReport.trustSignals =
      positionSignals.trust;

    socialReport.audienceSignals =
      positionSignals.audience;

    socialReport.contentSignals =
      positionSignals.content;

    socialReport.currentPosition =
      "Position Signals Collected";

    socialReport.confidence = 10;

    return socialReport;

    }

  catch (error) {

    console.error(
      "[Social Position Brain]",
      error
    );

    return socialReport;

  }

        }
  /* ============================================================
   2. SCOPE POSITION BRAIN
============================================================ */

async function loadScopePositionBrain(
    truthLoopPackage = {}
) {

    const scopeReport = {

        success: false,

        detectedCategory: null,

        categoryConfidence: 0,

        primaryScope: {},

        secondaryScope: {},

        categorySignals: [],

        evidence: [],

        recommendations: [],

        rawContext: truthLoopPackage

    };

    try {

        const {

            loopLevel,

            detectedPattern,

            primaryLoop,

            userGoal,

            userProblem,

            userCategory,

            productType,

            niche,

            audience,

            truthLoopSummary

        } = truthLoopPackage;
      /* ==========================================
           CATEGORY SIGNAL COLLECTION
        ========================================== */

        const categorySignals = [];

        if (userCategory) {

            categorySignals.push({
                source: "userCategory",
                value: userCategory
            });

        }

        if (productType) {

            categorySignals.push({
                source: "productType",
                value: productType
            });

        }

        if (niche) {

            categorySignals.push({
                source: "niche",
                value: niche
            });

        }

        if (audience) {

            categorySignals.push({
                source: "audience",
                value: audience
            });

        }

        if (userGoal) {

            categorySignals.push({
                source: "goal",
                value: userGoal
            });

        }

        if (userProblem) {

            categorySignals.push({
                source: "problem",
                value: userProblem
            });

        }

        if (detectedPattern) {

            categorySignals.push({
                source: "pattern",
                value: detectedPattern
            });

        }

        if (primaryLoop) {

            categorySignals.push({
                source: "loop",
                value: primaryLoop
            });

        }

        scopeReport.categorySignals =
            categorySignals;

        scopeReport.categoryConfidence =
            categorySignals.length;
      /* ==========================================
           SCOPE POSITION DETECTION
        ========================================== */

        const detectedScope = {

            category: "Unknown",

            confidence: scopeReport.categoryConfidence,

            primaryFocus: null,

            summary: null

        };

        const scopeText = JSON.stringify(
            categorySignals
        ).toLowerCase();

        if (
            scopeText.includes("founder") ||
            scopeText.includes("startup")
        ) {

            detectedScope.category = "Founder";

        } else if (
            scopeText.includes("product") ||
            scopeText.includes("saas")
        ) {

            detectedScope.category = "Product";

        } else if (
            scopeText.includes("service") ||
            scopeText.includes("agency")
        ) {

            detectedScope.category = "Service";

        } else if (
            scopeText.includes("creator") ||
            scopeText.includes("content")
        ) {

            detectedScope.category = "Creator";

        } else if (
            scopeText.includes("career") ||
            scopeText.includes("job")
        ) {

            detectedScope.category = "Career";

        } else if (
            scopeText.includes("student") ||
            scopeText.includes("education")
        ) {

            detectedScope.category = "Education";

        }

        detectedScope.primaryFocus =
            userGoal ||
            productType ||
            niche ||
            userCategory ||
            "Unknown";

        detectedScope.summary =
            `${detectedScope.category} Position Detected`;

        scopeReport.detectedCategory =
            detectedScope.category;

        scopeReport.primaryScope =
            detectedScope;

        scopeReport.success = true;
      scopeReport.secondaryScope = {

            loopLevel,

            truthLoopSummary

        };

        scopeReport.recommendations = [

            "Validate detected category",

            "Compare with Social Position Brain",

            "Send compressed context to GTM Intelligence Brain"

        ];

        return scopeReport;

    }

    catch (error) {

        console.error(

            "[Scope Position Brain]",

            error

        );

        return scopeReport;

    }

              }
  /* ============================================================
   GTM MODEL HELPER
============================================================ */

async function callGTMModel({

    systemPrompt,

    compressedInput

}) {

    const response = await fetch(

        "https://api.cerebras.ai/v1/chat/completions",

        {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization":
                    `Bearer ${process.env.CEREBRAS_API_KEY}`

            },

            body: JSON.stringify({

                model: "gpt-oss-120b",

                temperature: 0.2,

                messages: [

                    {

                        role: "system",

                        content: systemPrompt

                    },

                    {

                        role: "user",

                        content: compressedInput

                    }

                ]

            })

        }

    );

    if (!response.ok) {

        throw new Error(

            `Cerebras API Error: ${response.status}`

        );

    }

    return await response.json();

  }
  /* ============================================================
   4. GTM INTELLIGENCE BRAIN
============================================================ */

async function loadGTMIntelligenceBrain(

    socialReport = {},

    scopeReport = {},

    userProfile = {}

) {

    const gtmReport = {

        success: false,

        currentPosition: {},

        hiddenOpportunities: [],

        positioningGap: {},

        messagingDirection: {},

        contentDirection: {},

        offerDirection: {},

        actionPlan: [],

        confidence: 0,

        compressedContext: {},

        llmResponse: null

    };

    try {
      
console.log("SOCIAL REPORT:", JSON.stringify(socialReport, null, 2));
console.log("SCOPE REPORT:", JSON.stringify(scopeReport, null, 2));
      console.log("socialReport.identity:", socialReport.identity);
console.log("socialReport.socialReport:", socialReport.socialReport);

console.log("scopeReport.success:", scopeReport.success);
console.log("scopeReport.scopeReport:", scopeReport.scopeReport);
        const {

            identity,

            authoritySignals,

            trustSignals,

            audienceSignals,

            contentSignals

        } = socialReport;

        const {

            detectedCategory,

            primaryScope,

            secondaryScope,

            categorySignals

        } = scopeReport;
      /* ==========================================
           BUILD COMPRESSED CONTEXT
        ========================================== */

        gtmReport.compressedContext = {

            category: detectedCategory,

            identity,

            authoritySignals,

            trustSignals,

            audienceSignals,

            contentSignals,

            primaryScope,

            secondaryScope,

            categorySignals,

            userProfile

        };

        const intelligenceContext = {

    evidence: {

        socialPosition: {

            identity,

            authoritySignals,

            trustSignals,

            audienceSignals,

            contentSignals

        },

        scopePosition: {

            detectedCategory,

            primaryScope,

            secondaryScope,

            categorySignals

        },

        profile: userProfile

    },

    reasoningRules: {

        evidenceFirst: true,

        noAssumptions: true,

        noGenericAdvice: true,

        requireEvidence: true,

        requireContradictions: true,

        requireRepeatedSignals: true

    }

};

        console.log(
  "INTELLIGENCE CONTEXT:",
  JSON.stringify(intelligenceContext, null, 2)
);

const compressedInput = JSON.stringify(
    intelligenceContext,
    null,
    2
);

console.log(
  "COMPRESSED INPUT:",
  compressedInput
);
      /* ==========================================
           BUILD LLM PROMPT & REASONING
        ========================================== */
const systemPrompt = `

IDENTITY

You are the TruthLoop GTM Intelligence Brain.

MISSION

Your job is NOT to give marketing advice.

Your job is to discover evidence-backed market opportunities.

TRUTHLOOP LAW

TruthLoop discovers people.

You discover opportunities.

Never perform psychological diagnosis.

Never repeat TruthLoop findings.

INPUT

You receive:

1. Social Position Evidence

2. Scope Position Evidence

3. Profile Evidence

These are evidence.

They are NOT conclusions.

CORE PRINCIPLES

Evidence First.

Reasoning Second.

Opportunity Last.

Never reverse this order.

NEVER

Never invent evidence.

Never guess.

Never assume.

Never hallucinate.

Never use generic startup advice.

Never recommend:
- Post more
- Build authority
- Define your niche
- Create content
- Become a thought leader

unless the supplied evidence explicitly supports it.
REASONING CONSTITUTION

Always follow this order.

1. Evidence
What facts are directly supported?

2. Patterns
What signals repeat across the evidence?

3. Contradictions
Where do observable behaviors conflict with positioning, messaging, or goals?

4. Constraints
What hidden constraint explains most of the observed evidence?

5. Opportunity
If that constraint disappears, what opportunity becomes available?

6. Action
Recommend only the single highest-leverage next action.

Never skip a step.

Never jump directly from evidence to advice.
REASONING PROCESS

Step 1

Summarize the observable evidence.

Step 2

Identify repeated signals.

Step 3

Identify contradictions.

Step 4

Identify the biggest market constraint.

Step 5

Identify the opportunity created by that constraint.

Step 6

Recommend ONE highest-impact action.

OUTPUT RULES

Every conclusion must be supported by supplied evidence.

If evidence is missing,

say:

"Insufficient evidence."

Do not invent an answer.

STYLE

Evidence-driven.

Specific.

Concise.

Actionable.
EVIDENCE QUALITY

High confidence:
- Multiple independent signals support the conclusion.

Medium confidence:
- One strong signal supports the conclusion.

Low confidence:
- Weak or incomplete evidence.

If confidence is low,

say:

"Insufficient evidence."

Do not invent missing information.
OUTPUT
FINAL VALIDATION

Before returning the JSON, verify every conclusion.

For every statement ask:

"What evidence supports this?"

If no evidence exists,

remove the statement.

Never reward confidence.

Reward evidence.

The strongest report is the most truthful report,

not the most impressive report.

Never generate recommendations that could apply to any company.

Every recommendation must directly reference the supplied evidence.

If two different users receive the same recommendation,

the report is too generic.
CONTRADICTION LAW

Always search for hidden contradictions.

Examples:

Strong engagement
+
Weak positioning

↓

Hidden positioning gap

----------------

Strong content
+
Weak conversions

↓

Offer friction

----------------

Strong authority
+
Weak trust

↓

Messaging inconsistency

----------------

High visibility
+
Low action

↓

Value transfer failure

The biggest opportunity usually exists where the strongest contradiction exists.
OPPORTUNITY LAW

Do not search for opportunities directly.

Search for friction.

Opportunity is simply friction that can be removed.

Smaller friction.

Higher leverage.

Higher leverage.

Higher market opportunity.

Return JSON only.

Required schema:

{
  "evidenceSummary": "",
  "currentReality": "",
  "hiddenConstraint": "",
  "marketOpportunity": "",
  "reasoning": "",
  "highestImpactAction": "",
  "confidence": 0
}

`;
        

        const llmResponse = await callGTMModel({

            systemPrompt,

            compressedInput

        });

        

console.log(
    "RAW LLM RESPONSE:",
    JSON.stringify(llmResponse, null, 2)
);

gtmReport.llmResponse = llmResponse;

gtmReport.success = true;

const aiMessage =
    llmResponse?.choices?.[0]?.message?.content || "";

console.log("AI MESSAGE:");
console.log(aiMessage);

        try {

    const parsed = JSON.parse(aiMessage);

    gtmReport.evidenceSummary =
        parsed.evidenceSummary || "";

    gtmReport.currentReality =
        parsed.currentReality || "";

    gtmReport.hiddenConstraint =
        parsed.hiddenConstraint || "";

    gtmReport.marketOpportunity =
        parsed.marketOpportunity || "";

    gtmReport.reasoning =
        parsed.reasoning || "";

    gtmReport.highestImpactAction =
        parsed.highestImpactAction || "";

    gtmReport.confidence =
        typeof parsed.confidence === "number"
            ? parsed.confidence
            : 50;

    gtmReport.success = true;

} catch (error) {

    console.error(
        "[GTM Parse Error]",
        error
    );

    gtmReport.rawResponse = aiMessage;

    gtmReport.success = false;

}

        gtmReport.provider =
            "Cerebras";

        gtmReport.model =
            "gpt-oss-120b";

        if (
            typeof gtmReport.confidence !== "number"
        ) {

            gtmReport.confidence = 50;

        }

        return gtmReport;

    } catch (error) {

        console.error(

            "[GTM Intelligence Brain]",

            error

        );

        return gtmReport;

    }

      }
  /* ============================================================
     3. LOGIN VALIDATION
     (Future)
  ============================================================ */

  const userAuthenticated = true;

  if (!userAuthenticated) {

    return res.status(401).json({

      reply:
      "Login Required"

    });

  }

  /* ============================================================
     4. LOAD GTM PACKAGE
  ============================================================ */

  const gtmPackage = {

  category,

  conversation,

  socialMediaLinks

};
  /* ============================================================
     5. LOAD BRAINS
     (Future)
  ============================================================ */
const socialReport =
    await loadSocialPositionBrain(gtmPackage);

console.log(
    "AFTER loadSocialPositionBrain",
    JSON.stringify(socialReport, null, 2)
);

const scopeReport =
    await loadScopePositionBrain(gtmPackage);

console.log(
    "AFTER loadScopePositionBrain",
    JSON.stringify(scopeReport, null, 2)
);

const gtmReport =
    await loadGTMIntelligenceBrain(
        socialReport,
        scopeReport
    );
  // Social Position Brain

  // Scope Position Brain

  // GTM Intelligence Brain

  /* ============================================================
     6. RETURN PLACEHOLDER
  ============================================================ */

  return res.status(200).json(gtmReport);
  

}
