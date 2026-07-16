import { spawn } from "node:child_process";
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "exports");
const outFile = path.join(outDir, "Building-Culture-Pitch.pdf");
const chrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.env.PITCH_URL || "http://localhost:8765/?print=1";

await mkdir(outDir, { recursive: true });
await access(chrome);

const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--print-to-pdf-no-header",
  `--print-to-pdf=${outFile}`,
  "--virtual-time-budget=8000",
  "--run-all-compositor-stages-before-draw",
  url,
];

await new Promise((resolve, reject) => {
  const child = spawn(chrome, args, { stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Chrome exited with code ${code}`));
  });
});

console.log(`Wrote ${outFile}`);
