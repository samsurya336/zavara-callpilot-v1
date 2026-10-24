# Callpilot Marketing Site

Standalone Next.js App Router scaffold with TypeScript and Tailwind CSS v4. Pages are
prerendered at build time and exported as static files. No Next.js application server,
database, authentication, or business logic is required in production.

Only a small branded placeholder is included. Add approved designs, content, and pages
without removing a prebuilt landing page. Read [DESIGN.md](DESIGN.md) before changing visuals.

## Getting Started

```sh
cd apps/marketing-site
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Use Node 22.12+ within the Node 22 release line. pnpm 10.28.0 is pinned in `packageManager`.
Run commands in this directory, not the repository root. The dev server normally uses
http://localhost:3000 and selects another port if occupied. There is no root workspace
dependency or runtime import from the client console.

## Commands

| Command                      | Purpose                                            |
| ---------------------------- | -------------------------------------------------- |
| `corepack pnpm dev`          | Start the Next.js development server               |
| `corepack pnpm build`        | Prerender and export into `out/`                   |
| `corepack pnpm preview`      | Serve the existing `out/` as static files          |
| `corepack pnpm start`        | Same static preview; deliberately not `next start` |
| `corepack pnpm typecheck`    | Generate route types and check TypeScript          |
| `corepack pnpm lint`         | Next.js and relaxed TypeScript ESLint rules        |
| `corepack pnpm format`       | Apply Prettier formatting                          |
| `corepack pnpm format:check` | Check formatting without rewriting                 |
| `corepack pnpm check`        | Typecheck, lint, and check formatting              |

Build before previewing; preview serves the last build, not live edits. Prettier matches
the console: two spaces, single quotes, no semicolons, and a 100-column target. ESLint
retains Next.js and React Hooks checks, permits explicit `any`, and warns on unused variables
while allowing underscore-prefixed parameters. No test framework is included for this
behavior-free scaffold; add focused coverage when introducing interactions.

## Source Layout

```text
src/
	app/
		layout.tsx           Shared document, self-hosted fonts, and default metadata
		page.tsx             Minimal home page; replace with approved content
		globals.css          Tailwind, base styles, glass, and responsive container
	styles/
		theme.css            App-local Meridian tokens and semantic utilities
next.config.ts           Static export and image configuration
```

`@/` resolves to `src/`. Keep new components near their pages. Create shared component
folders when needed rather than pre-creating empty state, API, and service layers.

## Adding Pages and Assets

- Create `src/app/about/page.tsx` for `/about/`, or another App Router page for the desired
  route. Default to Server Components. Use client components only for browser interaction;
  they must still prerender without reading browser globals during render.
- Use `next/link` for internal navigation and page-specific `metadata` for titles and
  descriptions. Set the real production URL before adding canonical, sitemap, robots,
  or Open Graph URLs; this scaffold does not invent a domain.
- Add approved assets to `public/` when needed and reference them from `/`. Provide stable
  dimensions or aspect ratios and descriptive alt text. Fonts are self-hosted Fontsource
  packages, with no Google Fonts request during build or rendering.
- `next/image` uses `unoptimized: true`, so no server-side image optimizer is needed.
  Supply compressed, appropriately sized images and responsive `sizes` where appropriate.

## Static Export Contract

The config sets `output: 'export'`, `trailingSlash: true`, and `images.unoptimized: true`.
Build emits `out/index.html`, `out/404.html`, assets, and statically known pages.
There is no separate `next export` step and no production Next.js process.

- Dynamic route segments need `generateStaticParams()` for every exported path; there
  is no on-demand route generation after deployment.
- Build-time content fetching is allowed. Changed content requires rebuilding and
  deploying; ISR and request-time rendering are not supported by this export.
- Do not add Server Actions, request-time cookies/headers, server-dependent API routes,
  authentication callbacks, or an image optimizer. Future dynamic backends must be
  separate deployments and explicit scope decisions.
- Configure redirects, rewrites, and response headers at the static host. Serve directory
  index files and the exported 404; do not rewrite every unknown URL to the homepage.
- No environment variables are required. `NEXT_PUBLIC_*` values are embedded in public
  browser assets at build time; never put secrets there.

## Deployment and Verification

Set the deployment root to `apps/marketing-site`, use the pinned Node/pnpm versions,
install with `corepack pnpm install --frozen-lockfile`, build with `corepack pnpm build`,
and publish **`out/`**, not `.next/`. Any static host supporting directory indexes can
serve the export without Node installed on the host.

Run `corepack pnpm check` and `corepack pnpm build` before publishing. Preview `out/`
and check routes, 404 responses, assets, keyboard navigation, and overflow at 320px,
390px, 768px, 1440px, and 2560px. Validate the production export, not only the dev server.
