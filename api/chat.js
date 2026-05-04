// TruthLoop Backend Engine (Final Production Version) // 7 Loop System + Dynamic Input + Paid Locks + Hindi/English Support

export default async function handler(req, res) { const { userInput, language = "en", loopRequest = 1, isPaid = false } = req.body;

// 🔐 Topic Restriction const allowedTopics = ["finance", "business", "growth", "money", "startup", "sales", "linkedin"]; const isAllowed = allowedTopics.some(topic => userInput.toLowerCase().includes(topic) );

if (!isAllowed) { return res.json({ error: language === "hi" ? "TruthLoop sirf business, growth aur finance decisions ke liye hai." : "TruthLoop only works for business, growth, and finance decisions." }); }

const isHindi = language === "hi";

const T = (en, hi) => (isHindi ? hi : en);

// 🧠 Dynamic Loop Generator (User Input Injected) function generateLoops(input) { return { 1: T( You said: "${input}"\nBut this is not your real problem., Aapne kaha: "${input}"\nPar ye aapki asli problem nahi hai. ),

2: T(
    `You think more effort will fix this.\nReality: your direction is unclear.`,
    `Aap sochte ho zyada mehnat se solve hoga.\nReality: direction clear nahi hai.`
  ),

  3: T(
    `You try → no result → you change again\nThis is not growth\nThis is a loop.`,
    `Aap try karte ho → result nahi → fir change karte ho\nYe growth nahi hai\nYe loop hai.`
  ),

  4: T(
    `The real problem:\nYou are targeting everyone\nSo no one responds.`,
    `Asli problem:\nAap sabko target kar rahe ho\nIsliye koi respond nahi karta.`
  ),

  5: T(
    `You already know what to do.\nYou are delaying it.\n\nMost people stop here.\nUnlock if you won’t.`,
    `Aapko already pata hai kya karna hai.\nAap bas delay kar rahe ho.\n\nZyadatar log yahi ruk jaate hain.\nAgar nahi rukna, unlock karo.`
  ),

  6: T(
    `Pick one audience\nOne problem\nWrite only for them for 7 days`,
    `Ek audience choose karo\nEk problem choose karo\n7 din sirf unke liye likho`
  ),

  7: T(
    `You saw the pattern.\nYou will repeat it again.\n\nSame effort\nSame loop\nSame result.\n\nUnlock or stay stuck.`,
    `Aapne pattern dekh liya.\nAap fir repeat karoge.\n\nSame mehnat\nSame loop\nSame result.\n\nUnlock karo ya stuck raho.`
  )
};

}

const loops = generateLoops(userInput);

// 🔐 Paid Loop Handling (5 & 7) if ((loopRequest === 5 || loopRequest === 7) && !isPaid) { return res.json({ locked: true, message: T( "You are at the decision point. Most people stop here.", "Aap decision point par ho. Zyada log yahi ruk jaate hain." ), payment: { razorpay: "https://rzp.io/l/your-payment-link", paypal: "https://paypal.me/yourlink" } }); }

// 🔁 Share Trigger (After Loop 4) if (loopRequest === 4) { return res.json({ loop: loops[4], share: true, shareMessage: T( This hit you because it's true.\n\nMost people will ignore this.\nFew will act.\n\nhttps://truthloop.in, Ye isliye laga kyunki ye sach hai.\n\nZyadatar log ignore karenge.\nKuch log action lenge.\n\nhttps://truthloop.in ) }); }

// ✅ Normal Loop Response return res.json({ loop: loops[loopRequest] || loops[1] });

/* 💳 PAYPAL PAYMENT HANDLER (SECURE) */ async function createPayPalOrder(amount) { const auth = Buffer.from( process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET ).toString("base64");

const res = await fetch("https://api-m.paypal.com/v2/checkout/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: Basic ${auth} }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [ { amount: { currency_code: "USD", value: amount } } ] }) });

const data = await res.json(); return data?.links?.find(l => l.rel === "approve")?.href || ""; }

/* 🔒 MODIFY PAYWALL RESPONSES WITH PAYPAL */ if (loopLevel === 5 && !paid49) { const paypalLink = await createPayPalOrder("0.99");

return res.status(200).json({ reply: "Unlock required to continue.", paywall: true, paypal: paypalLink }); }

if (loopLevel === 7 && !paid199) { const paypalLink = await createPayPalOrder("2.99");

return res.status(200).json({ reply: "Final unlock required.", paywall: true, paypal: paypalLink }); }

  }
