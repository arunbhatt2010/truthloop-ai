console.log("🔥 CHAT FILE RUNNING");

import { buildPrompt } from "../../lib/promptBuilder.js";

export default async function handler(req, res) {

  /* 🌐 HEADERS */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

  try {

    console.log("✅ API HIT");

    /* 📥 BODY */
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const {
      messages = [],
      loopLevel = 1,
      paid49 = false,
      paid199 = false
    } = body;

    if (!messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase();

    const userContext = messages[1]?.content || "";
    const userKnown = messages.length > 1;

    const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

    /* ❌ DOMAIN FILTER */
    const blockedPatterns = [
      "doctor","medicine","pain","fever","treatment",
      "relationship","breakup","girlfriend","boyfriend","marriage",
      "दर्द","बुखार","इलाज","डॉक्टर",
      "रिलेशनशिप","ब्रेकअप","प्यार","शादी"
    ];

    if (loopLevel === 1 && blockedPatterns.some(w => lowerMsg.includes(w))) {
      return res.status(200).json({
        reply: isHindi
          ? "यह decision problem नहीं है.\n\nऐसा सवाल पूछो जहाँ फैसला लेना हो।"
          : "This isn't a decision problem.\n\nAsk something where a decision is required."
      });
    }

    /* 🔥 LOOP 1 */
    if (loopLevel === 1) {

      if (!userKnown) {
        return res.status(200).json({
          reply: isHindi
            ? "पहले ये साफ करो — तुम करते क्या हो?\n\nऔर अभी क्या काम नहीं कर रहा?"
            : "Before we go deeper — what do you actually do?\n\nWhat is not working right now?"
        });
      }

      if (lastUserMessage.trim().split(/\s+/).length < 4) {
        return res.status(200).json({
          reply: isHindi
            ? "बहुत vague है.\n\nठीक क्या काम नहीं कर रहा?"
            : "Too vague.\n\nWhat exactly is not working?"
        });
      }
    }

    /* 🔒 LOOP 5 PAYWALL */
    if (loopLevel === 5 && !paid49) {

      const base = lastUserMessage.slice(0, 50).replace(/\n/g, " ");

      const hooks = [
        `You said: "${base}"\nBut nothing changed.`,
        `You said: "${base}"\nStill same pattern.`,
        `You said: "${base}"\nSo why repeat it?`,
        `You said: "${base}"\nYou already saw this.`
      ];

      const pick = hooks[Math.floor(Math.random() * hooks.length)];

      return res.status(200).json({
        reply:
`${pick}

Same effort.
Same loop.
Same result.

Pay to continue.`,
        paywall: true
      });
    }

    /* 🔒 LOOP 6 LOCK */
    if (loopLevel >= 6 && !paid49) {
      return res.status(200).json({
        reply: isHindi
          ? "तुम skip कर रहे हो.\n\nपहले ये पूरा करो।"
          : "You can't skip this.\n\nFinish what you started.",
        paywall: true
      });
    }

    /* 🔒 LOOP 7 PAYWALL */
    if (loopLevel === 7 && !paid199) {
      return res.status(200).json({
        reply: isHindi ? "अब commit करो।" : "Now commit.",
        paywall: true
      });
    }

    /* 🧠 PROMPT */
    const systemPrompt = buildPrompt(loopLevel, userContext);
    console.log("🧠 PROMPT READY");

    /* 🔑 API KEY CHECK */
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ Missing GROQ API KEY");
      return res.status(500).json({ reply: "Missing API key" });
    }

    /* 🤖 AI CALL */
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []).slice(-6)
        ],
        temperature: 0.7,
        max_tokens: 220
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ API FAIL:", err);
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "";

    /* 🔧 FALLBACK */
    if (!reply || reply.length < 20) {
      reply = isHindi
        ? "सीधे बोलो — क्या काम नहीं कर रहा?"
        : "Be direct — what's not working?";
    }

    /* ✂️ FORMAT */
    if (reply.length > 120 && !reply.includes("\n")) {
      reply = reply.replace(/\. /g, "\n");
    }

    /* ❓ ENSURE QUESTION */
    if (!reply.trim().endsWith("?")) {
      reply += isHindi
        ? "\n\nतुम किस बात से बच रहे हो?"
        : "\n\nWhat are you avoiding?";
    }

    return res.status(200).json({
      reply,
      paywall: false
    });

  } catch (error) {

    console.error("🔥 SERVER ERROR:", error);

    return res.status(500).json({
      reply: "Server error"
    });
  }
      }
