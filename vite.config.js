import { defineConfig } from "vite"
import { configDefaults } from "vitest/config"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    minify: false
  },
  test: {
    globals: true,
    // .direnv 以下にはnixが作るリポジトリのコピーが入るため、テストを二重に拾わないよう除外する
    exclude: [...configDefaults.exclude, "**/.direnv/**"],
  },
})
