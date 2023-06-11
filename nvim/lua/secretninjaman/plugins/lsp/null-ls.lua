local null_ls = require("null-ls")
local augroup = vim.api.nvim_create_augroup("LspFormatting", {})
local formatting = null_ls.builtins.formatting
local diagnostics = null_ls.builtins.diagnostics

null_ls.setup({
  root_dir = function()
    return vim.fn.getcwd()
  end,
  sources = {
    formatting.stylua.with({ extra_args = { "--indent-type", "Spaces", "--indent-width", "2" } }),
    formatting.rustfmt,
    formatting.gofmt,
    formatting.goimports,
    formatting.prettier.with({
      extra_args = { "--single-quote", "false" },
    }),
    formatting.rubocop.with({
      command = "bundle",
      args = vim.list_extend({ "exec", "rubocop", "-x" }, formatting.rubocop._opts.args),
      diagnostics.rubocop.with({
        command = "bundle",
        args = vim.list_extend({ "exec", "rubocop", "-l" }, diagnostics.rubocop._opts.args),
      }),
      -- args = function()
      --   local utils = require("null-ls.utils").make_conditional_utils()
      --   -- if utils.root_has_file(".new_rubocop_rules.yml") then
      --     return vim.list_extend(
      --       { "exec", "rubocop", "-c", ".new_rubocop_rules.yml", "--force-exclusion" },
      --       diagnostics.rubocop._opts.args
      --     )
      --   -- else
      --   --   return vim.list_extend({ "exec", "rubocop" }, diagnostics.rubocop._opts.args)
      --   -- end
      -- end,
    }),
    diagnostics.rubocop.with({
      command = "bundle",
      args = vim.list_extend(
        { "exec", "rubocop", "-c", ".new_rubocop_rules.yml", "--force-exclusion" },
        diagnostics.rubocop._opts.args
      ),
    }),
    diagnostics.eslint.with({
      diagnostics_format = "[eslint] #{m}\n(#{c})",
    }),
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
    local wk = require("which-key")
    local default_options = { silent = true }
    wk.register({
      m = {
        f = { "<cmd>lua require('secretninjaman.plugins.lsp.utils').toggle_autoformat()<cr>", "Toggle format on save" },
      },
    }, {
      prefix = "<leader>",
      mode = "n",
      default_options,
    })
    if client.supports_method("textDocument/formatting") then
      vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
      vim.api.nvim_create_autocmd("BufWritePre", {
        group = augroup,
        buffer = bufnr,
        callback = function()
          if AUTOFORMAT_ACTIVE then
            vim.lsp.buf.format({
              bufnr = bufnr,
              timeout = 5000,
            })
          end
        end,
      })
    end
  end,
})

-- prettier.setup {
--   bin = 'prettierd',
--   filetypes = {
--     "css",
--     "javascript",
--     "javascriptreact",
--     "typescript",
--     "typescriptreact",
--     "json",
--     "scss",
--   }
-- }
