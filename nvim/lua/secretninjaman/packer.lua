return require("packer").startup(function(use)
    use("wbthomason/packer.nvim")

    -- Simple plugins can be specified as strings
    -- use("tpope/vim-fugitive")


    -- Lodash for nvim
    use("nvim-lua/plenary.nvim")
    use("nvim-lua/popup.nvim")
    use("nvim-telescope/telescope.nvim")
    use { "nvim-telescope/telescope-file-browser.nvim" }
    use { 'nvim-telescope/telescope-fzf-native.nvim', run = 'make' }

    use({
        'nvim-lualine/lualine.nvim',
    })



    use("neovim/nvim-lspconfig")

    use("jose-elias-alvarez/null-ls.nvim")
    use("williamboman/mason.nvim")
    use("williamboman/mason-lspconfig.nvim")

    -- Completion framework
    use("hrsh7th/nvim-cmp")

    -- LSP completion
    use("hrsh7th/cmp-nvim-lsp")

    use("hrsh7th/cmp-nvim-lua")
    use("hrsh7th/cmp-nvim-lsp-signature-help")
    use("hrsh7th/cmp-path")
    use("hrsh7th/cmp-buffer")

    -- use("tzachar/cmp-tabnine", { run = "./install.sh" })
    use("onsails/lspkind-nvim")
    use("nvim-lua/lsp_extensions.nvim")
    use("glepnir/lspsaga.nvim")
    use("simrat39/symbols-outline.nvim")
    use("L3MON4D3/LuaSnip")
    use("saadparwaiz1/cmp_luasnip")
    use("MunifTanjim/prettier.nvim")
    use("simrat39/rust-tools.nvim")
    use("windwp/nvim-ts-autotag")
    use("slim-template/vim-slim")

    -- Primeagen packages
    use("ThePrimeagen/git-worktree.nvim")
    use("ThePrimeagen/harpoon")
    use("ThePrimeagen/refactoring.nvim")

    use("mbbill/undotree")

    -- use {
    --     'nvim-tree/nvim-tree.lua',
    --     requires = {
    --         'nvim-tree/nvim-web-devicons', -- optional, for file icons
    --     },
    --     tag = 'nightly' -- optional, updated every week. (see issue #1193)
    -- }

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
    -- packer.nvim
    use { 'smithbm2316/centerpad.nvim' }

    use("nvim-treesitter/nvim-treesitter", {
        run = ":TSUpdate"
    })
    use("nvim-treesitter/playground")
    use("romgrk/nvim-treesitter-context")


    -- use("mfussenegger/nvim-dap")

    -- use("rcarriga/nvim-dap-ui")

    -- use("theHamsta/nvim-dap-virtual-text")

    use("ThePrimeagen/vim-be-good")
end)
