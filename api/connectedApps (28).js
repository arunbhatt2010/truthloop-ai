import crypto from "crypto";
/*
connectedApps.js

┌──────────────────────────────────────┐
│ 0. Config & Memory                   │
│ • Environment variables              │
│ • Session Store                      │
│ • Utility Functions                  │
└──────────────────────────────────────┘

                │
                ▼

┌──────────────────────────────────────┐
│ 1. Main Router                       │
│                                      │
│ GET  → OAuth Callback                │
│ POST → OAuth Start                   │
│ DELETE (Future) → Disconnect         │
└──────────────────────────────────────┘

                │
                ▼

===========================
POST FLOW
===========================

2. Validate Request

↓

3. Provider Router

↓

4. LinkedIn OAuth URL Builder

↓

5. Return redirectUrl


===========================
GET FLOW
===========================

6. Read Query

↓

7. Validate code/state/error

↓

8. Exchange Authorization Code

↓

9. Validate Access Token

↓

10. Fetch OIDC UserInfo

↓

11. Build identityPackage

↓

12. Build TruthLoop ConnectedApp Package

↓

13. Create Temporary Session

↓

14. Store Session

↓

15. Redirect

/app?linkedin=connected
&resume=loop6
&session=xxxx


===========================
SESSION FLOW
===========================

16. GET?action=session

↓

17. Validate Session

↓

18. Return identityPackage

↓

19. Destroy Session


===========================
FUTURE
===========================

20. Google

21. GitHub

22. Facebook

23. X

24. Custom OAuth


===========================
COMMON
===========================

25. Error Handler

26. Logger

27. Security

28. Response Builder
*/


/* =========================================
   CONFIG
========================================= */

const LINKEDIN_CLIENT_ID =
    process.env.LINKEDIN_CLIENT_ID;

const LINKEDIN_CLIENT_SECRET =
    process.env.LINKEDIN_CLIENT_SECRET;

const REDIRECT_URI =
  "https://truthloop.in/api/connectedApps";
function base64url(buffer) {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function generatePKCE() {
    const codeVerifier = base64url(
        crypto.randomBytes(32)
    );

    const codeChallenge = base64url(
        crypto
            .createHash("sha256")
            .update(codeVerifier)
            .digest()
    );

    return {
        codeVerifier,
        codeChallenge
    };
}
/* =========================================
   TEMP SESSION STORE
========================================= */

const sessionStore = new Map();

/* =========================================
   SESSION EXPIRY
========================================= */

const SESSION_TTL =
    5 * 60 * 1000;

/* =========================================
   CREATE SESSION ID
========================================= */

function createSessionId() {

    return (
        Math.random().toString(36).substring(2) +
        Date.now().toString(36)
    );

}

/* =========================================
   CLEAN EXPIRED SESSIONS
========================================= */

function cleanSessions() {

    const now = Date.now();

    for (const [id, session] of sessionStore) {

        if (now > session.expiresAt) {

            sessionStore.delete(id);

        }

    }

}

/* =========================================
   MAIN ROUTER
========================================= */

export default async function handler(req, res) {

    cleanSessions();

    try {

        if (req.method === "GET") {
            return await handleGET(req, res);
        }

        if (req.method === "POST") {
            return await handlePOST(req, res);
        }

        if (req.method === "DELETE") {
            return await handleDELETE(req, res);
        }

        return res.status(405).json({
            success: false,
            reason: "Method not allowed."
        });

    } catch (error) {

        console.error("CONNECTED APPS:", error);

        return res.status(500).json({
    success: false,
    reason: "Internal server error.",
    message: error.message,
    stack: error.stack
});
    }

}

/* =========================================
   GET HANDLER
========================================= */

async function handleGET(req, res) {

    const {

        action,
        code,
        error,
        state,
        session

    } = req.query;

    if (action === "session") {

        return await handleSessionRequest(
            req,
            res
        );

    }

    if (code || error) {

        return await handleLinkedInCallback(
            req,
            res
        );

    }

    return res.status(400).json({

        success: false,

        reason: "Unknown GET request."

    });

}
/* =========================================
   POST HANDLER
========================================= */

async function handlePOST(req, res) {

    const {

        action,

        provider

    } = req.body || {};

    if (action !== "oauth") {

        return res.status(400).json({

            success: false,

            reason: "Unsupported action."

        });

    }

    switch (provider) {

        case "linkedin":

            return await handleLinkedInOAuth(
                req,
                res
            );

        default:

            return res.status(400).json({

                success: false,

                reason: "Unsupported provider."

            });

    }

}

/* =========================================
   DELETE HANDLER
========================================= */

async function handleDELETE(req, res) {

    return res.status(200).json({

        success: true,
        stage: "DELETE"

    });

    }
/* =========================================
   LINKEDIN OAUTH
========================================= */

async function handleLinkedInOAuth(req, res) {

    if (!LINKEDIN_CLIENT_ID) {
        return res.status(500).json({
            success: false,
            reason: "LinkedIn Client ID not configured."
        });
    }

    // Generate OAuth State
    const state =
        Math.random().toString(36).substring(2) +
        Date.now().toString(36);

    // Generate PKCE
    const {
        codeVerifier,
        codeChallenge
    } = generatePKCE();

    // Store temporary OAuth session
    sessionStore.set(state, {
        codeVerifier,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL
    });

    // Build LinkedIn Authorization URL
    const redirectUrl =
        "https://www.linkedin.com/oauth/v2/authorization?" +
        new URLSearchParams({
            response_type: "code",
            client_id: LINKEDIN_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            scope: "openid profile email",
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256"
        }).toString();

    return res.status(200).json({
        success: true,
        redirectUrl
    });

}

/* =========================================
   SESSION REQUEST
========================================= */

async function handleSessionRequest(req, res) {

    const { session } = req.query;

    if (!session) {

        return res.status(400).json({

            success: false,

            reason: "Session ID missing."

        });

    }

    cleanSessions();

    const data = sessionStore.get(session);

    if (!data) {

        return res.status(404).json({

            success: false,

            reason: "Session not found."

        });

    }

    sessionStore.delete(session);

    return res.status(200).json({

        success: true,

        identityPackage: data.identityPackage

    });

}
/* =========================================
   LINKEDIN CALLBACK
========================================= */

async function handleLinkedInCallback(req, res) {

    const {
        code,
        error,
        state
    } = req.query;
console.log("AUTH CODE:", code);
    // OAuth Provider returned an error
    if (error) {
        return res.status(400).json({
            success: false,
            stage: "CALLBACK",
            reason: error
        });
    }

    // Missing authorization code
    if (!code) {
        return res.status(400).json({
            success: false,
            stage: "CALLBACK",
            reason: "Authorization code not received."
        });
    }

    // Missing OAuth state
    if (!state) {
        return res.status(400).json({
            success: false,
            stage: "CALLBACK",
            reason: "State not received."
        });
    }

    // Restore OAuth session
    const session = sessionStore.get(state);

    if (!session) {
        return res.status(400).json({
            success: false,
            stage: "SESSION",
            reason: "OAuth session expired or not found."
        });
    }

    // Continue to Token Exchange...
/* =========================================
   EXCHANGE AUTHORIZATION CODE
========================================= */

const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET,
  //  code_verifier: session.codeVerifier
});
console.log({
  clientId: LINKEDIN_CLIENT_ID,
  redirectUri: REDIRECT_URI,
  hasSecret: !!LINKEDIN_CLIENT_SECRET,
  hasCodeVerifier: !!session.codeVerifier
});
  console.log("BEFORE FETCH");
