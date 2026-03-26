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

