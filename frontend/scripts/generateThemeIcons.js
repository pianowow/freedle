import fs from "fs";
import path from "path";
import postcss from "postcss";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const stylePath = path.join(frontendDir, "src/style.css");
const publicDir = path.join(frontendDir, "public");
const svgPath = path.join(publicDir, "favicon.svg");
const manifestPath = path.join(publicDir, "manifest.json");
const indexPath = path.join(frontendDir, "index.html");

const requiredTokens = [
  "--app-chrome-theme",
  "--state-correct-gradient",
  "--text-on-accent",
];

function readDarkThemeTokens() {
  const css = fs.readFileSync(stylePath, "utf8");
  const root = postcss.parse(css, { from: stylePath });
  const tokens = new Map();

  root.walkRules((rule) => {
    if (rule.selector !== '[data-theme="dark"]') return;

    rule.walkDecls((decl) => {
      if (decl.prop.startsWith("--")) {
        tokens.set(decl.prop, decl.value);
      }
    });
  });

  const missing = requiredTokens.filter((token) => !tokens.has(token));
  if (missing.length > 0) {
    throw new Error(`Missing dark theme token(s): ${missing.join(", ")}`);
  }

  return tokens;
}

function parseRgbColor(value) {
  const match = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*[\d.]+)?\s*\)$/i);
  if (!match) {
    throw new Error(`Expected rgb() color, got "${value}"`);
  }

  return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
}

function parseLinearGradient(value) {
  const match = value.match(
    /^linear-gradient\(\s*(rgb\([^)]+\))\s*,\s*(rgb\([^)]+\))\s*\)$/i,
  );
  if (!match) {
    throw new Error(`Expected two-stop linear-gradient(), got "${value}"`);
  }

  return [parseRgbColor(match[1]), parseRgbColor(match[2])];
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function buildSvg(tokens) {
  const [gradientStart, gradientEnd] = parseLinearGradient(
    tokens.get("--state-correct-gradient"),
  );
  const foreground = tokens.get("--text-on-accent");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Freedle">
  <defs>
    <linearGradient id="freedle-icon-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${escapeXml(gradientStart)}"/>
      <stop offset="100%" stop-color="${escapeXml(gradientEnd)}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#freedle-icon-gradient)"/>
  <path fill="${escapeXml(foreground)}" d="M176 108 H364 V170 H246 V230 H364 V292 H246 V404 H176 Z"/>
</svg>
`;
}

async function generatePngAsset(size, filename) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, filename));
}

async function generateRasterAssets() {
  await Promise.all([
    generatePngAsset(16, "favicon-16x16.png"),
    generatePngAsset(32, "favicon-32x32.png"),
    generatePngAsset(192, "icon-192x192.png"),
    generatePngAsset(512, "icon-512x512.png"),
    generatePngAsset(180, "apple-touch-icon.png"),
  ]);
}

function updateManifest(tokens) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const chromeColor = tokens.get("--app-chrome-theme");

  manifest.background_color = chromeColor;
  manifest.theme_color = chromeColor;
  manifest.icons = [
    {
      src: "favicon.svg",
      type: "image/svg+xml",
      sizes: "any",
      purpose: "any",
    },
    {
      src: "apple-touch-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
    {
      src: "icon-192x192.png",
      type: "image/png",
      sizes: "192x192",
    },
    {
      src: "icon-512x512.png",
      type: "image/png",
      sizes: "512x512",
    },
  ];

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function updateIndex(tokens) {
  const chromeColor = tokens.get("--app-chrome-theme");
  let html = fs.readFileSync(indexPath, "utf8");

  if (!html.includes('href="/favicon.svg"')) {
    html = html.replace(
      /(\s*<link rel="apple-touch-icon"[^>]*>\n)/,
      `$1    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n`,
    );
  }

  html = html.replace(
    /<meta name="theme-color" content="[^"]*" \/>/,
    `<meta name="theme-color" content="${chromeColor}" />`,
  );

  fs.writeFileSync(indexPath, html);
}

async function main() {
  const tokens = readDarkThemeTokens();
  fs.writeFileSync(svgPath, buildSvg(tokens));
  await generateRasterAssets();
  updateManifest(tokens);
  updateIndex(tokens);

  console.log("Generated theme-managed icon assets and metadata.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
