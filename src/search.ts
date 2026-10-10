import type { Profile } from "./schema.js"

export type SearchPlanItem = { id: string; purpose: string; query: string }

/**
 * Phase-3 "outside world" query plan. Each query is a Google-style search a human or a search provider can run.
 * Results are evidence about the web footprint, never proof of wrongdoing: the analysis step must classify them.
 */
export function planQueries(p: Profile): SearchPlanItem[] {
  const n = `"${p.name}"`
  const host = new URL(p.url).hostname.replace(/^www\./, "")
  const q: SearchPlanItem[] = [
    { id: "own-site", purpose: "How the search engine presents the site", query: `site:${host}` },
    { id: "brand", purpose: "What shows up for the name alone", query: n },
    { id: "brand-nonprofit", purpose: "Which directories and registries carry the org", query: `${n} nonprofit` },
    { id: "mentions", purpose: "Third-party pages that mention the site", query: `"${host}" -site:${host}` },
    { id: "reviews", purpose: "Reviews, complaints and scam reports", query: `${n} reviews OR complaints OR scam` },
    { id: "news", purpose: "Press and public statements", query: `${n} news` },
    { id: "irs", purpose: "Registry and filing consistency", query: `${n} EIN 990` },
    { id: "charity-navigator", purpose: "Rating-site presence", query: `${n} site:charitynavigator.org OR site:candid.org OR site:guidestar.org` },
    { id: "social", purpose: "Social profile consistency", query: `${n} site:linkedin.com OR site:facebook.com OR site:instagram.com` },
  ]
  if (p.state) q.push({ id: "state-registry", purpose: "State charity registration and secretary-of-state status", query: `${n} ${p.state} charity registration secretary of state` })
  if (p.legalName && p.legalName !== p.name) q.push({ id: "legal-name", purpose: "Legal-name vs brand-name consistency", query: `"${p.legalName}"` })
  for (const l of p.leaders) q.push({ id: `leader-${l.toLowerCase().replace(/\W+/g, "-")}`, purpose: "Leader identity matches site claims (public professional info only)", query: `"${l}" ${n}` })
  if (p.tags.includes("targets_federal_grants")) q.push({ id: "sam", purpose: "SAM.gov / UEI visibility", query: `${n} SAM.gov UEI` })
  if (p.tags.includes("youth_serving")) q.push({ id: "safeguarding", purpose: "Public safeguarding statements", query: `${n} child protection OR safeguarding policy` })

  return q
}

export type SearchHit = { title: string; url: string; snippet: string }
export type SearchResult = { id: string; query: string; hits: SearchHit[]; provider: string }

/** Provider interface. `manual` (a human pastes results) is always available; Firecrawl is optional. */
export async function firecrawlSearch(item: SearchPlanItem, apiKey: string, limit = 8): Promise<SearchResult> {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query: item.query, limit }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`Firecrawl search HTTP ${res.status}`)
  const json = (await res.json()) as { data?: { web?: { title?: string; url?: string; description?: string }[] } }
  const web = json.data?.web ?? []

  return {
    id: item.id,
    query: item.query,
    provider: "firecrawl",
    hits: web.map((w) => ({ title: w.title ?? "", url: w.url ?? "", snippet: (w.description ?? "").slice(0, 300) })),
  }
}
