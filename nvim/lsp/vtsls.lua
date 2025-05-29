---@type vim.lsp.Config
return {
  cmd = { 'vtsls', '--stdio' },
  filetypes = { 'javascript', 'javascriptreact', 'typescript', 'typescriptreact' },
  settings = {
    vtsls = {
      format = { enable = false },
    },

  }
}
