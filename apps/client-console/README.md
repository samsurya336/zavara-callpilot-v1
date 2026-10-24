# Callpilot Client Console

Independent frontend application within the repository. Run commands from this directory;
no root workspace installation, shared package, or monorepo build orchestrator is required.

See [the console design guide](DESIGN.md) for the established look and feel, tokens,
responsive layouts, component patterns, and guidance for future screens.

## Getting Started

```sh
cd apps/client-console
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm supabase:start
corepack pnpm supabase:migrate
corepack pnpm supabase:env
corepack pnpm dev
```

Requires Node 22.12+ within the Node 22 release line. The app pins pnpm 10.28.0 through
`packageManager`. Corepack ships with the supported Node installation; `corepack pnpm`
also works when the `pnpm` shim is not enabled or another Node installation has its own pnpm.
The development server prints its local URL, normally http://localhost:5173.

## Stack

React 19, Vite, TypeScript 5.9, Tailwind CSS v4 with its Vite plugin, Zustand,
TanStack React Query, shadcn/ui (Radix), Lucide, and tw-animate-css.
TypeScript 5.9 is intentional: the scaffold's TypeScript 7 release is not supported by
the installed typescript-eslint peer range. The lockfile records the working dependency set.
React Compiler is not enabled; no extra compiler configuration is required.

## Commands

| Command                      | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `corepack pnpm dev`          | Start Vite; uses another port if the default is occupied |
| `corepack pnpm build`        | Typecheck and produce `dist/`                            |
| `corepack pnpm preview`      | Serve the production build locally                       |
| `corepack pnpm typecheck`    | Check application and tooling TypeScript                 |
| `corepack pnpm lint`         | ESLint recommended TypeScript and React rules            |
| `corepack pnpm test`         | Run unit and integration tests once                      |
| `corepack pnpm test:watch`   | Watch tests during development                           |
| `corepack pnpm format`       | Apply the shared app-local Prettier style                |
| `corepack pnpm format:check` | Check formatting without rewriting                       |
| `corepack pnpm check`        | Typecheck, lint, test, and check formatting              |

ESLint permits explicit `any`, warns on unused variables, ignores underscore-prefixed
unused parameters, and leaves stylistic rules to Prettier. React Hooks correctness rules
remain enabled. Prettier uses two spaces, single quotes, no semicolons, and a 100-column target.
Configure your editor to use this app's local Prettier installation for format-on-save.

## Source Layout

```text
src/
  app/providers.tsx              React Query client and theme lifecycle
  components/layout/            Responsive shell and navigation
  components/ui/                Locally owned shadcn components
  features/workspace/            Starter screens and appearance settings
  lib/utils.ts                  cn(): clsx plus tailwind-merge
  stores/ui-store.ts            Persisted UI preferences, temporary navigation
  styles/theme.css              Meridian tokens and Tailwind v4 mappings
  styles/layout.css             Mobile/tablet/desktop layout and navigation drawer
  test/setup.ts                 jsdom matchMedia and Testing Library cleanup
```

Use `@/` for imports from `src/`. Keep future product code in feature folders as needed;
do not pre-create empty service, API, or shared-package layers. Server state belongs in
React Query; local UI state belongs in Zustand. The QueryClient is created once per app
mount with a one-minute stale time and one query retry; mutations retain library defaults.

Tests are colocated with source and use Vitest, jsdom, and Testing Library. They cover
class merging, preference persistence, navigation/focus, sidebar controls, and theme changes.

## Meridian Responsive Adaptation

The source reference is `../../brain-junkyard/meridian-design-system/`. Its source files
are unchanged. This application owns its adapted tokens; it does not import runtime files
from the reference folder.

- Preserve neutral colors, restrained status colors, frosted surfaces, rounded controls,
  Space Grotesk headings, and Instrument Sans body text. Fonts are self-hosted dependencies.
- Default to light; offer light, dark, and OS-following system themes. Persist appearance
  and sidebar preferences in localStorage, not account data or secrets.
- Mobile, tablet, and desktop are equally supported, starting at 320px. Below 768px use
  the full content width with a labelled, focus-managed navigation drawer; do not reserve
  a permanent phone rail. All enabled destinations, Settings, and signout remain reachable.
- Use an 80px rail at 768-1199px and the full 248px sidebar at 1200px and above, with a
  manual 80px collapse option on desktop. Stack phone content and statistics; expand grids
  as space allows. Close the drawer on navigation or resizing to tablet/desktop.
- Provide at least 44px touch targets, 16px phone input text, safe-area-aware spacing,
  and scrollable short-screen forms. Hover cannot be the only way to discover an action.
- Keep text sizes fixed rather than viewport-scaled. Increase low-opacity secondary text
  for readability, use zero letter spacing, provide keyboard focus and icon tooltips, and
  respect reduced-motion preferences. Provide an opaque fallback when glass blur is unavailable.
- Apply health-specific labels and medical disclaimers nowhere: those belong to Meridian's
  original domain, not Callpilot. Status colors must retain meaningful labels when introduced.

Every new feature must follow the responsive contract in [DESIGN.md](DESIGN.md). Check
320px/390px phones, 768px/1024px tablets, 1440px desktop, wide monitors, and landscape/short
viewports. Verify both themes, touch/keyboard navigation, drawer dismissal and focus, long
labels, forms, and local table scrolling without page-wide overflow. Mobile is not a fallback.

Add further shadcn components from this directory:

```sh
corepack pnpm dlx shadcn@latest add dialog
```

Review generated output: components belong in `src/components/ui`, and `cn` imports must
use `@/lib/utils`, not a separate `cn` npm package. Keep the aliases in both TypeScript configs
for CLI compatibility. Preserve the Meridian token values rather than replacing the theme.

## Current Scope and Deployment

Email/password signup, signin, organisation setup, protected dashboard access, session
restoration, and signout are connected to local Supabase. Routes are `/sign-in`, `/sign-up`,
`/setup`, and `/dashboard`. Signed-in users without an organisation go to setup; users
with an organisation cannot create another through setup. Database uniqueness also limits
each user to one organisation ownership and one membership.

The Supabase SDK owns token persistence and refresh. A small non-persisted React auth
context observes its session; React Query loads the organisation. No duplicate Zustand auth
store is needed. Switching users or signing out clears cached server data and resets the
dashboard's internal navigation. Dashboard feature views still use local navigation state;
their numbers remain empty-state placeholders. Challenge creation, calls, and ElevenLabs
are not implemented.

See [the Supabase team guide](../../supabase/README.md) for local setup, migrations,
repositories, smoke tests, and remote deployment. Docker is required for the local backend.
The SDK client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local`;
`supabase:env` generates these without overwriting an existing file. Never put privileged
Supabase keys or provider secrets in `VITE_*` variables: they are public browser configuration.

Use `corepack pnpm supabase:migrate` after pulling schema changes, then regenerate database
types with `corepack pnpm supabase:types`. `corepack pnpm supabase:test` checks the actual
local stack; ordinary unit tests require no backend. `corepack pnpm supabase:stop` stops
local services while preserving database data. The only canonical config is root `supabase/`.

Deploy this app independently with `apps/client-console` as the project root, the pinned
Node/pnpm versions, `corepack pnpm install --frozen-lockfile`, `corepack pnpm build`, and
`dist/` as the output directory. Configure the frontend host's SPA fallback to serve
`index.html` for application paths such as `/dashboard` and `/sign-in`, so direct visits
and refreshes work. Supabase remains a separate backend at the repository root.
