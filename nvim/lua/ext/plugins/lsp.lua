return {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    "WhoIsSethDaniel/mason-tool-installer.nvim",
    "folke/neodev.nvim",
    "mfussenegger/nvim-jdtls",
    { "j-hui/fidget.nvim", opt = {} },

    "stevearc/conform.nvim",
    "mfussenegger/nvim-lint",

    "simrat39/inlay-hints.nvim", -- Schema information
    "b0o/SchemaStore.nvim",
  },
  config = function()
    require("neodev").setup()

    -- local settings = require("secretninjaman.settings")
    -- local utils = require("plugins.lsp.utils")
    -- local lsp_servers = require("plugins.lsp.servers")

    local lspconfig = require("lspconfig")
    -- local lsp_configs = require("lspconfig.configs")
    -- local inlay = require("inlay-hints")
    -- LSP
    -- "astro",
    -- "clangd",
    -- -- "cmake",
    -- "cssls",
    -- -- "elixirls",
    -- "html",
    -- "jsonls",
    -- "rust_analyzer",
    -- "gopls",
    -- -- "denols",
    -- "tsserver",
    -- -- "denols",
    -- "svelte",
    -- "prismals",
    -- "tailwindcss",
    -- -- "solargraph",
    -- "eslint",
    -- -- "sqlls",
    -- "yamlls",
    -- "taplo",
    -- "vimls",
    -- "ols",
    -- -- Formatter
    -- "black",
    -- "prettier",
    -- "stylua",
    -- Linter
    -- "rubocop",
    -- "eslint_d",
    -- "shellcheck",
    -- "tflint",
    -- "yamllint",

    local servers = {
      astro = true,
      bashls = true,
      gopls = true,
      lua_ls = true,
      rust_analyzer = true,
      svelte = true,
      templ = true,
      cssls = true,
      tsserver = true,
      pyright = true,
      eslint = true,
      html = true,
      tailwindcss = true,
      ols = true,

      jsonls = {
        settings = {
          json = {
            schemas = require("schemastore").json.schemas(),
            validate = { enable = true },
          },
        },
      },

      yamlls = {
        settings = {
          yaml = {
            schemaStore = {
              enable = false,
              url = "",
            },
            schemas = require("schemastore").yaml.schemas(),
          },
        },
      },

      ocamllsp = {
        manual_install = true,
        settings = {
          codelens = { enable = true },
        },

        filetypes = {
          "ocaml",
          "ocaml.interface",
          "ocaml.menhir",
          "ocaml.cram",
        },

        -- TODO: Check if i still need the filtypes stuff i had before
      },

      lexical = {
        filetypes = { "elixir", "eelixir", "heex" },
        cmd = { "/home/aj/.local/share/nvim/mason/bin/lexical", "server" },
        root_dir = require("lspconfig.util").root_pattern({ "mix.exs" }),
      },

      clangd = {
        -- TODO: Could include cmd, but not sure those were all relevant flags.
        --    looks like something i would have added while i was floundering
        init_options = { clangdFileStatus = true },
        filetypes = { "c" },
      },

      zls = {
        manual_install = true,
      },
    }

    local servers_to_install = vim.tbl_filter(function(key)
      local t = servers[key]
      if type(t) == "table" then
        return not t.manual_install
      else
        return t
      end
    end, vim.tbl_keys(servers))

    require("mason").setup()
    local ensure_installed = {
      "stylua",
      "lua_ls",
      "delve",
      "black",
      "ruff",
      "prettierd",
      "eslint_d",
      "jdtls",
    }

    vim.list_extend(ensure_installed, servers_to_install)
    require("mason-tool-installer").setup({
      ensure_install = ensure_installed,
    })

    local capabilities = vim.lsp.protocol.make_client_capabilities()
    capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)

    for name, config in pairs(servers) do
      if config == true then
        config = {}
      end

      if name == "clangd" then
        capabilities.offsetEncoding = { "utf-16" }
      end

      config = vim.tbl_deep_extend("force", {}, {
        capabilities = capabilities,
      }, config)

      lspconfig[name].setup(config)

      -- nvim_lsp[lsp].setup({
      --   on_attach = function(client, bufnr)
      --     -- utils.lsp_on_attach(client)
      --
      --     if lsp == "lua_ls" then
      --       inlay.on_attach(client, bufnr)
      --     end
      --   end,
      --   before_init = function(_, config)
      --     -- if lsp == "pyright" then
      --     --   config.settings.python.pythonPath = utils.get_python_path(config.root_dir)
      --     -- end
      --   end,
      --   capabilities = capabilities,
      --   flags = { debounce_text_changes = 150 },
      --   settings = lsp_servers[lsp],
      -- })
    end

    local disable_semantic_tokens = {
      lua = true,
    }

    vim.api.nvim_create_autocmd("LspAttach", {
      callback = function(args)
        local bufnr = args.buf
        local client = assert(vim.lsp.get_client_by_id(args.data.client_id), "must have valid client")

        vim.opt_local.omnifunc = "v:lua.vim.lsp.omnifunc"
        vim.keymap.set("n", "gd", vim.lsp.buf.definition, { buffer = 0 })
        vim.keymap.set("n", "gr", vim.lsp.buf.references, { buffer = 0 })
        vim.keymap.set("n", "gD", vim.lsp.buf.declaration, { buffer = 0 })
        vim.keymap.set("n", "gT", vim.lsp.buf.type_definition, { buffer = 0 })
        vim.keymap.set("n", "K", vim.lsp.buf.hover, { buffer = 0 })

        vim.keymap.set("n", "<space>cr", vim.lsp.buf.rename, { buffer = 0 })
        vim.keymap.set("n", "<space>ca", vim.lsp.buf.code_action, { buffer = 0 })

        local filetype = vim.bo[bufnr].filetype
        if disable_semantic_tokens[filetype] then
          client.server_capabilities.semanticTokensProvider = nil
        end
      end,
    })

    require("lint").linters_by_ft = {
      javascript = { "eslint_d", "eslint" },
      python = { "ruff" },
    }

    require("conform").setup({
      formatters_by_ft = {
        lua = { "stylua" },
        python = { "ruff_format" },
        javascript = { { "prettierd", "prettier" } },
        typescript = { { "prettierd", "prettier" } },
        typescriptreact = { { "prettierd", "prettier" } },
        astro = { { "prettierd", "prettier" } },
        go = { "gofmt", "goimports" },
        nix = { "alejandra" },
        elixir = { "mix format" },
      },
      formatters = {
        shfmt = {
          prepend_args = { "-i", "2" },
        },
        stylua = {
          prepend_args = { "--indent-type", "Spaces", "--indent-width", "2" },
        },
      },
    })

    vim.api.nvim_create_autocmd("BufWritePre", {
      callback = function(args)
        require("conform").format({
          bufnr = args.buf,
          lsp_fallback = true,
          quiet = true,
        })
      end,
    })

    vim.api.nvim_create_autocmd({ "BufWritePost" }, {
      callback = function()
        require("lint").try_lint()
      end,
    })

    -- local lexical_config = {
    --   cmd = { "/home/aj/dev/lexical/_build/dev/package/lexical/bin/start_lexical.sh" },
    --   settings = {},
    -- }
    --
    -- if not lsp_configs.lexical then
    --   lsp_configs.lexical = {
    --     default_config = {
    --       filetypes = lexical_config.filetypes,
    --       cmd = lexical_config.cmd,
    --       root_dir = function(fname)
    --         return nvim_lsp.util.root_pattern("mix.exs", ".git")(fname) or vim.loop.os_homedir()
    --       end,
    --       -- optional settings
    --       settings = lexical_config.settings,
    --     },
    --   }
    -- end

    -- nvim_lsp.lexical.setup({})

    -- require("sg").setup({})

    -- require("fidget").setup({})
    -- require("inlay-hints").setup({
    --   -- renderer to use
    --   -- possible options are dynamic, eol, virtline and custom
    --   -- renderer = "inlay-hints/render/dynamic",
    --   renderer = "inlay-hints/render/eol",
    --
    --   hints = {
    --     parameter = {
    --       show = true,
    --       highlight = "whitespace",
    --     },
    --     type = {
    --       show = true,
    --       highlight = "Whitespace",
    --     },
    --   },
    --
    --   -- Only show inlay hints for the current line
    --   only_current_line = false,
    --
    --   eol = {
    --     -- whether to align to the extreme right or not
    --     right_align = false,
    --
    --     -- padding from the right if right_align is true
    --     right_align_padding = 7,
    --
    --     parameter = {
    --       separator = ", ",
    --       format = function(hints)
    --         return string.format(" <- (%s)", hints)
    --       end,
    --     },
    --
    --     type = {
    --       separator = ", ",
    --       format = function(hints)
    --         return string.format(" => %s", hints)
    --       end,
    --     },
    --   },
    -- })
  end,
}