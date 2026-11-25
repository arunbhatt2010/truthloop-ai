# TruthLoop LinkedIn Public Profile Actor — v0.1 prototype

Auth-free public-page collector. Node.js 18+; no additional npm dependencies.

## Run locally

```bash
node actors/linkedin-public-profile-actor/cli.js https://www.linkedin.com/in/<public-profile>/
```

Or import `runLinkedInPublicProfileActor({ profileUrl })` from `index.js`.

## Output contract

- `minimum`: core profile fields when present in the public response.
- `maximum`: parsed profile metadata, visible page text, links, and any publicly exposed activity/article links.
- `availability`: explicitly indicates which field groups were actually found.
- `source`: canonical URL and retrieval method.
- `authenticationUsed` and `cookiesUsed` are always false.

## Hard boundaries

This prototype does not log in, use OAuth, cookies, credentials, session tokens, browser automation, CAPTCHA solving, or access-control bypasses. LinkedIn may return a login wall, challenge, 403, 429, or incomplete HTML. In that case the Actor reports restricted/failed/partial output; it does not pretend that missing data was collected.

The prototype extracts only data actually exposed in the unauthenticated response. LinkedIn commonly limits public profile and activity data, so experience, education, skills, posts, and articles may be unavailable. A field being unavailable is not evidence that the person lacks it.

## Current scope

Standalone prototype only. It is not wired into TruthLoop's production CEB/ECB or deployed as a Vercel endpoint. No existing payment, chat, PCF, CEB, or ECB files were modified.

## Next validation

Run against a profile whose page is publicly accessible without signing in. Inspect the returned `access`, `availability`, `minimum`, and `maximum` fields. Only after this is validated should we design the CEB/ECB adapter.
