local settings = require("secretninjaman.settings")

local function colorMyPencils()
  -- local color = settings.theme or "rose-pine"
  local color = "rose-pine"
  vim.cmd.colorscheme(color)
  -- vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
  -- vim.api.nvim_set_hl(0, "NormalFloat", { bg = "none" })
end

local M = {
  {
    "nvim-tree/nvim-web-devicons",
    config = function()
      require("nvim-web-devicons").setup()
    end,
  },
  { "folke/tokyonight.nvim" },
  {
    "rose-pine/neovim",
    priority = 1000,
    lazy = false,
    name = "rose-pine",
    config = function()
      colorMyPencils()
    end,
  },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    -- config = colorMyPencils(),
    -- require("nvim-web-devicons").setup()
    -- vim.cmd.colorscheme("solarized-osaka")
  },
  {
    "gruvbox-community/gruvbox",
    -- priority = 1000,
    name = "gruvbox",
    -- config = function()
    --   -- require("nvim-web-devicons").setup()
    --   -- vim.cmd.colorscheme("gruvbox")
    --   colorMyPencils()
    -- end,
  },
  {
    "craftzdog/solarized-osaka.nvim",
    name = "solarized-osaka",
    -- lazy = false,
    -- priority = 1000,
    -- config = colorMyPencils(),
    --   vim.cmd.colorscheme("solarized-osaka")
    -- end,
  },
}

return M
