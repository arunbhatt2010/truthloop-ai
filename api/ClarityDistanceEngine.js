/*
==================================================
TruthLoop AI
Clarity Distance Engine

Block 01 : Engine Identity & Constructor
Version : 1.0.0
Status : LOCKED

Purpose:
Initialize Clarity Distance Engine state.

Role:
Convert existing conversation intelligence
into visual reflection signals.

IMPORTANT:
Observer only.

This engine NEVER:
- changes Loop progress
- modifies AI response
- controls questions
- affects user journey

It only observes and reflects.
==================================================
*/


class ClarityDistanceEngine {


constructor(){


/*
==========================
ENGINE IDENTITY
==========================
*/


this.name =
"Clarity Distance Engine";


this.version =
"1.0.0";


this.mode =
"OBSERVER_ONLY";


this.status =
"READY";





/*
==========================
CONVERSATION STATE
==========================
*/


this.context = {


currentLoop:1,


lastUserInput:null,


lastAIResponse:null,


updatedAt:null


};





/*
==========================
OBSERVATION MEMORY
==========================
*/


this.history = [];


/*
Stores:

Loop progress
Previous signals
Signal movement

Used only for:
📈 increase
📉 decrease
➖ stable

*/





/*
==========================
ACTIVE REFLECTION SIGNALS
==========================
*/


this.activeSignals = [];


/*
Example:

[
 {
 label:"Action Resistance",
 value:62,
 movement:"📈"
 }
]

*/





/*
==========================
SAFETY LOCK
==========================
*/


this.permissions = {


read:[

"user_input",

"ai_response",

"loop_state"

],


write:[

"visual_reflection_only"

],


blocked:[

"loop_control",

"response_change",

"question_generation",

"user_journey_change"

]


};
/*
==========================
ENGINE COMPONENTS
==========================
*/


this.signals =
claritySignals;


this.rules =
clarityBrainRules;


this.observer =
new ClarityObserver(
this.signals,
this.rules
);


this.brain =
new ClarityBrain();


this.output =
new ClarityOutputContract();

}


/*
==================================================
CLARITY DISTANCE ENGINE
Block 07 : Public Analyze Controller
Version : 1.0.0
Status : LOCKED

Purpose:
Single entry point for TruthLoop Core.

Receives:
- User input
- AI response
- Current loop state

Returns:
- Frontend ready clarity reflection

IMPORTANT:
Read only.
Never modifies TruthLoop response or loop.
==================================================
*/


build({
 userMessage,
 aiResponse,
 loopLevel
}){


/*
==============================
SEND DATA TO REFLECTION BRAIN
==============================
*/


const brainResult =
this.brain.think({

 userMessage,

 aiResponse,

 loopLevel,

 availableSignals:
 this.signals

});





/*
==============================
FORMAT FINAL OUTPUT
==============================
*/


const finalOutput =
this.output.build({


 loopLevel,


 signals:
 brainResult.clarityDistance.signals


});





/*
==============================
SAVE OBSERVATION HISTORY
==============================
*/


this.history.push({


loopLevel,


signals:
finalOutput.clarityDistance.elements,


time:
Date.now()


});





return finalOutput;


}



 }
/*
==================================================
CLARITY DISTANCE ENGINE
Block 01 : Signal Intelligence Library
Version : 1.0.0
Status : LOCKED

Purpose:
Provide example behavioral dimensions.

Rules:
- These signals are NOT fixed output.
- Engine selects only relevant signals.
- Engine can create new signals if context requires.
- Scores are reflection, not judgement.
- Values can increase or decrease.
- Never influence Loop Engine.
==================================================
*/


