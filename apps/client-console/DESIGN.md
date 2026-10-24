# Callpilot Client Console Design

This is the app-local design reference for `apps/client-console`. Preserve the existing
look and feel when adding screens or components; extend the system rather than introducing
a new visual direction for each feature.

The console adapts [Meridian](../../brain-junkyard/meridian-design-system/DESIGN.md) from a
mobile health application into a mobile-first, fully responsive sales practice workspace. Inherit its visual
language, not its medical terminology, mobile navigation, or health-specific components.

## 1. Sources of Truth

| Source                                                                           | Owns                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [Theme CSS](src/styles/theme.css)                                                | Runtime colors, fonts, radii, glass, motion, and Tailwind mappings |
| [Layout CSS](src/styles/layout.css)                                              | Shell dimensions, spacing, breakpoints, and navigation states      |
| [Console shell](src/components/layout/console-shell.tsx)                         | Brand, navigation, toolbar, tooltips, and focus behavior           |
| [Workspace screens](src/features/workspace/console-page.tsx)                     | Overview, destination cards, empty states, and appearance settings |
| [Knowledge Base](src/features/knowledge) and [its CSS](src/styles/knowledge.css) | Knowledge list, status labels, add dialog, and details sheet       |
| [UI components](src/components/ui)                                               | Locally owned shadcn primitives                                    |
| [Providers](src/app/providers.tsx) and [UI store](src/stores/ui-store.ts)        | Theme application and persisted appearance preferences             |

The code defines the currently rendered values. Keep this document and the implementation
aligned when intentionally changing the design. The original Meridian reference stays separate;
the application does not import runtime styles from the reference folder

## 2. Design Principles

- **Quiet, work-focused, and precise.** This is a usable console, not a marketing page.
  Make repeated navigation, scanning, comparison, and action feel predictable.
- **Monochrome by default.** Near-black text, near-white surfaces, and neutral hierarchy
  carry the interface. Color communicates meaningful state, not decoration.
- **Glass with restraint.** Frosted surfaces add depth to navigation and repeated items.
  Use open layouts and hairline dividers for page sections; do not turn everything into a card.
- **Clear hierarchy, not oversized type.** Page titles, numbers, labels, and metadata each
  have a role. Do not introduce hero-scale headings inside the console.
- **Mobile, tablet, and desktop are first-class.** Start with a usable small-screen layout,
  then expand navigation, spacing, and columns as space allows. Every feature must work on
  touch screens and with a keyboard; mobile is not a reduced-functionality fallback.
- **Both themes matter.** Light is the default. Dark and system-following appearance are
  supported, not separate visual identities.
- **Honest states.** Empty data is empty data. Do not fabricate scores, sessions, activity,
  successful actions, or loading outcomes to make a screen look populated.

## 3. Color and Theme

Use semantic utilities such as `bg-background`, `text-foreground`, `text-muted-foreground`,
`border-border`, and `bg-primary`. Do not duplicate raw colors inside feature components.

### Core Tokens

| Token                                | Light                 | Dark                     |
| ------------------------------------ | --------------------- | ------------------------ |
| `--background`                       | `#f4f5f8`             | `#0b0c0f`                |
| `--foreground`                       | `#0e1013`             | `#f3f5f7`                |
| `--primary`                          | `#101317`             | `#f3f5f7`                |
| `--primary-foreground`               | `#ffffff`             | `#0e1013`                |
| `--muted`, `--secondary`, `--accent` | `rgb(14 16 19 / 5%)`  | `rgb(255 255 255 / 7%)`  |
| `--muted-foreground`                 | `rgb(14 16 19 / 65%)` | `rgb(243 245 247 / 68%)` |
| `--text-tertiary`                    | `rgb(14 16 19 / 60%)` | `rgb(243 245 247 / 62%)` |
| `--border`                           | `rgb(14 16 19 / 8%)`  | `rgb(255 255 255 / 8%)`  |
| `--input`                            | `rgb(14 16 19 / 14%)` | `rgb(255 255 255 / 16%)` |
| `--ring`                             | `rgb(14 16 19 / 50%)` | `rgb(243 245 247 / 55%)` |

