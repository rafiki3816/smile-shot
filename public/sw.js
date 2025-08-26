// Service Worker for Smile Shot PWA
const CACHE_NAME = 'smile-shot-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  // Add more static assets as needed
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Only cache http/https requests
          if (event.request.url.startsWith('http')) {
            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate Service Worker and clean old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline practice data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-practice-data') {
    event.waitUntil(syncPracticeData());
  }
});

async function syncPracticeData() {
  try {
    // Get all pending practice data from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-practice', 'readonly');
    const store = tx.objectStore('pending-practice');
    const pendingData = await store.getAll();

    // Send each pending practice to server
    for (const data of pendingData) {
      try {
        const response = await fetch('/api/practice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          // Remove from pending if successful
          const deleteTx = db.transaction('pending-practice', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending-practice');
          await deleteStore.delete(data.id);
        }
      } catch (error) {
        console.error('Failed to sync practice data:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SmileShotDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-practice')) {
        db.createObjectStore('pending-practice', { keyPath: 'id' });
      }
    };
  });
}