// Extract one version's section from CHANGELOG.md as GitHub Release notes.
//
// Usage: node scripts/changelog-release-notes.mjs <version>
//   <version> accepts a tag ("v0.6.0") or a bare number ("0.6.0").
//
// Prints the body of the matching "## [X.Y.Z] - DATE" section (without the
// heading and trailing link-reference lines) to stdout. Exits non-zero if the
// version is missing, so the release workflow fails loudly instead of
// publishing an empty release.

import { readFile } from "node:fs/promises";

const rawVersion = process.argv[2];
if (!rawVersion) {
  console.error("Usage: node scripts/changelog-release-notes.mjs <version>");
  process.exit(2);
}

// Accept "v0.6.0" or "0.6.0".
const version = rawVersion.replace(/^v/, "");

const changelogUrl = new URL("../CHANGELOG.md", import.meta.url);
const text = await readFile(changelogUrl, "utf8");
const lines = text.split(/\r?\n/);

// A section starts at "## [X.Y.Z]" (date optional) and ends at the next "## "
// heading or the link-reference block ("[x]: http...").
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const headingRe = new RegExp(`^## \\[${escaped}\\]`);
const nextHeadingRe = /^## /;
const linkRefRe = /^\[[^\]]+\]:\s/;

let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (headingRe.test(lines[i])) {
    start = i;
    break;
  }
}

if (start === -1) {
  console.error(`No changelog section found for version ${version}.`);
  process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (nextHeadingRe.test(lines[i]) || linkRefRe.test(lines[i])) {
    end = i;
    break;
  }
}

const body = lines.slice(start + 1, end).join("\n").trim();

if (!body) {
  console.error(`Changelog section for version ${version} is empty.`);
  process.exit(1);
}

process.stdout.write(body + "\n");
