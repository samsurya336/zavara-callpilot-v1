# Zavara CallPilot — Business Requirements Document (BRD)

**Product:** `zavara-callpilot`  
**Document version:** Airtribe MVP scope — 23 October 2026  
**Event:** Airtribe AI Builder's Day, 24 October 2026  
**Status:** Agreed MVP requirements  
**Readers:** Founders, product stakeholders, developers, designers and AI agents

## 1. Executive summary

**Zavara CallPilot** is an AI-powered sales practice platform. Users practise conversations with simulated customers in one-to-one or multi-stakeholder Boardroom calls. They receive clear, transcript-backed coaching and can use **Time Machine** to try a different answer from a selected point without repeating the entire original conversation.

The event MVP has **no guest mode**. Users sign up once and go directly to **Practice Mode > Challenges**. They can immediately start **Open Challenges**, which use predefined fictional product/customer contexts. Product knowledge upload is **optional**: users who upload a PDF/TXT describing their own product can generate **Knowledge-based Challenges**, receive product-aware Assist suggestions and get more specific product accuracy feedback.

The MVP focuses on a complete learning loop rather than a full enterprise SaaS: **Authenticate → Choose or Generate Challenge → Practise → Review Report → Use Time Machine → Compare Outcomes**.

## 2. Business problem

People selling B2B products must discover customer problems, explain value, handle objections and persuade different decision-makers. Training through peer roleplay or manager reviews is not always readily available or repeatable. Practising on real prospects can be costly when a salesperson is unprepared. Generic chat assistants can play a buyer but usually leave scenario preparation, structured evaluation and improvement tracking to the user.

The customer needs a practical environment in which to:

- Rehearse difficult situations without involving real prospects.
- Practise with buyers who have different personalities and goals.
- Learn how to respond to executives with different concerns (CEO, CTO, CFO).
- Receive specific feedback tied to their actual responses.
- Revisit a poor answer, try another approach, and observe a different simulated outcome.
- Optionally practise using their own product features and policies instead of generic sales advice.

**Market context:** AI sales practice and coaching already have competitors, including Hyperbound, Yoodli and Second Nature. CallPilot must not claim to be the first roleplay, multi-agent or feedback platform. Our product hypothesis is that a fast, focused **practice → report → alternate-answer** workflow can be attractive to individual builders and small sales teams. This needs customer validation.

## 3. Objectives

### Event MVP objectives

1. Deliver a stable authenticated experience that enables a first-time user to start an Open Challenge quickly.
2. Demonstrate realistic one-on-one and multi-agent Boardroom conversations.
3. Produce genuinely actionable post-call reports with transcript evidence.
4. Demonstrate **Time Machine** as the signature improvement feature.
5. Show optional personalisation through a Knowledge Base and generated product-aware challenges.
6. Measure real usage and collect voluntary user feedback.
7. Protect finite ElevenLabs/AI-provider credits so one user cannot exhaust the event budget.

### Long-term business objectives (not MVP delivery commitments)

- Help individuals improve product knowledge and objection-handling skills.
- Offer small B2B teams a repeatable practice and coaching workflow.
- Explore paid subscriptions tied to seats and included AI minutes.
- Expand into team insights, ongoing deal simulations and actual live-call support only after user validation.

## 4. Target users and value

| User group                            | Current difficulty                                     | What the MVP offers                                          |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Startup founders and builders         | Pitching new products and responding to hard questions | Immediate Open Challenges and Boardroom practice             |
| Individual sales representatives      | Objections, discovery and articulating value           | Structured voice practice, reports and targeted retry        |
| Freelancers / consultants             | Explaining services to varied decision-makers          | Realistic one-to-one and multi-persona simulations           |
| Small B2B sales teams (future buyers) | Consistent onboarding and coaching                     | An early demonstration of repeatable, product-aware training |

**Why someone may eventually pay:** Their own product context, repeatable scenario practice, specific feedback, saved improvement history and potential reduction in manager-led training effort. These value hypotheses require testing; do not imply proven productivity or sales gains.

