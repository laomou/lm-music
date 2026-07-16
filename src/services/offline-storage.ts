import type { Playlist, Track } from '@/types/music'
import { t } from '@/i18n'

const DB_NAME = 'lm-music-offline'
const DB_VERSION = 1
const CACHE_NAME = 'lm-music-media-v1'
const LIBRARY_STORE = 'libraries'
const DOWNLOAD_STORE = 'downloads'

type StoredLibrary = { id: string; playlists: Playlist[]; updatedAt: number }
export type DownloadedTrack = {
  id: string
  serverId: string
  trackId: string
  playlistId?: string
  title: string
  artist: string
  bytes: number
  downloadedAt: number
  audioCacheKey: string
  coverCacheKey?: string
}

type DownloadSummary = {
  tracks: DownloadedTrack[]
  totalBytes: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(LIBRARY_STORE)) database.createObjectStore(LIBRARY_STORE, { keyPath: 'id' })
      if (!database.objectStoreNames.contains(DOWNLOAD_STORE)) database.createObjectStore(DOWNLOAD_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function getRecord<T>(storeName: string, key: string): Promise<T | undefined> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function putRecord(storeName: string, value: unknown): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(value)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

async function deleteRecord(storeName: string, key: string): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

async function allRecords<T>(storeName: string): Promise<T[]> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

export function serverCacheId(serverUrl?: string, userId?: string, provider?: string) {
  return serverUrl && userId ? `${provider ?? 'jellyfin'}::${serverUrl.replace(/\/$/, '')}::${userId}` : 'offline'
}

export async function saveLibrary(serverId: string, playlists: Playlist[]) {
  await putRecord(LIBRARY_STORE, { id: serverId, playlists, updatedAt: Date.now() } satisfies StoredLibrary)
}

export async function getLibrary(serverId: string) {
  return getRecord<StoredLibrary>(LIBRARY_STORE, serverId)
}

type DownloadProgress = (receivedBytes: number, totalBytes: number) => void

async function readResponseWithProgress(response: Response, onProgress?: DownloadProgress) {
  const totalBytes = Number(response.headers.get('content-length')) || 0
  if (!response.body || !onProgress) {
    const blob = await response.blob()
    onProgress?.(blob.size, totalBytes || blob.size)
    return { response: new Response(blob, { status: response.status, statusText: response.statusText, headers: response.headers }), bytes: blob.size }
  }

  const reader = response.body.getReader()
  const chunks: ArrayBuffer[] = []
  let receivedBytes = 0
  onProgress(0, totalBytes)
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer)
    receivedBytes += value.byteLength
    onProgress(receivedBytes, totalBytes)
  }

  const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'audio/*' })
  onProgress(receivedBytes, totalBytes || receivedBytes)
  return { response: new Response(blob, { status: response.status, statusText: response.statusText, headers: response.headers }), bytes: receivedBytes }
}

export async function downloadTrack(serverId: string, track: Track, playlistId?: string, signal?: AbortSignal, onProgress?: DownloadProgress): Promise<DownloadedTrack> {
  const cache = await caches.open(CACHE_NAME)
  const audioResponse = await fetch(track.streamUrl, { signal })
  if (!audioResponse.ok) throw new Error(t('error.trackDownloadFailed', { title: track.title, status: audioResponse.status }))
  const { response: cachedAudioResponse, bytes: audioBytes } = await readResponseWithProgress(audioResponse, onProgress)
  await cache.put(track.streamUrl, cachedAudioResponse)

  let coverCacheKey: string | undefined
  if (track.coverUrl) {
    const coverResponse = await fetch(track.coverUrl, { signal })
    if (coverResponse.ok) {
      await cache.put(track.coverUrl, coverResponse.clone())
      coverCacheKey = track.coverUrl
    }
  }

  const record: DownloadedTrack = {
    id: `${serverId}::${track.id}`,
    serverId,
    trackId: track.id,
    playlistId,
    title: track.title,
    artist: track.artist,
    bytes: audioBytes,
    downloadedAt: Date.now(),
    audioCacheKey: track.streamUrl,
    coverCacheKey,
  }
  await putRecord(DOWNLOAD_STORE, record)
  return record
}

export async function getDownloadedTracks(serverId: string): Promise<DownloadSummary> {
  const tracks = (await allRecords<DownloadedTrack>(DOWNLOAD_STORE))
    .filter((item) => serverId === 'offline' || item.serverId === serverId)
    .sort((left, right) => right.downloadedAt - left.downloadedAt)
  return { tracks, totalBytes: tracks.reduce((total, item) => total + item.bytes, 0) }
}

export async function deleteDownloadedTrack(id: string) {
  const record = await getRecord<DownloadedTrack>(DOWNLOAD_STORE, id)
  if (!record) return
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(record.audioCacheKey)
  if (record.coverCacheKey) await cache.delete(record.coverCacheKey)
  await deleteRecord(DOWNLOAD_STORE, id)
}

export async function clearServerOfflineData(serverId: string, includeMetadata = true) {
  const tracks = (await allRecords<DownloadedTrack>(DOWNLOAD_STORE)).filter((item) => serverId === 'offline' || item.serverId === serverId)
  await Promise.all(tracks.map((item) => deleteDownloadedTrack(item.id)))
  if (includeMetadata) await deleteRecord(LIBRARY_STORE, serverId)
}

export async function getCachedAudioUrl(sourceUrl: string): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME)
  const response = await cache.match(sourceUrl)
  if (!response) return null
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false
  return navigator.storage.persist()
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return { usage: 0, quota: 0 }
  const estimate = await navigator.storage.estimate()
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
}
