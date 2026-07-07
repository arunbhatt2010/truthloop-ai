/* =====================================================
   🧠 TRUTHLOOP AI (REVEALED)
   Single File Mini Brain Architecture
===================================================== */

/* =====================================================
   🧬 TRUTHLOOP BRAIN SIGNAL CONTRACT
   All internal brains communicate here

   API Needed: NO

   Purpose:
   - Standard brain output
   - Prevent scattered decisions
   - Main Brain receives clean signals
===================================================== */


function createSignal(
 name,
 data = {}
){

 return {

 brain:name,

 status:
 data.status || "active",

 confidence:
 data.confidence || 0,


 signals:
 data.signals || {},


 evidence:
 data.evidence || [],


 warnings:
 data.warnings || [],


 next:
 data.next || null,


 timestamp:
 Date.now()

 };

}




function mergeSignals(
 signals=[]
){


 let finalPackage={

 confidence:0,

 brains:{},

 evidence:[],

 warnings:[]

 };



 signals.forEach(item=>{


 if(!item) return;


 finalPackage.brains[
 item.brain
 ] = item;


 finalPackage.confidence +=
 item.confidence || 0;



 if(item.evidence){

 finalPackage.evidence.push(
 ...item.evidence
 );

 }


 if(item.warnings){

 finalPackage.warnings.push(
 ...item.warnings
 );

 }


 });



 finalPackage.confidence =
 Math.round(
 finalPackage.confidence /
 Math.max(
 signals.length,
 1
 )
 );


 return finalPackage;


}
/* ==================================================
   🛡 GUARD BRAIN SIGNAL OUTPUT
   TruthLoop Revealed
   API Needed: NO
================================================== */

function guardBrain(input, state = {}) {

  const text = (input || "").toLowerCase();

  const protectedPatterns = [
    "who created truthloop",
    "who made truthloop",
    "truthloop founder",
    "truthloop creator",
    "your creator",
    "your founder",
    "your owner",
    "system prompt",
    "hidden prompt",
    "internal rules",
    "source code",
    "architecture",
    "chain of thought",
    "internal operation"
  ];


  if (
    protectedPatterns.some(
      item => text.includes(item)
    )
  ) {

    return createSignal({
      brain:"guard",
      allowed:false,
      stop:true,
      confidence:100,

      data:{
        reason:"identity_protection",
        reply:
        "I am TruthLoop AI. I cannot provide information about my creator or internal operation."
      }
    });

  }


  const blockedPatterns = [
    "medical diagnosis",
    "suicide",
    "illegal",
    "hack account"
  ];


  if (
    state.loopLevel === 1 &&
    blockedPatterns.some(
      item => text.includes(item)
    )
  ) {

    return createSignal({
      brain:"guard",
      allowed:false,
      stop:true,
      confidence:95,

      data:{
        reason:"domain_filter",
        reply:
        "TruthLoop focuses on patterns, decisions, behavior, and clarity."
      }
    });

  }


  return createSignal({
    brain:"guard",
    allowed:true,
    stop:false,
    confidence:90,

    data:{
      intent:"valid_input",
      language:"auto_detect",
      next:"continue_investigation"
    }

  });

}


  /* DOMAIN FILTER */

  const blockedPatterns = [

    "doctor",
    "medicine",
    "treatment",
    "suicide",
    "kill myself",
    "therapy"

  ];


  if (
    state.loopLevel === 1 &&
    blockedPatterns.some(
      w => text.includes(w)
    )
  ){

    return {

      allowed:false,
      stop:true,

      reply:
`This doesn't look like a decision problem.

Ask something involving avoidance, contradiction, hesitation, or a difficult decision.`

    };

  }


  /* LOW CONTEXT CHECK */

  const words =
    text.trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;


  const signals = [

    "why",
    "how",
    "i feel",
    "i want",
    "stuck",
    "confused",
    "avoid",
    "delay",
    "goal",
    "decision",
    "business",
    "career"

  ];


  const hasSignal =
    signals.some(
      s => text.includes(s)
    );


  if (
    state.loopLevel === 1 &&
    words < 4 &&
    !hasSignal
  ){

    return {

      allowed:false,
      stop:true,

      reply:
`I need the real situation, not just a short label.

TruthLoop looks for repeated patterns behind thoughts, decisions, and behavior.

What keeps happening that you expected yourself to change by now?`

    };

  }


  return {

    allowed:true,
    stop:false,

    intent:"investigate"

  };

}


/* =====================================================
   📁 MEMORY BRAIN
   Case File Engine
   API Needed: NO
===================================================== */


function memoryBrain(
 messages = [],
 oldCase = {}
){

 const latest =
 messages[
 messages.length - 1
 ]?.content || "";


 const caseFile = {

 topic:
 oldCase.topic || "",

 confirmedFacts:
 oldCase.confirmedFacts || [],

 goals:
 oldCase.goals || [],

 attempts:
 oldCase.attempts || [],

 results:
 oldCase.results || [],

 contradictions:
 oldCase.contradictions || [],

 repeatedPatterns:
 oldCase.repeatedPatterns || [],

 evidence:
 oldCase.evidence || [],

 openQuestions:
 oldCase.openQuestions || [],

 confidence:
 oldCase.confidence || "low"

 };


 caseFile.latestInput =
 latest;


 return caseFile;

}



