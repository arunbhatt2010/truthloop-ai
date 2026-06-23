/* =========================
   MASTER BRAIN PURPOSE
=========================

INPUT:

- User Message
- Loop Level
- Current Category
- Conversation History

OUTPUT:

- Environment
- Selected Brain
- Detected Signals
- Conflict Detected
- Response Strategy

RULE:

Master Brain never generates analysis.

Master Brain only routes intelligence.

========================= */
/* =========================
   🧠 MASTER BRAIN v1
========================= */

const BRAIN_NAME = "Master Brain";
const VERSION = "1.0";

/* =========================
   🌍 ENVIRONMENT DETECTOR
========================= */

function detectEnvironment(text) {

  const lowerText =
    text.toLowerCase();

  /* =========================
     MULTI ENVIRONMENT
  ========================= */

  const multiSignals = [
    "founders and employees",
    "customers and company",
    "community and company",
    "leadership and team",
    "employees and management"
  ];

  if (
    multiSignals.some(signal =>
      lowerText.includes(signal)
    )
  ) {

    return {
      environment:
        "multi-environment",

      confidence: 0.90,

      signals:
        ["multiple systems detected"]
    };

  }

  /* =========================
     ORGANIZATION
  ========================= */

  const organizationSignals = [

    "company",
    "team",
    "startup",
    "leadership",
    "management",
    "department",
    "employees",
    "organization"

  ];

  const organizationMatches =
    organizationSignals.filter(signal =>
      lowerText.includes(signal)
    );

  if (
    organizationMatches.length >= 2
  ) {

    return {

      environment:
        "organization",

      confidence: 0.80,

      signals:
        organizationMatches

    };

  }

  /* =========================
     COMMUNITY
  ========================= */

  const communitySignals = [

    "community",
    "group",
    "members",
    "founders",
    "creators",
    "students",
    "people here"

  ];

  const communityMatches =
    communitySignals.filter(signal =>
      lowerText.includes(signal)
    );

  if (
    communityMatches.length >= 2
  ) {

    return {

      environment:
        "community",

      confidence: 0.80,

      signals:
        communityMatches

    };

  }

  /* =========================
     INDIVIDUAL
  ========================= */

  const individualSignals = [

    "i ",
    "me ",
    "my ",
    "myself"

  ];

  const individualMatches =
    individualSignals.filter(signal =>
      lowerText.includes(signal)
    );

  if (
    individualMatches.length >= 1
  ) {

    return {

      environment:
        "individual",

      confidence: 0.70,

      signals:
        individualMatches

    };

  }

  /* =========================
     UNKNOWN
  ========================= */

  return {

    environment:
      "unknown",

    confidence: 0,

    signals: []

  };
/* =========================
   🫀 BRAIN SELECTOR
========================= */

function selectBrain(environment) {

  const env =
    environment.environment;

  switch (env) {

    case "individual":

      return {

        selectedBrain:
          "truthloop-core",

        reason:
          "Individual environment detected"

      };

    case "community":

      return {

        selectedBrain:
          "community-brain",

        reason:
          "Community environment detected"

      };

    case "organization":

      return {

        selectedBrain:
          "organization-brain",

        reason:
          "Organization environment detected"

      };

    case "multi-environment":

      return {

        selectedBrain:
          "pattern-intelligence-brain",

        reason:
          "Multiple environments detected"

      };

    default:

      return {

        selectedBrain:
          "truthloop-core",

        reason:
          "Unknown environment"

      };

  }

}
                            }
/* =========================
   👥 COMMUNITY SCANNER
========================= */

function scanCommunityPatterns(text) {

  const input =
    text.toLowerCase();

  const patterns = [];

  /* Community Blind Spot */

  if (
    input.includes("everyone") ||
    input.includes("nobody notices") ||
    input.includes("normal here")
  ) {

    patterns.push({
      pattern:
        "Community Blind Spot",

      confidence: 0.80
    });

  }

  /* Group Avoidance */

  if (
    input.includes("avoid") ||
    input.includes("nobody talks") ||
    input.includes("uncomfortable")
  ) {

    patterns.push({
      pattern:
        "Group Avoidance",

      confidence: 0.85
    });

  }

  /* Shared Narrative */

  if (
    input.includes("people say") ||
    input.includes("everyone believes") ||
    input.includes("common belief")
  ) {

    patterns.push({
      pattern:
        "Shared Narrative",

      confidence: 0.75
    });

  }

  /* Collective Contradiction */

  if (
    input.includes("say") &&
    input.includes("do")
  ) {

    patterns.push({
      pattern:
        "Collective Contradiction",

      confidence: 0.90
    });

  }

  /* Community Drift */

  if (
    input.includes("used to") ||
    input.includes("not anymore") ||
    input.includes("changed over time")
  ) {

    patterns.push({
      pattern:
        "Community Drift",

      confidence: 0.80
    });

  }

  /* Social Reinforcement Loop */

  if (
    input.includes("validation") ||
    input.includes("approval") ||
    input.includes("likes")
  ) {

    patterns.push({
      pattern:
        "Social Reinforcement Loop",

      confidence: 0.85
    });

  }

  return patterns;

}

