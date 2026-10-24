# Supabase Hackathon Foundation

This root directory is the only active Supabase project. The CLI and JavaScript SDK are
installed in `apps/client-console`; its scripts always pass `--workdir ../..`. Do not run
`supabase init` inside an app or create another config. The local `project_id` remains
`client-console` so the previously started Docker database is reused.

This is deliberately a one-day hackathon baseline, not production tenant security.
Most legacy foundation tables remain broad for the demo. Knowledge Base rows and
`documents/knowledge/<user-id>/...` objects are owner-scoped by the latest migration.
Anonymous callers cannot access those resources.
There are no invitations, extra roles, email confirmation steps, OTP login flows, or MFA.
Do not deploy sensitive or real customer data under these policies.

## Local Setup

Docker must be running. From the repository root:

```sh
cd apps/client-console
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm supabase:start
corepack pnpm supabase:migrate
corepack pnpm supabase:env
corepack pnpm dev
```

The first start downloads the service images selected by the pinned CLI. A fresh database
gets migrations during start; `supabase:migrate` also applies new migrations to an existing
database without resetting it. There are no predefined accounts or passwords: sign up normally.

`supabase:env` creates the ignored `apps/client-console/.env.local` from CLI status. It
writes only the API URL and publishable key (or legacy anon key), never the service-role
or secret key. It preserves an existing file. For a different environment, update the two
values using [.env.example](../apps/client-console/.env.example) as the template and restart Vite.

| Service                                  | Local address            |
| ---------------------------------------- | ------------------------ |
| API, Auth, Storage, and Edge Functions   | `http://127.0.0.1:54321` |
| Studio                                   | `http://127.0.0.1:54323` |
| Mailpit, if testing email features later | `http://127.0.0.1:54324` |
| Postgres                                 | `127.0.0.1:54322`        |

Local email/password signup immediately returns a session. Passwords need at least six
characters. No email inbox interaction is required. Do not expose the local development
stack to the public internet; Studio and other development tools are not production endpoints.

## Tables and Setup

| Table                         | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `auth.users`                  | Managed entirely by Supabase Auth; never insert users from browser SQL |
| `public.profiles`             | Auth user ID, name, email, and creation timestamp                      |
| `public.organizations`        | Name, creator profile ID, and creation timestamp                       |
| `public.organization_members` | Organisation/user pair, creation timestamp, and `SUPER_ADMIN` role     |

The migration's Auth trigger creates a profile on signup and synchronises name/email when
Auth metadata or email changes. Existing Auth users are backfilled when the migration runs.
Use `auth.signUp({ options: { data: { name } } })` or the auth repository so the name is populated.
Change Auth metadata with `supabase.auth.updateUser()` when editing the account name later.

`create_organization(organization_name)` inserts the organisation and the signed-in
creator's membership in one database transaction. Blank names are rejected when creating
an organisation. Only `SUPER_ADMIN` is accepted; it is also the default. The follow-up
migration limits each user to one organisation ownership and one membership. Retrying setup
returns the existing organisation instead of creating a duplicate; it does not rename it.
No email or membership invitations are implemented.

The frontend now implements `/sign-up`, `/sign-in`, `/setup`, and protected `/dashboard`
routes. It restores the SDK session, looks up the user's organisation, and sends users with
none to setup. Failed setup retries reuse that session. Lookup failures show retry rather
than pretending membership is absent. Signout returns to signin and clears user-specific
query data. Dashboard feature screens beyond this auth flow remain placeholders.

## Frontend Repository Standard

- Import the single typed SDK client from
  [client.ts](../apps/client-console/src/lib/supabase/client.ts). Do not create a client per
  component or add a second Auth/session implementation in Zustand.
- Put a feature's data access in `src/features/<feature>/repositories/` and export its
  public API through that feature's `index.ts`. Other features consume those exports.
- Repositories call Supabase, return data, and throw the original SDK error. Do not swallow
  failures, return fake success, or add abstract base repositories and generic CRUD classes.
- Keep UI state in components/Zustand and server-data caching in React Query. Hooks and
  services can compose repositories when a real feature needs that composition.
