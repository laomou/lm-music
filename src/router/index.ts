import { createRouter, createWebHashHistory } from 'vue-router'
import ConnectView from '@/views/ConnectView.vue'
import PlaylistsView from '@/views/PlaylistsView.vue'
import PlaylistDetailView from '@/views/PlaylistDetailView.vue'
import NowPlayingView from '@/views/NowPlayingView.vue'
import SettingsView from '@/views/SettingsView.vue'
import DownloadsView from '@/views/DownloadsView.vue'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  // GitHub Pages cannot rewrite arbitrary SPA paths to index.html.
  // Hash routes keep direct links working on the static host.
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/playlists' },
    { path: '/connect', component: ConnectView, meta: { titleKey: 'page.connect' } },
    { path: '/playlists', component: PlaylistsView, meta: { titleKey: 'library.title' } },
    { path: '/playlist/:id', component: PlaylistDetailView, props: true, meta: { titleKey: 'playlist.label' } },
    { path: '/now-playing', component: NowPlayingView, meta: { titleKey: 'player.nowPlaying' } },
    { path: '/settings', component: SettingsView, meta: { titleKey: 'common.settings' } },
    { path: '/downloads', component: DownloadsView, meta: { titleKey: 'downloads.title' } },
    { path: '/:pathMatch(.*)*', redirect: '/playlists' },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    return savedPosition ?? { top: 0, behavior }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/connect' && !auth.isConnected && !['/playlists', '/downloads'].includes(to.path)) {
    return '/connect'
  }
})
