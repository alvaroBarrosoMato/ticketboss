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
├── index.html         # the entire app (Tailwind + React 18 + Babel + Braze, all inline)
├── service-worker.js  # Braze web-push service worker
├── assets/
│   └── logo.svg       # the mark, also inlined in index.html as <LogoMark />
├── .nojekyll          # stops GitHub Pages from running Jekyll over the files
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

## Braze integration

The [Braze Web SDK](https://www.braze.com/docs/developer_guide/sdk_integration?sdktab=web)
**6.13** is loaded from the CDN in `index.html`, above the app script:

```html
<script src="https://js.appboycdn.com/web-sdk/6.13/braze.min.js"></script>
```

Configuration lives in one object at the top of section 2 of the script block:

```js
const BRAZE = {
  apiKey:  '6c30e0b3-6ded-45c8-9a8d-7eadbb065447',  // SDK key — public by design
  baseUrl: 'sdk.fra-02.braze.eu',                   // EU-02 cluster
  version: '6.13'
};
```

Initialisation follows the documented order — `changeUser` **before** `openSession`:

```js
sdk.initialize(BRAZE.apiKey, {
  baseUrl: BRAZE.baseUrl,
  enableLogging: new URLSearchParams(location.search).has('brazeLog'),
  allowUserSuppliedJavascript: true,
  serviceWorkerLocation: './service-worker.js'
});
sdk.automaticallyShowInAppMessages();
sdk.changeUser(brazeUserId());
sdk.openSession();
```

### The `bz` wrapper

Nothing in the UI touches the SDK directly. Everything goes through `bz`, a thin
wrapper where **every call is inside a try/catch and a `brazeReady` guard**. Ad
blockers block `js.appboycdn.com` routinely, so "SDK absent" is a normal state,
not an error path — when it happens, analytics silently no-ops and the site is
otherwise identical. The footer shows which state you're in.

### What gets tracked

| Custom event | Fires when |
| --- | --- |
| `screen_viewed` | Switching tabs (carries `from` and `screen`) |
| `search_performed` | Query or filters settle — debounced 900 ms, includes `results_count` and `zero_results` |
| `category_browsed` | A category card is clicked |
| `city_changed` | The city selector changes |
| `event_viewed` | An event detail modal opens |
| `event_saved` / `event_unsaved` | Heart toggled |
| `marked_going` / `unmarked_going` | Going toggled |
| `ticket_purchased` | Checkout confirmed |
| `ticket_pass_opened` | A wallet pass is opened |
| `ticket_transfer_started`, `pass_added_to_wallet`, `event_shared`, `wallet_synced`, `membership_cta_clicked`, `content_card_clicked` | Their respective buttons |

Event properties are built by one helper, `eventProps(event, extra)`, so every
event carries the same `event_id`, `category`, `venue`, `city`, `price_from`,
`event_date` and `days_away` shape. That consistency is what makes segmentation
on them workable later.

**Revenue** uses `logPurchase(eventId, unitAllIn, 'EUR', qty, props)`. Braze
computes revenue as `price × quantity`, so the *all-in per-ticket* price is sent
(tier price + booking fee), not the order total — otherwise revenue would be
multiplied twice.

**Custom attributes** are re-synced whenever the relevant state changes:
`saved_events`, `going_events`, `tickets_owned`, `lifetime_spend`,
`favourite_category` (derived from what's saved) and `home_city` — plus
`setHomeCity()` on the native profile field.

### Content Cards

Subscribed via `subscribeToContentCardsUpdates`, surfaced in two places:

- the **bell icon** in the nav, as a notification inbox with an unread badge
- a **"Picked for you"** strip on Discover, which renders nothing at all when no
  campaign targets the user — so the page is unchanged by default

Impressions (`logContentCardImpressions`), clicks (`logContentCardClick`) and
dismissals (`logCardDismissal`) are all wired up.

### In-app messages

`automaticallyShowInAppMessages()` is on, so anything you trigger from the
dashboard displays without further code. `allowUserSuppliedJavascript: true` is
set so HTML in-app messages work — that permits JavaScript authored in your
Braze dashboard to run on the page, so turn it off if you don't need HTML
messages.

### Web push

`service-worker.js` imports Braze's worker. The permission request is behind a
**soft prompt** inside the bell panel rather than firing on page load, which is
both better practice and avoids burning the one-shot browser permission.

Push additionally needs HTTPS (GitHub Pages qualifies) and VAPID keys configured
in **Braze dashboard → Settings → App Settings**. Until that's done the soft
prompt appears but no pushes arrive.

### Debugging

Append `?brazeLog=1` to any URL to turn on the SDK's verbose console logging.
You'll see each event as it's logged and each trigger evaluation.

Verified working against the EU-02 cluster: events `POST` to
`sdk.fra-02.braze.eu/api/v3/data/`, Content Cards sync, and a test purchase
logged as `2 purchases of "ev-02" for EUR 69.50`.

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
- Braze users are pseudonymous. There's no sign-in, so `changeUser` gets a random
  `tb-xxxxxxxx` id persisted in `localStorage`. Clearing site data creates a new
  profile. Wire `changeUser` to a real identity if you add auth.
- Braze's CDN build is used rather than the npm package. Braze recommend npm —
  it survives ad blockers and avoids Safari's *Prevent Cross-Site Tracking*
  interfering with Content Cards and banners. The CDN keeps this a single-file
  demo; switch to npm if any of that starts to matter.
