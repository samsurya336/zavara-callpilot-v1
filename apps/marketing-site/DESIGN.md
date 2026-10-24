# Callpilot Marketing Design Foundation

Follow the [client-console design guide](../client-console/DESIGN.md) for the common
visual language, not its application navigation shell, data views, or business functionality.
No final marketing composition, copy, screenshots, pricing, or claims are included yet.

## Sources

- [Theme tokens](src/styles/theme.css): app-local console-aligned colors, fonts, radii,
  shadows, and Tailwind semantic mappings.
- [Global styles](src/app/globals.css): typography, focus, responsive container, glass,
  reduced motion, and opaque fallback surfaces.
- [Root layout](src/app/layout.tsx): self-hosted fonts, metadata, and skip link.
- [Home page](src/app/page.tsx): minimal brand placeholder, not a finished landing page.

Do not import runtime styles or components from the console or original Meridian folder.
Coordinate intentional brand changes without introducing shared-package infrastructure.

## Visual Language

- Default to light with neutral near-white surfaces and near-black text. Preserve the
  console's quiet background treatment; avoid unrelated accent palettes and decorative orbs.
- Use Space Grotesk for headings and brand, Instrument Sans for body text and controls.
  Fonts are self-hosted. Keep tracking at zero and use fixed sizes at breakpoints, not
  viewport-scaled typography.
- Use semantic utilities: `bg-background`, `text-foreground`, `text-muted-foreground`,
  `bg-primary`, `border-border`, and `font-display`. Do not repeat raw colors in page components.
- Use glass sparingly: `.glass` has 20px blur and card shadow, `.glass-strong` has 24px blur,
  and `.glass-sheet` has 30px blur. Page sections remain unframed; do not nest decorative cards.
- The common radius is 20px with 8px through 28px tokens available. Controls can use the
  console's pill shape and 44px minimum target. Lucide outline icons use 1.75 stroke width.
  Icon-only actions need accessible names and tooltips.
- Status colors require genuine semantic meaning, not visual decoration. Never invent
  customer logos, testimonials, or performance claims to populate a design.

Dark tokens are available under `.dark`, including more opaque fallbacks when blur is
unsupported. No theme picker, persisted preference, system-theme script, or client provider
is included. Any future theme feature must preserve static rendering and avoid unreadable flashes.

## Mobile-to-Monitor Layout

This app is mobile-first from 320px to large monitors. Do not copy the console's fixed sidebar.

| Width            | Container horizontal padding | Maximum container width |
| ---------------- | ---------------------------- | ----------------------- |
| Below 640px      | 16px                         | 1280px                  |
| 640px to 1023px  | 24px                         | 1280px                  |
| 1024px to 1535px | 32px                         | 1280px                  |
| 1536px and above | 48px                         | 1440px                  |

`.page-container` is centered; maximum width includes padding. Use full-width section
backgrounds with constrained inner content. Wide-screen whitespace should grow outside
content rather than stretching paragraphs into long lines. The placeholder title is 32px,
increasing to 40px at 640px; this is not a final marketing heading scale.

Start new content in one column and add columns only when content fits. Keep reading copy
to a sensible measure, generally around 65 characters. Let long titles wrap. Give media
stable dimensions or aspect ratios; use approved real product assets rather than invented
UI or decorative stock media. Do not add marketing filler just to demonstrate components.

## Accessibility and Motion

- Preserve semantic landmarks, logical headings, and the skip link's `#main-content`
  target on every new page.
- Keep keyboard focus visible and interactive targets at least 44px. Links navigate;
  buttons perform commands. Do not add nonfunctional calls to action.
- Check text contrast on actual surfaces. Status needs a label, not color alone.
  Essential information cannot depend on hover.
- The optional `animate-fade-in` utility uses 250ms and an 8px settling movement. Use
  animation purposefully, not on every section. Reduced-motion preferences disable
  animation, transitions, and smooth scrolling.

## Scope and Review

Default to statically rendered Server Components. Zustand, React Query, Supabase,
ElevenLabs, form processing, and application workflows are intentionally absent.
Add dependencies when approved content or interaction needs them, not before.
Marketing layouts can be more expressive than the dashboard while retaining the brand.

Review the static export at 320px, 390px, 768px, 1440px, and 2560px. Check text wrapping,
horizontal overflow, media loading, keyboard navigation, reduced motion, and approved
claims. The minimal placeholder's responsiveness does not guarantee that future content fits.
