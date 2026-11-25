
import { runLinkedInPublicProfileActor } from './index.js';

const url = process.argv[2];

if (!url) {
  console.error(
    'Usage: node cli.js https://www.linkedin.com/in/public-profile/'
  );
  process.exit(2);
}

const result = await runLinkedInPublicProfileActor({
  profileUrl: url
});

console.log(JSON.stringify(result, null, 2));

// A green workflow must mean that public-page retrieval actually worked.
const successful =
  result.status === 'partial_or_complete' &&
  result.access === 'public_page_fetched' &&
  result.httpStatus >= 200 &&
  result.httpStatus < 300;

if (!successful) {
  console.error(
    `Actor did not retrieve a public profile successfully: ${
      result.code || result.access || result.status
    }`
  );

  process.exitCode = 1;
}
