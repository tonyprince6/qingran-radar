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

## DeepSeek 实时脚本拆解

复制环境变量示例并填写服务端密钥：

```bash
cp .env.example .env.local
```

服务端模式下，`DEEPSEEK_API_KEY` 只允许配置在服务端，不要添加 `VITE_` 前缀，也不要提交到 Git。默认使用 `deepseek-v4-flash`，可通过 `DEEPSEEK_MODEL` 切换。开发环境下 Vite 会在同一端口提供 `/api/analyze`；部署到 Vercel 时，`api/analyze.js` 会作为 Serverless Function 运行。

也支持设备自带密钥（BYOK）：在网页“API 配置”中填写后，Key 只保存在当前浏览器的 localStorage，分析请求通过 HTTPS 直接发送至 DeepSeek，不经过本站服务器。清除浏览器网站数据会同时清除该 Key；请勿在公共或不受信任设备上保存。

若 GitHub Pages 前端调用独立部署的接口，请在构建时设置 `VITE_ANALYZE_API_URL`，并在后端设置逗号分隔的 `ALLOWED_ORIGINS`。

数据快照位于 `public/data/douyin.json`。数据来源为抖音创作者中心，采集需要有效登录状态，并遵守平台访问限制；程序不会绕过验证码或风控。

发布到 GitHub Pages：

```bash
./scripts/publish-pages.sh
```

脚本会生成生产包并更新专用的 `gh-pages` 分支。定时采集任务在数据快照更新后调用这个脚本，让公网网站同步刷新。
