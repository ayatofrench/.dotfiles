local nvim_lsp = require("lspconfig")

local opts = {
  tsserver = {
    root_dir = nvim_lsp.util.root_pattern("package.json"),
    single_file_support = false,
  },
}

return opts
