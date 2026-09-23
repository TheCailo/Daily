const CACHE='daily-cache-v7';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','styles.css','app.js','supabase-config.js','manifest.json','fonts/Vazirmatn-Regular.ttf','fonts/Vazirmatn-Bold.ttf']))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
