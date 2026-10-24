# 02 - Choose an Open Challenge

## User Story

As a signed-in participant, I want ready-made challenges, so that I can practise immediately without uploading product knowledge.

**Owner:** Dev B  
**Needs:** Authenticated entry from task 01. Agree the challenge format with task 05.  
**BRD:** BR-02.

## To Do

- [ ] Add an Open Challenges section on the Challenges page with a visible Start Open Challenge route/action.
- [ ] Prepare Sceptical Founder and Tough Negotiator as One-on-One examples, plus a Boardroom example with CEO, CTO and CFO.
- [ ] Include enough fictional buyer and seller-product context to run each scenario. Show title, short story, goal, difficulty, estimated time, format and visible participant details.
- [ ] Let the person review a brief, select Assist or Battle and see the allowance/audio-processing notice before starting through task 05.
- [ ] Keep hidden motivations, internal objections and agent instructions out of the frontend/API payload. Clearly label the people and companies as simulated.
- [ ] On the same page, show Knowledge-based Challenges separately. With no uploads, explain that knowledge is optional and leave Open Challenges fully usable.
- [ ] Handle loading/empty/failed catalogue states and protected direct links. No upload wizard, guest start or client-directory setup.

## Technical Notes

Use seeded records or a small backend-owned preset configuration with stable IDs. Both formats must be represented. Each call starts fresh from its selected scenario; earlier independent calls do not become buyer memory. Save the challenge/settings used for reports and Time Machine.

## Done When

- [ ] A new signed-in account with no knowledge can choose and start a One-on-One or Boardroom Open Challenge.
- [ ] Both formats offer Assist and Battle, with a clear goal and fictional product brief.
- [ ] Missing knowledge does not block Open Challenges, and hidden buyer instructions are not exposed.
