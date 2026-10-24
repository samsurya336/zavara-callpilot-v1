# Airtribe MVP Tasks

**Main flow:** Sign up/sign in -> Challenges -> choose Open or Knowledge-based Challenge -> Assist/Battle call -> report -> Time Machine -> branch report and comparison.

These tasks replace the old backlog and follow the latest [business context](../ABOUT-PROJECT.business.md), [BRD](../docs/zavara-callpilot-v0-brd.md) and your latest instructions. There is **no guest mode**. Product uploads are optional, but every practice feature requires sign-in.

## App Menu

```text
Dashboard
Practice Mode
	Challenges
	Sessions
Knowledge Base
Settings
```

Send users directly to **Challenges** after signup/sign-in, unless they are returning to an allowed deep link. Do not add an organisation wizard, role selection or mandatory upload step.

## Task List

Create one GitHub issue per task file. Use its heading as the issue title and copy the checkboxes into the body. `Todo`, `In Progress` and `Done`, with one assignee, are enough. All tasks below belong to this MVP; the order helps integration, not removal of features.

| No. | Task                                                               | Suggested owner                |
| --- | ------------------------------------------------------------------ | ------------------------------ |
| 01  | [Sign in and open the correct menu](01-auth-navigation.md)         | Dev A                          |
| 02  | [Choose an Open Challenge](02-open-challenges.md)                  | Dev B                          |
| 03  | [Upload personal product knowledge](03-knowledge-base.md)          | Dev A                          |
| 04  | [Generate Knowledge-based Challenges](04-generate-challenges.md)   | Dev B                          |
| 05  | [Complete a One-on-One or Boardroom call](05-practice-calls.md)    | Dev C                          |
| 06  | [Use Assist or Battle](06-call-modes.md)                           | Dev B                          |
| 07  | [Read the post-call report](07-post-call-reports.md)               | Dev D                          |
| 08  | [Try a different answer with Time Machine](08-time-machine.md)     | Dev D                          |
| 09  | [Review calls and branches in Sessions](09-sessions.md)            | Dev D                          |
| 10  | [View Dashboard and Settings](10-dashboard-and-settings.md)        | Dev A                          |
| 11  | [Protect AI credits and show usage](11-ai-usage-limits.md)         | Dev C                          |
| 12  | [Test the complete MVP and count real use](12-event-validation.md) | All four; Dev B tracks results |

**Button wording:** Your latest request names the generation button **General Challenges**; the product docs say **Generate Challenges**. These tasks use **General Challenges** as requested. It generates challenges from selected knowledge, not a third challenge category. Keep the categories **Open Challenges** and **Knowledge-based Challenges**.

## Four-Developer Plan

- **Dev A:** Adapt existing auth/menu, build personal knowledge upload, then Dashboard/Settings.
- **Dev B:** Prepare Open Challenges, add knowledge-based generation and private Assist/Battle controls. Track the final checklist with everyone.
- **Dev C:** Build the shared One-on-One/Boardroom engine together with usage guards. Help Dev D connect Time Machine to the same engine.
- **Dev D:** Build reports and Sessions using the agreed transcript format, then add Time Machine and comparison.

Spend the first few minutes agreeing session fields, voice provider, scoring guide and allowance settings. Connect sign-in -> Open Challenge -> call -> report early. Then connect knowledge generation and Time Machine. Keep time within the five-hour event for integration, real users and the pitch; this is a work split, not a promise that every task takes equal time.

## Keep It Simple

- Reuse existing auth, UI, Supabase client and feature repositories. Remove the current mandatory organisation setup redirect from the event flow; do not rebuild the app or introduce roles.
- Save private records against the signed-in account. The current [Supabase setup](../supabase/README.md) has broad demo access; replace conflicting policies for personal uploads/sessions. A hidden menu or frontend filter is not access control.
- Agree a small data format before parallel work: challenge ID/source, optional knowledge ID/version, session owner, format, mode, participants, goal, status, duration and assistance use. Each transcript turn needs ID, speaker, order and time. Each branch needs source-session ID and selected user-turn ID.
- Use one calling engine for both challenge sources, both formats and Time Machine. Keep saved challenge/persona/knowledge settings so reports and branches use the original context.
- A Time Machine branch is a new saved attempt that continues from an earlier answer, not a new call from the beginning. It gets its own report and consumes allowance. Keep the original unchanged.
- Separate seller knowledge and coach hints from buyer context. Buyers learn confidential product facts only when the user says them, not by silently reading the file.
- Keep all long-lived AI/voice keys on the server. Browser voice access may use scoped short-lived tokens if supported; never ship a provider secret. Authenticate and meter every billable action.
- No guest migration, Clients menu, Deals, cross-call memory, sharing feature, recording library, live copilot, integrations, payments or coming-soon pages are needed.

## Done Means

- [ ] The screen, backend and saved data work together, including refresh where relevant.
- [ ] The task's Done When checks pass, including a failure case and relevant account/usage checks.
- [ ] Another developer can try the feature without manual fixes or fake AI results.

From `apps/client-console`, run `corepack pnpm supabase:migrate` and `corepack pnpm supabase:types` after schema changes; run `corepack pnpm check` and `corepack pnpm build` before the demo. Update affected access/auth smoke tests, which currently expect broad demo access. Do not reset shared data.

Confirm the actual provider, account allowance, event budget and upload limits before implementing the affected checks. Keep those values configurable and visible where needed; do not invent paid plans or claim organiser rules are verified.
