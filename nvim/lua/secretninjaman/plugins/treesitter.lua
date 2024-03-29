local settings = require("secretninjaman.settings")
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

local M = {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  event = "BufReadPost",
  dependencies = {
    "nvim-treesitter/nvim-treesitter-textobjects",
    "RRethy/nvim-treesitter-endwise",
    "mfussenegger/nvim-ts-hint-textobject",
    "windwp/nvim-ts-autotag",
    "romgrk/nvim-treesitter-context",
    "nvim-treesitter/playground",
  },
  config = function()
    require("nvim-treesitter.configs").setup({
      ensure_installed = settings.treesitter_parsers,
      ignore_install = {}, -- List of parsers to ignore installing
      highlight = {
        enable = true, -- false will disable the whole extension
        disable = {}, -- list of language that will be disabled
        additional_vim_regex_highlighting = { "slim" },
      },
      incremental_selection = {
        enable = true,
        keymaps = {
          init_selection = "<CR>",
          scope_incremental = "<CR>",
          node_incremental = "<TAB>",
          node_decremental = "<S-TAB>",
        },
      },
      endwise = {
        enable = false,
      },
      -- indent = { enable = true },
      autopairs = { enable = true },
      textobjects = {
        select = {
          enable = true,
          -- Automatically jump forward to textobj, similar to targets.vim
          lookahead = true,
          keymaps = {
            -- You can use the capture groups defined in textobjects.scm
            ["af"] = "@function.outer",
            ["if"] = "@function.inner",
            ["ac"] = "@class.outer",
            ["ic"] = "@class.inner",
            ["al"] = "@loop.outer",
            ["il"] = "@loop.inner",
            ["ib"] = "@block.inner",
            ["ab"] = "@block.outer",
            ["ir"] = "@parameter.inner",
            ["ar"] = "@parameter.outer",
          },
        },
      },
    })

    require("nvim-ts-autotag").setup()
  end,
}

return M
