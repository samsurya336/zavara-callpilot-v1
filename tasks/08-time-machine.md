# 08 - Try a different answer with Time Machine

## User Story

As a participant, I want to choose an answer from a completed call and try again from there, so that I can explore a better approach without repeating the full call.

**Owner:** Dev D  
**Needs:** Saved transcript/settings/state and shared runtime from task 05, reports from task 07 and allowance enforcement from task 11.  
**BRD:** BR-06.

## To Do

- [ ] In a completed call transcript, make the user's own answer turns selectable. Show the earlier context and Try a Different Answer; do not allow a buyer turn or another account's call as the branch point.
- [ ] Create a new saved branch linked to source-session ID and selected user-turn ID. Reuse the source challenge, mode, personas, format, scoring guide and knowledge version where present.
- [ ] Restore only the transcript and buyer state from before that original answer. Exclude the selected old answer and every later original event, hint or summary.
- [ ] Let the user provide a new answer by voice or text fallback, then actively continue the dialogue through the same calling engine. Restore every participating stakeholder for Boardroom.
- [ ] Show a clear Time Machine branch indicator and original-session link. Keep the original transcript, later turns, report and other branches unchanged.
- [ ] End the branch normally, save its own transcript/report and compare original versus new answers/outcomes. Disclose assistance use and label improvement as within-simulation feedback.
- [ ] Allow additional branches subject to the same allowance, active-call lock and budget rules as ordinary calls. Reserve/check usage before resuming; report branch consumption correctly.
- [ ] Handle missing source/state or provider failure without corrupting the original or quietly starting the whole call again.

## Technical Notes

Store stable parent and turn references, settings snapshots and a reconstructable prefix/state. Full-call summaries cannot be reused if they contain future facts. Do not describe this as just audio replay or a generated alternative suggestion: the user must speak/type and continue a new conversation. Mode stays Assist/Battle. Use consistent scoring context for comparison.

## Done When

- [ ] For both challenge sources (Open and Knowledge-based), One-on-One and Boardroom, and Assist/Battle, I can select my earlier answer, give a different one and continue without replaying the beginning.
- [ ] The AI cannot reference facts revealed later in the original call; every original record stays unchanged and each branch has its own report.
- [ ] Repeated branches appear separately, consume allowance and cannot bypass quota/parallel-call guards or access someone else's history.
