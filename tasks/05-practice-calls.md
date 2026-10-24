# 05 - Complete a One-on-One or Boardroom call

## User Story

As a participant, I want to speak with realistic AI buyers, so that I can practise a pitch, handle objections and finish with a saved conversation.

**Owner:** Dev C  
**Needs:** Auth from task 01 and challenge format from tasks 02/04. Build usage checks with task 11 before enabling billable calls.  
**BRD:** BR-04.

## To Do

- [ ] Use one call setup/runtime for Open and Knowledge-based Challenges. Show goal, format, participants, difficulty, mode, linked knowledge when applicable and remaining allowance.
- [ ] After authentication/ownership/allowance checks, create one saved session with a snapshot of its challenge, personas, knowledge reference and settings. Repeated clicks must not create duplicate active calls.
- [ ] Connect voice input, AI responses and voice output. Show meeting tiles, names/roles, active speaker, timer, mute, transcript and End Call.
- [ ] Support one buyer and Boardroom stakeholders with distinct priorities: CEO outcomes, CTO technical fit/security, CFO cost/value. Choose relevant speakers and allow only one AI voice at a time.
- [ ] Keep within-call context and react to the user's actual answers. Keep hidden motivations/private coaching and confidential seller text separate from buyer context.
- [ ] Save ordered transcript turns with stable IDs, speaker, text and time. Save/reconstruct buyer state at user-answer boundaries so task 08 can restore the correct point.
- [ ] Give audio-processing notice/consent before mic use. Handle denied permission, network/provider failures and a labelled text-input fallback using the same transcript.
- [ ] End early/at limit cleanly: stop mic/audio/provider work, save completed/partial/failed status honestly, release the active-call lock and request a report once. Preserve useful saved turns on interruption.

## Technical Notes

Agree transport support and data formats with Dev D first. Fresh calls do not load earlier practice memory. Time Machine uses this same engine with a verified prefix and restored state. Use short-lived scoped voice tokens where supported; long-lived provider secrets stay server-side. Saving a full audio recording is not required.

## Done When

- [ ] Both challenge sources run One-on-One and Boardroom in Assist/Battle, with correct speaker-labelled saved turns.
- [ ] A mic/service failure gives recovery/text fallback; the timer, allowance and end controls remain honest and no voice work runs after exit.
- [ ] A finished call reaches report processing once; blank failed starts are not presented as completed practice.
