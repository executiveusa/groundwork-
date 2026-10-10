---
name: presence-and-records
description: Check where a nonprofit is listed online (Candid, Charity Navigator, ProPublica, Google Business Profile, state registry, socials) and whether names, EIN, address and mission are consistent across them.
---

# Presence and records

1. Pull the IRS record: `node bin/audit.mjs lookup-ein <ein>` (ProPublica, public). Compare legal name, city, state, filing years with the site footer and about page. Differences become `identityDiscrepancies` with a status (match / partial / mismatch / needs-review).
2. Run the query plan (`node bin/audit.mjs search <slug>`). Look at results 1-10 for: wrong-entity confusion, stale listings, complaints, scam reports.
3. Walk `kb/presence-directory.yaml` for the entries that apply to this organization (youth, local, federal grants, bilingual). Mark each: found / not found / needs hand check. Do not mark "not found" from a single failed search.
4. For each missing listing give: why it matters for this organization, the cost, the effort, the common mistake.
5. Public-record material about people is `NEEDS_HUMAN_REVIEW`; keep to professional, public facts that the site itself claims.
