return require("lazy").setup({
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

  -- {
  --   "nvim-telescope/telescope-fzf-native.nvim",
  --   build = "make",
  -- cond = function()
  --   return vim.fn.executable("make") == 1
  -- end,
  -- },

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
  "slim-template/vim-slim",

  "tjdevries/cyclist.vim",

  -- Primeagen packages
  "ThePrimeagen/git-worktree.nvim",
  "ThePrimeagen/harpoon",
  "ThePrimeagen/refactoring.nvim",

  "mbbill/undotree",

  -- mini nvim modules
  {
    "echasnovski/mini.starter",
    config = function()
      require("mini.starter").setup({})
    end,
  },
  {
    "echasnovski/mini.surround",
    config = function()
      require("mini.surround").setup({})
    end,
  },

  -- Lua

  {
    "folke/which-key.nvim",
    config = function()
      require("which-key").setup({
        -- your configuration comes here
        -- or leave it empty to use the default settings
        -- refer to the configuration section below
      })
    end,
  },
  -- Colorscheme section

  "gruvbox-community/gruvbox",
  "folke/tokyonight.nvim",
  { "rose-pine/neovim", name = "rose-pine" },
  { "nvim-tree/nvim-web-devicons" },

  -- "mfussenegger/nvim-dap",

  -- "rcarriga/nvim-dap-ui",

  -- "theHamsta/nvim-dap-virtual-text",

  "ThePrimeagen/vim-be-good",

  { import = "secretninjaman.plugins" },
})
