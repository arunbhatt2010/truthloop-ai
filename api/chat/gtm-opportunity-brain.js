export default async function handler(req, res) {
const body = req.body || {};
  /* =========================
   ADMIN PASSCODE GATE
========================= */

const ADMIN_PASSCODE =
  "Admin Gopi";

const {
  messages = [],
  loopLevel = 1,
  passcode = ""
} = body || {};

const isAdmin =
  passcode === ADMIN_PASSCODE;
/* =========================
   ACTIVATION GATE
========================= */



const activated =
  isAdmin ||
  loopLevel >= 7;
  
/* =========================
   ACTIVATION SOURCE
========================= */

const activationSource =
  isAdmin
    ? "ADMIN OVERRIDE"
    : "LOOP 7 UNLOCK";
if (!activated) {

  return res.status(200).json({

    reply: `

GTM OPPORTUNITY ENGINE

STATUS:
LOCKED

REQUIREMENT:

Complete Loop 7

OR

Use Admin Override

`

  });

}

/* =========================
   GTM OPPORTUNITY BRAIN
========================= */

const brain = {

version: "1.1",

entryGate: "multi-source",

position: "",

supportedEntryTypes: [

  "TruthLoop Context",
  "LinkedIn Profile",
  "Website",
  "YouTube Channel",
  "X/Twitter Profile",
  "Newsletter",
  "Business Idea",
  "Skill Stack",
  "AI Project",
  "Founder Mode"

],

allowedDomains: [

  "growth",
  "business",
  "ownership",
  "jobs",
  "freelancing",
  "audience building",
  "lead generation",
  "monetization",
  "distribution",
  "gtm",
  "ai"

],

ignoredDomains: [

  "politics",
  "religion",
  "relationships",
  "health",
  "entertainment",
  "personal drama"

]

};
  /* =========================
ENTRY DETECTOR
Current Version:
LinkedIn Only

Future Versions:

- TruthLoop Context
- Website
- YouTube
- X/Twitter
- Newsletter
- Business Idea
- Skill Stack
- AI Project
- Founder Mode
========================= */
   
   
/* =========================
   PROFILE ENTRY GATE
========================= */

const profileLink =
  messages[messages.length - 1]
    ?.content
    ?.trim() || "";

/* =========================
ENTRY DETECTOR
========================= */

const userInput =
  messages[messages.length - 1]
    ?.content
    ?.trim() || "";

let entryType = "TruthLoop Context";

if (
  userInput.includes("linkedin.com")
) {

  entryType = "LinkedIn Profile";

}
else if (
  userInput.includes("youtube.com") ||
  userInput.includes("youtu.be")
) {

  entryType = "YouTube Channel";

}
else if (
  userInput.includes("twitter.com") ||
  userInput.includes("x.com")
) {

  entryType = "X/Twitter Profile";

}
else if (
  userInput.includes("http")
) {

  entryType = "Website";

}
/* =========================
   POSITION DETECTOR
========================= */

let position = "professional";

const lowerProfile =
  profileLink.toLowerCase();

if (
  lowerProfile.includes("founder")
) {

  position = "founder";

}
else if (
  lowerProfile.includes("creator")
) {

  position = "creator";

}
else if (
  lowerProfile.includes("freelancer")
) {

  position = "freelancer";

}
  const networkMap = {

  entryProfile: profileLink,

  position: position,

  observationTargets: [

    "founders",
    "builders",
    "creators",
    "freelancers",
    "job seekers",
    "professionals",
    "business owners"

  ],

  observationSources: [

    "posts",
    "comments",
    "discussions",
    "communities",
    "followers",
    "engagement clusters"

  ],

  signalSources: [

    "repeated complaints",
    "repeated questions",
    "repeated failures",
    "repeated confusion",
    "repeated requests for help",
    "recurring behavior patterns"

  ],

  allowedDomains: brain.allowedDomains,

  ignoredDomains: brain.ignoredDomains

};
/* =========================
   NETWORK DISCOVERY READY
========================= */

return res.status(200).json({

reply: `

GTM OPPORTUNITY BRAIN

STATUS:
READY

ACTIVATION:
${activationSource}

ENTRY PROFILE:
${profileLink}
ENTRY TYPE:
${entryType}
POSITION:
${position}

ALLOWED DOMAINS:

• Growth
• Business
• Ownership
• Jobs
• Freelancing
• Audience Building
• Lead Generation
• Monetization
• Distribution
• GTM
• AI

NEXT PHASE:

Network Mapping

`

});
}
