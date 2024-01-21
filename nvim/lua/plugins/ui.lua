return {
  {
    "nvim-lualine/lualine.nvim",
    config = function()
      require("lualine").setup({
        options = {
          -- icons_enabled = false,
          theme = "auto",
        },
      })
    end,
  },
  {
    "folke/zen-mode.nvim",
    config = function()
      require("zen-mode").setup({
        window = {
          width = 120,
          options = {
            number = true,
            relativenumber = true,
          },
        },
      })

      vim.keymap.set("n", "<leader>zz", function()
        require("zen-mode").toggle()
        vim.wo.wrap = false
        -- ColorMyPencils()
      end)
    end,
  },
}
