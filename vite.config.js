// 从 vite 引入 defineConfig 辅助函数：用于提供类型推导和编辑器智能提示
import { defineConfig } from 'vite';
// 引入官方 React 插件：提供 JSX 转换、Fast Refresh（热更新保留组件状态）等能力
import react from '@vitejs/plugin-react';

// 导出 Vite 配置对象（默认导出，Vite 启动时会读取此配置）
export default defineConfig({
  // 插件列表：启用 React 支持（JSX 编译 + HMR 热替换）
  plugins: [react()],

  // 资源公共路径基准：'./' 表示使用相对路径
  // 在 Electron 场景中尤其重要——打包后通过 file:// 协议加载本地 HTML，
  // 必须使用相对路径，否则资源（JS/CSS/图片）会因绝对路径 '/' 找不到而 404
  base: './',

  // 项目根目录：Vite 会以 src/renderer 作为入口目录寻找 index.html
  // 这是 Electron 项目的常见结构：renderer 进程（前端）代码与 main 进程（后端）分离
  root: 'src/renderer',

  // 构建配置
  build: {
    // 产物输出目录：相对 root（src/renderer）向上两级，最终输出到项目根目录的 dist/
    // 这样 Electron 主进程就能从项目根目录的 dist/ 加载打包后的渲染层文件
    outDir: '../../dist',
    // 构建前清空输出目录，避免旧文件残留导致缓存问题
    emptyOutDir: true,
  },

  // 开发服务器配置
  server: {
    // 开发服务器监听端口
    port: 5173,
    // 严格端口模式：若 5173 被占用则直接报错退出，而不是自动切到其他端口
    // 这对 Electron 很关键——主进程需要硬编码连接 http://localhost:5173，
    // 端口必须确定，否则主窗口会加载失败
    strictPort: true,
  },
});