const claritySignals = [

{
 name: "Clarity Depth",

 meaning:
 "How clearly the user is understanding their own situation.",

 observes:[
 "self reflection",
 "specific explanation",
 "pattern awareness"
 ],

 movement:
 "Confusion → Understanding"
},


{
 name:"Avoidance Pattern",

 meaning:
 "Detects behaviors used to delay or escape uncomfortable actions.",

 observes:[
 "delay",
 "waiting",
 "over preparation",
 "switching focus"
 ],

 movement:
 "Avoidance → Recognition"
},


{
 name:"Action Resistance",

 meaning:
 "Gap between knowing what should be done and taking action.",

 observes:[
 "I know but...",
 "waiting for perfect time",
 "execution hesitation"
 ],

 movement:
 "Thinking → Movement"
},


{
 name:"Fear Signal",

 meaning:
 "Hidden fear affecting choices or behavior.",

 observes:[
 "failure concern",
 "judgement",
 "uncertainty",
 "loss avoidance"
 ],

 movement:
 "Hidden Fear → Awareness"
},


{
 name:"Self Awareness",

 meaning:
 "Ability to notice own patterns instead of only external causes.",

 observes:[
 "ownership language",
 "self observation",
 "personal patterns"
 ],

 movement:
 "Reaction → Reflection"
},


{
 name:"Identity Attachment",

 meaning:
 "Attachment to old beliefs or fixed self image.",

 observes:[
 "I always",
 "I cannot",
 "this is who I am"
 ],

 movement:
 "Fixed Identity → Flexible Identity"
},


{
 name:"Belief Conflict",

 meaning:
 "Conflict between what user wants and what user believes.",

 observes:[
 "contradictions",
 "mixed desires",
 "internal conflict"
 ],

 movement:
 "Conflict → Alignment"
},


{
 name:"Decision Confidence",

 meaning:
 "Readiness and confidence to make choices.",

 observes:[
 "certainty",
 "ownership",
 "direction"
 ],

 movement:
 "Doubt → Direction"
},


{
 name:"Emotional Load",

 meaning:
 "Emotional weight attached to the situation.",

 observes:[
 "pressure",
 "stress",
 "frustration"
 ],

 movement:
 "Emotional Fog → Understanding"
},


{
 name:"Pattern Recognition",

 meaning:
 "Ability to see repeated behavior loops.",

 observes:[
 "recurring problems",
 "repeated choices",
 "cycles"
 ],

 movement:
 "Events → Patterns"
},


{
 name:"Execution Readiness",

 meaning:
 "Preparedness to convert clarity into action.",

 observes:[
 "next steps",
 "commitment",
 "action signals"
 ],

 movement:
 "Knowing → Doing"
},


{
 name:"Uncertainty Tolerance",

 meaning:
 "Ability to move without needing perfect certainty.",

 observes:[
 "risk comfort",
 "experimentation",
 "unknown handling"
 ],

 movement:
 "Control Need → Exploration"
},


{
 name:"External Validation Dependency",

 meaning:
 "Influence of approval or opinions on decisions.",

 observes:[
 "approval seeking",
 "fear of reaction",
 "comparison"
 ],

 movement:
 "Permission Seeking → Self Direction"
},


{
 name:"Protection Mechanism",

 meaning:
 "Behavior protecting user from uncomfortable outcomes.",

 observes:[
 "safe excuses",
 "comfort patterns",
 "avoidance logic"
 ],

 movement:
 "Protection → Conscious Choice"
},


{
 name:"Growth Alignment",

 meaning:
 "Alignment between current behavior and desired direction.",

 observes:[
 "goal connection",
 "value alignment",
 "priority clarity"
 ],

 movement:
 "Random Effort → Focused Growth"
},


{
 name:"Responsibility Shift",

 meaning:
 "Movement from external blame toward personal influence.",

 observes:[
 "ownership",
 "control awareness",
 "choices"
 ],

 movement:
 "Outside Cause → Inner Agency"
},


{
 name:"Focus Stability",

 meaning:
 "Ability to maintain direction without constant switching.",

 observes:[
 "distraction",
 "idea jumping",
 "priority changes"
 ],

 movement:
 "Scattered → Stable"
},


{
 name:"Inner Conflict",

 meaning:
 "Opposing internal desires creating friction.",

 observes:[
 "want vs fear",
 "goal vs habit",
 "desire vs belief"
 ],

 movement:
 "Hidden Conflict → Clarity"
},


{
 name:"Learning Trap",

 meaning:
 "Using information gathering as replacement for action.",

 observes:[
 "endless research",
 "more learning",
 "not starting"
 ],

 movement:
 "Consumption → Creation"
},


{
 name:"Reality Acceptance",

 meaning:
 "Ability to see current reality without avoidance.",

 observes:[
 "honesty",
 "acceptance",
 "clear observation"
 ],

 movement:
 "Avoiding Reality → Seeing Clearly"
}

];



