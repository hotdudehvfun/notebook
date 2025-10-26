const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
    "/",
    "/index.html",

    "/styles/main.css",
    "/styles/custom_styles.css",

    "/img/ios/1024.png",
    "/img/ios/76.png",
    "/img/ios/60.png",
    "/img/ios/64.png",
    "/img/ios/58.png",
    "/img/ios/167.png",
    "/img/ios/72.png",
    "/img/ios/29.png",
    "/img/ios/100.png",
    "/img/ios/114.png",
    "/img/ios/128.png",
    "/img/ios/512.png",
    "/img/ios/16.png",
    "/img/ios/120.png",
    "/img/ios/256.png",
    "/img/ios/20.png",
    "/img/ios/32.png",
    "/img/ios/180.png",
    "/img/ios/57.png",
    "/img/ios/80.png",
    "/img/ios/40.png",
    "/img/ios/87.png",
    "/img/ios/192.png",
    "/img/ios/50.png",
    "/img/ios/144.png",
    "/img/ios/152.png",
    "/img/logo.png",
    "/img/android/android-launchericon-512-512.png",
    "/img/android/android-launchericon-144-144.png",
    "/img/android/android-launchericon-48-48.png",
    "/img/android/android-launchericon-192-192.png",
    "/img/android/android-launchericon-96-96.png",
    "/img/android/android-launchericon-72-72.png",

    "/img/icons/circle.dashed.svg",
    "/img/icons/inset.filled.circle.dashed.svg",
    "/logo.png",


    "/scripts/aes.min.js",
    "/scripts/angular_module.js",
    "/scripts/angular-sanitize.min.js",
    "/scripts/angular.min.js",
    "/scripts/bin_controller.js",
    "/scripts/chart.min.js",
    "/scripts/create_note_controller.js",
    "/scripts/create_note_menu_controller.js",
    "/scripts/create_notebook_dialog_controller.js",
    "/scripts/crypto-js.min.js",
    "/scripts/db_controller.js",
    "/scripts/dialog_controller.js",
    "/scripts/directives",
    "/scripts/list.js",
    "/scripts/main_controller.js",
    "/scripts/note_controller.js",
    "/scripts/note_more_options_controller.js",
    "/scripts/notebook_controller.js",
    "/scripts/notebook_more_options_controller.js",
    "/scripts/password_popup_controller.js",
    "/scripts/quick_notebooks_controller.js",
    "/scripts/services",
    "/scripts/share_service.js",
    "/scripts/sidebar_controller.js",
    "/scripts/sortable.min.js",
    "/scripts/tag_controller.js",
    "/scripts/task.js",
    "/scripts/todo.md",
    "/scripts/utilities.js",
    "/scripts/var_controller.js",
    "/scripts/wiki.js",

    "/scripts/directives/bottom-bar.html",
    "/scripts/directives/create-note-view.html",
    "/scripts/directives/create-notebook-popup.html",
    "/scripts/directives/create-tag-popup.html",
    "/scripts/directives/create-var-popup.html",
    "/scripts/directives/empty-state.html",
    "/scripts/directives/notebooks-list.html",
    "/scripts/directives/notes-list.html",
    "/scripts/directives/popup-db.html",
    "/scripts/directives/popup-password.html",
    "/scripts/directives/quick-notebooks.html",
    "/scripts/directives/sidebar.html",
    "/scripts/directives/system-var-list.html",
    "/scripts/directives/tags-list.html",
    "/scripts/directives/topbar.html",
    "/scripts/directives/view_bin.html",

    "/scripts/services/create_note_menu_service.js",
    "/scripts/services/db_service.js",
    "/scripts/services/graph_service.js",
    "/scripts/services/note_service.js",
    "/scripts/services/notebook_service.js",
    "/scripts/services/tag_service.js",


];

// Install the Service Worker
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open('my-cache-v1');

        for (const url of urlsToCache) {
            try {
                await cache.add(url);
                console.log('Cached:', url);
            } catch (err) {
                console.warn('Failed to cache:', url, err);
            }
        }
    })());
});



// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).catch(err => {
        console.warn('Fetch failed; returning fallback:', event.request.url, err);
        // Return a valid Response object; adjust as needed:
        return new Response('Offline or resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});



// Update the Service Worker
self.addEventListener('activate', function (event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
