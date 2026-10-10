import type { CrawlResult } from "./crawl.js"

export type TechCheck = { id: string; ok: boolean; detail: string; checklistId?: string }

const LEGAL_PATH = /privacy|terms|cookie|accessib|safeguard|donor|refund|disclaim/i

/** Deterministic checks that need no judgement. Generalized from the NWK check-seo.mjs lessons. */
export function technicalChecks(c: CrawlResult, headers?: Headers): TechCheck[] {
  const out: TechCheck[] = []
  const home = c.pages[0]
  const add = (id: string, ok: boolean, detail: string, checklistId?: string) => out.push({ id, ok, detail, checklistId })

  add("https", c.origin.startsWith("https://"), c.origin, "tech.https")
  add("robots.txt", c.robotsTxt !== null, c.robotsTxt ? "present" : "missing", "tech.robots-sitemap")
  add("sitemap.xml", c.sitemapUrls.length > 0, `${c.sitemapUrls.length} URLs`, "tech.robots-sitemap")
  if (c.robotsTxt && /Disallow:\s*\/\s*$/m.test(c.robotsTxt)) add("robots-blocks-all", false, "robots.txt disallows everything", "tech.robots-sitemap")
  if (!home) return out

  for (const p of c.pages) {
    const where = new URL(p.url).pathname || "/"
    add(`title:${where}`, p.title.length >= 10 && p.title.length <= 70, `"${p.title}" (${p.title.length})`, "tech.titles-descriptions")
    add(`description:${where}`, p.description.length >= 50 && p.description.length <= 170, `${p.description.length} chars`, "tech.titles-descriptions")
    add(`h1:${where}`, p.h1.length === 1, `${p.h1.length} h1`, "tech.heading-structure")
    add(`viewport:${where}`, p.viewport, p.viewport ? "present" : "missing", "mob.viewport")
    add(`alt:${where}`, p.imagesMissingAlt === 0, `${p.imagesMissingAlt}/${p.imagesTotal} images lack alt`, "a11y.image-alt")
    add(`canonical:${where}`, p.canonical !== "", p.canonical || "missing", "tech.canonical")
    add(`lang:${where}`, p.lang !== "", p.lang || "missing", "a11y.lang")
    if (p.noindex) add(`noindex:${where}`, false, "page is noindex", "tech.robots-sitemap")
    if (p.status >= 400) add(`status:${where}`, false, `HTTP ${p.status}`, "tech.broken-links")
  }
  add("structured-data", home.jsonLdTypes.length > 0, home.jsonLdTypes.join(", ") || "no JSON-LD", "tech.structured-data")
  add("org-schema", home.jsonLdTypes.some((t) => /Organization|NGO|NonprofitOrganization/.test(t)), "Organization schema on home", "tech.structured-data")
  add("social-preview", Boolean(home.og["og:title"] && home.og["og:image"]), "Open Graph title+image", "tech.social-preview")

  const allLinks = c.pages.flatMap((p) => p.links)
  const legal = [...new Set(allLinks.filter((l) => LEGAL_PATH.test(l.href) || LEGAL_PATH.test(l.text)).map((l) => l.text || l.href))]
  add("legal-links-found", legal.length > 0, legal.slice(0, 8).join(" | ") || "no privacy/terms/accessibility links found", "legal.privacy-policy")
  add("privacy-link", allLinks.some((l) => /privacy/i.test(l.href + l.text)), "link containing 'privacy'", "legal.privacy-policy")
  add("donate-link", allLinks.some((l) => /donate|give|support/i.test(l.href + l.text)), "donate/give link", "fund.donate-path")
  add("contact-path", c.pages.some((p) => p.mailtos.length > 0 || p.tels.length > 0 || p.forms.length > 0), "email, phone or form", "cred.contact-reachable")
  for (const p of c.pages) {
    for (const f of p.forms) {
      if (f.method === "get" && f.fields.some((n) => /email|name|phone/i.test(n)))
        add(`form-get:${p.url}`, false, "form collecting personal data submits with GET", "privacy.forms")
      if (!f.hasConsentText && f.fields.some((n) => /email|phone/i.test(n)))
        add(`form-consent:${p.url}`, false, "form collects email/phone with no privacy or consent text nearby", "privacy.forms")
    }
  }
  const brokenOrError = c.errors.length
  add("crawl-errors", brokenOrError === 0, `${brokenOrError} fetch errors`, "tech.broken-links")
  if (headers) {
    for (const h of ["strict-transport-security", "x-content-type-options", "content-security-policy"])
      add(`header:${h}`, headers.has(h), headers.has(h) ? "present" : "missing", "tech.security-headers")
  }

  return out
}
