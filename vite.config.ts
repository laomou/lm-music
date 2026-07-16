import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.BASE_PATH ?? './'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'LM Music',
        short_name: 'LM Music',
        description: '支持 Jellyfin、Navidrome 与 Audius 的 PWA 音乐播放器',
        theme_color: '#0b0c12',
        background_color: '#0b0c12',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Playlists', short_name: 'Playlists', url: `${base}#/playlists`, icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Downloads', short_name: 'Downloads', url: `${base}#/downloads`, icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          { name: 'Settings', short_name: 'Settings', url: `${base}#/settings`, icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Covers can come from Jellyfin, Navidrome, or Audius CDN mirrors.
            // Cache all image requests rather than only Jellyfin's /Images path.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'lm-music-artwork',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/Lyrics'),
            handler: 'NetworkFirst',
            options: { cacheName: 'lm-music-lyrics', networkTimeoutSeconds: 4, expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            // Explicit downloads are written to this cache. This route makes
            // the same Jellyfin stream URL available while the device is offline.
            urlPattern: ({ url }) => url.pathname.includes('/Audio/'),
            handler: 'CacheFirst',
            options: { cacheName: 'lm-music-media-v1', expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
