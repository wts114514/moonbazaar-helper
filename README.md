# MoonBazaar Helper (Open Source)

> 📦 **想下载软件？** 去 [moonbazaar-auto Releases](https://github.com/wts114514/moonbazaar-auto/releases)
> 🐛 **想反馈 Bug？** 去 [moonbazaar-auto Issues](https://github.com/wts114514/moonbazaar-auto/issues)
> 💬 **用户群 / FAQ？** 访问 [moonbazaar.de5.net](https://moonbazaar.de5.net)

这个仓库是 MoonBazaar Helper 的**开源部分**，包含 Electron 框架、UI 层、接口定义和架构文档。

**核心模块未开源**，包括：
- `preload-inject.js`（注入到 MoonBazaar 页面的核心脚本）
- 完整的 Cloudflare Worker 后端实现
- 卡密生成与校验算法
- 请求签名机制

---

## 这是什么

MoonBazaar Helper 是一款 Windows 桌面工具，帮助用户更高效地完成 [MoonBazaar](https://moonbazaar.xyz) 平台上的问卷任务。

## 开源范围

| 模块 | 状态 | 说明 |
|---|---|---|
| Electron 主进程框架 | ✅ 开源 | 窗口管理、多标签浏览器、自动更新 |
| 前端 UI | ✅ 开源 | Tailwind + Font Awesome |
| IPC 接口定义 | ✅ 开源 | 主进程与渲染进程的通信接口 |
| Worker 路由结构 | ✅ 开源（Demo） | 只展示 API 设计，不含实现 |
| 核心注入脚本 | ❌ 闭源 | 核心资产 |
| Worker 完整实现 | ❌ 闭源 | 涉及签名、卡密、KV 缓存 |
| 卡密算法 | ❌ 闭源 | 商业机密 |

## 技术栈

- **Electron 30** — 桌面应用框架
- **Tailwind CSS** — UI 样式
- **Cloudflare Workers + D1 + KV + R2** — 后端
- **electron-updater** — 自动更新
- **electron-builder** — 打包

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发版
npm start