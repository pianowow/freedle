import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");

const rawColorValue = String.raw`(?:#[\da-fA-F]{3,8}|rgba?\(|hsla?\(|var\(--|\b(?:white|black|red|green|blue|yellow|orange|purple|gray|grey)\b)`;
const checks = [
  {
    name: "color prop literal",
    pattern: new RegExp(String.raw`<[^>]*\b(?:glow-color|glowColor)\s*=\s*["']${rawColorValue}`, "i"),
  },
  {
    name: "script color value",
    pattern: new RegExp(String.raw`\b\w*(?:color|background)\w*\s*(?::|=)\s*["']${rawColorValue}`, "i"),
  },
  {
    name: "inline color style binding",
    pattern: /:style\s*=\s*["'][^"']*\b(?:color|background|backgroundColor)\b\s*:/i,
  },
];

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (/\.(vue|js|ts)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function stripVueStyleBlocks(content) {
  return content.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

const violations = [];

for (const file of listFiles(srcDir)) {
  const rawContent = fs.readFileSync(file, "utf8");
  const content = file.endsWith(".vue")
    ? stripVueStyleBlocks(rawContent)
    : rawContent;
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const check of checks) {
      if (check.name === "script color value" && line.includes("<")) continue;
      if (check.pattern.test(line)) {
        violations.push({
          file: path.relative(path.resolve(__dirname, ".."), file),
          line: index + 1,
          check: check.name,
          source: line.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("Theme color check failed. Use semantic variants/classes instead of passing color values in templates or scripts.\n");
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} ${violation.check}`);
    console.error(`  ${violation.source}`);
  }
  process.exit(1);
}

console.log("Theme color check passed.");
