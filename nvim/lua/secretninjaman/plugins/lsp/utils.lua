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
  require("secretninjaman.utils.helpers").notify(
    string.format("Autoformatting %s", CODEIUM_ACTIVE and "on" or "off"),
    1,
    "lsp.utils"
  )
end

function M.lsp_on_attach(client)
  -- disable formatting for LSP clients as this is handled by null-ls
  client.server_capabilities.documentFormattingProvider = false
  client.server_capabilities.documentRangeFormattingProvider = false
end

return M
