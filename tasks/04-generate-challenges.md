# 04 - Generate Knowledge-based Challenges

## User Story

As a participant with uploaded knowledge, I want to generate challenges from my product information, so that I can practise realistic conversations about what I actually sell.

**Owner:** Dev B  
**Needs:** Ready personal knowledge from task 03 and the challenge/call format from tasks 02 and 05.  
**BRD:** BR-02, BR-03.

## To Do

- [ ] On Challenges, add the **General Challenges** action requested in the latest instructions. Let the person choose one Ready knowledge entry, One-on-One or Boardroom, and optional difficulty/goal.
- [ ] Clearly explain that this action generates Knowledge-based Challenges. Keep Open Challenges as the other category; do not create a third category named General Challenges.
- [ ] Generate realistic buyer situations, visible personas and objections/agent instructions on the backend. Ground seller-side product claims in the selected source without inventing features, prices or policies.
- [ ] Produce usable One-on-One and CEO/CTO/CFO-style Boardroom challenges. Allow Assist or Battle for either format through the shared call setup.
- [ ] Save generated challenges against the account and source knowledge ID/version. Show them again after refresh so the person can revisit a saved scenario without regenerating it.
- [ ] Separate the buyer brief from private seller text/coach evidence. Do not make generated buyers automatically know the full confidential file.
- [ ] Show generation progress, errors and bounded retry; validate structured AI output and prevent duplicate saves. Apply server-side generation rate/budget checks from task 11.

## Technical Notes

The product docs call this action Generate Challenges; the latest user request calls it General Challenges. Use the latest requested label unless the owner changes it. Extend the common challenge model with source kind, owner and knowledge reference. Only selected owned Ready knowledge may be used; check that on the server. No separate Clients generator/menu is needed.

## Done When

- [ ] From Challenges, I choose my knowledge and generate/save a One-on-One or Boardroom scenario with the correct source link.
- [ ] I can revisit it and start Assist/Battle with product-aware private coaching/report context.
- [ ] Another account's source is rejected, generation failures preserve my choices, and Open Challenges remain available without knowledge.
