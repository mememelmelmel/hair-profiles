/**
 * generate-bundles.ts
 *
 * Aggregates per-avatar profile JSONs into a single bundle file per hair asset,
 * and generates Unity .meta files with deterministic GUIDs.
 *
 * Usage:
 *   tsx scripts/generate-bundles.ts                  # regenerate all assets
 *   tsx scripts/generate-bundles.ts BraidBangsWolf   # regenerate specific asset(s)
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PACKAGE_NAME = "mememelmelmel.hair-profiles";
const packageDir = `Packages/${PACKAGE_NAME}`;
const hairsDir = path.join(packageDir, "Hairs");
const bundlesDir = path.join(packageDir, "Bundles");

// ── GUID / meta helpers ────────────────────────────────────────────────────────

function guid(seed: string): string {
  return crypto.createHash("md5").update(seed).digest("hex");
}

function folderMeta(seed: string): string {
  return `fileFormatVersion: 2
guid: ${guid(seed)}
folderAsset: yes
DefaultImporter:
  externalObjects: {}
  userData:
  assetBundleName:
  assetBundleVariant:
`;
}

function textAssetMeta(seed: string): string {
  return `fileFormatVersion: 2
guid: ${guid(seed)}
TextScriptImporter:
  externalObjects: {}
  userData:
  assetBundleName:
  assetBundleVariant:
`;
}

function writeMeta(metaPath: string, content: string): void {
  // Only write if missing — preserves any edits Unity may have made
  if (!fs.existsSync(metaPath)) {
    fs.writeFileSync(metaPath, content, "utf-8");
    console.log(`Generated ${metaPath}`);
  }
}

// ── Bundles/ directory meta ────────────────────────────────────────────────────

fs.mkdirSync(bundlesDir, { recursive: true });

writeMeta(
  path.join(packageDir, "Bundles.meta"),
  folderMeta(`${PACKAGE_NAME}/Bundles`),
);

// ── Per-asset bundle generation ────────────────────────────────────────────────

const args = process.argv.slice(2);

const assetNames =
  args.length > 0
    ? args
    : fs
        .readdirSync(hairsDir)
        .filter((name) => fs.statSync(path.join(hairsDir, name)).isDirectory())
        .sort();

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

  const bundleFileName = `${assetName}.bundle.json`;
  const bundlePath = path.join(bundlesDir, bundleFileName);
  fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, "\t") + "\n", "utf-8");
  console.log(`Generated ${bundlePath} (${Object.keys(bundle).length} avatars)`);

  writeMeta(
    `${bundlePath}.meta`,
    textAssetMeta(`${PACKAGE_NAME}/Bundles/${bundleFileName}`),
  );
}

if (hasError) process.exit(1);
