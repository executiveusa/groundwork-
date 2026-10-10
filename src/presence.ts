import { z } from "zod/v4"

import type { CrawlResult } from "./crawl.js"
import type { Profile } from "./schema.js"
import { presenceEntrySchema } from "./schema.js"
import type { SearchResult } from "./search.js"

type Entry = z.infer<typeof presenceEntrySchema>
export type PresenceStatus = { entry: Entry; status: "found" | "not_found" | "unknown"; evidence: string }

const HOSTS: Record<string, RegExp> = {
  linkedin: /linkedin\.com/,
  facebook: /facebook\.com/,
  instagram: /instagram\.com/,
  youtube: /youtube\.com/,
  candid: /(candid|guidestar)\.org/,
  charitynavigator: /charitynavigator\.org/,
  propublica: /propublica\.org\/nonprofits/,
  googlebusiness: /(google\.com\/maps|g\.page|business\.google\.com)/,
  givingtuesday: /givingtuesday\.org/,
  network: /networkforgood\.com/,
}

/**
 * Cheap, honest presence check: an entry is "found" when the site links to it or a search hit's URL host matches.
 * Anything we cannot test from public pages is "unknown" (never "not_found"), so the report does not accuse.
 */
export function checkPresence(entries: Entry[], crawl: CrawlResult, searches: SearchResult[], profile: Profile): PresenceStatus[] {
  const links = crawl.pages.flatMap((p) => p.links.map((l) => l.href))
  const hits = searches.flatMap((s) => s.hits.map((h) => h.url))
  const all = [...links, ...hits]

  return entries.map((entry) => {
    const key = Object.keys(HOSTS).find((k) => entry.id.toLowerCase().includes(k) || entry.name.toLowerCase().replace(/\W/g, "").includes(k))
    const re = key ? HOSTS[key] : undefined
    if (!re) return { entry, status: "unknown", evidence: "No automatic test; verify by hand using the entry's how_to_verify_presence note." }
    const hit = all.find((u) => re.test(u))
    if (hit) return { entry, status: "found", evidence: hit }
    const searched = searches.length > 0
    // A missing link on the site is only weak evidence; absence from search results is stronger but still not proof.
    return { entry, status: searched ? "not_found" : "unknown", evidence: searched ? `No link on the site and no search hit for ${profile.name}.` : "No search was run; only site links were checked." }
  })
}
