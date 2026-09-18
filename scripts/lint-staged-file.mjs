/**
 * Windows-friendly lint-staged helper. Invokes frontend ESLint/Prettier via
 * `node path/to/bin` so Git hooks do not depend on .cmd shims.
 *
 * Usage (lint-staged appends staged file paths from the git root):
 *   node ./scripts/lint-staged-file.mjs eslint file1 file2
 *   node ./scripts/lint-staged-file.mjs prettier file1 file2
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tool = process.argv[2];
const files = process.argv.slice(3).filter(Boolean);

if (!tool || (tool !== "eslint" && tool !== "prettier")) {
  console.error("Usage: node scripts/lint-staged-file.mjs <eslint|prettier> [files...]");
  process.exit(1);
}

if (files.length === 0) {
  process.exit(0);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendRoot = path.join(repoRoot, "frontend");
const bin =
  tool === "eslint"
    ? path.join(frontendRoot, "node_modules", "eslint", "bin", "eslint.js")
    : path.join(frontendRoot, "node_modules", "prettier", "bin", "prettier.cjs");

if (!existsSync(bin)) {
  console.error(`Cannot find ${tool} in frontend/node_modules. Run: cd frontend; npm install`);
  process.exit(1);
}

const frontendFiles = [];
for (const file of files) {
  const abs = path.isAbsolute(file) ? file : path.resolve(repoRoot, file);
  const rel = path.relative(frontendRoot, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    console.error(`Skipping ${file} (not under frontend/)`);
    continue;
  }
  frontendFiles.push(rel);
}

if (frontendFiles.length === 0) {
  process.exit(0);
}

const extraArgs = tool === "eslint" ? ["--fix"] : ["--write"];
const result = spawnSync(process.execPath, [bin, ...extraArgs, ...frontendFiles], {
  cwd: frontendRoot,
  stdio: "inherit",
  env: process.env,
  windowsHide: true,
});

process.exit(result.status === null ? 1 : result.status);
