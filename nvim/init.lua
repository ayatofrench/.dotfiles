-- Install Lazy.
local lazypath = vim.fn.stdpath 'data' .. '/lazy/lazy.nvim'
if not vim.uv.fs_stat(lazypath) then
  vim.fn.system {
    'git',
    'clone',
    '--filter=blob:none',
    'https://github.com/folke/lazy.nvim.git',
    '--branch=stable',
    lazypath,
  }
end

vim.opt.rtp = vim.opt.rtp ^ lazypath

require "settings"
require "lsp"

-- @type LazySpec
local plugins = 'plugins'

require('lazy').setup(plugins, {
  install = {
    missing = false,
  },
  change_detection = { notify = false },
  rocks = { enabled = false },
  performance = {
    rtp = {
      -- Stuff I don't use.
      disabled_plugins = {
        'gzip',
        'netrwPlugin',
        'rplugin',
        'tarPlugin',
        'tohtml',
        'tutor',
        'zipPlugin',
      },
    },
  },
})


vim.keymap.set("n", "<leader>r", ":update <CR> :source <CR>")

-- vim.pack.add({
--   { src = "https://github.com/sainnhe/gruvbox-material" },
--   { src = "https://github.com/neovim/nvim-lspconfig" },
--   { src = "https://github.com/ibhagwan/fzf-lua" },
--   { src = "https://github.com/echasnovski/mini.nvim" },
-- })

vim.g.gruvbox_material_enable_italic = true
vim.g.gruvbox_material_background = "hard"
vim.g.gruvbox_material_foreground = "original"
vim.g.gruvbox_material_ui_contrast = "high"
vim.cmd.colorscheme("gruvbox-material")


-- require "fzf-lua"

-- require "mini.files".setup()
-- vim.keymap.set('n', "<leader>e", ":lua MiniFiles.open() <CR>")

-- require "mini.pick"
-- require "mini.statusline".setup()

