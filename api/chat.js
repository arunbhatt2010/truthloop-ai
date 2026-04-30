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
      paid49 = false,
      paid199 = false,
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

    // 🔍 STAGE 1 CHECK
    if (loopLevel === 1) {
      const hasDetail =
        lastUserMessage.split(" ").length > 6 &&
        (lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

      if (!hasDetail) {
        return res.status(200).json({
          reply: isHindi
            ? "स्पष्ट नहीं है।\n\nएक लाइन में बताओ:\nतुम क्या करते हो + कहाँ करते हो + क्या काम नहीं कर रहा"
            : "Not clear.\n\nGive ONE line:\nWhat you do + where you do it + what exactly is failing"
        });
      }
    }

    // 🧠 PROMPT
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Rules:
- No fluff
- No generic advice
- No teaching tone
- Every line must hit directly

STAGE: ${loopLevel}

Stage 1:
- Ask ONE question

Stage 2:
- Show behavior pattern
- Partial insight
- Ask ONE question

Stage 3:
- Explain why stuck
- Show consequence
- Ask ONE question

Stage 4:
- Expose uncomfortable truth
- No question

Stage 5:
- Define decision clearly

Stage 6:
- Give 2–3 direct steps

Stage 7:
- Show outcome (act vs avoid)
- Final push
`;

    // 🚫 STOP AFTER 7
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

    // 🔒 HARD PAYWALL (REAL FIX)

    // 🚧 Loop 5 block (₹49)
    if (loopLevel >= 5 && !paid49) {
      reply = reply.slice(0, Math.floor(reply.length * 0.4));
      reply += isHindi
        ? "\n\nतुम देख रहे हो… पर साफ नहीं।"
        : "\n\nYou see it… but not clearly.";
    }

    // 🚧 Loop 7 block (₹199)
    if (loopLevel >= 7 && !paid199) {
      reply = reply.slice(0, Math.floor(reply.length * 0.3));
      reply += isHindi
        ? "\n\nतुम अभी भी बच रहे हो।"
        : "\n\nYou're still avoiding the real move.";
    }

    // 🔥 FINAL PUSH
    if (loopLevel >= 6) {
      reply += isHindi
        ? "\n\nअब करना है या नहीं — यही फर्क बनाएगा।"
        : "\n\nNow you either act or stay stuck.";
    }

    return res.status(200).json({
      reply,
      paywall: (loopLevel >= 5 && !paid49) || (loopLevel >= 7 && !paid199)
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      reply: "Server error"
    });
  }
                                                     }
