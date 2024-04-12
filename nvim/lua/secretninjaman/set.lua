vim.g.mapleader = " "
vim.opt.guicursor = ""

vim.opt.nu = true
vim.opt.relativenumber = true

vim.opt.errorbells = false

vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true

vim.opt.smartindent = true

vim.opt.wrap = false

vim.opt.swapfile = false
vim.opt.backup = false
vim.opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
vim.opt.undofile = true

vim.opt.hlsearch = false
vim.opt.incsearch = true

vim.opt.termguicolors = true

vim.opt.scrolloff = 8
vim.smoothscroll = true
vim.opt.signcolumn = "yes"
vim.opt.isfname:append("@-@")

-- Give more space for displaying messages.
-- vim.opt.cmdheight = 0

-- vim.g.loaded_netrw = 1
-- vim.g.loaed_netrwPlugin = 1

-- Having longer updatetime (default is 4000 ms = 4 s) leads to noticeable
-- delays and poor user experience.

vim.opt.updatetime = 100

-- Don't pass messages to |ins-completion-menu|.

vim.opt.shortmess:append("c")

vim.opt.colorcolumn = "100"

vim.opt.clipboard = "unnamedplus"

vim.opt.conceallevel = 2

-- vim.lsp.set_log_level("trace")
