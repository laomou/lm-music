# GitHub Pages 部署

项目已配置为在推送到 `main` 分支时自动部署到 GitHub Pages。

## 一次性仓库设置

1. 打开 GitHub 仓库的 **Settings → Pages**。
2. 在 **Build and deployment** 中，将 **Source** 选择为 **GitHub Actions**。
3. 推送代码到 `main` 分支，等待 **Deploy GitHub Pages** 工作流完成。

本仓库地址为 `laomou/lm-music` 时，默认访问地址是：

```text
https://laomou.github.io/lm-music/
```

## 配置说明

- 工作流文件：`.github/workflows/deploy-pages.yml`
- GitHub Pages 构建时使用 `/lm-music/` 作为资源基础路径。
- Vue Router 使用 hash 路由，因此 `#/playlist/<id>` 等深链接无需 GitHub Pages 提供服务器端重写。
- 本地开发使用 `npm run dev`；本地生产构建使用相对资源路径，不受 GitHub Pages 子目录影响。
