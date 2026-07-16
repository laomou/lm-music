import { createRouter, createWebHashHistory } from 'vue-router'
import ConnectView from '@/views/ConnectView.vue'
import PlaylistsView from '@/views/PlaylistsView.vue'
import PlaylistDetailView from '@/views/PlaylistDetailView.vue'
import NowPlayingView from '@/views/NowPlayingView.vue'
import SettingsView from '@/views/SettingsView.vue'
import DownloadsView from '@/views/DownloadsView.vue'

export const router = createRouter({
  // GitHub Pages cannot rewrite arbitrary SPA paths to index.html.
  // Hash routes keep direct links working on the static host.
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/playlists' },
    { path: '/connect', component: ConnectView },
    { path: '/playlists', component: PlaylistsView },
    { path: '/playlist/:id', component: PlaylistDetailView, props: true },
    { path: '/now-playing', component: NowPlayingView },
    { path: '/settings', component: SettingsView },
    { path: '/downloads', component: DownloadsView },
  ],
})
