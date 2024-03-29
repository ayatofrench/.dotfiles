local M = {}

local function bind(op, outer_opts)
  outer_opts = outer_opts or { noremap = true }
  return function(lhs, rhs, opts)
    opts = vim.tbl_extend("force", outer_opts, opts or {})
    vim.keymap.set(op, lhs, rhs, opts)
  end
end

local wk = require("which-key")
local cmp = require("cmp")
t = require("telescope.builtin")
t_ext = require("telescope").extensions
-- h_mark = require("harpoon.mark")
-- h_ui = require("harpoon.ui")

vim.keymap.set("o", "m", "<C-U>lua require('tsht').nodes()<CR>", { silent = true })
vim.keymap.set("x", "m", function()
  require("tsht").nodes()
end, { silent = true, noremap = true })

-- Normal mode, no <leader> prefix

wk.register({
  ["gd"] = { "<cmd>lua vim.lsp.buf.definition()<CR>", "go to definition" },
  -- ["<C-e>"] = { "<cmd>lua h_ui.toggle_quick_menu()<CR>", "harpoon ui toggle" },
  -- ["<C-j>"] = { "<cmd>lua h_ui.nav_file(1)<CR>", "harpoon ui toggle" },
  -- ["<C-k>"] = { "<cmd>lua h_ui.nav_file(2)<CR>", "harpoon ui toggle" },
  -- ["<C-l>"] = { "<cmd>lua h_ui.nav_file(3)<CR>", "harpoon ui toggle" },
  -- ["<C-;>"] = { "<cmd>lua h_ui.nav_file(4)<CR>", "harpoon ui toggle" },
})

-- Normal mode, <leader> prefix

