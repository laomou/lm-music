# LM Music

[中文说明](./README_zh.md)

LM Music is a browser music player for Jellyfin, Navidrome / OpenSubsonic, Audius, and local music folders.

Live site: <https://laomou.github.io/lm-music/>

## Supported music sources

| Source | Account required | Notes |
| --- | --- | --- |
| Jellyfin | Yes | Connect your own Jellyfin music library. |
| Navidrome / OpenSubsonic | Yes | Connect any music server compatible with the OpenSubsonic API. |
| Audius | No | Browse the public Audius catalog. Streaming only. |
| Local music folder | No | Choose a local music folder in the browser. Files are never uploaded. |

## Quick start

1. Open LM Music.
2. Choose a music source on the connection page.
3. Enter source details or choose a local folder.
4. Browse playlists, albums, artists, favorites, and recently played tracks.
5. Click a track to play.

## Connect Jellyfin

1. Choose `Jellyfin` as the music source.
2. Enter the server URL, for example:

   ```text
   https://jellyfin.example.com
   ```

3. Enter your Jellyfin username and password.
4. Click connect.

Notes:

- If LM Music is opened over HTTPS, Jellyfin must also be served over HTTPS.
- Browsers block HTTPS pages from loading HTTP music servers.
- If Jellyfin has no usable playlists, LM Music tries to show `All Jellyfin tracks`.
- Some audio formats may require Jellyfin transcoding for browser playback.

## Connect Navidrome / OpenSubsonic

1. Choose `Navidrome` as the music source.
2. Enter the server URL, for example:

   ```text
   https://music.example.com
   ```

3. Enter your username and password.
4. Click connect.

Notes:

- The server must allow browser access to the API and audio streams.
- If LM Music is opened over HTTPS, the Navidrome server should also use HTTPS.

## Use Audius

1. Choose `Audius` as the music source.
2. Click browse Audius.
3. Play public music without an account.

Notes:

- Audius is streaming only.
- Audius does not support offline downloads.
- Public nodes may occasionally be unavailable. If playback fails, try again later or choose another track.

## Use a local music folder

1. Choose `Local Folder` as the music source.
2. Click choose local folder.
3. The browser opens a folder picker.
4. Choose a folder that contains music files.
5. LM Music recursively scans audio files and creates a local playlist.

Supported audio formats:

```text
mp3, flac, m4a, aac, ogg, opus, wav, webm
```

Local lyrics support same-folder `.lrc` files with the same base name, for example:

```text
Qing Tian.flac
Qing Tian.lrc
```

Notes:

- Local files are never uploaded.
- Local folder support works best in Chrome / Edge.
- Safari / Firefox have limited folder picker support.
- After reopening the app, the browser may ask for folder permission again.

## Library browsing

LM Music can browse:

- Playlists
- Albums
- Artists
- Matching tracks from search
- Favorites
- Recently played tracks

Albums and artists are derived from the loaded tracks, so they work best with Jellyfin, Navidrome, and local folders.

## Player features

- Play / pause
- Previous / next
- Shuffle
- Repeat all / repeat one
- Volume control / mute
- Playback queue
- Add tracks to queue
- Remove tracks from queue
- Clear upcoming queue
- Drag to reorder the playback queue
- Local favorites
- Recently played tracks
- Synced lyrics display
- Click lyrics to seek

## Offline content

Jellyfin and Navidrome support downloading tracks into the browser cache.

Use the download button in playlists or track lists.

The downloads page shows:

- Downloaded tracks
- Download tasks
- Download progress
- Music cache size
- Browser storage usage and quota
- Remove one or all offline downloads

Notes:

- Audius does not support offline downloads.
- Local folders do not need offline downloads because files are already on the device.
- Browsers may evict cached content when storage is low.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Space | Play / pause |
| ← | Seek backward 5 seconds |
| → | Seek forward 5 seconds |
| M | Mute / unmute |
| N | Next track |
| P | Previous track / restart current track |

Shortcuts do not trigger while focus is inside inputs, selects, buttons, links, or editable areas.

## Install on desktop or mobile

When supported by the browser, use the install entry in Settings to add LM Music to the desktop or home screen.

Installed apps open like regular standalone apps.

## FAQ

### Why does an HTTP Jellyfin server fail to connect?

If LM Music is opened over HTTPS, such as GitHub Pages, the browser blocks access to HTTP music servers.

Fix it by either:

- Serving Jellyfin / Navidrome over HTTPS; or
- Opening LM Music from a local HTTP environment.

### Why does Jellyfin show tracks even when I have no playlists?

LM Music shows Jellyfin playlists first.

If no usable playlists exist, it tries to show:

```text
All Jellyfin tracks
```

### Why do some tracks fail to play?

Possible causes:

- The browser does not support the audio format.
- Jellyfin / Navidrome needs to transcode the track.
- The server does not allow cross-origin browser access.
- An HTTPS page tried to load an HTTP music stream.

### Why does artwork not appear?

Possible causes:

- The music file has no artwork.
- Jellyfin / Navidrome has no matching image.
- An HTTPS page blocked an HTTP image.

LM Music shows the app icon as fallback artwork in these cases.
