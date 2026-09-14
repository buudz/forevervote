import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const assetDir = path.join(root, "scripts", "assets");
const publicDir = path.join(root, "public");
const output = path.join(publicDir, "forevervote-logo.webp");

const encoded = [1, 2, 3, 4]
  .map((part) =>
    fs.readFileSync(
      path.join(assetDir, `forevervote-logo.part${part}.b64`),
      "utf8"
    ).trim()
  )
  .join("");

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(output, Buffer.from(encoded, "base64"));

console.log("ForeverVote logo asset ready.");
