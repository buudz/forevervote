import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const partsDir = path.join(root, "scripts", "branding");
const output = path.join(root, "public", "forevervote-logo-final.webp");

const encoded = [0, 1, 2, 3, 4]
  .map((part) => fs.readFileSync(path.join(partsDir, `forevervote-logo.${part}.b64`), "utf8").trim())
  .join("");

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.from(encoded, "base64"));
console.log("ForeverVote final brand assets ready.");
