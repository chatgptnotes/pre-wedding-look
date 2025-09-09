// PreWedding AI Studio - Service Worker
// Provides offline support, caching, and push notifications

const CACHE_NAME = 'prewedding-ai-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const ESSENTIAL_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
  // API responses (short cache)
  {
    pattern: /^https:\/\/[^/]+\/api\//,
    strategy: 'NetworkFirst',
    cacheName: 'api-cache',
    options: {
      networkTimeoutSeconds: 5,
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      },
    },
  },
  
  // Static assets (long cache)
  {
    pattern: /\.(?:js|css|png|jpg|jpeg|gif|svg|ico|webp)$/,
    strategy: 'StaleWhileRevalidate',
    cacheName: 'static-assets',
    options: {
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      },
    },
  },
  
  // Google Fonts
  {
    pattern: /^https:\/\/fonts\.googleapis\.com/,
    strategy: 'StaleWhileRevalidate',
    cacheName: 'google-fonts-stylesheets',
    options: {
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      },
    },
  },
  
  {
    pattern: /^https:\/\/fonts\.gstatic\.com/,
    strategy: 'CacheFirst',
    cacheName: 'google-fonts-webfonts',
    options: {
      cacheableResponse: {
        statuses: [0, 200],
      },
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      },
    },
  },
];

// Analytics events queue for offline tracking
let analyticsQueue = [];
let isOnline = navigator.onLine;

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(ESSENTIAL_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('prewedding-ai-')) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle other requests with runtime caching
  const matchedPattern = RUNTIME_CACHE_PATTERNS.find(pattern => 
    pattern.pattern.test(event.request.url)
  );

  if (matchedPattern) {
    event.respondWith(handleCachedRequest(event.request, matchedPattern));
  }
});

// Navigation request handler with offline fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Cached request handler with different strategies
async function handleCachedRequest(request, pattern) {
  const { strategy, cacheName, options } = pattern;
  
  switch (strategy) {
    case 'NetworkFirst':
      return networkFirst(request, cacheName, options);
    case 'CacheFirst':
      return cacheFirst(request, cacheName, options);
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate(request, cacheName, options);
    default:
      return fetch(request);
  }
}

// Network First strategy
async function networkFirst(request, cacheName, options) {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 
        options.networkTimeoutSeconds * 1000)
      )
    ]);
    
    if (shouldCache(networkResponse, options)) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network first failed, trying cache');
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName, options) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (shouldCache(networkResponse, options)) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, options) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (shouldCache(networkResponse, options)) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Check if response should be cached
function shouldCache(response, options) {
  if (!response || !options.cacheableResponse) return true;
  
  const { statuses } = options.cacheableResponse;
  return statuses.includes(response.status);
}

// Push notification event handler
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      image: data.image,
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: Date.now(),
      ...data.options,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Style-Off Update', options)
    );
    
    // Track notification received
    trackAnalyticsEvent('push_notification_received', {
      notification_tag: options.tag,
      notification_title: data.title,
    });
    
  } catch (error) {
    console.error('Service Worker: Push notification error', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  const notification = event.notification;
  const data = notification.data || {};
  
  notification.close();
  
  // Handle action buttons
  if (event.action) {
    handleNotificationAction(event.action, data);
    return;
  }
  
  // Default click action
  const urlToOpen = data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
  
  // Track notification clicked
  trackAnalyticsEvent('push_notification_clicked', {
    notification_tag: notification.tag,
    action: event.action || 'default',
    url: urlToOpen,
  });
});

// Handle notification action buttons
function handleNotificationAction(action, data) {
  switch (action) {
    case 'join_game':
      clients.openWindow('/blinddate');
      break;
    case 'view_match':
      clients.openWindow(`/blinddate/reveal/${data.gameId}`);
      break;
    case 'join_tournament':
      clients.openWindow('/tournament');
      break;
    case 'dismiss':
      // Just dismiss, no action needed
      break;
    default:
      clients.openWindow(data.url || '/');
  }
}

// Background sync for offline analytics
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsEvents());
  }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'TRACK_ANALYTICS':
      trackAnalyticsEvent(data.eventName, data.properties);
      break;
      
    case 'GET_NETWORK_STATUS':
      event.ports[0].postMessage({ isOnline });
      break;
  }
});

// Network status tracking
self.addEventListener('online', () => {
  isOnline = true;
  console.log('Service Worker: Back online');
  
  // Sync pending analytics events
  syncAnalyticsEvents();
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_STATUS', isOnline: true });
    });
  });
});

self.addEventListener('offline', () => {
  isOnline = false;
  console.log('Service Worker: Gone offline');
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NETWORK_STATUS', isOnline: false });
    });
  });
});

// Analytics event tracking for offline scenarios
function trackAnalyticsEvent(eventName, properties = {}) {
  const event = {
    eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      offline: !isOnline,
      service_worker: true,
    },
  };
  
  if (isOnline) {
    // Send immediately if online
    sendAnalyticsEvent(event);
  } else {
    // Queue for later if offline
    analyticsQueue.push(event);
    console.log('Service Worker: Analytics event queued for offline sync');
  }
}

// Send analytics event to server
async function sendAnalyticsEvent(event) {
  try {
    await fetch('/api/analytics-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Service Worker: Failed to send analytics event', error);
    // Add back to queue if failed
    analyticsQueue.push(event);
  }
}

// Sync queued analytics events
async function syncAnalyticsEvents() {
  if (analyticsQueue.length === 0) return;
  
  console.log(`Service Worker: Syncing ${analyticsQueue.length} analytics events`);
  
  const eventsToSync = [...analyticsQueue];
  analyticsQueue = [];
  
  for (const event of eventsToSync) {
    try {
      await sendAnalyticsEvent(event);
    } catch (error) {
      // Put failed events back in queue
      analyticsQueue.push(event);
    }
  }
  
  console.log(`Service Worker: ${analyticsQueue.length} events remaining in queue`);
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
}

// Periodic cleanup (run every hour)
self.addEventListener('activate', () => {
  setInterval(() => {
    // Clean up old analytics events (keep only last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    analyticsQueue = analyticsQueue.filter(event => 
      new Date(event.properties.timestamp) > oneDayAgo
    );
  }, 60 * 60 * 1000); // 1 hour
});

console.log('Service Worker: Script loaded successfully');