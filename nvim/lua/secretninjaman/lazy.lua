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

  {
    "nvim-telescope/telescope-fzf-native.nvim",
    build = "make",
    cond = function()
      return vim.fn.executable("make") == 1
    end,
  },

  -- use("tzachar/cmp-tabnine", { build = "./install.sh" })
  "nvim-lua/lsp_extensions.nvim",
  "glepnir/lspsaga.nvim",
  "simrat39/symbols-outline.nvim",

  {
    "atusy/leap-ast.nvim",
    branch = "bothside",
  },

  -- "MunifTanjim/prettier.nvim",
  -- "windwp/nvim-ts-autotag",
  "slim-template/vim-slim",

  -- Primeagen packages
  "ThePrimeagen/git-worktree.nvim",
  "ThePrimeagen/harpoon",
  "ThePrimeagen/refactoring.nvim",

  "mbbill/undotree",

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
