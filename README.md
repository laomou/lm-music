# LM Music

LM Music 是一个面向浏览器和移动端安装场景的音乐播放器，支持连接个人音乐服务、浏览公开音乐目录，也支持播放本地音乐文件夹。

在线体验：<https://laomou.github.io/lm-music/>

## 功能特性

- **PWA 应用体验**：可安装到桌面或移动端主屏幕，支持离线资源缓存和新版本提示。
- **多音乐来源**：支持 Jellyfin、Navidrome / OpenSubsonic、Audius 公开音乐目录，以及本地音乐文件夹。
- **播放器能力**：播放 / 暂停、上一首 / 下一首、随机播放、循环模式、音量控制、播放队列管理。
- **歌词显示**：支持同步歌词展示和点击歌词跳转播放进度；本地文件夹支持同名 `.lrc` 歌词文件。
- **离线下载**：支持可下载来源的单曲和歌单缓存，显示下载进度、存储占用和浏览器存储配额。
- **系统媒体控制**：支持 Media Session，锁屏、通知栏、耳机控制等系统媒体入口可操作播放。
- **多语言**：内置中文和英文，语言选择会持久化保存。
- **资料库浏览**：支持歌单、专辑、艺术家、本地收藏、最近播放和搜索匹配歌曲。
- **移动端适配**：底部安全区域、应用图标、安装元信息和应用快捷入口已适配。

## 支持的音乐来源

| 来源 | 说明 | 离线下载 |
| --- | --- | --- |
| Jellyfin | 个人媒体服务器 | 支持 |
| Navidrome / OpenSubsonic | 兼容 OpenSubsonic API 的音乐服务 | 支持 |
| Audius | 公开音乐目录，无需账号 | 仅在线播放 |
| 本地音乐文件夹 | 通过浏览器选择本地文件夹，文件不上传 | 不需要 |

> 注意：Audius 是公开流媒体目录，不提供离线下载。本地音乐文件夹主要依赖浏览器 File System Access API，推荐使用 Chrome 或 Edge。Jellyfin / Navidrome 是否能正常播放，还取决于服务器 HTTPS / 跨域、音频格式和浏览器解码能力。

## 本地开发

推荐使用仓库自带的 Node 环境路径，或使用本机兼容版本的 Node.js。

```bash
npm ci
npm run dev
```

常用命令：

```bash
npm run typecheck
npm run build
npm run preview
```

## GitHub Pages 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages：

```text
.github/workflows/deploy-pages.yml
```

部署时会设置：

```bash
BASE_PATH=/<repository-name>/
```

这用于保证 Vite 静态资源、PWA Manifest 和 Service Worker 在 GitHub Pages 子路径下正常工作。

## 连接注意事项

### Jellyfin

- 服务器地址示例：`https://jellyfin.example.com`
- 需要用户名和密码。
- 如果浏览器无法播放某些音频，可能需要 Jellyfin 为浏览器转码。
- 如果请求失败，请检查服务器是否允许当前站点跨域访问。

### Navidrome / OpenSubsonic

- 服务器地址示例：`https://music.example.com`
- 使用 OpenSubsonic / Subsonic API 登录。
- 需要服务端允许浏览器访问对应 API 和音频流。

### Audius

- 无需账号。
- 仅支持在线播放。
- 公共节点偶尔可能不可用，播放失败时可稍后重试或切换歌曲。

### 本地音乐文件夹

- 在连接页选择 `Local Folder` / `本地音乐文件夹`。
- 浏览器会弹出文件夹选择器，LM Music 会递归扫描其中的音频文件。
- 支持常见音频格式：`mp3`、`flac`、`m4a`、`aac`、`ogg`、`opus`、`wav`、`webm`。
- 支持同目录同名 `.lrc` 歌词文件，例如：

  ```text
  晴天.flac
  晴天.lrc
  ```

- 文件只在本机浏览器中读取，不会上传到服务器。
- 刷新或重新打开后，浏览器可能要求重新授权访问该文件夹。

## 文档

设计和实现说明见：

```text
docs/design.md
```

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Vue I18n
- vite-plugin-pwa
- Lucide Icons

## License

目前未声明开源许可证。若需要公开复用，请先补充 LICENSE。
