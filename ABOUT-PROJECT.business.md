# zavara-callpilot — Project Business Context

> **Read first — developers and AI coding agents.** This document is the source of truth for the **Airtribe AI Builder's Day MVP (24 October 2026)**. It describes **what the product is, why it exists, and how it must behave**. It is not an API specification, database schema, or architecture guide.
>
> **Scope rule:** The final MVP decisions in this document override older plans for guest access, organisations, Clients, Practice World, Simulated Deals, Realtime, and Integrations. Do not implement deferred features unless expressly requested.

## 1. Identity and purpose

- **Repository:** `zavara-callpilot`
- **Product:** Zavara CallPilot
- **Category:** AI-powered sales practice and coaching
- **Event objective:** Enable real participants to sign up, complete a believable AI voice-based sales challenge, see a useful report, and replay a chosen answer via **Time Machine**.
- **Future customer segment:** Individuals and small B2B SaaS / IT-services sales teams; business buyers may later include sales managers and company founders.
- **Promise:** _Practise a sales conversation, understand where it went wrong, and explore what happens when you answer differently._

### Product principles

1. **Authentication before AI usage:** No guest mode or anonymous practice sessions. Public landing/product pages are fine; challenges, uploads, voice calls, reports and dashboards require an account.
2. **Fast first value:** After signup, take the user **straight to Challenges**, not an organisation or product-setup wizard.
3. **Knowledge is optional:** Every user can practise immediately using **Open Challenges**. Adding product knowledge unlocks product-specific practice, not basic functionality.
4. **Two and only two call modes:** `Assist` and `Battle`. **Time Machine is a post-call capability**, not a third mode.
5. **Realistic customers:** AI buyers respond to what users say; Boardroom participants have distinct roles and may challenge one another.
6. **Meaningful feedback:** Reports explain mistakes using the actual transcript; claims about the seller's product must be checked against available knowledge.
7. **Original history is immutable:** A Time Machine run is a **new branch** from an earlier answer point. It must never rewrite the original call.
8. **Protect limited voice credits:** All AI usage is metered and protected server-side.
9. **No fabricated outcomes:** Scores and buying decisions are simulated training results, not real customer intent or proven revenue impact.

## 2. MVP navigation

```text
Zavara CallPilot
├── Dashboard
├── Practice Mode
│   ├── Challenges
│   └── Sessions
├── Knowledge Base
└── Settings
```

- **Default route after first signup and subsequent sign-in:** `Practice Mode > Challenges` (unless returning to a deep link the user is permitted to access).
- **Dashboard:** Individual practice activity and trends; no organisation/team views.
- **Challenges:** Open Challenges and Knowledge-based Challenges; challenge selection, creation and start.
- **Sessions:** Original calls, reports, transcripts, Time Machine branches and comparisons.
- **Knowledge Base:** Optional personal product knowledge.
- **Settings:** Account/profile, preferences and remaining practice allowance.

**Not in this MVP:** organisation creation, `SUPER_ADMIN` or `USER` roles, invitations, team reporting, a Clients menu, AI client directory, Simulated Deals/cross-call memory, live real-customer copilot, integrations/plugins, subscriptions or checkout.

## 3. Authentication and starting experience

- All application features require sign-in; use a fast signup/sign-in journey (e.g. Google OAuth).
- Do **not** require organisation setup, company name, sales role or knowledge upload to begin.
- On first sign-in, navigate to **Challenges**, with a visible **Start Open Challenge** action.
- Before opening the microphone, display a clear notice for audio processing and obtain appropriate consent.
- Each account has a defined voice/session allowance; display remaining usage and a clear explanation when a limit is reached.

**The absence of guest mode is a deliberate credit-protection decision.** Do not recreate unauthenticated challenge routes as a shortcut.

## 4. Challenges — two sources, same practice engine

### 4.1 Open Challenges

Ready-made scenarios for all authenticated users, with **no seller product knowledge required**. Each challenge contains enough **fictional** company, customer and product context for a meaningful simulation.

Examples:

- **Sceptical Founder:** One-on-one pitch and discovery.
- **Tough Negotiator:** One-on-one pricing objection.
- **Boardroom:** CEO, CTO and CFO evaluate a proposed solution.

