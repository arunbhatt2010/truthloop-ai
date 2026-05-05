import { baseRules, loopRules, extraRules } from "./rules";

export function buildPrompt(loopLevel, userContext) {
  return `
${baseRules}

${loopRules[loopLevel] || ""}

${extraRules}

---

USER CONTEXT:
${userContext}

---

FINAL EXECUTION RULES:

- Minimum 7 lines required
- Each line must go deeper than previous
- Do NOT repeat any question
- Do NOT compress thinking

- First 2 lines → mirror clearly
- Next 3 lines → build pressure
- Next 1 line → uncomfortable action
- Final line → sharp question

---

FAIL CONDITIONS:

- If less than 7 lines → expand
- If generic → rewrite
- If repetitive → change direction
`;
}