## 5. MVP product scope and navigation

```text
Dashboard
Practice Mode
  - Challenges
  - Sessions
Knowledge Base
Settings
```

**Authentication is required for all practice features.** The public marketing/landing page may be visible without signing in. After authentication, the initial destination is **Challenges**, not Dashboard or a knowledge setup wizard.

### Explicit exclusions

No guest sessions; no organisation creation, SUPER_ADMIN/USER roles or invitations; no Clients menu/directory; no persistent Simulated Deals; no Realtime Copilot; no Integrations menu; no payment checkout, subscription system or CRM connectivity. These may appear in long-term planning only.

## 6. Business requirements by capability

### BR-01 — Authentication and onboarding

**Why:** Protect paid voice processing and give each user persistent history.

**Required:** Sign up/sign in, authenticated session access, direct redirect to Challenges, account identity, sign out, clear first-run instructions and voice-processing notice.

**User inputs:** Authentication provider details; any required consent; optional name/preferences through Settings. No mandatory product, company or organisation fields.

**Visible information:** Available challenges, usage remaining, account menu, sign-in and quota errors.

**Acceptance:** An authenticated new user can reach Open Challenges without uploading a document; unauthenticated requests cannot start AI processing or access another user's reports.

### BR-02 — Challenges

**Why:** Give fast first value and later enable product-specific practice.

**Challenge categories:**

1. **Open Challenges:** Platform-provided fictional scenarios requiring no user knowledge upload.
2. **Knowledge-based Challenges:** Generated from the user's selected product Knowledge Base entry.

**Visible challenge details:** Title, short story, difficulty, one-to-one or Boardroom, personas/roles, estimated duration, objective and Start button.

**Inputs for generation:** Selected knowledge entry (required), optional difficulty, selected one-to-one/Boardroom format and practice goal if offered.

**Actions:** Browse/filter, view details, select Assist or Battle, start call, generate challenges from uploaded knowledge, revisit previously generated scenarios.

**Acceptance:** Users can start Open Challenges instantly after sign-in; generated challenges are clearly connected to the correct knowledge entry. Both challenge sources can support one-to-one and Boardroom formats.

### BR-03 — Knowledge Base

**Why:** Allow users to practise selling _their own_ product and receive more accurate guidance.

**Inputs:** Knowledge title, optional description, exactly **one PDF or TXT document** per entry. Multiple entries per user are allowed.

**Visible information:** Knowledge list, title, file name/type, upload status, creation date, delete/replace action if implemented, and Generate Challenges action.

**Rules:** Upload is optional; knowledge is personal to the authenticated account for the MVP; use authorised documents only; a product fact absent from a source is **unverified**, not automatically false.

**Acceptance:** Users can create a knowledge entry and generate at least one challenge grounded in the uploaded source; other users cannot see or attach that private source.

### BR-04 — AI practice calls

**Why:** Practise realistic sales conversations rather than static question-and-answer quizzes.

**Call types:** **One-on-One** with a single AI buyer; **Boardroom** with several stakeholders such as CEO, CTO and CFO.

**Call modes:**

- **Assist:** Optional, private, on-demand coaching during the call. When knowledge is linked, suggestions may reference verified product information.
- **Battle:** No hints during the call; feedback comes afterward.

**Inputs before start:** Challenge, format/participants, mode, scenario difficulty and objective where supported, microphone/audio permission, optional linked knowledge for a generated scenario.

**Visible during call:** Participants, names/roles, active speaker, transcript, timer, mute/end controls, Ask Coach only in Assist Mode, clear connection/limit states.

**Rules:** Different buyer motivations; coherent turn-taking; within-call memory; appropriate responses to what the user said; no unsolicited product facts from confidential seller knowledge attributed to an AI buyer. No real-client call integration.

**Acceptance:** A user can complete a functioning one-to-one or Boardroom practice; Assist suggestions are private; Battle mode has no assistance. Calls end cleanly and respect usage limits.

