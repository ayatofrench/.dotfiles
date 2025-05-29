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
require "keymaps"
require "lsp"
require "terminal"

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
