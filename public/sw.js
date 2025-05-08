// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // self.skipWaiting() is important to ensure the new service worker activates immediately
  // especially if there's an old one.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // event.waitUntil(self.clients.claim()) allows the activated service worker
  // to take control of all open clients (tabs) that are in its scope.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // For a basic PWA setup focused on installability,
  // a simple network-first or pass-through fetch handler is sufficient.
  // More complex caching strategies can be added later if offline functionality is required.
  // console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(fetch(event.request).catch(() => {
    // Basic offline fallback, e.g. for root page or specific assets
    // if (event.request.mode === 'navigate') {
    //   // return caches.match('/offline.html'); // You would need an offline.html page
    // }
    // For now, just let the browser handle the fetch error
    return new Response('Network error occurred', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }));
});
