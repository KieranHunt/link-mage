import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type JsonObject = Record<string, unknown>;

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(repoRoot, "public", "manifest.json");
const packageJsonPath = join(repoRoot, "package.json");

function validateManifestVersion(version: string): void {
  const parts = version.split(".");
  if (parts.length !== 4) {
    throw new Error(`Expected 4 version parts, got ${version}`);
  }

  const values = parts.map((part) => {
    if (!/^(0|[1-9][0-9]*)$/.test(part)) {
      throw new Error(`Invalid version part ${part} in ${version}`);
    }

    const value = Number(part);
    if (!Number.isInteger(value) || value < 0 || value > 65535) {
      throw new Error(`Version part ${part} is outside Chrome's 0..65535 range`);
    }

    return value;
  });

  if (values.every((value) => value === 0)) {
    throw new Error("Version must not be all zeroes");
  }
}

function formatReleaseVersion(now: Date): {
  readonly version: string;
  readonly versionName: string;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const dayHour = now.getUTCDate() * 100 + now.getUTCHours();
  const minuteSecond = now.getUTCMinutes() * 100 + now.getUTCSeconds();
  const version = `${year}.${month}.${dayHour}.${minuteSecond}`;
  const versionName = now.toISOString().replace(/\.\d{3}Z$/, "Z");

  validateManifestVersion(version);

  return { version, versionName };
}

async function readJson(path: string): Promise<JsonObject> {
  return JSON.parse(await readFile(path, "utf8")) as JsonObject;
}

async function writeJson(path: string, value: JsonObject): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceJsonStringProperty(
  source: string,
  property: string,
  value: string,
): string {
  const pattern = new RegExp(`(\\"${property}\\"\\s*:\\s*)\\"[^\\"]*\\"`);
  if (!pattern.test(source)) {
    throw new Error(`Missing ${property} in JSON source`);
  }

  return source.replace(pattern, `$1${JSON.stringify(value)}`);
}

function withReleaseManifestVersion(
  source: string,
  version: string,
  versionName: string,
): string {
  const withVersion = replaceJsonStringProperty(source, "version", version);

  if (/(\"version_name\"\s*:\s*)\"[^\"]*\"/.test(withVersion)) {
    return replaceJsonStringProperty(withVersion, "version_name", versionName);
  }

  return withVersion.replace(
    /("version"\s*:\s*"[^"]*",)/,
    `$1\n  "version_name": ${JSON.stringify(versionName)},`,
  );
}

const { version, versionName } = formatReleaseVersion(new Date());
const manifest = await readFile(manifestPath, "utf8");
const packageJson = await readJson(packageJsonPath);

await writeFile(
  manifestPath,
  withReleaseManifestVersion(manifest, version, versionName),
);
await writeJson(packageJsonPath, { ...packageJson, version });

console.log(`Prepared release v${version} (${versionName})`);
