import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontPath = path.join(
  __dirname,
  "../src/lib/project-setup/templates/frontend/assets/fonts/Poppins-Regular.ttf",
);
const outPath = path.join(
  __dirname,
  "../src/lib/project-setup/templates/frontend/poppins-font-base64.ts",
);

const base64 = fs.readFileSync(fontPath).toString("base64");
fs.writeFileSync(
  outPath,
  `export const POPPINS_REGULAR_TTF_BASE64 = ${JSON.stringify(base64)};\n`,
);
console.log(`Wrote ${outPath} (${base64.length} base64 chars)`);
