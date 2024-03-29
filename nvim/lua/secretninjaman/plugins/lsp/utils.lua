M = {}
-- must be global or the initial state is not working
AUTOFORMAT_ACTIVE = true
CODEIUM_ACTIVE = false
-- toggle null-ls's autoformatting
M.toggle_autoformat = function()
  AUTOFORMAT_ACTIVE = not AUTOFORMAT_ACTIVE
  require("secretninjaman.utils.helpers").notify(
    string.format("Autoformatting %s", AUTOFORMAT_ACTIVE and "on" or "off"),
    1,
    "lsp.utils"
  )
end

M.toggle_codeium = function()
  CODEIUM_ACTIVE = not CODEIUM_ACTIVE
  vim.g.codeium_enabled = CODEIUM_ACTIVE
  require("secretninjaman.utils.helpers").notify(
    string.format("Codeium %s", CODEIUM_ACTIVE and "on" or "off"),
    1,
    "lsp.utils"
  )
end

function M.lsp_on_attach(client)
  -- disable formatting for LSP clients as this is handled by null-ls
  -- client.server_capabilities.documentFormattingProvider = false
  -- client.server_capabilities.documentRangeFormattingProvider = false

  -- if client.server_capabilities.signatureHelpProvider then
  --   require("secretninjaman.plugins.lsp.ui.signature").setup(client)
  -- end
end

return M
