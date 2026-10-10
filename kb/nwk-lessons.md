# What went wrong at New World Kids and what fixed it

The first real project. Each row became checklist items (see `nwkPrecedent` in `checklist.yaml`).

| Problem found | Why it mattered | Fix | Checklist ids |
|---|---|---|---|
| Hero said abstract mission, not who/what/where | Funders skim | Hero states cohort, age range, place; single next step | mission.one-sentence, ux.primary-cta |
| Unverifiable outcome claims and an unconfirmed named endorsement | Credibility and legal risk | Removed until written permission; honest "first cohort" wording | toc.honest-scope, evid.no-fake-proof |
| Fundraising/tax wording not approved by fiscal sponsor | Donor deception risk | Gated behind sponsor written approval; coming-soon switch | cred.sponsor-wording, fund.donate-wording, ops.go-live-switch |
| Privacy page generic | Mismatch with forms and vendors | Rewritten (NTEN structure) to match real data practices | legal.privacy-policy |
| No safeguarding policy for a youth program | Parents and funders require it | Draft policy page labelled for counsel review | safe.policy-public |
| Child-labor bypass in the database | Legal exposure with minors | Closed in live DB and repo; employer wording gated | legal.employment-claims |
| Forms open to abuse, no draft clearing | Spam and privacy | Rate limits, validation, clear-saved-form | priv.spam-abuse, priv.forms-minimal |
| No robots/sitemap/structured data; hidden-mode leaks | Search and accidental indexing | Dynamic robots/sitemap, NonprofitOrganization JSON-LD, hreflang | tech.* |
| Spanish was informal and unreviewed | Trust with Spanish-speaking families | usted register, es-MX review, native review still open | ux.language-access |
| Edge runtime lacked NODE_ENV so the hidden mode failed | Whole site visible by accident | Build-time mode flag | ops.go-live-switch |
| Unconfirmed LinkedIn link | Dead/untrusted profile | Removed until confirmed | seo.social-consistent |
| Mobile overflow unknown | Most visitors on phones | Viewport and device audit scripts, zero findings | mob.no-overflow |

General lessons: gate risky wording, not just code; verify identity across site and records; label drafts honestly; prove each fix with a re-run check.
