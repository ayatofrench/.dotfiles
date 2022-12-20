return require("packer").startup(function(use)
  use("wbthomason/packer.nvim")

  use("tpope/vim-fugitive")


  -- Lodash for nvim
  use("nvim-lua/plenary.nvim")
  use("nvim-lua/popup.nvim")
  use("nvim-telescope/telescope.nvim")
  use { "nvim-telescope/telescope-file-browser.nvim" }
  use { 'nvim-telescope/telescope-fzf-native.nvim', run = 'make' }

  use({
    'nvim-lualine/lualine.nvim',
  })

  use {
    "neovim/nvim-lspconfig",
    requires = {
      "williamboman/mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "jose-elias-alvarez/null-ls.nvim",
      "j-hui/fidget.nvim",
    },
  }

  -- Completion framework
  use {
    "hrsh7th/nvim-cmp",
    requires = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-nvim-lua",
      "hrsh7th/cmp-nvim-lsp-signature-help",
      "hrsh7th/cmp-path",
      "hrsh7th/cmp-buffer",
      "saadparwaiz1/cmp_luasnip",
      "L3MON4D3/LuaSnip",
    }
  }

  -- use("tzachar/cmp-tabnine", { run = "./install.sh" })
  use("onsails/lspkind-nvim")
  use("nvim-lua/lsp_extensions.nvim")
  use("glepnir/lspsaga.nvim")
  use("simrat39/symbols-outline.nvim")


  use("MunifTanjim/prettier.nvim")
  use("simrat39/rust-tools.nvim")
  use("windwp/nvim-ts-autotag")
  use("slim-template/vim-slim")

  -- Primeagen packages
  use("ThePrimeagen/git-worktree.nvim")
  use("ThePrimeagen/harpoon")
  use("ThePrimeagen/refactoring.nvim")

  use("mbbill/undotree")

  use("terrortylor/nvim-comment")
  -- Lua

  use {
    "folke/which-key.nvim",
    config = function()
      require("which-key").setup {
        -- your configuration comes here
        -- or leave it empty to use the default settings
        -- refer to the configuration section below
      }
    end
  }
  -- Colorscheme section

  use("gruvbox-community/gruvbox")
  use("folke/tokyonight.nvim")
  use({ "catppuccin/nvim", as = "catppuccin" })
  use({ 'rose-pine/neovim', as = 'rose-pine' })
  use({ "nvim-tree/nvim-web-devicons" })
  use("folke/zen-mode.nvim")

  -- Treesitter
  use("nvim-treesitter/nvim-treesitter", {
    run = ":TSUpdate"
  })
  use { -- Additional text objects via treesitter
    "nvim-treesitter/nvim-treesitter-textobjects",
    after = 'nvim-treesitter',
  }
  use("nvim-treesitter/playground")
  use("romgrk/nvim-treesitter-context")

  use("lewis6991/gitsigns.nvim")


  -- use("mfussenegger/nvim-dap")

  -- use("rcarriga/nvim-dap-ui")

  -- use("theHamsta/nvim-dap-virtual-text")

  use("ThePrimeagen/vim-be-good")
end)
