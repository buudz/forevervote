import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const partsDir = path.join(root, "scripts", "branding");
const output = path.join(root, "public", "forevervote-logo-final.webp");

const encoded = [0, 1, 2, 3, 4]
  .map((part) => fs.readFileSync(path.join(partsDir, `forevervote-logo.${part}.b64`), "utf8").trim())
  .join("");

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.from(encoded, "base64"));

const lockedScrollWebp = path.join(root, "public", "fv-scroll-mark-final.webp");
const lockedScrollPng = path.join(root, "public", "fv-scroll-mark-final.png");

await sharp(lockedScrollWebp)
  .png()
  .toFile(lockedScrollPng);

console.log("ForeverVote final brand assets ready.");
