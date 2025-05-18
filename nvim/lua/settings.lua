local opt = vim.opt

vim.g.mapleader = " "
vim.g.maplocalleader = " "

opt.inccommand = "split"
opt.guicursor = ""
opt.number = true
opt.relativenumber = true
opt.errorbells = false
opt.tabstop = 2
opt.softtabstop = 2
opt.shiftwidth = 2
opt.expandtab = true
opt.smartindent = true
opt.wrap = true
opt.linebreak = true
opt.swapfile = false
opt.backup = false
opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
opt.undofile = true
opt.hlsearch = false
opt.incsearch = true
opt.termguicolors = true
opt.scrolloff = 8
opt.signcolumn = "yes"
opt.isfname:append("@-@")
opt.updatetime = 100
opt.colorcolumn = "100"
opt.clipboard = "unnamedplus"
opt.conceallevel = 2
opt.formatoptions:remove("o")
