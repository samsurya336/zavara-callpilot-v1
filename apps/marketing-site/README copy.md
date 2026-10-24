# CallPilot AI Marketing Site V2 (HTML + CSS + JavaScript)

Version 2 of the CallPilot AI marketing website. Plain HTML, one external stylesheet and
one JavaScript file. No framework, no build step, no package manager. Open `index.html`
in a browser or copy this folder to any static host.

This folder is independent of the other versions. Compare them side by side:

| Version | Folder                                       | Stack                                 |
| ------- | -------------------------------------------- | ------------------------------------- |
| Next.js | [`../marketing-site`](../marketing-site)     | Next.js placeholder (original)        |
| V1      | [`../marketing-site-html`](../marketing-site-html) | HTML with embedded CSS, no JavaScript |
| **V2**  | this folder                                  | HTML + CSS + JavaScript               |

## Files

| File                        | Purpose                                                                           |
| --------------------------- | --------------------------------------------------------------------------------- |
| `index.html`                | Landing page                                                                      |
| `roadmap.html`              | Available now versus Coming Soon                                                  |
| `404.html`                  | Not-found page                                                                    |
| `css/styles.css`            | Meridian tokens, light and dark themes, layout, components, motion                |
| `js/main.js`                | Theme toggle, mobile drawer, scroll reveal, live demo, persona cards, mode switch, Time Machine demo, FAQ accordion, back to top |
| `js/motion-fx.js`           | Motion (motion.dev) enhancements: scroll progress, icon springs, travelling flow dot, pointer-tracking avatar eyes, hover and press springs, Time Machine branch diagram |
| `assets/logo-mark.svg`      | Favicon and social image: three slanted bars (the product mark)                   |
| `assets/callpilot-mark.svg` | Previous brand mark, kept for reference                                           |

Icons are Lucide outlines at 1.75 stroke, inlined as an SVG sprite at the top of each page.
No GIFs or videos exist in the repository, so every visual cue is a CSS or JavaScript
animation instead.

## Motion library and animated SVG

[Motion](https://motion.dev) 12.23.12 loads from jsDelivr as a plain script
(`motion.min.js`, global `Motion`) with no build step. Everything in `js/motion-fx.js`
is an enhancement: if the CDN is blocked, the library fails to load, or the visitor prefers
reduced motion, the page still works with the CSS animations in `main.js` and `styles.css`.

Animated SVG on the page:

- **Avatars.** Inline SVG figures (three hair and glasses variants) replace the initials
  circles in the hero demo and the persona cards. Eyes blink on a CSS keyframe, pupils follow
  the pointer through a Motion spring, the active speaker's mouth animates and a ring pulses,
  and persona avatars nod on hover.
- **Brand mark.** The header and footer mark is three slanted rounded bars (12px, 24px, 12px,
  rotated 18 degrees) drawn with plain elements in `currentColor`, so it follows the theme. The
  bars animate as an equaliser on hover. The wordmark is Space Grotesk 17px bold with tight
  tracking. A small waveform plays in the hero demo's mode tag.
- **How-it-works track.** A dashed line behind the four steps with a dot travelling along it
  (desktop only), plus nudging arrows between steps.
- **Time Machine diagram.** An SVG timeline above the branch panel. Pressing "Try a different
  answer" draws a green fork from the chosen turn (Motion `pathLength`) and scales in the
  branch point; "Reset demo" retracts it.
- **Icon tiles** spring in when their section enters view; the header carries a scroll
  progress bar; buttons compress on press.
- **Scroll cue** under the hero copy: three downward sound arcs and a dot that light up in
  sequence from top to bottom, in the green accent, linking to the orbit section.

## Illustrations

All illustrations are inline SVG drawn in the brand's line style (1.75 stroke, near-black
ink, glass fills, green accent for the one thing that matters in each scene). They are
defined once in the page generator and share the `.illo` token classes in `styles.css`,
so they follow the light and dark themes automatically.

- **Buying-committee orbit** (directly under the hero): you at the centre with a pulsing
  microphone, the CEO, CTO and CFO avatars revolving on an inner ring (counter-rotated so they
  stay upright) with message dots travelling along the spokes, and an outer ring carrying
  Coaching report, Time Machine and Your progress with an orbiting accent dot. Nodes spring in
  through Motion when the section enters view.