The page background is a subtle vertical gradient from `#f8f9fb` to `#eef0f3` in light
mode. Dark mode uses the existing restrained radial background from `#16202e` to `#0b0c0f`.
Keep these backgrounds quiet; do not add decorative orbs, illustrations, or bright brand gradients.
The `--desk` token is available but is not a requirement to wrap the console in a device frame.

Text opacity is deliberately stronger than the original mobile Meridian reference. Do not
copy its fainter text values back into the console. Verify contrast on the actual composited
surface instead of assuming that a token automatically guarantees accessibility.

### Status Tokens

| Existing token        | Default value          | Reserved visual role                  |
| --------------------- | ---------------------- | ------------------------------------- |
| `--status-normal`     | `oklch(0.68 0.16 158)` | Positive or successful state          |
| `--status-borderline` | `oklch(0.74 0.14 78)`  | Warning or attention                  |
| `--status-high`       | `oklch(0.62 0.19 26)`  | Error or destructive state            |
| `--status-low`        | `oklch(0.62 0.13 252)` | Informational state where appropriate |

These token names come from Meridian, not a Callpilot scoring rubric. The current shell
does not establish colored score thresholds. Decide product-specific meanings explicitly
before adding them; never equate a practice score with actual purchase probability.
Pair status color with a clear word or icon and accessible label. Derive subtle tints with
`color-mix` rather than creating unrelated accent colors. The existing `data-status="muted"`
palette is available in CSS; there is no user-facing palette selector today.

Theme selection is `light`, `dark`, or `system`. Apply dark mode through `.dark` on the
document root. System mode follows OS changes. Persist theme and sidebar preferences in
the UI store; do not persist account data or secrets there.

## 4. Typography

Fonts are self-hosted through Fontsource and loaded in [the entry point](src/main.tsx).

- **Space Grotesk:** brand, headings, prominent numbers, and initials. Use `font-display`
  when the element is not already an `h1`, `h2`, or `h3`.
- **Instrument Sans:** navigation, body copy, labels, metadata, and controls.
- Keep letter spacing at `0`. Do not restore Meridian's original negative tracking.
- Use fixed sizes and breakpoint-specific changes, not viewport-scaled type.

| Role                             | Current treatment                   |
| -------------------------------- | ----------------------------------- |
| Page heading                     | 30px / 600 / 1.25; 26px below 768px |
| Overview metric                  | 28px / 600 / tight line height      |
| Brand name                       | 22px / 700 / 1.15                   |
| Section heading                  | 18px / 600                          |
| Destination or empty-state title | 16px / 500-600                      |
| Body, toolbar, primary labels    | 14px                                |
| Navigation                       | 13px / 500                          |
| Supporting metadata              | 12px                                |
| Uppercase section label          | 11px / 600 / tertiary color         |
| Brand byline                     | 11px                                |

Reserve the existing 10px treatment for the nonessential "Soon" marker. Do not use it
for body copy or meaningful values. Paragraphs use `text-wrap: pretty`. Wrap content naturally;
use truncation only where the full value remains available or is not essential.

## 5. Layout and Responsiveness

The shell fills the viewport without an outer device frame. Phones use the full content
width, not a permanent icon rail. Tablet and desktop use a fixed navigation column and a
`minmax(0, 1fr)` content column. Their sidebar is sticky, independently scrollable, and
`100dvh` tall. The toolbar sits above the content; it is not currently sticky.

| Viewport         | Navigation                                                               | Main padding                               | Toolbar                                      | Content grids                                   |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------- | ----------------------------------------------- |
| 320px to 767px   | Labelled modal drawer opened by the menu icon; no reserved sidebar width | 24px top, 16px sides, at least 32px bottom | Minimum 72px tall; 12px sides; 44px controls | Single column; stacked statistics with dividers |
| 768px to 1199px  | 80px icon rail                                                           | 32px                                       | Minimum 80px tall; 28px horizontal padding   | Three columns where the current content fits    |
| 1200px and above | 248px sidebar, manually collapsible to 80px                              | 42px top, 44px sides, 56px bottom          | Minimum 80px tall; 36px horizontal padding   | Three columns                                   |

