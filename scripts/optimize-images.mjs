#!/usr/bin/env node
/**
 * Optimize raster assets under public/ and pitch/.
 *
 * - Platform-locked paths (favicons, miniapp, store, root OG icons): recompress in place
 * - Everything else: convert PNG/JPEG → WebP (q=82), remove the original
 *
 * Usage: node scripts/optimize-images.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 84;

/** Keep exact path + format (Farcaster / PWA / store / favicons / root OG). */
function isPlatformLocked(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('public/miniapp/')) return true;
  if (n.startsWith('public/store/')) return true;
  // Feed OG pack — JPEG for widest social-preview support.
  if (n.startsWith('public/og/') && /\.jpe?g$/i.test(n)) return true;
  if (
    /public\/(favicon|apple-touch-icon|icon-192|icon-512|og\.png|og\.jpg|og-product|og-square)/.test(
      n,
    )
  ) {
    return true;
  }
  return false;
}

/** Share cards under public/og/ prefer JPEG over WebP. */
function prefersJpeg(rel) {
  const n = rel.replace(/\\/g, '/');
  return n.startsWith('public/og/') && /\.(png|webp)$/i.test(n);
}

async function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, out);
    else if (/\.(png|jpe?g|webp)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

function rel(abs) {
  return path.relative(ROOT, abs);
}

async function optimizeLocked(file) {
  const before = fs.statSync(file).size;
  const ext = path.extname(file).toLowerCase();
  const tmp = `${file}.opt.tmp`;
  const pipeline = sharp(file).rotate();

  if (ext === '.jpg' || ext === '.jpeg') {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tmp);
  } else if (ext === '.webp') {
    await pipeline.webp({ quality: WEBP_QUALITY }).toFile(tmp);
  } else {
    // Photographic PNGs with no alpha compress best as max-effort PNG.
    // Palette quantization is avoided for store/miniapp fidelity.
    await pipeline
      .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
      .toFile(tmp);
  }

  const after = fs.statSync(tmp).size;
  if (after < before && !DRY) {
    fs.renameSync(tmp, file);
  } else {
    fs.unlinkSync(tmp);
  }
  return { before, after: Math.min(before, after), action: 'recompress' };
}

async function convertToFormat(file, { jpeg = false } = {}) {
  const before = fs.statSync(file).size;
  const out = jpeg
    ? file.replace(/\.(png|jpe?g|webp)$/i, '.jpg')
    : file.replace(/\.(png|jpe?g|webp)$/i, '.webp');
  const tmp = `${out}.opt.tmp`;

  const pipeline = sharp(file).rotate();
  if (jpeg) {
    await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(tmp);
  } else {
    await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toFile(tmp);
  }

  const after = fs.statSync(tmp).size;
  const action = jpeg ? 'jpeg' : 'webp';
  if (DRY) {
    fs.unlinkSync(tmp);
    return { before, after, action, out };
  }

  // Only keep converted file if it wins (or ties within 2%).
  if (after <= before * 0.98) {
    fs.renameSync(tmp, out);
    if (path.resolve(file) !== path.resolve(out) && fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    return { before, after, action, out };
  }

  fs.unlinkSync(tmp);
  // Fall back to in-place recompress of original format.
  return { ...(await optimizeLocked(file)), action: 'recompress-fallback' };
}

async function main() {
  const files = [
    ...(await walk(path.join(ROOT, 'public'))),
    ...(await walk(path.join(ROOT, 'pitch'))),
  ].filter((f) => !f.includes(`${path.sep}.opt.tmp`));

  let beforeTotal = 0;
  let afterTotal = 0;
  const rows = [];

  for (const file of files) {
    const r = rel(file);
    let result;
    if (isPlatformLocked(r)) {
      result = await optimizeLocked(file);
    } else if (prefersJpeg(r)) {
      result = await convertToFormat(file, { jpeg: true });
    } else {
      result = await convertToFormat(file);
    }
    beforeTotal += result.before;
    afterTotal += result.after;
    rows.push({ r, ...result });
    const saved = ((1 - result.after / result.before) * 100).toFixed(1);
    console.log(
      `${result.action.padEnd(20)} ${saved.padStart(6)}%  ${(result.before / 1024).toFixed(0).padStart(6)}→${(result.after / 1024).toFixed(0).padStart(5)}KB  ${r}`,
    );
  }

  console.log(
    `\n${DRY ? '[dry-run] ' : ''}Total: ${(beforeTotal / 1024 / 1024).toFixed(1)}MB → ${(afterTotal / 1024 / 1024).toFixed(1)}MB (${((1 - afterTotal / beforeTotal) * 100).toFixed(1)}% smaller) across ${rows.length} files`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
