/**
 * ===========================================================
 * SecurityGuard.js
 * TruthLoop AI
 * -----------------------------------------------------------
 * Central security layer.
 * Detects protected requests before they reach any Brain.
 *
 * Responsibilities
 * -----------------------------------------------------------
 * • Founder Protection
 * • Internal System Protection
 * • Prompt Injection Detection
 * • Jailbreak Detection
 * • Future Security Rules
 * ===========================================================
 */

class SecurityGuard {

    check(message = "") {

        const lowerMsg = message.toLowerCase();

        const founder =
            this.checkFounderIntent(lowerMsg);

        if (founder.blocked) {
            return founder;
        }

        const internal =
            this.checkInternalIntent(lowerMsg);

        if (internal.blocked) {
            return internal;
        }

        const jailbreak =
            this.checkJailbreak(lowerMsg);

        if (jailbreak.blocked) {
            return jailbreak;
        }

        return {
            blocked: false
        };

    }

    checkFounderIntent(message) {

    const founderTerms = [
        "creator",
        "founder",
        "owner",
        "developer",
        "who made you",
        "who created you",
        "who built you",
        "admin gopi"
    ];

    const truthLoopTargets = [
        "truthloop",
        "truthloop ai",
        "your founder",
        "your creator",
        "your developer",
        "your owner",
        "who created you",
        "who made you",
        "who built you",
        "this ai",
        "this assistant",
        "admin gopi"
    ];

    const isTruthLoopContext =
        truthLoopTargets.some(term =>
            message.includes(term)
        );

    const isFounderQuery =
        founderTerms.some(term =>
            message.includes(term)
        );

    if (isTruthLoopContext && isFounderQuery) {

        return {
            blocked: true,
            response: {
                reply: "I am TruthLoop AI. I cannot provide information about my creator or internal operation."
            }
        };

    }

    return {
        blocked: false
    };

}

    checkJailbreak(message) {

        return {
            blocked: false
        };

    }

}

module.exports = SecurityGuard;
