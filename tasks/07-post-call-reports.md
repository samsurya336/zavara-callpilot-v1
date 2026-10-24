# 07 - Read the post-call report

## User Story

As a participant, I want to quickly understand what went well, where I struggled and what to do differently, so that I can improve one answer at a time instead of feeling overwhelmed by a long report.

**Owner:** Dev D  
**Needs:** Transcript/settings from task 05, assistance data from task 06 and linked knowledge from task 03 where present.  
**BRD:** BR-05.

## To Do

- [ ] Generate/save a separate report for each original session and Time Machine branch. Show Processing/Ready/Failed and safe retry without duplicate results.
- [ ] Follow the reading order below. Show the useful takeaway first; keep detailed evidence and breakdowns expandable, not in one long wall of text.
- [ ] Choose one main improvement from the actual conversation. Group repeated mistakes under that point instead of repeating the same criticism.
- [ ] Connect every improvement to a real moment, explain its effect and give a practical next action with an example response.
- [ ] Make Try a Different Answer the main improvement action, linked to an eligible user-answer turn through task 08. Keep other transcript turns available for the user to choose.
- [ ] Include the agreed skill scores, Boardroom insights and knowledge checks without making the user read all of them before taking action.
- [ ] Check the report with a teammate who has not seen the call. They should understand the main issue and next step without a developer explaining it.

## What The User Should Understand

The report should answer these questions in simple words:

1. How did my conversation go?
2. What did I do well?
3. What is the most useful thing to improve first?
4. What could I say or ask differently?
5. Where can I try that now?

The goal is useful coaching, not the largest possible report. A user should be able to understand the main takeaway in roughly 30 seconds, then open more detail if needed.

## Report Reading Order

### 1. Your Call At A Glance

- Show the challenge, One-on-One/Boardroom, Assist/Battle, date, duration and completion status in a compact header. Keep source/participant details available without a large metadata block.
- Give a plain-language summary in two or three short sentences: what the buyer wanted, how the conversation went and what remained unresolved. Only describe what the transcript supports.
- Show the overall score with a short explanation of what it means, not just a number. Label it as AI practice feedback, not a real purchase probability.
- Show assistance use. For a short/interrupted call, clearly say Partial Feedback and which parts cannot be judged; show Not Enough Evidence instead of an invented score.

### 2. Focus On This First

Show **one main improvement**, based on the most important evidence-backed gap for this challenge. Keep this visible without expanding anything. Use a specific heading such as "Ask about the current problem before explaining features", not "Improve discovery".

Use the same small structure for each improvement:

- **The moment:** A short real buyer question/user response, with a timestamp or View Moment link. Explain an omission as a missed question; never invent a quote for something the user did not say.
- **What to change:** State the behaviour clearly and respectfully. For example, the user answered a budget concern with features rather than asking what the budget covered.
- **Why it matters:** Explain how this affected the conversation or left a concern unresolved. Do not guess what the buyer secretly thought or claim this definitely lost a real deal.
- **Try this next:** Give one specific question or response pattern, followed by a short suggested answer the user can adapt. It must fit the context and any available product evidence.
- **Practise it:** Try a Different Answer opens Time Machine at the linked user-answer turn. If there is no suitable turn, suggest a specific next practice rather than showing a broken action.

Show no more than **three improvement points in total**, including the main one. Keep the other points under More To Improve, collapsed initially. Cover important objections and missed questions here rather than duplicating them in separate long lists.

### 3. Keep Doing This

- Show up to two specific strengths, each with a short reason and a real conversation reference. For example, "You checked whether the buyer's concern was resolved before moving on."
- Recognise useful behaviours the user can repeat, not vague praise like "Great job!" Do not force two strengths if the evidence supports fewer.

### 4. Explore The Details

Keep these sections collapsed initially. Opening them should explain the feedback, not repeat the summary.

- **Skill breakdown:** Discovery/listening, communication, objection handling and value explanation; product accuracy only when knowledge is linked. For each, show the score or Not Enough Evidence and one short reason. Make the agreed scoring guide/scale available through How Scoring Works.
- **Boardroom feedback:** Only for Boardroom. For each stakeholder, show their main concern, what was addressed, what remains open and the supporting turn. Keep it brief; disclose that any committee verdict is simulated.
- **Product fact checks:** Only when knowledge is linked. Use Supported, Contradicted and Unverified with the user's actual claim, a short explanation and a valid source reference where available. A missing statement in the document is unverified, not automatically false.
- **Conversation evidence:** Let the user open the relevant transcript moment in context. Do not load the entire transcript as the first thing on the report page.

