# LM Music 设计文档

## 1. 产品定位

> **LM Music 是一个 PWA 优先的 Jellyfin 音乐播放器。**

用户连接自己的 Jellyfin 服务器后，可以浏览已有歌单、在线播放音乐、查看同步歌词，并将歌曲或歌单下载到浏览器本地，以便离线播放。

它不是音乐服务，也不管理用户的音乐文件。Jellyfin 负责音乐库、媒体文件、封面、歌词和歌单；LM Music 专注于现代、沉浸式的音乐播放体验。

## 2. 核心价值

1. **PWA 优先**
   - 可安装到手机主屏幕或电脑桌面。
   - 以独立应用窗口运行。
   - 一个 Vue Web 应用覆盖手机与桌面浏览器。

2. **离线播放**
   - 用户主动下载单曲或歌单。
   - 离线时仍能播放已下载歌曲、查看封面和同步歌词。
   - 缓存可查看、可删除、可清理。

3. **沉浸式歌词体验**
   - 支持 Jellyfin 提供的 LRC / ELRC 同步歌词。
   - 当前歌词高亮并自动居中。
   - 点击歌词跳转到对应播放时间。

4. **专注音乐**
   - 只做歌单、播放、歌词与离线内容。
   - 不做电影、电视剧、音乐库管理、上传、推荐或社交。

## 3. MVP 范围

### 要做

- 连接并登录 Jellyfin 服务器。
- 展示 Jellyfin 中用户可见的音乐歌单。
- 查看歌单曲目，播放歌单或单曲。
- 播放、暂停、上一首、下一首、进度跳转、音量和静音。
- 顺序播放、随机播放、单曲循环、列表循环。
- 显示封面、歌曲名、歌手名和同步歌词。
- 保存当前曲目、播放进度、音量和播放模式。
- 安装为 PWA，离线打开应用。
- 缓存歌单、曲目元数据、封面和歌词。
- 用户主动下载单曲或歌单，离线播放。
- 查看下载进度、缓存大小并清理离线内容。

### 不做

- 自建账号体系或上传音乐。
- 编辑 Jellyfin 音乐库或歌单。
- 音乐推荐、搜索发现、社交和评论。
- 影视、直播、播客等非音乐内容。
- 默认下载整个音乐库。
- 自行实现音频编解码或前端转码。

## 4. 用户流程

```text
首次打开
  → 选择 / 填写 Jellyfin 服务器地址
  → 输入用户名和密码
  → 登录成功
  → 浏览歌单
  → 打开歌单并播放
  → 查看歌词 / 管理队列
  → 可选：下载歌曲或歌单
```

离线时：

```text
打开已安装的 LM Music
  → 显示本地已下载内容
  → 选择已下载歌单
  → 本地播放歌曲与歌词
```

## 5. 信息架构

```text
/
├── /connect             连接 Jellyfin
├── /playlists           歌单首页
├── /playlist/:id        歌单详情与曲目列表
├── /now-playing         正在播放与同步歌词
├── /downloads           已下载内容与下载任务
└── /settings            Jellyfin 连接、缓存和应用设置
```

首页优先级：

1. 继续收听。
2. 已下载歌单与歌曲。
3. Jellyfin 在线歌单。

## 6. 页面设计

### 6.1 连接页

```text
LM Music

连接你的 Jellyfin 服务器

服务器地址
[ https://jellyfin.example.com ]

用户名
[                            ]

密码
[                            ]

[ 连接 Jellyfin ]
```

要求：

- 提示优先使用 HTTPS。
- 连接失败时展示明确错误原因。
- 登录成功后保存服务器地址、用户标识与会话信息。

### 6.2 歌单首页

```text
LM Music                         设置

继续收听
[ 封面 ] Midnight Drive · 01:24

已下载
[ 深夜播放 ] 24 首 · 已下载

你的歌单
[ 封面 ] 深夜播放
       24 首

[ 封面 ] 通勤
       18 首
```

离线时，仅显示可用的本地缓存内容，并清晰标识“离线模式”。

### 6.3 歌单详情

```text
返回

[ 歌单封面 ]
深夜播放
24 首 · 1 小时 32 分

[ 播放全部 ] [ 下载 ]

01  Midnight Drive              03:42
02  City Lights                 04:05
03  Slow Motion                 03:18
```