- Commit the generated database types and regenerate them after schema changes. Do not
  edit them by hand or substitute untyped table names to work around a type error.

Existing entry points:

```ts
import { authRepository } from "@/features/auth";
import { organizationRepository } from "@/features/organisation";
import { DOCUMENTS_BUCKET, supabase } from "@/lib/supabase/client";

const { user, session } = await authRepository.signUp({
  name,
  email,
  password,
});
const organization = await organizationRepository.create(organizationName);
const organizations = await organizationRepository.listForUser(user!.id);
const profile = await authRepository.getProfile(user!.id);
const users = await authRepository.listUsersWithOrganizations();

await authRepository.signIn(email, password);
await authRepository.signOut();
const currentSession = await authRepository.getSession();
const subscription = authRepository.onAuthStateChange((event, nextSession) => {
  // Connect this to the future auth UI.
});
subscription.unsubscribe();

const { data, error } = await supabase.storage
  .from(DOCUMENTS_BUCKET)
  .upload(path, file);
```

These are separate API examples, not one sequential UI flow. Handle nullable Auth results
and SDK errors in the consuming feature. The SDK persists and refreshes browser sessions.

## Storage

The migration creates the private `documents` bucket. Knowledge Base uploads are PDF-only,
limited to 10 MiB, and stored under `knowledge/<user-id>/<knowledge-id>/...`. Only the owner
may list, download, or delete those objects. Public download URLs do not work for this private
bucket; use authenticated downloads or signed URLs.
Files are not automatically removed when a profile or organisation is deleted. Feature
repositories should choose paths and perform their own file cleanup when those flows exist.

## Diagnostic Edge Function

[list-users-organizations](functions/list-users-organizations/index.ts) accepts `GET`,
validates the caller's bearer session with Supabase Auth, and returns:

```json
{
  "users": [
    {
      "id": "user-id",
      "name": "Example User",
      "email": "user@example.com",
      "created_at": "timestamp",
      "organizations": [
        {
          "id": "organization-id",
          "name": "Example Organization",
          "created_by": "user-id",
          "created_at": "timestamp",
          "role": "SUPER_ADMIN"
        }
      ]
    }
  ]
}
```

Users without memberships have an empty `organizations` array. This developer diagnostic
lists all profiles, not only the caller, and is intended for small hackathon datasets;
queries use the configured 1000-row API limit. It never returns passwords or Auth secrets.

The function uses the user's token and normal table policies, not an admin key. Gateway
`verify_jwt` is disabled intentionally: the handler performs the actual session validation,
including support for current Supabase signing keys. Do not remove that handler check.
Missing/invalid sessions return 401; non-GET methods return 405; CORS preflight is supported.

Local `supabase:start` serves the function. For active function development, run
`corepack pnpm supabase:functions` in another terminal. Shared Edge-only helpers belong
in `functions/_shared/`; frontend code must not import Deno modules. For a focused check:

```sh
corepack pnpm dlx deno check --config ../../supabase/functions/deno.json ../../supabase/functions/list-users-organizations/index.ts
```

## Challenge Generation Edge Function

[generate-challenges](functions/generate-challenges/index.ts) creates three Knowledge-based
Challenges from one of the caller's `READY` knowledge entries: two One-on-One calls and one
Boardroom (CEO, CTO, CFO). It accepts `POST { "knowledgeId": "uuid", "difficulty": "EASY" |
"MEDIUM" | "HARD" | null, "goal": "optional text" }`, inserts three inactive `PROCESSING`
placeholder rows and returns `202 { "status": "PROCESSING", "challengeIds": [...] }` right away.
`POST { "retryChallengeId": "uuid" }` regenerates one `FAILED` challenge. A repeated request
while a run is in progress returns the same IDs instead of starting another run.

In the background, one call to the AgenticOrg agent configured with
[prompts/challenge-generation/system-prompt.md](../prompts/challenge-generation/system-prompt.md)
designs all pending slots. [challenges.ts](functions/generate-challenges/challenges.ts) validates
the reply (format, participant count and roles, grounding excerpts that really appear in the
knowledge). Valid challenges are saved and activated; invalid ones get one more agent call if
time allows, then become `FAILED` with a short `generation_error`. A run still `PROCESSING` after
five minutes is treated as failed. The frontend polls every three seconds while any challenge is
generating.