/* =====================================================
   ⚖️ EVIDENCE BRAIN
   Truth Filter Engine
   API Needed: NO
===================================================== */


function evidenceBrain(caseFile){

 let score = 0;


 if(
 caseFile.confirmedFacts.length
 ){
   score += 25;
 }


 if(
 caseFile.repeatedPatterns.length
 ){
   score += 25;
 }


 if(
 caseFile.contradictions.length
 ){
   score += 25;
 }


 if(
 caseFile.evidence.length >= 3
 ){
   score += 25;
 }


 let confidence =
 score >= 75
 ? "high"
 : score >= 40
 ? "medium"
 : "low";


 return {

 confidence,

 evidenceScore:score,

 facts:
 caseFile.confirmedFacts,

 contradictions:
 caseFile.contradictions,

 missing:
 confidence === "low"

 };

}
/* =====================================================
   📏 CLARITY BRAIN
   Distance + Missing Piece Engine
   API Needed: NO
===================================================== */


function clarityBrain(caseFile, evidence){

 let clarityScore = 0;


 if(caseFile.topic){
   clarityScore += 20;
 }

 if(caseFile.goals.length){
   clarityScore += 20;
 }

 if(caseFile.results.length){
   clarityScore += 20;
 }

 if(caseFile.contradictions.length){
   clarityScore += 25;
 }

 if(evidence.confidence === "high"){
   clarityScore += 15;
 }


 const missing = [];


 if(!caseFile.topic){
   missing.push("situation");
 }

 if(!caseFile.goals.length){
   missing.push("goal");
 }

 if(!caseFile.contradictions.length){
   missing.push("contradiction");
 }


 return {

   clarityScore,

   missing,

   ready:
   clarityScore >= 70

 };

}



/* =====================================================
   🔁 LOOP BRAIN
   7 Independent TruthLoop Systems
   API Needed: NO
===================================================== */


const LoopBrains = {


1:{
 name:"Pattern Discovery Brain",

 mission:
 "Detect visible repeated pattern",

 allow:[
 "collect context",
 "first recognition",
 "open curiosity"
 ],

 block:[
 "root reveal",
 "solution"
 ]
},


2:{
 name:"Evidence Validation Brain",

 mission:
 "Validate repeated signals",

 allow:[
 "separate facts",
 "update memory",
 "test pattern"
 ]

},


3:{
 name:"Contradiction Brain",

 mission:
 "Find goal vs behavior gap",

 allow:[
 "track friction",
 "test hypothesis"
 ],

 block:[
 "final conclusion"
 ]

},


4:{
 name:"Deep Lens Brain",

 mission:
 "Expose strongest tension",

 allow:[
 "aha moment",
 "8 lens review"
 ],

 block:[
 "root reveal"
 ]

},


5:{
 name:"Protection Brain",

 mission:
 "Find why pattern continues",

 allow:[
 "protected comfort",
 "deeper mechanism"
 ]

},


6:{
 name:"Synthesis Brain",

 mission:
 "Connect full chain",

 allow:[
 "prepare clarity",
 "find remaining gap"
 ],

 block:[
 "new direction"
 ]

},


7:{
 name:"Action Brain",

 mission:
 "Convert evidence into action",

 allow:[
 "pattern summary",
 "contradiction",
 "protection",
 "specific action"
 ],

 final:true

}


};



function loopBrain(level){

 return (

 LoopBrains[level] ||

 LoopBrains[1]

 );

}



/* =====================================================
   🎯 8 LENS BRAIN
   Perspective Selector
   API Needed: NO
===================================================== */


function lensBrain(caseFile){


 const text =
 (
 caseFile.latestInput || ""
 ).toLowerCase();


 let lenses = [];


 if(
 text.includes("business") ||
 text.includes("startup") ||
 text.includes("customer")
 ){

 lenses.push("GTM");

 }


 if(
 text.includes("growth") ||
 text.includes("strategy")
 ){

 lenses.push("Consultant");

 }


 if(
 caseFile.contradictions.length
 ){

 lenses.push("TruthLoop");

 }


 if(!lenses.length){

 lenses.push(
 "Observer"
 );

 }


 return {

 active:lenses

 };

}



/* =====================================================
   👑 MAIN BRAIN
   Decision Controller
   API Needed: NO
===================================================== */