- 点击“播放全部”：以第一首开始建立队列。
- 点击单曲：以该曲为起点建立当前歌单队列。
- 当前歌曲高亮显示。
- 下载按钮显示下载、暂停、完成或失败状态。

### 6.4 正在播放

```text
收起                  正在播放

       [ 大尺寸专辑封面 ]

Midnight Drive
Example Artist

01:24 ━━━━━━━●────── 03:42

随机    上一首    播放/暂停    下一首    循环

────────── 歌词 ──────────

      淡色上一句

    高亮当前歌词

      淡色下一句

──────────────────────────

当前播放列表                       03 / 24
```

移动端默认深色、单列布局。桌面端可使用左右双栏：左侧为封面和控制，右侧为同步歌词。

## 7. 播放规则

### 队列

- 从歌单“播放全部”时，歌单全部歌曲成为播放队列。
- 点击单曲时，从该曲开始播放同一歌单队列。
- 当前歌曲结束后按照播放模式决定下一首。
- MVP 不要求在客户端编辑 Jellyfin 歌单。

### 播放模式

| 模式 | 行为 |
|---|---|
| 顺序 | 按队列顺序播放，最后一首结束后停止。 |
| 列表循环 | 最后一首结束后回到第一首。 |
| 单曲循环 | 当前歌曲结束后重新播放。 |
| 随机 | 随机选择下一首，同时保留历史以支持上一首。 |

## 8. 歌词

优先支持 Jellyfin 的外部或内嵌同步歌词。

推荐用户媒体目录：

```text
Music/
└── Artist/
    └── Album/
        ├── 01 - Midnight Drive.mp3
        ├── 01 - Midnight Drive.lrc
        └── cover.jpg
```

歌词逻辑：

1. 获取并解析 LRC / ELRC 时间戳。
2. 根据当前播放时间查找歌词行。
3. 高亮当前行并自动滚动至歌词区中央。
4. 点击任意有时间戳的歌词行，跳转到该时间。
5. 没有歌词时显示“暂无歌词”。

歌词数据模型：

```ts
type LyricLine = {
  time: number
  text: string
}
```

## 9. PWA 与本地优先策略

### 9.1 PWA 能力

- Web App Manifest：名称、图标、主题色、独立窗口模式。
- Service Worker：缓存应用壳并支持离线启动。
- 安装提示：不强制弹窗，在设置页和合适时机提供入口。
- 更新提示：检测到新版本后提示刷新；播放时不强制刷新。
- Media Session API：在浏览器支持时接入锁屏、耳机和系统媒体控制。

### 9.2 本地缓存层级

| 内容 | 存储方式 | 默认策略 |
|---|---|---|
| 应用代码、图标 | Service Worker 预缓存 | 自动 |
| 歌单与曲目元数据 | IndexedDB | 自动缓存最近内容 |
| 歌词 | IndexedDB | 自动缓存已访问内容 |
| 封面 | Cache Storage | 自动缓存已访问内容 |
| 播放偏好与进度 | IndexedDB 或 LocalStorage | 自动保存 |
| 音频 | Cache Storage | 仅用户主动下载 |

### 9.3 离线下载

下载歌单时，依次保存：

1. 歌单元数据；
2. 曲目元数据；
3. 封面；
4. 歌词；
5. 可播放音频响应。

离线状态下：

- 可以浏览和播放已下载内容。
- 可以查看已缓存封面与歌词。
- 不能访问未缓存歌单或在线播放未下载歌曲。

不应自动下载全库或后台无提示下载音频。

下载记录示例：

```ts
type DownloadedTrack = {
  trackId: string
  serverId: string
  localCacheKey: string
  downloadedAt: number
  bytes: number
  audioFormat: string
  sourceVersion?: string
}
```

设置页需要提供：

- 已使用空间估算；
- 下载歌单 / 单曲列表；
- 删除单项下载；
- 清除全部离线音频；
- 清除封面、歌词和元数据缓存。

## 10. 音频播放与解码

播放器使用浏览器原生 `<audio>` 元素：

```vue
<audio ref="audio" preload="metadata" />
```

流程：

```text
Jellyfin 音频
  → 浏览器可直接播放：Direct Play
  → 浏览器不兼容：Jellyfin / FFmpeg 转码
  → 浏览器 <audio> 解码并输出
```

优先使用浏览器常见兼容的音频格式，例如 MP3、AAC/M4A、FLAC 或 Opus。需要兼容时，由 Jellyfin 服务端转码为 AAC 或 MP3。

