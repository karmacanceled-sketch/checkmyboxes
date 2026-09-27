# CheckMyBoxes

A no-login, shareable checklist. Build one, pick a theme, copy a link — the
whole checklist lives inside that link, not in a database.

## What's in here

```
public/                  everything served to visitors
  index.html               the app itself (all HTML/CSS/JS, no build step)
  about.html                required-for-AdSense pages, genuine copy
  privacy.html
  contact.html
  styles/legal.css         shared styling for those three pages
src/
  worker.js                the one server-side script (see below)
  lib/                      small helpers worker.js imports
wrangler.toml             tells Cloudflare how to run this
package.json              the two npm deps worker.js uses, plus wrangler
```

There's no build step for the app itself — `public/` is plain HTML/CSS/JS,
same as the original prototype. `src/worker.js` is a small **Cloudflare
Worker**: Cloudflare runs it on every request to `/` and `/api/og` (see
`run_worker_first` in `wrangler.toml`); every other request — `about.html`,
`styles/legal.css`, etc. — is served straight out of `public/` without
running any code at all. Cloudflare's own build system installs the two
npm dependencies (`lz-string`, `workers-og`) automatically because
`package.json` is present — you don't need Node.js installed anywhere for
this to work.

## Why there's a server piece at all, given "no backend"

The checklist itself still has zero backend — it's fully encoded in the
URL and decoded entirely in the visitor's browser. The one thing a pure
static site can't do is **link previews**: when you text a link, iMessage
asks the server for a preview image and title *before* anyone taps it, and
by then there's no browser involved to decode anything. So:

- Share links use `?s=<encoded checklist>` (a query string), not
  `#<encoded checklist>` (a URL fragment) — a fragment is never sent to
  the server at all, which would make this impossible.
- For `/`, `worker.js` reads that `?s=`, decodes just enough to know the
  title/theme/progress, and rewrites the Open Graph and Twitter Card
  `<meta>` tags in the page before it's returned.
- `/api/og` renders an actual 1200×630 image reflecting that same title/
  theme/progress, which is what shows up as the picture in the preview.

Nothing is stored anywhere — every request decodes fresh from the link and
forgets it immediately after responding.

## Deploying — what's done vs. what you need to do

### Already done
- Full app rebuilt and rebranded, tested locally in a browser
- 3 new templates added (Grocery Run, Errand Run, Weekend Trip) alongside
  the original Moving and Camping
- About/Privacy/Contact pages written, ad-slot placeholders added
- Dynamic link-preview system built for Cloudflare's current Workers-based
  deploy flow

### 1. Get this code onto GitHub

Create a repo, then use **Add file → Upload files → choose your files**,
navigate *into* the project folder in the picker so you're selecting
`public`, `src`, `wrangler.toml`, `package.json`, and `README.md` directly
(not the outer folder itself), select all, and commit.

### 2. Connect it in Cloudflare (Workers, not Pages)

- **Workers & Pages → Create application → Connect to Git**, pick the repo
- On "Set up your application," leave it as-is:
  - **Build command:** empty
  - **Deploy command:** `npx wrangler deploy` (already the default — don't
    change it)
- Click **Deploy**

Cloudflare reads `wrangler.toml`, installs `lz-string` and `workers-og`,
bundles `src/worker.js`, and gives you a `*.workers.dev` URL. Open it and
click through every theme/template, then share a checklist link to
yourself over text to confirm the preview image shows up. You can also
open `https://your-url.workers.dev/api/og?s=<the ?s= value from a share
link>` directly in a browser tab — it should render the preview image on
its own.

### 3. Point checkmyboxes.com at it

In that same project: **Settings → Domains → Add**, enter
`checkmyboxes.com` (and `www.checkmyboxes.com` if you want both). Since
the domain is already on Cloudflare, DNS is configured automatically.

### 4. Set up a real inbox for hello@checkmyboxes.com

The Contact and Privacy pages both point at `hello@checkmyboxes.com`.
Free and two minutes: **Email → Email Routing** in the Cloudflare
dashboard, add `hello@` as a custom address, forward it to your own inbox.

### 5. Apply for Google AdSense

Once the site is live on the real domain (AdSense wants a custom domain,
not a `*.workers.dev` one), apply at
[adsense.google.com](https://www.google.com/adsense/). When approved,
paste their script tag into `public/index.html` where it says
`<!-- Google AdSense: paste ... -->`, then place actual
`<ins class="adsbygoogle">` units inside the two `<div class="ad-slot">`
containers (one near the top, one near the bottom).

## Adding a new theme later

Each theme lives as one object in two places that need to stay in sync:
the `THEMES` array in `public/index.html` (colors + the little SVG motif
function) and the matching entry in `src/lib/themes.js` (just the colors,
so link previews match). Send me the vibe/colors you want and I'll add
both in one pass.
