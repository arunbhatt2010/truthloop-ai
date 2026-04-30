export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const {
      messages,
      loopLevel = 1,
      userGoal = "",
      userProblem = "",
      userAction = ""
    } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase();
    const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

    // ❌ DOMAIN FILTER
    const healthPatterns = ["दर्द","दांत","सर दर्द","pain","doctor","medicine","health","fever","treatment"];
    const relationshipPatterns = ["relationship","breakup","love","girlfriend","boyfriend","wife","husband","marriage","ex"];

    const isHealth = healthPatterns.some(word => lowerMsg.includes(word));
    const isRelationship = relationshipPatterns.some(word => lowerMsg.includes(word));

    if (isHealth || isRelationship) {
      return res.status(200).json({
        reply: isHindi
          ? "यह सिस्टम इस समस्या के लिए नहीं है। सही समस्या के साथ वापस आएं।"
          : "This system does not handle this problem. Come back with a real decision problem."
      });
    }

    // 🔍 STAGE 1 KYC CHECK
    if (loopLevel === 1) {

      const hasDetail =
        lastUserMessage.split(" ").length > 6 &&
        (lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

      if (!hasDetail) {
        return res.status(200).json({
          reply: isHindi
            ? "स्पष्ट नहीं है।\n\nतुम बात घुमा रहे हो।\n\nएक लाइन में बताओ:\nतुम क्या करते हो + कहाँ करते हो + अभी क्या काम नहीं कर रहा"
            : "Not clear.\n\nYou're speaking in circles.\n\nGive ONE line:\nWhat you do + where you do it + what exactly is failing right now"
        });
      }
    }

    // 🧠 SYSTEM PROMPT (7 LOOP ENGINE)
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

----------------------------------

Rules:
- No generic statements
- No teaching tone
- No fluff
- Avoid words like: might, maybe, could
- Every line must add value

----------------------------------

STAGE: ${loopLevel}

----------------------------------

Flow Rules:
- Continue SAME problem across stages
- No new topics
- Each stage must go deeper

----------------------------------

Stage 1:
- Detect vagueness
- Ask ONE clear question

----------------------------------

Stage 2:
- Max 5 lines
- Show ONE behavior pattern
- Partial insight
- End with ONE question

----------------------------------

Stage 3:
- Max 6 lines
- Explain WHY user is stuck
- Show consequence
- No solution
- End with ONE question

----------------------------------

Stage 4:
- Max 6 lines
- Expose uncomfortable truth
- Break wrong belief
- No question

----------------------------------

Stage 5:
- Define decision clearly
- What to choose vs what to drop
- No question

----------------------------------

Stage 6:
- Give 2–3 direct actionable steps

----------------------------------

Stage 7:
- Show outcome:
  - If act
  - If avoid
- Close with pressure

----------------------------------

Tone:
1 → Neutral  
2 → Slight tension  
3 → Deep  
4 → Confronting  
5 → Clear  
6 → Practical  
7 → Final push  
`;

    // 🚫 STOP AFTER LOOP 7
    if (loopLevel > 7) {
      return res.status(200).json({
        reply: "",
        paywall: true
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.GROQ_API_KEY
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔒 SAFETY (NO ACTION BEFORE LOOP 5)
    if (loopLevel < 5) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word => reply.toLowerCase().includes(word));

      if (hasAction) {
        reply = reply.replace(/send|call|post|create|sell|build/gi, "");
      }
    }

    // 🔥 FINAL PRESSURE (ONLY AFTER LOOP 6)
    if (loopLevel >= 6) {
      reply += isHindi
        ? "\n\nअब फैसला टालोगे या करोगे — यही फर्क बनाएगा।"
        : "\n\nNow you either act or stay stuck.";
    }

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 5
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      reply: "Server error"
    });
  }
}
