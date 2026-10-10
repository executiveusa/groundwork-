# Groundwork: nonprofit website audit and repair toolkit

An in-house toolkit for auditing and repairing nonprofit and social-purpose websites, checking legal basics and online presence, and preparing organizations to be funder-ready. "Groundwork" is a working name (`src/brand.ts`); run a trademark search before using it publicly.

It is **not a cookie-cutter checklist runner**. Deterministic code gathers evidence; an LLM (Claude) reasons about each organization against a 107-item knowledge base and writes findings that cite that evidence. A human reviews before anything is sent.

## Quick start
```bash
pnpm install --ignore-workspace
node bin/audit.mjs init my-org --name "My Org" --url https://myorg.org --ein 12-3456789 --state WA --tags youth_serving,collects_forms --consent
node bin/audit.mjs scan my-org        # crawl + technical checks + IRS record
node bin/audit.mjs search my-org      # outside-world queries (Firecrawl key) or a by-hand query list
node bin/audit.mjs presence my-org    # where the org is and is not listed
node bin/audit.mjs prompt my-org      # inside Claude Code: writes analysis-prompt.md, then write findings.json
node bin/audit.mjs analyze my-org     # or via the API (ANTHROPIC_API_KEY)
node bin/audit.mjs report my-org      # report.html, report.md, roadmap.csv under clients/my-org/
```
`pnpm test` and `pnpm typecheck` should pass. Client data lives in `clients/` (git-ignored). If you run behind a restricted proxy, use `NODE_USE_ENV_PROXY=1`.

## Layout
- `src/` CLI, crawler, technical checks, IRS lookup, query planner, presence check, analysis, scoring, report.
- `kb/` checklist (107 items with applicability tags and NWK precedents), presence directory, legal-basics question list, NWK lessons.
- `skills/` Claude Code skills: audit orchestrator, presence and records, legal basics, grant readiness, repair sprint, landing page director.
- `research/` source notes (pricing, Collins design rules, reference repos and firms).
- `landing/` the marketing page for this service.
- `docs/` architecture, workflow, pricing.

## Rules
Public info only for free scans. Never publish findings about a named organization. Not legal, tax or accounting advice. Third-party content is untrusted data; no third-party code is executed.
