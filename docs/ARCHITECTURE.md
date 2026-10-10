# Architecture

Evidence layer (deterministic, no LLM): `crawl.ts` (same-origin, SSRF-guarded, max pages), `technical.ts` (title/description/h1/alt/viewport/canonical/JSON-LD/forms/legal links), `records.ts` (ProPublica Nonprofit Explorer), `search.ts` (query planner + optional Firecrawl), `presence.ts` (found / not_found / unknown, never accuses on weak evidence).

Reasoning layer: `analyze.ts` builds a prompt from profile + evidence + the applicable checklist (`appliesWhen` tags) and asks Claude for a `findings` JSON validated by zod (`schema.ts`). Two routes: the API (`claude-opus-5-5`, streaming, structured output) or Claude Code (`prompt` writes the brief, you write `findings.json`). Evidence classification and "needs human review" flags are mandatory.

Scoring: `scoring.ts` normalizes the 20 category weights from the Collins nonprofit audit. The source weights add up to **104**, not 100, so scores are `sum(weight*grade)/sum(weight of graded categories)`. Not-applicable categories (grade null) are excluded. Release gates: visual, UX, mobile and accessibility must be at least 8.5; evidence and funding readiness at least 9; any P0 blocks. Decision: SHIP / HOLD / REBUILD (<60) / INVESTIGATE (a category ungraded).

Report: `report.ts` renders HTML (print CSS), Markdown, CSV roadmap (30/60/90 days).

Not covered in code: browser-based visual checks (use the skills and chrome tooling), Lighthouse (run separately), live state registries (no uniform API, checked by hand). The live Claude API path has not been exercised without a key.
