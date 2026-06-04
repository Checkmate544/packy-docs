import { existsSync } from "node:fs";
import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { build } from "esbuild";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "PackyAPI 使用文档",
  description: "Packy API 官方文档，提供最稳定、最便捷的 AI 模型中转服务。",

  theme,

  bundler: viteBundler({
    viteOptions: {
      server: {
        proxy: {
          "/packyapi": {
            target: "https://www.packyapi.com",
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/packyapi/, ""),
          },
        },
      },
    },
  }),

  // 修复：@vuepress/plugin-slimsearch 发布的搜索 Worker 没有打包，开头是裸引用
  // `import { isPlainObject } from "vuepress/shared"`。浏览器无法在 module worker
  // 里解析裸标识符，导致 Worker 一加载就崩溃、线上搜索永远卡在“搜索中”
  // （本地 dev 正常，仅因为 Vite 会即时改写该引用）。构建后用 esbuild 重新打包
  // 这个 Worker，把依赖内联进去，使其自包含。
  onGenerated: async (app) => {
    const workerFile = app.dir.dest("slimsearch.worker.js");
    if (!existsSync(workerFile)) return;
    await build({
      entryPoints: [workerFile],
      outfile: workerFile,
      allowOverwrite: true,
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "es2020",
      minify: true,
      legalComments: "none",
      logLevel: "warning",
    });
  },

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
