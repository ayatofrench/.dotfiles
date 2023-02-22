local M = {
  "nvim-lualine/lualine.nvim",
  config = function()
    require("lualine").setup({
      options = {
        icons_enanled = false,
      },
    })
  end,
}

return M