The main content area is centered with a maximum width of 1360px, including its padding.
On tablet, hide rail labels and the manual collapse control; keep accessible names and
tooltips. On mobile, show the full labels inside the drawer. Desktop collapse preference
must not reserve a rail on phones or suppress drawer labels. The minimum supported width
is 320px; larger phones, tablet portrait/landscape, laptops, and wide monitors are supported.

### Mobile Navigation and Touch

The mobile drawer uses the same destinations and account identity as the sidebar, with a
maximum width of 320px and at least 24px of backdrop visible on the smallest supported
phone. It uses the sheet surface, full dynamic viewport height, independent scrolling,
and safe-area padding where the browser supplies insets.

- The menu and close controls are named 44px icon buttons. The dialog has an accessible
  title, traps keyboard focus, and prevents interaction with the page behind it.
- Selecting a destination closes the drawer and focuses the main content. Escape, the
  close control, and backdrop dismissal return focus to the menu trigger.
- Moving to tablet/desktop closes the drawer so a hidden mobile menu cannot leave the
  body locked. Drawer open state is temporary, not a persisted UI preference.
- Keep theme selection, signout, Settings, and every enabled destination usable on phones.
  Context badges may hide at small widths, but essential actions must not disappear.
- Do not depend on hover to reveal information or actions. Card lift-on-hover applies
  only to fine-pointer devices; touch users can act without a hover state.

### Responsive Feature Contract

These requirements apply to every new feature, not only the existing dashboard:

- Start with one column. Add columns at content-appropriate breakpoints; do not squeeze
  desktop components into a narrow container merely because a grid breakpoint exists.
- Keep primary page actions comfortably reachable; the current phone overview gives its
  primary action a full-width row. Allow headings and action groups to wrap without overlap.
- Forms use visible labels, full-width controls, and readable error messages. Phone inputs
  use at least 16px text to avoid iOS focus zoom. Let pages scroll when the keyboard opens;
  do not lock a form to a fixed height or place its submit action behind browser chrome.
- Dense tables must use an intentional stacked representation or a labelled, locally
  scrollable region. Never create page-wide horizontal overflow or hide essential fields
  just to fit a phone. Charts, media, and long identifiers must fit their container too.
- Dialogs, menus, and sheets must fit the available viewport, scroll internally when needed,
  and keep dismissal and actions reachable. Test short-height and landscape screens.
- Maintain at least 44px touch targets, visible focus, status labels, and the same feature
  capabilities on all supported widths. No mobile-specific loss of essential functionality.

### Spacing Rhythm

- Use a 4px-based rhythm, following nearby components rather than introducing a new scale.
- Page heading groups wrap with a 24px gap rather than squeezing the title against an action.
- Major overview sections are separated by 40px; section headings generally have 20px below.
- Repeated destination cards have 16px gaps and 24px padding, reduced to 20px below 1200px.
- The statistics band begins 36px below the heading, has 26px vertical padding, and uses
  hairline top/bottom rules. Columns use 28px inset spacing and vertical dividers on wider screens.
- Navigation rows have a minimum height of 46px, 12px icon/text gaps, and 4px separation.
- Phone content uses 16px horizontal gutters and safe-area-aware vertical padding. Do not
  reserve desktop navigation space or fixed desktop offsets in mobile feature pages.

Keep grids and controls dimensionally stable. Dynamic labels, loading states, and hover
styles must not resize neighboring elements or introduce horizontal page scrolling.

## 6. Surfaces, Radius, and Elevation

| Surface         | Treatment                                               | Existing use                                                       |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `.glass`        | 20px blur, 150% saturation, glass border, card shadow   | Repeated workspace destination cards                               |
| `.glass-strong` | 24px blur, 160% saturation, glass border                | Sidebar; does not automatically add a floating shadow              |
| `.glass-sheet`  | 30px blur, 160% saturation, sheet fill and glass border | Mobile navigation drawer, Knowledge Base dialogs and details sheet |

