/* ============================================================
   FOOTPRINT SUPPORT

   Mission

   Prepare every public footprint investigation before
   DigitalFootprintBrain begins.

   Responsibilities

   • Validate investigation request
   • Detect supported platform
   • Resolve platform type
   • Determine access method
   • Decide OAuth requirements
   • Prepare investigation context
   • Build one Footprint Context Package

   Inputs

   • TruthLoop Package
   • Public Profile / Website Link
   • Current Loop

   Output

   One standardized Footprint Context Package.

   This package prepares the investigation and is passed
   to DigitalFootprintBrain during Loop 7.

   Never

   • Collect public evidence
   • Analyze profiles
   • Generate conclusions
   • Build Evidence Package
   • Generate GTM
   • Give advice
   • Guess missing information
   • Use private data

============================================================ */

export async function loadFootprintSupport({

    truthLoopPackage = {},

    profileLink = "",

    currentLoop = 7

} = {}) {

// STEP 1
// Security

const normalizedProfileLink =
    typeof profileLink === "string"
        ? profileLink.trim()
        : "";

// STEP 2
// Investigation Request Validation

if (!normalizedProfileLink) {

    return {

        success: false,

        stage: "Investigation Request",

        reason:
            "A public profile or website link is required."

    };

}

    // STEP 3
// Platform Detection

let hostname = "";

try {

    hostname = new URL(normalizedProfileLink)
        .hostname
        .replace(/^www\./, "")
        .toLowerCase();

} catch {

    return {

        success: false,

        stage: "Platform Detection",

        reason:
            "Invalid public profile or website link."

    };

}

    // STEP 4
// Platform Resolution

const platformMap = {

    "linkedin.com": "LinkedIn",

    "github.com": "GitHub",

    "x.com": "X",

    "twitter.com": "X",

    "facebook.com": "Facebook",

    "reddit.com": "Reddit",

    "youtube.com": "YouTube",

    "medium.com": "Medium",

    "substack.com": "Substack"

};

const platformType =

    platformMap[hostname] || "Website";

// STEP 5
// Access Method

const accessMethodMap = {

    LinkedIn: "OAuth",

    GitHub: "Public",

    X: "OAuth",

    Facebook: "OAuth",

    Reddit: "Public",

    YouTube: "Public",

    Medium: "Public",

    Substack: "Public",

    Website: "Public"

};

const accessMethod =

    accessMethodMap[platformType] || "Public";

// STEP 6
// OAuth Decision

const oauthRequired =
    accessMethod === "OAuth";

const oauthProvider =

    oauthRequired
        ? platformType
        : null;

 // STEP 7
// Investigation Context

const investigationContext = {

    truthLoopPackage,

    profileLink:
        normalizedProfileLink,

    hostname,

    platformType,

    accessMethod,

    oauthRequired,

    oauthProvider,

    currentLoop

};

// STEP 8
// Footprint Context Package

const footprintContextPackage = {

    success: true,

    stage: "Footprint Support",

    context:
        investigationContext

};

    return footprintContextPackage;

       }
