local M = {
  "ggandor/leap.nvim",
  dependencies = {
    "atusy/leap-ast.nvim",
  },
  config = function()
    require("leap").add_default_mappings(true)
    vim.keymap.set({ "n", "x", "o" }, "<leader>j", function()
      require("leap-ast").leap()
    end, {})
  end,
}

return M
