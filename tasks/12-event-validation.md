# 12 - Test the complete MVP and count real use

## User Story

As the hackathon team, we want to test the complete learning flow and show genuine participant activity, so that the demo proves what works without overstating results.

**Owner:** All four developers; Dev B tracks this checklist.  
**Needs:** Define usage events early, then integrate tasks 01-11. This does not replace each owner's feature checks.  
**BRD:** Section 7 acceptance journeys, sections 8/9 event evidence and section 12 MVP complete.

## To Do

- [ ] Prepare fictional Open Challenges and an approved dummy product file. Confirm the actual deployed auth redirects, HTTPS address, provider secrets and current migrations.
- [ ] Record separate counts for signups, unique authenticated practitioners, starts, completed originals/branches, reports viewed, knowledge uploads, generated challenges and optional feedback. Exclude team/test fixtures; do not equate multiple accounts with proven unique people.
- [ ] Offer an optional short Google Form after the report. Never gate reports behind it or send transcripts/documents into the form; count actual submissions separately from form-link clicks.
- [ ] Test signup/sign-in -> Challenges with no upload -> choose One-on-One/Boardroom -> Assist/Battle -> real voice exchange -> report -> Sessions. Verify the exact menu and no organisation wizard.
- [ ] Test Knowledge Base -> return to Challenges -> General Challenges -> select owned source -> generate/save/reopen both formats -> product-aware Assist and report evidence. Reject foreign/not-ready knowledge IDs.
- [ ] For both challenge sources, formats and modes, test Time Machine at the user's own answer: new response, resumed dialogue, independent report, linked comparison and unchanged original. Check that later original facts do not leak into branches.
- [ ] Test text fallback, mic/network/provider failure, partial report, refresh and report retries. Probe unauthenticated/private-record access and Battle coaching requests directly.
- [ ] Test account quota, two-tab/branch concurrency, generation rate limit, global budget ceiling and emergency stop; confirm the balance and exhaustion messages update correctly.
- [ ] Run `corepack pnpm check` and `corepack pnpm build` from `apps/client-console`, plus relevant updated auth/storage smoke tests. Fix blockers and practise the judge demo on event-like internet.

## Technical Notes

Use saved states/validated events to deduplicate completions and report views; a browser refresh or failed start must not become a completed practice. Team-only aggregate queries/exports are enough for event evidence; no public all-user endpoint or new analytics platform. Confirm organiser rules and targets separately rather than claiming they are verified or achieved.

## Done When

- [ ] A fresh authenticated participant can finish Open Challenge -> report -> Time Machine without help, and can optionally add knowledge to generate tailored challenges.
- [ ] The full source/format/mode test combinations work with correct privacy, branch history and credit protection; failures are explained honestly.
- [ ] The pitch shows real saved results and actual usage/feedback figures, not sample traction, fabricated improvements or unverified outcomes.
