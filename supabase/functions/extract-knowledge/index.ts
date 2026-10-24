import { authenticate, jsonResponse, serviceClient } from '../_shared/index.ts'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_EXTRACTED_BYTES = 2_000_000
const GEMINI_MODEL = 'gemini-3.5-flash-lite'

type KnowledgeRow = {
  id: string
  created_by: string
  file_url: string
  file_type: string
  file_size_bytes: number
  file_meta: unknown
}

class GeminiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

function parseKeys(value: string | undefined) {
  if (!value?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed))
      return parsed.filter((key): key is string => typeof key === 'string' && key.trim())
  } catch {
    // A comma-separated value is convenient for local development.
  }
  return value
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
}

function errorMessage(error: unknown) {
  if (error instanceof GeminiRequestError) {
    if (error.status === 429) return 'The extraction service is busy. Try again shortly.'
    if (error.status === 401 || error.status === 403)
      return 'The extraction service key was rejected.'
    if (error.status === 404) return 'The configured extraction model is unavailable.'
    if (error.status >= 500) return 'The extraction service is temporarily unavailable.'
    return 'The extraction service could not read this PDF.'
  }
  if (error instanceof Error && error.message) return error.message.slice(0, 500)
  return 'The PDF could not be processed.'
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function isPdf(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-'
}

function fileName(meta: unknown) {
  if (!meta || typeof meta !== 'object' || !('name' in meta)) return ''
  const name = (meta as { name?: unknown }).name
  return typeof name === 'string' ? name : ''
}

async function extractMarkdown(pdf: Uint8Array, keys: string[]) {
  const data = bytesToBase64(pdf)
  let lastError: unknown = null

  for (const key of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'Extract all readable text from this PDF. Preserve the original order and useful structure. Return clean Markdown only, with headings, lists, and tables where they are clear. Do not summarize, invent, or comment on the extraction. If the PDF is scanned and contains no readable text, say exactly: NO_READABLE_TEXT.',
                  },
                  { inline_data: { mime_type: 'application/pdf', data } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              thinkingConfig: { thinkingLevel: 'minimal' },
            },
          }),
        },
      )

      if (!response.ok) {
        lastError = new GeminiRequestError(
          response.status,
          `Gemini request failed with ${response.status}`,
        )
        if ([400, 401, 403, 429, 500, 502, 503, 504].includes(response.status)) continue
        throw lastError
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string; thought?: boolean }> }
        }>
      }
      const markdown = payload.candidates?.[0]?.content?.parts
        ?.filter((part) => !part.thought)
        .map((part) => part.text ?? '')
        .join('')
        .trim()
      if (!markdown || markdown === 'NO_READABLE_TEXT')
        throw new Error('No readable text was found in this PDF.')
      if (new TextEncoder().encode(markdown).byteLength > MAX_EXTRACTED_BYTES) {
        throw new Error('The extracted text is larger than the supported limit.')
      }
      return markdown.replaceAll('\r\n', '\n')
    } catch (error) {
      lastError = error
      if (!(error instanceof GeminiRequestError)) throw error
    }
  }

  throw lastError ?? new Error('No extraction service keys are configured.')
}

async function markFailed(
  db: ReturnType<typeof serviceClient>,
  knowledgeId: string,
  message: string,
) {
  const { error } = await db
    .from('knowledge')
    .update({
      extraction_status: 'FAILED',
      extraction_error: message,
      extracted_text: null,
    })
    .eq('id', knowledgeId)
  if (error) console.error('Could not mark knowledge extraction as failed', error)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true })
  if (request.method !== 'POST') return jsonResponse({ error: 'Use POST' }, 405)

  const user = await authenticate(request)
  if (user instanceof Response) return user

  let knowledgeId: string
  try {
    const body = (await request.json()) as { knowledgeId?: unknown }
    if (typeof body.knowledgeId !== 'string' || !body.knowledgeId.trim()) {
      return jsonResponse({ error: 'knowledgeId is required' }, 400)
    }
    knowledgeId = body.knowledgeId
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const db = serviceClient()
  const { data: knowledge, error: lookupError } = await db
    .from('knowledge')
    .select('id, created_by, file_url, file_type, file_size_bytes, file_meta')
    .eq('id', knowledgeId)
    .eq('created_by', user.id)
    .maybeSingle<KnowledgeRow>()
  if (lookupError) {
    console.error(lookupError)
    return jsonResponse({ error: 'Could not load this knowledge entry' }, 500)
  }
  if (!knowledge) return jsonResponse({ error: 'Knowledge entry not found' }, 404)

  if (
    knowledge.file_type !== 'application/pdf' ||
    knowledge.file_size_bytes < 1 ||
    knowledge.file_size_bytes > MAX_FILE_SIZE ||
    !knowledge.file_url.startsWith(`knowledge/${user.id}/`)
  ) {
    await markFailed(db, knowledgeId, 'This entry does not contain a valid PDF upload.')
    return jsonResponse({ status: 'FAILED' })
  }

  const { error: processingError } = await db
    .from('knowledge')
    .update({
      extraction_status: 'PROCESSING',
      extraction_error: null,
      extracted_text: null,
    })
    .eq('id', knowledgeId)
    .eq('created_by', user.id)
  if (processingError) {
    console.error(processingError)
    return jsonResponse({ error: 'Could not start PDF extraction' }, 500)
  }

  try {
    const { data: file, error: downloadError } = await db.storage
      .from('documents')
      .download(knowledge.file_url)
    if (downloadError || !file) throw new Error('The uploaded PDF could not be found.')

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (
      bytes.length !== knowledge.file_size_bytes ||
      bytes.length > MAX_FILE_SIZE ||
      !isPdf(bytes)
    ) {
      throw new Error('This file is not a valid PDF.')
    }
    if (!fileName(knowledge.file_meta).toLowerCase().endsWith('.pdf')) {
      throw new Error('This file is not a valid PDF.')
    }

    const keys = parseKeys(Deno.env.get('GEMINI_API_KEYS'))
    if (keys.length === 0) throw new Error('PDF extraction is not configured yet.')
    const markdown = await extractMarkdown(bytes, keys)
    const { error: readyError } = await db
      .from('knowledge')
      .update({
        extraction_status: 'READY',
        extracted_text: markdown,
        extraction_error: null,
      })
      .eq('id', knowledgeId)
      .eq('created_by', user.id)
    if (readyError) throw readyError
    return jsonResponse({ status: 'READY', knowledgeId })
  } catch (error) {
    console.error('Knowledge extraction failed', error)
    const message = errorMessage(error)
    await markFailed(db, knowledgeId, message)
    return jsonResponse({ status: 'FAILED', knowledgeId, error: message })
  }
})
