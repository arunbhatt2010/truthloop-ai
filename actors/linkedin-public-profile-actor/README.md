# TruthLoop LinkedIn Public Profile Actor — v0.2.1

Auth-free, cookie-free public-page collector. Node.js 18+; no additional npm dependencies.

## What changed in v0.2.1

- Keeps v0.2.0's expanded public HTML / JSON-LD extraction for profile, experience, education, skills, posts and articles.
- Retains v0.1.2's public unauthenticated HTTP retrieval approach and its explicit URL validation, bounded response size, timeout, safe redirect handling, and clear restricted/failure results.
- Extracts visible anchor text for public post/article links (v0.1.2/v0.2.0 only used `aria-label` or `title`, often leaving labels empty).
- Handles JSON-LD image objects using either `url` or `contentUrl`.
- Filters punctuation-only profile values so values such as `,,,,` are not treated as real headlines.
- Uses bounded nearby HTML for post/article text; dates are emitted only when explicit `<time datetime>` or published-date metadata exists.
- Reports link/post/article counts in `availability` for diagnostics.

## Safety and limitations

- No LinkedIn login, cookies, session reuse, CAPTCHA solving, proxy rotation, or access-control bypass.
- A 429 response is returned as `restricted / rate_limited`; no automatic retry is performed. Wait and test later rather than repeatedly requesting the profile.
- LinkedIn may return different public HTML by profile, geography, request volume, or time. A 200 response does not guarantee all fields are exposed.
- Experience, education, skills, post text and dates are included only when explicitly present in the public response. Nearby post/article snippets may contain surrounding page context and must be treated as source excerpts, not verified post body text unless the excerpt clearly corresponds to the post.
- No fields are inferred or fabricated.

## Run locally

```bash
node actors/linkedin-public-profile-actor/cli.js https://www.linkedin.com/in/public-profile/
```

## GitHub Actions

The existing workflow can continue to call `node actors/linkedin-public-profile-actor/cli.js "$PROFILE_URL"`. Ensure the repository has the v0.2.1 files committed before dispatching the workflow; the workflow runs the checked-out branch, not a ZIP on your device.

## Output

The JSON includes `version`, `status`, `access`, `httpStatus`, `minimum`, `maximum`, `availability`, `limitations`, and `source`. Treat `restricted` and `failed` as non-collection outcomes, not empty profiles.
