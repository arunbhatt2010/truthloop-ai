export function buildTruthLoopPackage(messages = []) {

    return {

        topic: "",

        confirmedFacts: [],

        statedGoals: [],

        attempts: [],

        results: [],

        beliefs: [],

        contradictions: [],

        openQuestions: [],

        repeatedPatterns: [],

        workingHypothesis: "",

        confidence: "low"

    };

}
