/**
 * generate-readmes.ts
 *
 * Generates each hair asset's README.md from its Profiles/ directory and
 * avatar-list.json. The README lists every supported avatar under a
 * `## 対応アバター` heading, sorted alphabetically by the Profile key
 * (the avatar's `name`).
 *
 * Usage:
 *   tsx scripts/generate-readmes.ts                  # regenerate all assets
 *   tsx scripts/generate-readmes.ts BraidBangsWolf   # regenerate specific asset(s)
 */

import fs from "node:fs";
import path from "node:path";
import {
  PACKAGE_NAME,
  avatarsMdName,
  defaultImporterMeta,
  hairsDir,
  loadAvatarList,
  profilesSubdir,
  resolveAssetNames,
  writeMeta,
} from "./common.ts";

const avatarList = loadAvatarList();
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

  const avatarNames = fs
    .readdirSync(profilesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort((a, b) => a.localeCompare(b));

  const missing = avatarNames.filter((n) => !avatarList[n]);
  if (missing.length > 0) {
    console.error(
      `ERROR: ${assetName}: profiles missing from avatar-list.json: ${missing.join(", ")}`,
    );
    hasError = true;
  }

  const body = avatarNames
    .map((n) => {
      const entry = avatarList[n];
      return entry ? `- ${entry.name} (${n}): ${entry.itemUrl}` : `- (${n})`;
    })
    .join("\n");

  const md = `## 対応アバター\n\n${body}\n`;

  const mdPath = path.join(assetDir, avatarsMdName);
  fs.writeFileSync(mdPath, md, "utf-8");
  console.log(`Generated ${mdPath} (${avatarNames.length} avatars)`);

  writeMeta(
    `${mdPath}.meta`,
    defaultImporterMeta(`${PACKAGE_NAME}/Hairs/${assetName}/${avatarsMdName}`),
  );
}

if (hasError) process.exit(1);