### 5. Leave With One Clear Next Step

- Finish with one recommended action: retry the highlighted answer, or practise one specific skill in the next call. Avoid giving a long homework list or several competing main buttons.
- Keep View Full Transcript and Back To Sessions as supporting navigation. Do not require feedback-form completion before reading or using the report.
- For a Time Machine branch, show the source call/branch point and a comparison link. Explain what changed in the actual answer and feedback; disclose assistance or scoring-context differences. A better branch score is not proof of real-world sales improvement.

## Example Of A Useful Improvement

**Illustration only:** The lines below are made-up examples of the format. Never insert them into a real report unless the actual conversation supports them.

**Heading:** Understand the budget concern before discussing price.

**The moment:** Buyer: "This is outside our budget." You: "But we have many features."

**What to change:** You explained features without checking what the budget concern was.

**Why it matters:** The price concern remained unresolved, so the conversation moved on without a clear next step.

**Try this next:** Ask what the buyer is comparing the price against. For example: "When you say outside budget, is the concern the total amount, the payment timing, or the value you expect?"

**Action:** Try a Different Answer at that response.

## Writing Rules

- Use short sentences, familiar words and direct suggestions. Prefer "Ask one question about their current process" over "Strengthen your consultative discovery capability".
- Comment on the response or behaviour, not the person's ability or character. No shaming, labels such as "bad salesperson", or fake motivational praise.
- Keep each explanation to one or two short sentences. Quote only the useful part and let the user open the full context.
- Make suggestions practical without inventing features, prices, discounts or promises. When product evidence is missing, suggest a clarifying question or verification step.
- Do not rely only on red/green colours or scores. Always include a readable label and explanation. Keep sections readable on mobile and expandable with keyboard-accessible controls.

## Technical Notes

Use a small validated JSON format linked to the session ID and saved scoring/source context. Keep separate fields for summary, priority improvement, other improvements, strengths, skill breakdown, stakeholder feedback, product checks and next action. Render these as structured sections, not one large AI-generated paragraph. Optional sections should be absent or marked unavailable when they do not apply.

Each improvement needs valid evidence-turn references, a plain explanation, a practical suggestion and an eligible retry-turn reference when available. Check quotes and source references against saved content before display. Keep the visible limits above in both output validation and rendering; do not pad the report to meet a count. Ask the evaluator to prioritise the most useful issue for the challenge, not the most negative wording.

Agree the scoring scale and category rules once, save the scoring-guide version and reuse it for comparable attempts. Do not change score weights per report to create a nicer result. Low evidence should reduce certainty or leave a category unscored, not become a confident zero. Assistance must be disclosed, not silently treated as cheating or given an invented penalty.

A branch report must use its own continuation, not later original turns. Retain the shared pre-branch context as needed and show the branch point so its scope is clear. Keep original and branch reports separate. Protect report/source access by account and keep generation retries safe without losing the saved transcript.

## Done When

- [ ] Every completed call, including a Time Machine branch, has its own saved evidence-based report in Sessions.
- [ ] Without opening the detailed sections, a teammate can explain how the call went, the main improvement and one action to try next.
- [ ] The first view shows a short summary, one priority improvement and a clear retry/next-practice action, not a wall of scores or criticism. At most three improvements and two strengths are shown in total, with fewer when evidence is limited.
- [ ] Every improvement explains the actual moment, what to change, why it matters and what to try. Evidence links open the correct context, and Time Machine selects the right user turn.
- [ ] Skill scoring, Boardroom feedback and product checks are easy to find but do not overwhelm the first view. Non-applicable sections are hidden; insufficient evidence is clearly explained.
- [ ] No quotes, claims or outcomes are fabricated. Suggestions respect product evidence, and the writing coaches behaviour without judging the person.
- [ ] Mobile and keyboard users can read the summary, expand details and reach the main action. Feedback forms never block the report.
- [ ] Failed analysis can retry without losing the transcript, and a second account cannot fetch my report by ID.
