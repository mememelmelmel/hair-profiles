/**
 * Shared paths and Unity .meta helpers for generator scripts.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const PACKAGE_NAME = "mememelmelmel.hair-profiles";
export const packageDir = `Packages/${PACKAGE_NAME}`;
export const hairsDir = path.join(packageDir, "Hairs");
export const bundlesDir = path.join(packageDir, "Bundles");
export const profilesSubdir = "Profiles";
export const avatarsMdName = "README.md";
export const avatarListPath = "avatar-list.json";

export type AvatarEntry = { name: string; itemUrl: string };

export function loadAvatarList(): Record<string, AvatarEntry> {
  return JSON.parse(fs.readFileSync(avatarListPath, "utf-8"));
}

export function resolveAssetNames(args: string[]): string[] {
  if (args.length > 0) return args;
  return fs
    .readdirSync(hairsDir)
    .filter((name) => fs.statSync(path.join(hairsDir, name)).isDirectory())
    .sort();
}

function guid(seed: string): string {
  return crypto.createHash("md5").update(seed).digest("hex");
}

export function folderMeta(seed: string): string {
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

export function textAssetMeta(seed: string): string {
  return `fileFormatVersion: 2
guid: ${guid(seed)}
TextScriptImporter:
  externalObjects: {}
  userData:
  assetBundleName:
  assetBundleVariant:
`;
}

export function defaultImporterMeta(seed: string): string {
  return `fileFormatVersion: 2
guid: ${guid(seed)}
DefaultImporter:
  externalObjects: {}
  userData:
  assetBundleName:
  assetBundleVariant:
`;
}

export function writeMeta(metaPath: string, content: string): void {
  // Only write if missing — preserves any edits Unity may have made
  if (!fs.existsSync(metaPath)) {
    fs.writeFileSync(metaPath, content, "utf-8");
    console.log(`Generated ${metaPath}`);
  }
}
