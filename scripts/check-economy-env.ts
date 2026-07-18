/**
 * Build/runtime parity check for Culture Economy env.
 * Usage: npx tsx scripts/check-economy-env.ts
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const envPath = path.join(root, '.env');

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const fileEnv = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {};
const bcc = process.env.VITE_BCC_MINT || fileEnv.VITE_BCC_MINT || '';
const cgt = process.env.VITE_CGT_MINT || fileEnv.VITE_CGT_MINT || '';
const prog =
  process.env.VITE_ECONOMY_PROGRAM_ID ||
  fileEnv.VITE_ECONOMY_PROGRAM_ID ||
  'AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ';
const auth = process.env.ECONOMY_AUTHORITY_SECRET || fileEnv.ECONOMY_AUTHORITY_SECRET || '';

const issues: string[] = [];
if (!bcc) issues.push('Missing VITE_BCC_MINT — client bundle will see empty mint at vite build');
if (!cgt) issues.push('Missing VITE_CGT_MINT');
if (!auth) issues.push('Missing ECONOMY_AUTHORITY_SECRET (server-only)');
if (auth && (auth.startsWith('VITE_') || Object.keys(fileEnv).some((k) => k === 'VITE_ECONOMY_AUTHORITY_SECRET'))) {
  issues.push('Authority must NOT use VITE_ prefix');
}

console.log('Economy env check');
console.log('  program:', prog);
console.log('  bcc:', bcc || '(empty)');
console.log('  cgt:', cgt || '(empty)');
console.log('  authority:', auth ? `<present ${auth.length} chars>` : '(missing)');
if (issues.length) {
  console.error('\nFAIL:');
  for (const i of issues) console.error(' -', i);
  console.error('\nRebuild client after setting VITE_* mints: npm run build');
  process.exit(1);
}
console.log('\nOK — set these before `npm run build` so Vite bakes mints into the client.');
