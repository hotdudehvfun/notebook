const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
    "/",
    "/index.html",
    "/styles/main.min.css",
    "/styles/dark.min.css",
    "/styles/custom_styles.min.css",

    "/img/user.svg",
    "/img/empty.svg",
    "/img/lock.svg",
    "/img/empty1.svg",
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

    "/img/icons/rectangle.stack.fill.badge.minus.svg",
    "/img/icons/arrowshape.left.svg",
    "/img/icons/recycling.svg",
    "/img/icons/savings.svg",
    "/img/icons/checkmark.circle.fill.svg",
    "/img/icons/hourglass.svg",
    "/img/icons/document.on.document.svg",
    "/img/icons/arrow.uturn.backward.square.svg",
    "/img/icons/document.on.document.fill.svg",
    "/img/icons/lock.open.fill.svg",
    "/img/icons/.DS_Store",
    "/img/icons/server.rack.svg",
    "/img/icons/lock.svg",
    "/img/icons/document.on.clipboard.svg",
    "/img/icons/icloud.and.arrow.down.svg",
    "/img/icons/sidebar.left.svg",
    "/img/icons/list.bullet.rectangle.svg",
    "/img/icons/chart.xyaxis.line.svg",
    "/img/icons/sports_esports.svg",
    "/img/icons/exclamationmark.triangle.fill.svg",
    "/img/icons/leaf.fill.svg",
    "/img/icons/book.pages.svg",
    "/img/icons/indianrupeesign.svg",
    "/img/icons/receipt_long.svg",
    "/img/icons/pencil.and.list.clipboard.svg",
    "/img/icons/chart.bar.xaxis.svg",
    "/img/icons/arrow.clockwise.circle.fill.svg",
    "/img/icons/arrow.trianglehead.merge.svg",
    "/img/icons/pencil.and.scribble.svg",
    "/img/icons/keyboard_command_key.svg",
    "/img/icons/arrow_down.svg",
    "/img/icons/textformat.characters.dottedunderline.svg",
    "/img/icons/trash.svg",
    "/img/icons/lock.square.svg",
    "/img/icons/square.3.layers.3d.middle.filled.svg",
    "/img/icons/ellipsis.circle.fill.svg",
    "/img/icons/cash.svg",
    "/img/icons/lock.open.svg",
    "/img/icons/sum.svg",
    "/img/icons/pencil.svg",
    "/img/icons/fitness_center.svg",
    "/img/icons/square.and.pencil.svg",
    "/img/icons/credit.svg",
    "/img/icons/arrowshape.left.fill.svg",
    "/img/icons/truck.box.fill.svg",
    "/img/icons/ellipsis.svg",
    "/img/icons/trash.square.fill.svg",
    "/img/icons/applepencil.and.scribble.svg",
    "/img/icons/textformat.characters.svg",
    "/img/icons/icloud.and.arrow.up.svg",
    "/img/icons/drag_handle.svg",
    "/img/icons/music_note.svg",
    "/img/icons/button.programmable.svg",
    "/img/icons/checkmark.square.svg",
    "/img/icons/folder.svg",
    "/img/icons/book.pages.fill.svg",
    "/img/folder.svg",
    "/logo.png",
    
    "/scripts/directives/main-content.html",
    "/scripts/directives/popup-password.html",
    "/scripts/directives/create-notebook-popup.html",
    "/scripts/directives/popup-db.html",
    "/scripts/directives/bottom-bar.html",
    "/scripts/directives/quick-notebooks.html",
    "/scripts/directives/sidebar.html",
    "/scripts/directives/topbar.html",
    "/scripts/directives/create-var-popup.html",
    "/scripts/task.js",
    "/scripts/list.js",
    "/scripts/angular_module.js",
    "/scripts/utilities.js",
    "/scripts/main_controller.min.js",
    "/scripts/wiki.js",
    "/scripts/main_controller.js",
    "/scripts/services/notebook_service.js",
    "/scripts/services/note_menu_service.js",
    "/scripts/services/db_service.js",
];

// Install the Service Worker
self.addEventListener("install", event => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          await cache.addAll(urlsToCache);
        } catch (err) {
          console.error("Caching failed:", err);
        }
      })
    );
  });
  

// Cache and return requests
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Update the Service Worker
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
