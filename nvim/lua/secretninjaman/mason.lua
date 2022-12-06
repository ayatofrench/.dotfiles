local mason = require("mason")
local mason_lsp = require("mason-lspconfig")
local lspconfig = require("lspconfig")
local is_mac = vim.fn.has("macunix") == 1

local lsp = {}
lsp.servers = {
    "bashls",
    "cssls",
    "dockerls",
    "html",
    "jsonls",
    "rust_analyzer",
    "sumneko_lua",
    "tailwindcss",
    "tsserver",
    "yamlls",
}
---
mason.setup()

mason_lsp.setup({
    ensure_installed = lsp.servers,
    automatic_installation = true,
})

lspconfig.sumneko_lua.setup {}

if is_mac then
    lspconfig.solargraph.setup {
        settings = {
            solargraph = {
                commandPath = '/Users/ayato.french/.rvm/gems/ruby-2.5.3/bin/solargraph',
                diagnostics = true,
                completion = true
            }
        },
        root_dir = lspconfig.util.root_pattern("Gemfile", ".git"),
    }
end
-- mason_lsp.setup_handlers({
--   function(server_name)
--     require("lspconfig")[server_name].setup({
--       capabilities = capabilities,
--       on_attach = om.lsp.on_attach,
--     })
--   end,
-- })