/* =========================
   🏢 ORGANIZATION SCANNER
========================= */

function scanOrganizationPatterns(text) {

  const input =
    text.toLowerCase();

  const patterns = [];

  /* Organizational Blind Spot */

  if (
    input.includes("nobody notices") ||
    input.includes("hidden problem") ||
    input.includes("keeps happening")
  ) {

    patterns.push({
      pattern:
        "Organizational Blind Spot",

      confidence: 0.80
    });

  }

  /* Decision Bottleneck */

  if (
    input.includes("waiting for approval") ||
    input.includes("all decisions") ||
    input.includes("one person decides")
  ) {

    patterns.push({
      pattern:
        "Decision Bottleneck",

      confidence: 0.90
    });

  }

  /* Information Fracture */

  if (
    input.includes("communication gap") ||
    input.includes("teams don't know") ||
    input.includes("information not shared")
  ) {

    patterns.push({
      pattern:
        "Information Fracture",

      confidence: 0.85
    });

  }

  /* Accountability Gap */

  if (
    input.includes("nobody owns") ||
    input.includes("not my responsibility") ||
    input.includes("ownership unclear")
  ) {

    patterns.push({
      pattern:
        "Accountability Gap",

      confidence: 0.90
    });

  }

  /* Leadership Contradiction */

  if (
    input.includes("leadership says") &&
    input.includes("but")
  ) {

    patterns.push({
      pattern:
        "Leadership Contradiction",

      confidence: 0.95
    });

  }

  /* Execution Drift */

  if (
    input.includes("strategy") &&
    input.includes("execution")
  ) {

    patterns.push({
      pattern:
        "Execution Drift",

      confidence: 0.85
    });

  }

  /* Strategic Avoidance */

  if (
    input.includes("avoid decision") ||
    input.includes("postpone") ||
    input.includes("keep delaying")
  ) {

    patterns.push({
      pattern:
        "Strategic Avoidance",

      confidence: 0.85
    });

  }

  return patterns;

     }
/* =========================
   🌐 PATTERN INTELLIGENCE
========================= */

function scanPatternSignals(text) {

  const input =
    text.toLowerCase();

  const patterns = [];

  /* Cross-System Pattern */

  if (
    input.includes("same problem") ||
    input.includes("keeps repeating") ||
    input.includes("everywhere")
  ) {

    patterns.push({

      pattern:
        "Cross-System Pattern",

      confidence: 0.90

    });

  }

  /* Multi-Environment Loop */

  if (
    input.includes("founders and employees") ||
    input.includes("community and company") ||
    input.includes("customers and team")
  ) {

    patterns.push({

      pattern:
        "Multi-Environment Loop",

      confidence: 0.95

    });

  }

  /* Systemic Contradiction */

  if (
    input.includes("say") &&
    input.includes("but")
  ) {

    patterns.push({

      pattern:
        "Systemic Contradiction",

      confidence: 0.90

    });

  }

  /* Pattern Layer */

  if (
    input.includes("root cause") ||
    input.includes("underlying pattern") ||
    input.includes("deeper issue")
  ) {

    patterns.push({

      pattern:
        "Pattern Layer",

      confidence: 0.85

    });

  }

  /* Pattern Intelligence */

  if (
    input.includes("hidden pattern") ||
    input.includes("recurring pattern") ||
    input.includes("pattern behind")
  ) {

    patterns.push({

      pattern:
        "Pattern Intelligence",

      confidence: 0.95

    });

  }

  return patterns;

                  }

/* =========================
   🎯 CONFIDENCE ENGINE
========================= */

