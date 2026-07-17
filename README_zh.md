# LM Music

[English](./README.md)

LM Music 是一个浏览器音乐播放器，支持 Jellyfin、Navidrome / OpenSubsonic、Audius，以及本地音乐文件夹。

在线地址：<https://laomou.github.io/lm-music/>

## 支持的音乐来源

| 来源 | 是否需要账号 | 说明 |
| --- | --- | --- |
| Jellyfin | 需要 | 连接自己的 Jellyfin 音乐库。 |
| Navidrome / OpenSubsonic | 需要 | 连接兼容 OpenSubsonic API 的音乐服务。 |
| Audius | 不需要 | 浏览 Audius 公开音乐目录，仅在线播放。 |
| 本地音乐文件夹 | 不需要 | 从浏览器选择本机音乐文件夹，文件不会上传。 |

## 快速使用

1. 打开 LM Music。
2. 在连接页选择音乐来源。
3. 按来源填写信息或选择本地文件夹。
4. 进入音乐库后，可以浏览歌单、专辑、艺术家、收藏和最近播放。
5. 点击歌曲即可播放。

## 连接 Jellyfin

1. 在音乐来源里选择 `Jellyfin`。
2. 填写服务器地址，例如：

   ```text
   https://jellyfin.example.com
   ```

3. 输入 Jellyfin 用户名和密码。
4. 点击连接。

注意：

- 如果 LM Music 是通过 HTTPS 打开的，Jellyfin 也需要使用 HTTPS。
- 浏览器会阻止 HTTPS 页面访问 HTTP 音乐服务器。
- 如果 Jellyfin 没有播放列表，LM Music 会尝试显示“Jellyfin 所有歌曲”。
- 某些音频格式可能需要 Jellyfin 转码为浏览器可播放格式。

## 连接 Navidrome / OpenSubsonic

1. 在音乐来源里选择 `Navidrome`。
2. 填写服务器地址，例如：

   ```text
   https://music.example.com
   ```

3. 输入用户名和密码。
4. 点击连接。

注意：

- 服务端需要允许浏览器访问 API 和音频流。
- 如果通过 HTTPS 打开 LM Music，Navidrome 服务器也建议使用 HTTPS。

## 使用 Audius

1. 在音乐来源里选择 `Audius`。
2. 点击浏览 Audius。
3. 无需账号即可播放公开音乐。

注意：

- Audius 仅支持在线播放。
- Audius 不支持离线下载。
- 公共节点偶尔可能不可用，播放失败时可以稍后重试或换一首歌。

## 使用本地音乐文件夹

1. 在音乐来源里选择 `Local Folder`。
2. 点击选择本地文件夹。
3. 浏览器会弹出文件夹选择器。
4. 选择包含音乐文件的文件夹。
5. LM Music 会递归扫描其中的音频文件并生成本地歌单。

支持的音频格式：

```text
mp3, flac, m4a, aac, ogg, opus, wav, webm
```

本地歌词支持同目录同名 `.lrc` 文件，例如：

```text
晴天.flac
晴天.lrc
```

注意：

- 本地文件不会上传到服务器。
- 本地文件夹功能主要支持 Chrome / Edge。
- Safari / Firefox 对选择文件夹支持较弱。
- 重新打开应用后，浏览器可能要求重新授权访问文件夹。

## 播放器功能

- 播放 / 暂停
- 上一首 / 下一首
- 随机播放
- 列表循环 / 单曲循环
- 音量控制 / 静音
- 播放队列
- 添加歌曲到队列
- 移除队列歌曲
- 清空待播队列
- 拖拽排序播放队列
- 收藏歌曲
- 最近播放
- 同步歌词显示
- 点击歌词跳转播放进度

## 离线内容

Jellyfin 和 Navidrome 支持下载歌曲到浏览器缓存。

可以在歌单或歌曲列表中点击下载按钮。

下载页可以查看：

- 已下载歌曲
- 下载任务
- 下载进度
- 音乐缓存大小
- 浏览器存储占用和配额
- 清除单首或全部离线内容

注意：

- Audius 不支持离线下载。
- 本地音乐文件夹不需要离线下载，因为文件已经在本机。
- 浏览器可能会在存储空间不足时清理缓存。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| Space | 播放 / 暂停 |
| ← | 后退 5 秒 |
| → | 前进 5 秒 |
| M | 静音 / 取消静音 |
| N | 下一首 |
| P | 上一首 / 回到当前歌曲开头 |

快捷键不会在输入框、下拉框、按钮或可编辑区域中触发。

## 安装到桌面或手机

浏览器支持时，可以在设置页点击安装入口，将 LM Music 添加到桌面或手机主屏幕。

安装后可以像普通应用一样打开。

## 常见问题

### 为什么连接 HTTP Jellyfin 会失败？

如果 LM Music 是通过 HTTPS 打开的，例如 GitHub Pages，那么浏览器会阻止它访问 HTTP 音乐服务器。

解决方法：

- 给 Jellyfin / Navidrome 配置 HTTPS；或
- 在本地 HTTP 环境打开 LM Music。

### 为什么 Jellyfin 有歌但没有歌单？

LM Music 会优先显示 Jellyfin 播放列表。

如果没有可用播放列表，会尝试显示：

```text
Jellyfin 所有歌曲
```

### 为什么有些歌曲无法播放？

可能原因：

- 浏览器不支持该音频格式。
- Jellyfin / Navidrome 需要转码。
- 服务器没有开启跨域访问。
- HTTPS 页面访问了 HTTP 音乐流。

### 为什么封面不显示？

可能原因：

- 音乐文件没有封面。
- Jellyfin / Navidrome 没有对应图片。
- HTTP 图片被 HTTPS 页面阻止。

这种情况下 LM Music 会显示应用图标作为默认封面。