Light glass is 66% white with a 90% white highlight border. Dark glass is 5.5% white
with a 9% white border. Strong glass uses 78% white in light mode and 72% `rgb(24 26 31)`
in dark mode. Keep shadows soft and neutral; use the existing card, float, and CTA tokens.
Where blur is unsupported, the theme supplies more opaque glass and strong-glass fills.

| Shape                                          | Current radius |
| ---------------------------------------------- | -------------- |
| Workspace destination card                     | 20px           |
| Navigation row and brand mark                  | 12px           |
| Icon tile                                      | 13px           |
| Primary console action and appearance segments | Fully rounded  |
| Toolbar icon button and workspace avatar       | Circular       |

The theme also exposes 8px, 12px, 16px, 20px, 24px, 26px, and 28px radius tokens for
appropriately sized future components. These are available tokens, not a reason to use the
largest radius everywhere. Preserve Meridian's existing rounded cards rather than replacing
them with generic square dashboard panels.

Page sections remain unframed. Do not nest decorative cards inside other cards or surround
an entire page with a floating glass container. Use dividers for statistics, lists, and sections.

## 7. Component Patterns

### Navigation and Brand

Keep the `AudioLines` mark, lowercase `callpilot` wordmark, and quiet "by Zavara" byline.
The mark is 38px square; the footer avatar is 36px. Do not invent a new logo for each screen.

Active navigation uses solid primary fill and primary-foreground text. Inactive rows are
neutral; hover adds muted fill. Group workspace items separately from Practice World.
Settings stays in the footer. Coming-soon destinations are visibly disabled and named as such;
do not present them as working features.

Keep fictional Practice World clients distinct from any future real-client workflows.
Navigation terminology must follow the [product context](../../ABOUT-PROJECT.business.md).

### Buttons, Icons, and Badges

Use local shadcn primitives instead of recreating controls per feature. The console's main
CTA is 44px tall, pill-shaped, with an icon and concise command text. Toolbar icon buttons
are 44px circles. Neutral secondary actions use ghost or secondary treatments.

shadcn's unmodified primitive defaults can be smaller and more rectangular; apply the
console's size and shape at the call site. Do not assume every generated button already
meets the application treatment or minimum target size.

Use Lucide outline icons, generally 16-24px with a 1.75 stroke width. Icons inherit text
color and do not shrink. Decorative icons are hidden from assistive technology. Icon-only
actions require accessible names and tooltips; familiar actions should not become long text pills.

Badges communicate brief context, not primary actions. The toolbar's neutral Practice World
badge is not a status indicator. Do not add colored badges solely to make a layout less neutral.

### Cards, Metrics, and Empty States

Destination cards have a 44px muted icon tile, a quiet context label, a 16px title, and an
upper-right arrow. The whole card is the target. Do not hide another interactive control inside it.

Metric bands prioritize numbers with compact labels and supporting context. They are open
layouts with dividers, not a row of nested glass cards. Missing scores display "Not scored",
not a misleading zero score.

Empty states use a centered neutral icon tile and a short factual heading. The shared layout
has a 188px minimum height; standalone empty pages request more space. The current overview
contains placeholder zeros and empty sessions, not live analytics. Replace these with real
loading, error, and empty states when data is connected; do not leave placeholders masquerading
as fetched results.

### Appearance Settings

Use the current segmented light/dark/system selector: muted rounded track, primary selected
segment, icon plus label. It is a native radio group with a fieldset and legend, not three
unrelated command buttons. Retain keyboard interaction and visible focus.

## 8. Motion and Interaction

| Interaction           | Existing behavior                                                       |
| --------------------- | ----------------------------------------------------------------------- |
| Page content entrance | 250ms fade with an 8px upward settling movement                         |
| Destination hover     | Fine pointers only: 180ms transition; move up 3px and strengthen border |
| Navigation hover      | 150ms background transition                                             |
| Shared easing         | `cubic-bezier(0.2, 0.8, 0.2, 1)`                                        |

