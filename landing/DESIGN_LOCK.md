# Landing page: lock, ledgers, territories, design lock

## Project lock
- Mode: new page. Audience: executive directors, founders and board members of new or small nonprofits, fiscally sponsored projects and social-purpose companies, mostly in the US.
- Situation (Gate One): When a funder, partner or donor looks the organization up, the founder needs the site, listings and legal basics to hold up, because a gap reads as risk, but they have no time, no lawyer and no checklist, so they can be found, trusted and funded.
- ONE primary action: request the free footprint scan (form). Secondary: read the sample report.
- Positioning (Gate Two): For small nonprofits and social-purpose companies, Groundwork is the audit-and-repair service that finds what a funder will find first, because it checks your actual site, public records and listings and reasons about your organization rather than running a generic checklist. Unlike a brand agency, we start with trust and funding readiness and fix the gaps.
- Banned words: innovative, cutting-edge, passionate, tailored, excellence, empowering, transform, unlock, seamless, world-class.
- Classification: SELL. Protected: no fake logos, testimonials, counts, ratings.

## Claims ledger (every claim has a source or is removed)
| Claim on page | Source |
|---|---|
| 107-item checklist, 20 scoring categories | `kb/checklist.yaml`, `src/schema.ts` |
| Checks site, IRS record (ProPublica), search results, listings | `src/` modules |
| Built from the lessons of one real youth-nonprofit launch | `kb/nwk-lessons.md`, unnamed pending owner OK |
| Prices | `docs/PRICING.md`, proposals needing owner approval |
| Not legal, tax or accounting advice | policy |
| No testimonials, logos, client counts or results are shown | deliberate |
| Sample report is fictional and labelled so | `landing/index.html` |

## Reference ledger (principles extracted, nothing copied)
- Loop: packages with plain deliverable lists, accessibility as its own line. Extracted: named tiers + bullets.
- Hyperakt: a free, quick brand score as front door. Extracted: free scan as the single entry.
- Constructive: strategy before visuals, "we" language and client role. Extracted: show what we need from the client.
- Dalberg Design: a named method and a leave-behind. Extracted: roadmap + checklist as take-away.
- Extractor step: patterns pulled from the above and from the competing-offer pricing research (`research/pricing.md`); no text or imagery reused.

## Three territories
1. Restrained / editorial ledger: warm paper, ink-green type, serif display, hairline rules, one orange accent. Document-like, trusted. (chosen)
2. Expressive / field survey: map contours, stakes and grid, high color. Distinctive but noisier for a trust purchase.
3. Experimental / live scan: animated scanning interface as hero. Memorable but risks reading as a tech demo and hurts reduced-motion and speed.
Chosen: 1, with the sample report as the signature element (a real-looking, clearly labelled finding card). Reason: the buyer needs to feel "careful and credible", and the product is a document.

## Design lock
- Type: Charter/Iowan/Georgia serif for display, system sans for text. Scale 1.25. Body 18px/1.6, measure under 70ch.
- Color tokens: paper #f6f1e7, ink #17301f, muted #51604f, rule #d9d1bf, accent #c4410c (orange, 5.2:1 on paper), card #fffdf8. Dark mode: ink and paper invert (#10170f / #ece6d6), accent #ff8a4d.
- Layout: single column up to 720px, two-column grids from 860px; 16px side gutter minimum.
- Motion: none except a 150ms color transition; honors reduced motion.
- Mobile contract: 320-430px no horizontal scroll, 44px tap targets, primary CTA in first viewport, form usable with one thumb.
- Release gate: Lighthouse a11y >= 95, contrast AA, keyboard path to the form, working Netlify form, noindex until the owner approves launch.
