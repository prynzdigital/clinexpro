// Clinex Pro staff app service worker (scope /staff).
// Pages: network first; with no signal, the last copy of that page (so a
// cleaner can still see today's jobs and addresses). Build assets: cache first.
// Signing out deletes the page copies (see the staff app's sign-out button).
const VERSION = "v1";
const ASSETS = `clinex-staff-assets-${VERSION}`;
const PAGES = "clinex-staff-pages";

const OFFLINE_HTML = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Clinex Staff</title><body style="margin:0;font-family:system-ui,sans-serif;background:#031432;color:#fff;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px">
<div><p style="font-size:44px;margin:0">📶</p><h1 style="font-size:20px">You're offline</h1>
<p style="opacity:.75;max-width:280px">Open the app once with signal and your jobs will be available here next time.</p>
<button onclick="location.reload()" style="margin-top:12px;background:#d14000;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-weight:600;font-size:16px">Try again</button></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ASSETS).then((cache) => cache.addAll(["/icons/staff/192"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("clinex-staff-assets-") && k !== ASSETS).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-pages") caches.delete(PAGES);
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname.startsWith("/staff")) {
    // Never keep the sign-in page; keep job pages for offline viewing.
    const keep = !url.pathname.startsWith("/staff/login");
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (keep && res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(request, { cacheName: PAGES })) ?? new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((cache) => cache.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});
