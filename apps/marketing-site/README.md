# CallPilot AI Marketing Site

Public marketing website for **Zavara CallPilot**, the AI-powered sales practice and coaching
product. Plain HTML, one stylesheet and two JavaScript files. No framework, no build step,
no package manager and no backend. Open `index.html` in a browser or copy this folder to any
static host.

Read [DESIGN.md](DESIGN.md) before changing visuals, and keep content inside the MVP scope
described in [`../../ABOUT-PROJECT.business.md`](../../ABOUT-PROJECT.business.md).

## Run it locally

Any static file server works. From this directory:

```sh
# Python (preinstalled on macOS)
python3 -m http.server 8080

# or Node, without installing anything
npx --yes serve . -l 8080
```

Then open <http://localhost:8080>. Double-clicking `index.html` also works, but the
`localStorage` theme preference and font loading behave more like production over HTTP.

There is nothing to install and nothing to build. The only network dependencies are Google
Fonts and the Motion library from jsDelivr; both are optional and the page degrades gracefully
when they are blocked (see below).

## Pages and files

| Path                        | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `index.html`                | Landing page                                                            |
| `roadmap.html`              | Available now versus Coming Soon                                        |
| `404.html`                  | Not-found page                                                          |
| `css/styles.css`            | Meridian tokens, light and dark themes, layout, components, motion      |
| `js/config.js`              | Deploy-time settings: the application URL for "Get started" (see below) |
| `js/main.js`                | Theme toggle, mobile drawer, scroll reveal, live demo, persona cards, Assist/Battle switch, Time Machine demo, FAQ accordion, back to top |
| `js/motion-fx.js`           | Optional Motion (motion.dev) enhancements: scroll progress, icon springs, travelling flow dot, pointer-tracking avatar eyes, hover and press springs, Time Machine branch diagram |
| `assets/logo-mark.svg`      | Favicon and social image: three slanted bars (the product mark)         |
| `assets/callpilot-mark.svg` | Previous brand mark, kept for reference                                 |
| `tools/build_pages.py`      | Optional page generator; see [tools/README.md](tools/README.md)         |
| `DESIGN.md`                 | Visual design guide for this site                                       |

Icons are Lucide outlines at 1.75 stroke, inlined as an SVG sprite at the top of each page.
There are no GIFs, videos or raster images; every visual cue is a CSS or JavaScript animation
or an inline SVG.

### Regenerating the pages

The three HTML pages share a header, footer, icon sprite, avatars and illustrations.
`tools/build_pages.py` writes `index.html`, `roadmap.html` and `404.html` from those shared
pieces:

```sh
python3 tools/build_pages.py .
```

Editing the HTML files directly is also fine. Just do not run the script afterwards, or it
will overwrite those edits. The script never touches `css/`, `js/` or `assets/`.

## Design system

Tokens follow the console design guide: Space Grotesk headings, Instrument Sans body, the
light neutral palette with the page gradient, 20px radius scale, pill controls with 44px
targets, glass surfaces, Meridian easing, and status colours used only with a word label.

**Theme.** Dark is the default for every visitor, regardless of OS setting. The header toggle
switches to light by setting `data-theme="light"` on the root element, remembered in
`localStorage` under `cp-theme-v2`, so the choice sticks across visits. Bump the `?v=` query on the
stylesheet and script links in `tools/build_pages.py` when shipping changes, so browsers do not keep a cached copy. A tiny inline script in
`<head>` applies the stored choice before first paint so there is no flash.

**Fonts** load from Google Fonts with system fallbacks. To self-host, place the font files in
`assets/fonts/` and swap the `<link>` for `@font-face` rules.

**Motion.** [Motion](https://motion.dev) 12.23.12 loads from jsDelivr as a plain script
(global `Motion`). Everything in `js/motion-fx.js` is an enhancement: if the CDN is blocked,
the library fails to load, or the visitor prefers reduced motion, the page still works with the
CSS animations in `styles.css` and the behaviour in `main.js`.

Note on SVG and Motion: Motion writes some SVG values (opacity, dash arrays) as attributes,
which stylesheet rules override. Initial values for those are therefore set as attributes in
the markup, not in CSS.

## Interactions

- **Live practice demo (hero):** cycles through three fictional Boardroom objections (CFO, CTO,
  CEO), typing each buyer line and your reply, then revealing a private coach hint. With reduced
  motion on, it shows a static frame.
- **Persona cards:** tap to reveal a sample question from that stakeholder.
- **Assist / Battle switch:** accessible tabs with arrow-key support. They auto-rotate every
  6 seconds until the visitor clicks.
- **Time Machine demo:** plays by itself the first time the section scrolls into view (or when
  the page opens at `#time-machine`), branching from your first answer. The original stays
  visible and unchanged. "Reset demo" clears it.
- **FAQ:** native `<details>` with an animated height transition.
- **Scroll reveal:** sections fade up once as they enter the viewport. Without JavaScript or
  with reduced motion everything is visible immediately.
- **Navigation:** sticky glass header that gains a shadow on scroll, active-section
  highlighting, a mobile drawer (Escape closes it), and a back-to-top button after 600px.

All interactive demos use fictional people, companies and outcomes and say so on the page.

## Linking "Get started" to the application

The application URL lives in one place, `js/config.js`:

```js
window.CALLPILOT_CONFIG = {
  appUrl: 'https://app.example.com'   // sign-in / sign-up address of the CallPilot console
};
```

When `appUrl` is set, every "Get started" button (header and mobile drawer on all pages) links
there, and the final "Early access" panel swaps its "not yet open" copy for a "Get started"
button. When it is empty the buttons fall back to the in-page early-access section, so the site
never shows a dead link. No other file needs editing.

## Content rules

- Apart from the configured application URL, calls to action link only to in-page sections and
  `roadmap.html`. No demo link, waitlist endpoint or contact address exists yet, so none is
  invented.
- No forms, since a form without a backend would appear functional when it is not.
- Simulated Deals, team analytics, live-call assistance, integrations and subscriptions are
  marked **Coming Soon**, following the MVP scope in `ABOUT-PROJECT.business.md` and the BRD.
- No pricing, testimonials, logos, statistics or ROI claims.

## Validation

```sh
node --check js/config.js js/main.js js/motion-fx.js
grep -rn 'href="#' *.html | grep -v '#i-'   # every anchor should match an id
```

Review at 320px, 390px, 768px, 1024px, 1440px and 2560px, in light and dark, with reduced
motion on, and with JavaScript disabled (the page must still read correctly).

## Deployment

Upload the folder as-is to any static host (GitHub Pages, Netlify, Vercel static, S3 and
CloudFront, Nginx). Configure the host to serve `404.html` for unknown paths. Set the real
production URL before adding canonical, sitemap, robots or Open Graph URLs.

## Relationship to the rest of the repository

This site is independent of [`../client-console`](../client-console) (the Vite and React
application) and shares no code or dependencies with it. It links to no application routes
until `appUrl` in `js/config.js` is set; that is the one place to add the console's address.
