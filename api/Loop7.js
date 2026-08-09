export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const body = req.body || {};

    console.log("===== LOOP7 API START =====");

    console.log("LOOP7 INPUT", {
      hasConversation: Array.isArray(body.conversation),
      hasEvidencePackage: !!body.evidencePackage,
      currentLoop: body.currentLoop
    });

    return res.status(200).json({
      success: true,
      stage: "loop7-api-ready",
      message: "Loop 7 API received the request."
    });

  } catch (error) {
    console.error("LOOP7 API ERROR", error);

    return res.status(500).json({
      success: false,
      error: "Loop 7 API failed."
    });
  }
}
