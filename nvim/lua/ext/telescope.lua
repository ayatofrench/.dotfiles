local data = assert(vim.fn.stdpath("data")) --[[@as string]]

require("telescope").setup({
  extensions = {
    ["zf-native"] = {},
    wrap_results = {},
    history = {
      path = vim.fs.joinpath(data, "telescope_history.sqlite3"),
      limit = 100,
    },
  },
  -- pickers = {
  --   find_files = {
  --     hidden = true,
  --     theme = "dropdown",
  --   },
  -- },
})

pcall(require("telescope").load_extension("zf-native"))
pcall(require("telescope").load_extension("smart_history"))
-- telescope.load_extension("ui-select")

local builtin = require("telescope.builtin")

vim.keymap.set("n", "<leader>fd", builtin.find_files)
vim.keymap.set("n", "<leader>fh", builtin.help_tags)
vim.keymap.set("n", "<leader>fg", builtin.live_grep)
vim.keymap.set("n", "<leader>/", builtin.current_buffer_fuzzy_find)

vim.keymap.set("n", "<space>gw", builtin.grep_string)

vim.keymap.set("n", "<space>en", function()
  builtin.find_files({ cwd = vim.fn.stdpath("config") })
end)