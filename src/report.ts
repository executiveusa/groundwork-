import { brand } from "./brand.js"
import type { FindingsFile, Profile } from "./schema.js"
import { buildScorecard, roadmap, sortFindings } from "./scoring.js"

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const fmt = (n: number | null) => (n === null ? "n/a" : n.toFixed(1))

export function renderMarkdown(profile: Profile, f: FindingsFile): string {
  const sc = buildScorecard(f)
  const lines: string[] = [
    `# ${profile.name}: website trust and funding-readiness audit`,
    `_${brand.name}, ${f.generatedAt.slice(0, 10)}_`,
    "",
    `**Decision:** ${sc.decision} · **Score:** ${fmt(sc.overall)}/100 (${sc.band}) · Brand ${fmt(sc.brand)} · Funding ${fmt(sc.funding)} · Operations ${fmt(sc.operations)}`,
    "",
    "## What a funder sees in two minutes",
    f.whatAFunderSees,
    "",
    "## Release gate",
    sc.gate.pass ? "Passed." : sc.gate.reasons.map((r) => `- ${r}`).join("\n"),
    "",
    "## Scores by category",
    "| Category | Grade | Why |",
    "|---|---|---|",
    ...sc.byCategory.map((c) => `| ${c.id} | ${fmt(c.grade)} | ${c.rationale.replace(/\|/g, "/")} |`),
    "",
    "## Findings (most urgent first)",
  ]
  for (const x of sortFindings(f.findings)) {
    lines.push(
      `### ${x.severity} · ${x.title} (${x.effort})`,
      `- **Evidence class:** ${x.classification}${x.needsHumanReview ? " · LEGAL/PROFESSIONAL REVIEW REQUIRED" : ""}`,
      `- **What we saw:** ${x.whatWeSaw}`,
      `- **Why it matters:** ${x.whyItMatters}`,
      `- **Change:** ${x.recommendedChange}`,
      `- **Done when:** ${x.proofOfCompletion}`,
      `- **Owner:** ${x.ownerType}`,
      "",
    )
  }
  if (f.identityDiscrepancies.length) {
    lines.push("## Identity checks", "| Field | Website | Record | Status |", "|---|---|---|---|")
    for (const d of f.identityDiscrepancies) lines.push(`| ${d.field} | ${d.websiteSays} | ${d.recordSays} | ${d.status} |`)
    lines.push("")
  }
  const rm = roadmap(f.findings)
  lines.push("## 30 / 60 / 90 day plan")
  for (const [k, items] of Object.entries(rm)) lines.push(`**${k}:** ${items.length ? items.map((i) => i.title).join("; ") : "nothing scheduled"}`)
  lines.push("", "## Strengths to protect", ...f.strengthsToLock.map((s) => `- ${s}`), "", "## Questions for you", ...f.questionsForOrganization.map((s) => `- ${s}`), "", `---`, `_${brand.reportFooter}_`)

  return lines.join("\n")
}

export function renderHtml(profile: Profile, f: FindingsFile): string {
  const md = renderMarkdown(profile, f)
  const sc = buildScorecard(f)
  const body = sortFindings(f.findings)
    .map(
      (x) => `<article class="f ${x.severity}"><h3><span>${x.severity}</span> ${esc(x.title)} <small>${x.effort}</small></h3>
<p><b>Saw:</b> ${esc(x.whatWeSaw)}</p><p><b>Why:</b> ${esc(x.whyItMatters)}</p><p><b>Change:</b> ${esc(x.recommendedChange)}</p><p><b>Done when:</b> ${esc(x.proofOfCompletion)}</p>
<p class="m">${x.classification}${x.needsHumanReview ? " · legal/professional review required" : ""} · owner: ${x.ownerType}</p></article>`,
    )
    .join("\n")
  const rows = sc.byCategory.map((c) => `<tr><td>${c.id}</td><td>${fmt(c.grade)}</td><td>${esc(c.rationale)}</td></tr>`).join("")

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(profile.name)} audit</title><style>
body{font:16px/1.55 system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px 16px;color:#1b1b18}
h1{font-size:1.7rem}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}
.f{border-left:4px solid #999;padding:4px 14px;margin:14px 0;break-inside:avoid}.P0{border-color:#b3261e}.P1{border-color:#c25e00}.P2{border-color:#8a7a00}
.f span{font-size:.75rem;background:#eee;padding:2px 6px;border-radius:4px}.m{color:#555;font-size:.85rem}.big{font-size:1.2rem}
footer{margin-top:32px;color:#555;font-size:.85rem}@media print{body{max-width:none}}</style></head><body>
<h1>${esc(profile.name)}: website trust and funding-readiness audit</h1>
<p class="big"><b>${sc.decision}</b> · ${fmt(sc.overall)}/100 (${sc.band}) · Brand ${fmt(sc.brand)} · Funding ${fmt(sc.funding)} · Operations ${fmt(sc.operations)}</p>
<h2>What a funder sees in two minutes</h2><p>${esc(f.whatAFunderSees)}</p>
<h2>Release gate</h2><p>${sc.gate.pass ? "Passed." : sc.gate.reasons.map(esc).join("<br>")}</p>
<h2>Scores</h2><table><tr><th>Category</th><th>Grade</th><th>Why</th></tr>${rows}</table>
<h2>Findings</h2>${body}
<h2>Questions for you</h2><ul>${f.questionsForOrganization.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
<footer>${esc(brand.reportFooter)}</footer><!-- ${md.length} chars markdown twin --></body></html>`
}

export function roadmapCsv(f: FindingsFile): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`

  return ["severity,effort,category,title,owner,change,done_when", ...sortFindings(f.findings).map((x) => [x.severity, x.effort, x.category, q(x.title), x.ownerType, q(x.recommendedChange), q(x.proofOfCompletion)].join(","))].join("\n")
}
