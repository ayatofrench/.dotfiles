-- local settings = require("secretninjaman.settings")
-- Treesitter Plugin Setup

-- require('nvim-treesitter.configs').setup {
--   autotag = {
--     enable = true,
--   },
--   ensure_installed = "all",
--   sync_install = false,
--   -- highlight = {
--   --   -- enable = true,
--   --   additional_vim_regex_highlighting = false,
--   -- },
--   ident = { enable = true },
--   rainbow = {
--     enable = true,
--     extended_mode = true,
--     max_file_lines = nil,
--   }
-- }

return {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  lazy = false,
  -- event = "BufReadPost",
  dependencies = {
    -- "nvim-treesitter/nvim-treesitter-textobjects",
    -- "RRethy/nvim-treesitter-endwise",
    -- "mfussenegger/nvim-ts-hint-textobject",
    -- "windwp/nvim-ts-autotag",
    -- "romgrk/nvim-treesitter-context",
    -- "nvim-treesitter/playground",
  },
  config = function()
    require("ext.treesitter").setup()
  end,
}
-- {
--   "apple/pkl-neovim",
--   lazy = true,
--   event = {
--     "BufReadPre *.pkl",
--     "BufReadPre *.pcf",
--     "BufReadPre PklProject",
--   },
--   build = function()
--     vim.cmd("TSInstall! pkl")
--   end,
-- },
