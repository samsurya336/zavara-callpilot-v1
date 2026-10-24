// Sends a generation request to the challenge-generation agent and validates the reply with the
// same checks the generate-challenges Edge Function uses.
// Reads AGENTICORG_API_KEY, AGENTICORG_BASE_URL and AGENTICORG_CHALLENGE_AGENT_ID from
// supabase/functions/.env.
// Usage (from the repo root):
//   node --env-file=supabase/functions/.env prompts/challenge-generation/test.ts [request.json]
// Defaults to example-request.json.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type GenerationRequest,
  parseAgentOutput,
  type Slot,
} from "../../supabase/functions/generate-challenges/challenges.ts";

const here = dirname(fileURLToPath(import.meta.url));
const BASE =
  process.env.AGENTICORG_BASE_URL ||
  "https://agenticorg.hackathon.pinelabs.com";
const AGENT_ID = process.env.AGENTICORG_CHALLENGE_AGENT_ID;
const API_KEY = process.env.AGENTICORG_API_KEY;
const requestPath = process.argv[2] ?? join(here, "example-request.json");

const log = (...args: unknown[]) =>
  console.log(`[${new Date().toISOString()}]`, ...args);

if (!API_KEY || !AGENT_ID) {
  console.error(
    "AGENTICORG_API_KEY or AGENTICORG_CHALLENGE_AGENT_ID is missing; set them in supabase/functions/.env",
  );
  process.exit(1);
}

const input = JSON.parse(readFileSync(requestPath, "utf8"));
// The agent input uses snake_case; the validator takes the Edge Function's request shape.
const request: GenerationRequest = {
  slots: input.slots.map(
    (slot: { slot: number; call_type: string; angle: string }): Slot => ({
      slot: slot.slot,
      callType: slot.call_type === "boardroom" ? "BOARDROOM" : "ONE_ON_ONE",
      angle: slot.angle,
    }),
  ),
  difficulty: input.difficulty,
  goal: input.user_goal,
  avoidTitles: input.avoid_titles,
  knowledge: input.knowledge,
};

const url = `${BASE}/api/v1/agents/${AGENT_ID}/run`;
log(`POST ${url}`);
const startedAt = Date.now();
const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "process",
    inputs: { task: JSON.stringify(input) },
    context: {},
  }),
  signal: AbortSignal.timeout(180_000),
});
const text = await response.text();
log(
  `Response ${response.status} ${response.statusText} in ${Date.now() - startedAt}ms`,
);
if (!response.ok) {
  log("Error body:", text);
  process.exit(1);
}

const data = JSON.parse(text);
log("status:", data.status, "| confidence:", data.confidence);
const rawPath = join(here, "last-response.json");
writeFileSync(rawPath, JSON.stringify(data, null, 2));
log(`Full response saved to ${rawPath}`);

const parsed = parseAgentOutput(data.output, request);
if (parsed.kind !== "challenges") {
  log(`Agent returned ${parsed.kind}`);
  process.exit(1);
}

for (const item of parsed.valid) {
  const { challenge, participants } = item;
  console.log(`\n--- Slot ${item.slot}: ${challenge.title} ---`);
  console.log(
    `${challenge.call_type} · ${challenge.difficulty} · ${challenge.duration_minutes} min · ${challenge.category}`,
  );
  console.log(`Scenario:  ${challenge.scenario}`);
  console.log(`Objective: ${challenge.objective}`);
  for (const person of participants) {
    console.log(`  ${person.name}, ${person.designation} at ${person.company}`);
    console.log(`    Hidden: ${person.hidden_motivation}`);
    console.log(`    Objections: ${person.objections.join(" | ")}`);
  }
  console.log(`Grounded excerpts: ${item.grounding.length}`);
}

console.log("\n--- Checks ---");
for (const item of parsed.valid) console.log(`PASS  slot ${item.slot}`);
for (const { slot, reason } of parsed.invalid)
  console.log(`FAIL  slot ${slot}: ${reason}`);
console.log(
  "\nCheck by eye: buyer-visible fields (scenario, objections, hidden motivation) must not " +
    "contain prices, features or integrations from the document.",
);
process.exit(parsed.invalid.length > 0 ? 1 : 0);