第一版不使用 Web Audio API 完整下载后解码，也不使用 FFmpeg.wasm 在前端转码。

## 11. 技术方案

### 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- 原生 HTML Audio API
- vite-plugin-pwa
- IndexedDB
- Cache Storage
- CSS Variables + 原生 CSS

### 建议目录结构

```text
src/
├── main.ts
├── App.vue
├── router/
│   └── index.ts
├── views/
│   ├── ConnectView.vue
│   ├── PlaylistsView.vue
│   ├── PlaylistDetailView.vue
│   ├── NowPlayingView.vue
│   ├── DownloadsView.vue
│   └── SettingsView.vue
├── components/
│   ├── player/
│   │   ├── AudioPlayer.vue
│   │   ├── MiniPlayer.vue
│   │   ├── PlayerControls.vue
│   │   ├── ProgressBar.vue
│   │   ├── QueueSheet.vue
│   │   └── VolumeControl.vue
│   ├── lyrics/
│   │   └── SyncedLyrics.vue
│   └── playlists/
│       ├── PlaylistCard.vue
│       └── TrackList.vue
├── stores/
│   ├── auth.ts
│   ├── jellyfin.ts
│   ├── player.ts
│   ├── downloads.ts
│   └── preferences.ts
├── services/
│   └── jellyfin/
│       ├── client.ts
│       ├── auth.ts
│       ├── playlists.ts
│       ├── media.ts
│       ├── lyrics.ts
│       ├── mappers.ts
│       └── types.ts
├── composables/
│   ├── useAudioPlayer.ts
│   ├── useLyrics.ts
│   ├── useMediaSession.ts
│   └── usePersistedPlayer.ts
└── utils/
    ├── lrc.ts
    ├── formatDuration.ts
    └── shuffle.ts
```

### 状态划分

```ts
type RepeatMode = "off" | "all" | "one"

type PlayerState = {
  currentTrack: Track | null
  queue: Track[]
  currentIndex: number
  currentTime: number
  duration: number
  isPlaying: boolean
  volume: number
  muted: boolean
  shuffle: boolean
  repeatMode: RepeatMode
}
```

- `auth`：Jellyfin 服务器、登录会话、用户信息。
- `jellyfin`：歌单、曲目和 Jellyfin API 请求。
- `player`：全局播放状态和队列。
- `downloads`：下载任务、已下载内容和存储占用。
- `preferences`：主题与其他非播放偏好。

全局唯一的 `<audio>` 元素放在根组件或全局 `AudioPlayer.vue` 中，页面切换时不销毁，保证播放不断开。

## 12. 安全与边界

- 优先要求 Jellyfin 使用 HTTPS。
- 密码不写入 URL、日志或普通配置文件。
- 保存最少必要的会话信息。
- 退出登录或切换服务器时，清除该账户关联的私有元数据、歌词、封面和音频缓存。
- 若 Jellyfin 未正确配置跨域访问，PWA 需要和 Jellyfin 同域部署或通过受控代理访问。
- 本项目不提供任何音乐内容，用户仅播放其 Jellyfin 中已有且有权使用的内容。

## 13. 开发顺序

1. 初始化 Vue 3 + TypeScript + Vite + PWA 基础。
2. 使用本地 Mock 数据完成播放器、队列、播放模式和歌词 UI。
3. 实现 `<audio>` 播放、播放进度恢复和 Media Session。
4. 实现 Jellyfin 连接、认证、歌单与曲目读取。
5. 实现 Jellyfin 封面、音频流和歌词读取。
6. 实现 IndexedDB / Cache Storage 的元数据、封面和歌词缓存。
7. 实现单曲 / 歌单下载、离线播放、进度和缓存管理。
8. 补充离线、登录过期、播放失败、无歌词和空间不足等错误状态。

## 14. MVP 验收标准

- 用户可连接自己的 Jellyfin 服务器并重新打开应用后恢复会话。
- 用户可查看歌单、曲目列表并开始播放。
- 播放控制、进度跳转、音量、随机与循环正确工作。
- 页面切换和刷新后可恢复当前曲目、队列和播放进度。
- 有 LRC / ELRC 歌词的歌曲可同步高亮，点击歌词可跳转。
- 应用可安装为 PWA，并在无网络时打开。
- 用户可下载单曲或歌单；离线时可播放已下载音频和显示相关歌词、封面。
- 用户可查看缓存占用并清理下载内容。
