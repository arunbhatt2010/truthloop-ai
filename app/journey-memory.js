/* =========================================
   TruthLoop Journey Memory System v1
   ========================================= */

const MEMORY_KEY = "truthloopMemory";

console.log("MEMORY FILE LOADED");

function saveJourney(loopLevel, messages, currentCategory){

alert("SAVE " + loopLevel);
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

}catch(err){

console.error("Journey Save Error", err);

}

}

function loadJourney(){

alert("LOAD");

try{

const saved =
localStorage.getItem(MEMORY_KEY);

console.log("SAVED DATA =", saved);

if(!saved) return null;

return JSON.parse(saved);

}catch(err){

console.error("Journey Load Error",err);
return null;

}

}

function clearJourney(){

console.log("CLEAR");

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
