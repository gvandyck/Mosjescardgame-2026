# Merge plan: ui/card-frame-v1 + ui/rarity-tiers -> main (2026-10-05)

State found: `ui/rarity-tiers` is 84 commits ahead of `main` and 0 behind (card-frame-v1 = first 24, rarity tiers + refinement = last 60). A merge is a clean fast-forward, no conflicts expected. Neither branch exists on origin yet: the work lives only on this machine. Pushing to main triggers .github/workflows/deploy.yml (FTP to eightytwenty.nl/cardgame2026), so merge = deploy.

1. Backup (no deploy): tag main at 4389f7c as `backup-pre-card-redesign-2026-10-05`; push that tag and branch `ui/rarity-tiers` to origin.
2. Verify on the branch: node --check (CLAUDE.md list), npm test, full Playwright suite (`visual` project) + WebKit tiers project; compare failures against main's known 2 smoke.spec.js log-growth failures; touch/mobile check (the hand/field layout rules in arena.css are `hover: hover` desktop-only; the <=900px and touch paths are unverified).
3. Bump `APP_VERSION` in src/version.js.
4. Decide what ships: demo pages in repo root (card-tiers-demo.html, card-sizes-demo.html, design-lab/) would be deployed to the public site; keep or exclude them.
5. Merge: preferably through a PR (review diff, CI), then fast-forward main; main push needs Gandalf's explicit OK (settings: ask).
6. After deploy: curl https://eightytwenty.nl/cardgame2026/src/version.js to confirm the new version; open the live game; play a bot game; check hand/field/deck builder.
7. Rollback: `git revert -m 1` the merge (or push the backup tag's commit) which redeploys the old version.
