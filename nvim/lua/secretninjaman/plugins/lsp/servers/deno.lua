local nvim_lsp = require("lspconfig")

local opts = {
  denols = {
    root_dir = nvim_lsp.util.root_pattern("deno.json", "deno.jsonc"),
  },
}

return opts