function calculateConfidence(
  environment
) {

  const signalCount =
    environment.signals.length;

  const env =
    environment.environment;

  if (
    env === "unknown"
  ) {

    return 0.10;

  }

  if (
    signalCount >= 5
  ) {

    return 0.95;

  }

  if (
    signalCount >= 3
  ) {

    return 0.85;

  }

  if (
    signalCount >= 2
  ) {

    return 0.75;

  }

  if (
    signalCount >= 1
  ) {

    return 0.60;

  }

  return 0.25;

}
/* =========================
   ⚖️ CONFLICT RESOLVER
========================= */

function resolveConflict(
  environment,
  selectedBrain
) {

  const env =
    environment.environment;

  let primaryPattern = null;

  let conflictDetected =
    false;

  let conflictReason =
    null;

  switch (env) {

    case "individual":

      primaryPattern =
        "individual-pattern";

      break;

    case "community":

      primaryPattern =
        "community-pattern";

      break;

    case "organization":

      primaryPattern =
        "organization-pattern";

      break;

    case "multi-environment":

      primaryPattern =
        "cross-system-pattern";

      conflictDetected =
        true;

      conflictReason =
        "Multiple environments detected";

      break;

    default:

      primaryPattern =
        "unknown";

  }

  return {

    primaryPattern,

    conflictDetected,

    conflictReason,

    selectedBrain:
      selectedBrain.selectedBrain

  };

}
/* =========================
   🚦 PATTERN ROUTER
========================= */

function routePattern(
  selectedBrain
) {

  const brain =
    selectedBrain.selectedBrain;

  switch (brain) {

    case "truthloop-core":

      return {

        route:
          "individual-scanner",

        scanner:
          "TruthLoop Core"

      };

    case "community-brain":

      return {

        route:
          "community-scanner",

        scanner:
          "Community Scanner"

      };

    case "organization-brain":

      return {

        route:
          "organization-scanner",

        scanner:
          "Organization Scanner"

      };

    case "pattern-intelligence-brain":

      return {

        route:
          "pattern-intelligence-scanner",

        scanner:
          "Pattern Intelligence Scanner"

      };

    default:

      return {

        route:
          "unknown",

        scanner:
          "Unknown"

      };

  }

  }
/* =========================
   🧠 SIGNAL MERGER
========================= */

function mergeSignals(

  communityPatterns,

  organizationPatterns,

  patternSignals

) {

  const allSignals = [

    ...communityPatterns,

    ...organizationPatterns,

    ...patternSignals

  ];

  if (
    allSignals.length === 0
  ) {

    return {

      primaryPattern:
        null,

      supportingPatterns:
        [],

      totalSignals:
        0

    };

  }

  const sortedSignals =
    allSignals.sort(

      (a, b) =>

        b.confidence -
        a.confidence

    );

  const primaryPattern =
    sortedSignals[0];

  const supportingPatterns =
    sortedSignals.slice(1);

  return {

    primaryPattern,

    supportingPatterns,

    totalSignals:
      allSignals.length

  };

     }
/* =========================
   ❓ QUESTION GENERATOR
========================= */

function generateQuestion(
  mergedSignals
) {

  const primary =
    mergedSignals
      ?.primaryPattern
      ?.pattern;

  if (!primary) {

    return {

      question:

        "What feels most important about this situation right now?",

      source:
        "fallback"

    };

  }

  switch (primary) {

    case "Group Avoidance":

      return {

        question:

          "What topic does everyone know exists but rarely discusses openly?",

        source:
          primary

      };

    case "Community Blind Spot":

      return {

        question:

          "What problem has become so normal that people no longer question it?",

        source:
          primary

      };

    case "Collective Contradiction":

      return {

        question:

          "Where is the biggest gap between what people say and what they repeatedly do?",

        source:
          primary

      };

    case "Decision Bottleneck":

      return {

        question:

          "Which decision depends on a small number of people before progress can happen?",

        source:
          primary

      };

    case "Leadership Contradiction":

      return {

        question:

          "Where does leadership behavior differ from leadership messaging?",

        source:
          primary

      };

    case "Execution Drift":

      return {

        question:

          "Where is day-to-day execution drifting away from the original goal?",

        source:
          primary

      };

    case "Strategic Avoidance":

      return {

        question:

          "What important decision keeps getting delayed through activity?",

        source:
          primary

      };

    case "Cross-System Pattern":

      return {

        question:

          "Where else do you notice this same pattern appearing?",

        source:
          primary

      };

    case "Systemic Contradiction":

      return {

        question:

          "What contradiction keeps recreating the same outcome?",

        source:
          primary

      };

    case "Pattern Intelligence":

      return {

        question:

          "What hidden pattern might explain these repeated events?",

        source:
          primary

      };

    default:

      return {

        question:

          "What do you think is driving this pattern underneath the surface?",

        source:
          "generic"

      };

  }

       }
