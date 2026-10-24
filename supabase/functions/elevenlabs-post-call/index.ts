import { jsonResponse, runInBackground, serviceClient } from '../_shared/index.ts'
import {
  generateReport,
  type ProviderConversation,
  saveConversation,
} from '../_shared/post-call.ts'
import { verifySignature } from './signature.ts'

interface PostCallEvent {
  type: string
  data: ProviderConversation
}

// Called by ElevenLabs, not a user, so gateway verify_jwt is off and the HMAC signature is the
// authentication. Unknown events and calls return 200 so ElevenLabs does not disable the webhook.
Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Use POST' }, 405)
  }
  const secret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET')
  if (!secret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is not set')
    return jsonResponse({ error: 'Webhook is not configured' }, 500)
  }

  const rawBody = await request.text()
  if (!(await verifySignature(rawBody, request.headers.get('ElevenLabs-Signature'), secret))) {
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }

  try {
    const event = JSON.parse(rawBody) as PostCallEvent
    if (event.type !== 'post_call_transcription') return jsonResponse({ received: true })

    const db = serviceClient()
    const callSessionId = await saveConversation(db, event.data)
    if (!callSessionId) {
      console.warn(`No call session for ElevenLabs conversation ${event.data.conversation_id}`)
      return jsonResponse({ received: true })
    }
    // The report takes several seconds, so ElevenLabs gets its 200 first. A failed report is
    // marked FAILED and retried by the next webhook delivery or end-call sync.
    runInBackground(generateReport(db, callSessionId))
    return jsonResponse({ received: true })
  } catch (error) {
    console.error(error)
    // A 5xx lets ElevenLabs retry; the update is keyed by conversation, so retries are safe.
    return jsonResponse({ error: 'Could not store the transcript' }, 500)
  }
})
