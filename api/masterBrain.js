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

  return [];

}

/* =========================
   🏢 ORGANIZATION SCANNER
========================= */

function scanOrganizationPatterns(text) {

  return [];

}

/* =========================
   🧩 PATTERN INTELLIGENCE
========================= */

function scanPatternSignals(text) {

  return [];

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
  return {

    brain: BRAIN_NAME,

    version: VERSION,

    environment,
selectedBrain,
     conflictResolution,
    communityPatterns,

    organizationPatterns,

    patternSignals,

    confidence

  };

}
