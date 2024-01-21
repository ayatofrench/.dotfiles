return {
  install = {
    missing = true,
  },
  change_detection = {
    enabled = false,
    notify = true,
  },
  "tpope/vim-fugitive",

  -- Lodash for nvim
  "nvim-lua/plenary.nvim",
  "nvim-lua/popup.nvim",

  "nvim-lua/lsp_extensions.nvim",
  "simrat39/symbols-outline.nvim",
  -- {
  --   "ray-x/lsp_signature.nvim",
  --   config = function()
  --     require("lsp_signature").setup()
  --   end,
  -- },

  {
    "atusy/leap-ast.nvim",
    branch = "bothside",
  },

  -- "MunifTanjim/prettier.nvim",
  -- "windwp/nvim-ts-autotag",

  "tjdevries/cyclist.vim",

  -- Primeagen packages
  "ThePrimeagen/git-worktree.nvim",
  "ThePrimeagen/refactoring.nvim",

  "mbbill/undotree",

  -- mini nvim modules
  -- {
  --   "echasnovski/mini.starter",
  --   config = function()
  --     require("mini.starter").setup({})
  --   end,
  -- },
  {
    "echasnovski/mini.surround",
    config = function()
      require("mini.surround").setup({})
    end,
  },

  -- Lua

  {
    "folke/which-key.nvim",
    lazy = true,
  },
  -- Colorscheme section

  "ThePrimeagen/vim-be-good",
}
