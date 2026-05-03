/**
 * generate-bundles.ts
 *
 * Aggregates per-avatar profile JSONs into a single bundle file per hair
 * asset, and generates Unity .meta files with deterministic GUIDs.
 *
 * Usage:
 *   tsx scripts/generate-bundles.ts                  # regenerate all assets
 *   tsx scripts/generate-bundles.ts BraidBangsWolf   # regenerate specific asset(s)
 */

import fs from "node:fs";
import path from "node:path";
import {
  PACKAGE_NAME,
  bundlesDir,
  folderMeta,
  hairsDir,
  packageDir,
  profilesSubdir,
  resolveAssetNames,
  textAssetMeta,
  writeMeta,
} from "./common.ts";

fs.mkdirSync(bundlesDir, { recursive: true });

writeMeta(path.join(packageDir, "Bundles.meta"), folderMeta(`${PACKAGE_NAME}/Bundles`));

const assetNames = resolveAssetNames(process.argv.slice(2));

let hasError = false;

for (const assetName of assetNames) {
  const assetDir = path.join(hairsDir, assetName);
  const profilesDir = path.join(assetDir, profilesSubdir);

  if (!fs.existsSync(profilesDir) || !fs.statSync(profilesDir).isDirectory()) {
    console.error(`ERROR: Profiles directory not found: ${profilesDir}`);
    hasError = true;
    continue;
  }

  const files = fs
    .readdirSync(profilesDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const bundle: Record<string, unknown> = {};

  for (const file of files) {
    const avatarName = file.slice(0, -5); // strip .json
    const raw = fs.readFileSync(path.join(profilesDir, file), "utf-8");
    // Strip UTF-8 BOM if present
    const json = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    bundle[avatarName] = JSON.parse(json);
  }

  const bundleFileName = `${assetName}.bundle.json`;
  const bundlePath = path.join(bundlesDir, bundleFileName);
  fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + "\n", "utf-8");
  console.log(`Generated ${bundlePath} (${Object.keys(bundle).length} avatars)`);

  writeMeta(`${bundlePath}.meta`, textAssetMeta(`${PACKAGE_NAME}/Bundles/${bundleFileName}`));

  writeMeta(
    `${profilesDir}.meta`,
    folderMeta(`${PACKAGE_NAME}/Hairs/${assetName}/${profilesSubdir}`),
  );
}

if (hasError) process.exit(1);