Keep motion brief and purposeful. No bounce, perpetual decoration, flashing metrics, or
large animated background elements. `prefers-reduced-motion` disables animations, transitions,
and smooth scrolling. Importing `tw-animate-css` does not justify adding animation to every control.

## 9. Accessibility and Content

- Preserve the skip-to-content link, semantic landmarks, logical headings, and `aria-current`
  on the active destination. Page changes move focus to the main content region.
- Maintain visible keyboard focus. Standard controls use the theme ring; appearance radios
  expose a focus ring through their visible segment. Do not remove focus styling for aesthetics.
- Target at least 44px for interactive controls. Check both pointer and keyboard workflows.
- Verify at least 4.5:1 contrast for normal text on its actual light and dark surfaces.
  Check focus indicators and essential UI boundaries as well; decorative hairlines are not
  substitutes for accessible control boundaries.
- Never communicate status only through color or leave an icon-only control unnamed.
- Use sentence case, short labels, and calm, factual language. Preserve established product
  names such as "Practice World", "Knowledge Base", and "My Sessions".
- Do not copy medical disclaimers, health ranges, hospital terminology, or wellness advice
  from the source Meridian design system.
- Do not describe implementation details, styling, keyboard shortcuts, or the application's
  feature set in visible filler text. Keep developer guidance in documentation.

## 10. Extending the Console

Guidance in this section applies to future features; it does not imply they are implemented.

Reuse the shell, tokens, fonts, and shadcn primitives for forms, dialogs, tables, and detail
screens. Keep labels outside inputs, use familiar control types, and provide explicit validation,
disabled, loading, error, success, and empty states where the workflow needs them. Prefer dense,
readable lists or tables for scanning records instead of converting every record into a large card.
Modal and sheet behavior must include focus management, dismissal, and keyboard support.

New shared patterns should follow an actual recurring need. Do not add a second theme,
parallel component library, new font family, or vendor-specific design language for one feature.
Use `cn()` from [the local utility](src/lib/utils.ts) for conditional Tailwind classes. Review
generated shadcn output so new components inherit Meridian rather than resetting the theme.

### Review Checklist

- Does the screen look like the existing console in both themes?
- Are typography, spacing, semantic tokens, and component shapes reused?
- Are the mobile drawer, tablet rail, full sidebar, and collapsed sidebar usable?
- At 320px, 390px, 768px, 1024px, 1440px, and wide-monitor widths, is content readable
  without overlap or page-wide horizontal scrolling?
- Can phone users reach every enabled destination, primary action, Settings, and signout
  with touch, without relying on hover or desktop-only controls?
- Are drawer dismissal, focus restoration, resizing, portrait/landscape, short screens,
  and keyboard-visible forms usable?
- Do long labels, empty states, and loading/error content fit without shifting controls?
- Are keyboard focus, tooltips, names, status labels, and reduced motion preserved?
- Is displayed activity real, clearly empty, or explicitly identified as prototype data?
- Have intentional visual changes been reflected in this document and the implementation?

## 11. Authentication and Organisation Setup

The connected entry flow uses `/sign-in`, `/sign-up`, and `/setup` before protected
`/dashboard`. Use the existing `AudioLines` mark, wordmark, fonts, and page background;
do not add a separate login brand, promotional hero, or decorative illustration.

Entry pages use an open, centered form column with a 400px maximum width, not a nested
card layout. The brand sits at the top with 40px horizontal desktop padding and 16px below
640px. Titles are 30px, reducing to 26px below 640px. Fields are 52px tall with
16px radius, semantic input borders, and restrained glass fill. Submit actions are 48px
pill buttons. Labels stay outside inputs; password visibility is a named 44px icon action.
Below 768px, input text is 16px. Short viewports top-align the form and allow scrolling
instead of vertically centering controls below the visible area.

Signup asks only for name, email, and password. Signin asks for email/password. Setup asks
only for the organisation name and offers signout. There is one organisation per user;
do not add an organisation switcher or a second setup wizard. Preserve native field
validation, visible server errors, disabled/pending actions, and retry states.

