local wk = require("which-key")

-- m = {
--   c = { "<cmd>lua require('plugins.lsp.utils').toggle_codeium()<cr>", "Toggle format on save" },
-- },

-- vim.keymap.set("n", "<leader><c-r>", function()
--   require("utils.helpers").copy_relative_path()
-- end)

-- vim.keymap.set("n", "<c-f>", "<cmd>!tmux neww tmux-sessionizer<CR>", { silent = true })

vim.keymap.set("o", "m", "<C-U>lua require('tsht').nodes()<CR>", { silent = true })
vim.keymap.set("x", "m", function()
  require("tsht").nodes()
end, { silent = true, noremap = true })

wk.add({
  {
    group = "Utils",
    {
      "<leader><c-r>",
      function()
        require("utils.helpers").copy_relative_path()
      end,
      desc = "Copy Relative Path",
    },
    {
      "<c-f>",
      "<cmd>!tmux neww tmux-sessionizer<CR>",
      desc = "Open new tmux session",
      silent = true,
    },
    {
      "<leader>ns",
      function()
        require("utils.helpers").new_scratch()
      end,
      desc = "New scratch pad",
    },
  },
  { "<leader>c", group = "code" },
})

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
