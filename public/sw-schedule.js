// Service worker for /schedule offline support
// Scoped to /schedule only — doesn't affect the rest of the site

const CACHE = "schedule-sw-v1";
const URLS_TO_CACHE = ["/schedule"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(URLS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Only handle same-origin /schedule* and /api/schedule* requests
    if (url.origin !== self.location.origin) return;
    if (!url.pathname.startsWith("/schedule") && !url.pathname.startsWith("/api/schedule")) return;

    // API calls: network first, fall through silently (client uses localStorage)
    if (url.pathname.startsWith("/api/schedule")) {
        event.respondWith(
            fetch(event.request).catch(() => new Response(JSON.stringify({ events: [] }), {
                headers: { "Content-Type": "application/json" },
            }))
        );
        return;
    }

    // Page: stale-while-revalidate
    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(event.request);
            const networkFetch = fetch(event.request).then((res) => {
                if (res.ok) cache.put(event.request, res.clone());
                return res;
            }).catch(() => null);

            return cached ?? await networkFetch ?? new Response("Offline", { status: 503 });
        })
    );
});