/* =========================
   🧭 LOOP NAVIGATOR
========================= */

function navigateLoop(
  mergedSignals
) {

  const primary =
    mergedSignals
      ?.primaryPattern
      ?.pattern;

  if (!primary) {

    return {

      nextLoop:
        "exploration",

      reason:
        "No primary pattern detected"

    };

  }

  switch (primary) {

    case "Group Avoidance":

      return {

        nextLoop:
          "hidden-topic-investigation",

        reason:
          "Avoided topics detected"

      };

    case "Community Blind Spot":

      return {

        nextLoop:
          "blind-spot-investigation",

        reason:
          "Normalized issue detected"

      };

    case "Collective Contradiction":

      return {

        nextLoop:
          "contradiction-investigation",

        reason:
          "Values and behavior conflict"

      };

    case "Decision Bottleneck":

      return {

        nextLoop:
          "decision-analysis",

        reason:
          "Progress depends on few people"

      };

    case "Leadership Contradiction":

      return {

        nextLoop:
          "leadership-analysis",

        reason:
          "Leadership inconsistency detected"

      };

    case "Execution Drift":

      return {

        nextLoop:
          "execution-analysis",

        reason:
          "Strategy and execution diverging"

      };

    case "Strategic Avoidance":

      return {

        nextLoop:
          "avoidance-investigation",

        reason:
          "Important decisions delayed"

      };

    case "Cross-System Pattern":

      return {

        nextLoop:
          "cross-system-analysis",

        reason:
          "Pattern appears in multiple environments"

      };

    case "Systemic Contradiction":

      return {

        nextLoop:
          "system-contradiction-analysis",

        reason:
          "Recurring contradiction detected"

      };

    default:

      return {

        nextLoop:
          "general-investigation",

        reason:
          "Continue exploration"

      };

  }

  }
/* =========================
   📊 INVESTIGATION STATE ENGINE
========================= */

function trackInvestigationState(

  mergedSignals,

  generatedQuestion,

  loopNavigation

) {

  const signalCount =
    mergedSignals?.totalSignals || 0;

  const currentLoop =
    loopNavigation?.nextLoop ||
    "unknown";

  let stage =
    "surface-level";

  if (
    signalCount >= 2
  ) {

    stage =
      "pattern-recognition";

  }

  if (
    signalCount >= 4
  ) {

    stage =
      "root-cause";

  }

  if (
    signalCount >= 6
  ) {

    stage =
      "core-contradiction";

  }

  return {

    stage,

    currentLoop,

    signalCount,

    investigationActive:
      true

  };

         }
/* =========================
   🧠 MASTER BRAIN
========================= */

export function runMasterBrain(text) {

  const environment =
    detectEnvironment(text);
const selectedBrain =
  selectBrain(environment);
  const communityPatterns =
    scanCommunityPatterns(text);

  const organizationPatterns =
    scanOrganizationPatterns(text);

  const patternSignals =
    scanPatternSignals(text);

  const confidence =
  calculateConfidence(
    environment
  );
const conflictResolution =
  resolveConflict(
    environment,
    selectedBrain
  );
   const patternRoute =
  routePattern(
    selectedBrain
  );
   const mergedSignals =
  mergeSignals(

    communityPatterns,

    organizationPatterns,

    patternSignals

  );
   const generatedQuestion =
  generateQuestion(
    mergedSignals
  );
   const loopNavigation =
  navigateLoop(
    mergedSignals
  );
   const investigationState =
  trackInvestigationState(

    mergedSignals,

    generatedQuestion,

    loopNavigation

  );
  return {

    brain: BRAIN_NAME,

    version: VERSION,

    environment,
selectedBrain,
     conflictResolution,
     patternRoute,
     mergedSignals,
     generatedQuestion,
     loopNavigation,
     investigationState,
    communityPatterns,

    organizationPatterns,

    patternSignals,

    confidence

  };

}