### BR-05 — Post-call reports

**Why:** Convert conversation experience into actionable learning.

**Show:** Session metadata; summary; simulated outcome; overall score; skill breakdown; strong moments; weak moments; objections; missed discovery questions; examples of better responses; next-step recommendation; Boardroom stakeholder-by-stakeholder insights. Where a knowledge entry is attached, include evidence-backed product accuracy analysis and label unverifiable claims accurately.

**Rules:** Link observations to actual transcript turns; use a consistent evaluation rubric; indicate insufficient evidence in incomplete sessions; never invent quotations or present scores as real-world close probabilities.

**Acceptance:** Each completed original or branched call has its own report that is accessible through Sessions.

### BR-06 — Time Machine (signature feature)

**Why:** Let a user learn from an actual mistake without replaying an entire call from the beginning.

**Workflow:** Open a completed call → review transcript → select one of the user's answer turns → choose **Try a Different Answer** → resume a new conversation from that point → end branch → view its report → compare with original.

**Inputs:** Original session, selected user answer turn, new spoken/text response and subsequent conversation.

**Visible information:** Original context up to the branch point, branch indicator, current participants and mode, alternate transcript, branch report, link to original and comparison of responses/outcomes.

**Business rules:** Preserve the original transcript and report unchanged. The branch uses only information that was available **before** the original answer; it must not know later facts from the original call. Restore relevant persona state for one-to-one and Boardroom. Branches may be created repeatedly subject to account quotas. Time Machine is a feature, **not a third calling mode**.

**Acceptance:** Users can select an earlier answer and successfully continue a different call; the original remains intact; the branch has its own report and both outcomes can be compared.

### BR-07 — Sessions

**Why:** Allow users to review and revisit their own learning history.

**Show:** Challenge, session date/time, format, Assist/Battle mode, duration, state, score/report status and whether original or Time Machine branch. In session details show transcript, report and linked branches.

**Acceptance:** A user sees only their own sessions; original/branch relationships and partial/failed statuses are clear.

### BR-08 — Dashboard

**Why:** Show progress and encourage repeated practice.

**Show:** Total completed practices, recent sessions, practice minutes, skill score trends, recent reports, and improvement between comparable original and branched calls where available.

**Rules:** Personal metrics only; empty states for new users; no invented trend lines or inflated scores.

**Acceptance:** Every metric is based on recorded user activity and links to relevant sessions when appropriate.

### BR-09 — Settings

**Why:** Provide account control and visibility into usage.

**Show:** Account/profile, basic preferences, practice balance and usage history/limits, sign-out, consent/help information.

**Acceptance:** Users can identify remaining allowance and understand why they cannot start another session if it is exhausted.

### BR-10 — AI usage and budget protection

**Why:** ElevenLabs and associated AI services charge for usage; unmetered or abusive activity can exhaust event credits.

**Requirements:** Authentication before AI access; server-side per-account quotas; max duration per call; at most one concurrent active call per account; rate limits; usage tracking including Time Machine branches and Boardroom audio; event-wide budget ceiling/kill switch; short-lived voice authorisation where supported; credentials kept secret; clear rejection messages.

**Acceptance:** Exceeding account/global limits prevents new billable sessions; one user cannot start parallel voice calls and bypass quotas.

## 7. Journey-level acceptance tests

1. **First-time user:** Sign up → arrive at Challenges → open predefined challenge → choose mode → give audio consent → finish call → read report.
2. **Boardroom:** Start three-person challenge → each agent speaks coherently in its role → report includes separate stakeholder observations.
3. **Personalised practice:** Upload one PDF/TXT as knowledge → Generate Challenges → select product-specific challenge → receive knowledge-grounded Assist hints and product accuracy findings.
4. **Battle integrity:** Battle Mode never exposes coaching hints.
5. **Time Machine:** Open transcript → branch at a selected user turn → change answer → continue conversation → see new report → original still intact.
6. **Security/limits:** Unauthenticated AI calls fail; a second concurrent session and over-quota calls are blocked.