Session restoration and organisation lookup show a neutral loading state, never a flash
of protected content. A lookup error is not an empty organisation. After setup, the shell
shows the real organisation and account name; its toolbar offers signout with a tooltip.
The Meridian visual language and feature behavior stay consistent across mobile, tablet,
and desktop; the navigation presentation and spacing adapt to each screen.

## 12. Knowledge Base

The page follows the `knowledge` model: a title and exactly one PDF or TXT file per entry,
with file metadata, extracted text, and worker progress. Knowledge is optional; the empty
state says so and never redirects people into an upload flow.

- **Heading:** the standard page heading with a 44px "Add knowledge" pill CTA and, once
  entries exist, a factual count line ("3 entries · 1 ready").
- **Toolbar:** a 44px pill search field on glass and a status filter that reuses the
  appearance segmented control. Both become full width below 768px; counts hide on phones.
- **List:** a divided list, not cards. Each row is one button with the 44px file icon tile,
  title and file name, size (1200px and above), added date (768px and above), status, and a
  chevron. Below 768px the type, size and date move into one metadata line under the title.
  Rows use a 12px rounded muted hover on fine pointers only.
- **Status:** `.knowledge-status` is a dot plus a word on a 14% `color-mix` tint with
  foreground text: Ready uses `--status-normal`, Processing `--status-low`, Failed
  `--status-high`. A null `workerProgress` is Ready. The list polls while any entry is processing.
- **Add dialog:** a centered `.glass-sheet` with 28px radius and the float shadow. It reuses
  `.auth-fields`, `.auth-input`, and `.auth-error`, names the 10 MB limit, and asks people to
  upload only authorised material. The file field is a 20px dashed dropzone that becomes a
  solid file summary once a valid file is chosen. Actions stack full width below 768px.
- **Details sheet:** a 480px right-hand `.glass-sheet` (full screen on phones) with file,
  dates, and extracted text sections separated by hairlines. Processing and empty extraction
  use a muted note; failures use the error treatment with a "Try again" action. Long
  extractions scroll in a focusable region and preview the first 20,000 characters.
  "Generate challenges" is enabled only for Ready entries. Delete confirms in an alert dialog
  that layers above the sheet.
- **Layers:** knowledge overlays use `--scrim` at z-index 50 and surfaces at 51; the delete
  confirmation uses 52 and 53. Radix portals each part separately, so never rely on DOM order.

Until the knowledge table, private storage, and extraction worker exist, the repository keeps
entries in memory for the current session only. New entries stay Processing; nothing is
presented as extracted that was not.

## 13. Challenges

The page reads the `challenge` table and the `participant_public` view. It never selects
`configs`, hidden motivations or objections.

- **Heading:** the standard page heading with a 44px "General Challenges" pill CTA that opens
  the generate dialog. Below it, a count line names the people and companies as simulated.
- **Toolbar:** reuses the Knowledge Base search pill and segmented filter (All / One-on-One / Boardroom).
- **Sections:** Open Challenges (`INTERNAL`) and Knowledge-based Challenges (`KNOWLEDGE_BASE`),
  separated by a hairline. Grids are three columns, two below 1200px and one below 768px.
  With no generated challenges, the knowledge section shows an optional-knowledge empty state.
- **Card:** a `.destination.glass` button with a format icon tile (User or Users), category,
  title, a two-line description, and chips for difficulty, format and duration. A participant
  initials stack sits above a hairline at the bottom.
- **Difficulty:** `.challenge-difficulty` uses the same dot, word and 14% tint as
  `.knowledge-status`: Easy `--status-normal`, Medium `--status-borderline`, Hard `--status-high`.
- **Brief sheet:** a 520px `.knowledge-sheet` with the goal, the situation, the fictional
  product brief, skill tags, participants (personality, speaking style, authority), an
  Assist/Battle radio-card choice, and an allowance and audio-processing notice that shows
  the remaining minutes from `account_usage`. Start stays disabled until live calls exist.
- **Generate dialog:** a `.knowledge-dialog` with a ready-knowledge select, format and difficulty
  segments, and an optional goal. It calls the `generate-challenge` edge function. With no ready
  knowledge, it points to the Knowledge Base instead.
