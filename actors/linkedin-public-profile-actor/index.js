
/**
 * TruthLoop LinkedIn Public Profile Actor — v0.1.1
 * Auth-free, cookie-free public-page retrieval.
 * No login-wall bypass, no automatic retries.
 * Node.js 18+ (native fetch). No additional dependencies.
 */

const ACTOR_VERSION = '0.1.1';

const ALLOWED_HOSTS = new Set([
  'linkedin.com',
  'www.linkedin.com',
  'm.linkedin.com'
]);

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 30_000;
const MAX_ERROR_PREVIEW_BYTES = 4096;
const MAX_ERROR_PREVIEW_CHARS = 1200;

const USER_AGENT =
  'Mozilla/5.0 (compatible; TruthLoopPublicEvidenceBot/0.1; +https://truthloop.in)';

function decodeEntities(s = '') {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    );
}

function stripTags(s = '') {
  return decodeEntities(
    String(s)
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function attr(tag, name) {
  const re = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i'
  );

  const m = tag.match(re);

  return decodeEntities(m?.[1] ?? m?.[2] ?? m?.[3] ?? '');
}

function validProfileUrl(input) {
  let u;

  try {
    u = new URL(input);
  } catch {
    throw new Error('INVALID_URL');
  }

  if (
    u.protocol !== 'https:' ||
    !ALLOWED_HOSTS.has(u.hostname.toLowerCase())
  ) {
    throw new Error('UNSUPPORTED_HOST');
  }

  if (!/^\/(?:in|pub)\/[A-Za-z0-9%._~-]+\/?$/.test(u.pathname)) {
    throw new Error('NOT_A_PROFILE_URL');
  }

  u.search = '';
  u.hash = '';

  return u;
}

function parseMeta(html) {
  const result = {};

  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = (
      attr(tag, 'property') ||
      attr(tag, 'name') ||
      attr(tag, 'itemprop')
    ).toLowerCase();

    const value = attr(tag, 'content');

    if (key && value && !result[key]) {
      result[key] = value;
    }
  }

  return result;
}

function parseJsonLd(html) {
  const out = [];

  for (const m of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const v = JSON.parse(m[1]);
      out.push(...(Array.isArray(v) ? v : [v]));
    } catch {}
  }

  return out;
}

function collectLinks(html, base) {
  const links = [];

  for (const tag of html.match(/<a\b[^>]*>/gi) || []) {
    const href = attr(tag, 'href');

    if (!href) continue;

    try {
      const u = new URL(href, base);

      if (u.protocol !== 'https:') continue;

      const text = attr(tag, 'aria-label') || attr(tag, 'title') || '';

      links.push({
        url: u.href,
        label: text
      });
    } catch {}
  }

  return [...new Map(links.map(x => [x.url, x])).values()];
}