/*
==================================================
CLARITY DISTANCE ENGINE
Block 02 : Brain Rules
Version : 1.0.0
Status : LOCKED

Purpose:
Control how Clarity Distance thinks.

Responsibilities:
- Select relevant signals
- Decide display count
- Generate reflection scores
- Track movement
- Replace weak assumptions

IMPORTANT:
Observer intelligence only.
Never control TruthLoop journey.
==================================================
*/


const clarityBrainRules = {


/*
==============================
CORE AUTHORITY RULE
==============================
*/

authority:{

 role:"OBSERVER_ONLY",

 allowed:[
  "read_user_input",
  "read_ai_response",
  "read_loop_level",
  "generate_visual_reflection"
 ],

 forbidden:[
  "change_loop_level",
  "modify_ai_response",
  "ask_questions",
  "change_user_journey",
  "override_truthloop_logic"
 ]

},



/*
==============================
LOOP BASED VISIBILITY
==============================
*/

visibility:{

 loop1:{
  maxSignals:3,
  mode:"early_detection"
 },

 loop2:{
  maxSignals:4,
  mode:"pattern_forming"
 },

 loop3:{
  maxSignals:5,
  mode:"pattern_validation"
 },

 loop4:{
  maxSignals:5,
  mode:"deep_observation"
 },

 loop5:{
  minSignals:5,
  maxSignals:6,
  mode:"core_pattern_mapping"
 },

 loop6:{
  minSignals:5,
  maxSignals:6,
  mode:"final_refinement"
 },

 loop7:{
  maxSignals:10,
  mode:"complete_clarity_map"
 }

},



/*
==============================
SIGNAL SELECTION RULE
==============================
*/

selection:{

 rule:
 "Choose signals based on strongest evidence, not fixed order.",

 consider:[

  "repeated_words",

  "emotional_intensity",

  "contradictions",

  "avoidance_language",

  "behavior_patterns",

  "belief_signals",

  "progress_changes"

 ],

 avoid:[

  "random_selection",

  "showing_all_signals",

  "same_output_for_every_user"

 ]

},



/*
==============================
SCORE MOVEMENT RULE
==============================
*/

scoreMovement:{

 rule:
 "Scores represent current reflection, not achievement.",

 allowed:[

  "increase",

  "decrease",

  "remain_stable"

 ],

 examples:{

  clarity:
  "Can decrease if user becomes unclear later.",

  resistance:
  "Can increase if new hesitation appears.",

  awareness:
  "Can rise when user recognizes patterns."

 }

},



/*
==============================
SIGNAL EVOLUTION RULE
==============================
*/

evolution:{

 allow:[

  "replace_signal",

  "remove_signal",

  "add_new_signal",

  "rename_signal_based_on_context"

 ],

 reason:

 "Early loops contain limited information. Later loops may reveal deeper patterns."

},



/*
==============================
CONFIDENCE RULE
==============================
*/

confidence:{

 loop1:
 "Low confidence. Avoid strong conclusions.",

 loop2_4:
 "Medium confidence. Patterns forming.",

 loop5_6:
 "High confidence. Deep signals visible.",

 loop7:
 "Final clarity snapshot."

},



/*
==============================
USER EXPERIENCE RULE
==============================
*/

userExperience:{

 never_show:[

  "judgement",

  "negative_labels",

  "fixed_personality_claims"

 ],

 always_show:[

  "reflection",

  "movement",

  "progressive_discovery"

 ]

},



/*
==============================
FAIL SAFE RULE
==============================
*/

failSafe:{

 ifError:

 "Return empty clarity object.",

 coreImpact:

 "TruthLoop continues normally."

}


};



