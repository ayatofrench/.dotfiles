local M = {
  "folke/zen-mode.nvim",
  config = function()
    require("zen-mode").setup({
      window = {
        width = 100,
        options = {
          number = true,
          relativenumber = true,
        },
      },
    })

    vim.keymap.set("n", "<leader>zz", function()
      require("zen-mode").toggle()
      vim.wo.wrap = false
      ColorMyPencils()
    end)
  end,
}

return M
