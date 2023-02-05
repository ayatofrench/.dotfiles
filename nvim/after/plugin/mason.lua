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
  "gopls",
  "sumneko_lua",
  "svelte",
  "tailwindcss",
  "tsserver",
  "yamlls",
  "zls",
}
---
mason.setup()

mason_lsp.setup({
  ensure_installed = lsp.servers,
  automatic_installation = true,
})

local capabilities = require("cmp_nvim_lsp").default_capabilities(
  vim.lsp.protocol.make_client_capabilities()
)

local function on_attach(client)
  if client.server_capabilities.documentFormattingProvider then
    vim.api.nvim_create_autocmd("BufWritePre", {
      buffer = 0,
      callback = function()
        vim.lsp.buf.format()
      end,
    })
  end
end

local function config(_config)
  return vim.tbl_deep_extend("force", {
    capabilities = capabilities,
    on_attach = on_attach,
  },
    _config or {}
  )
end

lspconfig.sumneko_lua.setup(config({
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
}))

lspconfig.tsserver.setup(config())

lspconfig.gopls.setup(config())

lspconfig.svelte.setup(config())

lspconfig.zls.setup(config())

lspconfig.solargraph.setup(config({
  settings = {
    solargraph = {
      commandPath = '/Users/ayato.french/.rvm/gems/ruby-2.5.3/bin/solargraph',
      diagnostics = true,
      completion = true,
      flags = {
        debounce_text_changes = 150
      },
      initializationOptions = {
        formatting = true
      }
    }
  },
  root_dir = lspconfig.util.root_pattern("Gemfile", ".git"),
}))

local formatting = null_ls.builtins.formatting
local diagnostics = null_ls.builtins.diagnostics
local conditional = function(fn)
  local utils = require("null-ls.utils").make_conditional_utils()
  return fn(utils)
end

local augroup = vim.api.nvim_create_augroup("LspFormatting", {})
null_ls.setup({
  root_dir = function()
    return vim.fn.getcwd()
  end,
  sources = {
    diagnostics.eslint.with({
      diagnostics_format = '[eslint] #{m}\n(#{c})'
    }),
    -- formatting.rubocop.with({
    --   command = "bundle",
    --   args = vim.list_extend(
    --     { "exec", "rubocop", "-c", ".new_rubocop_rules.yml", "--force-exclusion" },
    --     formatting.rubocop._opts.args
    --   ),
    -- }),
    null_ls.builtins.diagnostics.rubocop.with({
      command = "bundle",
      args = vim.list_extend(
        { "exec", "rubocop", "-c", ".new_rubocop_rules.yml", "--force-exclusion" },
        null_ls.builtins.diagnostics.rubocop._opts.args
      ),
    })
  },

  -- Here we set a conditional to call the rubocop formatter. If we have a Gemfile in the project, we call "bundle exec rubocop", if not we only call "rubocop".
  -- conditional(function(utils)
  --   vim.notify(utils.root_has_file("Gemfile"), vim.log.levels.INFO)
  --   return utils.root_has_file("Gemfile")
  --       and formatting.rubocop.with({
  --         command = "bundle",
  --         args = vim.list_extend(
  --           { "exec", "rubocop" },
  --           formatting.rubocop._opts.args
  --         ),
  --       })
  --       or formatting.rubocop
  -- end),

  -- Same as above, but with diagnostics.rubocop to make sure we use the proper rubocop version for the project
  -- conditional(function(utils)
  --   return utils.root_has_file("Gemfile")
  --       and null_ls.builtins.diagnostics.rubocop.with({
  --         command = "bundle",
  --         args = vim.list_extend(
  --           { "exec", "rubocop" },
  --           null_ls.builtins.diagnostics.rubocop._opts.args
  --         ),
  --       })
  --       or null_ls.builtins.diagnostics.rubocop
  -- end),

  on_attach = function(client, bufnr)
    vim.notify("null-ls attached", vim.log.levels.INFO)
    if client.supports_method("textDocument/formatting") then
      vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
      vim.api.nvim_create_autocmd("BufWritePre", {
        group = augroup,
        buffer = bufnr,
        callback = function()
          vim.lsp.buf.format({
            bufnr = bufnr,
            timeout = 5000
          })
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

require("fidget").setup {}