/*
==================================================
CLARITY DISTANCE ENGINE
Block 03 : Live Observation & Reflection Engine
Version : 1.0.0
Status : LOCKED

Purpose:
Observe TruthLoop journey in real time
and generate visual reflection signals.

Responsibilities:
- Receive Loop state
- Observe user input
- Observe AI response
- Match behavioral signals
- Generate values
- Generate movement
- Send frontend display data

IMPORTANT:
Read only.
Never influence TruthLoop Core Brain.
==================================================
*/


class ClarityObserver {


constructor(signalLibrary, brainRules){

this.signalLibrary = signalLibrary;

this.brainRules = brainRules;

this.history = [];

}



/*
==============================
READ ONLY INPUT RECEIVER
==============================
*/

observe({
 userMessage,
 aiResponse,
 loopLevel
}){


const observation={

 userMessage,
 aiResponse,
 loopLevel,
 time:Date.now()

};


this.history.push(observation);



return this.generateReflection(
 observation
);

}




/*
==============================
SIGNAL DETECTION
==============================
*/


generateReflection(observation){


const detectedSignals=[];



this.signalLibrary.forEach(signal=>{


let strength =
this.calculateSignalStrength(
 signal,
 observation
);



if(strength > 0){


detectedSignals.push({

name:signal.name,

value:strength,

trend:
this.calculateMovement(
 signal.name,
 strength
),

reason:
"Detected from current conversation"

});


}


});



return this.prepareDisplay(
 detectedSignals,
 observation.loopLevel
);


}




/*
==============================
DYNAMIC VALUE GENERATION
==============================
*/


calculateSignalStrength(
 signal,
 observation
){


/*
AI reasoning placeholder:

Uses:
- user wording
- AI response
- hesitation
- contradictions
- repeated patterns
- emotional intensity

Not fixed keywords only.
*/


let score = 0;


// Example lightweight signals

const combined =

(
observation.userMessage +
" "+
observation.aiResponse
).toLowerCase();



signal.observes.forEach(pattern=>{


if(
combined.includes(
pattern.toLowerCase()
)
){

score += 20;

}


});



return Math.min(
100,
score
);


}





/*
==============================
TREND MOVEMENT ENGINE
==============================
*/


calculateMovement(
signalName,
currentValue
){


const previous =

this.history
.slice()
.reverse()
.find(
h=>h.signals &&
h.signals[signalName]
);



if(!previous){

return "NEW 📍";

}


if(currentValue >
previous.value){

return "UP 📈";

}


if(currentValue <
previous.value){

return "DOWN 📉";

}


return "STABLE ➖";


}






/*
==============================
LOOP BASED DISPLAY LIMIT
==============================
*/


prepareDisplay(
signals,
loopLevel
){


const rules =
this.brainRules.visibility[
"loop"+loopLevel
];


let limit =
rules.maxSignals;



const selected =

signals

.sort(
(a,b)=>b.value-a.value
)

.slice(
0,
limit
);



return {


clarityDistance:{


visible:
selected.length>0,


loop:
loopLevel,


signals:

selected.map(s=>({

label:s.name,

value:s.value+"%",

movement:s.trend

}))


}


};


}



}




/*
==================================================
CLARITY DISTANCE ENGINE
Block 04 : Reflection Brain
Version : 1.0.0
Status : LOCKED

Purpose:
Understand conversation context
and generate intelligent clarity signals.

This is the thinking layer of
Clarity Distance.

IMPORTANT:
Observer intelligence only.
Never controls TruthLoop Core Brain.
==================================================
*/


