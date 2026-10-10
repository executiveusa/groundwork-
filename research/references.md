# Reference Review: Nonprofit Audit Toolkit

Researched 2026-10-10. All third-party content was read only, never executed, and treated as untrusted data. "Not verified" marks anything I could not open.

## A. Repos and listings

**1. aws-samples/nonprofit-samples** (https://github.com/aws-samples/nonprofit-samples)
- AWS sample code for nonprofits, in four folders: `agentic-ai/` (Bedrock AgentCore, multi-agent), `blogposts/` (includes a tax-exempt status blog), `conference-demos/` and `old-examples/`. License MIT-0. The root README is only an index, and I did not open the subfolders.
- Reusable: the multi-agent layout and the tax-exempt-status blog sample are worth a skim for a 501(c)(3) lookup flow.
- Ignore: all the AWS CloudFormation/Bedrock plumbing. It ties us to AWS and adds nothing to the audit logic.

**2. MCP Market "Federal Grant Finder"** (https://mcpmarket.com/tools/skills/federal-grant-finder)
- A Claude skill that wraps Grants.gov: keyword, status (forecasted/posted/archived), agency and eligibility filters, and a fetch by opportunity number. The page shows 5 GitHub stars and no license. The SKILL.md is on a tab I did not open.
- Reusable: the idea of the filter set only. We should call Grants.gov directly (section D).
- Ignore: the listing page itself. It is marketing copy plus an ad, and it is a thin wrapper.

**3. scrtlabs/Grants** (https://github.com/scrtlabs/Grants)
- A crypto-network (Secret Network) grant-proposal repo. No license shown.
- Reusable: nothing for audits. The one marginal item is the sample application structure (problem/solution word limits, milestones and budget).
- Ignore: all of it. Blunt verdict: irrelevant.

**4. GitHub for Nonprofits getting started** (https://nonprofits.github.com/getting-started)
- A perk eligibility page, not a dataset. It requires 501(c)(3) proof, the registered name, a mission summary, and a nongovernmental, nonacademic, noncommercial, nonpolitical, nonreligious status.
- Reusable: a ready checklist of what "verifiable nonprofit status" evidence looks like. This is useful for a "program eligibility" check and as a model for per-program rules.
- Ignore: the GitHub application flow. No license, since it is a product page.

**5. weecology/ogrants** (https://github.com/weecology/ogrants)
- A Jekyll site listing openly posted *funded grant proposals*, with YAML front matter: title, author, ORCID, year, link, funder, program, discipline, status. A LICENSE.md exists, and I did not open it.
- Reusable: the YAML schema is a clean model for a "winning proposal exemplars" library. Proposals are hosted on Zenodo/Figshare.
- Ignore: the Jekyll and R scaffolding. The content is research-grant focused, so it is weak for community nonprofits.

**6. nayafia/microgrants** (https://github.com/nayafia/microgrants)
- An alphabetical list of about 40 microgrant programs with one-line amounts and eligibility, plus a `templates/` folder for running a program. License CC0 (public domain).
- Reusable: a seed list of small funders, and the "inactive programs" pattern (a stale-listing flag). The README is the dataset.
- Ignore: most entries. They are for individuals, students and startups, not 501(c)(3)s. Many are crypto, tech or youth grants, so filter hard.

**7. deacs11 CrewAI Grant Finder / Eligibility Checker** (https://github.com/deacs11/CrewAI_Grant_Funding_Opportunity_Finder_-_Eligibility_Checker_Crew)
- A Colab notebook with 6 CrewAI tasks: extract project info from a URL, extract org info from a URL, search for grants, extract grant details, match eligibility, compile a report. It uses OpenAI plus Serper. No license shown. 2 stars, last commit April 2025.
- Reusable: the pipeline shape (org URL in, report out) and the strong disclaimer pattern ("preliminary, verify against official documents").
- Ignore: the CrewAI, OpenAI and Serper stack and the Colab form. It is a weak prototype with no schema and no sourcing.

**8. openprose/grant-finder** (https://github.com/openprose/grant-finder) — the most useful of the grant repos
- A Go CLI plus JSON Schemas. Input is an "assignment" (org profile, focus areas, geographies, known grants). Output is a "Research Packet" with ranked candidates, evidence, provenance, deadline certainty, effort estimate and source-lane coverage. Sources are Grants.gov, the Federal Register and agency RSS feeds, with no keys needed. License MIT.
- Reusable (copy ideas, not code):
  - The `schemas/research-assignment.schema.json` and packet shape.
  - The invariant "no LLM inside the data layer; the agent judges".
  - Explicit negative evidence ("no current ARPA-E match") and the "inconclusive refresh is not a negative" rule.
  - The recall-audit fixtures for checking known-plausible opportunities.
- Ignore: the Go build, the OpenProse runtime, the SBIR/deep-tech bias, and the hosted upsell. It is U.S. federal only, and SAM.gov is off by default.

**9. justin-schroeder (profile)** (https://github.com/justin-schroeder)
- A full-stack engineer, creator of FormKit, AutoAnimate, Tempo, ArrowJS and dmux (git-worktree agent multiplexer).
- Relevant, at most: FormKit if we build an intake form; AutoAnimate or Tempo for UI polish; dmux for running parallel coding agents. Nothing relevant to audit data or logic.

**10. standardagents/arrow-js** (https://github.com/standardagents/arrow-js)
- A tiny reactive UI library (`html` tagged templates, `reactive`), with optional SSR, hydration and a QuickJS/WASM sandbox. License MIT. 3.8k stars. It ships an AGENTS.md and an agent skill.
- Reusable: only as an optional front-end for a report viewer. The WASM sandbox idea could isolate LLM-generated snippets.
- Ignore: for the audit engine. We already use Next.js/Strapi, so adding another UI framework is bloat.

**11. anthropics/claude-cookbooks** (https://github.com/anthropics/claude-cookbooks) — only the relevant parts
- Directories I confirmed from the root listing: `tool_use/`, `patterns/agents/`, `capabilities/` (classification, RAG, summarization), `evals/agentic_search/`, `tool_evaluation/`, `claude_agent_sdk/`, `managed_agents/`, `extended_thinking/`, `observability/`, `cost_optimization/`. A LICENSE file exists (believed MIT, not opened).
- Reusable: agent workflow patterns (routing, orchestrator-workers, evaluator-optimizer) for the "reason per org" layer; tool-use schemas for typed findings; classification and eval harnesses for scoring audit accuracy; cost optimization (caching, batching).
- Ignore: finetuning, multimodal, third_party and the coding notebooks. I did not read the structured-outputs notebooks line by line, so check the tool_use folder for the current JSON-schema approach.

**12. prettier/prettier** — a code formatter (believed MIT; page not fetched). Use it only to format our code. Nothing audit-relevant.

## B. Benchmark firms (positioning only; do not copy their copy or visuals)

**Loop: Design for Social Good** (https://weareloop.com/services/)
- Sells: three packages. Nonprofit Logo Design & Branding (logo, strategy and messaging, identity systems, illustration, collateral, social graphics). Nonprofit Website Design (sitemap, landing pages, donation integration, accessibility). Annual Reports & Publications (reports, toolkits, data visualization, accessible PDFs).
- Packaging: each service is a titled block with a one-sentence outcome, a bullet deliverable list, an "Explore our process" link, and two filtered case-study tiles. It uses the "design partnership" and "cause-driven" framing.
- Proof: named client tiles with one-line outcomes (Planned Parenthood Toronto, Starts With Us, Jays Care Foundation, The 519). It states no metrics on the services page.
- Learn: package deliverables as concrete lists, and give accessibility its own line item. Toronto-based; the pledge-of-reconciliation footer signals values-led positioning.

**Constructive** (https://constructive.co/ and https://constructive.co/insight/how-brand-strategy-strengthens-nonprofits/)
- Sells: four lines: Brand Strategy & Branding, Design & Design Systems, Digital Strategy & Web Design, Content Strategy & Development. The headline pitch is a "rare combination of expertise in brand strategy and web design for nonprofits".
- Packaging: strategy comes first, and a process diagram makes the integration visible. Tone is consultative ("strategic partners", "co-creating").
- Proof: five case studies, each a title plus a result line (EDF, CFRNY, American Forests, ELP, FrameWorks). Trust signals come from founder-authored insights, staff quotes linked to articles, and news of launches (RMI). Founded 2000.
- Article takeaway (2016): brand value has three kinds: tangible, intangible and aspirational. Brand strategy is "the through-line of the design process", and the main risk is a strategy that "sits on a shelf". Cites the Brand IDEA book.
- Learn: lead with the diagnosis, tie every fix back to the org's strategy, and publish thinking as proof. A "when to redesign" signals article exists on their site, so the same angle fits our report.

**Hyperakt** (https://www.hyperakt.com/)
- Sells: nonprofit and foundation branding, visual storytelling, data visualization and organizational websites (from the site keywords). Services are not enumerated on the homepage.
- Packaging: a 5-minute "Evaluate Your Brand" score is the primary call to action (https://www.hyperakt.com/brand-score). The positioning line is "courageous branding from the inside out", with a founder identity (immigrant-founded, women-owned).
- Proof: featured work with outcome-style captions (Ford Foundation, NY Community Trust, NYCLU, DonorsChoose), awards (Webby nominee, Transform bronze) and an external quote from Steven Heller.
- Learn: a free self-assessment is a strong lead magnet and maps directly to our audit. Outcome captions beat feature lists. Third-party awards and quotes carry the proof.

**Dalberg Design** (https://www.dalbergdesign.com/approach)
- Sells: human-centered design for development and social-impact work: research, design labs, co-creation, prototyping, sense-making, capacity building, and service and program design. Sector tags cover global health through water and sanitation.
- Packaging: a named method ("iterative, measurable, results driven"), a values diagram (desirable, viable, feasible, sustainable), and downloadable primers as credibility assets. Sold through Dalberg's advisory firm, with 80% of work integrated with other practices.
- Proof: method transparency and primers, not case studies on this page. It also admits the practice is evolving toward community power-sharing.
- Learn: publish the method, and state ethical limits openly. This is a model for explaining *how* our audit reasons, but its scope is global development, so it is a weak match for small U.S. nonprofits.

**The Brand IDEA, Laidler-Kylander and Shepard Stenzel, Wiley/Jossey-Bass, 2013, 240 pp** (Wiley product page: https://www.wiley.com/en-us/shop/general-introductory-business-management/the-brand-idea-managing-nonprofit-brands-with-integrity-democracy-and-affinity-p-9781118555835)
- Framework: Integrity (brand consistent with mission), Democracy (participatory process) and Affinity (partnerships). It rejects the control and competition tenets borrowed from the private sector.
- Use for us: it can seed the brand-health rubric. Score each org on integrity (mission and message match), democracy (who shapes the brand) and affinity (partner and co-branding signals). Chapters 5-7 map to these three. Do not reproduce book text.

**Positioning takeaways across all firms:** concrete deliverable lists; a free diagnostic as the entry point; named clients with a one-line outcome as proof; strategy before visuals; accessibility as an explicit service. Gap we can own: *evidence-linked, per-org audits that cover legal, funding and web together*, which none of them sell as a package.

## C. Reuse decisions

- Adopt: openprose's packet schema ideas (provenance, deadline certainty, negative evidence, coverage rows). Our audit finding should carry source URL, retrieval date, confidence and "not found vs. could not check".
- Adopt: the Brand IDEA triad and Constructive's three value types as brand-section rubric dimensions.
- Adopt: the deacs11 disclaimer pattern and the GitHub-for-Nonprofits evidence checklist for status checks.
- Skip: scrtlabs, aws-samples infrastructure, arrow-js, prettier.

## D. Public data sources we can call from code

Verification method: each page was loaded through Firecrawl on 2026-10-10 (direct curl from this sandbox was blocked by the proxy, so all checks are Firecrawl results). "Loaded" means HTTP 200 and the described content.

| Source | Docs URL | Key? | Notes |
|---|---|---|---|
| Grants.gov REST API | https://www.grants.gov/api/api-guide | No | Loaded. Endpoints `search2` and `fetchOpportunity`. Base `https://api.grants.gov` (staging `https://api.staging.grants.gov`). Federal grant discovery. |
| ProPublica Nonprofit Explorer API v2 | https://projects.propublica.org/nonprofits/api | No (none mentioned) | Loaded. `.../api/v2/search.json` and `.../api/v2/organizations/:ein.json`. Financials, filings, NTEE. Only PDF downloads are rate limited. Check ProPublica's terms for attribution. |
| IRS Tax Exempt Organization Search bulk data | https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads | No | Loaded. Pub 78 (deductible orgs), auto-revocation list and 990-N as pipe-delimited text; Form 990 series as XML. Updated monthly. Core "is it a valid 501(c)(3)" source. |
| IRS 990 e-file data on AWS | https://registry.opendata.aws/irs990/ | No | Loaded, but **discontinued**: updates stopped 2021-12-31. Use only for history. Use the IRS bulk page for current filings. |
| SAM.gov Entity Management API | https://open.gsa.gov/api/entity-api/ | **Yes**, free, from your SAM.gov profile | Loaded. Needed for federal registration and UEI status (grant readiness). The key comes from the account "Public API Key" field. |
| USAspending API | https://api.usaspending.gov/docs/endpoints | No | Loaded. Examples: `/api/v2/recipient/`, `/api/v2/awards/<AWARD_ID>/`, `/api/v2/award_spending/recipient/`. Prior federal awards, a grant-history signal. |
| Candid developer portal (Essentials, Premier, Charity Check, Eligibility, Grants, Taxonomy GraphQL, Open RFP, etc.) | https://developer.candid.org/ | Yes (portal subscription); pricing not stated on the landing page | Loaded. Confirm tiers before budgeting. Richer profile and seal data than IRS files. |
| Google PageSpeed Insights API v5 | https://developers.google.com/speed/docs/insights/v5/get-started | Optional (works without, key raises quota) | Loaded. `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`. Performance, accessibility and SEO Lighthouse scores. |
| Wayback Machine availability API | https://archive.org/help/wayback_api.php | Page does not mention a key | Loaded. `http://archive.org/wayback/available?url=example.com`. Site history and last-updated checks. |
| State charity regulators (NASCO) | https://www.nasconet.org/ | n/a | Home page loads. The `/resources/state-charity-offices/` path **404s**, so find the current directory from the home page. There is no uniform state API; plan per-state registries (e.g., the Secretary of State and Attorney General charity search for each state) and treat them as scrape or manual lookups. Not verified per state. |
| Simpler.Grants.gov API | https://api.simpler.grants.gov/docs | Likely yes | **Not verified** (rate-limited before it loaded). Check before relying on it. |

Not verified and not assumed: OpenCorporates (key and paid tier likely), FEC, Charity Navigator, and RDAP. Exclude them from v1 unless checked.

**Suggested v1 spine:** IRS bulk (status and revocation) -> ProPublica (financials) -> SAM.gov (federal registration, if the org seeks federal funds) -> Grants.gov and USAspending (opportunities and award history) -> PageSpeed and Wayback (web presence) -> Candid (optional, paid enrichment).
