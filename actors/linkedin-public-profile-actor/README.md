# TruthLoop LinkedIn Public Profile Actor — prototype v0.1.2

Auth-free, cookie-free public-page collector. Node.js 18+; no additional npm dependencies.

## Run locally

```bash
node actors/linkedin-public-profile-actor/cli.js https://www.linkedin.com/in/<public-profile>/
```

Or import `runLinkedInPublicProfileActor({ profileUrl })` from `index.js`.

## v0.1.2 changes

- Removes invisible Unicode format characters (including U+2060 WORD JOINER) from profile URLs before validation. The Bill Gates test URL contained an encoded U+2060 at the end of the profile slug; the normalized URL is `https://www.linkedin.com/in/williamhgates/`.
- Classifies HTTP 429 as `rate_limited`, 403 as `access_denied`, 401 as `authentication_required`, and 404 as `profile_not_found_or_hidden`.
- Adds bounded diagnostics for response headers, Retry-After, and a short response preview.
- Does not retry automatically and does not attempt to bypass rate limits, login walls, CAPTCHA, or access controls.
- CLI exits non-zero for restricted/failed collection, while still printing JSON so the workflow can upload the diagnostic artifact.

## Output contract

- `minimum`: core profile fields when present in the public response.
- `maximum`: parsed profile metadata, visible page text, and any publicly exposed activity/article links.
- `availability`: explicitly indicates which field groups were actually found.
- `diagnostics`: bounded upstream response details when collection is restricted.
- `source`: canonical URL and retrieval method.
- `authenticationUsed` and `cookiesUsed` are always false.

## Hard boundaries

This prototype does not log in, use OAuth, cookies, credentials, session tokens, browser automation, CAPTCHA solving, or access-control bypasses. LinkedIn may return a login wall, challenge, 403, 429, or incomplete HTML. In that case the Actor reports restricted/failed/partial output; it does not pretend that missing data was collected. A 429 is an upstream rate-limit response, not a parser failure.

The prototype extracts only data actually exposed in the unauthenticated public response. A field being unavailable is not evidence that the person lacks it.

## Current scope

Standalone prototype only. It is not wired into TruthLoop's production CEB/ECB or deployed as a Vercel endpoint. No existing payment, chat, PCF, CEB, or ECB files are modified.

## Next validation

Re-run once with a clean profile URL after a reasonable cooldown. If LinkedIn continues returning 429, stop repeated tests and record the public unauthenticated endpoint as unavailable for that test window. Validate URL normalization independently using a local/no-network test; do not interpret a normalized URL as a guarantee that LinkedIn will permit collection.
