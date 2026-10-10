import { z } from "zod/v4"

// ProPublica Nonprofit Explorer API v2 (free, no key). Public IRS data. Findings from it are
// classified as record-derived facts; anything about people is NEEDS_HUMAN_REVIEW.
const BASE = "https://projects.propublica.org/nonprofits/api/v2"

const orgSchema = z
  .object({
    ein: z.number(),
    name: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    ntee_code: z.string().nullish(),
    subseccd: z.number().nullish(),
  })
  .passthrough()

const filingSchema = z
  .object({
    tax_prd_yr: z.number().nullish(),
    totrevenue: z.number().nullish(),
    totfuncexpns: z.number().nullish(),
    pdf_url: z.string().nullish(),
  })
  .passthrough()

export type IrsRecord = {
  ein: string
  name: string
  city: string
  state: string
  ntee: string
  subsection: number | null
  filings: { year: number | null; revenue: number | null; expenses: number | null; pdf: string | null }[]
  sourceUrl: string
}

export const normalizeEin = (ein: string) => ein.replace(/-/g, "")

export function parseProPublica(json: unknown): IrsRecord {
  const parsed = z.object({ organization: orgSchema, filings_with_data: z.array(filingSchema).default([]) }).parse(json)
  const o = parsed.organization
  const ein = String(o.ein).padStart(9, "0")

  return {
    ein: `${ein.slice(0, 2)}-${ein.slice(2)}`,
    name: o.name ?? "",
    city: o.city ?? "",
    state: o.state ?? "",
    ntee: o.ntee_code ?? "",
    subsection: o.subseccd ?? null,
    filings: parsed.filings_with_data.slice(0, 6).map((f) => ({
      year: f.tax_prd_yr ?? null,
      revenue: f.totrevenue ?? null,
      expenses: f.totfuncexpns ?? null,
      pdf: f.pdf_url ?? null,
    })),
    sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${o.ein}`,
  }
}

export async function lookupEin(ein: string): Promise<IrsRecord | null> {
  const res = await fetch(`${BASE}/organizations/${normalizeEin(ein)}.json`, { signal: AbortSignal.timeout(15000) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ProPublica returned HTTP ${res.status}`)

  return parseProPublica(await res.json())
}

export async function searchOrgs(query: string, state?: string) {
  const u = new URL(`${BASE}/search.json`)
  u.searchParams.set("q", query)
  if (state) u.searchParams.set("state[id]", state)
  const res = await fetch(u, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`ProPublica search returned HTTP ${res.status}`)
  const json = z.object({ organizations: z.array(orgSchema).default([]) }).parse(await res.json())

  return json.organizations.slice(0, 10).map((o) => ({ ein: String(o.ein).padStart(9, "0"), name: o.name ?? "", city: o.city ?? "", state: o.state ?? "" }))
}

/** Names should be compared loosely: the legal name on the IRS record often differs from the brand name. */
export function nameMatches(siteName: string, recordName: string): "match" | "partial" | "mismatch" {
  const norm = (s: string) => s.toLowerCase().replace(/\b(inc|incorporated|the|of|and|foundation|corp|corporation|llc)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim()
  const a = norm(siteName)
  const b = norm(recordName)
  if (a === b) return "match"
  if (a.includes(b) || b.includes(a)) return "partial"
  const wa = new Set(a.split(" "))
  const shared = b.split(" ").filter((w) => wa.has(w)).length

  return shared >= Math.max(1, Math.floor(b.split(" ").length / 2)) ? "partial" : "mismatch"
}