function extractProfile(html, finalUrl) {
  const meta = parseMeta(html);
  const jsonld = parseJsonLd(html);

  const person = jsonld.find(
    x => /person|profilepage/i.test(String(x['@type'] || '')) || x.mainEntity
  ) || {};

  const main = person.mainEntity || person;

  const title = stripTags(
    meta['og:title'] ||
    meta['twitter:title'] ||
    (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
  );

  const description = stripTags(
    meta['og:description'] ||
    meta.description ||
    meta['twitter:description'] ||
    ''
  );

  const name = stripTags(
    main.name ||
    (
      meta['profile:first_name'] &&
      `${meta['profile:first_name']} ${meta['profile:last_name'] || ''}`
    ) ||
    title.split(/\s+[|–-]\s+/)[0]
  );

  const headline = stripTags(
    main.jobTitle ||
    meta['profile:username'] ||
    description
  );

  const image =
    main.image?.url ||
    main.image ||
    meta['og:image'] ||
    '';

  const text = stripTags(html).slice(0, MAX_TEXT_CHARS);
  const links = collectLinks(html, finalUrl);

  const activityLinks = links
    .filter(x => /linkedin\.com\/(?:posts|pulse|feed\/update)/i.test(x.url))
    .slice(0, 9);

  const articleLinks = links
    .filter(x => /linkedin\.com\/pulse\//i.test(x.url))
    .slice(0, 10);

  const blocked =
    /authwall|sign in to linkedin|join linkedin|security verification|challenge\/|checkpoint/i
      .test(html.slice(0, 500000));

  return {
    profile: {
      name: name || null,
      headline: headline || null,
      profileUrl: finalUrl,
      imageUrl: image || null,
      about: description || null,
      location: main.address?.addressLocality || null,
      currentPosition: null,
      experience: [],
      education: [],
      skills: []
    },

    activity: {
      posts: activityLinks.map(x => ({
        url: x.url,
        text: x.label || null,
        date: null,
        engagement: null
      })),

      articles: articleLinks.map(x => ({
        url: x.url,
        title: x.label || null,
        date: null
      }))
    },

    page: {
      title: title || null,
      description: description || null,
      visibleText: text,
      linksFound: links.length
    },

    blocked
  };
}

// Capture only diagnostic headers. Never capture cookies or credentials.
function getDiagnosticHeaders(headers) {
  const allowed = [
    'retry-after',
    'date',
    'content-type',
    'server',
    'x-li-uuid',
    'x-li-fabric',
    'x-restli-protocol-version'
  ];

  const result = {};

  for (const key of allowed) {
    const value = headers.get(key);

    if (value) result[key] = value.slice(0, 300);
  }

  return result;
}

// Read a small error preview without downloading a large response.
async function readErrorPreview(response) {
  try {
    const reader = response.body?.getReader();

    if (!reader) {
      return (await response.text()).slice(0, MAX_ERROR_PREVIEW_CHARS);
    }

    const chunks = [];
    let size = 0;

    while (size < MAX_ERROR_PREVIEW_BYTES) {
      const { done, value } = await reader.read();

      if (done) break;

      const remaining = MAX_ERROR_PREVIEW_BYTES - size;
      const chunk = value.slice(0, remaining);

      chunks.push(chunk);
      size += chunk.byteLength;

      if (chunk.byteLength < value.byteLength) break;
    }

    try {
      await reader.cancel();
    } catch {}

    const bytes = Buffer.concat(chunks);

    return new TextDecoder()
      .decode(bytes)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_ERROR_PREVIEW_CHARS);
  } catch {
    return null;
  }
}

function classifyHttpError(status) {
  if (status === 429) return 'rate_limited';

  if (status === 401 || status === 403 || status === 999) {
    return 'access_denied';
  }

  return 'http_error';
}

export async function runLinkedInPublicProfileActor(input = {}, options = {}) {
  const startedAt = new Date().toISOString();

  const timeoutMs = Math.min(
    Math.max(Number(options.timeoutMs || DEFAULT_TIMEOUT_MS), 1000),
    20000
  );

  let profileUrl;

  try {
    profileUrl = validProfileUrl(input.profileUrl || input.url || '');
  } catch (e) {
    return failure(e.message, startedAt);
  }

  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  let html = '';
  let finalUrl = profileUrl.href;

  const requestHeaders = {
    'user-agent': USER_AGENT,
    'accept': 'text/html,application/xhtml+xml',
    'accept-language': 'en-US,en;q=0.8'
  };

  try {
    response = await fetch(profileUrl, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: requestHeaders
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');

      if (!location) {
        return failure('REDIRECT_WITHOUT_LOCATION', startedAt, response.status);
      }

      const redirected = new URL(location, profileUrl);

      if (
        redirected.protocol !== 'https:' ||
        !ALLOWED_HOSTS.has(redirected.hostname.toLowerCase())
      ) {
        return failure(
          'REDIRECT_OUTSIDE_ALLOWED_HOST',
          startedAt,
          response.status
        );
      }

      finalUrl = redirected.href;

      response = await fetch(redirected, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: requestHeaders
      });
    }

    const diagnostics = {
      headers: getDiagnosticHeaders(response.headers),
      retryAfter: response.headers.get('retry-after') || null,
      responsePreview: null
    };

    // Handle HTTP errors BEFORE trying to parse HTML.
    if (!response.ok) {
      diagnostics.responsePreview = await readErrorPreview(response);

      const code = classifyHttpError(response.status);

      return {
        actor: 'truthloop-linkedin-public-profile',
        version: ACTOR_VERSION,
        status: code === 'rate_limited' || code === 'access_denied'
          ? 'restricted'
          : 'failed',
        access: code,
        code,
        authenticationUsed: false,
        cookiesUsed: false,
        startedAt,
        collectedAt: new Date().toISOString(),
        httpStatus: response.status,
        minimum: null,
        maximum: null,
        availability: {},
        diagnostics,
        limitations: [
          'The upstream server did not provide a successful response.',
          'No login, cookies, CAPTCHA solving or access-control bypass was attempted.',
          'No automatic retry was performed.'
        ],
        source: {
          url: finalUrl,
          retrievalMethod: 'unauthenticated_public_http'
        }
      };
    }

    const type = response.headers.get('content-type') || '';

    if (!type.includes('text/html')) {
      return failure(
        'NON_HTML_RESPONSE',
        startedAt,
        response.status,
        null,
        diagnostics
      );
    }

    const reader = response.body?.getReader();

    if (reader) {
      const chunks = [];
      let size = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        size += value.byteLength;

        if (size > MAX_HTML_BYTES) {
          await reader.cancel();

          return failure(
            'HTML_SIZE_LIMIT',
            startedAt,
            response.status,
            null,
            diagnostics
          );
        }

        chunks.push(value);
      }

      html = new TextDecoder().decode(Buffer.concat(chunks));
    } else {
      html = await response.text();

      if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
        return failure(
          'HTML_SIZE_LIMIT',
          startedAt,
          response.status,
          null,
          diagnostics
        );
      }
    }

    const extracted = extractProfile(html, finalUrl);

    const access = extracted.blocked
      ? 'login_or_challenge_wall'
      : 'public_page_fetched';

    const minimum = {
      profileUrl: finalUrl,
      name: extracted.profile.name,
      headline: extracted.profile.headline,
      about: extracted.profile.about,
      imageUrl: extracted.profile.imageUrl
    };

    return {
      actor: 'truthloop-linkedin-public-profile',
      version: ACTOR_VERSION,
      status: access === 'public_page_fetched'
        ? 'partial_or_complete'
        : 'restricted',
      access,
      authenticationUsed: false,
      cookiesUsed: false,
      collectedAt: new Date().toISOString(),
      startedAt,
      httpStatus: response.status,
      minimum,
      maximum: extracted,
      availability: {
        name: !!minimum.name,
        headline: !!minimum.headline,
        about: !!minimum.about,
        experience: extracted.profile.experience.length > 0,
        education: extracted.profile.education.length > 0,
        skills: extracted.profile.skills.length > 0,
        posts: extracted.activity.posts.length > 0,
        articles: extracted.activity.articles.length > 0
      },
      diagnostics: {
        headers: getDiagnosticHeaders(response.headers),
        retryAfter: null,
        responsePreview: null
      },
      limitations: access === 'login_or_challenge_wall'
        ? [
            'LinkedIn served a login or challenge page; no bypass was attempted.'
          ]
        : [
            'Only fields present in the unauthenticated public response are extracted.',
            'Missing fields are not inferred or fabricated.'
          ],
      source: {
        url: finalUrl,
        contentType: response.headers.get('content-type'),
        retrievalMethod: 'unauthenticated_public_http'
      }
    };

  } catch (e) {
    return failure(
      e.name === 'AbortError' ? 'TIMEOUT' : 'FETCH_FAILED',
      startedAt,
      null,
      e.message
    );
  } finally {
    clearTimeout(timer);
  }
}

function failure(code, startedAt, httpStatus = null, detail = null, diagnostics = null) {
  return {
    actor: 'truthloop-linkedin-public-profile',
    version: ACTOR_VERSION,
    status: 'failed',
    access: 'request_failed',
    code,
    authenticationUsed: false,
    cookiesUsed: false,
    startedAt,
    collectedAt: new Date().toISOString(),
    httpStatus,
    detail: detail ? String(detail).slice(0, 300) : null,
    minimum: null,
    maximum: null,
    availability: {},
    diagnostics,
    limitations: [
      'No authentication or access-control bypass was attempted.'
    ]
  };
}
