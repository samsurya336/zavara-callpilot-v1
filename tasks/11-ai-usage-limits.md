# 11 - Protect AI credits and show usage

## User Story

As the event team, we want server-enforced practice limits, so that normal participants can use CallPilot without one account or a broken request exhausting our AI credits.

**Owner:** Dev C  
**Needs:** Verified account identity from task 01. Agree the guard interface early; connect every billable action in tasks 04-08 before enabling it.  
**BRD:** BR-10; usage display in BR-09.

## To Do

- [ ] Agree configurable per-account session/voice allowances, max call duration, request rates and event-wide budget. Include one shared emergency switch that blocks new voice sessions.
- [ ] Authenticate and check allowance/global budget on the server before issuing voice access, starting/resuming a call or branch, or running generation/coaching/report work. Return clear safe rejection messages.
- [ ] Permit at most one active call per account, including Time Machine. Use an atomic reservation/lock so parallel clicks, tabs or API requests cannot both pass the same check.
- [ ] Reserve bounded expected usage before billable work and reconcile actual provider consumption where available. Prevent multiple accounts from racing past the event-wide budget.
- [ ] Meter provider use across One-on-One, Boardroom stakeholders, hints, reports, branches, retries, partial calls and failures. Do not count only successfully completed user sessions as provider cost.
- [ ] Release unused reservations and active-call locks on end/failure; recover stale/disconnected sessions with bounded expiry/cancellation without freeing a lock while provider work is still running.
- [ ] Rate-limit account creation/login through managed provider controls where available and billable endpoints server-side. Cap new-account allowances and monitor rapid repeat signups/requests; sign-in alone is not abuse prevention.
- [ ] Expose only the current account's remaining allowance/history for setup and Settings. Keep permanent keys server-side; scope/expire voice authorisation and bound provider work so modified client timers cannot bypass limits.

## Technical Notes

A small usage ledger, active-call reservation and shared event-budget setting are enough; no subscription or payment service. Avoid a non-atomic read-then-update counter. Label costs as estimates when provider billing is unavailable. Choose guard behaviour that still allows bounded finalisation/reporting of already-reserved work without opening unlimited new spend.

## Done When

- [ ] Unauthenticated, over-quota, rate-limited and globally disabled requests cannot start new billable work, including through direct APIs.
- [ ] Two simultaneous original/branch starts for one account result in at most one active call; simultaneous accounts cannot exceed reserved global budget.
- [ ] Failures/retries do not double-charge the ledger or hide real provider use, stale calls recover safely and the UI explains remaining/exhausted allowance.
