#!/usr/bin/env node
/**
 * Merge a signed accountAssociation (from Warpcast Manifest Tool) into farcaster.json.
 *
 * Usage:
 *   # Paste tool output JSON file (full manifest or just { accountAssociation })
 *   node scripts/apply-farcaster-association.mjs ./signed-manifest.json
 *
 *   # Or pipe JSON
 *   pbpaste | node scripts/apply-farcaster-association.mjs -
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { domainManifestSchema } from '@farcaster/miniapp-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const manifestPath = resolve(root, 'public/.well-known/farcaster.json');
const inputArg = process.argv[2];

if (!inputArg) {
  console.error('Usage: node scripts/apply-farcaster-association.mjs <signed.json|->');
  process.exit(1);
}

const inputRaw =
  inputArg === '-'
    ? readFileSync(0, 'utf8')
    : readFileSync(resolve(inputArg), 'utf8');

const signed = JSON.parse(inputRaw);
const association = signed.accountAssociation;
if (!association?.header || !association?.payload || !association?.signature) {
  console.error('FAIL: input must include accountAssociation.{header,payload,signature}');
  process.exit(1);
}

const current = JSON.parse(readFileSync(manifestPath, 'utf8'));
const miniapp = signed.miniapp ?? signed.frame ?? current.miniapp ?? current.frame;
if (!miniapp) {
  console.error('FAIL: no miniapp config to merge');
  process.exit(1);
}

const next = {
  accountAssociation: association,
  miniapp,
  frame: miniapp,
};

const parsed = domainManifestSchema.safeParse(next);
if (!parsed.success) {
  console.error('FAIL: merged manifest does not validate');
  console.error(parsed.error.toString());
  process.exit(1);
}

writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
console.log('Wrote', manifestPath);
console.log('Redeploy, then reopen the Manifest Tool for a green ownership check.');
