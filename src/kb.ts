import fs from "node:fs"
import path from "node:path"
import { parse } from "yaml"

import { KB_DIR } from "./paths.js"
import {
  type ChecklistItem,
  type Profile,
  type ProfileTag,
  checklistFileSchema,
  presenceFileSchema,
} from "./schema.js"

const readYaml = (file: string) => parse(fs.readFileSync(path.join(KB_DIR, file), "utf8")) as unknown

export function loadChecklist(dir = KB_DIR): ChecklistItem[] {
  const file = path.join(dir, "checklist.yaml")
  const parsed = checklistFileSchema.parse(parse(fs.readFileSync(file, "utf8")))
  const ids = new Set<string>()
  for (const item of parsed.items) {
    if (ids.has(item.id)) throw new Error(`Duplicate checklist id: ${item.id}`)
    ids.add(item.id)
  }

  return parsed.items
}

export function loadPresence() {
  return presenceFileSchema.parse(readYaml("presence-directory.yaml")).entries
}

/** An item applies when every `all` tag is present and, if `any` is given, at least one of those tags is present. */
export function appliesTo(item: ChecklistItem, tags: readonly ProfileTag[]): boolean {
  const have = new Set(tags)
  const { all, any } = item.appliesWhen
  if (!all.every((t) => have.has(t))) return false
  if (any.length > 0 && !any.some((t) => have.has(t))) return false

  return true
}

export function applicableChecklist(profile: Pick<Profile, "tags">, items = loadChecklist()): ChecklistItem[] {
  return items.filter((item) => appliesTo(item, profile.tags))
}
