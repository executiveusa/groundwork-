import * as cheerio from "cheerio"

export type PageFacts = {
  url: string
  status: number
  title: string
  description: string
  canonical: string
  lang: string
  viewport: boolean
  h1: string[]
  headings: number
  imagesTotal: number
  imagesMissingAlt: number
  forms: { action: string; method: string; fields: string[]; hasConsentText: boolean }[]
  jsonLdTypes: string[]
  og: Record<string, string>
  hreflang: string[]
  links: { href: string; text: string }[]
  mailtos: string[]
  tels: string[]
  socials: string[]
  words: number
  text: string
  noindex: boolean
}

export type CrawlResult = {
  origin: string
  fetchedAt: string
  robotsTxt: string | null
  sitemapUrls: string[]
  pages: PageFacts[]
  errors: string[]
}

const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "tiktok.com",
  "threads.net",
  "bsky.app",
  "github.com",
]

// A public-site auditor must never be pointed at the machine it runs on or at a private network.
export function isSafeUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false
  if (process.env.AUDIT_ALLOW_LOCAL === "1") return true // tests only: fixture servers on localhost
  const h = u.hostname.toLowerCase()
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false
  if (h === "::1" || h.startsWith("[")) return false

  return true
}

async function get(url: string, timeoutMs = 15000): Promise<{ status: number; body: string; headers: Headers }> {
  if (!isSafeUrl(url)) throw new Error(`Refusing unsafe URL: ${url}`)
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "GroundworkAuditBot/0.1 (+public-site review requested by the site owner)" },
  })
  const body = (await res.text()).slice(0, 2_000_000)

  return { status: res.status, body, headers: res.headers }
}

export function parsePage(url: string, status: number, html: string): PageFacts {
  const $ = cheerio.load(html)
  const abs = (href: string) => {
    try {
      return new URL(href, url).toString()
    } catch {
      return ""
    }
  }
  $("script,style,noscript,svg").not('script[type="application/ld+json"]').remove()
  const jsonLdTypes: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text()) as unknown
      const walk = (n: unknown) => {
        if (Array.isArray(n)) n.forEach(walk)
        else if (n && typeof n === "object") {
          const t = (n as Record<string, unknown>)["@type"]
          if (typeof t === "string") jsonLdTypes.push(t)
          else if (Array.isArray(t)) jsonLdTypes.push(...t.map(String))
          const g = (n as Record<string, unknown>)["@graph"]
          if (g) walk(g)
        }
      }
      walk(data)
    } catch {
      /* invalid JSON-LD is itself a finding, surfaced by the type list being empty */
    }
  })
  $('script[type="application/ld+json"]').remove()

  const links = $("a[href]")
    .map((_, el) => ({ href: abs($(el).attr("href") ?? ""), text: $(el).text().replace(/\s+/g, " ").trim().slice(0, 80) }))
    .get()
    .filter((l) => l.href)
  const og: Record<string, string> = {}
  $('meta[property^="og:"],meta[name^="twitter:"]').each((_, el) => {
    og[$(el).attr("property") ?? $(el).attr("name") ?? ""] = $(el).attr("content") ?? ""
  })
  const text = $("body").text().replace(/\s+/g, " ").trim()
  const robotsMeta = ($('meta[name="robots"]').attr("content") ?? "").toLowerCase()

  return {
    url,
    status,
    title: $("title").first().text().trim(),
    description: $('meta[name="description"]').attr("content")?.trim() ?? "",
    canonical: $('link[rel="canonical"]').attr("href") ?? "",
    lang: $("html").attr("lang") ?? "",
    viewport: $('meta[name="viewport"]').length > 0,
    h1: $("h1")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get(),
    headings: $("h1,h2,h3,h4,h5,h6").length,
    imagesTotal: $("img").length,
    imagesMissingAlt: $("img").filter((_, el) => $(el).attr("alt") === undefined).length,
    forms: $("form")
      .map((_, el) => {
        const f = $(el)

        return {
          action: f.attr("action") ?? "",
          method: (f.attr("method") ?? "get").toLowerCase(),
          fields: f
            .find("input,select,textarea")
            .map((__, i) => $(i).attr("name") ?? $(i).attr("type") ?? "")
            .get()
            .filter(Boolean),
          hasConsentText: /privacy|consent|agree|unsubscribe|terms/i.test(f.text()),
        }
      })
      .get(),
    jsonLdTypes,
    og,
    hreflang: $('link[rel="alternate"][hreflang]')
      .map((_, el) => $(el).attr("hreflang") ?? "")
      .get(),
    links,
    mailtos: links.filter((l) => l.href.startsWith("mailto:")).map((l) => l.href.slice(7)),
    tels: links.filter((l) => l.href.startsWith("tel:")).map((l) => l.href.slice(4)),
    socials: [
      ...new Set(
        links
          .filter((l) => SOCIAL_HOSTS.some((h) => new URL(l.href).hostname.replace(/^www\./, "").endsWith(h)))
          .map((l) => l.href),
      ),
    ],
    words: text.split(" ").filter(Boolean).length,
    text: text.slice(0, 6000),
    noindex: robotsMeta.includes("noindex"),
  }
}

/** Pages worth reading first for a nonprofit: legal, about, programs, give, contact. */
const PRIORITY = /about|mission|program|impact|give|donate|support|contact|privacy|terms|financ|990|board|team|governance|safeguard|policy|volunteer|partner|transparen/i

export async function crawlSite(startUrl: string, maxPages = 25): Promise<CrawlResult> {
  const origin = new URL(startUrl).origin
  const result: CrawlResult = { origin, fetchedAt: new Date().toISOString(), robotsTxt: null, sitemapUrls: [], pages: [], errors: [] }
  try {
    const r = await get(`${origin}/robots.txt`)
    if (r.status === 200) result.robotsTxt = r.body.slice(0, 5000)
  } catch (e) {
    result.errors.push(`robots.txt: ${(e as Error).message}`)
  }
  try {
    const s = await get(`${origin}/sitemap.xml`)
    if (s.status === 200) result.sitemapUrls = [...s.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "").slice(0, 200)
  } catch (e) {
    result.errors.push(`sitemap.xml: ${(e as Error).message}`)
  }

  const queue: string[] = [startUrl, ...result.sitemapUrls.filter((u) => PRIORITY.test(u))]
  const seen = new Set<string>()
  while (queue.length > 0 && result.pages.length < maxPages) {
    const url = queue.shift()!.split("#")[0]!
    if (seen.has(url) || !url.startsWith(origin)) continue
    seen.add(url)
    try {
      const res = await get(url)
      if (!res.headers.get("content-type")?.includes("html")) continue
      const page = parsePage(url, res.status, res.body)
      result.pages.push(page)
      const next = page.links.map((l) => l.href.split("#")[0]!).filter((h) => h.startsWith(origin) && !seen.has(h))
      queue.push(...next.filter((h) => PRIORITY.test(h)), ...next.filter((h) => !PRIORITY.test(h)))
    } catch (e) {
      result.errors.push(`${url}: ${(e as Error).message}`)
    }
  }

  return result
}
