import { t } from '@/i18n'
import type { PlaylistLoadOptions } from '@/services/providers'
import type { LocalFolderSession, LyricLine, Playlist, Track } from '@/types/music'
import { decodeBase64Url, encodeBase64Url } from '@/utils/base64Url'
import { parseLrc } from '@/utils/parseLrc'

const DB_NAME = 'lm-music-local-folder'
const DB_VERSION = 1
const STORE = 'handles'
const HANDLE_KEY = 'music-folder'
const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'webm'])

type LocalTrackReference = {
  path: string[]
  lastModified: number
  size: number
}

export function encodeLocalTrackId(reference: LocalTrackReference) {
  return `local:${encodeBase64Url(JSON.stringify(reference))}`
}

function decodeLegacyLocalTrackId(trackId: string): LocalTrackReference | null {
  const parts = trackId.replace(/^local:/, '').split(':')
  const size = Number(parts.pop())
  const lastModified = Number(parts.pop())
  const path = parts.join(':').split('/')
  if (!path.length || path.some((segment) => !segment) || !Number.isFinite(lastModified) || !Number.isFinite(size)) return null
  return { path, lastModified, size }
}

export function decodeLocalTrackId(trackId: string): LocalTrackReference | null {
  if (!trackId.startsWith('local:')) return null
  const encodedReference = trackId.slice('local:'.length)
  try {
    const reference = JSON.parse(decodeBase64Url(encodedReference)) as Partial<LocalTrackReference>
    if (
      !Array.isArray(reference.path)
      || reference.path.length === 0
      || reference.path.some((segment) => typeof segment !== 'string' || !segment)
      || !Number.isFinite(reference.lastModified)
      || !Number.isFinite(reference.size)
    ) return null
    return {
      path: reference.path,
      lastModified: reference.lastModified,
      size: reference.size,
    }
  } catch {
    // Support previously persisted ids while new scans use the unambiguous format.
    return decodeLegacyLocalTrackId(trackId)
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(handle, HANDLE_KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

async function getDirectoryHandle() {
  const database = await openDatabase()
  return new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).get(HANDLE_KEY)
    request.onsuccess = () => resolve(request.result as FileSystemDirectoryHandle | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function ensureReadPermission(handle: FileSystemDirectoryHandle) {
  if (await handle.queryPermission?.({ mode: 'read' }) === 'granted') return true
  return await handle.requestPermission?.({ mode: 'read' }) === 'granted'
}

function isAudioFile(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  return Boolean(extension && AUDIO_EXTENSIONS.has(extension))
}

function cleanTitle(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

async function readLyrics(handle?: FileSystemFileHandle) {
  if (!handle) return []
  try {
    return parseLrc(await (await handle.getFile()).text())
  } catch {
    return []
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Local folder scan cancelled.', 'AbortError')
}

async function scanDirectory(handle: FileSystemDirectoryHandle, path: string[] = [], options: PlaylistLoadOptions = {}): Promise<Track[]> {
  const tracks: Track[] = []
  const audioFiles: FileSystemFileHandle[] = []
  const lyricsFiles = new Map<string, FileSystemFileHandle>()

  for await (const [name, entry] of handle.entries()) {
    throwIfAborted(options.signal)
    if (entry.kind === 'directory') {
      tracks.push(...await scanDirectory(entry, [...path, name], options))
      continue
    }
    if (name.toLowerCase().endsWith('.lrc')) {
      lyricsFiles.set(cleanTitle(name).toLowerCase(), entry)
      continue
    }
    if (isAudioFile(name)) audioFiles.push(entry)
  }

  for (const entry of audioFiles) {
    throwIfAborted(options.signal)
    const file = await entry.getFile()
    options.onProgress?.(1)
    const title = cleanTitle(file.name)
    const folderArtist = path.at(-1)
    const lyrics = await readLyrics(lyricsFiles.get(title.toLowerCase()))
    tracks.push({
      id: encodeLocalTrackId({ path: [...path, file.name], lastModified: file.lastModified, size: file.size }),
      title,
      artist: folderArtist || t('artist.unknown'),
      album: path.at(-2),
      duration: 0,
      streamUrl: '',
      lyrics,
      allowOfflineDownload: false,
    })
  }
  return tracks.sort((left, right) => left.title.localeCompare(right.title))
}

export async function resolveLocalStreamUrl(trackId: string): Promise<string | null> {
  const reference = decodeLocalTrackId(trackId)
  if (!reference) return null
  const handle = await getDirectoryHandle()
  if (!handle || !await ensureReadPermission(handle)) return null
  try {
    let dir = handle
    for (const segment of reference.path.slice(0, -1)) dir = await dir.getDirectoryHandle(segment)
    const fileHandle = await dir.getFileHandle(reference.path.at(-1)!)
    return URL.createObjectURL(await fileHandle.getFile())
  } catch {
    return null
  }
}

export class LocalFolderClient {
  static async connect(): Promise<LocalFolderSession> {
    if (!window.showDirectoryPicker) throw new Error(t('error.localFolderUnsupported'))
    const handle = await window.showDirectoryPicker()
    await saveDirectoryHandle(handle)
    return { provider: 'local', serverUrl: 'local://folder', username: handle.name }
  }

  async getPlaylists(options: PlaylistLoadOptions = {}): Promise<Playlist[]> {
    const handle = await getDirectoryHandle()
    if (!handle || !await ensureReadPermission(handle)) throw new Error(t('error.localFolderPermission'))
    const scannedFiles = { value: 0 }
    const tracks = await scanDirectory(handle, [], {
      ...options,
      onProgress: (count) => {
        scannedFiles.value += count
        options.onProgress?.(scannedFiles.value)
      },
    })
    return [{ id: 'local-folder', name: handle.name, coverUrl: tracks[0]?.coverUrl, tracks }]
  }

  async getLyrics(): Promise<LyricLine[]> {
    return []
  }
}
