// Run by `npm version <x.y.z>` in this package: copies the new version into manifest.json and
// records it in versions.json (plugin version -> minimum Obsidian version), as Obsidian expects.
import { readFileSync, writeFileSync } from 'node:fs';

const targetVersion = process.env.npm_package_version;
if (!targetVersion) throw new Error('npm_package_version is not set; run via `npm version`');

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t') + '\n');

const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[targetVersion] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');
