import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slidesDir = path.join(__dirname, "exports", "slides");
const outPdf = path.join(__dirname, "exports", "Building-Culture-Pitch.pdf");
const chrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.PITCH_URL || "http://localhost:8765/";
const W = 1920;
const H = 1080;
const SCALE = 2;

await mkdir(slidesDir, { recursive: true });

// Ensure puppeteer-core + pdf-lib are available locally under pitch/
const require = createRequire(import.meta.url);
async function ensureDeps() {
  try {
    require.resolve("puppeteer-core");
    require.resolve("pdf-lib");
  } catch {
    await new Promise((resolve, reject) => {
      const child = spawn(
        "npm",
        ["install", "--no-save", "puppeteer-core@24", "pdf-lib@1"],
        { cwd: __dirname, stdio: "inherit", shell: true }
      );
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`npm install failed: ${code}`))
      );
    });
  }
}

await ensureDeps();
const puppeteer = (await import("puppeteer-core")).default;
const { PDFDocument } = await import("pdf-lib");

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: [`--window-size=${W},${H}`, "--hide-scrollbars"],
  defaultViewport: { width: W, height: H, deviceScaleFactor: SCALE },
});

const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await page.addStyleTag({
  content: `
    .chrome, .hint, .brand-chip, .slide-num { display: none !important; }
    .shot, .hero-art, .wheel-core, .wheel-core span, .level-bar .bar i, .node-dot {
      animation: none !important;
    }
  `,
});

const paths = [];
for (let i = 0; i < 10; i++) {
  await page.evaluate((n) => {
    const slides = [...document.querySelectorAll(".slide")];
    const dots = [...document.querySelectorAll("#dots button")];
    slides.forEach((s, idx) => s.classList.toggle("active", idx === n));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === n));
    const cur = document.getElementById("cur");
    if (cur) cur.textContent = String(n + 1).padStart(2, "0");
  }, i);
  await new Promise((r) => setTimeout(r, 350));
  const file = path.join(slidesDir, `${String(i + 1).padStart(2, "0")}.png`);
  await page.screenshot({ path: file, type: "png", fullPage: false });
  paths.push(file);
  console.log(`Captured slide ${i + 1}/10 → ${file}`);
}

await browser.close();

const pdf = await PDFDocument.create();
for (const file of paths) {
  const bytes = await readFile(file);
  const img = await pdf.embedPng(bytes);
  const pagePdf = pdf.addPage([W, H]);
  pagePdf.drawImage(img, { x: 0, y: 0, width: W, height: H });
}

const pdfBytes = await pdf.save();
await writeFile(outPdf, pdfBytes);
console.log(`Wrote ${outPdf} (${paths.length} fullscreen pages)`);
