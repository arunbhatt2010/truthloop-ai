import { baseRules, loopRules, extraRules } from "./rules.js";

export function buildPrompt(loopLevel, userContext) {
  return `
${baseRules}

${loopRules[loopLevel] || ""}

${extraRules}

---

USER CONTEXT:
${userContext}

---

EXECUTION:

- Write 7 to 9 lines
- Each line must go deeper than previous
- No repetition
- No compression
- Stay specific to user's words

---

STRUCTURE:

1. Mirror clearly
2. Break belief
3. Show pattern
4. Expose avoidance
5. Increase pressure
6. Give ONE uncomfortable action
7. End with ONE sharp question

---

FAIL SAFE:

- If response < 7 lines → expand
- If generic → rewrite
- If repeating → go deeper
`;
}
