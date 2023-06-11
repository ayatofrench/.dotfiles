local settings = require("secretninjaman.settings")

local M = {
  "jcdickinson/codeium.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "MunifTanjim/nui.nvim",
    "hrsh7th/nvim-cmp",
  },
  config = function()
    require("codeium").setup({})
  end,
  enabled = settings.nvim_workspace == "personal",
  cond = settings.nvim_workspace == "personal",
}

return M
