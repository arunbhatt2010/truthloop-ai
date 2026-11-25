import { runLinkedInPublicProfileActor } from './index.js';
const url = process.argv[2];
if (!url) { console.error('Usage: node cli.js https://www.linkedin.com/in/public-profile/'); process.exit(2); }
const result = await runLinkedInPublicProfileActor({ profileUrl: url });
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