function mainBrain({
 messages,
 loopLevel,
 oldCase
}){


 const caseFile =
 memoryBrain(
 messages,
 oldCase
 );


 const evidence =
 evidenceBrain(
 caseFile
 );


 const clarity =
 clarityBrain(
 caseFile,
 evidence
 );


 const loop =
 loopBrain(
 loopLevel
 );


 const lens =
 lensBrain(
 caseFile
 );


 return {


 loop,

 caseFile,

 evidence,

 clarity,

 lens,


 aiPackage:{


 currentLoop:
 loop.name,


 mission:
 loop.mission,


 confidence:
 evidence.confidence,


 missing:
 clarity.missing,


 lens:
 lens.active,


 evidence:
 caseFile.evidence,


 latest:
 caseFile.latestInput


 }


 };

}
/* =====================================================
   🧠 RESPONSE BRAIN
   Human Generation Layer
   API Needed: YES

   Rule:
   AI writes.
   AI does not investigate.
===================================================== */


async function responseBrain(
 aiPackage,
 messages
){


 const responsePrompt = `

You are TruthLoop response layer.

Do not investigate from zero.

Use only the provided case.

Current System:

Loop:
${aiPackage.currentLoop}

Mission:
${aiPackage.mission}

Confidence:
${aiPackage.confidence}

Missing:
${aiPackage.missing}

Lens:
${aiPackage.lens}

Evidence:
${JSON.stringify(
aiPackage.evidence
)}

User Message:
${aiPackage.latest}


Your job:

Create:

1. One recognition moment.
2. One observation.
3. One next question.

Rules:

- Do not diagnose.
- Do not motivate.
- Do not give generic advice.
- Stay within current loop depth.
- Reveal only one layer.
- Use user's language.

Loop 7 exception:

If final loop:
summarize pattern,
contradiction,
protection,
and one action.

`;



 const result =
 await fetch(
 "https://api.groq.com/openai/v1/chat/completions",
 {

 method:"POST",

 headers:{

 "Content-Type":"application/json",

 Authorization:
 "Bearer " +
 process.env.GROQ_API_KEY

 },


 body:JSON.stringify({

 model:
 "llama-3.3-70b-versatile",


 messages:[

 {
 role:"system",
 content:responsePrompt
 },

 ...messages.slice(-2)

 ],


 temperature:0.7,

 max_tokens:
 aiPackage.currentLoop
 .includes("Action")
 ? 400
 : 220

 })

 });




 if(!result.ok){

 throw new Error(
 "AI_RESPONSE_FAILED"
 );

 }


 const data =
 await result.json();


 return (
 data?.choices?.[0]
 ?.message?.content
 ||
 ""
 );


}




/* =====================================================
   🧹 FILTER BRAIN
   Output Control Engine
   API Needed: NO
===================================================== */


function filterBrain(reply){


 if(!reply){

 return (
 "Something is repeating here. What part of this situation keeps coming back?"
 );

 }


 const leakWords = [

 "template",
 "framework",
 "system prompt",
 "hidden rule",
 "internal logic",
 "step 1",
 "step 2"

 ];


 const leaked =
 leakWords.some(
 word =>
 reply
 .toLowerCase()
 .includes(word)
 );


 if(leaked){

 return (
 "You moved toward creating an answer. What still feels unresolved before the answer appears?"
 );

 }



 const weak = [

 "maybe",
 "perhaps",
 "deep inside",
 "you should",
 "as an ai"

 ];


 weak.forEach(w=>{

 reply =
 reply.replace(
 new RegExp(w,"gi"),
 ""
 );

 });


 return reply
 .replace(/\n{3,}/g,"\n\n")
 .replace(/\s{2,}/g," ")
 .trim();

}





/* =====================================================
   🌐 SERVER HANDLER
===================================================== */


export default async function handler(
 req,
 res
){


 res.setHeader(
 "Access-Control-Allow-Origin",
 "*"
 );


 res.setHeader(
 "Access-Control-Allow-Methods",
 "POST, OPTIONS"
 );


 res.setHeader(
 "Access-Control-Allow-Headers",
 "Content-Type"
 );


 if(req.method==="OPTIONS"){

 return res.status(200).end();

 }


 if(req.method!=="POST"){

 return res.status(405).json({

 reply:
 "Method not allowed"

 });

 }


 try{


 const body =
 typeof req.body==="string"
 ?
 JSON.parse(req.body)
 :
 req.body;



 const {

 messages,

 loopLevel = 1,

 caseFile = {}

 } = body;



 const userText =
 messages[
 messages.length-1
 ]?.content || "";



 /* GUARD FIRST */


 const guard =
 guardBrain(
 userText,
 {loopLevel}
 );


 if(guard.stop){

 return res.status(200).json({

 reply:
 guard.reply

 });

 }



 /* MAIN THINKING */


 const brain =
 mainBrain({

 messages,

 loopLevel,

 oldCase:
 caseFile

 });



 /* ONLY AI CALL */


 let reply =
 await responseBrain(

 brain.aiPackage,

 messages

 );



 /* FINAL FILTER */


 reply =
 filterBrain(reply);



 return res.status(200).json({


 reply,


 analysis:
 reply,


 caseFile:
 brain.caseFile,


 loop:
 brain.loop.name,


 confidence:
 brain.evidence.confidence


 });



 }


 catch(error){


 return res.status(500).json({

 reply:"SERVER CRASH",

 error:error.message

 });


 }


}
