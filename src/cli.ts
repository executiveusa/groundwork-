import fs from "node:fs"
import path from "node:path"
import { Command } from "commander"

import { type AuditInputs, SYSTEM_PROMPT, analyze, buildUserPrompt } from "./analyze.js"
import { brand } from "./brand.js"
import { crawlSite } from "./crawl.js"
import { applicableChecklist, loadChecklist, loadPresence } from "./kb.js"
import { clientDir } from "./paths.js"
import { checkPresence } from "./presence.js"
import { type IrsRecord, lookupEin, searchOrgs } from "./records.js"
import { renderHtml, renderMarkdown, roadmapCsv } from "./report.js"
import { type Profile, PROFILE_TAGS, findingsFileSchema, profileSchema } from "./schema.js"
import { type SearchResult, firecrawlSearch, planQueries } from "./search.js"
import { technicalChecks } from "./technical.js"

const read = <T>(slug: string, file: string, fallback: T): T => {
  const p = path.join(clientDir(slug), file)

  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as T) : fallback
}
const write = (slug: string, file: string, data: unknown) => {
  fs.mkdirSync(clientDir(slug), { recursive: true })
  fs.writeFileSync(path.join(clientDir(slug), file), typeof data === "string" ? data : JSON.stringify(data, null, 2))
}
const profileOf = (slug: string) => profileSchema.parse(read(slug, "profile.json", null))

function gather(slug: string): AuditInputs {
  const profile = profileOf(slug)
  const crawl = read(slug, "crawl.json", null)
  if (!crawl) throw new Error(`Run "audit scan ${slug}" first.`)

  return {
    profile,
    crawl,
    tech: read(slug, "tech.json", []),
    record: read<IrsRecord | null>(slug, "record.json", null),
    searches: read<SearchResult[]>(slug, "searches.json", []),
    presence: read(slug, "presence.json", []),
    checklist: applicableChecklist(profile),
  }
}

const program = new Command().name("audit").description(`${brand.name}: nonprofit website trust and funding-readiness audit`)

program
  .command("init <slug>")
  .requiredOption("--name <name>")
  .requiredOption("--url <url>")
  .option("--ein <ein>")
  .option("--state <st>")
  .option("--tags <tags>", `comma list: ${PROFILE_TAGS.join(",")}`, "")
  .option("--consent", "the site owner has asked for this audit")
  .action((slug: string, o: { name: string; url: string; ein?: string; state?: string; tags: string; consent?: boolean }) => {
    const profile: Profile = profileSchema.parse({
      slug, name: o.name, url: o.url, ein: o.ein, state: o.state?.toUpperCase(),
      tags: o.tags.split(",").map((t) => t.trim()).filter(Boolean), consentToAudit: Boolean(o.consent),
    })
    write(slug, "profile.json", profile)
    console.log(`Created ${path.join(clientDir(slug), "profile.json")}. Edit it to add leaders, funders and notes.`)
  })

program.command("scan <slug>").option("--max-pages <n>", "", "25").description("crawl, technical checks, IRS record").action(async (slug: string, o: { maxPages: string }) => {
  const profile = profileOf(slug)
  if (!profile.consentToAudit) console.warn("Note: consentToAudit is false. Free scans use public pages only; do not share findings about a named organization.")
  const crawl = await crawlSite(profile.url, Number(o.maxPages))
  write(slug, "crawl.json", crawl)
  write(slug, "tech.json", technicalChecks(crawl))
  if (profile.ein) {
    try {
      write(slug, "record.json", await lookupEin(profile.ein))
    } catch (e) {
      console.warn(`IRS lookup failed: ${(e as Error).message}`)
    }
  }
  const t = technicalChecks(crawl)
  console.log(`Crawled ${crawl.pages.length} pages, ${crawl.errors.length} errors. Technical checks: ${t.filter((x) => x.ok).length} pass, ${t.filter((x) => !x.ok).length} fail.`)
})

program.command("search <slug>").description("run the outside-world query plan (Firecrawl if FIRECRAWL_API_KEY set, else write queries to run by hand)").action(async (slug: string) => {
  const plan = planQueries(profileOf(slug))
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) {
    write(slug, "search-queries.md", plan.map((p) => `- **${p.purpose}**: \`${p.query}\``).join("\n"))
    console.log(`No FIRECRAWL_API_KEY. Run the queries in ${path.join(clientDir(slug), "search-queries.md")} yourself and save hits as searches.json ([{id,query,provider,hits:[{title,url,snippet}]}]).`)

    return
  }
  const out: SearchResult[] = []
  for (const item of plan) out.push(await firecrawlSearch(item, key))
  write(slug, "searches.json", out)
  console.log(`Ran ${out.length} searches.`)
})

program.command("presence <slug>").description("where the org is and is not listed").action((slug: string) => {
  const i = gather(slug)
  const res = checkPresence(loadPresence(), i.crawl, i.searches, i.profile)
  write(slug, "presence.json", res)
  for (const r of res) console.log(`${r.status.padEnd(9)} ${r.entry.name}`)
})

program.command("checklist <slug>").description("list the checklist items that apply to this organization").action((slug: string) => {
  for (const c of applicableChecklist(profileOf(slug))) console.log(`${c.severity} ${c.id.padEnd(34)} ${c.title}`)
})

program.command("prompt <slug>").description("write analysis-prompt.md for use inside Claude Code (no API key)").action((slug: string) => {
  const i = gather(slug)
  write(slug, "analysis-prompt.md", `# System\n${SYSTEM_PROMPT}\n\n# Task\n${buildUserPrompt(i)}\n\nWrite the result as JSON matching findingsFileSchema to ${path.join(clientDir(slug), "findings.json")}.`)
  console.log(`Wrote ${path.join(clientDir(slug), "analysis-prompt.md")}`)
})

program.command("analyze <slug>").description("call the Claude API for the per-organization analysis").action(async (slug: string) => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set. Use "audit prompt" with Claude Code instead.')
  write(slug, "findings.json", await analyze(gather(slug)))
  console.log("Wrote findings.json")
})

program.command("report <slug>").description("render report.html, report.md and roadmap.csv from findings.json").action((slug: string) => {
  const profile = profileOf(slug)
  const f = findingsFileSchema.parse(read(slug, "findings.json", null))
  write(slug, "report.md", renderMarkdown(profile, f))
  write(slug, "report.html", renderHtml(profile, f))
  write(slug, "roadmap.csv", roadmapCsv(f))
  console.log(`Wrote report.html, report.md, roadmap.csv in ${clientDir(slug)}`)
})

program.command("lookup-ein <ein>").action(async (ein: string) => console.log(JSON.stringify(await lookupEin(ein), null, 2)))
program.command("find-org <query>").option("--state <st>").action(async (q: string, o: { state?: string }) => console.log(JSON.stringify(await searchOrgs(q, o.state), null, 2)))

program.command("kb-check").description("validate the knowledge base").action(() => {
  const items = loadChecklist()
  const presence = loadPresence()
  console.log(`checklist: ${items.length} items, presence: ${presence.length} entries. OK`)
})

program.parseAsync().catch((e: Error) => {
  console.error(e.message)
  process.exit(1)
})
