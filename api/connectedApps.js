export default async function handler(req, res) {

    // Only POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            reason: "Method not allowed."
        });
    }

    const {
        action,
        provider
    } = req.body;

    // ==========================
    // LinkedIn OAuth
    // ==========================
    if (
        action === "oauth" &&
        provider === "linkedin"
    ) {

        // Temporary verification
        return res.status(200).json({
            success: true,
            provider: "linkedin",
            oauth: true,
            message: "LinkedIn OAuth request received.",
            redirectUrl: null // Next step: real LinkedIn OAuth URL
        });

    }

    // ==========================
    // Future Providers
    // ==========================
    return res.status(400).json({
        success: false,
        reason: "Unsupported provider."
    });

}