const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
    }
);
console.log("AFTER FETCH", tokenResponse.status);
const tokenData = await tokenResponse.json();
console.log("LINKEDIN TOKEN RESPONSE");
console.log(tokenResponse.status);
console.log(tokenData);
if (!tokenResponse.ok) {
    return res.status(tokenResponse.status).json({
        success: false,
        stage: "TOKEN",
        status: tokenResponse.status,
        reason: tokenData.error_description || tokenData.error || "Token exchange failed.",
        tokenData
    });
}

  
if (!tokenData.access_token) {
    return res.status(400).json({
        success: false,
        stage: "TOKEN",
        reason: "Access token not received.",
        tokenData
    });
}
  /* =========================================
   FETCH USER INFO
========================================= */

const userResponse = await fetch(
    "https://api.linkedin.com/v2/userinfo",
    {
        headers: {
            Authorization:
                `Bearer ${tokenData.access_token}`
        }
    }
);

const userInfo = await userResponse.json();

console.log("USER INFO STATUS", userResponse.status);
console.log("USER INFO", userInfo);

if (!userResponse.ok) {

    return res.status(400).json({

        success: false,

        stage: "USER_INFO",

        userInfo

    });

}

  /* =========================================
   BUILD IDENTITY PACKAGE
========================================= */
console.log("BEFORE IDENTITY PACKAGE");
console.log(userInfo);
const identityPackage = {

    provider: "linkedin",

    id: userInfo.sub,

    name: userInfo.name,

    email: userInfo.email,

    picture: userInfo.picture,

    locale: userInfo.locale,

    verified: true,

    connectedAt: Date.now(),

    raw: userInfo

};

  /* =========================================
   CREATE SESSION
========================================= */

console.log("SESSION STORED");

const redirectUrl =
`/app?linkedin=connected&resume=loop6&session=${sessionId}`;

console.log("REDIRECTING TO APP");
console.log(redirectUrl);

return res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Redirecting...</title>
</head>
<body>

<h3>OAuth Success</h3>

<p id="url">${redirectUrl}</p>

<script>
alert("REDIRECT\\n" + location.href);

location.href = "${redirectUrl}";
</script>

</body>
</html>
`);
    
}

/*
handleLinkedInCallback()

1. Read query
   ├─ code
   ├─ error
   └─ state

2. Validate callback
   ├─ error?
   └─ code missing?

3. Exchange Authorization Code
   └─ LinkedIn Access Token

4. Validate token
   └─ access_token exists?

5. Fetch OpenID UserInfo
   └─ https://api.linkedin.com/v2/userinfo

6. Build identityPackage
   ├─ provider
   ├─ id
   ├─ name
   ├─ email
   ├─ picture
   ├─ locale
   ├─ verified
   └─ connectedAt

7. Create sessionId

8. Save session
   sessionStore.set(sessionId,{
       identityPackage,
       createdAt,
       expiresAt
   })

9. Redirect

/app?linkedin=connected
&resume=loop6
&session=<sessionId>
*/
