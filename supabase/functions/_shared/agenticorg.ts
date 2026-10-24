// Client for agents hosted on AgenticOrg. Each agent's system prompt lives on the platform (see
// prompts/); the app sends one JSON task and reads JSON back from the agent's output.
// No Deno APIs at module level, so Node dev scripts can import findJsonObject.

const DEFAULT_BASE_URL = 'https://agenticorg.hackathon.pinelabs.com'

export class AgenticOrgError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RunResponse {
  run_id?: string
  status?: string
  output?: unknown
  error?: unknown
}

export function agenticOrgConfigured(agentId: string | undefined) {
  return Boolean(agentId && Deno.env.get('AGENTICORG_API_KEY'))
}

export async function runAgent(agentId: string, input: unknown, timeoutMs: number) {
  const apiKey = Deno.env.get('AGENTICORG_API_KEY')
  if (!apiKey) throw new Error('AGENTICORG_API_KEY is not set')
  const base = (Deno.env.get('AGENTICORG_BASE_URL') || DEFAULT_BASE_URL).replace(/\/+$/, '')

  const response = await fetch(`${base}/api/v1/agents/${agentId}/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'process',
      inputs: { task: JSON.stringify(input) },
      context: {},
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new AgenticOrgError(
      response.status,
      `AgenticOrg agent ${agentId} failed with ${response.status}: ${text.slice(0, 300)}`,
    )
  }

  const data = JSON.parse(text) as RunResponse
  // A low-confidence run reports status "hitl_triggered" but still carries usable output.
  if (data.error) {
    throw new AgenticOrgError(
      502,
      `AgenticOrg run ${data.run_id} failed: ${JSON.stringify(data.error).slice(0, 300)}`,
    )
  }
  return { runId: data.run_id ?? null, status: data.status ?? null, output: data.output }
}

function parseJsonText(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) return undefined
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return undefined
  }
}

// The agent may return its JSON directly, as a JSON string, or nested inside another field.
export function findJsonObject(
  value: unknown,
  matches: (object: Record<string, unknown>) => boolean,
  depth = 0,
): Record<string, unknown> | undefined {
  if (depth > 4 || value == null) return undefined
  if (typeof value === 'string') return findJsonObject(parseJsonText(value), matches, depth + 1)
  if (typeof value !== 'object') return undefined
  if (!Array.isArray(value) && matches(value as Record<string, unknown>)) {
    return value as Record<string, unknown>
  }
  for (const child of Object.values(value)) {
    const found = findJsonObject(child, matches, depth + 1)
    if (found) return found
  }
  return undefined
}
