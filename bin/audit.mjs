#!/usr/bin/env node
// Thin launcher so `./bin/audit.mjs <command>` works without a build step (uses tsx from node_modules).
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const tsx = path.join(root, "node_modules", ".bin", "tsx")
const result = spawnSync(tsx, [path.join(root, "src", "cli.ts"), ...process.argv.slice(2)], { stdio: "inherit" })
process.exit(result.status ?? 1)
