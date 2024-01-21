local settings = require("secretninjaman.settings")
local lsp = require("plugins.lsp.lsp")
local formatter = require("plugins.lsp.formatter")
local linter = require("plugins.lsp.linter")

return {
  {
    "simrat39/rust-tools.nvim",
    opts = {
      server = {
        on_attach = function(_, bufnr)
          -- Hover actions
          vim.keymap.set("n", "<C-space>", require("rust-tools").hover_actions.hover_actions, { buffer = bufnr })
          -- Code action groups
          -- vim.keymap.set("n", "<Leader>a", rt.code_action_group.code_action_group, { buffer = bufnr })
        end,
      },
    },
    -- config = function()
    --   local rt = require("rust-tools")
    --
    --   rt.setup({
    --     server = {
    --       on_attach = function(_, bufnr) end,
    --     },
    --   })
    -- end,
  },
  lsp,
  formatter,
  linter,
}
