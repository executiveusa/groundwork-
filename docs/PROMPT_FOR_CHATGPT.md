You are finishing "Groundwork", a one-person nonprofit website audit-and-repair service plus its landing page, so the owner can sell it.

1. Find the repository: https://github.com/executiveusa/groundwork (if that URL 404s, ask me for the correct one before doing anything; do not create a substitute).
2. Read docs/HANDOFF_FOR_CHATGPT.md first and follow it exactly. It lists what is already built (do not rebuild), the rules you must not break, the known gaps, and your jobs in order.
3. Then read README.md, docs/ARCHITECTURE.md, docs/PRICING.md, landing/DESIGN_LOCK.md and skills/nonprofit-audit/SKILL.md.
4. Run `pnpm install --ignore-workspace && pnpm test && pnpm typecheck && node bin/audit.mjs kb-check`. All must pass before you change anything.
5. Work through the jobs in the handoff in order. Commit small, conventional commits, keep tests and typecheck green, and open a pull request for each job instead of pushing to main.
6. Stop and ask me before: choosing the domain or Netlify site name, putting my legal name or email on any page, turning on search indexing, changing prices, naming any client publicly, or sending anything to a real organization.
7. Finish by reporting what works, what you could not test, and what you need from me. Do not claim anything is verified unless you ran it.
