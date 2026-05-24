const CACHE_NAME = "tallybook-v4"; // ভার্সন পরিবর্তন করা হলো ফোর্সবল আপডেটের জন্য

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./home.css",
  "./ledger.css",
  "./form.css",
  "./global-ui.css",
  "./app.js",
  "./global-ui.js",
  "./utils.js",
  "./db.js",
  "./manifest.json",

  "./assets/svg/back-arrow.svg",
  "./assets/svg/avatar-user.svg",
  "./assets/svg/mini-camera.svg",
  "./assets/svg/address-book.svg",
  "./assets/svg/input-user.svg",
  "./assets/svg/phone.svg",
  "./assets/svg/taka.svg",
  "./assets/svg/note-icon.svg",
  "./assets/svg/pen.svg",
  "./assets/svg/calendar.svg",
  "./assets/svg/attach-camera.svg",
  "./assets/svg/error-alert.svg",
  "./assets/svg/success-check.svg"
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
