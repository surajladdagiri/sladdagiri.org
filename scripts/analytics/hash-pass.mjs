#!/usr/bin/env node
/**
 * hash-pass.mjs — turn the dashboard password into the salt+hash pair the
 * Worker stores. The plaintext never leaves your machine and never gets
 * committed. The Worker only ever holds the hash.
 *
 *   node scripts/analytics/hash-pass.mjs "your-password"
 */

import { pbkdf2Sync, randomBytes } from "node:crypto";

const b64url = (b) =>
  b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pass = process.argv[2];
if (!pass) {
  console.error('usage: node scripts/analytics/hash-pass.mjs "your-password"');
  process.exit(1);
}
if (pass.length < 10 && !process.env.ALLOW_SHORT) {
  console.error(
    `\n  ${pass.length} characters is short for a login that is on the public\n` +
      "  internet. Anyone who finds the dashboard URL can try passwords against\n" +
      "  it. PBKDF2 slows each guess, but a short common word is still weak.\n" +
      "  Use a longer one, or force it with:\n" +
      '    ALLOW_SHORT=1 node scripts/analytics/hash-pass.mjs "..."\n'
  );
  process.exit(1);
}

// Must match PBKDF2_ITERS in workers/analytics/src/index.js.
const ITERS = 100000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(pass, salt, ITERS, 32, "sha256");

console.log(`
Set these three secrets on the Worker:

  cd workers/analytics
  echo '${b64url(hash)}' | npx wrangler secret put PASS_HASH
  echo '${b64url(salt)}' | npx wrangler secret put PASS_SALT
  echo '${b64url(randomBytes(32))}' | npx wrangler secret put TOKEN_SECRET
`);
