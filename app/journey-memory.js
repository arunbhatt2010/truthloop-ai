/* =========================================
   TruthLoop Journey Memory System v1
   ========================================= */

const MEMORY_KEY = "truthloopMemory";

function saveJourney(loopLevel, messages, currentCategory){
alert("SAVE WORKING");
try{

localStorage.setItem(
MEMORY_KEY,
JSON.stringify({
loopLevel,
messages,
currentCategory,
savedAt: Date.now()
})
);
alert("JOURNEY SAVED");
}catch(err){

console.error("Journey Save Error", err);

}

}

function loadJourney(){

try{

const saved =
localStorage.getItem(MEMORY_KEY);

if(!saved) return null;

return JSON.parse(saved);

}catch(err){

console.error("Journey Load Error", err);

return null;

}

}

function clearJourney(){

localStorage.removeItem(MEMORY_KEY);

}

function hasSavedJourney(){

return !!localStorage.getItem(MEMORY_KEY);

}

function getJourneySummary(){

const data = loadJourney();

if(!data) return null;

return {
loopLevel: data.loopLevel || 1,
currentCategory: data.currentCategory || "",
savedAt: data.savedAt || null
};

}
