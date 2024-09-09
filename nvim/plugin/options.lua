local opt = vim.opt

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

opt.wrap = false

opt.swapfile = false
opt.backup = false
opt.undodir = os.getenv("HOME") .. "/.vim/undodir"
opt.undofile = true

opt.hlsearch = false
opt.incsearch = true

opt.termguicolors = true

opt.scrolloff = 8
-- opt.smoothscroll = true
opt.signcolumn = "yes"
opt.isfname:append("@-@")

-- Give more space for displaying messages.
-- opt.cmdheight = 0

-- g.loaded_netrw = 1
-- g.loaed_netrwPlugin = 1

-- Having longer updatetime (default is 4000 ms = 4 s) leads to noticeable
-- delays and poor user experience.

opt.updatetime = 100

opt.colorcolumn = "100"

opt.clipboard = "unnamedplus"

opt.conceallevel = 2

-- Don't have `o` add a comment
opt.formatoptions:remove("o")
