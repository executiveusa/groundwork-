import {
  CATEGORY_IDS,
  type CategoryId,
  type Finding,
  type FindingsFile,
  type Severity,
} from "./schema.js"

// Weights from the Nonprofit Collins gauntlet. The source lists weights summing to 104 while labeling them 100,
// so scores are normalized: total = sum(weight * grade/10) / sum(weights of applicable categories) * 100.
export const WEIGHTS: Record<CategoryId, number> = {
  mission: 7,
  theory_of_change: 5,
  programs: 7,
  evidence_impact: 10,
  credibility: 8,
  funder_readiness: 10,
  transparency_governance: 8,
  legal_disclosure: 6,
  privacy_data: 5,
  safeguarding: 5,
  visual_design: 6,
  ux_ia: 5,
  mobile: 4,
  accessibility: 4,
  technical: 4,
  performance: 2,
  search_footprint: 4,
  partner_readiness: 2,
  conversion: 1,
  ops_maintainability: 1,
}

// The three readiness scores reweight the same grades toward the question each one answers.
const BRAND: Partial<Record<CategoryId, number>> = {
  mission: 3, visual_design: 5, ux_ia: 3, mobile: 3, credibility: 3, search_footprint: 2, conversion: 1, accessibility: 2,
}
const FUNDING: Partial<Record<CategoryId, number>> = {
  evidence_impact: 5, funder_readiness: 5, credibility: 4, transparency_governance: 4, legal_disclosure: 4,
  programs: 3, theory_of_change: 3, mission: 2, safeguarding: 2, privacy_data: 2, partner_readiness: 1,
}
const OPERATIONS: Partial<Record<CategoryId, number>> = {
  technical: 4, privacy_data: 3, safeguarding: 2, ops_maintainability: 3, conversion: 2, performance: 1, accessibility: 2,
}

export type Grades = FindingsFile["grades"]

function weighted(grades: Grades, weights: Partial<Record<CategoryId, number>>): number | null {
  let sum = 0
  let total = 0
  for (const id of CATEGORY_IDS) {
    const w = weights[id]
    const g = grades[id]?.grade
    if (!w || g === null || g === undefined) continue
    sum += w * (g / 10)
    total += w
  }

  return total === 0 ? null : Math.round((sum / total) * 1000) / 10
}

export const bandFor = (score: number) =>
  score >= 95
    ? "EXCEPTIONAL / INSTITUTIONAL-GRADE"
    : score >= 90
      ? "HIGHLY FUNDING-READY"
      : score >= 85
        ? "FUNDING-READY WITH MINOR HARDENING"
        : score >= 80
          ? "CREDIBLE BUT NEEDS IMPROVEMENT"
          : score >= 70
            ? "PARTIALLY READY / MATERIAL TRUST GAPS"
            : score >= 60
              ? "WEAK FUNDING PRESENTATION"
              : "MAJOR REBUILD / TRUST REMEDIATION REQUIRED"

// Minimum bars from the Collins release gate, applied to the 0-10 category grades.
const FLOORS: Array<{ label: string; ids: CategoryId[]; min: number }> = [
  { label: "Visual design >= 8.5", ids: ["visual_design"], min: 8.5 },
  { label: "UX >= 8.5", ids: ["ux_ia"], min: 8.5 },
  { label: "Mobile >= 8.5", ids: ["mobile"], min: 8.5 },
  { label: "Accessibility >= 8.5", ids: ["accessibility"], min: 8.5 },
  { label: "Evidence / impact >= 9", ids: ["evidence_impact"], min: 9 },
  { label: "Funding readiness >= 9", ids: ["funder_readiness"], min: 9 },
]

export type Scorecard = {
  overall: number | null
  band: string
  brand: number | null
  funding: number | null
  operations: number | null
  byCategory: Array<{ id: CategoryId; weight: number; grade: number | null; rationale: string }>
  counts: Record<Severity, number>
  gate: { pass: boolean; reasons: string[] }
  decision: "SHIP" | "HOLD" | "REBUILD" | "INVESTIGATE"
}

export function buildScorecard(file: FindingsFile): Scorecard {
  const overall = weighted(file.grades, WEIGHTS)
  const counts: Record<Severity, number> = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const f of file.findings) counts[f.severity] += 1

  const reasons: string[] = []
  if (counts.P0 > 0) reasons.push(`${counts.P0} release blocker(s) (P0) unresolved`)
  for (const floor of FLOORS) {
    for (const id of floor.ids) {
      const g = file.grades[id]?.grade
      if (g !== null && g !== undefined && g < floor.min) reasons.push(`${floor.label} (graded ${g})`)
    }
  }
  const missing = CATEGORY_IDS.filter((id) => file.grades[id] === undefined)
  if (missing.length > 0) reasons.push(`not graded: ${missing.join(", ")}`)

  const gatePass = reasons.length === 0
  const decision: Scorecard["decision"] =
    missing.length > 0
      ? "INVESTIGATE"
      : overall !== null && overall < 60
        ? "REBUILD"
        : gatePass
          ? "SHIP"
          : "HOLD"

  return {
    overall,
    band: overall === null ? "NOT SCORED" : bandFor(overall),
    brand: weighted(file.grades, BRAND),
    funding: weighted(file.grades, FUNDING),
    operations: weighted(file.grades, OPERATIONS),
    byCategory: CATEGORY_IDS.map((id) => ({
      id,
      weight: WEIGHTS[id],
      grade: file.grades[id]?.grade ?? null,
      rationale: file.grades[id]?.rationale ?? "Not graded.",
    })),
    counts,
    gate: { pass: gatePass, reasons },
    decision,
  }
}

const SEVERITY_ORDER: Record<Severity, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
const EFFORT_ORDER = { XS: 0, S: 1, M: 2, L: 3, XL: 4 } as const

/** Highest severity first; within a severity, cheapest effort first (quick wins). */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort]
  )
}

/** 30/60/90 roadmap: P0 and quick P1 in the first 30 days, remaining P1/P2 by 60, polish by 90. */
export function roadmap(findings: Finding[]) {
  const sorted = sortFindings(findings)
  const d30: Finding[] = []
  const d60: Finding[] = []
  const d90: Finding[] = []
  for (const f of sorted) {
    if (f.severity === "P0" || (f.severity === "P1" && (f.effort === "XS" || f.effort === "S" || f.effort === "M"))) d30.push(f)
    else if (f.severity === "P1" || (f.severity === "P2" && f.effort !== "XL")) d60.push(f)
    else d90.push(f)
  }

  return { d30, d60, d90 }
}
