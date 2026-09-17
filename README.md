# Ticketboss

A fictitious event marketplace front-end. Ticketmaster-style information
architecture, Planhat-style visual language: white space, soft shadows,
rounded geometry, restrained type.

**Fully static.** One `index.html`, no build step, no server, no dependencies to
install. Drop it on GitHub Pages and it works.

---

## Project structure

```
ticketboss/
├── index.html        # the entire app (Tailwind + React 18 + Babel, all inline)
├── assets/
│   └── logo.svg      # the mark, also inlined in index.html as <LogoMark />
├── .nojekyll         # stops GitHub Pages from running Jekyll over the files
└── README.md
```

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit <http://localhost:4173>.

## Deploy to GitHub Pages

```bash
git init && git add . && git commit -m "Ticketboss front-end"
git branch -M main
git remote add origin git@github.com:<you>/ticketboss.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Source: `main` / root**.

---

## Design system

| Token | Value | Used for |
| --- | --- | --- |
| Primary | `#4361EE` | Links, active states, category icons, gradients |
| Action | `#FF6B35` | CTAs, rank badges, "few left", toast accents |
| Ink | `#1A1A24` | Body text, active nav pill, dark sections |
| Fog | `#F8F9FA` | Page background |
| White | `#FFFFFF` | Cards, surfaces |

Type: **Poppins** for display (headings, the wordmark, numerals), **Inter** for
UI and body. Both from Google Fonts.

All colours are registered as Tailwind tokens in the `tailwind.config` block at
the top of `index.html` (`brand-*`, `coral-*`, `ink-*`, `fog-*`), alongside
custom shadows (`shadow-soft`, `shadow-lift`, `shadow-glow`, `shadow-coral`)
and `rounded-4xl`.

## The four views

| View | What's in it |
| --- | --- |
| **Discover** | Hero with search + city, stat strip, 8 category cards, trending (ranked 1–3), this-weekend list rows, membership banner, full city grid |
| **Search** | Sticky search bar, sidebar filters (category / date / max price / city) that collapse into a bottom sheet on mobile, active-filter chips, sort dropdown, result count, empty state |
| **My events** | Saved vs. Going tabs, summary stat cards, "next up" feature card, per-card Going toggle, total-if-bought footer |
| **My tickets** | Dark wallet summary, Upcoming/Past tabs, digital passes with generated QR codes, perforated tear line, section/row/seat block, and a full-screen pass modal with a barcode |

## How it's built

- **React 18 UMD + Babel Standalone** from cdnjs, compiled in the browser.
  Keeps everything in one file at the cost of ~300 ms of startup compile.
- **Tailwind via CDN** (`cdn.tailwindcss.com`) with an inline `tailwind.config`.
- **No images.** Every event cover is a deterministic SVG generated from the
  event id — a two-stop gradient per category plus seeded circles and diagonals.
  Same id always produces the same artwork, and nothing can 404.
- **QR codes and barcodes are mockups**, drawn as SVG rects from a seeded PRNG.
  They have real finder patterns, timing rows and an alignment block, so they
  look right — but they do not encode anything scannable.
- **State** lives in `App` and persists to `localStorage` under the
  `ticketboss:` prefix (saved, going, tickets, city). Every access is wrapped in
  `try/catch` so private-browsing mode degrades gracefully.
- **Checkout is a demo.** Picking a tier and hitting buy mints a ticket object,
  drops it in the wallet and switches views. No payment fields exist anywhere.

## Editing the content

Everything mock lives in section 2 of the script block:

- `EVENTS` — 22 events. Add objects with `id`, `title`, `sub`, `category`,
  `venue`, `city`, `date` (ISO local, `YYYY-MM-DDTHH:mm`), `price`, `rating`,
  `sold` (0–1, drives the "few left" flag), `tags`.
- `CATEGORIES` — the 8 categories; `icon` must be a key in `ICONS`.
- `PALETTES` — the two gradient stops per category.
- `CITIES`, `TIERS`, `FEE` — city selector and checkout pricing.

Dates are 2026; if events start showing as "Past", bump the years.

## Swapping in the real logo

The mark is reproduced as vector in two places — `assets/logo.svg` and the
`<LogoMark />` component in `index.html`. To use the original raster file
instead, save it as `assets/logo.png` and replace the component body:

```jsx
function LogoMark({ className = 'h-9 w-9' }) {
  return <img src="assets/logo.png" alt="" className={cx(className, 'object-contain')} />;
}
```

The wordmark next to it is live text (Poppins 700), not part of the image, so it
stays crisp at any size and inherits the theme colour.

## Known limits

- Babel-in-the-browser is fine for a demo but not for production. If this grows,
  move the script block into `src/App.jsx`, build with Vite, and set
  `base: '/<repo>/'` before deploying.
- Deep links aren't wired up — navigation is component state, so there is no URL
  per view and no browser back/forward between tabs. Adding `hashchange`
  handling around `setView` is about fifteen lines if you want it.
