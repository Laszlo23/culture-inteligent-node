#!/usr/bin/env node
/**
 * Validate public/.well-known/farcaster.json against @farcaster/miniapp-core schema.
 * Usage:
 *   node scripts/validate-farcaster-manifest.mjs
 *   node scripts/validate-farcaster-manifest.mjs --require-association
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { domainManifestSchema, domainMiniAppConfigSchema } from '@farcaster/miniapp-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const path = resolve(root, 'public/.well-known/farcaster.json');
const requireAssociation = process.argv.includes('--require-association');

const raw = JSON.parse(readFileSync(path, 'utf8'));
const mini = raw.miniapp ?? raw.frame;

if (!mini) {
  console.error('FAIL: missing miniapp/frame');
  process.exit(1);
}

const miniResult = domainMiniAppConfigSchema.safeParse(mini);
if (!miniResult.success) {
  console.error('FAIL: miniapp config invalid');
  console.error(miniResult.error.toString());
  process.exit(1);
}

if (raw.frame && raw.miniapp) {
  if (JSON.stringify(raw.frame) !== JSON.stringify(raw.miniapp)) {
    console.error('FAIL: frame and miniapp must be identical');
    process.exit(1);
  }
}

if (raw.accountAssociation) {
  const full = domainManifestSchema.safeParse(raw);
  if (!full.success) {
    console.error('FAIL: signed manifest invalid');
    console.error(full.error.toString());
    process.exit(1);
  }
  console.log('OK: marketplace-ready signed manifest');
  console.log('  name:', mini.name);
  console.log('  category:', mini.primaryCategory);
  console.log('  domain:', mini.canonicalDomain);
  process.exit(0);
}

if (requireAssociation) {
  console.error('FAIL: accountAssociation missing — sign via Manifest Tool, then:');
  console.error('  node scripts/apply-farcaster-association.mjs path/to/signed.json');
  process.exit(1);
}

console.log('OK: unsigned miniapp metadata validates (marketplace needs accountAssociation)');
console.log('  name:', mini.name);
console.log('  category:', mini.primaryCategory);
console.log('  icon:', mini.iconUrl);
console.log('  screenshots:', (mini.screenshotUrls || []).length);
console.log('');
console.log('Next: sign ownership →');
console.log('  https://farcaster.xyz/~/developers/mini-apps/manifest?domain=mining.buildingcultureid.space');
process.exit(0);