class ClarityBrain {


constructor(){

this.memory = [];

}



/*
==============================
MAIN THINKING FUNCTION
==============================
*/


think({
 userMessage,
 aiResponse,
 loopLevel,
 availableSignals
}){


const context =

this.buildContext(
userMessage,
aiResponse
);



const detectedPatterns =

this.detectPatterns(
context,
availableSignals
);



const scoredSignals =

this.generateScores(
detectedPatterns,
loopLevel
);



const finalSignals =

this.selectSignals(
scoredSignals,
loopLevel
);



this.memory.push({

loopLevel,
signals:finalSignals,
time:Date.now()

});



return {

clarityDistance:{

visible:true,

loop:loopLevel,

signals:finalSignals

}

};


}




/*
==============================
CONTEXT UNDERSTANDING
==============================
*/


buildContext(user,ai){


return {

raw:
(user+" "+ai).toLowerCase(),


indicators:{


hesitation:[
"but",
"maybe",
"not ready",
"later",
"waiting"
],


fear:[
"fail",
"judge",
"wrong",
"risk",
"afraid"
],


growth:[
"understand",
"realize",
"notice",
"learn"
],


action:[
"start",
"build",
"try",
"execute"
]


}

};

}





/*
==============================
PATTERN DETECTION
==============================
*/


detectPatterns(
context,
signals
){


return signals.map(signal=>{


let confidence = 0;



signal.observes.forEach(item=>{


if(

context.raw.includes(
item.toLowerCase()
)

){

confidence += 25;

}


});



return {

...signal,

confidence

};


})

.filter(
s=>s.confidence>0
);


}






/*
==============================
REAL TIME SCORE GENERATOR
==============================
*/


generateScores(
patterns,
loopLevel
){


return patterns.map(p=>{


let base = p.confidence;



/*
More loops =
more context =
more confidence

Not always higher score
*/


let maturity =
loopLevel * 5;



let value =

Math.min(
100,
base + maturity
);



return {


label:p.name,


value:value+"%",


direction:

this.detectMovement(
p.name,
value
)


};


});


}






/*
==============================
UP / DOWN MOVEMENT
==============================
*/


detectMovement(
name,
current
){


const previous =

this.memory

.flatMap(m=>m.signals)

.find(
s=>s.label===name
);



if(!previous){

return "NEW 📍";

}


let old =

Number(
previous.value.replace("%","")
);



if(current>old){

return "📈";

}


if(current<old){

return "📉";

}


return "➖";


}







/*
==============================
FINAL SIGNAL SELECTION
==============================
*/


selectSignals(
signals,
loop
){


const limits={

1:3,

2:4,

3:5,

4:5,

5:6,

6:6,

7:10

};



return signals

.sort(
(a,b)=>

Number(
b.value.replace("%","")
)

-

Number(
a.value.replace("%","")
)

)

.slice(
0,
limits[loop] || 5
);


}



}




/*
==================================================
CLARITY DISTANCE ENGINE
Block 05 : Progressive Reveal Controller
Version : 1.0.0
Status : LOCKED

Purpose:
Control how many reflection signals
appear during Loop 1 → Loop 7 journey.

Principle:

Clarity grows with evidence.

Early loops:
Less context → fewer signals.

Later loops:
More context → deeper reflection.

IMPORTANT:
Does not control TruthLoop Loop progress.
Only controls visual reflection depth.
==================================================
*/


