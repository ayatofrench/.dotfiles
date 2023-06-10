local M = {
  "jay-babu/mason-null-ls.nvim",
  event = { "BufReadPre", "BufNewFile" },
  dependencies = {
    "williamboman/mason.nvim",
    "jose-elias-alvarez/null-ls.nvim",
  },
  config = function()
    require("secretninjaman.plugins.lsp.null-ls-mason") -- require your null-ls config here (example below)
  end,
}

return M
