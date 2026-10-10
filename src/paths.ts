import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const KB_DIR = path.join(ROOT, "kb")
export const CLIENTS_DIR = process.env.AUDIT_CLIENTS_DIR ?? path.join(ROOT, "clients")
export const clientDir = (slug: string) => path.join(CLIENTS_DIR, slug)
