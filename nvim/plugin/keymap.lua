local M = {}

local function bind(op, outer_opts)
  outer_opts = vim.tbl_extend("force", { noremap = true, silent = true }, outer_opts or {})

  return function(lhs, rhs, opts)
    opts = vim.tbl_extend("force", outer_opts, opts or {})
    vim.keymap.set(op, lhs, rhs, opts)
  end
end

local wk = require("which-key")

-- m = {
--   c = { "<cmd>lua require('plugins.lsp.utils').toggle_codeium()<cr>", "Toggle format on save" },
-- },

vim.keymap.set("n", "<leader><c-r>", function()
  require("utils.helpers").copy_relative_path()
end)

vim.keymap.set("n", "<c-f>", "<cmd>!tmux neww tmux-sessionizer<CR>", { silent = true })

vim.keymap.set("o", "m", "<C-U>lua require('tsht').nodes()<CR>", { silent = true })
vim.keymap.set("x", "m", function()
  require("tsht").nodes()
end, { silent = true, noremap = true })

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

  -- g = {
  --   name = "+go",
  --   D = { "<cmd>lua vim.lsp.buf.declaration()<CR>", "declaration" },
  --   d = { "<cmd>lua vim.lsp.buf.definition()<CR>", "definition" },
  --   i = { "<cmd>lua vim.lsp.buf.implementation()<CR>", "implementation" },
  --   t = { "<cmd>lua vim.lsp.buf.type_definition()<CR>", "type definition" },
  --   j = { "<cmd>lua vim.diagnostic.goto_next<CR>", "go to next error" },
  --   k = { "<cmd>lua vim.diagnostic.goto_prev<CR>", "go to prev error" },
  -- },

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

    e = { "<cmd>lua vim.diagnostic.open_float()<CR>", "line errors" },

    i = { "<cmd>lua vim.lsp.buf.signature_help()<CR>", "signature_help" },

    l = { "<cmd>Flog<CR>", "git log" },

    q = { "<cmd>copen<CR>", "quickfix list" },

    s = { "<cmd>G<CR>", "git status" },

    t = { "<cmd>TodoTrouble<CR>", "todos" },
  },

  -- run

  r = {

    name = "+run",

    R = { "<cmd>lua require('spectre').open()<CR><bar><cmd>wincmd T<CR>", "search & replace" },

    w = { "<cmd>lua require('spectre').open_visual({select_word=true})<CR><bar><cmd>wincmd T<CR>", "replace word" },
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
    s = { "<cmd>lua require('secretninjaman.utils.helpers').new_scratch()<CR>", "new sractch pad" },
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
