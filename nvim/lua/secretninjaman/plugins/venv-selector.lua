local M = {
  "linux-cultist/venv-selector.nvim",
  dependencies = { "neovim/nvim-lspconfig", "nvim-telescope/telescope.nvim" },
  config = true,
  keys = {
    {
      "<leader>vs",
      "<cmd>:VenvSelect<cr>",
      -- key mapping for directly retrieve from cache. You may set autocmd if you prefer the no hand approach
      -- "<leader>vs",
      -- "<cmd>:VenvSelectCached<cr>",
    },
  },
}

return M
