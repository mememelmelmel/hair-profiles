/**
 * generate-bundles.ts
 *
 * Aggregates per-avatar profile JSONs into a single bundle file per hair asset.
 *
 * Usage:
 *   tsx scripts/generate-bundles.ts                  # regenerate all assets
 *   tsx scripts/generate-bundles.ts BraidBangsWolf   # regenerate specific asset(s)
 */

import fs from "node:fs";
import path from "node:path";

const packageDir = "Packages/mememelmelmel.hair-profiles";
const hairsDir = path.join(packageDir, "Hairs");
const bundlesDir = path.join(packageDir, "Bundles");

const args = process.argv.slice(2);

const assetNames =
  args.length > 0
    ? args
    : fs
        .readdirSync(hairsDir)
        .filter((name) => fs.statSync(path.join(hairsDir, name)).isDirectory())
        .sort();

fs.mkdirSync(bundlesDir, { recursive: true });

let hasError = false;

for (const assetName of assetNames) {
  const assetDir = path.join(hairsDir, assetName);

  if (!fs.existsSync(assetDir) || !fs.statSync(assetDir).isDirectory()) {
    console.error(`ERROR: Asset directory not found: ${assetDir}`);
    hasError = true;
    continue;
  }

  const files = fs
    .readdirSync(assetDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const bundle: Record<string, unknown> = {};

  for (const file of files) {
    const avatarName = file.slice(0, -5); // strip .json
    const raw = fs.readFileSync(path.join(assetDir, file), "utf-8");
    // Strip UTF-8 BOM if present
    const json = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    bundle[avatarName] = JSON.parse(json);
  }

  const bundlePath = path.join(bundlesDir, `${assetName}.bundle.json`);
  fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, "\t") + "\n", "utf-8");
  console.log(`Generated ${bundlePath} (${Object.keys(bundle).length} avatars)`);
}

if (hasError) process.exit(1);
