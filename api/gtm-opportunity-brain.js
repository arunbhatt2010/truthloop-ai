/* =========================
   GTM OPPORTUNITY BRAIN
========================= */

const brain = {

version: "1.0",

entryGate: "profile",

position: "",

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
   PROFILE ENTRY GATE
========================= */

const profileLink =
  messages[messages.length - 1]
    ?.content
    ?.trim() || "";

if (
  !profileLink.includes("linkedin.com")
) {

  return res.status(200).json({
    reply: `PROFILE REQUIRED

Provide a LinkedIn profile URL.`
  });

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
/* =========================
   NETWORK DISCOVERY READY
========================= */

return res.status(200).json({

reply: `

GTM OPPORTUNITY BRAIN

STATUS:
READY

ENTRY PROFILE:
${profileLink}

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
