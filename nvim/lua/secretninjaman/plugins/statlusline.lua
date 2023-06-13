local M = {
  "nvim-lualine/lualine.nvim",
  config = function()
    require("lualine").setup({
      options = {
        -- icons_enabled = false,
        theme = "auto",
      },
    })
  end,
}

return M
