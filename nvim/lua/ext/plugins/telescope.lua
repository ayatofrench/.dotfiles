local M = {
  "nvim-telescope/telescope.nvim",
  -- cmd = "Telescope",
  -- version = "*",
  dependencies = {
    -- "nvim-telescope/telescope-file-browser.nvim",
    -- "nvim-telescope/telescope-fzf-native.nvim",
    "natecraddock/telescope-zf-native.nvim",
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope-ui-select.nvim",
    "nvim-telescope/telescope-smart-history.nvim",
    "kkharji/sqlite.lua",
  },
  config = function()
    require("ext.telescope")
  end,
}

return M
