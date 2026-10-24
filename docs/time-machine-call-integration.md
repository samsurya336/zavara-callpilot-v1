# Opening a Time Machine call

The authenticated console mounts the call host once. From any screen:

```tsx
import { openTimeMachineCall } from '@/features/challenges'

openTimeMachineCall({
  parentSessionId: callSessionId,
  branchFromTurnId: messageId,
})
```

Use the saved `call_session.id` and a saved user transcript turn's `id` (for example `turn-3`). The trigger opens the existing calling drawer, loads the saved brief and conversation prefix, and waits for **Continue Call** before requesting the microphone or starting a call. Loading failures appear in the modal with retry and close actions. Repeated triggers while the drawer is open are ignored.

The call endpoint `elevenlabs-agent-session` accepts the two fields with `connectionType: 'webrtc'`. `challengeId` is optional for branches; the server derives the challenge, mode and stakeholders from the owned source session. The same endpoint accepts `action: 'branch-context'` and those IDs to preview the public brief and transcript prefix without starting a call.

The selected user answer and all later original turns are excluded. The agent receives the earlier dialogue, repeats the full buyer reply immediately before the selected answer, and waits for the replacement answer. Adjacent stakeholder segments retain their voice labels. If there is no preceding buyer reply, it uses a brief acknowledgement. A new call record stores `parent_session_id` and `branch_from_turn_id`; the original is preserved. The branch transcript and report include the inherited prefix followed by the new dialogue.

Deploy the updated `elevenlabs-agent-session` and `elevenlabs-post-call` functions with the frontend. This uses the existing branch columns; no migration is required. Allowance enforcement remains the existing task 11 integration point in the call endpoint.
