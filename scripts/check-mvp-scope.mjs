#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const projectMdPath = join(repoRoot, "openspec", "project.md");
const changesRoot = join(repoRoot, "openspec", "changes");
const archiveDir = join(changesRoot, "archive");

const MARKER = "<!-- mvp-scope-denylist -->";

function fail(msg) {
  process.stderr.write(`check-mvp-scope: ${msg}\n`);
  process.exit(2);
}

async function readDenylist() {
  let md;
  try {
    md = await readFile(projectMdPath, "utf8");
  } catch (err) {
    fail(`cannot read ${relative(repoRoot, projectMdPath)}: ${err.message}`);
  }
  const markerIdx = md.indexOf(MARKER);
  if (markerIdx === -1) {
    fail(`marker ${MARKER} not found in openspec/project.md`);
  }
  const fenceStart = md.indexOf("```json", markerIdx);
  if (fenceStart === -1) {
    fail("expected a ```json fenced block immediately after the marker");
  }
  const bodyStart = md.indexOf("\n", fenceStart) + 1;
  const fenceEnd = md.indexOf("```", bodyStart);
  if (fenceEnd === -1) {
    fail("unterminated ```json block");
  }
  const json = md.slice(bodyStart, fenceEnd);
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    fail(`denylist JSON did not parse: ${err.message}`);
  }
  if (!Array.isArray(parsed.never) || !Array.isArray(parsed.postMvp)) {
    fail("denylist must define `never` and `postMvp` as arrays");
  }
  return parsed;
}

async function walkTasksFiles(root) {
  const results = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return results;
    throw err;
  }
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      if (resolve(full) === resolve(archiveDir)) continue;
      results.push(...(await walkTasksFiles(full)));
    } else if (entry.isFile() && entry.name === "tasks.md") {
      results.push(full);
    }
  }
  return results;
}

function scan(content, terms) {
  const hits = [];
  const lines = content.split("\n");
  const lowered = terms.map((t) => ({ term: t, needle: t.toLowerCase() }));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    for (const { term, needle } of lowered) {
      if (lower.includes(needle)) {
        hits.push({ line: i + 1, term, text: line.trim() });
      }
    }
  }
  return hits;
}

async function main() {
  const { never, postMvp } = await readDenylist();
  const tasksFiles = await walkTasksFiles(changesRoot);

  let blockCount = 0;
  let warnCount = 0;

  for (const file of tasksFiles) {
    const rel = relative(repoRoot, file);
    const content = await readFile(file, "utf8");

    const blocks = scan(content, never);
    for (const hit of blocks) {
      blockCount++;
      process.stderr.write(
        `BLOCK  ${rel}:${hit.line}  matched "${hit.term}"\n         ${hit.text}\n`
      );
    }

    const warns = scan(content, postMvp);
    for (const hit of warns) {
      warnCount++;
      process.stdout.write(
        `WARN   ${rel}:${hit.line}  matched post-MVP "${hit.term}"\n         ${hit.text}\n`
      );
    }
  }

  if (blockCount > 0) {
    process.stderr.write(
      `\n${blockCount} blocking match(es) against the Never list. ` +
        `Update openspec/project.md §3 to promote the feature, ` +
        `or remove the offending term from tasks.md.\n`
    );
    process.exit(1);
  }

  if (warnCount > 0) {
    process.stdout.write(
      `\n${warnCount} post-MVP match(es). Scope Defense (CLAUDE.md §9 Checkpoint F) ` +
        `required before merging.\n`
    );
  } else {
    process.stdout.write(`check-mvp-scope: ${tasksFiles.length} tasks.md file(s) scanned, clean.\n`);
  }
}

main().catch((err) => {
  fail(err.stack || err.message);
});