Errors are `{ "error": "message" }`: 400 bad body, 401 no session, 404 missing knowledge or
challenge, 409 knowledge not ready or challenge already ready, 429 daily limit
(`CHALLENGE_GENERATION_DAILY_LIMIT`) or too many retries, 503 agent not configured. Product
facts stay in `product_context` and `configs.generation.grounding`, which buyers never see.
`ELEVENLABS_VOICE_POOL` gives generated buyers distinct voices.

Try the prompt directly, without Supabase, from the repo root:

```sh
node --env-file=supabase/functions/.env prompts/challenge-generation/test.ts
```

## Voice Call Edge Functions

[elevenlabs-agent-session](functions/elevenlabs-agent-session/index.ts) starts a practice call.
It accepts `POST { "challengeId": "uuid", "mode": "ASSIST" | "BATTLE" }` (mode defaults to the
challenge's), validates the bearer session like the diagnostic function, and returns:

```json
{
  "callSessionId": "uuid",
  "signedUrl": "wss://api.elevenlabs.io/...",
  "mode": "BATTLE",
  "challenge": {
    "id": "uuid",
    "title": "The Price Negotiator",
    "callType": "ONE_ON_ONE",
    "durationMinutes": 4
  },
  "participants": [
    {
      "id": "uuid",
      "name": "Priya Shah",
      "designation": "CFO",
      "company": "Northwind",
      "voiceLabel": "Priya",
      "lead": true
    }
  ],
  "dynamicVariables": { "user_name": "Example User" }
}
```

Errors are `{ "error": "message" }`: 400 bad body, 401 no session, 404 missing/inactive challenge
or another user's knowledge-based challenge, 409 an active call already exists, 422 not enough
participants, 502 ElevenLabs failed. Hidden motivations and objections are never returned.

Each challenge gets its own ElevenLabs agent, created on its first call start; nobody creates
agents in the dashboard. The function combines `BASE_AGENT` and the shared role-play rules in
[agent-config.ts](functions/elevenlabs-agent-session/agent-config.ts) with the challenge's persona,
participant voices (Boardroom stakeholders become multi-voice labels) and `duration_minutes` as
the provider-enforced call limit. It stores `{ agentId, configHash }` in
`challenges.configs.elevenlabs`, reuses the agent while the hash matches and patches it after a
challenge or base-setting change. Agents accept signed URLs only and allow no client overrides, so
the browser cannot read or change the persona. `product_context` is deliberately not given to
buyers.

The call itself runs over a WebSocket between the browser and ElevenLabs. The client needs
`@elevenlabs/react` (not installed yet):

```ts
const conversation = useConversation({ onMessage, onError });

await navigator.mediaDevices.getUserMedia({ audio: true });
const { data, error } = await supabase.functions.invoke(
  "elevenlabs-agent-session",
  {
    body: { challengeId, mode },
  },
);
if (error) throw error; // FunctionsHttpError: read the message with `await error.context.json()`
await conversation.startSession({
  signedUrl: data.signedUrl,
  connectionType: "websocket",
  dynamicVariables: data.dynamicVariables,
});
```

Request a new signed URL for every call. Sessions start as `CREATED`; an unfinished session stops
blocking new calls after its duration plus five minutes.

[elevenlabs-post-call](functions/elevenlabs-post-call/index.ts) receives ElevenLabs post-call
webhooks, verifies the `ElevenLabs-Signature` HMAC and writes the transcript, status, timing and
credits to the call session matched by `provider_session_id`. Saved turns are
`{ id, order, speaker, participantId, text, timeInCallSecs }` with stable `turn-<n>` IDs. Configure
the webhook in ElevenLabs workspace settings; locally it needs a tunnel such as
`cloudflared tunnel --url http://127.0.0.1:54321`, then `<tunnel>/functions/v1/elevenlabs-post-call`.

Both functions use the service-role client so they do not depend on browser table policies. Table
names live in [calls.ts](functions/_shared/calls.ts) and columns in
[db.ts](functions/elevenlabs-agent-session/db.ts); align them with the call feature migration. The
functions expect `participants.voice_configs` as `{ voiceId, stability?, similarityBoost?, speed? }`,
participants ordered lead first by `created_at`, and a unique index allowing one `CREATED`/`ACTIVE`
call session per user.

Copy [functions/.env.example](functions/.env.example) to `functions/.env` for
`corepack pnpm supabase:functions`. Checks, from `supabase/functions`:

```sh
npx -y deno check --config deno.json elevenlabs-agent-session/index.ts elevenlabs-post-call/index.ts
npx -y deno test --config deno.json --allow-env elevenlabs-agent-session elevenlabs-post-call
npx -y deno check --config deno.json generate-challenges/index.ts
npx -y deno test --config deno.json generate-challenges
# Creates and deletes a real agent; needs the API key and default voice in the environment.
ELEVENLABS_LIVE=1 npx -y deno test --config deno.json --allow-env --allow-net elevenlabs-agent-session/elevenlabs.live.test.ts
```

## Team Migration Workflow

All commands below run in `apps/client-console`:

```sh
corepack pnpm supabase migration new add_feature_table
# Edit the generated SQL under root supabase/migrations/.
corepack pnpm supabase:migrate
corepack pnpm supabase:types
corepack pnpm supabase db lint --local --level error
corepack pnpm check
```

Use snake_case SQL names and UUID relationships. Follow the initial migration's simple
authenticated policies for hackathon feature tables unless the team explicitly changes
the access model. Keep each feature's schema changes in its own timestamped migration.
Do not edit migrations already applied by teammates or rely on untracked Studio changes.

No reset is needed for normal work. `supabase db reset` destroys local data and replays
migrations/seeds; use it only when intentionally starting over. `supabase:stop` preserves
the local database for the next start. Do not use `--no-backup` when preserving data.

## Verification

```sh
corepack pnpm supabase:test
corepack pnpm check
corepack pnpm build
```

The local smoke test signs up temporary users, checks profiles, atomic setup, broad
authenticated access, private Storage, the Edge Function, invalid credentials, CORS,
signout, and signin. It removes its users, cascading organisations/memberships, and test
files afterward. It uses an admin key only inside the local Node process for cleanup,
never in the frontend. It refuses non-local API hosts. Ordinary Vitest repository tests
use mocks and do not require Docker or a running Supabase instance.

## Remote Later

No remote project has been changed. When ready, run these from `apps/client-console`:

```sh
corepack pnpm supabase login
corepack pnpm supabase link --project-ref YOUR_PROJECT_REF
corepack pnpm supabase db push --dry-run
corepack pnpm supabase db push
corepack pnpm supabase functions deploy list-users-organizations
corepack pnpm supabase secrets set --env-file ../../supabase/functions/.env
corepack pnpm supabase functions deploy extract-knowledge
corepack pnpm supabase functions deploy elevenlabs-agent-session
corepack pnpm supabase functions deploy elevenlabs-post-call
corepack pnpm supabase functions deploy generate-challenges
```

Enter credentials directly in your terminal when prompted. In the remote Auth dashboard,
enable email/password signup, disable email confirmation for the hackathon, and set the
actual console Site URL and allowed redirects. Local `config.toml` does not automatically
configure remote Auth. Point the frontend environment at that project's URL and publishable
key, then rebuild. The migration creates remote bucket metadata and policies, not local files.
Do not run the local smoke test against remote data.

Most legacy policies and the diagnostic expose hackathon data broadly. Replace them with
tenant isolation and restrict/remove the diagnostic before using real customer data or
treating this as a production deployment. Knowledge Base ownership is enforced by the latest
migration.

## Tool and Image Versions

The installed Supabase CLI was checked against the package registry: `2.121.0` was current
at setup time. `supabase services` matched the running Postgres, Auth, Storage, Realtime,
Edge Runtime, Studio, metadata, logging, and REST service versions. There is no single
"latest Supabase image"; the CLI selects a compatible set. Older cached images may remain
on the Mac but are not the running stack. Upgrade the pinned CLI deliberately, then follow
its local-upgrade guidance; do not switch individual services to unrelated `latest` tags.
