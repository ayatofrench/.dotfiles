local settings = require("secretninjaman.settings")
local utils = require("secretninjaman.plugins.lsp.utils")
local lsp_servers = require("secretninjaman.plugins.lsp.servers")

local nvim_lsp = require("lspconfig")

require("mason").setup()
require("mason-lspconfig").setup({
  ensure_installed = settings.servers,
})

local capabilities = vim.lsp.protocol.make_client_capabilities()

capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)

for _, lsp in ipairs(settings.servers) do
  nvim_lsp[lsp].setup({
    on_attach = function(client, bufnr)
      utils.lsp_on_attach(client, bufnr)
    end,
    -- before_init = function(_, config)
    --   if lsp == "pyright" then
    --     config.settings.python.pythonPath = utils.get_python_path(config.root_dir)
    --   end
    -- end,
    capabilities = capabilities,
    flags = { debounce_text_changes = 150 },
    settings = lsp_servers[lsp],
    -- settings = {
    --   json = languages.json,
    --   Lua = languages.lua,
    --   ltex = languages.ltx,
    --   redhat = { telemetry = { enabled = false } },
    --   texlab = languages.tex,
    --   yaml = languages.yaml,
    -- },
  })
end

require("fidget").setup({})
