local settings = require("secretninjaman.settings")

require("mason-null-ls").setup({
  ensure_installed = settings.null_ls_tools,
  automatic_installation = false,
  handlers = {},
})