const progressiveRevealRules = {


/*
==============================
LOOP 1
INITIAL DISCOVERY
==============================
*/

loop1:{

displayElements:3,

reason:
"User context is limited. Only early visible signals should appear.",

allowedSignals:[
"surface patterns",
"early resistance",
"initial emotions"
],

avoid:[
"deep conclusions",
"identity assumptions",
"final clarity claims"
]

},



/*
==============================
LOOP 2
PATTERN FORMING
==============================
*/

loop2:{

displayElements:4,

reason:
"More user information allows early connections between behavior and cause.",

allowedSignals:[
"repeated behavior",
"emotional direction",
"early contradictions",
"decision friction"
]

},




/*
==============================
LOOP 3
PATTERN VALIDATION
==============================
*/

loop3:{

displayElements:5,

reason:
"Enough interaction exists to detect recurring loops.",

allowedSignals:[
"avoidance patterns",
"belief conflict",
"action resistance",
"self awareness",
"clarity movement"
]

},




/*
==============================
LOOP 4
DEEP OBSERVATION
==============================
*/

loop4:{

displayElements:5,

reason:
"Focus shifts from finding more signals to improving accuracy.",

allowedSignals:[
"strongest patterns",
"hidden drivers",
"protection mechanisms"
],

rule:
"Replace weak early assumptions if deeper pattern appears."

},





/*
==============================
LOOP 5
CORE PATTERN MAPPING
==============================
*/

loop5:{

minElements:5,
maxElements:6,

reason:
"Core user patterns become clearer. Engine decides if extra signal is needed.",

allowedSignals:[
"identity attachment",
"inner conflict",
"execution readiness",
"growth alignment"
]

},





/*
==============================
LOOP 6
FINAL REFINEMENT
==============================
*/

loop6:{

minElements:5,
maxElements:6,

reason:
"Prepare final clarity map by validating strongest signals.",

allowedSignals:[
"confirmed patterns",
"remaining resistance",
"clarity shifts"
],

rule:
"Weak signals can disappear. Strong signals remain."

},





/*
==============================
LOOP 7
COMPLETE CLARITY STATE
==============================
*/

loop7:{

displayElements:10,

reason:
"Full journey completed. Enough context exists for complete reflection.",

generate:[

"Main Pattern",

"Hidden Resistance",

"Core Belief",

"Protection Mechanism",

"Clarity Depth",

"Self Awareness",

"Decision Confidence",

"Action Readiness",

"Growth Alignment",

"Next Direction"

],

rule:
"Final map represents the completed journey, not a personality judgement."

}

};




/*
==================================================
GLOBAL MOVEMENT RULE
==================================================

Elements are alive.

They can:

↑ increase
↓ decrease
→ stay stable

Because users can:

- open up
- hesitate
- hide information
- discover new patterns
- change perspective

==================================================
*/



/*
==================================================
CLARITY DISTANCE ENGINE
Block 06 : Output Contract
Version : 1.0.0
Status : LOCKED

Purpose:
Create final frontend-ready response.

Responsibilities:

- Format reflection signals
- Control visibility
- Provide animation hints
- Send display data

IMPORTANT:

Frontend is only a renderer.

Frontend must never:
- calculate score
- rename signals
- create elements
- modify values

==================================================
*/


class ClarityOutputContract {


constructor(){

this.version = "1.0.0";

}



/*
==============================
FINAL RESPONSE BUILDER
==============================
*/


build({
 loopLevel,
 signals,
 engineStatus
}){


/*
If no valid signals exist,
return safe empty object.
*/


if(
!signals ||
signals.length===0
){

return this.empty();

}



return {


clarityDistance:{


engine:"ACTIVE",


mode:
"OBSERVATION_ONLY",


loop:{

current:loopLevel,

total:7

},



/*
==============================
FRONTEND DISPLAY CONTROL
==============================
*/


display:{


visible:true,


position:"RIGHT_FLOATING_PANEL",


animation:"FLOAT_IN",


theme:{

labelColor:"PURPLE",

valueColor:"ORANGE"

}


},




/*
==============================
GENERATED ELEMENTS
==============================
*/


elements:


signals.map(signal=>({


id:
this.createId(signal.label),


label:
signal.label,


value:
signal.value,


movement:
signal.direction,


type:
"REFLECTION_SIGNAL",


description:
signal.description || null


})),




/*
==============================
SAFETY MESSAGE
==============================
*/


system:{


authority:false,


canModifyLoop:false,


canModifyResponse:false,


source:
"Conversation reflection only"


}


}


};


}







/*
==============================
FAIL SAFE OUTPUT
==============================
*/


empty(){


return{


clarityDistance:{


engine:"INACTIVE",


display:{

visible:false

},


elements:[],


system:{

coreImpact:"NONE"

}


}


};


}






/*
==============================
ELEMENT ID GENERATOR
==============================
*/


createId(label){


return label

.toLowerCase()

.replaceAll(" ","_");


}



}



export function analyzeClarityDistance(data) {
  return ClarityDistanceEngine.build(data);
}

export default ClarityDistanceEngine;
