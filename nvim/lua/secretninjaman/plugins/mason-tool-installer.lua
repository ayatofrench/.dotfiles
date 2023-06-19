local settings = require("secretninjaman.settings")

local M = {
  "WhoIsSethDaniel/mason-tool-installer.nvim",
  event = { "BufReadPre", "BufNewFile" },
  dependencies = {
    "williamboman/mason.nvim",
  },
  config = function()
    -- require("secretninjaman.plugins.lsp.null-ls-mason") -- require your null-ls config here (example below)
    require("mason-tool-installer").setup({
      ensure_install = settings.mason_tools,
    })
  end,
}

return M
