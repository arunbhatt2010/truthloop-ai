export default async function handler(req, res) {

    // ==========================
    // LinkedIn OAuth Callback
    // ==========================
if (!code) {
    return res
        .status(400)
        .send("Authorization code not received.");
}

const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://truthloop.in/api/connectedApps",
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET
        })
    }
);

const tokenData = await tokenResponse.json();

console.log("LinkedIn Token Response:", tokenData);

return res.status(200).json(tokenData);
    
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
