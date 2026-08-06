# 轻燃雷达

面向减脂、减肥和体重管理内容创作者的抖音热点工作台。网站展示定时采集的数据快照，并提供热门话题筛选、视频文案拆解、四段式脚本编辑、选题管理和采集任务状态。

## 本地运行

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

数据快照位于 `public/data/douyin.json`。数据来源为抖音创作者中心，采集需要有效登录状态，并遵守平台访问限制；程序不会绕过验证码或风控。

推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。
