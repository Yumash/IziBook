/**
 * IziBook — лёгкий PWA: canvas-иконка + blob-manifest.
 * Service Worker нет — полноценного офлайна (кроме кэша браузера) нет.
 */
window.IziBook = window.IziBook || {};

(function (IB) {
  'use strict';

  function makeIcon() {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 192;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 192, 192);
      g.addColorStop(0, '#f97316');
      g.addColorStop(1, '#fbbf24');
      x.fillStyle = g;
      x.beginPath();
      if (typeof x.roundRect === 'function') x.roundRect(0, 0, 192, 192, 42);
      else x.rect(0, 0, 192, 192);
      x.fill();
      x.font = '110px serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('🦊', 96, 104);
      return c.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  IB.initPwa = function () {
    try {
      const icon = makeIcon();
      if (!icon) return;
      const ati = document.createElement('link');
      ati.rel = 'apple-touch-icon';
      ati.href = icon;
      document.head.appendChild(ati);
      const manifest = {
        name: 'IziBook',
        short_name: 'IziBook',
        display: 'standalone',
        background_color: '#0f1712',
        theme_color: '#0f1712',
        icons: [{ src: icon, sizes: '192x192', type: 'image/png', purpose: 'any' }]
      };
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
      document.head.appendChild(link);
    } catch (e) {
      console.warn('pwa:', e);
    }
  };
})(window.IziBook);
