# 09 - Review calls and branches in Sessions

## User Story

As a participant, I want to find all my calls and alternate attempts, so that I can review feedback and compare what happened when I answered differently.

**Owner:** Dev D  
**Needs:** Saved calls/reports from tasks 05/07 and branch relationships from task 08. Build the original-call list while Time Machine is in progress.  
**BRD:** BR-07.

## To Do

- [ ] Add Sessions under Practice Mode, latest first, with challenge/source, date, One-on-One/Boardroom, Assist/Battle, duration, status, score and report state.
- [ ] Mark original calls and Time Machine branches clearly. Show the source call and branch point, with links between the original and alternative attempts.
- [ ] Open a protected detail page with transcript, report/status and Time Machine entry points. Offer comparison between related attempts without mixing their transcripts.
- [ ] Represent active, partial, interrupted, failed, processing and completed results honestly. Missing scores are Not Available, not zero or sample values.
- [ ] Restore saved detail links after refresh; show loading/empty/error/retry states and simple pagination if needed.
- [ ] Query only the verified account's records and enforce ownership for lists, deep links, transcript/report reads and comparisons. Clear personal cached results on account change.

## Technical Notes

Use the same session/turn/report tables as the runtime. A branch is a separate session, not an edit to the source. Keep parent/turn labels visible even when several branches exist. Audio playback, a recording library and public result sharing are not required.

## Done When

- [ ] I can return later and open my original calls, branches and the correct report for each.
- [ ] I can trace a branch to its source answer and compare the right attempts without altering either.
- [ ] Another account cannot list or open my records; partial/failed attempts are not shown as successful completed calls.