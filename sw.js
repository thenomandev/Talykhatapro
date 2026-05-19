const CACHE_NAME = "tallybook-v2"; // ভার্সন পরিবর্তন করা হলো ফোর্সবল আপডেটের জন্য

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./home.css",
  "./ledger.css",
  "./form.css",
  "./app.js",
  "./utils.js",
  "./db.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
