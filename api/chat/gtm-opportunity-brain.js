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
const text = (profileLink || "").toLowerCase();

let intent = "General Growth";
let opportunity = "Hidden Opportunity";
let audience = "Professionals";
let distribution = "LinkedIn";
let monetization = "Consulting";
let actions = [
  "Validate demand with 5 real users",
  "Publish one focused offer",
  "Collect feedback",
  "Improve positioning"
];
if (
  text.includes("ai") ||
  text.includes("tool") ||
  text.includes("saas")
) {

  actions = [
    "Publish daily founder updates",
    "Interview 20 potential users",
    "Launch a beta waitlist",
    "Join 5 niche communities"
  ];
}
if (
  text.includes("book") ||
  text.includes("kindle")
) {

  actions = [
    "Audit book title and cover",
    "Create content around key chapters",
    "Build an email list",
    "Collect reader reviews"
  ];
}
if (
  text.includes("website") ||
  text.includes("blog")
) {

  actions = [
    "Publish one pillar article",
    "Improve internal linking",
    "Build newsletter signup flow",
    "Promote content weekly"
  ];
}  
if (
  text.includes("ai") ||
  text.includes("tool") ||
  text.includes("saas")
) {

  intent = "AI Product Growth";

  audience =
  "Founders, Builders, Creators";

  distribution =
  "LinkedIn + X + Communities";

  monetization =
  "SaaS + Membership + Consulting";
}

if (
  text.includes("book") ||
  text.includes("kindle")
) {

  intent =
  "Knowledge Product Growth";

  audience =
  "Readers, Learners, Professionals";

  distribution =
  "Website + Newsletter + LinkedIn";

  monetization =
  "Book Sales + Courses + Coaching";
}

if (
  text.includes("website") ||
  text.includes("blog")
) {

  intent =
  "Audience Growth";

  audience =
  "Organic Search Audience";

  distribution =
  "SEO + Newsletter + Social";

  monetization =
  "Ads + Affiliate + Products";
    }
  if (
  text.includes("users")
) {
  opportunity =
  "Audience Acquisition";
}

if (
  text.includes("traffic")
) {
  opportunity =
  "Traffic Monetization";
}

if (
  text.includes("sales")
) {
  opportunity =
  "Conversion Optimization";
}

if (
  text.includes("audience")
) {
  opportunity =
  "Audience Expansion";
}
return res.status(200).json({

reply: `

GTM OPPORTUNITY REPORT

INTENT:
${intent}

OPPORTUNITY:
${opportunity}

AUDIENCE:
${audience}

DISTRIBUTION:
${distribution}

MONETIZATION:
${monetization}

TOP ACTIONS:

1. ${actions[0]}
2. ${actions[1]}
3. ${actions[2]}
4. ${actions[3]}

`

});
}
