local mason = require("mason")
local mason_lsp = require("mason-lspconfig")
local lspconfig = require("lspconfig")
local null_ls = require("null-ls")
local prettier = require("prettier")
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

lspconfig.sumneko_lua.setup {
  settings = {
    Lua = {
      runtime = {
        -- Tell the language server which version of Lua you're using (most likely LuaJIT in the case of Neovim)
        version = "LuaJIT",
        -- Setup your lua path
        path = vim.split(package.path, ";"),
      },
      diagnostics = {
        -- Get the language server to recognize the `vim` global
        globals = { "vim" },
      },
      workspace = {
        -- Make the server aware of Neovim runtime files
        library = {
          [vim.fn.expand("$VIMRUNTIME/lua")] = true,
          [vim.fn.expand("$VIMRUNTIME/lua/vim/lsp")] = true,
        },
      },
    },
  },
}

lspconfig.tsserver.setup {}

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

local augroup = vim.api.nvim_create_augroup("LspFormatting", {})
null_ls.setup({
  sources = {
    null_ls.builtins.diagnostics.eslint.with({
      diagnostics_format = '[eslint] #{m}\n(#{c})'
    }),
    null_ls.builtins.diagnostics.fish
  },
  on_attach = function(client, bufnr)
    vim.notify("null-ls attached", vim.log.levels.INFO)
    if client.supports_method("textDocument/formatting") then
      vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
      vim.api.nvim_create_autocmd("BufWritePre", {
        group = augroup,
        buffer = bufnr,
        callback = function()
          -- on 0.8, you should use vim.lsp.buf.format({ bufnr = bufnr }) instead
          vim.lsp.buf.formatting_sync()
        end,
      })
    end
  end,
})

prettier.setup {
  bin = 'prettierd',
  filetypes = {
    "css",
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "json",
    "scss",
  }
}
