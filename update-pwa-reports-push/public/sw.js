'use strict';
// يستقبل الإشعارات ويعرضها. مفيش تخزين مؤقت للصفحات عشان التحديثات توصل فوراً.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let msg = { title: 'متابعة مدارس الأحد', body: 'افتح الموقع.' };
    try {
      const r = await fetch('/api/push/message', { credentials: 'same-origin', cache: 'no-store' });
      if (r.ok) msg = await r.json();
    } catch { /* نعرض الرسالة العامة */ }
    await self.registration.showNotification(msg.title, {
      body: msg.body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', lang: 'ar', dir: 'rtl', tag: 'sunday-school', data: { url: '/' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('/');
  })());
});
