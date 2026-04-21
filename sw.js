const CACHE_NAME = 'secureats-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/crypto.js',
  '/js/qr.js',
  '/js/scanner.js',
  '/js/db.js',
  '/manifest.json',
  '/img/burger_logo.png',
  '/img/fondSite.png',
  '/img/classicBurger.png',
  '/img/doubleCheese.png',
  '/img/bbqBurger.png',
  '/img/cryspychickenB.png',
  '/img/veggieB.png',
  '/img/leMonstreburger.png',
  '/img/frites.png',
  '/img/sweetpoteto.png',
  '/img/oignonRing.png',
  '/img/nuggets.png',
  '/img/mozzaStick.png',
  '/img/Coleslaw.png',
  '/img/cookie.png',
  '/img/brownie.png',
  '/img/sundae.png',
  '/img/Churros.png',
  '/img/cheeseCake.png',
  '/img/donut.png',
  '/img/coca.png',
  '/img/sprite.png',
  '/img/iceTea.png',
  '/img/Milkshake.png',
  '/img/jusOrange.png',
  '/img/eau.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