Show a card with title, short description, difficulty, estimated duration, stakeholder count, user objective and **Start** action. Users should be able to select **Assist** or **Battle** before starting.

### 4.2 Knowledge-based Challenges

Users can optionally create entries in Knowledge Base and generate challenges specific to their product/service.

- **Knowledge Base entry:** Title, optional short description, **one PDF or TXT file per entry**. Multiple entries are allowed; no extra files per entry in MVP.
- **Challenge generation:** From Challenges, choose a knowledge entry, then click **Generate Challenges**. The AI suggests realistic product-aware challenges; a user can select one and start.
- **UI distinction:** Name predefined scenarios **Open Challenges** and product-derived scenarios **Knowledge-based Challenges** (or **My Challenges**). **Generate Challenges** is the generation action, not a confusing duplicate challenge category.
- Every generated challenge must be attached to the source knowledge entry so Assist guidance and post-call product accuracy checks can use the same context.
- Users can practise without any knowledge at all; never redirect them to an upload wizard.

**Both kinds of challenges must support:** one-on-one and Boardroom variants, where configured, and both Assist and Battle modes.

## 5. Practice calls

### Starting a call

Show the challenge overview and configuration:

- Challenge title, purpose and selling objective.
- Type: **One-on-One** (one buyer) or **Boardroom** (multiple stakeholders such as CEO, CTO, CFO).
- Personas: role, visible profile and high-level personality; detailed hidden motivations remain private.
- Difficulty and time limit where supported; defaults from selected challenge.
- Mode: **Assist** or **Battle**.
- Linked knowledge title for a generated challenge, if applicable; no upload requirement for Open Challenges.
- Remaining practice allowance and microphone/audio-processing notice.

### In the call

- Meeting-style screen with participants, names and roles, active-speaker indicators, microphone controls, transcript and session timer.
- AI personas respond to the user's actual messages and retain context during the active session.
- For Boardroom, each agent has different priorities (e.g. CEO: outcomes; CTO: integration/security; CFO: cost); they may react to one another. Coherent turn-taking matters more than simultaneous audio.
- Users may end early. Failed or partial sessions should have honest statuses and partial reporting where meaningful.
- No real-customer meeting connection is promised or implemented for the event.

### Assist Mode

- User may request **private, on-demand coaching** while practising.
- In an Open Challenge, assistance is based on the predefined scenario and general sales principles.
- In a Knowledge-based Challenge, assistance may additionally use the linked knowledge to suggest **verified, relevant** product responses.
- AI buyers must not be informed of private hints unless the user chooses to say them.
- Track whether assistance was used; don't compare assisted and unassisted scores as though conditions were identical.

### Battle Mode

- No in-call assistance or hints.
- All normal voice conversation and post-call reporting still work.
- Evaluation occurs after the call.

## 6. Post-call reports — available after every call

Every completed call (including Time Machine branches) gets its **own** report. Show:

1. Session identity, challenge, call type, mode, date, duration, participants and completion status.
2. Short summary and simulated outcome/verdict.
3. Overall score and clear skill categories: discovery/listening, communication, objection handling, value explanation; product accuracy **when knowledge is attached**.
4. Strengths and mistakes **linked to transcript turns**.
5. Objections raised, user's responses, missed questions and better alternatives.
6. Separate stakeholder feedback and unresolved concerns for Boardroom.
7. Next steps and a suggested answer turn to try with Time Machine.
8. For knowledge-based challenges: supported, contradicted and **unverified** product claims, with references to source content where available. Missing documentation does not prove a statement is false.

Short or interrupted sessions may have a **partial report**, explicitly stating what cannot be reliably evaluated. Never invent transcript quotes or evidence.

## 7. Time Machine — signature MVP capability

**Definition:** After a practice call, the user reviews the completed transcript, selects **one of their own answer turns**, and starts a **new conversation branch** at that point to give a different response.

Required behaviour:

