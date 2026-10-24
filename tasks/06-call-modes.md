# 06 - Use Assist or Battle

## User Story

As a participant, I want to choose guided or independent practice, so that I can learn with private help or test myself without hints.

**Owner:** Dev B  
**Needs:** Session/transcript access from task 05; source retrieval from task 03 for knowledge-based coaching.  
**BRD:** BR-04.

## To Do

- [ ] Save exactly one mode per session, Assist or Battle, and show it in setup and during the call for both sources/formats.
- [ ] In Assist, add Ask Coach with short on-demand suggested questions/answers, plus loading, failure and retry states.
- [ ] For Open Challenges, use preset context and general sales guidance. For Knowledge-based Challenges, use the linked source for supported product-specific answers and references where available.
- [ ] Keep requests/hints private and separate from the buyer conversation. Do not speak the hint to buyers or put it in their next prompt; they learn it only if the user says it.
- [ ] For Battle, hide Ask Coach and reject direct coaching requests server-side using the persisted mode. Reject another account's session and requests after the call ends.
- [ ] Record assistance events/usage for the report and Time Machine comparison. Apply AI rate/budget checks and account for provider use through task 11.

## Technical Notes

Use a small authorised coaching handler, not a separate call engine. Missing product evidence is unverified, not a reason to invent an answer. Keep coach text out of buyer-state snapshots and ordinary transcript turns. Time Machine is not a third mode; a branch restores its source mode.

## Done When

- [ ] Assist works privately for Open and Knowledge-based One-on-One/Boardroom calls with the appropriate source context.
- [ ] Battle rejects hints even if the browser mode field is changed or the API is called directly.
- [ ] Reports know whether help was actually used; failed coach requests do not stop the customer call or bypass limits.