## 8. Airtribe launch and distribution

**Positioning for the event:** _“Think you can sell your idea? Sign in, face an AI buyer or Boardroom, get coached, and use Time Machine to change your answer.”_

**Acquisition journey:** QR/landing page → quick Google sign-in → Open Challenge → voice call → report → optional feedback → Time Machine or upload own product knowledge.

**Evidence to collect:** Unique authenticated participants who genuinely use the product, completed practices, reports viewed, Time Machine usage, challenge generation and optional feedback. Count real usage separately from accounts or pageviews; respect any official event interpretation of a qualifying user.

**Judge demonstration:**

1. Show effortless sign-in and Open Challenge selection.
2. Run a short multi-stakeholder Boardroom example with distinct CEO/CTO/CFO concerns.
3. Display a real report identifying an actual weak answer.
4. Invoke **Time Machine**, give a stronger answer and show the independent alternative outcome.
5. Show optional knowledge upload and product-aware challenge generation.
6. Show honest event usage/feedback metrics and explain the commercial direction.

**Feedback:** A brief voluntary Google Form can provide independent user feedback. Do not make feedback a condition for seeing a report, and do not send confidential documents/transcripts into forms.

## 9. Success metrics

| Metric                             | Why it matters                                      |
| ---------------------------------- | --------------------------------------------------- |
| Genuine unique practitioners       | Measures actual adoption beyond signup              |
| First-challenge activation rate    | Shows onboarding effectiveness                      |
| Completed practice sessions        | Shows whether the core journey works                |
| Report view rate                   | Shows whether users receive coaching value          |
| Time Machine usage                 | Indicates interest in the distinctive learning loop |
| Knowledge-based challenge adoption | Validates product-personalisation demand            |
| User-reported usefulness           | Early qualitative validation                        |
| AI cost per completed session      | Helps determine future subscription viability       |

No targets should be presented as achieved results. The team's event targets can be set separately and monitored live.

## 10. Commercial strategy beyond the event

**Initial business hypothesis:** Individuals and small B2B teams may pay recurring fees for product-specific voice simulations, retained performance history and consistent training. Potential plans include a limited free tier, individual subscription and team subscription, with **included AI usage** and optional top-ups. Pricing and gross margins must be validated against measured voice/LLM costs and customer interviews.

**Likely first GTM:** Founder-led outreach to B2B SaaS/IT-services companies, demos of product-aware practice, limited team pilots, and LinkedIn content showing practical objections and improved answers. Shareable challenge results may support referrals, subject to user consent and privacy.

**Future capabilities (excluded from event MVP):** Organisation and team administration, manager analytics, multi-document knowledge, persistent Simulated Deals with cross-call memory, live real-customer copilot, meeting/CRM integrations, advanced enterprise security and subscription checkout.

## 11. Assumptions, risks and boundaries

- Realistic Boardroom turn-taking and voice latency must be tested on event internet connections; offer a clearly labelled text fallback if available.
- **Authentication alone does not prevent abuse.** All voice sessions, branches and generations need server-enforced safeguards.
- AI customers and verdicts are simulations. They are not actual business prospects or validated win probabilities.
- Product knowledge may be confidential; users must upload only material they are authorised to provide. Do not leak it between accounts or to shared result pages.
- Reports must reflect transcript evidence and express uncertainty when documentation is incomplete.
- Verify the event's current eligibility and pre-building rules with the organiser; do not claim a submission rule has been verified unless it has.

## 12. Definition of MVP complete

Zavara CallPilot is event-ready when an authenticated new user can, within a short visit, **start an Open Challenge, complete a one-to-one or Boardroom voice session in Assist or Battle, read a grounded report, and use Time Machine to continue from an earlier answer in a separate branch**, while optional product knowledge can generate tailored challenges, all usage is controlled, and the team can demonstrate genuine activity from real users.

**Product principle:** _Don't simply tell someone their pitch was weak—let them try a better answer and learn from the difference._
