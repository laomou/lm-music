import { t } from '@/i18n'
import type { LocalFolderSession, LyricLine, Playlist, Track } from '@/types/music'
import { parseLrc } from '@/utils/parseLrc'

const DB_NAME = 'lm-music-local-folder'
const DB_VERSION = 1
const STORE = 'handles'
const HANDLE_KEY = 'music-folder'
const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'webm'])

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

async function scanDirectory(handle: FileSystemDirectoryHandle, path: string[] = []): Promise<Track[]> {
  const tracks: Track[] = []
  const audioFiles: FileSystemFileHandle[] = []
  const lyricsFiles = new Map<string, FileSystemFileHandle>()

  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === 'directory') {
      tracks.push(...await scanDirectory(entry, [...path, name]))
      continue
    }
    if (name.toLowerCase().endsWith('.lrc')) {
      lyricsFiles.set(cleanTitle(name).toLowerCase(), entry)
      continue
    }
    if (isAudioFile(name)) audioFiles.push(entry)
  }

  for (const entry of audioFiles) {
    const file = await entry.getFile()
    const title = cleanTitle(file.name)
    const folderArtist = path.at(-1)
    const lyrics = await readLyrics(lyricsFiles.get(title.toLowerCase()))
    tracks.push({
      id: `local:${[...path, file.name].join('/')}:${file.lastModified}:${file.size}`,
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
  const parts = trackId.replace(/^local:/, '').split(':')
  parts.pop() // size
  parts.pop() // lastModified
  const relativePath = parts.join(':')
  const segments = relativePath.split('/')
  const handle = await getDirectoryHandle()
  if (!handle || !await ensureReadPermission(handle)) return null
  try {
    let dir = handle
    for (const segment of segments.slice(0, -1)) dir = await dir.getDirectoryHandle(segment)
    const fileHandle = await dir.getFileHandle(segments.at(-1)!)
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

  async getPlaylists(): Promise<Playlist[]> {
    const handle = await getDirectoryHandle()
    if (!handle || !await ensureReadPermission(handle)) throw new Error(t('error.localFolderPermission'))
    const tracks = await scanDirectory(handle)
    return [{ id: 'local-folder', name: handle.name, coverUrl: tracks[0]?.coverUrl, tracks }]
  }

  async getLyrics(): Promise<LyricLine[]> {
    return []
  }
}
