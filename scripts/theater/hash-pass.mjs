#!/usr/bin/env node
/**
 * hash-pass.mjs — turn a passphrase into the salt+hash pair the Worker stores.
 *
 *   node scripts/theater/hash-pass.mjs "correct horse battery staple"
 *
 * The plaintext passphrase never leaves your machine and never gets deployed.
 * The Worker only ever holds the hash, so anyone who somehow reads your
 * Cloudflare env still can't get into the room.
 */

import { pbkdf2Sync, randomBytes } from "node:crypto";

const b64url = (b) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pass = process.argv[2];
if (!pass) {
  console.error('usage: node hash-pass.mjs "your passphrase"');
  process.exit(1);
}
if (pass.length < 12 && !process.env.ALLOW_SHORT) {
  console.error(
    `\n  ${pass.length} characters is short. PBKDF2 makes each guess cost ~200ms,\n` +
      "  so this isn't instantly broken — but a short common word is in every\n" +
      "  wordlist, and the only thing really protecting the room is that nobody\n" +
      "  knows the URL exists.\n\n" +
      "  Four random words is easy to text and genuinely hard to guess.\n" +
      "  To use it anyway:  ALLOW_SHORT=1 node scripts/theater/hash-pass.mjs \"...\"\n",
  );
  process.exit(1);
}

// Must match PBKDF2_ITERS in workers/theater/src/index.js. Cloudflare Workers
// rejects anything above 100,000 at runtime, so this is a platform ceiling
// rather than a choice.
const ITERS = 100000;

const salt = randomBytes(16);
const hash = pbkdf2Sync(pass, salt, ITERS, 32, "sha256");

console.log(`
Set these three secrets on the Worker:

  cd workers/theater
  echo '${b64url(hash)}' | npx wrangler secret put PASS_HASH
  echo '${b64url(salt)}' | npx wrangler secret put PASS_SALT
  echo '${b64url(randomBytes(32))}' | npx wrangler secret put TOKEN_SECRET
`);
