---
name: repair-sprint
description: Turn audit findings into shipped fixes on a nonprofit site with proof, in priority order, with approvals for any legal or fundraising wording.
---

# Repair sprint

1. Take `roadmap.csv`. Fix P0, then quick P1. One finding, one commit, one proof.
2. Gate wording: donation, tax-status, employer, safeguarding and privacy text needs written approval from the owner (and sponsor/counsel where applicable) before it goes live. Provide a coming-soon/hide switch for the launch.
3. Proof per fix: re-run `node bin/audit.mjs scan`, show the failing check passing, screenshots at 390px and 1280px, keyboard test, form test with throwaway data (delete it after).
4. Do not invent content: ask for real photos, numbers, quotes and permissions. Mark placeholders clearly.
5. Close with a before/after summary and the monthly-care checklist.
Use `kb/nwk-lessons.md` for the pattern library from the first project.
