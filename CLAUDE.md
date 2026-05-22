# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 开发：concurrently 同时跑 Vite + Electron（Electron 会 wait-on localhost:5173）
npm run dev:vite     # 只跑 Vite 开发服务器
npm run dev:electron # 只跑 Electron（需 Vite 已在 5173 运行）
npm run build        # vite build → 产物输出到 dist/
npm start            # electron .（加载 dist/ 里的生产构建，需先 build）
```

无测试、无 lint 脚本。

## Architecture

Electron + React + Vite 桌面番茄钟。两个进程：

- **主进程** `electron/main.cjs` — 创建 420×640 的 `BrowserWindow`。`isDev = !app.isPackaged` 决定加载方式：开发时 `loadURL('http://localhost:5173')`，打包后 `loadFile('dist/index.html')`。
- **预加载** `electron/preload.cjs` — `contextIsolation: true` + `nodeIntegration: false`，只通过 `contextBridge` 暴露 `window.pomodoro.platform`。
- **渲染进程** `src/renderer/` — React 应用，Vite 的 `root`。

### 渲染层状态模型

`App.jsx` 是唯一的状态中枢，持有全部状态（`settings` / `tasks` / `activeTaskId` / `history`）并下发给三个 tab 视图（`Timer` / `Tasks` / `Stats`）。每个状态切片用 `useEffect` 在变更时自动写回 localStorage。

`storage.js` 是唯一的持久化层 —— 全部数据存在 localStorage 的 `pomo.*` 键下，没有后端。`todayKey()` 产出 `YYYY-MM-DD` 字符串，作为 `history` map 的键（每天完成的番茄数）。

**番茄完成的数据流**：`Timer` 工作倒计时归零 → 调 `onPomodoroComplete()` → `App` 同时给 `history[todayKey()]` 和当前 active task 的 `pomos` 计数 +1 → 自动切到休息模式。

### Timer 计时实现

`Timer.jsx` 用**墙钟目标时间**（`endRef = Date.now() + remaining*1000`）配合 250ms `setInterval` 计算剩余秒数，而非每 tick 递减。这样即使主线程卡顿，倒计时也不会漂移。

## 关键约束

- `vite.config.js` 的 `base: './'` 必须保留 —— 打包后 Electron 通过 `file://` 协议加载，绝对路径会 404。
- `server.strictPort: true` + 端口 `5173` 必须固定 —— `main.cjs` 硬编码连接 `http://localhost:5173`，端口漂移会导致窗口加载失败。
- 仓库无 Electron 打包工具（无 electron-builder）；`npm start` 只是用 `electron .` 跑 `dist/` 里已有的构建产物。
