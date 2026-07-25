export default async function handler(req, res) {

    // ==========================
    // LinkedIn OAuth Callback
    // ==========================
    if (req.method === "GET") {

        const { code, error } = req.query;

        if (error) {
            return res
                .status(400)
                .send("LinkedIn authorization cancelled.");
        }

        if (!code) {
            return res
                .status(400)
                .send("Authorization code not received.");
        }

        return res.redirect(
  `https://truthloop.in/app?linkedin=connected&resume=loop6&code=${encodeURIComponent(code)}`
);
    }
    // ==========================
    // Only POST requests
    // ==========================
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

    const clientId = process.env.LINKEDIN_CLIENT_ID;

    if (!clientId) {
        return res.status(200).json({
            success: false,
            reason: "CLIENT ID NOT FOUND"
        });
    }

    const state =
        Math.random().toString(36).substring(2) +
        Date.now();

    const redirectUri = encodeURIComponent(
        "https://truthloop.in/api/connectedApps"
    );

    const scope = encodeURIComponent(
        "openid profile email"
    );

    const redirectUrl =
        `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    // ==========================
    // LinkedIn OAuth
    // ==========================
    if (
        action === "oauth" &&
        provider === "linkedin"
    ) {

        return res.status(200).json({
            success: true,
            provider: "linkedin",
            oauth: true,
            redirectUrl
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
