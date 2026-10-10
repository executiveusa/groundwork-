import { describe, expect, it } from "vitest"

import { parsePage, isSafeUrl } from "../src/crawl.js"
import { applicableChecklist, appliesTo, loadChecklist } from "../src/kb.js"
import { nameMatches, parseProPublica } from "../src/records.js"
import { renderHtml, renderMarkdown, roadmapCsv } from "../src/report.js"
import { CATEGORY_IDS, type FindingsFile, profileSchema } from "../src/schema.js"
import { buildScorecard, sortFindings } from "../src/scoring.js"
import { planQueries } from "../src/search.js"

const profile = profileSchema.parse({ slug: "demo", name: "Demo Youth Works", url: "https://demo.example", tags: ["youth_serving", "collects_forms"], leaders: ["Pat Lee"], state: "WA" })

const grades = (n: number | null) => Object.fromEntries(CATEGORY_IDS.map((c) => [c, { grade: n, rationale: "r" }])) as FindingsFile["grades"]
const file = (n: number | null): FindingsFile => ({
  slug: "demo", generatedAt: "2026-10-10T00:00:00Z", grades: grades(n), findings: [
    { id: "f1", category: "mission", title: "T1", severity: "P2", classification: "INFERENCE", evidenceIds: [], whatWeSaw: "a", whyItMatters: "b", recommendedChange: "c", proofOfCompletion: "d", effort: "S", impact: [], ownerType: "organization", needsHumanReview: false },
    { id: "f2", category: "safeguarding", title: "T2", severity: "P0", classification: "MISSING_INFORMATION", evidenceIds: [], whatWeSaw: "a", whyItMatters: "b", recommendedChange: "c", proofOfCompletion: "d", effort: "M", impact: [], ownerType: "board", needsHumanReview: true },
  ], whatAFunderSees: "x", strengthsToLock: [], questionsForOrganization: [], identityDiscrepancies: [], reviewerNotes: "",
})

describe("knowledge base", () => {
  const items = loadChecklist()
  it("loads and has unique ids across all categories", () => {
    expect(items.length).toBeGreaterThan(90)
    expect(new Set(items.map((i) => i.category)).size).toBe(CATEGORY_IDS.length)
  })
  it("filters by profile tags", () => {
    const yes = applicableChecklist(profile, items).map((i) => i.id)
    expect(yes).toContain("safe.policy-public")
    expect(yes).not.toContain("cred.sponsor-wording")
    expect(yes).not.toContain("fund.fed-registrations")
  })
  it("any/all semantics", () => {
    const it0 = items.find((i) => i.id === "safe.screening")!
    expect(appliesTo(it0, ["volunteers"])).toBe(true)
    expect(appliesTo(it0, [])).toBe(false)
  })
})

describe("scoring", () => {
  it("high grades pass; ungraded is INVESTIGATE", () => {
    const clean = file(9.5)
    clean.findings = clean.findings.filter((f) => f.severity !== "P0")
    expect(buildScorecard(clean).decision).toBe("SHIP")
    expect(buildScorecard(file(9.5)).decision).toBe("HOLD")
    const partial = clean
    delete (partial.grades as Record<string, unknown>).mobile
    expect(buildScorecard(partial).decision).toBe("INVESTIGATE")
  })
  it("low grades rebuild", () => {
    expect(buildScorecard(file(3)).decision).toBe("REBUILD")
  })
  it("sorts by severity then effort", () => {
    expect(sortFindings(file(5).findings)[0]!.id).toBe("f2")
  })
})

describe("crawl parsing and safety", () => {
  it("extracts facts", () => {
    const p = parsePage("https://x.org/", 200, `<html lang="en"><head><title>Hello there world</title><meta name="viewport" content="x"><script type="application/ld+json">{"@type":"NGO"}</script></head><body><h1>A</h1><img src="a.png"><form method="get"><input name="email"></form><a href="https://facebook.com/x">f</a><a href="mailto:a@b.org">m</a></body></html>`)
    expect(p.lang).toBe("en")
    expect(p.imagesMissingAlt).toBe(1)
    expect(p.jsonLdTypes).toEqual(["NGO"])
    expect(p.socials).toHaveLength(1)
    expect(p.mailtos).toEqual(["a@b.org"])
  })
  it("rejects private and non-http URLs", () => {
    for (const u of ["http://localhost/", "http://127.0.0.1/", "http://10.0.0.1/", "file:///etc/passwd", "http://169.254.169.254/"]) expect(isSafeUrl(u)).toBe(false)
    expect(isSafeUrl("https://example.org")).toBe(true)
  })
})

describe("records and search plan", () => {
  it("parses ProPublica shape", () => {
    const r = parseProPublica({ organization: { ein: 123456789, name: "Demo", city: "Seattle", state: "WA", ntee_code: "O50" }, filings_with_data: [{ tax_prd_yr: 2023, totrevenue: 1000 }] })
    expect(r.ein).toBe("12-3456789")
    expect(r.filings[0]!.revenue).toBe(1000)
  })
  it("name matching is loose but not blind", () => {
    expect(nameMatches("Demo Youth Works", "DEMO YOUTH WORKS INC")).toBe("match")
    expect(nameMatches("Demo", "Totally Different Org")).toBe("mismatch")
  })
  it("plans youth and leader queries", () => {
    const ids = planQueries(profile).map((q) => q.id)
    expect(ids).toContain("safeguarding")
    expect(ids).toContain("state-registry")
    expect(ids.some((i) => i.startsWith("leader-"))).toBe(true)
  })
})

describe("report", () => {
  it("renders all three outputs and escapes HTML", () => {
    const f = file(7)
    f.findings[0]!.title = "<script>x</script>"
    expect(renderHtml(profile, f)).not.toContain("<script>x</script>")
    expect(renderMarkdown(profile, f)).toContain("LEGAL/PROFESSIONAL REVIEW REQUIRED")
    expect(roadmapCsv(f).split("\n")).toHaveLength(3)
  })
})
