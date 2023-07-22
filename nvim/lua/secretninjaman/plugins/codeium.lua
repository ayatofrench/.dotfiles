local settings = require("secretninjaman.settings")

-- local M = {
--   "jcdickinson/codeium.nvim",
--   dependencies = {
--     "nvim-lua/plenary.nvim", code
--     "MunifTanjim/nui.nvim",
--     "hrsh7th/nvim-cmp",
--   },
--   config = function()
--     require("codeium").setup({})
--   end,
--   enabled = settings.nvim_workspace == "personal",
--   cond = settings.nvim_workspace == "personal",
-- }
--
-- return M

local M = {
  "Exafunction/codeium.vim",
  config = function()
    vim.g.codeium_enabled = CODEIUM_ACTIVE

    vim.keymap.set("i", "<C-g>", function()
      return vim.fn["codeium#Accept"]()
    end, { expr = true })
    vim.keymap.set("i", "<c-;>", function()
      return vim.fn["codeium#CycleCompletions"](1)
    end, { expr = true })
    vim.keymap.set("i", "<c-,>", function()
      return vim.fn["codeium#CycleCompletions"](-1)
    end, { expr = true })
    vim.keymap.set("i", "<c-x>", function()
      return vim.fn["codeium#Clear"]()
    end, { expr = true })
  end,
}

return M
