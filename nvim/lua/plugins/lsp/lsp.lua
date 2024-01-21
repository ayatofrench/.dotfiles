local M = {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    {
      "WhoIsSethDaniel/mason-tool-installer.nvim",
      event = { "BufReadPre", "BufNewFile" },
      dependencies = {
        "williamboman/mason.nvim",
      },
    },
    "onsails/lspkind-nvim",
    { "folke/neodev.nvim", config = true },
    -- "j-hui/fidget.nvim",
    "simrat39/inlay-hints.nvim",
  },
  config = function()
    local settings = require("secretninjaman.settings")
    local utils = require("plugins.lsp.utils")
    local lsp_servers = require("plugins.lsp.servers")

    local nvim_lsp = require("lspconfig")
    local inlay = require("inlay-hints")

    require("mason").setup()
    require("mason-lspconfig").setup({
      ensure_installed = settings.lps_servers,
    })
    require("mason-tool-installer").setup({
      ensure_install = settings.mason_tools,
    })

    local capabilities = vim.lsp.protocol.make_client_capabilities()
    capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)

    for _, lsp in ipairs(settings.lps_servers) do
      if lsp == "clangd" then
        capabilities.offsetEncoding = { "utf-16" }
      end

      nvim_lsp[lsp].setup({
        on_attach = function(client, bufnr)
          -- utils.lsp_on_attach(client)

          if lsp == "lua_ls" then
            inlay.on_attach(client, bufnr)
          end
        end,
        before_init = function(_, config)
          -- if lsp == "pyright" then
          --   config.settings.python.pythonPath = utils.get_python_path(config.root_dir)
          -- end
        end,
        capabilities = capabilities,
        flags = { debounce_text_changes = 150 },
        settings = lsp_servers[lsp],
      })
    end

    require("sg").setup({})

    -- require("fidget").setup({})
    require("inlay-hints").setup({
      -- renderer to use
      -- possible options are dynamic, eol, virtline and custom
      -- renderer = "inlay-hints/render/dynamic",
      renderer = "inlay-hints/render/eol",

      hints = {
        parameter = {
          show = true,
          highlight = "whitespace",
        },
        type = {
          show = true,
          highlight = "Whitespace",
        },
      },

      -- Only show inlay hints for the current line
      only_current_line = false,

      eol = {
        -- whether to align to the extreme right or not
        right_align = false,

        -- padding from the right if right_align is true
        right_align_padding = 7,

        parameter = {
          separator = ", ",
          format = function(hints)
            return string.format(" <- (%s)", hints)
          end,
        },

        type = {
          separator = ", ",
          format = function(hints)
            return string.format(" => %s", hints)
          end,
        },
      },
    })
  end,
}

return M