- **Practice loop** (How it works): a ring with Pick, Talk, Review and Retry nodes and a
  dot travelling around it on a CSS `offset-path` (a static dot shows where that is
  unsupported or motion is reduced).
- **Problem spots:** manager roleplay with a clock, a live call with an alert, a script with
  a crossed-out microphone.
- **What your team learns:** six skill tiles with spot illustrations: discovery, objection
  handling, value in rupees, managing the room, product accuracy, speaking with confidence.
- **Report sheet:** transcript lines with one highlighted, a coaching callout pinned to it,
  skill bars, and a "retry from here" branch.
- **Final panel:** rippling sound rings around a microphone.
- **Hero background (one quiet motif):** a single sine-wave ribbon with a blue-to-green gradient
  stroke, a soft blurred glow beneath it and a thinner phase-shifted echo line, travelling
  continuously from left to right along the bottom of the hero. With Motion loaded the ribbon
  follows the pointer with a gentle spring parallax. Everything else that used to sit in the
  hero background (dot grid, expanding rings, bar strip, colour sweep) was removed on purpose:
  the demo card is the hero's focal point and the background should not compete with it.
  Reduced motion stops the ribbon.

Small floats and ripples are CSS keyframes and stop under `prefers-reduced-motion`.

Note on SVG and Motion: Motion writes some SVG values (opacity, dash arrays) as attributes,
which stylesheet rules override. Initial values for those are therefore set as attributes
in the markup, not in CSS.

## Design system

Tokens come from `../marketing-site/src/styles/theme.css` and the console design guide:
Space Grotesk headings, Instrument Sans body, the light neutral palette with the page
gradient, 20px radius scale, pill controls with 44px targets, glass surfaces, Meridian
easing, and status colours used only with a word label.

**Theme.** Light is the default. The dark palette applies when the OS prefers dark, and
the header toggle sets `data-theme="light"` or `"dark"` on the root element, remembered in
`localStorage` under `cp-theme`. A tiny inline script in `<head>` applies the stored choice
before first paint so there is no flash.

**Fonts** load from Google Fonts with system fallbacks (the Next.js site self-hosted them
through Fontsource; there is no package manager here). To self-host, place the files in
`assets/fonts/` and swap the `<link>` for `@font-face` rules.

## Interactions

- **Live practice demo (hero):** cycles through three fictional Boardroom objections (CFO, CTO, CEO), typing each buyer line and your reply, then revealing a private coach hint. The timer counts up. With reduced motion on, it shows a static frame.
- **Persona cards:** tap to reveal a sample question from that stakeholder.
- **Assist / Battle switch:** accessible tabs with arrow-key support. They auto-rotate every 6 seconds until the visitor clicks.
- **Time Machine demo:** plays by itself the first time the section scrolls into view (or when the page opens at `#time-machine`), branching from your first answer. Pressing "Try a different answer" on either turn replays the full animation for that turn. The original stays visible and unchanged. "Reset demo" clears it.
- **FAQ:** native `<details>` with an animated height transition. It spans the full content width.
- **Scroll reveal:** sections fade up once as they enter the viewport. Without JavaScript or with reduced motion everything is visible immediately.
- **Navigation:** sticky glass header that gains a shadow on scroll, active-section highlighting, a mobile drawer (Escape closes it), and a back-to-top button after 600px.

All interactive demos use fictional people, companies and outcomes and say so on the page.

## Content rules

- Approved hero headline and copy. Short section headlines.
- Calls to action link only to in-page sections and `roadmap.html`. No application URL, demo link, waitlist endpoint or contact address exists in the repository, so none is invented. The final panel says sign-up is not yet open. Add the real link there when it exists.
- No forms, since a form without a backend would be presented as functional when it is not.
- Simulated Deals, team analytics, live-call assistance, integrations and subscriptions are marked **Coming Soon**, following the MVP scope in `../../ABOUT-PROJECT.business.md` and the BRD.
- No pricing, testimonials, logos, statistics or ROI claims.

## Validation

```sh
node --check js/main.js js/motion-fx.js
grep -rn 'href="#' *.html | grep -v '#i-'   # every anchor should match an id
```

Review at 320px, 390px, 768px, 1024px, 1440px and 2560px, in light and dark, with reduced
motion on, and with JavaScript disabled (the page must still read correctly).
