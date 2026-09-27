import { ImageResponse, loadGoogleFont } from 'workers-og';
import { decodeChecklist } from './lib/decode.js';
import { getTheme } from './lib/themes.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// GET /api/og?s=<same encoded checklist as the share link>
// Renders a 1200x630 preview card for that specific checklist (title,
// theme colors, progress). Called with no ?s= it renders the generic
// brand card used as the site's default og:image.
async function renderOgImage(url) {
  const encoded = url.searchParams.get('s');
  const state = decodeChecklist(encoded);

  const hasList = !!state;
  const title = hasList ? ((state.title && state.title.trim()) || 'Untitled checklist') : 'CheckMyBoxes';
  const total = hasList ? state.items.length : 0;
  const done = hasList ? state.items.filter((i) => i.done).length : 0;
  const theme = getTheme(hasList ? state.theme : 'fresh-start');
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const subtitle = hasList
    ? (total > 0 ? `${done} of ${total} checked off` : 'An empty checklist, ready to fill')
    : 'A checklist worth sending';

  const showBar = hasList && total > 0;
  const titleSize = title.length > 30 ? 54 : title.length > 18 ? 62 : 72;

  const html = `
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;padding:72px;background:${theme.bg};">
      <div style="display:flex;align-items:center;font-family:'Work Sans';font-size:32px;font-weight:600;color:${theme.accent};">
        CheckMyBoxes
      </div>
      <div style="display:flex;flex-direction:column;max-width:1020px;">
        <div style="display:flex;font-family:'Fraunces';font-size:${titleSize}px;font-weight:700;color:${theme.ink};line-height:1.1;">
          ${escapeHtml(title)}
        </div>
        <div style="display:flex;margin-top:26px;font-family:'Work Sans';font-size:30px;font-weight:600;color:${theme.muted};">
          ${escapeHtml(subtitle)}
        </div>
        ${showBar ? `
        <div style="display:flex;margin-top:30px;width:680px;height:20px;background:${theme.line};border-radius:99px;">
          <div style="display:flex;width:${Math.max(pct, 4)}%;height:20px;background:${theme.accent};border-radius:99px;"></div>
        </div>` : ''}
      </div>
    </div>
  `;

  try {
    const [titleFont, bodyFont] = await Promise.all([
      loadGoogleFont({ family: 'Fraunces', weight: 700, text: title.slice(0, 100) + 'CheckMyBoxes' }),
      loadGoogleFont({ family: 'Work Sans', weight: 600, text: subtitle + 'CheckMyBoxes0123456789' }),
    ]);

    const image = new ImageResponse(html, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Fraunces', data: titleFont, weight: 700, style: 'normal' },
        { name: 'Work Sans', data: bodyFont, weight: 600, style: 'normal' },
      ],
    });

    const headers = new Headers(image.headers);
    headers.set('Cache-Control', 'public, max-age=86400');
    return new Response(image.body, { status: image.status, headers });
  } catch (err) {
    return new Response('OG image generation failed: ' + (err && err.message), { status: 500 });
  }
}

// Serves "/" from the static asset bundle, then — only when the link
// carries a checklist (?s=...) — rewrites the <title> and Open Graph /
// Twitter Card <meta> tags so a link preview (iMessage, Telegram, Discord,
// Slack, WhatsApp, X, etc.) reflects that specific checklist instead of
// the generic default. The app itself always renders the same static
// HTML/JS either way; only what a crawler reads out of the <head> changes.
async function serveHomepage(request, env, url) {
  const response = await env.ASSETS.fetch(request);

  if (!response.ok) return response;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const encoded = url.searchParams.get('s');
  if (!encoded) return response;

  const state = decodeChecklist(encoded);
  if (!state) return response;

  const title = (state.title && state.title.trim()) || 'Untitled checklist';
  const total = state.items.length;
  const done = state.items.filter((i) => i.done).length;
  const theme = getTheme(state.theme);
  const description = total > 0
    ? `${done} of ${total} checked off · ${theme.label} theme.`
    : `An empty checklist, ready to fill · ${theme.label} theme.`;

  const pageTitle = `${title} — CheckMyBoxes`;
  const pageUrl = url.toString();
  const ogImageUrl = `${url.origin}/api/og?s=${encodeURIComponent(encoded)}`;

  const rewriter = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(pageTitle); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', pageTitle); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', description); } })
    .on('meta[property="og:image"]', { element(el) { el.setAttribute('content', ogImageUrl); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', pageUrl); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', pageTitle); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', description); } })
    .on('meta[name="twitter:image"]', { element(el) { el.setAttribute('content', ogImageUrl); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', pageUrl); } });

  return rewriter.transform(response);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/og') {
      return renderOgImage(url);
    }
    if (url.pathname === '/') {
      return serveHomepage(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
};
