local M = {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    -- "jose-elias-alvarez/null-ls.nvim",
    "onsails/lspkind-nvim",
    { "folke/neodev.nvim", config = true },
    "j-hui/fidget.nvim",
    "simrat39/inlay-hints.nvim",
  },
  config = function()
    require("secretninjaman.plugins.lsp.lsp")
  end,
}

return M
