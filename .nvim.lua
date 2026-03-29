-- LSP 設定
-- テストで古いバージョンの Neovim を起動したときのエラー回避
if vim.fn.has('nvim-0.11') == 1 then
  local lsp_names = {
    'ts_ls',
    'emmet'
  }

  vim.lsp.enable(lsp_names)
  -- 複数 LSP クライアントの inlay hint 状態管理バグ (neovim/neovim#36318) の回避
  -- ts_ls + eslint 等が混在する環境で bufstate.version の更新タイミングにより
  -- 古いバージョンのヒントが on_win で描画され nvim_buf_set_extmark の col 範囲外エラーが発生する
  -- LspAttach 内で無効化することで、グローバル設定の enable(true) より後に実行されるようにする
  -- vim.api.nvim_create_autocmd('LspAttach', {
  --   callback = function(args)
  --     vim.lsp.inlay_hint.enable(false, { bufnr = args.buf })
  --   end,
  -- })
  local _, result = pcall(vim.lsp.document_color.enable, true, 0, { style = 'virtual' })
end

vim.env.ESLINT_D_PPID = vim.fn.getpid()
local lint = require("lint")
lint.linters_by_ft = {
  javascript      = { "eslint_d" },
  javascriptreact = { "eslint_d" },
  typescript      = { "eslint_d" },
  typescriptreact = { "eslint_d" },
}

local lint_augroup = vim.api.nvim_create_augroup("lint", { clear = true })

vim.api.nvim_create_autocmd({ "BufEnter", "BufWritePost", "InsertLeave" }, {
  group = lint_augroup,
  callback = function()
    lint.try_lint()
  end,
})

vim.keymap.set("n", "<leader>l", function()
  lint.try_lint()
end, { desc = "Trigger linting for current file" })

--- dap 設定
local dap = require("dap")

-- JS_DEBUG_SERVER が未設定なら警告して終了
local js_debug_server = vim.fn.getenv("JS_DEBUG_SERVER")
if js_debug_server == vim.NIL or js_debug_server == "" then
  vim.notify("[dap] JS_DEBUG_SERVER is not set. Run `nix develop` first.", vim.log.levels.WARN)
  return
end

-- アダプタ設定
dap.adapters.firefox = {
  type = "executable",
  command = "node",
  args = { js_debug_server },
}

-- 設定
local config = {
  {
    type = "firefox",
    request = "launch",
    name = "Launch Firefox (Vite)",
    url = "http://localhost:5173",
    webRoot = "${workspaceFolder}",
    firefoxExecutable = vim.fn.exepath("firefox"),
  },
}

dap.configurations.html = config
dap.configurations.javascript = config
dap.configurations.typescript = config

-- プロジェクトローカルなキーマップ
local map = function(k, f)
  vim.keymap.set("n", k, f, { buffer = false, desc = "[dap] " .. k })
end

map("<F5>", dap.continue)
map("<F9>", dap.toggle_breakpoint)
map("<F10>", dap.step_over)
map("<F11>", dap.step_into)
map("<S-F11>", dap.step_out)
map("<leader>ar", dap.repl.open)
map("<leader>ax", dap.terminate)

