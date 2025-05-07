const CACHE_NAME = "connected-pages-v1";
const urlsToCache = [
  "app.html",
  "index.html",
  "gallery.html",
  "style.css",
  "script.js",
  "cplogo.svg",
  "profileimg.png",
  "galleryicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) =>
      response || fetch(event.request)
    )
  );
});
