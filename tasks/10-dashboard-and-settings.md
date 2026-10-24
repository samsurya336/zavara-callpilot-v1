# 10 - View Dashboard and Settings

## User Story

As a participant, I want to see my progress and remaining practice balance, so that I know what to improve and whether I can start another call.

**Owner:** Dev A  
**Needs:** Auth from task 01, saved sessions/reports from tasks 05/07 and usage data from task 11. Profile UI can start independently.  
**BRD:** BR-08, BR-09.

## To Do

- [ ] Show personal completed practices, practice minutes, recent sessions/reports, recent skill scores and modes used. Link the figures/items to relevant Sessions where useful.
- [ ] Show progress only across comparable scoring guides/modes and related original/branch attempts. Label Time Machine changes as simulated practice results, not real sales gains.
- [ ] Make original-call and branch counts clear so retries do not silently inflate the dashboard. Exclude empty/failed attempts from completed-practice totals.
- [ ] Add Settings with profile name, displayed account details, existing basic preferences, signout and consent/help information. Reuse the current auth/profile update path.
- [ ] Show server-reported remaining allowance, usage history/limits and the reason a new session is blocked. Include Time Machine use and refresh values after a call or branch.
- [ ] Use honest empty/insufficient-data states and retryable loading/errors. Challenges remains the default after sign-in; no team tab, organisation fields or mandatory dashboard tour.

## Technical Notes

Use account-scoped server/database aggregates, not totals from only the first page of Sessions. Allowance displays are informational; task 11 is the enforcement. No role controls, billing screens or advanced charting platform is needed. Do not make the editable profile name the source of account ownership.

## Done When

- [ ] Completing an original/branch updates the correctly labelled activity and remaining balance using saved data.
- [ ] A new user sees clean empty states, not fabricated scores or trends, and Settings explains exhausted allowance.
- [ ] Profile/preferences persist after refresh and no account can query another person's metrics or usage.