1. Show the **original transcript** with selectable user answer turns and a **Try a Different Answer** action.
2. Restore the scenario, challenge, mode, participants and **only context that existed before the selected answer**; retain relevant buyer state at that moment.
3. Let the user provide a different answer by voice (and a text fallback if needed).
4. Continue the dialogue from that alternative answer; for Boardroom, all participating stakeholders continue from the same restored point.
5. Store the branch as a **separate session** linked to its source and branch point; **do not overwrite** the original transcript, report or subsequent original turns.
6. Generate a new post-call report for the branch and enable comparison of original and alternative results.
7. Permit additional branches if the user's limits allow them. **Branches consume AI usage allowance** just like normal calls.
8. Do not leak future events or facts from the original conversation into the new branch's simulated agent memories.

**Time Machine is not merely playing a recording or generating an alternative text suggestion. The user actively resumes a new simulated conversation.**

## 8. Sessions and Dashboard

### Sessions

- List the user's original calls and Time Machine branches, with challenge name, type, mode, date, duration, score/report status.
- Open any call to see transcript, report and linked branches.
- Make parent/branch relationships clear; users can compare alternate outcomes.
- Handle processing, failed, partial and completed statuses honestly.

### Dashboard

- Personal-only metrics: completed sessions, practiced minutes, recent scores, practice modes used, latest reports and improvement across comparable attempts.
- Use real data only; show helpful empty states for new users.
- Time Machine improvements must be described as **within-simulation** results, not real sales conversion improvements.

## 9. Settings and AI-credit safeguards

- Profile/account details, basic preferences, consent/help information and practice-usage balance.
- **Authenticated voice access only.** API and voice-provider credentials must not be exposed to browsers.
- Enforce **per-account session and voice-duration quotas**, maximum duration per call, **one active call per account**, and rate limits on call creation/generation.
- Add an **event-wide budget ceiling and emergency disable switch** for new voice sessions.
- Meter usage based on actual provider-consumption rules where possible, including Time Machine branches, retries, failures and multi-agent audio.
- Treat freshly created accounts, excessive requests and repeated signups as abuse risks; authentication is necessary but not sufficient.
- Show users clear allowance and exhausted-credit messages. Do not start calls when the budget guard disallows them.

## 10. Event success and user feedback

- **Primary outcome:** Real authenticated participants complete meaningful voice practice and see post-call feedback.
- Record separately: registered accounts, unique people who started practice (as far as verifiable), completed sessions, reports viewed, Time Machine branches, knowledge uploads, generated challenges, and feedback submissions.
- Consider Google Forms for **optional** post-session feedback. Don't block access to the report or product behind the form. Do not send full transcripts or confidential documents into feedback forms.
- A signed-up account alone is **not** evidence of completed practice.
- Show judges the journey: signup → Open Challenge → Boardroom voice call → report → Time Machine; additionally demonstrate knowledge upload → generated product-aware challenge.
- Show only actual usage numbers. Demo personas, scores and sample outcomes must be clearly identified as fictional or illustrative.

## 11. Commercial direction — not event build scope

Long-term value: help sales professionals practise, improve objection handling and learn their products; help companies eventually train teams and measure readiness. Potential future capabilities: organisations and managers, richer knowledge, persistent Simulated Deals, real-call assistance, integrations and paid seat/usage subscriptions. These are **roadmap hypotheses**, not MVP commitments.

The eventual business model may be per-user or per-team subscriptions with included AI minutes and top-ups. Validate price, retention, training quality and AI costs before committing to commercial claims.

## 12. Instructions for AI coding agents

- Read this file and the current `brd.md` before altering user-facing workflows.
- Preserve the exact navigation and authenticated-first flow.
- Do not reintroduce Guest Mode, Clients menu, organisation invitations, team analytics or Simulated Deals in the event build.
- Do not confuse **Open Challenges** with **Knowledge-based Challenges**; knowledge is optional.
- Do not add a Replay call mode. Modes are only **Assist** and **Battle**; **Time Machine** starts a branch after a completed call.
- Keep original calls unchanged and reports scoped to their actual session and branch.
- Protect voice credits on the server; every AI-powered call and branch counts toward allowance.
- Avoid inventing product capabilities, facts, source citations, customer outcomes or test results.
- If a requirement is ambiguous, surface it as a product decision rather than silently defining a new rule.

**Single-sentence product definition:** _Zavara CallPilot is an authenticated AI sales practice app with predefined and product-aware challenges, realistic one-to-one and Boardroom voice calls, Assist/Battle modes, evidence-based coaching, and a Time Machine that lets users branch conversations from past answers._