wk.register({
  -- ignored keys
  ["1"] = "which_key_ignore",
  ["2"] = "which_key_ignore",
  ["3"] = "which_key_ignore",
  ["4"] = "which_key_ignore",
  ["5"] = "which_key_ignore",
  ["6"] = "which_key_ignore",
  ["7"] = "which_key_ignore",
  ["8"] = "which_key_ignore",
  ["9"] = "which_key_ignore",

  ["<cr>"] = { "<cmd>Ttoggle<CR>", "toggle terminal" },

  -- a = { "<cmd>lua h_mark.add_file()<CR>", "add file to harpoon" },
  -- c = {
  --   name = "+create",
  --   t = { "<cmd>tabnew<cr>", "new tab" },
  -- },

  c = {
    name = "copy",
    r = { "<cmd>lua require('secretninjaman.utils.helpers').copy_relative_path()<CR>", "copy relative path" },
  },

  -- open

  o = {
    name = "+open",
    f = { "<cmd>lua t.find_files()<CR>", "file" },
    e = { "<cmd>lua t_ext.file_browser.file_browser()<CR>", "file explorer" },
    r = { "<cmd>lua t.oldfiles()<CR>", "recent" },
    b = { "<cmd>lua t.buffers()<CR>", "buffer" },
    p = { "<cmd>Telescope project<CR>", "project" },
    gb = { "<cmd>lua t.git_branches()<CR>", "git branch" },

    gc = { "<cmd>lua t.git_commits()<CR>", "git commit" },
  },

  -- find

  f = {

    name = "+find",

    f = { "<cmd>lua t.current_buffer_fuzzy_find()<CR>", "in file" },
    -- for syntax documentation see https://docs.rs/regex/1.5.4/regex/#syntax
    d = { "<cmd>lua t.live_grep()<CR>", "in directory" },
    w = { "<cmd>lua t.grep_string()<CR>", "word" },
    s = { "<cmd>lua t.lsp_document_symbols()<CR>", "document symbols" },
    S = { "<cmd>lua t.lsp_workspace_symbols()<CR>", "workspace symbols" },
    q = { "<cmd>lua t.quickfix()<CR>", "in quickfix list" },
    h = { "<cmd>lua t.help_tags()<CR>", "in help" },
    r = { "<cmd>lua t.lsp_references()<CR>", "references" },
    t = { "<cmd>lua t_ext.todo.todo()<CR>", "todos" },
  },

  m = {
    c = { "<cmd>lua require('secretninjaman.plugins.lsp.utils').toggle_codeium()<cr>", "Toggle format on save" },
  },

  -- window

  w = {

    name = "+window",

    h = { "<cmd>vsplit<CR>", "split left" },

    j = { "<cmd>split<bar>wincmd j<CR>", "split down" },

    k = { "<cmd>split<CR>", "split up" },

    l = { "<cmd>vsplit<bar>wincmd l<CR>", "split right" },

    p = { "<cmd>lua require('nvim-window').pick()<CR>", "pick window" },

    r = { "<cmd>WinResizerStartResize<CR>", "resize mode" },

    e = { "<cmd>wincmd =<CR>", "equalize size" },

    m = { "<cmd>WinShift<CR>", "toggle window move mode" },

    s = { "<cmd>WinShift swap<CR>", "toggle window swap mode" },

    z = { "<cmd>ZenMode<CR>", "toggle zen mode" },

    t = { "<cmd>wincmd T<CR>", "breakout into new tab" },
  },

  -- quit

  q = {

    name = "+quit",

    w = { "<cmd>q<CR>", "window" },

    W = { "<cmd>wincmd o<CR>", "all other windows" },

    b = { "<cmd>Bdelete<CR>", "buffer" },

    B = { "<cmd>BufOnly!<CR>", "all other buffers" },

    q = { "<cmd>cclose<CR>", "quickfix list" },
  },

  -- go

  g = {
    name = "+go",
    D = { "<cmd>lua vim.lsp.buf.declaration()<CR>", "declaration" },
    d = { "<cmd>lua vim.lsp.buf.definition()<CR>", "definition" },
    i = { "<cmd>lua vim.lsp.buf.implementation()<CR>", "implementation" },
    t = { "<cmd>lua vim.lsp.buf.type_definition()<CR>", "type definition" },
    j = { "<cmd>lua vim.diagnostic.goto_next<CR>", "go to next error" },
    k = { "<cmd>lua vim.diagnostic.goto_prev<CR>", "go to prev error" },
  },

  -- show

  s = {

    name = "+show",

    E = { "<cmd>Trouble workspace_diagnostics<CR>", "workspace errors" },

    c = { "<cmd>lua t_ext.neoclip.default()<CR>", "clipboard" },

    d = {

      function()
        require("gitsigns.actions").diffthis()

        vim.cmd("windo set foldcolumn=0")
      end,

      "git diff",
    },

    D = { "<cmd>NeoTreeShow<CR>", "directory buffer" },

    e = { "<cmd>lua vim.diagnostic.open_float()<CR>", "line errors" },

    h = { "<cmd>lua vim.lsp.buf.hover()<CR>", "hover" },

    i = { "<cmd>lua vim.lsp.buf.signature_help()<CR>", "signature_help" },

    l = { "<cmd>Flog<CR>", "git log" },

    q = { "<cmd>copen<CR>", "quickfix list" },

    s = { "<cmd>G<CR>", "git status" },

    t = { "<cmd>TodoTrouble<CR>", "todos" },

    r = { "<cmd>lua vim.lsp.buf.references()<CR>", "lsp references" },
  },

  -- run

  r = {

    name = "+run",

    R = { "<cmd>lua require('spectre').open()<CR><bar><cmd>wincmd T<CR>", "search & replace" },

    w = { "<cmd>lua require('spectre').open_visual({select_word=true})<CR><bar><cmd>wincmd T<CR>", "replace word" },

    a = { "<cmd>lua vim.lsp.buf.code_action()<CR>", "code action" },

    r = { "<cmd>lua vim.lsp.buf.rename()<CR>", "rename" },
  },

  -- terminal

  t = {

    name = "+terminal",

    c = { "<cmd>T clear<CR>", "clear" },
  },

  -- diff

  d = {

    name = "+diff",

    g = { "<cmd>diffget<cr>", "get" },

    p = { "<cmd>diffput<cr>", "put" },
  },

  -- next

  n = {

    name = "+next",

    e = { "<cmd>silent lua vim.lsp.diagnostic.goto_next()<cr>", "error" },

    q = { "<cmd>cnext<cr>", "quickfix item" },

    t = { "<cmd>lua require('trouble').next({skip_groups = true, jump = true})<cr>", "trouble" },

    c = { "<cmd>lua require('gitsigns.actions').next_hunk()<CR>", "change" },
  },

  -- previous

  p = {
    name = "+previous",
    e = { "<cmd>silent lua vim.lsp.diagnostic.goto_prev()<cr>", "error" },
    q = { "<cmd>cprevious<cr>", "quickfix item" },
    t = { "<cmd>lua require('trouble').previous({skip_groups = true, jump = true})<cr>", "trouble" },
    c = { "<cmd>lua require('gitsigns.actions').prev_hunk()<CR>", "change" },
  },
}, { prefix = "<leader>" })

-- visual mode, <leader> prefix

wk.register({
  d = {
    name = "+diff",
    g = { "<cmd>'<,'>diffget<cr>", "get" },
    p = { "<cmd>'<,'>diffput<cr>", "put" },
  },
}, { prefix = "<leader>", mode = "v" })

local augroup = vim.api.nvim_create_augroup
local autocmd = vim.api.nvim_create_autocmd
local yank_group = augroup("HighlightYank", {})

autocmd("TextYankPost", {
  group = yank_group,
  pattern = "*",
  callback = function()
    vim.highlight.on_yank({
      higroup = "IncSearch",
      timeout = 40,
    })
  end,
})

return M
